import { prismaClient } from "../utils/database-util"
import { ComplianceResponse, toHistoryResponse } from "../models/history-model";
import { UserJWTPayload } from "../models/user-model";
import { Prisma } from "../../generated/prisma";

export class HistoryService {

    // Helper query object agar tidak berulang
    // Mengambil history berdasarkan User yang sedang login
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

    static async getAll(user: UserJWTPayload) {
        const histories = await prismaClient.history.findMany({
            where: this.getBaseQuery(user.id),
            include: {
                detail: {
                    include: {
                        schedule: {
                            include: {
                                medicine: true // Kita butuh ini untuk nama obat
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });
        return histories.map(toHistoryResponse);
    }

    static async getWeekly(user: UserJWTPayload) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Set ke hari Minggu
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() - today.getDay() + 6); // Set ke hari Sabtu
        endOfWeek.setHours(23, 59, 59, 999);

        const histories = await prismaClient.history.findMany({
            where: {
                ...this.getBaseQuery(user.id), // Spread query dasar
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

    static async getRecent(user: UserJWTPayload) {
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

    static async getMissedCount(user: UserJWTPayload): Promise<number> {
        return await prismaClient.history.count({
            where: {
                // Query gabungan manual karena keterbatasan spread operator pada nested object typescript
                detail: {
                    schedule: {
                        medicine: {
                            userId: user.id
                        }
                    }
                },
                timeTaken: null // Null berarti missed
            }
        });
    }

    static async getComplianceRate(user: UserJWTPayload): Promise<ComplianceResponse> {
        // Hitung Total (Semua history milik user ini)
        const total = await prismaClient.history.count({
            where: this.getBaseQuery(user.id)
        });

        // Hitung Completed (timeTaken TIDAK null)
        const completed = await prismaClient.history.count({
            where: {
                detail: {
                    schedule: {
                        medicine: {
                            userId: user.id
                        }
                    }
                },
                timeTaken: { not: null }
            }
        });

        const missed = total - completed;
        
        const complianceRate = total > 0 ? (completed / total) * 100 : 0;

        return {
            total,
            completed,
            missed,
            complianceRate: Math.round(complianceRate * 100) / 100
        };
    }
}