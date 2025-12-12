import express from "express"
import { authMiddleware } from "../middlewares/auth-middleware"
import { MedicineController } from "../controllers/medicine-controller"
import { SettingsController } from "../controllers/setting-controller"
import { UserController } from "../controllers/user-controller"
import { ScheduleController } from "../controllers/schedule-controller"

export const privateRouter = express.Router()

privateRouter.use(authMiddleware)

privateRouter.get("/profile", UserController.getProfile)
privateRouter.patch("/profile", UserController.updateProfile)

privateRouter.get("/settings", SettingsController.getSettings)
privateRouter.patch("/settings", SettingsController.updateSettings)

privateRouter.get("/medicines", MedicineController.getAllMedicines)
privateRouter.get("/medicines/low-stock", MedicineController.checkLowStock)
privateRouter.get("/medicines/:medicineId", MedicineController.getMedicineById)
privateRouter.post("/medicines", MedicineController.addMedicine)
privateRouter.patch("/medicines/:medicineId", MedicineController.updateMedicine)
privateRouter.delete("/medicines/:medicineId", MedicineController.deleteMedicine)

privateRouter.get("/schedules", ScheduleController.getAllScheduleWithDetails)
privateRouter.get("/schedules/by-date", ScheduleController.getScheduleWithDetailsByDate)
privateRouter.get("/schedules/:scheduleId", ScheduleController.getScheduleWithDetailsById)
privateRouter.post("/schedules", ScheduleController.createScheduleWithDetails) //keseluruhan
privateRouter.post("/schedules/:scheduleId/details", ScheduleController.createScheduleDetails) //jamnya
privateRouter.patch("/schedules/:scheduleId", ScheduleController.updateScheduleWithDetails) //keseluruhan
privateRouter.patch("/schedules/details/:detailId", ScheduleController.updateScheduleDetails) //jamnya
privateRouter.delete("/schedules/:scheduleId", ScheduleController.deleteScheduleWithDetails) //keseluruhan
privateRouter.delete("/schedules/details/:detailId", ScheduleController.deleteScheduleDetails) //jamnya