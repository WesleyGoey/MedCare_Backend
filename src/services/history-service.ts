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

  // ✅ FIXED: Week range now starts from Monday (UTC)
  private static getWeekRange() {
    const now = new Date();
    
    // ✅ Get today in UTC midnight
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    
    const dayOfWeek = todayUTC.getUTCDay(); // 0 (Sun) - 6 (Sat)
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startOfWeek = new Date(todayUTC);
    startOfWeek.setUTCDate(todayUTC.getUTCDate() - daysToMonday);
    startOfWeek.setUTCHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
    endOfWeek.setUTCHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  }

  // ✅ FIXED: Validate date using UTC
  private static validateIsToday(dateStr?: string): Date {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    let inputDate: Date;
    if (dateStr) {
      inputDate = new Date(dateStr);
      if (isNaN(inputDate.getTime())) {
        throw new ResponseError(400, "Invalid date format");
      }
    } else {
      inputDate = todayUTC;
    }

    // ✅ Normalize input to UTC midnight
    const inputUTC = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate(), 0, 0, 0, 0));

    if (inputUTC.getTime() !== todayUTC.getTime()) {
      throw new ResponseError(400, "Aksi hanya dapat dilakukan di hari ini");
    }

    return inputUTC;
  }

  private static extractLocalTime(timeValue: Date): { hours: number; minutes: number } {
    const hours = timeValue.getUTCHours();
    const minutes = timeValue.getUTCMinutes();
    return { hours, minutes };
  }

  // ✅ Helper: Get UTC date for today
  private static getTodayUTC(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  }

  static async getAllHistory(user: UserJWTPayload) {
    const histories = await prismaClient.history.findMany({
      where: this.getBaseQuery(user.id),
      include: {
        detail: {
          include: {
            schedule: {
              include: {
                medicine: true
              }
            }
          }
        }
      },
      orderBy: { date: "desc" },
    });
    return histories.map(toHistoryResponse);
  }

  static async getWeeklyComplianceStatsTotal(user: UserJWTPayload): Promise<number> {
    const { startOfWeek, endOfWeek } = this.getWeekRange();

    const weekFilter: Prisma.HistoryWhereInput = {
      ...this.getBaseQuery(user.id),
      date: {
        gte: startOfWeek,
        lte: endOfWeek
      }
    };

    const total = await prismaClient.history.count({ where: weekFilter });
    if (total === 0) return 0;
    const completed = await prismaClient.history.count({ where: { ...weekFilter, status: "DONE" } });
    const complianceRate = (completed / total) * 100;
    return Math.round(complianceRate * 100) / 100;
  }

  static async getWeeklyMissedDose(user: UserJWTPayload): Promise<number> {
    const { startOfWeek, endOfWeek } = this.getWeekRange();

    return await prismaClient.history.count({
      where: {
        ...this.getBaseQuery(user.id),
        date: {
          gte: startOfWeek,
          lte: endOfWeek
        },
        status: "MISSED"
      }
    });
  }

  static async getWeeklyComplianceStats(user: UserJWTPayload) {
    const { startOfWeek, endOfWeek } = this.getWeekRange();

    const histories = await prismaClient.history.findMany({
      where: {
        ...this.getBaseQuery(user.id),
        date: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      include: {
        detail: {
          include: {
            schedule: {
              include: { medicine: true }
            }
          }
        }
      },
      orderBy: { date: 'asc' }
    });
    
    return histories.map(toHistoryResponse);
  }

  static async getRecentActivity(user: UserJWTPayload) {
    const histories = await prismaClient.history.findMany({
      where: {
        ...this.getBaseQuery(user.id),
        status: { in: ["DONE", "MISSED"] }
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        detail: {
          include: {
            schedule: {
              include: { medicine: true }
            }
          }
        }
      }
    });
    return histories.map(toHistoryResponse);
  }

  static async markDetailAsTaken(
      user: UserJWTPayload,
      detailId: number,
      dateStr?: string,
      timeTakenStr?: string
  ): Promise<string> {
      // ✅ Use UTC validation
      const validatedDate = this.validateIsToday(dateStr);

      const detail = await prismaClient.scheduleDetail.findFirst({
          where: { id: detailId },
          include: { schedule: { include: { medicine: true } } },
      })
      if (!detail || (detail as any).schedule?.medicine?.userId !== user.id) {
          throw new ResponseError(404, "Schedule detail not found")
      }

      let timeTaken: Date;
      if (timeTakenStr) {
          timeTaken = new Date(timeTakenStr);
          if (isNaN(timeTaken.getTime())) {
              throw new ResponseError(400, "Invalid timeTaken format");
          }
      } else {
          timeTaken = new Date(); // Current UTC time
      }

      await prismaClient.$transaction(async (tx) => {
        await tx.history.upsert({
          where: { detailId_date: { detailId, date: validatedDate } },
          update: { timeTaken, status: "DONE" },
          create: { detailId, date: validatedDate, timeTaken, status: "DONE" },
        });

        await tx.medicine.update({
          where: { id: detail.schedule.medicineId },
          data: { stock: { decrement: 1 } }
        });
      });

      return "Marked as taken";
  }

  static async skipDetail(
      user: UserJWTPayload,
      detailId: number,
      dateStr?: string
  ): Promise<string> {
      const validatedDate = this.validateIsToday(dateStr);
      
      const detail = await prismaClient.scheduleDetail.findFirst({
          where: { id: detailId, schedule: { medicine: { userId: user.id } } },
      })
      if (!detail) throw new ResponseError(404, "Schedule detail not found")

      await prismaClient.history.upsert({
        where: { detailId_date: { detailId, date: validatedDate } },
        update: { timeTaken: null, status: "MISSED" },
        create: { detailId, date: validatedDate, timeTaken: null, status: "MISSED" },
      })

      return "Marked as missed for this occurrence"
  }

  static async undoMarkAsTaken(
      user: UserJWTPayload,
      detailId: number,
      dateStr?: string
  ): Promise<string> {
      const validatedDate = this.validateIsToday(dateStr);

      const detail = await prismaClient.scheduleDetail.findFirst({
          where: { id: detailId },
          include: { schedule: { include: { medicine: true } } },
      })
      if (!detail || (detail as any).schedule?.medicine?.userId !== user.id) {
          throw new ResponseError(404, "Schedule detail not found")
      }

      const hist = await prismaClient.history.findFirst({ 
        where: { detailId, date: validatedDate } 
      });
      if (!hist) throw new ResponseError(404, "No history to undo");

      const { hours, minutes } = this.extractLocalTime(detail.time as Date);

      // ✅ Build scheduled datetime in UTC
      const scheduledDateTime = new Date(validatedDate);
      scheduledDateTime.setUTCHours(hours, minutes, 0, 0);

      const now = new Date();
      const newStatus: "MISSED" | "PENDING" = now > scheduledDateTime ? "MISSED" : "PENDING";

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