import { prismaClient } from "../utils/database-util"
import { ResponseError } from "../error/response-error"
import { UserJWTPayload } from "../models/user-model"
import {
  ScheduleCreateRequest,
  ScheduleDetailUpdateRequest,
  ScheduleDetailResponse,
  toScheduleDetailResponseList,
  ScheduleDetailInput,
} from "../models/schedule-model"
import { Validation } from "../validations/validation"
import { ScheduleValidation } from "../validations/schedule-validation"

export class ScheduleService {
  // Get All Schedule With Details (filter by status = true)
  static async getAllScheduleWithDetails(user: UserJWTPayload): Promise<ScheduleDetailResponse[]> {
    const details = await prismaClient.scheduleDetail.findMany({
      where: { 
        schedule: { 
          medicine: { userId: user.id, status: true }, // NEW: filter medicine by status
          status: true // NEW: filter schedule by status
        } 
      },
      include: { schedule: { include: { medicine: true } } },
      orderBy: { time: "asc" },
    })
    return toScheduleDetailResponseList(details as any)
  }

  // Get Schedule With Details By Date (sekarang semua DAILY, tidak perlu filter dayOfWeek)
  static async getScheduleWithDetailsByDate(user: UserJWTPayload, dateStr: string): Promise<ScheduleDetailResponse[]> {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) throw new ResponseError(400, "Invalid date")

    // SIMPLIFIED: semua schedule adalah DAILY, tidak perlu OR condition
    const details = await prismaClient.scheduleDetail.findMany({
      where: {
        schedule: { 
          medicine: { userId: user.id, status: true }, // NEW: filter medicine by status
          status: true // NEW: filter schedule by status
        },
      },
      include: { schedule: { include: { medicine: true } } },
      orderBy: { time: "asc" },
    })
    return toScheduleDetailResponseList(details as any)
  }

  // Get Schedule With Details By Id (filter by status = true)
  static async getScheduleWithDetailsById(user: UserJWTPayload, scheduleId: number): Promise<ScheduleDetailResponse[]> {
    const schedule = await prismaClient.schedule.findFirst({
      where: { 
        id: scheduleId, 
        medicine: { userId: user.id, status: true }, // NEW: filter medicine by status
        status: true // NEW: filter schedule by status
      },
      include: { details: true, medicine: true },
    })
    if (!schedule) throw new ResponseError(404, "Schedule not found")

    const detailsWithSchedule = (schedule.details || []).map((d: any) => ({
      ...d,
      schedule: { 
        id: schedule.id, 
        startDate: schedule.startDate, 
        status: schedule.status, // NEW
        medicine: schedule.medicine 
      },
    }))

    return toScheduleDetailResponseList(detailsWithSchedule as any)
  }

  // Create Schedule With Details (status default true dari schema, no scheduleType)
  static async createScheduleWithDetails(user: UserJWTPayload, reqData: ScheduleCreateRequest): Promise<string> {
    const validated = Validation.validate(ScheduleValidation.CREATE, reqData)

    const med = await prismaClient.medicine.findFirst({ 
      where: { id: validated.medicineId, userId: user.id, status: true } // NEW: filter by status
    })
    if (!med) throw new ResponseError(404, "Medicine not found")

    await prismaClient.schedule.create({
      data: {
        medicineId: validated.medicineId,
        startDate: new Date(validated.startDate),
        // REMOVED: scheduleType
        // status default true dari schema
        details: {
          create: validated.details.map((d: any) => ({
            time: new Date(`1970-01-01T${d.time}:00Z`),
            // REMOVED: dayOfWeek
          })),
        },
      },
    })

    return "Schedule created successfully!"
  }

  // Create Schedule Details (no dayOfWeek)
  static async createScheduleDetails(user: UserJWTPayload, scheduleId: number, inputs: ScheduleDetailInput[]): Promise<string> {
    if (!inputs || inputs.length === 0) throw new ResponseError(400, "No details provided")

    const schedule = await prismaClient.schedule.findFirst({
      where: { 
        id: scheduleId, 
        medicine: { userId: user.id, status: true }, // NEW: filter medicine by status
        status: true // NEW: filter schedule by status
      },
    })
    if (!schedule) throw new ResponseError(404, "Schedule not found")

    const createData = inputs.map((d: any) => ({
      scheduleId,
      time: new Date(`1970-01-01T${d.time}:00Z`),
      // REMOVED: dayOfWeek
    }))

    await prismaClient.scheduleDetail.createMany({ data: createData })
    return "Schedule details created successfully!"
  }

  // Update Schedule With Details (no scheduleType)
  static async updateScheduleWithDetails(user: UserJWTPayload, scheduleId: number, reqData: ScheduleCreateRequest): Promise<string> {
    const validated = Validation.validate(ScheduleValidation.CREATE, reqData)

    const schedule = await prismaClient.schedule.findFirst({
      where: { 
        id: scheduleId, 
        medicine: { userId: user.id, status: true }, // NEW: filter medicine by status
        status: true // NEW: filter schedule by status
      },
    })
    if (!schedule) throw new ResponseError(404, "Schedule not found")

    const detailCreates = validated.details.map((d: any) => ({
      scheduleId,
      time: new Date(`1970-01-01T${d.time}:00Z`),
      // REMOVED: dayOfWeek
    }))

    await prismaClient.$transaction([
      prismaClient.schedule.update({
        where: { id: scheduleId },
        data: {
          startDate: new Date(validated.startDate),
          // REMOVED: scheduleType
        },
      }),
      prismaClient.scheduleDetail.deleteMany({ where: { scheduleId } }),
      prismaClient.scheduleDetail.createMany({ data: detailCreates }),
    ])

    return "Schedule updated successfully!"
  }

  // Update Schedule Details (no dayOfWeek)
  static async updateScheduleDetails(
    user: UserJWTPayload,
    detailId: number,
    reqData: Partial<ScheduleDetailUpdateRequest>
  ): Promise<string> {
    const validated = Validation.validate((ScheduleValidation.UPDATE_DETAIL as any).partial(), reqData)

    const detail = await prismaClient.scheduleDetail.findFirst({
      where: { 
        id: detailId, 
        schedule: { 
          medicine: { userId: user.id, status: true }, // NEW: filter medicine by status
          status: true // NEW: filter schedule by status
        } 
      },
    })
    if (!detail) throw new ResponseError(404, "Schedule detail not found")

    const data: any = {}
    if ((validated as any).time !== undefined) {
      data.time = new Date(`1970-01-01T${(validated as any).time}:00Z`)
    }
    // REMOVED: dayOfWeek handling

    if (Object.keys(data).length === 0) {
      throw new ResponseError(400, "No valid fields provided to update")
    }

    await prismaClient.scheduleDetail.update({ where: { id: detailId }, data })
    return "Schedule detail updated successfully!"
  }

  // Delete Schedule With Details (SOFT DELETE)
  static async deleteScheduleWithDetails(user: UserJWTPayload, scheduleId: number): Promise<string> {
    const schedule = await prismaClient.schedule.findFirst({
      where: { 
        id: scheduleId, 
        medicine: { userId: user.id, status: true }, // NEW: filter medicine by status
        status: true // NEW: filter schedule by status
      },
    })
    if (!schedule) throw new ResponseError(404, "Schedule not found")

    // SOFT DELETE: set status = false instead of DELETE
    await prismaClient.schedule.update({ 
      where: { id: scheduleId }, 
      data: { status: false } 
    })
    
    return "Schedule deleted successfully!"
  }

  // Delete Schedule Details (tetap HARD DELETE karena detail tidak punya status field)
  static async deleteScheduleDetails(user: UserJWTPayload, detailId: number): Promise<string> {
    const detail = await prismaClient.scheduleDetail.findFirst({
      where: { 
        id: detailId, 
        schedule: { 
          medicine: { userId: user.id, status: true }, // NEW: filter medicine by status
          status: true // NEW: filter schedule by status
        } 
      },
    })
    if (!detail) throw new ResponseError(404, "Schedule detail not found")

    await prismaClient.scheduleDetail.delete({ where: { id: detailId } })
    return "Schedule detail deleted successfully!"
  }

  // Keep only this helper method for alarm dispatcher
  static async isSuppressed(userId: number, detailId: number, date: Date): Promise<boolean> {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const missed = await prismaClient.history.findFirst({
      where: { detailId, date: dayStart, status: "MISSED" },
    })
    return !!missed
  }
}