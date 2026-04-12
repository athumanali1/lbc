-- AlterEnum
ALTER TYPE "Role" RENAME TO "Role_old";

CREATE TYPE "Role" AS ENUM('MEMBER', 'CHAIRMAN', 'CHAIRLADY', 'TREASURER', 'SECRETARY');

-- Update existing users to MEMBER role
UPDATE "users" SET role = 'MEMBER'::"Role" WHERE role IS NOT NULL;

-- Drop old enum
DROP TYPE "Role_old";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gender" "Gender";
