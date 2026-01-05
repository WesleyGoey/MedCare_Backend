import { z, ZodType } from "zod"

export class ScheduleValidation {
  static readonly CREATE: ZodType = z.object({
    medicineId: z.number().int().positive(),
    startDate: z.string().min(1),
    details: z.array(
      z.object({
        time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format"),
      })
    ).min(1, "At least one schedule detail is required"),
  })

  static readonly UPDATE_DETAIL: ZodType = z.object({
    time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format").optional(),
  })
}