import { Response, NextFunction } from "express";
import { StockService } from "../services/stock-service";
import { UserRequest } from "../models/user-request-model"

export class StockController {
    static async getLowStockAlerts(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await StockService.getLowStock(req.user!);
            res.status(200).json({ 
                data: response,
                message: response.length > 0 ? "Warning: Low stock detected" : "Stock safe"
            });
        } catch (e) {
            next(e);
        }
    }
}