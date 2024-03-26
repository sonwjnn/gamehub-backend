import express from 'express'
import {
  deleteUserById,
  getUsers,
  getUserById,
  updateUserById,
} from '../db/users'
import responseHandler from '../handlers/response-handler'

export const getAllUsers = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const users = await getUsers()

    return responseHandler.ok(res, users)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

export const deleteUser = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params

    await deleteUserById(id)

    return responseHandler.ok(res, { message: 'Delete user successfully!' })
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

export const updateUser = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params
    const { username } = req.body

    if (!username) {
      return res.sendStatus(400)
    }

    const user = await getUserById(id)

    if (!user) {
      return res.sendStatus(400)
    }

    const updatedUser = await updateUserById(id, { username })

    responseHandler.ok(res, {
      user: updatedUser,
      message: 'Update user successfully!',
    })
  } catch (error) {
    responseHandler.error(res)
  }
}
