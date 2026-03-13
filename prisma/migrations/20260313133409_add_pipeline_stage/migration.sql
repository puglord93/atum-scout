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
    "stage" TEXT NOT NULL DEFAULT 'identified',
    "source" TEXT NOT NULL DEFAULT 'excel_import',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_researchers" ("affiliation", "c_score", "category", "citations", "contact_date", "contacted", "contacted_by", "created_at", "domain_tags", "email", "full_name", "global_rank", "h_index", "id", "note_on_research", "origin", "source", "subfield", "tier", "updated_at") SELECT "affiliation", "c_score", "category", "citations", "contact_date", "contacted", "contacted_by", "created_at", "domain_tags", "email", "full_name", "global_rank", "h_index", "id", "note_on_research", "origin", "source", "subfield", "tier", "updated_at" FROM "researchers";
DROP TABLE "researchers";
ALTER TABLE "new_researchers" RENAME TO "researchers";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Data migration: map existing contacted researchers to 'reached_out' stage
UPDATE "researchers" SET "stage" = 'reached_out' WHERE "contacted" = 1;
