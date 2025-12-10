import { Medicine } from "../../generated/prisma"

export interface MedicineCreateUpdateRequest {
  name: string
  type: string
  dosage: string
  frequency?: string
  stock?: number
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