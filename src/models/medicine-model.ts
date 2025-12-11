import { Medicine } from "../../generated/prisma"
import { Reminder } from "../../generated/prisma"
import { ReminderResponse, toReminderResponseList } from "./reminder-model"

export interface MedicineCreateUpdateRequest {
  name: string
  type: string
  dosage: string
  frequency: number
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
    frequency: prismaMedicine.frequency ?? undefined,
    stock: prismaMedicine.stock,
    minStock: prismaMedicine.minStock,
    notes: prismaMedicine.notes ?? undefined,
    image: prismaMedicine.image ?? undefined,
  }
}

export interface MedicineWithRemindersResponse extends MedicineResponse {
  reminders: ReminderResponse[]
}

export function toMedicineWithRemindersResponse(
  prismaMedicine: Medicine & { reminders?: Reminder[] }
): MedicineWithRemindersResponse {
  const base = toMedicineResponse(prismaMedicine)
  return {
    ...base,
    reminders: toReminderResponseList(prismaMedicine.reminders ?? []),
  }
}

export function toMedicineWithRemindersResponseList(
  prismaMedicines: (Medicine & { reminders?: Reminder[] })[]
): MedicineWithRemindersResponse[] {
  return prismaMedicines.map((m) => toMedicineWithRemindersResponse(m))
}