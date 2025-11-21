-- AlterEnum
ALTER TYPE "LoanStatus" ADD VALUE 'FUNDED';

-- AlterTable
ALTER TABLE "Collateral" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "collateralImageUrl" TEXT,
ADD COLUMN     "loanId" TEXT,
ADD COLUMN     "offerId" TEXT,
ADD COLUMN     "repaymentTxHash" TEXT;
