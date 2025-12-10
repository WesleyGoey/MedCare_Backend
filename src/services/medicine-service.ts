import { Medicine } from "../../generated/prisma"
import { ResponseError } from "../error/response-error"
import {
  MedicineCreateUpdateRequest,
  MedicineResponse,
  toMedicineResponse,
  toMedicineResponseList,
} from "../models/medicine-model"
import { UserJWTPayload } from "../models/user-model"
import { prismaClient } from "../utils/database-util"
import { MedicineValidation } from "../validations/medicine-validation"
import { Validation } from "../validations/validation"

export class MedicineService {
  static async getAllMedicine(user: UserJWTPayload): Promise<MedicineResponse[]> {
    const medicines = await prismaClient.medicine.findMany({
      where: { userId: user.id },
    })

    return toMedicineResponseList(medicines)
  }

  static async getMedicineById(
    user: UserJWTPayload,
    medicineId: number
  ): Promise<MedicineResponse> {
    const medicine = await this.checkMedicineExists(user.id, medicineId)
    return toMedicineResponse(medicine)
  }

  static async addMedicine(
    user: UserJWTPayload,
    reqData: MedicineCreateUpdateRequest
  ): Promise<string> {
    const validatedData = Validation.validate(
      MedicineValidation.CREATE_UPDATE,
      reqData
    )

    await prismaClient.medicine.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        type: validatedData.type,
        dosage: validatedData.dosage,
        frequency: validatedData.frequency,
        stock: validatedData.stock,
        minStock: validatedData.minStock,
        notes: validatedData.notes,
        image: validatedData.image,
      },
    })

    return "Medicine has been created successfully!"
  }

  static async updateMedicine(
    user: UserJWTPayload,
    reqData: MedicineCreateUpdateRequest,
    medicineId: number
  ): Promise<string> {
    const validatedData = Validation.validate(
      MedicineValidation.CREATE_UPDATE,
      reqData
    )

    await this.checkMedicineExists(user.id, medicineId)

    await prismaClient.medicine.update({
      where: { id: medicineId },
      data: {
        name: validatedData.name,
        type: validatedData.type,
        dosage: validatedData.dosage,
        frequency: validatedData.frequency,
        stock: validatedData.stock,
        minStock: validatedData.minStock,
        notes: validatedData.notes,
        image: validatedData.image,
      },
    })

    return "Medicine has been updated successfully!"
  }

  static async deleteMedicine(
    user: UserJWTPayload,
    medicineId: number
  ): Promise<string> {
    await this.checkMedicineExists(user.id, medicineId)

    await prismaClient.medicine.delete({
      where: { id: medicineId },
    })

    return "Medicine has been deleted successfully!"
  }

  static async checkLowStock(user: UserJWTPayload): Promise<MedicineResponse[]> {
    const medicines = await prismaClient.medicine.findMany({
      where: { userId: user.id },
    })

    const lowStock = medicines.filter((m) => m.stock <= m.minStock)

    return toMedicineResponseList(lowStock)
  }

  private static async checkMedicineExists(
    userId: number,
    medicineId: number
  ): Promise<Medicine> {
    const medicine = await prismaClient.medicine.findFirst({
      where: {
        id: medicineId,
        userId,
      },
    })

    if (!medicine) {
      throw new ResponseError(400, "Medicine not found!")
    }

    return medicine
  }
}