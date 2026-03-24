-- Drop legacy likes
DROP TABLE IF EXISTS "Like";

-- CreateEnum
CREATE TYPE "NoteLetterGrade" AS ENUM ('AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF');

-- CreateTable
CREATE TABLE "NoteGrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "grade" "NoteLetterGrade" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteGrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NoteGrade_userId_noteId_key" ON "NoteGrade"("userId", "noteId");

-- CreateIndex
CREATE INDEX "NoteGrade_noteId_idx" ON "NoteGrade"("noteId");

-- AddForeignKey
ALTER TABLE "NoteGrade" ADD CONSTRAINT "NoteGrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteGrade" ADD CONSTRAINT "NoteGrade_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
