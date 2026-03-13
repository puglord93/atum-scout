-- AlterTable
ALTER TABLE "tech_offers" ADD COLUMN "ai_rationale_atum_fit" TEXT;
ALTER TABLE "tech_offers" ADD COLUMN "ai_rationale_ip_moat" TEXT;
ALTER TABLE "tech_offers" ADD COLUMN "ai_rationale_market_size" TEXT;
ALTER TABLE "tech_offers" ADD COLUMN "ai_rationale_trl_trajectory" TEXT;
ALTER TABLE "tech_offers" ADD COLUMN "ai_score_atum_fit" INTEGER;
ALTER TABLE "tech_offers" ADD COLUMN "ai_score_ip_moat" INTEGER;
ALTER TABLE "tech_offers" ADD COLUMN "ai_score_market_size" INTEGER;
ALTER TABLE "tech_offers" ADD COLUMN "ai_score_trl_trajectory" INTEGER;
ALTER TABLE "tech_offers" ADD COLUMN "ai_scored_at" DATETIME;
ALTER TABLE "tech_offers" ADD COLUMN "ai_summary" TEXT;
