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

privateRouter.get("/medicines", MedicineController.getAllMedicines) // supports ?includeReminders=1
privateRouter.get("/medicines/low-stock", MedicineController.checkLowStock)
privateRouter.get("/medicines/:medicineId", MedicineController.getMedicineById) // supports ?includeReminders=1
privateRouter.post("/medicines", MedicineController.addMedicine)
privateRouter.patch("/medicines/:medicineId", MedicineController.updateMedicine)
privateRouter.delete("/medicines/:medicineId", MedicineController.deleteMedicine)

// place schedule-specific routes
privateRouter.get("/schedules", ScheduleController.getAllScheduleWithDetails)
privateRouter.get("/schedules/by-date", ScheduleController.getScheduleWithDetailsByDate)
privateRouter.get("/schedules/:scheduleId", ScheduleController.getScheduleWithDetailsById)
privateRouter.post("/schedules", ScheduleController.createScheduleWithDetails)
privateRouter.post("/schedules/:scheduleId/details", ScheduleController.createScheduleDetails)
privateRouter.patch("/schedules/:scheduleId", ScheduleController.updateScheduleWithDetails)
privateRouter.patch("/schedules/details/:detailId", ScheduleController.updateScheduleDetails)
privateRouter.delete("/schedules/:scheduleId", ScheduleController.deleteScheduleWithDetails)
privateRouter.delete("/schedules/details/:detailId", ScheduleController.deleteScheduleDetails)