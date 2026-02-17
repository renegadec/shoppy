-- CreateTable
CREATE TABLE "PaymentMethodSetting" (
  "key" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "note" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PaymentMethodSetting_pkey" PRIMARY KEY ("key")
);

