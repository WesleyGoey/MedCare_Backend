import { History, ScheduleDetail, Schedule, Medicine } from "../../generated/prisma";

export type HistoryResponse = {
    id: number;
    medicineName: string;
    scheduledDate: Date;
    scheduledTime: Date; // Ambil dari detail.time
    timeTaken: Date | null;
    status: "PENDING" | "DONE" | "MISSED";
}

export type ComplianceResponse = {
    total: number;
    completed: number;
    missed: number;
    complianceRate: number;
}

// Helper Type untuk data yang di-include
type HistoryWithRelations = History & {
    detail: ScheduleDetail & {
        schedule: Schedule & {
            medicine: Medicine
        }
    }
}

export function toHistoryResponse(history: any): HistoryResponse {
    // Casting ke any dulu atau gunakan type HistoryWithRelations jika ingin strict
    const h = history as HistoryWithRelations;
    
    return {
        id: h.id,
        // Navigasi: detail -> schedule -> medicine -> name
        medicineName: h.detail?.schedule?.medicine?.name || "Unknown Medicine",
        scheduledDate: h.date,
        scheduledTime: h.detail?.time, 
        timeTaken: h.timeTaken,
        status: (h as any).status ?? (h.timeTaken ? "DONE" : "MISSED")
    }
}