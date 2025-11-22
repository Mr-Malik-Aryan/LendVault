import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get total loans count
    const totalLoans = await prisma.loan.count();

    // Get total loans issued in Wei
    const allLoans = await prisma.loan.findMany({
      select: {
        amount: true,
        status: true,
      },
    });

    const totalLoansIssuedWei = allLoans.reduce((sum, loan) => {
      if (loan.status === "FUNDED" || loan.status === "REPAID") {
        return sum + BigInt(loan.amount);
      }
      return sum;
    }, BigInt(0));

    // Get unique borrowers count
    const uniqueBorrowers = await prisma.user.count({
      where: {
        loans: {
          some: {},
        },
      },
    });

    // Get total collateralized NFTs (same as total loans)
    const totalNFTs = await prisma.loan.count();

    // Calculate average interest rate
    const loansWithInterest = await prisma.loan.findMany({
      select: {
        interestRate: true,
      },
    });

    const avgInterestRate = loansWithInterest.length > 0
      ? loansWithInterest.reduce((sum, loan) => sum + parseFloat(loan.interestRate), 0) / loansWithInterest.length / 100
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalLoansIssuedWei: totalLoansIssuedWei.toString(),
        totalLoans,
        uniqueBorrowers,
        totalNFTs,
        avgInterestRate: avgInterestRate.toFixed(1),
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
