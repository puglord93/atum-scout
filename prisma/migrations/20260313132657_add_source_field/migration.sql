-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_researchers" (
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
    "source" TEXT NOT NULL DEFAULT 'excel_import',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_researchers" ("affiliation", "c_score", "category", "citations", "contact_date", "contacted", "contacted_by", "created_at", "domain_tags", "email", "full_name", "global_rank", "h_index", "id", "note_on_research", "origin", "subfield", "tier", "updated_at") SELECT "affiliation", "c_score", "category", "citations", "contact_date", "contacted", "contacted_by", "created_at", "domain_tags", "email", "full_name", "global_rank", "h_index", "id", "note_on_research", "origin", "subfield", "tier", "updated_at" FROM "researchers";
DROP TABLE "researchers";
ALTER TABLE "new_researchers" RENAME TO "researchers";
CREATE TABLE "new_tech_offers" (
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
    "source" TEXT NOT NULL DEFAULT 'excel_import',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_tech_offers" ("atum_pursue", "commercialization_path", "created_at", "description", "id", "institution", "likely_pi", "notes", "quality_tier", "sector", "tech_id", "technology", "trl", "updated_at", "use_case", "venture_potential", "vs_existing") SELECT "atum_pursue", "commercialization_path", "created_at", "description", "id", "institution", "likely_pi", "notes", "quality_tier", "sector", "tech_id", "technology", "trl", "updated_at", "use_case", "venture_potential", "vs_existing" FROM "tech_offers";
DROP TABLE "tech_offers";
ALTER TABLE "new_tech_offers" RENAME TO "tech_offers";
CREATE UNIQUE INDEX "tech_offers_tech_id_key" ON "tech_offers"("tech_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
