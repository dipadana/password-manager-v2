import { NextFunction, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { hash, verify } from '../helpers/hash'
import { generateToken } from '../helpers/jwt'
import { LoggedUser } from '../entities/user.entity'

const prisma = new PrismaClient()

class User {
  static async getUser(_: Request, res: Response) {
    const usersData = await prisma.user.findMany()
    res.status(200).json(usersData)
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, key, name } = req.body

      await prisma.user.create({
        data: {
          name,
          email,
          key: await hash(key),
        },
      })

      res.status(201).json({ message: 'Register success' })
    } catch (err) {
      next(err)
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, key } = req.body

      const data = await prisma.user.findUnique({
        where: { email },
      })
      if (data) {
        const valid = await verify(data.key, key)
        if (valid) {
          const loggedUser: LoggedUser = {
            id: data.id,
            email: data.email,
            key,
          }
          res.status(200).json({ token: generateToken(loggedUser) })
        } else {
          throw { statusCode: 400, message: 'Credential error' }
        }
      } else {
        throw { statusCode: 404, message: 'Email not registered' }
      }
    } catch (err) {
      next(err)
    }
  }
}

export default User
