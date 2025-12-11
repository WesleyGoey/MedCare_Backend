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

privateRouter.get("/schedules", ScheduleController.getAll) // all schedule details
privateRouter.get("/schedules/by-date", ScheduleController.getByDate) // ?date=YYYY-MM-DD
privateRouter.get("/schedules/details/:detailId", ScheduleController.getDetailById)
privateRouter.post("/schedules", ScheduleController.create)
privateRouter.patch("/schedules/details/:detailId", ScheduleController.updateDetail)
privateRouter.delete("/schedules/details/:detailId", ScheduleController.deleteDetail)
privateRouter.delete("/schedules/:scheduleId", ScheduleController.deleteSchedule)