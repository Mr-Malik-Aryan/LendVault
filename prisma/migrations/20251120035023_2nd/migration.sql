-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "ltvRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.8;

-- CreateIndex
CREATE INDEX "Loan_borrowerId_idx" ON "Loan"("borrowerId");

-- CreateIndex
CREATE INDEX "Loan_lenderId_idx" ON "Loan"("lenderId");

-- CreateIndex
CREATE INDEX "Loan_status_idx" ON "Loan"("status");
