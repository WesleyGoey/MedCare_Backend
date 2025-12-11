import { Request, Response, NextFunction } from "express"
import {
    LoginUserRequest,
    RegisterUserRequest,
    UserResponse,
    UserProfileResponse,
    UserUpdateRequest,
} from "../models/user-model"
import { UserService } from "../services/user-service"
import { UserRequest } from "../models/user-request-model"

export class UserController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const request: RegisterUserRequest = req.body as RegisterUserRequest
            const response: UserResponse = await UserService.register(request)

            res.status(200).json({
                data: response,
            })
        } catch (error) {
            next(error)
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const request: LoginUserRequest = req.body as LoginUserRequest
            const response: UserResponse = await UserService.login(request)

            res.status(200).json({
                data: response,
            })
        } catch (error) {
            next(error)
        }
    }

    // --- added: get profile ---
    static async getProfile(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const data: UserProfileResponse = await UserService.getProfile(req.user!)
            res.status(200).json({ data })
        } catch (error) {
            next(error)
        }
    }

    // --- added: update profile ---
    static async updateProfile(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const reqData = req.body as Partial<UserUpdateRequest>
            const message = await UserService.updateProfile(req.user!, reqData)
            res.status(200).json({ message })
        } catch (error) {
            next(error)
        }
    }
}