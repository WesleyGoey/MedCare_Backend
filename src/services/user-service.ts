import { ResponseError } from "../error/response-error"
import {
    LoginUserRequest,
    RegisterUserRequest,
    toUserResponse,
    UserResponse,
    UserProfileResponse,
    UserUpdateRequest,
    toUserProfileResponse,
} from "../models/user-model"
import { prismaClient } from "../utils/database-util"
import { UserValidation } from "../validations/user-validation"
import { Validation } from "../validations/validation"
import bcrypt from "bcrypt"

export class UserService {
    static async register(request: RegisterUserRequest): Promise<UserResponse> {
        const validatedData = Validation.validate(
            UserValidation.REGISTER,
            request
        )

        const email = await prismaClient.user.findFirst({
            where: {
                email: validatedData.email,
            },
        })

        if (email) {
            throw new ResponseError(400, "Email has already existed!")
        }

        validatedData.password = await bcrypt.hash(validatedData.password, 10)

        const settings = await prismaClient.settings.create({
            data: {},
        })

        const user = await prismaClient.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                password: validatedData.password,
                phone: validatedData.phone,
                age: validatedData.age,
                settings: { connect: { id: settings.id } },
            },
        })

        return toUserResponse(user.id, user.name, user.email)
    }

    static async login(request: LoginUserRequest): Promise<UserResponse> {
        const validatedData = Validation.validate(UserValidation.LOGIN, request)

        const user = await prismaClient.user.findFirst({
            where: {
                email: validatedData.email,
            },
        })

        if (!user) {
            throw new ResponseError(400, "Invalid email or password!")
        }

        const passwordIsValid = await bcrypt.compare(
            validatedData.password,
            user.password
        )

        if (!passwordIsValid) {
            throw new ResponseError(400, "Invalid email or password!")
        }

        return toUserResponse(user.id, user.name, user.email)
    }

    static async getProfile(user: UserJWTPayload): Promise<UserProfileResponse> {
        const dbUser = await prismaClient.user.findUnique({
            where: { id: user.id },
        })

        if (!dbUser) {
            throw new ResponseError(401, "Authenticated user not found")
        }

        return toUserProfileResponse(dbUser)
    }

    static async updateProfile(
        user: UserJWTPayload,
        reqData: Partial<UserUpdateRequest>
    ): Promise<string> {
        if (!reqData || Object.keys(reqData).length === 0) {
            throw new ResponseError(400, "No fields to update")
        }

        const validated = Validation.validate(
            (UserValidation.UPDATE as any).partial(),
            reqData
        )

        const dbUser = await prismaClient.user.findUnique({
            where: { id: user.id },
        })

        if (!dbUser) {
            throw new ResponseError(401, "Authenticated user not found")
        }

        const data: any = {}
        const keys: (keyof UserUpdateRequest)[] = ["name", "phone", "age"]
        for (const k of keys) {
            if ((validated as any)[k] !== undefined) {
                data[k] = (validated as any)[k]
            }
        }

        if (Object.keys(data).length === 0) {
            throw new ResponseError(400, "No valid fields provided to update")
        }

        await prismaClient.user.update({
            where: { id: user.id },
            data,
        })

        return "Profile has been updated successfully!"
    }
}