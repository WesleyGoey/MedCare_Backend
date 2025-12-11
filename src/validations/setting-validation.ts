import { z, ZodType } from "zod"

export class SettingsValidation {
  static readonly CREATE_UPDATE: ZodType = z.object({
    alarmSound: z
      .string({ message: "Alarm sound must be string!" })
      .min(1, { message: "Alarm sound can not be empty!" }),

    notificationSound: z
      .string({ message: "Notification sound must be string!" })
      .min(1, { message: "Notification sound can not be empty!" }),
  })
}