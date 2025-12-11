import { prismaClient } from "../utils/database-util"
import { ResponseError } from "../error/response-error"
import { UserJWTPayload } from "../models/user-model"
import {
  ScheduleCreateRequest,
  ScheduleDetailUpdateRequest,
  ScheduleDetailResponse,
  toScheduleDetailResponseList,
} from "../models/schedule-model"
import { Validation } from "../validations/validation"
import { ScheduleValidation } from "../validations/schedule-validation"

export class ScheduleService {
  // 1. Get all schedule details (reminders) for user
  static async getAllScheduleDetails(user: UserJWTPayload): Promise<ScheduleDetailResponse[]> {
    const details = await prismaClient.scheduleDetail.findMany({
      where: { schedule: { medicine: { userId: user.id } } },
      include: { schedule: { include: { medicine: true } } },
      orderBy: { time: "asc" },
    })
    return toScheduleDetailResponseList(details as any)
  }

  // 2. Get schedule details by date (DAILY + WEEKLY match)
  static async getScheduleDetailsByDate(user: UserJWTPayload, dateStr: string): Promise<ScheduleDetailResponse[]> {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) throw new ResponseError(400, "Invalid date")
    const dayOfWeek = date.getDay() // 0=Sunday, 1=Monday, ...

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

  // 3. Get schedule details by medicine
  static async getScheduleDetailsByMedicine(user: UserJWTPayload, medicineId: number): Promise<ScheduleDetailResponse[]> {
    const med = await prismaClient.medicine.findFirst({ where: { id: medicineId, userId: user.id } })
    if (!med) throw new ResponseError(404, "Medicine not found")

    const details = await prismaClient.scheduleDetail.findMany({
      where: { schedule: { medicineId } },
      include: { schedule: { include: { medicine: true } } },
      orderBy: { time: "asc" },
    })
    return toScheduleDetailResponseList(details as any)
  }

  // 4. Get schedule detail by ID (for edit form)
  static async getScheduleDetailById(user: UserJWTPayload, detailId: number): Promise<ScheduleDetailResponse> {
    const detail = await prismaClient.scheduleDetail.findFirst({
      where: { id: detailId, schedule: { medicine: { userId: user.id } } },
      include: { schedule: { include: { medicine: true } } },
    })
    if (!detail) throw new ResponseError(404, "Schedule detail not found")
    return toScheduleDetailResponseList([detail as any])[0]
  }

  // 5. Create schedule with details
  static async createSchedule(user: UserJWTPayload, reqData: ScheduleCreateRequest): Promise<string> {
    const validated = Validation.validate(ScheduleValidation.CREATE, reqData)

    const med = await prismaClient.medicine.findFirst({ where: { id: validated.medicineId, userId: user.id } })
    if (!med) throw new ResponseError(404, "Medicine not found")

    const schedule = await prismaClient.schedule.create({
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

  // 6. Update schedule detail (time/status)
  static async updateScheduleDetail(user: UserJWTPayload, detailId: number, reqData: Partial<ScheduleDetailUpdateRequest>): Promise<string> {
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

  // 7. Delete schedule detail
  static async deleteScheduleDetail(user: UserJWTPayload, detailId: number): Promise<string> {
    const detail = await prismaClient.scheduleDetail.findFirst({
      where: { id: detailId, schedule: { medicine: { userId: user.id } } },
    })
    if (!detail) throw new ResponseError(404, "Schedule detail not found")

    await prismaClient.scheduleDetail.delete({ where: { id: detailId } })
    return "Schedule detail deleted successfully!"
  }

  // 8. Delete entire schedule
  static async deleteSchedule(user: UserJWTPayload, scheduleId: number): Promise<string> {
    const schedule = await prismaClient.schedule.findFirst({
      where: { id: scheduleId, medicine: { userId: user.id } },
    })
    if (!schedule) throw new ResponseError(404, "Schedule not found")

    await prismaClient.schedule.delete({ where: { id: scheduleId } })
    return "Schedule deleted successfully!"
  }
}