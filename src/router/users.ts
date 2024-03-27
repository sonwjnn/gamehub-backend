import express from 'express'

import userController from '../controllers/users'
import { isAuthenticated, isOwner } from '../middlewares'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', userController.getAllUsers)
  router.get('/:id', userController.getUser)
  router.delete('/:id', isAuthenticated, isOwner, userController.deleteUserById)
  router.patch(
    '/:id',
    isAuthenticated,
    isOwner,
    requestHandler.validate,
    userController.update
  )

  return router
}
