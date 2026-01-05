import { Medicine, Schedule, ScheduleDetail } from "../../generated/prisma"

export interface MedicineCreateUpdateRequest {
  name: string
  type: string
  dosage: string
  stock: number
  minStock: number
  notes?: string
  // status akan default true saat create, tidak perlu di request
}

export interface MedicineResponse extends MedicineCreateUpdateRequest {
  id: number
  userId: number
  status: boolean // NEW
}

export function toMedicineResponseList(prismaMedicine: Medicine[]): MedicineResponse[] {
  return prismaMedicine.map((m) => toMedicineResponse(m))
}

export function toMedicineResponse(prismaMedicine: Medicine): MedicineResponse {
  return {
    id: prismaMedicine.id,
    userId: prismaMedicine.userId,
    name: prismaMedicine.name,
    type: prismaMedicine.type,
    dosage: prismaMedicine.dosage,
    stock: prismaMedicine.stock,
    minStock: prismaMedicine.minStock,
    notes: prismaMedicine.notes ?? undefined,
    status: prismaMedicine.status, // NEW
  }
}

// Medicine with Schedule Details
export interface MedicineWithScheduleDetailsResponse extends MedicineResponse {
  schedules: ScheduleWithDetailsResponse[]
}

export interface ScheduleWithDetailsResponse {
  id: number
  startDate: string
  status: boolean // NEW
  details: ScheduleDetailBasicResponse[]
  // REMOVED: scheduleType
}

export interface ScheduleDetailBasicResponse {
  id: number
  time: string
  // REMOVED: dayOfWeek
}

export function toMedicineWithScheduleDetailsResponse(
  prismaMedicine: Medicine & { schedules?: (Schedule & { details?: ScheduleDetail[] })[] }
): MedicineWithScheduleDetailsResponse {
  const base = toMedicineResponse(prismaMedicine)
  return {
    ...base,
    schedules: (prismaMedicine.schedules ?? []).map((s) => ({
      id: s.id,
      startDate: s.startDate.toISOString(),
      status: s.status, // NEW
      details: (s.details ?? []).map((d) => ({
        id: d.id,
        time: d.time instanceof Date ? d.time.toISOString().substr(11, 5) : String(d.time).substr(0, 5),
      })),
    })),
  }
}

export function toMedicineWithScheduleDetailsResponseList(
  prismaMedicines: (Medicine & { schedules?: (Schedule & { details?: ScheduleDetail[] })[] })[]
): MedicineWithScheduleDetailsResponse[] {
  return prismaMedicines.map((m) => toMedicineWithScheduleDetailsResponse(m))
}