-- CreateTable
CREATE TABLE "researchers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "affiliation" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "h_index" INTEGER NOT NULL,
    "citations" INTEGER NOT NULL,
    "c_score" REAL NOT NULL,
    "global_rank" INTEGER,
    "domain_tags" TEXT,
    "subfield" TEXT,
    "category" TEXT NOT NULL,
    "note_on_research" TEXT,
    "origin" TEXT NOT NULL,
    "contacted" BOOLEAN NOT NULL DEFAULT false,
    "contact_date" TEXT,
    "contacted_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tech_offers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "tech_offers_tech_id_key" ON "tech_offers"("tech_id");
