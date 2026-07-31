-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "courier" TEXT,
ADD COLUMN     "orderStatus" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN     "trackingNumber" TEXT;
