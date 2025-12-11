import { NextFunction, Response } from "express"
import { UserRequest } from "../models/user-request-model"
import { ReminderService } from "../services/reminder-service"
import { ReminderCreateRequest, ReminderUpdateRequest } from "../models/reminder-model"
import { ResponseError } from "../error/response-error"

export class ReminderController {
  static async getAllReminders(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const data = await ReminderService.getAllReminders(req.user!)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  static async getReminderById(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.reminderId)
      if (!Number.isInteger(id) || id <= 0) {
        throw new ResponseError(400, "Invalid reminder id")
      }
      const data = await ReminderService.getReminderById(req.user!, id)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  static async addReminder(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const reqData = req.body as ReminderCreateRequest
      const message = await ReminderService.createReminder(req.user!, reqData)
      res.status(201).json({ message })
    } catch (error) {
      next(error)
    }
  }

  static async updateReminder(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.reminderId)
      if (!Number.isInteger(id) || id <= 0) {
        throw new ResponseError(400, "Invalid reminder id")
      }
      const reqData = req.body as ReminderUpdateRequest
      const message = await ReminderService.updateReminder(req.user!, id, reqData)
      res.status(200).json({ message })
    } catch (error) {
      next(error)
    }
  }

  static async deleteReminder(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.reminderId)
      if (!Number.isInteger(id) || id <= 0) {
        throw new ResponseError(400, "Invalid reminder id")
      }
      const message = await ReminderService.deleteReminder(req.user!, id)
      res.status(200).json({ message })
    } catch (error) {
      next(error)
    }
  }

  static async getUpcomingReminders(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const data = await ReminderService.getUpcomingReminders(req.user!)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  static async getRemindersByMedicine(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const medicineId = Number(req.params.medicineId)
      if (!Number.isInteger(medicineId) || medicineId <= 0) {
        throw new ResponseError(400, "Invalid medicine id")
      }
      const data = await ReminderService.getRemindersByMedicine(req.user!, medicineId)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }
}