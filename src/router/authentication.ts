import express from 'express'

import { login, register } from '../controllers/authentication'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.post('/register', requestHandler.validate, register)
  router.post('/login', login)

  return router
}
