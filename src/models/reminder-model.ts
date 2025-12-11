import { Reminder, ReminderStatus } from "../../generated/prisma"

export interface ReminderCreateRequest {
  medicineId: number
  time: Date
}

export interface ReminderUpdateRequest {
  time?: Date
  status?: ReminderStatus
}

export interface ReminderResponse {
  id: number
  medicineId: number
  time: Date
  status: ReminderStatus
}

export function toReminderResponseList(prismaReminder: Reminder[]): ReminderResponse[] {
  return prismaReminder.map((r) => toReminderResponse(r))
}

export function toReminderResponse(prismaReminder: Reminder): ReminderResponse {
  return {
    id: prismaReminder.id,
    medicineId: prismaReminder.medicineId,
    time: prismaReminder.time,
    status: prismaReminder.status,
  }
}