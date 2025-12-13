import { prismaClient } from "../utils/database-util";
import { toHistoryResponse } from "../models/history-model";
import { UserJWTPayload } from "../models/user-model";
import { Prisma } from "../../generated/prisma";

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
        startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() - today.getDay() + 6); // Set to Saturday
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
            orderBy: { date: 'desc' }
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
}