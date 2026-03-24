-- Global Faculty (no universityId); User/Note academic FKs; Note indexes

ALTER TABLE "User" ADD COLUMN "universityId" TEXT;
ALTER TABLE "User" ADD COLUMN "facultyId" TEXT;
ALTER TABLE "User" ADD COLUMN "departmentId" TEXT;

ALTER TABLE "Note" ADD COLUMN "universityId" TEXT;
ALTER TABLE "Note" ADD COLUMN "facultyId" TEXT;
ALTER TABLE "Note" ADD COLUMN "departmentId" TEXT;

DELETE FROM "Department";
DELETE FROM "Faculty";

ALTER TABLE "Faculty" DROP CONSTRAINT "Faculty_universityId_fkey";
ALTER TABLE "Faculty" DROP COLUMN "universityId";

CREATE UNIQUE INDEX "Faculty_name_key" ON "Faculty"("name");

CREATE UNIQUE INDEX "Department_facultyId_name_key" ON "Department"("facultyId", "name");

ALTER TABLE "User" ADD CONSTRAINT "User_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Note" ADD CONSTRAINT "Note_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Note_universityId_departmentId_idx" ON "Note"("universityId", "departmentId");
CREATE INDEX "Note_departmentId_idx" ON "Note"("departmentId");
CREATE INDEX "Note_facultyId_idx" ON "Note"("facultyId");
