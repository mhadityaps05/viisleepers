/*
  Warnings:

  - Added the required column `buyerEmail` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerName` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketTypeId` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "buyerEmail" TEXT NOT NULL,
ADD COLUMN     "buyerName" TEXT NOT NULL,
ADD COLUMN     "ticketTypeId" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Valid';

-- CreateIndex
CREATE INDEX "Ticket_ticketTypeId_idx" ON "Ticket"("ticketTypeId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
