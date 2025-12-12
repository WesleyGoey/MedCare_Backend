import { prismaClient } from "../utils/database-util";
import { UserJWTPayload } from "../models/user-model";

export class StockService {
    
    static async getLowStock(user: UserJWTPayload) {
        // Ambil obat milik user
        const medicines = await prismaClient.medicine.findMany({
            where: {
                userId: user.id
            },
            select: {
                id: true,
                name: true,
                stock: true,
                minStock: true,
                image: true
            }
        });

        // Filter di level aplikasi (JavaScript)
        // karena membandingkan dua kolom (stock <= minStock) di Prisma `where` clause 
        // membutuhkan fitur experimental atau raw query.
        const lowStockMedicines = medicines.filter(med => med.stock <= med.minStock);

        return lowStockMedicines.map(med => ({
            id: med.id,
            name: med.name,
            currentStock: med.stock,
            minStock: med.minStock,
            image: med.image,
            status: med.stock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK"
        }));
    }
}