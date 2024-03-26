import express from 'express'

import { login, register } from '../controllers/authentication'
import requestHandler from '../handlers/request-handler'

export default (router: express.Router) => {
  router.post('/api/auth/register', requestHandler.validate, register)
  router.post('/api/auth/login', login)
}
