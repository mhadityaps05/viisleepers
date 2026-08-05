CREATE TABLE "ReturnRequest" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "orderItems" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReturnRequest_email_idx" ON "ReturnRequest"("email");
CREATE INDEX "ReturnRequest_orderNumber_idx" ON "ReturnRequest"("orderNumber");
CREATE INDEX "ReturnRequest_status_idx" ON "ReturnRequest"("status");
CREATE INDEX "ReturnRequest_createdAt_idx" ON "ReturnRequest"("createdAt");