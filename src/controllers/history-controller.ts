import { NextFunction, Response } from "express"
import { HistoryService } from "../services/history-service";
import { UserRequest } from "../models/user-request-model"
import { ResponseError } from "../error/response-error"
import { HistoryValidation } from "../validations/history-validation"
import { Validation } from "../validations/validation"

export class HistoryController {

    // 1. Get All History
    static async getAllHistory(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await HistoryService.getAllHistory(req.user!);
            res.status(200).json({ data: response });
        } catch (e) {
            next(e);
        }
    }

    // 2. Get Weekly Compliance Stats Total (Top Left Figma - Rate, Total, etc)
    static async getWeeklyComplianceStatsTotal(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await HistoryService.getWeeklyComplianceStatsTotal(req.user!);
            res.status(200).json({ data: response });
        } catch (e) {
            next(e);
        }
    }

    // 3. Get Weekly Missed Dose Count
    static async getWeeklyMissedDose(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await HistoryService.getWeeklyMissedDose(req.user!);
            res.status(200).json({ data: response });
        } catch (e) {
            next(e);
        }
    }

    // 4. Get Weekly Compliance Stats (The Array/List for the Table)
    static async getWeeklyComplianceStats(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await HistoryService.getWeeklyComplianceStats(req.user!);
            res.status(200).json({ data: response });
        } catch (e) {
            next(e);
        }
    }

    // 5. Get Recent Activity
    static async getRecentActivity(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await HistoryService.getRecentActivity(req.user!);
            res.status(200).json({ data: response });
        } catch (e) {
            next(e);
        }
    }

    // Mark detail as taken
    static async markAsTaken(req: UserRequest, res: Response, next: NextFunction) {
        try {
            Validation.validate(HistoryValidation.MARK, req.body)
            const detailId = Number(req.params.detailId)
            if (!Number.isInteger(detailId) || detailId <= 0) {
                throw new ResponseError(400, "Invalid detail id")
            }
            const { date, timeTaken } = req.body
            const message = await HistoryService.markDetailAsTaken(req.user!, detailId, date, timeTaken)
            res.status(200).json({ message })
        } catch (e) {
            next(e)
        }
    }

    // Skip / suppress a single occurrence
    static async skipOccurrence(req: UserRequest, res: Response, next: NextFunction) {
        try {
            Validation.validate(HistoryValidation.SKIP, req.body)
            const detailId = Number(req.params.detailId)
            if (!Number.isInteger(detailId) || detailId <= 0) {
                throw new ResponseError(400, "Invalid detail id")
            }
            const { date } = req.body
            const message = await HistoryService.skipDetail(req.user!, detailId, date)
            res.status(200).json({ message })
        } catch (e) {
            next(e)
        }
    }

    // Undo last mark-as-taken for given date
    static async undoMarkAsTaken(req: UserRequest, res: Response, next: NextFunction) {
        try {
            Validation.validate(HistoryValidation.UNDO, req.body)
            const detailId = Number(req.params.detailId)
            if (!Number.isInteger(detailId) || detailId <= 0) {
                throw new ResponseError(400, "Invalid detail id")
            }
            const { date } = req.body
            const message = await HistoryService.undoMarkAsTaken(req.user!, detailId, date)
            res.status(200).json({ message })
        } catch (e) {
            next(e)
        }
    }
}