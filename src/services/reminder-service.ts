import { Reminder, ReminderStatus } from "../../generated/prisma"
import { ResponseError } from "../error/response-error"
import {
  ReminderCreateRequest,
  ReminderUpdateRequest,
  ReminderResponse,
  toReminderResponse,
  toReminderResponseList,
} from "../models/reminder-model"
import { prismaClient } from "../utils/database-util"
import { ReminderValidation } from "../validations/reminder-validation"
import { Validation } from "../validations/validation"
import { UserJWTPayload } from "../models/user-model"

export class ReminderService {
  static async getAllReminders(user: UserJWTPayload): Promise<ReminderResponse[]> {
    const reminders = await prismaClient.reminder.findMany({
      where: { 
        medicine: { userId: user.id } 
      },
      orderBy: { time: "asc" },
    })
    return toReminderResponseList(reminders)
  }

  static async getReminderById(user: UserJWTPayload, id: number): Promise<ReminderResponse> {
    const reminder = await this.checkReminderExists(user.id, id)
    return toReminderResponse(reminder)
  }

  static async checkReminderExists(userId: number, id: number): Promise<Reminder> {
    const reminder = await prismaClient.reminder.findFirst({
      where: { 
        id,
        medicine: { userId }
      },
    })
    if (!reminder) {
      throw new ResponseError(404, "Reminder not found!")
    }
    return reminder
  }

  static async createReminder(user: UserJWTPayload, reqData: ReminderCreateRequest): Promise<string> {
    const validated = Validation.validate(ReminderValidation.CREATE, reqData)

    // Check if medicine exists and belongs to user
    const medicine = await prismaClient.medicine.findFirst({
      where: { 
        id: validated.medicineId,
        userId: user.id
      }
    })
    if (!medicine) {
      throw new ResponseError(404, "Medicine not found or does not belong to user")
    }

    await prismaClient.reminder.create({
      data: {
        medicineId: validated.medicineId,
        time: validated.time,
        status: ReminderStatus.PENDING,
      },
    })

    return "Reminder has been created successfully!"
  }

  static async updateReminder(user: UserJWTPayload, id: number, reqData: ReminderUpdateRequest): Promise<string> {
    if (!reqData || Object.keys(reqData).length === 0) {
      throw new ResponseError(400, "No fields to update")
    }

    const validated = Validation.validate(ReminderValidation.UPDATE, reqData)

    await this.checkReminderExists(user.id, id)

    const data: any = {}
    if (validated.time !== undefined) data.time = validated.time
    if (validated.status !== undefined) data.status = validated.status

    if (Object.keys(data).length === 0) {
      throw new ResponseError(400, "No valid fields provided to update")
    }

    await prismaClient.reminder.update({
      where: { id },
      data,
    })

    return "Reminder has been updated successfully!"
  }

  static async deleteReminder(user: UserJWTPayload, id: number): Promise<string> {
    await this.checkReminderExists(user.id, id)
    await prismaClient.reminder.delete({ where: { id } })
    return "Reminder has been deleted successfully!"
  }

  static async getUpcomingReminders(user: UserJWTPayload): Promise<ReminderResponse[]> {
    const now = new Date()
    const reminders = await prismaClient.reminder.findMany({
      where: {
        medicine: { userId: user.id },
        status: ReminderStatus.PENDING,
        time: { gte: now }
      },
      orderBy: { time: "asc" },
    })
    return toReminderResponseList(reminders)
  }

  static async getRemindersByMedicine(user: UserJWTPayload, medicineId: number): Promise<ReminderResponse[]> {
    // Check if medicine belongs to user
    const medicine = await prismaClient.medicine.findFirst({
      where: { 
        id: medicineId,
        userId: user.id
      }
    })
    if (!medicine) {
      throw new ResponseError(404, "Medicine not found or does not belong to user")
    }

    const reminders = await prismaClient.reminder.findMany({
      where: { medicineId },
      orderBy: { time: "asc" },
    })
    return toReminderResponseList(reminders)
  }
}