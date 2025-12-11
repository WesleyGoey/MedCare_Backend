-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'DONE', 'MISSED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "age" INTEGER NOT NULL,
    "settingId" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "alarmSound" VARCHAR(100) NOT NULL DEFAULT 'Default',
    "notificationSound" VARCHAR(100) NOT NULL DEFAULT 'Default',

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "dosage" VARCHAR(50) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL,
    "notes" TEXT,
    "image" VARCHAR(255),

    CONSTRAINT "medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" SERIAL NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "scheduleType" "ScheduleType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_details" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "time" TIME NOT NULL,
    "dayOfWeek" INTEGER,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "schedule_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "history" (
    "id" SERIAL NOT NULL,
    "detailId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeTaken" TIMESTAMP(3),

    CONSTRAINT "history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_settingId_key" ON "users"("settingId");

-- CreateIndex
CREATE INDEX "users_settingId_idx" ON "users"("settingId");

-- CreateIndex
CREATE INDEX "medicine_userId_idx" ON "medicine"("userId");

-- CreateIndex
CREATE INDEX "schedules_medicineId_idx" ON "schedules"("medicineId");

-- CreateIndex
CREATE INDEX "schedule_details_scheduleId_idx" ON "schedule_details"("scheduleId");

-- CreateIndex
CREATE INDEX "history_detailId_idx" ON "history"("detailId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES "settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine" ADD CONSTRAINT "medicine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_details" ADD CONSTRAINT "schedule_details_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "history" ADD CONSTRAINT "history_detailId_fkey" FOREIGN KEY ("detailId") REFERENCES "schedule_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
