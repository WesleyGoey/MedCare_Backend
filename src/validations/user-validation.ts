import { z, ZodType } from "zod"

export class UserValidation {
    static readonly REGISTER: ZodType = z.object({
        name: z
            .string({
                message: "Name must be string!",
            })
            .min(1, {
                message: "Name can not be empty!",
            }),
        email: z
            .string()
            .email({
                message: "Email format is invalid!",
            })
            .min(1, {
                message: "Email can not be empty!",
            }),
        password: z
            .string({
                message: "Password must be string!",
            })
            .min(8, {
                message: "Password must contain more than or equal to 8 characters!",
            }),
        phone: z
            .string({
                message: "Phone must be string!",
            })
            .min(1, {
                message: "Phone can not be empty!",
            }),
        age: z
            .number({
                message: "Age must be a number!",
            })
            .int()
            .positive({
                message: "Age must be a positive number!",
            }),
    })

    static readonly LOGIN: ZodType = z.object({
        email: z
            .string()
            .email({
                message: "Email format is invalid!",
            })
            .min(1, {
                message: "Email can not be empty!",
            }),
        password: z
            .string({
                message: "Password must be string!",
            })
            .min(8, {
                message: "Password must contain more than or equal to 8 characters!",
            }),
    })

    static readonly UPDATE: ZodType = z.object({
        name: z
            .string({
                message: "Name must be string!",
            })
            .min(1, {
                message: "Name can not be empty!",
            })
            .optional(),
        phone: z
            .string({
                message: "Phone must be string!",
            })
            .min(1, {
                message: "Phone can not be empty!",
            })
            .optional(),
        age: z
            .number({
                message: "Age must be a number!",
            })
            .int({
                message: "Age must be an integer!",
            })
            .positive({
                message: "Age must be a positive number!",
            })
            .optional(),
    })
}