import { z, ZodType } from "zod"

export class ScheduleValidation {
  static readonly CREATE: ZodType = z.object({
    medicineId: z.number().int().positive(),
    scheduleType: z.enum(["DAILY", "WEEKLY"]),
    startDate: z.string().min(1),
    details: z.array(
      z.object({
        time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format"),
        dayOfWeek: z.number().int().min(0).max(6).optional(),
      })
    ).min(1, "At least one schedule detail is required"),
  })

  static readonly UPDATE_DETAIL: ZodType = z.object({
    time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format").optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
  })
}