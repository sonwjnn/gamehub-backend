import express from 'express'
import { getUsers, getUserById, updateUserById, deleteUserById } from '../../db/users'
import responseHandler from '../../handlers/response-handler'

const getAllUsers = async (req: express.Request, res: express.Response) => {
    try {
      const users = await getUsers()
  
      return responseHandler.ok(res, users)
    } catch (error) {
      console.log(error)
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

const update = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params
  
      const { image, name } = req.body
  
      const existingUser = await getUserById(id)
  
      if (!existingUser) {
        return responseHandler.badrequest(res, 'User not found')
      }
  
      const updatedUser = await updateUserById(existingUser.id, {
        image,
        name,
      })
  
      responseHandler.ok(res, {
        ...updatedUser,
        message: 'Update user successfully!',
      })
    } catch (error) {
      responseHandler.error(res)
    }
}

const updateAll = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params
  
      const existingUser = await getUserById(id)
  
      if (!existingUser) {
        return responseHandler.badrequest(res, 'User not found')
      }
  
      const updatedUser = await updateUserById(existingUser.id, { ...req.body })
  
      responseHandler.ok(res, {
        ...updatedUser,
        message: 'Update user successfully!',
      })
    } catch (error) {
      responseHandler.error(res)
    }
}


export const deleteUser = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  try {
    const result = await deleteUserById(id);
    
      if (!result) {
          return responseHandler.badrequest(res, "Delete user failed")
      }
      return responseHandler.ok(res, { message: 'Delete user successfully!' })
  } catch {
    throw new Error('Internal Error')
  }
}

export default {
    getAllUsers,
    getUser,
    deleteUser,
    update,
    updateAll,
}