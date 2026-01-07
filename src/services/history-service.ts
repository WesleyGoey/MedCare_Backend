import { prismaClient } from "../utils/database-util";
import { toHistoryResponse } from "../models/history-model";
import { UserJWTPayload } from "../models/user-model";
import { Prisma } from "../../generated/prisma";
import { ResponseError } from "../error/response-error";

export class HistoryService {
  private static getBaseQuery(userId: number): Prisma.HistoryWhereInput {
    return {
      detail: {
        schedule: {
          medicine: {
            userId: userId
          }
        }
      }
    };
  }

  // ✅ Mencari rentang Senin - Minggu
  // ✅ Revisi GetWeekRange di HistoryService.ts
private static getWeekRange() {
  const now = new Date();
  // Buat objek date yang merepresentasikan hari ini jam 00:00 local
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
  
  // Hitung selisih ke hari Senin
  // Jika hari ini Minggu (0), selisihnya 6 hari ke belakang.
  // Jika hari lain, selisihnya (dayOfWeek - 1).
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - daysToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
}

  // ✅ Validasi agar aksi hanya bisa dilakukan di hari ini
  private static validateIsToday(dateStr?: string): Date {
    const inputDate = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(inputDate.getTime())) {
      throw new ResponseError(400, "Invalid date format");
    }

    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const inputDateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

    if (inputDateOnly.getTime() !== todayDateOnly.getTime()) {
      throw new ResponseError(400, "Aksi hanya dapat dilakukan di hari ini");
    }

    return inputDate;
  }

  private static extractLocalTime(timeValue: Date): { hours: number; minutes: number } {
    const hours = timeValue.getUTCHours();
    const minutes = timeValue.getUTCMinutes();
    return { hours, minutes };
  }

  static async getAllHistory(user: UserJWTPayload) {
    const histories = await prismaClient.history.findMany({
      where: this.getBaseQuery(user.id),
      include: {
        detail: { include: { schedule: { include: { medicine: true } } } }
      },
      orderBy: { date: "desc" },
    });
    return histories.map(toHistoryResponse);
  }

  static async getWeeklyComplianceStatsTotal(user: UserJWTPayload): Promise<number> {
    const { startOfWeek, endOfWeek } = this.getWeekRange();
    const weekFilter: Prisma.HistoryWhereInput = {
      ...this.getBaseQuery(user.id),
      date: { gte: startOfWeek, lte: endOfWeek }
    };

    const total = await prismaClient.history.count({ where: weekFilter });
    if (total === 0) return 0;
    const completed = await prismaClient.history.count({ where: { ...weekFilter, status: "DONE" } });
    return Math.round((completed / total) * 100 * 100) / 100;
  }

  static async getWeeklyMissedDose(user: UserJWTPayload): Promise<number> {
    const { startOfWeek, endOfWeek } = this.getWeekRange();
    return await prismaClient.history.count({
      where: {
        ...this.getBaseQuery(user.id),
        date: { gte: startOfWeek, lte: endOfWeek },
        status: "MISSED"
      }
    });
  }

  static async getWeeklyComplianceStats(user: UserJWTPayload) {
    const { startOfWeek, endOfWeek } = this.getWeekRange();
    const histories = await prismaClient.history.findMany({
      where: {
        ...this.getBaseQuery(user.id),
        date: { gte: startOfWeek, lte: endOfWeek }
      },
      include: {
        detail: { include: { schedule: { include: { medicine: true } } } }
      },
      orderBy: { date: 'asc' }
    });
    return histories.map(toHistoryResponse);
  }

  // ✅ Revisi getRecentActivity di HistoryService.ts
static async getRecentActivity(user: UserJWTPayload) {
    return await prismaClient.history.findMany({
      where: {
        ...this.getBaseQuery(user.id),
        status: { in: ["DONE", "MISSED"] } // ✅ Hanya DONE/MISSED
      },
      take: 5,
      orderBy: { updatedAt: 'desc' }, // ✅ Error hilang setelah migrate
      include: {
        detail: { include: { schedule: { include: { medicine: true } } } }
      }
    }).then(histories => histories.map(toHistoryResponse));
  }

  static async markDetailAsTaken(user: UserJWTPayload, detailId: number, dateStr?: string, timeTakenStr?: string): Promise<string> {
    const validatedDate = this.validateIsToday(dateStr);
    const detail = await prismaClient.scheduleDetail.findFirst({
      where: { id: detailId },
      include: { schedule: { include: { medicine: true } } },
    });

    if (!detail || (detail as any).schedule?.medicine?.userId !== user.id) {
      throw new ResponseError(404, "Schedule detail not found");
    }

    const dayStart = new Date(validatedDate);
    dayStart.setHours(0, 0, 0, 0);

    let timeTaken: Date;
    if (timeTakenStr) {
      const parsed = new Date(timeTakenStr);
      timeTaken = isNaN(parsed.getTime()) ? new Date(`${dayStart.toISOString().substr(0, 10)}T${timeTakenStr}:00Z`) : parsed;
    } else {
      timeTaken = new Date();
    }

    // ✅ Transaction: History & Stock Update
    await prismaClient.$transaction(async (tx) => {
      await tx.history.upsert({
        where: { detailId_date: { detailId, date: dayStart } },
        update: { timeTaken, status: "DONE" },
        create: { detailId, date: dayStart, timeTaken, status: "DONE" },
      });

      await tx.medicine.update({
        where: { id: detail.schedule.medicineId },
        data: { stock: { decrement: 1 } }
      });
    });

    return "Marked as taken";
  }

  static async skipDetail(user: UserJWTPayload, detailId: number, dateStr?: string): Promise<string> {
    this.validateIsToday(dateStr);
    const detail = await prismaClient.scheduleDetail.findFirst({
      where: { id: detailId, schedule: { medicine: { userId: user.id } } },
    });
    if (!detail) throw new ResponseError(404, "Schedule detail not found");

    const date = dateStr ? new Date(dateStr) : new Date();
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    await prismaClient.history.upsert({
      where: { detailId_date: { detailId, date: dayStart } },
      update: { timeTaken: null, status: "MISSED" },
      create: { detailId, date: dayStart, timeTaken: null, status: "MISSED" },
    });

    return "Marked as missed for this occurrence";
  }

  static async undoMarkAsTaken(user: UserJWTPayload, detailId: number, dateStr?: string): Promise<string> {
    const validatedDate = this.validateIsToday(dateStr);
    const detail = await prismaClient.scheduleDetail.findFirst({
      where: { id: detailId },
      include: { schedule: { include: { medicine: true } } },
    });

    if (!detail || (detail as any).schedule?.medicine?.userId !== user.id) {
      throw new ResponseError(404, "Schedule detail not found");
    }

    const dayStart = new Date(validatedDate);
    dayStart.setHours(0, 0, 0, 0);

    const hist = await prismaClient.history.findFirst({ where: { detailId, date: dayStart } });
    if (!hist) throw new ResponseError(404, "No history to undo");

    const { hours, minutes } = this.extractLocalTime(detail.time as Date);
    const scheduledDateTime = new Date(validatedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);
    const now = new Date();
    const newStatus: "MISSED" | "PENDING" = now > scheduledDateTime ? "MISSED" : "PENDING";

    // ✅ Transaction: History Update & Restock
    await prismaClient.$transaction(async (tx) => {
      if (hist.status === "DONE") {
        await tx.medicine.update({
          where: { id: detail.schedule.medicineId },
          data: { stock: { increment: 1 } }
        });
      }
      await tx.history.update({
        where: { id: hist.id },
        data: { status: newStatus, timeTaken: null },
      });
    });

    return "Undo successful, stock restored";
  }
}