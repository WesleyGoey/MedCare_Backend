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
    // if (validated.status) data.status = validated.status

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

  // Mark detail as taken
  static async markDetailAsTaken(
    user: UserJWTPayload,
    detailId: number,
    dateStr?: string,
    timeTakenStr?: string
  ): Promise<string> {
    const detail = await prismaClient.scheduleDetail.findFirst({
      where: { id: detailId },
      include: { schedule: { include: { medicine: true } } },
    })
    if (!detail || (detail as any).schedule?.medicine?.userId !== user.id) {
      throw new ResponseError(404, "Schedule detail not found")
    }

    const date = dateStr ? new Date(dateStr) : new Date()
    if (isNaN(date.getTime())) throw new ResponseError(400, "Invalid date")
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)

    let timeTaken: Date
    if (timeTakenStr) {
      const parsed = new Date(timeTakenStr)
      timeTaken = isNaN(parsed.getTime())
        ? new Date(`${dayStart.toISOString().substr(0, 10)}T${timeTakenStr}:00Z`)
        : parsed
    } else {
      timeTaken = new Date()
    }

    await prismaClient.$transaction([
      prismaClient.history.create({
        data: {
          detailId,
          date: dayStart,
          timeTaken,
          status: "DONE",
        },
      }),
      // removed scheduleDetail.status update; status now recorded in history
      prismaClient.suppression.deleteMany({
        where: {
          detailId,
          date: dayStart,
          userId: user.id,
        },
      }),
    ])

    return "Marked as taken"
  }

  // Skip detail (suppress alarm only)
  static async skipDetail(
    user: UserJWTPayload,
    detailId: number,
    dateStr?: string
  ): Promise<string> {
    const detail = await prismaClient.scheduleDetail.findFirst({
      where: { id: detailId, schedule: { medicine: { userId: user.id } } },
    })
    if (!detail) throw new ResponseError(404, "Schedule detail not found")

    const date = dateStr ? new Date(dateStr) : new Date()
    if (isNaN(date.getTime())) throw new ResponseError(400, "Invalid date")
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const expiresAt = new Date(dayStart)
    expiresAt.setDate(expiresAt.getDate() + 1)

    await prismaClient.suppression.create({
      data: {
        userId: user.id,
        detailId,
        date: dayStart,
        expiresAt,
      },
    })

    return "Alarm muted for this occurrence"
  }

  // Undo mark as taken
  static async undoMarkAsTaken(
    user: UserJWTPayload,
    detailId: number,
    dateStr?: string
  ): Promise<string> {
    const detail = await prismaClient.scheduleDetail.findFirst({
      where: { id: detailId },
      include: { schedule: { include: { medicine: true } } },
    })
    if (!detail || (detail as any).schedule?.medicine?.userId !== user.id) {
      throw new ResponseError(404, "Schedule detail not found")
    }

    const date = dateStr ? new Date(dateStr) : new Date()
    if (isNaN(date.getTime())) throw new ResponseError(400, "Invalid date")
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)

    const lastHist = await prismaClient.history.findFirst({
      where: { detailId, date: dayStart },
      orderBy: { id: "desc" },
    })
    if (!lastHist) throw new ResponseError(404, "No history to undo")

    await prismaClient.$transaction([
      prismaClient.history.delete({ where: { id: lastHist.id } }),
      // removed scheduleDetail status revert; history deletion is the source of truth
    ])

    return "Undo successful"
  }

  // Check if suppressed (for alarm dispatcher)
  static async isSuppressed(userId: number, detailId: number, date: Date): Promise<boolean> {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const sup = await prismaClient.suppression.findFirst({
      where: { detailId, userId, date: dayStart, expiresAt: { gt: new Date() } },
    })
    return !!sup
  }
}