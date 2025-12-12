import { NextFunction, Response } from "express"
import { HistoryService } from "../services/history-service";
import { UserRequest } from "../models/user-request-model"

export class HistoryController {

    static async getAll(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await HistoryService.getAll(req.user!);
            res.status(200).json({ data: response });
        } catch (e) {
            next(e);
        }
    }

    static async getWeekly(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await HistoryService.getWeekly(req.user!);
            res.status(200).json({ data: response });
        } catch (e) {
            next(e);
        }
    }

    static async getRecent(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await HistoryService.getRecent(req.user!);
            res.status(200).json({ data: response });
        } catch (e) {
            next(e);
        }
    }

    static async getStats(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const compliance = await HistoryService.getComplianceRate(req.user!);
            // missedCount sudah termasuk di dalam compliance object, tapi jika butuh endpoint terpisah:
            // const missed = await HistoryService.getMissedCount(req.user!);
            
            res.status(200).json({
                data: {
                    compliance,
                    // missedCount: compliance.missed 
                }
            });
        } catch (e) {
            next(e);
        }
    }
}