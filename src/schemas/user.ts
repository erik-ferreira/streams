import { z } from "zod"

export const createUserBodySchema = z.object({
  name: z
    .string({ required_error: "Nome obrigatório" })
    .trim()
    .min(1, "Informe pelo menos 1 caractere"),
})
