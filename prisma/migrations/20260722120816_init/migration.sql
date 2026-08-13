-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "filePublicId" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "burnAfterRead" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "isBurned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_pin_idx" ON "Note"("pin");

-- CreateIndex
CREATE INDEX "Note_expiresAt_idx" ON "Note"("expiresAt");
