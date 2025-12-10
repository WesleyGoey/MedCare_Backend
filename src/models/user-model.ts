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