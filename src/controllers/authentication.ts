import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { getUserByEmail, getUserByUsername, updateUserById } from '../db/users'
import { authentication, random } from '../helpers'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'

const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return responseHandler.notfound(res)
    }

    const user = await getUserByUsername(username)

    if (!user) {
      return responseHandler.badrequest(res, 'User does not exist')
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
    responseHandler.error(res)
  }
}

const register = async (req: Request, res: Response) => {
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

    const user = await db.user.create({
      data: {
        email,
        username,
        salt,
        password: authentication(salt, password),
      },
    })

    responseHandler.created(res, {
      user,
      id: user?.id,
      message: 'Sign up successfully!',
    })
  } catch (error) {
    responseHandler.error(res)
  }
}

const newPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { password, newPassword } = req.body

    if (!id || !password) {
      return responseHandler.notfound(res)
    }

    const user = await db.user.findUnique({
      where: {
        id,
      },
    })

    if (!user) {
      return responseHandler.badrequest(res, 'User not found')
    }

    const expectedHash = authentication(user.salt as string, password)

    if (user.password != expectedHash) {
      return responseHandler.badrequest(res, 'Password not match')
    }

    const updatedUser = await updateUserById(user.id, {
      password: authentication(user.salt, newPassword),
    })

    responseHandler.ok(res, {
      user: updatedUser,
      id: user.id,
      message: 'Update password successfully!',
    })
  } catch (error) {
    responseHandler.error(res)
  }
}

const authorization = async (req: Request, res: Response) => {

}

export default {
  login,
  register,
  newPassword,
}
