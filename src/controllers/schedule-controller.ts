import { NextFunction, Response } from "express"
import { UserRequest } from "../models/user-request-model"
import { ScheduleService } from "../services/schedule-service"
import { ResponseError } from "../error/response-error"
import { ScheduleCreateRequest, ScheduleDetailUpdateRequest, ScheduleDetailInput } from "../models/schedule-model"

export class ScheduleController {
  // Get All Schedule With Details
  static async getAllScheduleWithDetails(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const data = await ScheduleService.getAllScheduleWithDetails(req.user!)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  // Get Schedule With Details By Date
  static async getScheduleWithDetailsByDate(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const date = String(req.query.date ?? "")
      if (!date) throw new ResponseError(400, "Missing date query parameter")
      const data = await ScheduleService.getScheduleWithDetailsByDate(req.user!, date)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  // Get Schedule With Details By Id
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

  // Create Schedule With Details (keseluruhan)
  static async createScheduleWithDetails(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const reqData = req.body as ScheduleCreateRequest
      const message = await ScheduleService.createScheduleWithDetails(req.user!, reqData)
      res.status(201).json({ message })
    } catch (error) {
      next(error)
    }
  }

  // Create Schedule Details (jam nya)
  static async createScheduleDetails(req: UserRequest, res: Response, next: NextFunction) {
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

  // Update Schedule With Details (keseluruhan)
  static async updateScheduleWithDetails(req: UserRequest, res: Response, next: NextFunction) {
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

  // Update Schedule Details (jam nya)
  static async updateScheduleDetails(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const detailId = Number(req.params.detailId)
      if (!Number.isInteger(detailId) || detailId <= 0) throw new ResponseError(400, "Invalid detail id")
      const reqData = req.body as Partial<ScheduleDetailUpdateRequest>
      const message = await ScheduleService.updateScheduleDetails(req.user!, detailId, reqData)
      res.status(200).json({ message })
    } catch (error) {
      next(error)
    }
  }

  // Delete Schedule With Details (keseluruhan)
  static async deleteScheduleWithDetails(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const scheduleId = Number(req.params.scheduleId)
      if (!Number.isInteger(scheduleId) || scheduleId <= 0) throw new ResponseError(400, "Invalid schedule id")
      const message = await ScheduleService.deleteScheduleWithDetails(req.user!, scheduleId)
      res.status(200).json({ message })
    } catch (error) {
      next(error)
    }
  }

  // Delete Schedule Details (jam nya)
  static async deleteScheduleDetails(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const detailId = Number(req.params.detailId)
      if (!Number.isInteger(detailId) || detailId <= 0) throw new ResponseError(400, "Invalid detail id")
      const message = await ScheduleService.deleteScheduleDetails(req.user!, detailId)
      res.status(200).json({ message })
    } catch (error) {
      next(error)
    }
  }
}