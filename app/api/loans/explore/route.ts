import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get("userId");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const minInterestRate = searchParams.get("minInterestRate");
    const maxInterestRate = searchParams.get("maxInterestRate");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const status = searchParams.get("status") || "ACTIVE";

    // Build where clause
    const where: any = {
      status: status as any,
      // Exclude loans where lender is already assigned (unless it's open for investment)
      lenderId: {
        not: currentUserId || undefined,
      },
    };

    // Add interest rate filters
    if (minInterestRate || maxInterestRate) {
      where.interestRate = {};
      if (minInterestRate) {
        where.interestRate.gte = minInterestRate;
      }
      if (maxInterestRate) {
        where.interestRate.lte = maxInterestRate;
      }
    }

    // Add amount filters
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount.gte = minAmount;
      }
      if (maxAmount) {
        where.amount.lte = maxAmount;
      }
    }

    // Build order by
    const orderBy: any = {};
    if (sortBy === "interestRate") {
      orderBy.interestRate = sortOrder;
    } else if (sortBy === "amount") {
      orderBy.amount = sortOrder;
    } else if (sortBy === "duration") {
      orderBy.duration = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Fetch loans
    const loans = await prisma.loan.findMany({
      where,
      orderBy,
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

    // Add computed fields
    const loansWithMetadata = loans.map((loan) => {
      const amountInEth = parseFloat(loan.amount) / 1e18;
      const interestRatePercent = parseFloat(loan.interestRate) / 100;
      const durationInDays = loan.duration / 86400;
      const totalReturn = amountInEth * (1 + (interestRatePercent / 100) * (durationInDays / 365));
      const profit = totalReturn - amountInEth;
      
      return {
        ...loan,
        amountInEth,
        interestRatePercent,
        durationInDays,
        totalReturn,
        profit,
        isOwnLoan: loan.borrowerId === currentUserId,
      };
    });

    return Response.json({
      success: true,
      loans: loansWithMetadata,
      total: loansWithMetadata.length,
    });
  } catch (error) {
    console.error("Error fetching loans for explore:", error);
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
