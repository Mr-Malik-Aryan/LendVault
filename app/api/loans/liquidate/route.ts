import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanId, lenderAddress, txHash } = body;

    // Validate required fields
    if (!loanId) {
      return Response.json(
        { success: false, error: "Loan ID is required" },
        { status: 400 }
      );
    }

    if (!lenderAddress) {
      return Response.json(
        { success: false, error: "Lender address is required" },
        { status: 400 }
      );
    }

    if (!txHash) {
      return Response.json(
        { success: false, error: "Transaction hash is required" },
        { status: 400 }
      );
    }

    // Find the loan
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        borrower: true,
        lender: true,
      },
    });

    if (!loan) {
      return Response.json(
        { success: false, error: "Loan not found" },
        { status: 404 }
      );
    }

    // Verify loan is funded
    if (loan.status !== "FUNDED") {
      return Response.json(
        { success: false, error: "Only funded loans can be liquidated" },
        { status: 400 }
      );
    }

    // Verify loan is overdue
    const now = new Date();
    const dueDate = new Date(loan.dueDate);
    if (now <= dueDate) {
      return Response.json(
        { success: false, error: "Loan is not yet overdue" },
        { status: 400 }
      );
    }

    // Verify the lender matches
    if (loan.lender?.walletAddress.toLowerCase() !== lenderAddress.toLowerCase()) {
      return Response.json(
        { success: false, error: "Only the lender can liquidate this loan" },
        { status: 403 }
      );
    }

    console.log("Liquidating loan:", {
      loanId: loan.id,
      borrower: loan.borrower.walletAddress,
      lender: lenderAddress,
      amount: loan.amount,
      dueDate: loan.dueDate,
      txHash: txHash,
    });

    // Update loan status to LIQUIDATED
    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: "LIQUIDATED",
        liquidatedAt: new Date(),
      },
      include: {
        borrower: true,
        lender: true,
      },
    });

    // Create a transaction record for the liquidation
    await prisma.transaction.create({
      data: {
        loanId: loan.id,
        type: "LIQUIDATION",
        amount: loan.amount,
        txHash: txHash,
        blockNumber: 0, // Will be updated by blockchain listener if needed
        timestamp: new Date(),
      },
    });

    console.log("Loan liquidated successfully:", {
      loanId: updatedLoan.id,
      borrower: updatedLoan.borrower.walletAddress,
      lender: lenderAddress,
      liquidatedAt: updatedLoan.liquidatedAt,
    });

    return Response.json({
      success: true,
      message: "Loan liquidated successfully",
      loan: {
        id: updatedLoan.id,
        status: updatedLoan.status,
        liquidatedAt: updatedLoan.liquidatedAt,
        borrower: {
          username: updatedLoan.borrower.username,
          walletAddress: updatedLoan.borrower.walletAddress,
        },
        lender: updatedLoan.lender
          ? {
              username: updatedLoan.lender.username,
              walletAddress: updatedLoan.lender.walletAddress,
            }
          : null,
        collateralType: updatedLoan.collateralType,
        collateralId: updatedLoan.collateralId,
        amount: updatedLoan.amount,
      },
    });
  } catch (error) {
    console.error("Error liquidating loan:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to liquidate loan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
