import { NextFunction, Response } from "express"
import { UserRequest } from "../models/user-request-model"
import { ScheduleService } from "../services/schedule-service"
import { ResponseError } from "../error/response-error"
import { ScheduleCreateRequest, ScheduleDetailUpdateRequest, ScheduleDetailInput } from "../models/schedule-model"

export class ScheduleController {
  // GET all schedule details (reminders)
  static async getAll(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const data = await ScheduleService.getAllScheduleDetails(req.user!)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  // GET schedule details by date
  static async getByDate(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const date = String(req.query.date ?? "")
      if (!date) throw new ResponseError(400, "Missing date query parameter")
      const data = await ScheduleService.getScheduleDetailsByDate(req.user!, date)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  // GET schedule details by medicine
  static async getByMedicine(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const medicineId = Number(req.params.medicineId)
      if (!Number.isInteger(medicineId) || medicineId <= 0) {
        throw new ResponseError(400, "Invalid medicine id")
      }
      const data = await ScheduleService.getScheduleDetailsByMedicine(req.user!, medicineId)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  // GET single schedule detail by ID
  static async getDetailById(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const detailId = Number(req.params.detailId)
      if (!Number.isInteger(detailId) || detailId <= 0) {
        throw new ResponseError(400, "Invalid detail id")
      }
      const data = await ScheduleService.getScheduleDetailById(req.user!, detailId)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  // POST create schedule
  static async create(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const reqData = req.body as ScheduleCreateRequest
      const message = await ScheduleService.createSchedule(req.user!, reqData)
      res.status(201).json({ message })
    } catch (error) {
      next(error)
    }
  }

  // PATCH update schedule detail
  static async updateDetail(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const detailId = Number(req.params.detailId)
      if (!Number.isInteger(detailId) || detailId <= 0) {
        throw new ResponseError(400, "Invalid detail id")
      }
      const reqData = req.body as Partial<ScheduleDetailUpdateRequest>
      const message = await ScheduleService.updateScheduleDetail(req.user!, detailId, reqData)
      res.status(200).json({ message })
    } catch (error) {
      next(error)
    }
  }

  // DELETE schedule detail
  static async deleteDetail(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const detailId = Number(req.params.detailId)
      if (!Number.isInteger(detailId) || detailId <= 0) {
        throw new ResponseError(400, "Invalid detail id")
      }
      const message = await ScheduleService.deleteScheduleDetail(req.user!, detailId)
      res.status(200).json({ message })
    } catch (error) {
      next(error)
    }
  }

  // DELETE entire schedule
  static async deleteSchedule(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const scheduleId = Number(req.params.scheduleId)
      if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
        throw new ResponseError(400, "Invalid schedule id")
      }
      const message = await ScheduleService.deleteSchedule(req.user!, scheduleId)
      res.status(200).json({ message })
    } catch (error) {
      next(error)
    }
  }

  // GET schedule (header) with details by schedule id
  static async getScheduleWithDetailsById(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const scheduleId = Number(req.params.scheduleId)
      if (!Number.isInteger(scheduleId) || scheduleId <= 0) throw new ResponseError(400, "Invalid schedule id")
      const data = await ScheduleService.getScheduleWithDetailsById(req.user!, scheduleId)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  // POST create details for existing schedule
  static async createDetails(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const scheduleId = Number(req.params.scheduleId)
      if (!Number.isInteger(scheduleId) || scheduleId <= 0) throw new ResponseError(400, "Invalid schedule id")
      const inputs = req.body as ScheduleDetailInput[]
      const message = await ScheduleService.createScheduleDetails(req.user!, scheduleId, inputs)
      res.status(201).json({ message })
    } catch (error) {
      next(error)
    }
  }

  // PATCH update entire schedule with details
  static async updateSchedule(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const scheduleId = Number(req.params.scheduleId)
      if (!Number.isInteger(scheduleId) || scheduleId <= 0) throw new ResponseError(400, "Invalid schedule id")
      const reqData = req.body as ScheduleCreateRequest
      const message = await ScheduleService.updateScheduleWithDetails(req.user!, scheduleId, reqData)
      res.status(200).json({ message })
    } catch (error) {
      next(error)
    }
  }
}