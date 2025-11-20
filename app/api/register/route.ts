import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, walletAddress } = body;

    if (!username || !walletAddress) {
      return Response.json(
        { error: 'Username and wallet address are required.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { walletAddress: walletAddress }
        ]
      }
    });

    if (existingUser) {
      return Response.json(
        { error: 'Username or wallet address already in use.' },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        username,
        walletAddress,
      },
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return Response.json(
      { error: 'Failed to create user. Please try again.' },
      { status: 500 }
    );
  }
}