import { ZodError } from "zod"
import { FastifyInstance } from "fastify"

import { prisma } from "../lib/prisma"
import { createUserBodySchema } from "../schemas/user"

export async function userRoutes(app: FastifyInstance) {
  // list all users
  app.get("/users", async (_, reply) => {
    const users = await prisma.user.findMany()

    return reply.status(200).send({ users })
  })

  app.post("/users", async (request, reply) => {
    try {
      const { name } = createUserBodySchema.parse(request.body)

      const user = await prisma.user.create({
        data: { name },
      })

      reply.code(201).send(user)
    } catch (error) {
      let message = "Não foi possível criar o usuário"

      if (error instanceof ZodError) {
        message = error?.issues[0].message
      }

      console.log(error)

      reply.code(400).send({ message })
    }
  })
}
