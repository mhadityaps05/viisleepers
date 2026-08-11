-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "destinationAreaId" TEXT,
ADD COLUMN     "estimatedDelivery" TEXT,
ADD COLUMN     "shippingCourier" TEXT,
ADD COLUMN     "shippingService" TEXT;
