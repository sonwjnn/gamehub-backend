import express from 'express'
import jwt from 'jsonwebtoken'

import {
  getUserByEmail,
  createUser,
  updateUserById,
  getUserByUsername,
} from '../db/users'
import { authentication, random } from '../helpers'

export const login = async (req: express.Request, res: express.Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.sendStatus(400)
    }

    const user = await getUserByUsername(username)

    if (!user) {
      return res.sendStatus(400)
    }

    const expectedHash = authentication(user.salt as string, password)

    if (user.password != expectedHash) {
      return res.sendStatus(403)
    }

    const salt = random()
    const token = jwt.sign({ data: user.id }, process.env.SECRET_TOKEN!, {
      expiresIn: '24h',
    })

    const updatedUser = await updateUserById(user.id, {
      salt,
      token,
    })

    res.cookie('SONWIN-AUTH', token, {
      domain: 'localhost',
      path: '/',
    })

    return res.status(200).json(updatedUser).end()
  } catch (error) {
    console.log(error)
    return res.sendStatus(400)
  }
}

export const register = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, username } = req.body

    if (!email || !password || !username) {
      return res.sendStatus(400)
    }

    const existingUser = await getUserByEmail(email)

    if (existingUser) {
      return res.sendStatus(400)
    }

    const token = jwt.sign({ data: username }, process.env.SECRET_TOKEN!, {
      expiresIn: '24h',
    })

    const salt = random()
    const user = await createUser({
      email,
      username,
      salt,
      password: authentication(salt, password),
    })

    return res.status(200).json({ user, token }).end()
  } catch (error) {
    console.log(error)
    return res.sendStatus(400)
  }
}
