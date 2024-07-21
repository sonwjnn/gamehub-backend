import express from 'express'

import userController from '../../controllers/users'
import requestHandler from '../../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', userController.getAllUsers)
  router.get('/:id', userController.getUser)
  router.delete('/:id', userController.deleteUser)
  router.put('/:id', requestHandler.validate, userController.updateAll)

  return router
}
