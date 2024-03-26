import express from 'express'
import jwt from 'jsonwebtoken'

import {
  getUserByEmail,
  createUser,
  updateUserById,
  getUserByUsername,
} from '../db/users'
import { authentication, random } from '../helpers'
import responseHandler from '../handlers/response-handler'

export const login = async (req: express.Request, res: express.Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.sendStatus(400)
    }

    const user = await getUserByUsername(username)

    if (!user) {
      return responseHandler.badrequest(res, 'User not exist')
    }

    const expectedHash = authentication(user.salt as string, password)

    if (user.password != expectedHash) {
      return responseHandler.badrequest(res, 'Password not match')
    }

    const salt = random()
    const updateToken = authentication(salt, user.id.toString())

    const updatedUser = await updateUserById(user.id, {
      token: updateToken,
    })

    res.cookie('SONWIN-AUTH', updateToken, {
      domain: 'localhost',
      path: '/',
    })

    responseHandler.created(res, {
      user: updatedUser,
      id: user.id,
      msg: 'Login successfully!',
    })
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

export const register = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, username } = req.body

    if (!email || !password || !username) {
      return responseHandler.notfound(res)
    }

    const existingUser = await getUserByEmail(email)

    if (existingUser) {
      return responseHandler.badrequest(res, 'User name already used')
    }

    const salt = random()
    const user = await createUser({
      email,
      username,
      salt,
      password: authentication(salt, password),
    })

    responseHandler.created(res, {
      user,
      id: user?.id,
      message: 'Sign up successfully!',
    })
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}
