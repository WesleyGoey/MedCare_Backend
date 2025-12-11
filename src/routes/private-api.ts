import express from "express"
import { authMiddleware } from "../middlewares/auth-middleware"
import { MedicineController } from "../controllers/medicine-controller"
import { ReminderController } from "../controllers/reminder-controller"

export const privateRouter = express.Router()

privateRouter.use(authMiddleware)

privateRouter.get("/settings", SettingsController.getSettings)
privateRouter.patch("/settings", SettingsController.updateSettings)

privateRouter.get("/medicines", MedicineController.getAllMedicine)
privateRouter.get("/medicines/low-stock", MedicineController.checkLowStock)
privateRouter.get("/medicines/:medicineId", MedicineController.getMedicineById)
privateRouter.post("/medicines", MedicineController.addMedicine)
privateRouter.patch("/medicines/:medicineId", MedicineController.updateMedicine)
privateRouter.delete("/medicines/:medicineId", MedicineController.deleteMedicine)

privateRouter.get("/reminders", ReminderController.getAllReminders)
privateRouter.get("/reminders/upcoming", ReminderController.getUpcomingReminders)
privateRouter.get("/reminders/:reminderId", ReminderController.getReminderById)
privateRouter.get("/medicines/:medicineId/reminders", ReminderController.getRemindersByMedicine)
privateRouter.post("/reminders", ReminderController.addReminder)
privateRouter.patch("/reminders/:reminderId", ReminderController.updateReminder)
privateRouter.delete("/reminders/:reminderId", ReminderController.deleteReminder)
