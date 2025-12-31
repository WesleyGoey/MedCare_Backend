import { User } from "../../generated/prisma"
import { string } from "zod"
import { generateToken } from "../utils/jwt-util"

export interface UserJWTPayload {
    id: number
    name: string
    email: string
}

export interface RegisterUserRequest {
    name: string
    email: string
    password: string
    phone: string
    age: number
}

export interface LoginUserRequest {
    email: string
    password: string
}

export interface UserResponse {
    token?: string
}

export function toUserResponse(
    id: number,
    name: string,
    email: string
): UserResponse {
    return {
        token: generateToken(
            {
                id: id,
                name: name,
                email: email,
            },
            "1h"
        ),
    }
}

export interface UserProfileResponse {
    id: number
    name: string
    email: string
    phone: string
    age: number
    settingId?: number
}

export interface UserUpdateRequest {
    name?: string
    phone?: string
    age?: number
    currentPassword?: string
    newPassword?: string
}

export function toUserProfileResponse(prismaUser: User): UserProfileResponse {
    return {
        id: prismaUser.id,
        name: prismaUser.name,
        email: prismaUser.email,
        phone: prismaUser.phone,
        age: prismaUser.age,
        settingId: prismaUser.settingId,
    }
}