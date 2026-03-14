-- CreateTable
CREATE TABLE "researcher_notes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "researcher_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "researcher_notes_researcher_id_fkey" FOREIGN KEY ("researcher_id") REFERENCES "researchers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
