import { z, ZodType } from "zod"

export class MedicineValidation {
  static readonly CREATE_UPDATE: ZodType = z.object({
    name: z
      .string({ message: "Name must be string!" })
      .min(1, { message: "Name can not be empty!" }),

    type: z
      .string({ message: "Type must be string!" })
      .min(1, { message: "Type can not be empty!" }),

    dosage: z
      .string({ message: "Dosage must be string!" })
      .min(1, { message: "Dosage can not be empty!" }),

    stock: z
      .number({ message: "Stock must be a number!" })
      .int({ message: "Stock must be an integer!" })
      .min(0, { message: "Stock must be >= 0" }),

    minStock: z
      .number({ message: "minStock must be a number!" })
      .int({ message: "minStock must be an integer!" })
      .min(0, { message: "minStock must be >= 0" }),

    notes: z.string().optional(),
  })
}