import { Settings } from "../../generated/prisma"

export interface SettingsCreateUpdateRequest {
  alarmSound?: string
  notificationSound?: string
}

export interface SettingsResponse {
  id: number
  alarmSound: string
  notificationSound: string
}

export function toSettingsResponseList(prismaSettings: Settings[]): SettingsResponse[] {
  return prismaSettings.map((s) => toSettingsResponse(s))
}

export function toSettingsResponse(prismaSettings: Settings): SettingsResponse {
  return {
    id: prismaSettings.id,
    alarmSound: prismaSettings.alarmSound,
    notificationSound: prismaSettings.notificationSound,
  }
}