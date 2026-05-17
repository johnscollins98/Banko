-- CreateTable
CREATE TABLE "IgnoredTransactionMatch" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "currentTransactionId" TEXT NOT NULL,
    "previousTransactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IgnoredTransactionMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IgnoredTransactionMatch_userId_currentTransactionId_previou_key" ON "IgnoredTransactionMatch"("userId", "currentTransactionId", "previousTransactionId");

-- AddForeignKey
ALTER TABLE "IgnoredTransactionMatch" ADD CONSTRAINT "IgnoredTransactionMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
