-- CreateTable
CREATE TABLE "NoteFile" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileExtension" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "pageCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NoteFile_noteId_idx" ON "NoteFile"("noteId");

-- AddForeignKey
ALTER TABLE "NoteFile" ADD CONSTRAINT "NoteFile_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing Note.fileUrl to NoteFile (backward compatibility)
INSERT INTO "NoteFile" ("id", "noteId", "fileUrl", "fileName", "fileExtension", "sortOrder", "pageCount", "createdAt")
SELECT 
    gen_random_uuid()::text,
    n.id,
    n."fileUrl",
    'legacy-note.' || COALESCE(NULLIF(n."fileExtension", ''), 'pdf'),
    COALESCE(NULLIF(n."fileExtension", ''), 'pdf'),
    0,
    n."pageCount",
    n."createdAt"
FROM "Note" n
WHERE n."deletedAt" IS NULL AND n."fileUrl" IS NOT NULL AND n."fileUrl" != '';
