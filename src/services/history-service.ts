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

  private static getWeekRange() {
    const today = new Date();
    
    const dayOfWeek = today.getDay();
    
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  }

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
      where: this.getBaseQuery(user.id),
      take: 5,
      orderBy: { date: 'desc' },
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
      const validatedDate = this.validateIsToday(dateStr);

      const detail = await prismaClient.scheduleDetail.findFirst({
          where: { id: detailId },
          include: { schedule: { include: { medicine: true } } },
      })
      if (!detail || (detail as any).schedule?.medicine?.userId !== user.id) {
          throw new ResponseError(404, "Schedule detail not found")
      }

      const dayStart = new Date(validatedDate);
      dayStart.setHours(0, 0, 0, 0);

      let timeTaken: Date;
      if (timeTakenStr) {
          const parsed = new Date(timeTakenStr);
          timeTaken = isNaN(parsed.getTime())
              ? new Date(`${dayStart.toISOString().substr(0, 10)}T${timeTakenStr}:00Z`)
              : parsed;
      } else {
          timeTaken = new Date();
      }

      await prismaClient.history.upsert({
        where: { detailId_date: { detailId, date: dayStart } },
        update: { timeTaken, status: "DONE" },
        create: { detailId, date: dayStart, timeTaken, status: "DONE" },
      });

      return "Marked as taken";
  }

  static async skipDetail(
      user: UserJWTPayload,
      detailId: number,
      dateStr?: string
  ): Promise<string> {
      const detail = await prismaClient.scheduleDetail.findFirst({
          where: { id: detailId, schedule: { medicine: { userId: user.id } } },
      })
      if (!detail) throw new ResponseError(404, "Schedule detail not found")

      const date = dateStr ? new Date(dateStr) : new Date()
      if (isNaN(date.getTime())) throw new ResponseError(400, "Invalid date")
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)

      await prismaClient.history.upsert({
        where: { detailId_date: { detailId, date: dayStart } },
        update: { timeTaken: null, status: "MISSED" },
        create: { detailId, date: dayStart, timeTaken: null, status: "MISSED" },
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

      const dayStart = new Date(validatedDate);
      dayStart.setHours(0, 0, 0, 0);

      const hist = await prismaClient.history.findFirst({ 
        where: { detailId, date: dayStart } 
      });
      if (!hist) throw new ResponseError(404, "No history to undo");

      const scheduledTime = detail.time as Date;
      const scheduleHours = scheduledTime.getUTCHours();
      const scheduleMinutes = scheduledTime.getUTCMinutes();

      const scheduledDateTime = new Date(validatedDate);
      scheduledDateTime.setHours(scheduleHours, scheduleMinutes, 0, 0);

      const now = new Date();

      const newStatus: "MISSED" | "PENDING" = now > scheduledDateTime ? "MISSED" : "PENDING";

      await prismaClient.history.update({
        where: { id: hist.id },
        data: { status: newStatus, timeTaken: null },
      });

      return "Undo successful";
  }
}