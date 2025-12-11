import { NextFunction, Response } from "express"
import { UserRequest } from "../models/user-request-model"
import { MedicineService } from "../services/medicine-service"
import { MedicineCreateUpdateRequest } from "../models/medicine-model"
import { ResponseError } from "../error/response-error"

export class MedicineController {
  static async getAllMedicines(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const includeReminders = String(req.query.includeReminders ?? "").toLowerCase()
      if (includeReminders === "1" || includeReminders === "true") {
        const data = await MedicineService.getAllMedicinesWithReminders(req.user!)
        res.status(200).json({ data })
        return
      }
      const data = await MedicineService.getAllMedicines(req.user!)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  static async getMedicineById(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.medicineId)
      if (!Number.isInteger(id) || id <= 0) {
        throw new ResponseError(400, "Invalid medicine id")
      }
      const includeReminders = String(req.query.includeReminders ?? "").toLowerCase()
      if (includeReminders === "1" || includeReminders === "true") {
        const data = await MedicineService.getMedicineByIdWithReminders(req.user!, id)
        res.status(200).json({ data })
        return
      }
      const data = await MedicineService.getMedicineById(req.user!, id)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  static async addMedicine(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const reqData = req.body as MedicineCreateUpdateRequest
      const message = await MedicineService.createMedicine(req.user!, reqData)
      res.status(201).json({ message })
    } catch (error) {
      next(error)
    }
  }

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

  static async checkLowStock(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const data = await MedicineService.checkLowStock(req.user!)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }
}