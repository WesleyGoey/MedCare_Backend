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
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() - today.getDay() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
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

  // Return only compliance rate (number)
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

  // Mark detail as taken
  static async markDetailAsTaken(
      user: UserJWTPayload,
      detailId: number,
      dateStr?: string,
      timeTakenStr?: string
  ): Promise<string> {
      const detail = await prismaClient.scheduleDetail.findFirst({
          where: { id: detailId },
          include: { schedule: { include: { medicine: true } } },
      })
      if (!detail || (detail as any).schedule?.medicine?.userId !== user.id) {
          throw new ResponseError(404, "Schedule detail not found")
      }

      const date = dateStr ? new Date(dateStr) : new Date()
      if (isNaN(date.getTime())) throw new ResponseError(400, "Invalid date")
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)

      let timeTaken: Date
      if (timeTakenStr) {
          const parsed = new Date(timeTakenStr)
          timeTaken = isNaN(parsed.getTime())
              ? new Date(`${dayStart.toISOString().substr(0, 10)}T${timeTakenStr}:00Z`)
              : parsed
      } else {
          timeTaken = new Date()
      }

      await prismaClient.history.upsert({
        where: { detailId_date: { detailId, date: dayStart } },
        update: { timeTaken, status: "DONE" },
        create: { detailId, date: dayStart, timeTaken, status: "DONE" },
      })

      return "Marked as taken"
  }

  // Skip / suppress a single occurrence
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

  // Undo last history record for given detail+date (works for DONE or MISSED)
  static async undoMarkAsTaken(
      user: UserJWTPayload,
      detailId: number,
      dateStr?: string
  ): Promise<string> {
      const detail = await prismaClient.scheduleDetail.findFirst({
          where: { id: detailId },
          include: { schedule: { include: { medicine: true } } },
      })
      if (!detail || (detail as any).schedule?.medicine?.userId !== user.id) {
          throw new ResponseError(404, "Schedule detail not found")
      }

      const date = dateStr ? new Date(dateStr) : new Date()
      if (isNaN(date.getTime())) throw new ResponseError(400, "Invalid date")
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)

      // find history record for occurrence
      const hist = await prismaClient.history.findFirst({ where: { detailId, date: dayStart } })
      if (!hist) throw new ResponseError(404, "No history to undo")

      // Build occurrence timestamp in UTC using the UTC date from history + UTC time from detail.time
      const scheduledTime = detail.time as Date
      const yearUTC = hist.date.getUTCFullYear()
      const monthUTC = hist.date.getUTCMonth()
      const dayUTC = hist.date.getUTCDate()
      const hoursUTC = scheduledTime.getUTCHours()
      const minutesUTC = scheduledTime.getUTCMinutes()
      const occurrenceMillisUTC = Date.UTC(yearUTC, monthUTC, dayUTC, hoursUTC, minutesUTC, 0)

      const nowMillis = Date.now()
      const newStatus: "MISSED" | "PENDING" = nowMillis > occurrenceMillisUTC ? "MISSED" : "PENDING"

      await prismaClient.history.update({
        where: { id: hist.id },
        data: { status: newStatus, timeTaken: null },
      })

      return "Undo successful"
  }
}