-- CreateTable
CREATE TABLE "researchers" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "affiliation" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "h_index" INTEGER NOT NULL,
    "citations" INTEGER NOT NULL,
    "c_score" DOUBLE PRECISION NOT NULL,
    "global_rank" INTEGER,
    "domain_tags" TEXT,
    "subfield" TEXT,
    "category" TEXT NOT NULL,
    "note_on_research" TEXT,
    "origin" TEXT NOT NULL,
    "contacted" BOOLEAN NOT NULL DEFAULT false,
    "contact_date" TEXT,
    "contacted_by" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'identified',
    "source" TEXT NOT NULL DEFAULT 'excel_import',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "researchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "researcher_notes" (
    "id" SERIAL NOT NULL,
    "researcher_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "researcher_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tech_offers" (
    "id" SERIAL NOT NULL,
    "tech_id" TEXT NOT NULL,
    "technology" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "trl" TEXT,
    "sector" TEXT,
    "venture_potential" TEXT,
    "description" TEXT,
    "use_case" TEXT,
    "vs_existing" TEXT,
    "commercialization_path" TEXT,
    "atum_pursue" TEXT,
    "likely_pi" TEXT,
    "quality_tier" TEXT,
    "notes" TEXT,
    "ai_score_market_size" INTEGER,
    "ai_score_ip_moat" INTEGER,
    "ai_score_trl_trajectory" INTEGER,
    "ai_score_atum_fit" INTEGER,
    "ai_rationale_market_size" TEXT,
    "ai_rationale_ip_moat" TEXT,
    "ai_rationale_trl_trajectory" TEXT,
    "ai_rationale_atum_fit" TEXT,
    "ai_summary" TEXT,
    "ai_scored_at" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'excel_import',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tech_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tech_offers_tech_id_key" ON "tech_offers"("tech_id");

-- AddForeignKey
ALTER TABLE "researcher_notes" ADD CONSTRAINT "researcher_notes_researcher_id_fkey" FOREIGN KEY ("researcher_id") REFERENCES "researchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
