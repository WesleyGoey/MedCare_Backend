import { z, ZodType } from "zod"

export class HistoryValidation {
  static readonly MARK: ZodType = z.object({
    date: z.string().optional(),
    timeTaken: z.string().optional(),
  })
  static readonly SKIP: ZodType = z.object({
    date: z.string().optional(),
  })
  static readonly UNDO: ZodType = z.object({
    date: z.string().optional(),
  })
}