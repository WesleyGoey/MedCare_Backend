import { NextFunction, Response } from "express"
import { UserRequest } from "../models/user-request-model"
import { MedicineService } from "../services/medicine-service"
import { MedicineCreateUpdateRequest } from "../models/medicine-model"

export class MedicineController {
  static async getAllMedicine(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const response = await MedicineService.getAllMedicine(req.user!)
      res.status(200).json({ data: response })
    } catch (error) {
      next(error)
    }
  }

  static async getMedicineById(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const medicineId = Number(req.params.medicineId)
      const response = await MedicineService.getMedicineById(req.user!, medicineId)
      res.status(200).json({ data: response })
    } catch (error) {
      next(error)
    }
  }

  static async addMedicine(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const reqData = req.body as MedicineCreateUpdateRequest
      const response = await MedicineService.addMedicine(req.user!, reqData)
      res.status(201).json({ data: response })
    } catch (error) {
      next(error)
    }
  }

  static async updateMedicine(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const medicineId = Number(req.params.medicineId)
      const reqData = req.body as MedicineCreateUpdateRequest
      const response = await MedicineService.updateMedicine(req.user!, reqData, medicineId)
      res.status(200).json({ data: response })
    } catch (error) {
      next(error)
    }
  }

  static async deleteMedicine(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const medicineId = Number(req.params.medicineId)
      const response = await MedicineService.deleteMedicine(req.user!, medicineId)
      res.status(200).json({ data: response })
    } catch (error) {
      next(error)
    }
  }

  static async checkLowStock(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const response = await MedicineService.checkLowStock(req.user!)
      res.status(200).json({ data: response })
    } catch (error) {
      next(error)
    }
  }
}