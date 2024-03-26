import express from 'express'
import { getUsers, getUserById, updateUserById } from '../db/users'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'

const getAllUsers = async (req: express.Request, res: express.Response) => {
  try {
    const users = await getUsers()

    return responseHandler.ok(res, users)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteUserById = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params

    await db.user.delete({
      where: {
        id,
      },
    })

    return responseHandler.ok(res, { message: 'Delete user successfully!' })
  } catch (error) {
    responseHandler.error(res)
  }
}

const update = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const { username } = req.body

    if (!username) {
      return responseHandler.notfound(res)
    }

    const existingUser = await getUserById(id)

    if (!existingUser) {
      return responseHandler.badrequest(res, 'User not found')
    }

    const updatedUser = await updateUserById(existingUser.id, { username })

    responseHandler.ok(res, {
      user: updatedUser,
      message: 'Update user successfully!',
    })
  } catch (error) {
    responseHandler.error(res)
  }
}

const getUser = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params

    const user = await getUserById(id)

    if (!user) {
      return responseHandler.notfound(res)
    }

    responseHandler.ok(res, user)
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  getAllUsers,
  getUser,
  deleteUserById,
  update,
}
