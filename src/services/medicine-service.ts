import { Medicine } from "../../generated/prisma"
import { ResponseError } from "../error/response-error"
import {
  MedicineCreateUpdateRequest,
  MedicineResponse,
  toMedicineResponse,
  toMedicineResponseList,
  MedicineWithScheduleDetailsResponse,
  toMedicineWithScheduleDetailsResponse,
  toMedicineWithScheduleDetailsResponseList,
} from "../models/medicine-model"
import { prismaClient } from "../utils/database-util"
import { MedicineValidation } from "../validations/medicine-validation"
import { Validation } from "../validations/validation"
import { UserJWTPayload } from "../models/user-model"

export class MedicineService {
  // Get All Medicines (filter by status = true)
  static async getAllMedicines(user: UserJWTPayload, includeSchedule: boolean = false): Promise<MedicineResponse[] | MedicineWithScheduleDetailsResponse[]> {
    const whereClause = { userId: user.id, status: true } // NEW: filter by status

    if (includeSchedule) {
      const medicines = await prismaClient.medicine.findMany({
        where: whereClause,
        include: {
          schedules: {
            where: { status: true }, // NEW: filter schedule by status
            include: {
              details: {
                orderBy: { time: "asc" },
              },
            },
          },
        },
        orderBy: { id: "asc" },
      })
      return toMedicineWithScheduleDetailsResponseList(medicines as any)
    }

    const medicines = await prismaClient.medicine.findMany({
      where: whereClause,
      orderBy: { id: "asc" },
    })
    return toMedicineResponseList(medicines)
  }

  // Get Low Stock (filter by status = true)
  static async getLowStock(user: UserJWTPayload): Promise<MedicineResponse[]> {
    const all = await prismaClient.medicine.findMany({ 
      where: { userId: user.id, status: true } // NEW: filter by status
    })
    const low = all.filter((m) => (m.stock ?? 0) <= (m.minStock ?? 0))
    return toMedicineResponseList(low)
  }

  // Get Medicine By ID (filter by status = true)
  static async getMedicineById(user: UserJWTPayload, id: number, includeSchedule: boolean = false): Promise<MedicineResponse | MedicineWithScheduleDetailsResponse> {
    if (includeSchedule) {
      const medicine = await prismaClient.medicine.findFirst({
        where: { id, userId: user.id, status: true }, // NEW: filter by status
        include: {
          schedules: {
            where: { status: true }, // NEW: filter schedule by status
            include: {
              details: {
                orderBy: { time: "asc" },
              },
            },
          },
        },
      })
      if (!medicine) {
        throw new ResponseError(404, "Medicine not found!")
      }
      return toMedicineWithScheduleDetailsResponse(medicine as any)
    }

    const medicine = await this.checkMedicineExists(user.id, id)
    return toMedicineResponse(medicine)
  }

  // Check Medicine Exists (filter by status = true)
  static async checkMedicineExists(userId: number, id: number): Promise<Medicine> {
    const medicine = await prismaClient.medicine.findFirst({
      where: { id, userId, status: true }, // NEW: filter by status
    })
    if (!medicine) {
      throw new ResponseError(404, "Medicine not found!")
    }
    return medicine
  }

  // Add Medicine (status default true dari schema)
  static async addMedicine(user: UserJWTPayload, reqData: MedicineCreateUpdateRequest): Promise<string> {
    const validated = Validation.validate(MedicineValidation.CREATE_UPDATE, reqData)

    const dbUser = await prismaClient.user.findUnique({ where: { id: user.id } })
    if (!dbUser) {
      throw new ResponseError(401, "Authenticated user not found")
    }

    await prismaClient.medicine.create({
      data: {
        userId: user.id,
        name: validated.name,
        type: validated.type,
        dosage: validated.dosage,
        stock: validated.stock,
        minStock: validated.minStock,
        notes: validated.notes,
        // status default true dari schema
      },
    })

    return "Medicine has been created successfully!"
  }

  // Update Medicine
  static async updateMedicine(user: UserJWTPayload, id: number, reqData: Partial<MedicineCreateUpdateRequest>): Promise<string> {
    if (!reqData || Object.keys(reqData).length === 0) {
      throw new ResponseError(400, "No fields to update")
    }

    const validated = Validation.validate((MedicineValidation.CREATE_UPDATE as any).partial(), reqData)

    await this.checkMedicineExists(user.id, id)

    const data: any = {}
    const keys: (keyof MedicineCreateUpdateRequest)[] = ["name", "type", "dosage", "stock", "minStock", "notes"]
    for (const k of keys) {
      if ((validated as any)[k] !== undefined) data[k] = (validated as any)[k]
    }

    if (Object.keys(data).length === 0) {
      throw new ResponseError(400, "No valid fields provided to update")
    }

    await prismaClient.medicine.update({
      where: { id },
      data,
    })

    return "Medicine has been updated successfully!"
  }

  // Delete Medicine (SOFT DELETE)
  static async deleteMedicine(user: UserJWTPayload, id: number): Promise<string> {
    await this.checkMedicineExists(user.id, id)
    
    // SOFT DELETE: set status = false instead of DELETE
    await prismaClient.medicine.update({ 
      where: { id }, 
      data: { status: false } 
    })
    
    return "Medicine has been deleted successfully!"
  }
}