import { NextFunction, Response } from "express"
import { UserRequest } from "../models/user-request-model"
import { ResponseError } from "../error/response-error"
import { verifyToken } from "../utils/jwt-util"

export const authMiddleware = (
    req: UserRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers["authorization"]
        const token = authHeader && authHeader.split(" ")[1]

        if (!token) {
            return next(new ResponseError(401, "Unauthorized user!"))
        }

        const payload = verifyToken(token!)

        if (payload) {
            req.user = payload
            return next()
        } else {
            return next(new ResponseError(401, "Unauthorized user!"))
        }
    } catch (error) {
        next(error)
    }
}