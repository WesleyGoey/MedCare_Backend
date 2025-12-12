import { Medicine, Schedule, ScheduleDetail } from "../../generated/prisma"

export interface MedicineCreateUpdateRequest {
  name: string
  type: string
  dosage: string
  stock: number
  minStock: number
  notes?: string
  image?: string
}

export interface MedicineResponse extends MedicineCreateUpdateRequest {
  id: number
  userId: number
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
    image: prismaMedicine.image ?? undefined,
  }
}

// Medicine with Schedule Details
export interface MedicineWithScheduleDetailsResponse extends MedicineResponse {
  schedules: ScheduleWithDetailsResponse[]
}

export interface ScheduleWithDetailsResponse {
  id: number
  scheduleType: string
  startDate: string
  details: ScheduleDetailBasicResponse[]
}

export interface ScheduleDetailBasicResponse {
  id: number
  time: string
  dayOfWeek?: number | null
  status: string
}

export function toMedicineWithScheduleDetailsResponse(
  prismaMedicine: Medicine & { schedules?: (Schedule & { details?: ScheduleDetail[] })[] }
): MedicineWithScheduleDetailsResponse {
  const base = toMedicineResponse(prismaMedicine)
  return {
    ...base,
    schedules: (prismaMedicine.schedules ?? []).map((s) => ({
      id: s.id,
      scheduleType: s.scheduleType,
      startDate: s.startDate.toISOString(),
      details: (s.details ?? []).map((d) => ({
        id: d.id,
        time: d.time instanceof Date ? d.time.toISOString().substr(11, 5) : String(d.time).substr(0, 5),
        dayOfWeek: d.dayOfWeek ?? null,
        status: d.status,
      })),
    })),
  }
}

export function toMedicineWithScheduleDetailsResponseList(
  prismaMedicines: (Medicine & { schedules?: (Schedule & { details?: ScheduleDetail[] })[] })[]
): MedicineWithScheduleDetailsResponse[] {
  return prismaMedicines.map((m) => toMedicineWithScheduleDetailsResponse(m))
}