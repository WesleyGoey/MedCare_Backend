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
  static async getAllMedicines(user: UserJWTPayload, includeSchedule: boolean = false): Promise<MedicineResponse[] | MedicineWithScheduleDetailsResponse[]> {
    if (includeSchedule) {
      const medicines = await prismaClient.medicine.findMany({
        where: { userId: user.id },
        include: {
          schedules: {
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
      where: { userId: user.id },
      orderBy: { id: "asc" },
    })
    return toMedicineResponseList(medicines)
  }

  static async getLowStock(user: UserJWTPayload): Promise<MedicineResponse[]> {
    const all = await prismaClient.medicine.findMany({ where: { userId: user.id } })
    const low = all.filter((m) => (m.stock ?? 0) <= (m.minStock ?? 0))
    return toMedicineResponseList(low)
  }

  static async getMedicineById(user: UserJWTPayload, id: number, includeSchedule: boolean = false): Promise<MedicineResponse | MedicineWithScheduleDetailsResponse> {
    if (includeSchedule) {
      const medicine = await prismaClient.medicine.findFirst({
        where: { id, userId: user.id },
        include: {
          schedules: {
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

  static async checkMedicineExists(userId: number, id: number): Promise<Medicine> {
    const medicine = await prismaClient.medicine.findFirst({
      where: { id, userId },
    })
    if (!medicine) {
      throw new ResponseError(404, "Medicine not found!")
    }
    return medicine
  }

  // Add Medicine
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
        image: validated.image,
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
    const keys: (keyof MedicineCreateUpdateRequest)[] = ["name", "type", "dosage", "stock", "minStock", "notes", "image"]
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

  static async deleteMedicine(user: UserJWTPayload, id: number): Promise<string> {
    await this.checkMedicineExists(user.id, id)
    await prismaClient.medicine.delete({ where: { id } })
    return "Medicine has been deleted successfully!"
  }
}