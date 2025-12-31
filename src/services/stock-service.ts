import { prismaClient } from "../utils/database-util";
import { UserJWTPayload } from "../models/user-model";

export class StockService {
    
    static async getLowStock(user: UserJWTPayload) {
        const medicines = await prismaClient.medicine.findMany({
            where: {
                userId: user.id
            },
            select: {
                id: true,
                name: true,
                stock: true,
                minStock: true,
            }
        });

        const lowStockMedicines = medicines.filter(med => med.stock <= med.minStock);

        return lowStockMedicines.map(med => ({
            id: med.id,
            name: med.name,
            currentStock: med.stock,
            minStock: med.minStock,
            status: med.stock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK"
        }));
    }
}