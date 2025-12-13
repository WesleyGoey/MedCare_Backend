import { NextFunction, Response } from "express"
import { HistoryService } from "../services/history-service";
import { UserRequest } from "../models/user-request-model"

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
}