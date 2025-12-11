import { NextFunction, Response } from "express"
import { UserRequest } from "../models/user-request-model"
import { SettingsService } from "../services/settings-service"
import { SettingsCreateUpdateRequest } from "../models/settings-model"
import { ResponseError } from "../error/response-error"

export class SettingsController {
  static async getSettings(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const data = await SettingsService.getSettings(req.user!)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  static async updateSettings(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const reqData = req.body as Partial<SettingsCreateUpdateRequest>
      const message = await SettingsService.updateSettings(req.user!, reqData)
      res.status(200).json({ message })
    } catch (error) {
      next(error)
    }
  }
}