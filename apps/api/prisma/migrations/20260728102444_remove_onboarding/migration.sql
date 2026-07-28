/*
  Warnings:

  - You are about to drop the `onboarding_checklists` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `onboarding_tasks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "onboarding_checklists" DROP CONSTRAINT "onboarding_checklists_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "onboarding_tasks" DROP CONSTRAINT "onboarding_tasks_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "onboarding_tasks" DROP CONSTRAINT "onboarding_tasks_onboardingChecklistId_fkey";

-- DropTable
DROP TABLE "onboarding_checklists";

-- DropTable
DROP TABLE "onboarding_tasks";

-- DropEnum
DROP TYPE "OnboardingTaskStatus";
