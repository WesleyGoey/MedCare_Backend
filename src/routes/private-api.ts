import express from "express"
import { authMiddleware } from "../middlewares/auth-middleware"
import { MedicineController } from "../controllers/medicine-controller"

export const privateRouter = express.Router()

privateRouter.use(authMiddleware)

privateRouter.get("/medicines", MedicineController.getAllMedicine)
privateRouter.get("/medicines/:medicineId", MedicineController.getMedicineById)
privateRouter.post("/medicines", MedicineController.addMedicine)
privateRouter.put("/medicines/:medicineId", MedicineController.updateMedicine)
privateRouter.delete("/medicines/:medicineId", MedicineController.deleteMedicine)
privateRouter.get("/medicines/low-stock", MedicineController.checkLowStock)
