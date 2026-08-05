ALTER TABLE "Order"
ADD COLUMN "paymentSessionStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "midtransToken" TEXT,
ADD COLUMN "midtransRedirectUrl" TEXT;