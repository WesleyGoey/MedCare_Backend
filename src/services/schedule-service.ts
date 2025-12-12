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
  // Get All Schedule With Details
  static async getAllScheduleWithDetails(user: UserJWTPayload): Promise<ScheduleDetailResponse[]> {
    const details = await prismaClient.scheduleDetail.findMany({
      where: { schedule: { medicine: { userId: user.id } } },
      include: { schedule: { include: { medicine: true } } },
      orderBy: { time: "asc" },
    })
    return toScheduleDetailResponseList(details as any)
  }

  // Get Schedule With Details By Date
  static async getScheduleWithDetailsByDate(user: UserJWTPayload, dateStr: string): Promise<ScheduleDetailResponse[]> {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) throw new ResponseError(400, "Invalid date")
    const dayOfWeek = date.getDay()

    // FIX: gunakan scheduleDetail bukan schedule_details
    const details = await prismaClient.scheduleDetail.findMany({
      where: {
        schedule: { medicine: { userId: user.id } },
        OR: [
          { schedule: { scheduleType: "DAILY" } },
          { schedule: { scheduleType: "WEEKLY" }, dayOfWeek },
        ],
      },
      include: { schedule: { include: { medicine: true } } },
      orderBy: { time: "asc" },
    })
    return toScheduleDetailResponseList(details as any)
  }

  // Get Schedule With Details By Id
  static async getScheduleWithDetailsById(user: UserJWTPayload, scheduleId: number): Promise<ScheduleDetailResponse[]> {
    // FIX: gunakan schedule bukan schedules
    const schedule = await prismaClient.schedule.findFirst({
      where: { id: scheduleId, medicine: { userId: user.id } },
      include: { details: true, medicine: true },
    })
    if (!schedule) throw new ResponseError(404, "Schedule not found")

    const detailsWithSchedule = (schedule.details || []).map((d: any) => ({
      ...d,
      schedule: { id: schedule.id, scheduleType: schedule.scheduleType, startDate: schedule.startDate, medicine: schedule.medicine },
    }))

    return toScheduleDetailResponseList(detailsWithSchedule as any)
  }

  // Create Schedule With Details (keseluruhan)
  static async createScheduleWithDetails(user: UserJWTPayload, reqData: ScheduleCreateRequest): Promise<string> {
    const validated = Validation.validate(ScheduleValidation.CREATE, reqData)

    const med = await prismaClient.medicine.findFirst({ where: { id: validated.medicineId, userId: user.id } })
    if (!med) throw new ResponseError(404, "Medicine not found")

    await prismaClient.schedule.create({
      data: {
        medicineId: validated.medicineId,
        scheduleType: validated.scheduleType,
        startDate: new Date(validated.startDate),
        details: {
          create: validated.details.map((d: any) => ({
            time: new Date(`1970-01-01T${d.time}:00Z`),
            dayOfWeek: d.dayOfWeek ?? null,
          })),
        },
      },
    })

    return "Schedule created successfully!"
  }

  // Create Schedule Details (jam nya)
  static async createScheduleDetails(user: UserJWTPayload, scheduleId: number, inputs: ScheduleDetailInput[]): Promise<string> {
    if (!inputs || inputs.length === 0) throw new ResponseError(400, "No details provided")

    const schedule = await prismaClient.schedule.findFirst({
      where: { id: scheduleId, medicine: { userId: user.id } },
    })
    if (!schedule) throw new ResponseError(404, "Schedule not found")

    const createData = inputs.map((d: any) => ({
      scheduleId,
      time: new Date(`1970-01-01T${d.time}:00Z`),
      dayOfWeek: d.dayOfWeek ?? null,
    }))

    await prismaClient.scheduleDetail.createMany({ data: createData })
    return "Schedule details created successfully!"
  }

  // Update Schedule With Details (keseluruhan)
  static async updateScheduleWithDetails(user: UserJWTPayload, scheduleId: number, reqData: ScheduleCreateRequest): Promise<string> {
    const validated = Validation.validate(ScheduleValidation.CREATE, reqData)

    const schedule = await prismaClient.schedule.findFirst({
      where: { id: scheduleId, medicine: { userId: user.id } },
    })
    if (!schedule) throw new ResponseError(404, "Schedule not found")

    const detailCreates = validated.details.map((d: any) => ({
      scheduleId,
      time: new Date(`1970-01-01T${d.time}:00Z`),
      dayOfWeek: d.dayOfWeek ?? null,
    }))

    await prismaClient.$transaction([
      prismaClient.schedule.update({
        where: { id: scheduleId },
        data: {
          scheduleType: validated.scheduleType,
          startDate: new Date(validated.startDate),
        },
      }),
      prismaClient.scheduleDetail.deleteMany({ where: { scheduleId } }),
      prismaClient.scheduleDetail.createMany({ data: detailCreates }),
    ])

    return "Schedule updated successfully!"
  }

  // Update Schedule Details (jam nya)
  static async updateScheduleDetails(user: UserJWTPayload, detailId: number, reqData: Partial<ScheduleDetailUpdateRequest>): Promise<string> {
    if (!reqData || Object.keys(reqData).length === 0) {
      throw new ResponseError(400, "No fields to update")
    }

    const validated = Validation.validate(ScheduleValidation.UPDATE_DETAIL, reqData)

    const detail = await prismaClient.scheduleDetail.findFirst({
      where: { id: detailId, schedule: { medicine: { userId: user.id } } },
    })
    if (!detail) throw new ResponseError(404, "Schedule detail not found")

    const data: any = {}
    if (validated.time) data.time = new Date(`1970-01-01T${validated.time}:00Z`)
    if (validated.dayOfWeek !== undefined) data.dayOfWeek = validated.dayOfWeek
    if (validated.status) data.status = validated.status

    await prismaClient.scheduleDetail.update({ where: { id: detailId }, data })
    return "Schedule detail updated successfully!"
  }

  // Delete Schedule With Details (keseluruhan)
  static async deleteScheduleWithDetails(user: UserJWTPayload, scheduleId: number): Promise<string> {
    const schedule = await prismaClient.schedule.findFirst({
      where: { id: scheduleId, medicine: { userId: user.id } },
    })
    if (!schedule) throw new ResponseError(404, "Schedule not found")

    await prismaClient.schedule.delete({ where: { id: scheduleId } })
    return "Schedule deleted successfully!"
  }

  // Delete Schedule Details (jam nya)
  static async deleteScheduleDetails(user: UserJWTPayload, detailId: number): Promise<string> {
    const detail = await prismaClient.scheduleDetail.findFirst({
      where: { id: detailId, schedule: { medicine: { userId: user.id } } },
    })
    if (!detail) throw new ResponseError(404, "Schedule detail not found")

    await prismaClient.scheduleDetail.delete({ where: { id: detailId } })
    return "Schedule detail deleted successfully!"
  }
}