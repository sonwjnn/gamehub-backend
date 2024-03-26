import express from 'express'

import authController from '../controllers/authentication'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.post('/register', requestHandler.validate, authController.register)
  router.post('/login', authController.login)

  return router
}
