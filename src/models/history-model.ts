import { History, ScheduleDetail, Schedule, Medicine } from "../../generated/prisma";

export type HistoryResponse = {
    id: number;
    medicineName: string;
    scheduledDate: Date;
    scheduledTime: Date;
    timeTaken: Date | null;
    status: "PENDING" | "DONE" | "MISSED"; // ✅ status should be here
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
    const h = history as HistoryWithRelations;
    return {
        id: h.id,
        medicineName: h.detail?.schedule?.medicine?.name || "Unknown Medicine",
        scheduledDate: h.date,
        scheduledTime: h.detail?.time,
        timeTaken: h.timeTaken,
        status: (h as any).status ?? (h.timeTaken ? "DONE" : "MISSED") // ✅ use history.status
    }
}