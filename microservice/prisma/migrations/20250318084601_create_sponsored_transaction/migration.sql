-- CreateEnum
CREATE TYPE "SponsoredTransactionStatus" AS ENUM ('PENDING', 'PENDING_STX', 'PENDING_SPONSORED', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "SponsoredTransaction" (
    "id" UUID NOT NULL,
    "stacksAddress" VARCHAR(255) NOT NULL,
    "suiAddress" VARCHAR(255) NOT NULL,
    "sbtcAmount" VARCHAR(20) NOT NULL,
    "status" "SponsoredTransactionStatus" NOT NULL,
    "originalTransaction" BYTEA NOT NULL,
    "stxTransactionHash" VARCHAR(66),
    "sponsoredTransactionHash" VARCHAR(66),
    "retry" SMALLINT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SponsoredTransaction_pkey" PRIMARY KEY ("id")
);
