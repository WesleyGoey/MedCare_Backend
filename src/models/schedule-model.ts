import { Schedule, ScheduleDetail, Medicine } from "../../generated/prisma"

// request for creating schedule
export interface ScheduleCreateRequest {
  medicineId: number
  startDate: string // ISO date
  details: ScheduleDetailInput[]
  // REMOVED: scheduleType (sekarang semua DAILY)
}

export interface ScheduleDetailInput {
  time: string // "HH:mm"
  // REMOVED: dayOfWeek
}

// request for updating schedule detail
export interface ScheduleDetailUpdateRequest {
  time?: string // "HH:mm"
  // REMOVED: dayOfWeek
}

// response for schedule detail (used as reminder in UI)
export interface ScheduleDetailResponse {
  id: number
  scheduleId: number
  time: string // "HH:mm" formatted
  medicine: {
    id: number
    name: string
    dosage?: string | null
    type?: string | null
  }
  schedule: {
    id: number
    startDate: string
    status: boolean // NEW
    // REMOVED: scheduleType
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
    medicine: {
      id: (d.schedule as any)?.medicine?.id ?? 0,
      name: (d.schedule as any)?.medicine?.name ?? "",
      dosage: (d.schedule as any)?.medicine?.dosage ?? null,
      type: (d.schedule as any)?.medicine?.type ?? null,
    },
    schedule: {
      id: (d.schedule as any)?.id ?? 0,
      startDate: (d.schedule as any)?.startDate instanceof Date 
        ? (d.schedule as any).startDate.toISOString() 
        : "",
      status: (d.schedule as any)?.status ?? true, // NEW
    },
  }
}

export function toScheduleDetailResponseList(
  details: (ScheduleDetail & { schedule?: Schedule & { medicine?: Medicine } })[]
): ScheduleDetailResponse[] {
  return details.map((d) => toScheduleDetailResponse(d))
}