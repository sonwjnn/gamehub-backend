import express from 'express'

import {
  getAllUsers,
  deleteUserById,
  updateUserById,
} from '../controllers/users'
import { isAuthenticated, isOwner } from '../middlewares'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', isAuthenticated, getAllUsers)
  router.delete('/:id', isAuthenticated, isOwner, deleteUserById)
  router.patch(
    '/:id',
    isAuthenticated,
    isOwner,
    requestHandler.validate,
    updateUserById
  )

  return router
}
