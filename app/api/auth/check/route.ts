import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return Response.json(
        { authenticated: false },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (user) {
      return Response.json({
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          walletAddress: user.walletAddress,
        },
      });
    } else {
      return Response.json({ authenticated: false });
    }
  } catch (error) {
    console.error("Error checking authentication:", error);
    return Response.json(
      { error: "Failed to check authentication" },
      { status: 500 }
    );
  }
}
