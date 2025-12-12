import { NextFunction, Response } from "express"
import { UserRequest } from "../models/user-request-model"
import { MedicineService } from "../services/medicine-service"
import { MedicineCreateUpdateRequest } from "../models/medicine-model"
import { ResponseError } from "../error/response-error"

export class MedicineController {
  // Get All Medicine (include schedule with details)
  static async getAllMedicines(req: UserRequest, res: Response, next: NextFunction) {
    try {
      // Support query param: ?includeSchedule=1 to include schedules with details
      const includeSchedule = String(req.query.includeSchedule ?? "").toLowerCase() === "1" || String(req.query.includeSchedule ?? "").toLowerCase() === "true"
      const data = await MedicineService.getAllMedicines(req.user!, includeSchedule)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  // Check Low Stock
  static async checkLowStock(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const data = await MedicineService.checkLowStock(req.user!)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  // Get Medicine By Id (include schedule with details)
  static async getMedicineById(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.medicineId)
      if (!Number.isInteger(id) || id <= 0) {
        throw new ResponseError(400, "Invalid medicine id")
      }
      // Support query param: ?includeSchedule=1 to include schedules with details
      const includeSchedule = String(req.query.includeSchedule ?? "").toLowerCase() === "1" || String(req.query.includeSchedule ?? "").toLowerCase() === "true"
      const data = await MedicineService.getMedicineById(req.user!, id, includeSchedule)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  // Add Medicine
  static async addMedicine(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const reqData = req.body as MedicineCreateUpdateRequest
      const message = await MedicineService.addMedicine(req.user!, reqData)
      res.status(201).json({ message })
    } catch (error) {
      next(error)
    }
  }

  // Update Medicine
  static async updateMedicine(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.medicineId)
      if (!Number.isInteger(id) || id <= 0) {
        throw new ResponseError(400, "Invalid medicine id")
      }
      const reqData = req.body as Partial<MedicineCreateUpdateRequest>
      const message = await MedicineService.updateMedicine(req.user!, id, reqData)
      res.status(200).json({ message })
    } catch (error) {
      next(error)
    }
  }

  // Delete Medicine
  static async deleteMedicine(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.medicineId)
      if (!Number.isInteger(id) || id <= 0) {
        throw new ResponseError(400, "Invalid medicine id")
      }
      const message = await MedicineService.deleteMedicine(req.user!, id)
      res.status(200).json({ message })
    } catch (error) {
      next(error)
    }
  }
}