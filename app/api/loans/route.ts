import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");
    const userId = searchParams.get("userId");

    if (!walletAddress && !userId) {
      return Response.json(
        {
          success: false,
          error: "walletAddress or userId is required",
        },
        { status: 400 }
      );
    }

    // Find user by wallet address
    let user;
    if (walletAddress) {
      user = await prisma.user.findUnique({
        where: { walletAddress },
      });
    } else if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!user) {
      return Response.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Fetch all loans
    const allLoans = await prisma.loan.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        borrower: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            reputation: true,
          },
        },
        lender: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            reputation: true,
          },
        },
      },
    });

    console.log(`[API /loans] Found ${allLoans.length} total loans in database`);
    console.log(`[API /loans] User ID: ${user.id}`);

    // Fetch loans where user is borrower
    const borrowedLoans = await prisma.loan.findMany({
      where: {
        borrowerId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        borrower: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            reputation: true,
          },
        },
        lender: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            reputation: true,
          },
        },
      },
    });

    // Fetch loans where user is lender
    const lentLoans = await prisma.loan.findMany({
      where: {
        lenderId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        borrower: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            reputation: true,
          },
        },
        lender: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            reputation: true,
          },
        },
      },
    });

    console.log(`[API /loans] Returning ${allLoans.length} loans in response`);

    return Response.json({
      success: true,
      allLoans: allLoans,
      borrowedLoans: borrowedLoans,
      lentLoans: lentLoans,
      totalBorrowed: borrowedLoans.length,
      totalLent: lentLoans.length,
    });
  } catch (error) {
    console.error("[API /loans] Error fetching loans:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch loans",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
