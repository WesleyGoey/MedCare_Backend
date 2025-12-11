import { Settings } from "../../generated/prisma"
import { ResponseError } from "../error/response-error"
import {
  SettingsCreateUpdateRequest,
  SettingsResponse,
  toSettingsResponse,
  toSettingsResponseList,
} from "../models/setting-model"
import { prismaClient } from "../utils/database-util"
import { SettingsValidation } from "../validations/setting-validation"
import { Validation } from "../validations/validation"
import { UserJWTPayload } from "../models/user-model"

export class SettingsService {
  static async getSettings(user: UserJWTPayload): Promise<SettingsResponse> {
    const userWithSettings = await prismaClient.user.findUnique({
      where: { id: user.id },
      include: { settings: true },
    })

    if (!userWithSettings) {
      throw new ResponseError(401, "Authenticated user not found")
    }

    if (!userWithSettings.settings) {
      const created = await prismaClient.settings.create({ data: {} })
      await prismaClient.user.update({
        where: { id: user.id },
        data: { settingId: created.id },
      })
      return toSettingsResponse(created)
    }

    return toSettingsResponse(userWithSettings.settings)
  }

  static async checkSettingsExists(userId: number): Promise<Settings> {
    const userWithSettings = await prismaClient.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    })

    if (!userWithSettings) {
      throw new ResponseError(401, "Authenticated user not found")
    }

    if (!userWithSettings.settings) {
      throw new ResponseError(404, "Settings not found!")
    }

    return userWithSettings.settings
  }

  static async updateSettings(
    user: UserJWTPayload,
    reqData: Partial<SettingsCreateUpdateRequest>
  ): Promise<string> {
    if (!reqData || Object.keys(reqData).length === 0) {
      throw new ResponseError(400, "No fields to update")
    }

    const validated = Validation.validate(
      (SettingsValidation.CREATE_UPDATE as any).partial(),
      reqData
    )

    // ensure settings exists (create and attach if missing)
    const userWithSettings = await prismaClient.user.findUnique({
      where: { id: user.id },
      include: { settings: true },
    })

    if (!userWithSettings) {
      throw new ResponseError(401, "Authenticated user not found")
    }

    let settingsId = userWithSettings.settings?.id
    if (!settingsId) {
      const created = await prismaClient.settings.create({ data: {} })
      settingsId = created.id
      await prismaClient.user.update({ where: { id: user.id }, data: { settingId: settingsId } })
    }

    const data: any = {}
    const keys: (keyof SettingsCreateUpdateRequest)[] = ["alarmSound", "notificationSound"]
    for (const k of keys) {
      if ((validated as any)[k] !== undefined) data[k] = (validated as any)[k]
    }

    if (Object.keys(data).length === 0) {
      throw new ResponseError(400, "No valid fields provided to update")
    }

    await prismaClient.settings.update({
      where: { id: settingsId },
      data,
    })

    return "Settings have been updated successfully!"
  }
}