import { History, ScheduleDetail, Schedule, Medicine } from "../../generated/prisma";

export type HistoryResponse = {
    id: number;
    medicineName: string;
    scheduledDate: Date;
    scheduledTime: Date;
    timeTaken: Date | null;
    status: "PENDING" | "DONE" | "MISSED";
}

export type ComplianceResponse = {
    total: number;
    completed: number;
    missed: number;
    complianceRate: number;
}

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
        status: h.status
    }
}