import { z, ZodType } from "zod"

export class ReminderValidation {
  static readonly CREATE: ZodType = z.object({
    medicineId: z
      .number({ message: "Medicine ID must be a number!" })
      .int({ message: "Medicine ID must be an integer!" })
      .positive({ message: "Medicine ID must be > 0" }),

    time: z
      .string({ message: "Time must be a valid date string!" })
      .or(z.date({ message: "Time must be a valid date!" }))
      .transform((val) => (typeof val === "string" ? new Date(val) : val))
      .refine((date) => !isNaN(date.getTime()), {
        message: "Time must be a valid date!",
      })
      .refine((date) => date > new Date(), {
        message: "Time must be in the future!",
      }),
  })

  static readonly UPDATE: ZodType = z.object({
    time: z
      .string({ message: "Time must be a valid date string!" })
      .or(z.date({ message: "Time must be a valid date!" }))
      .transform((val) => (typeof val === "string" ? new Date(val) : val))
      .refine((date) => !isNaN(date.getTime()), {
        message: "Time must be a valid date!",
      })
      .optional(),

    status: z
      .enum(["PENDING", "DONE", "MISSED"], {
        message: "Status must be PENDING, DONE, or MISSED!",
      })
      .optional(),
  })
}