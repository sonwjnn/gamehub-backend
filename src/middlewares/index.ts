import express from 'express'
import { merge, get } from 'lodash'
import jwt from 'jsonwebtoken'
import { getUserByToken } from '../db/users'

const tokenDecode = (req: express.Request) => {
  try {
    const bearerHeader = req.headers['authorization']
    if (bearerHeader) {
      const token = bearerHeader.split(' ')[1]
      return jwt.verify(token, process.env.SECRET_TOKEN!)
    }

    if (req.cookies.token) {
      const token = req.cookies.token
      return jwt.verify(token, process.env.SECRET_TOKEN!)
    }
    return false
  } catch (error) {
    return false
  }
}

export const isAuthenticated = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const tokenDecoded = tokenDecode(req)

    if (!tokenDecoded) {
      return res.sendStatus(403)
    }

    const existingUser = await getUserByToken(tokenDecoded as string)

    if (!existingUser) {
      return res.sendStatus(403)
    }

    merge(req, { user: existingUser })

    return next()
  } catch (error) {
    console.log(error)
    return res.sendStatus(400)
  }
}

export const isOwner = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { id } = req.params
    const currentUserId = get(req, 'user.id') as unknown as string

    if (!currentUserId) {
      return res.sendStatus(400)
    }

    if (currentUserId.toString() !== id) {
      return res.sendStatus(403)
    }

    next()
  } catch (error) {
    console.log(error)
    return res.sendStatus(400)
  }
}
