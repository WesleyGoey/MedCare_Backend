import { NextFunction, Response } from "express";
import { HistoryService } from "../services/history-service";
import { UserRequest } from "../models/user-request-model";
import { ResponseError } from "../error/response-error";
import { HistoryValidation } from "../validations/history-validation";
import { Validation } from "../validations/validation";

export class HistoryController {
    static async getAllHistory(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await HistoryService.getAllHistory(req.user!);
            res.status(200).json({ data: response });
        } catch (e) { next(e); }
    }

    static async getWeeklyComplianceStatsTotal(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await HistoryService.getWeeklyComplianceStatsTotal(req.user!);
            res.status(200).json({ data: response });
        } catch (e) { next(e); }
    }

    static async getWeeklyMissedDose(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await HistoryService.getWeeklyMissedDose(req.user!);
            res.status(200).json({ data: response });
        } catch (e) { next(e); }
    }

    static async getWeeklyComplianceStats(req: UserRequest, res: Response, next: NextFunction) {
        try {
            // ✅ FIXED: Sekarang memanggil getWeeklyComplianceStats (Array), bukan Total (Number)
            const response = await HistoryService.getWeeklyComplianceStats(req.user!);
            res.status(200).json({ data: response });
        } catch (e) { next(e); }
    }

    static async getRecentActivity(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await HistoryService.getRecentActivity(req.user!);
            res.status(200).json({ data: response });
        } catch (e) { next(e); }
    }

    static async markAsTaken(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const request = Validation.validate(HistoryValidation.MARK, req.body);
            const detailId = Number(req.params.detailId);
            if (isNaN(detailId) || detailId <= 0) throw new ResponseError(400, "Invalid detail id");
            
            const message = await HistoryService.markDetailAsTaken(req.user!, detailId, request.date, request.timeTaken);
            res.status(200).json({ message });
        } catch (e) { next(e); }
    }

    static async skipOccurrence(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const request = Validation.validate(HistoryValidation.SKIP, req.body);
            const detailId = Number(req.params.detailId);
            if (isNaN(detailId) || detailId <= 0) throw new ResponseError(400, "Invalid detail id");

            const message = await HistoryService.skipDetail(req.user!, detailId, request.date);
            res.status(200).json({ message });
        } catch (e) { next(e); }
    }

    static async undoMarkAsTaken(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const request = Validation.validate(HistoryValidation.UNDO, req.body);
            const detailId = Number(req.params.detailId);
            if (isNaN(detailId) || detailId <= 0) throw new ResponseError(400, "Invalid detail id");

            const message = await HistoryService.undoMarkAsTaken(req.user!, detailId, request.date);
            res.status(200).json({ message });
        } catch (e) { next(e); }
    }
}