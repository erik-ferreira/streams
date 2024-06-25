import fs from "node:fs"
import path from "node:path"
import { ZodError } from "zod"
import { promisify } from "node:util"
import { pipeline } from "node:stream"
import { randomUUID } from "node:crypto"
import { FastifyInstance } from "fastify"
import fastifyMultipart from "@fastify/multipart"

import { prisma } from "../lib/prisma"
import { createUserBodySchema } from "../schemas/user"

const pump = promisify(pipeline)

export async function userRoutes(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 100, // 100mb
    },
  })

  // list all users
  app.get("/users", async (_, reply) => {
    const users = await prisma.user.findMany()

    return reply.status(200).send({ users })
  })

  // create a new user
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

      reply.code(400).send({ message })
    }
  })

  app.post("/users/upload", async (request, reply) => {
    const data = await request.file()

    if (!data) {
      return reply.status(400).send({ error: "Missing file input" })
    }

    const extension = path.extname(data.filename)

    if (![".mp4", ".png"].includes(extension)) {
      return reply
        .status(400)
        .send({ error: "Invalid file type, please upload a MP4." })
    }

    const fileBaseName = path.basename(data.filename, extension)
    const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`

    const uploadDestination = path.resolve(__dirname, "../tmp", fileUploadName)

    await pump(data.file, fs.createWriteStream(uploadDestination))

    await prisma.video.create({
      data: {
        userId: "c8b03256-fb52-4acc-bb2c-e525dc7eb584",
        url: uploadDestination,
        title: fileBaseName,
      },
    })

    return reply.send({ message: "Upload de arquivo" })
  })
}
