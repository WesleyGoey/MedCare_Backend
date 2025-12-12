import { Schedule, ScheduleDetail, Medicine } from "../../generated/prisma"

// request for creating schedule
export interface ScheduleCreateRequest {
  medicineId: number
  scheduleType: "DAILY" | "WEEKLY"
  startDate: string // ISO date
  details: ScheduleDetailInput[]
}

export interface ScheduleDetailInput {
  time: string // "HH:mm"
  dayOfWeek?: number // 0-6, required for WEEKLY
}

// request for updating schedule detail
export interface ScheduleDetailUpdateRequest {
  time?: string // "HH:mm"
  dayOfWeek?: number
  // REMOVED: status field (now in History)
}

// response for schedule detail (used as reminder in UI)
export interface ScheduleDetailResponse {
  id: number
  scheduleId: number
  time: string // "HH:mm" formatted
  dayOfWeek?: number | null
  // REMOVED: status field
  medicine: {
    id: number
    name: string
    dosage?: string | null
    type?: string | null
    image?: string | null
  }
  schedule: {
    id: number
    scheduleType: string
    startDate: string
  }
}

export function toScheduleDetailResponse(
  d: ScheduleDetail & { schedule?: Schedule & { medicine?: Medicine } }
): ScheduleDetailResponse {
  const timeStr = d.time instanceof Date ? d.time.toISOString().substr(11, 5) : String(d.time).substr(0, 5)
  return {
    id: d.id,
    scheduleId: d.scheduleId,
    time: timeStr,
    dayOfWeek: d.dayOfWeek ?? null,
    // REMOVED: status
    medicine: {
      id: (d.schedule as any)?.medicine?.id ?? 0,
      name: (d.schedule as any)?.medicine?.name ?? "",
      dosage: (d.schedule as any)?.medicine?.dosage ?? null,
      type: (d.schedule as any)?.medicine?.type ?? null,
      image: (d.schedule as any)?.medicine?.image ?? null,
    },
    schedule: {
      id: (d.schedule as any)?.id ?? 0,
      scheduleType: (d.schedule as any)?.scheduleType ?? "",
      startDate: (d.schedule as any)?.startDate instanceof Date 
        ? (d.schedule as any).startDate.toISOString() 
        : "",
    },
  }
}

export function toScheduleDetailResponseList(
  details: (ScheduleDetail & { schedule?: Schedule & { medicine?: Medicine } })[]
): ScheduleDetailResponse[] {
  return details.map((d) => toScheduleDetailResponse(d))
}