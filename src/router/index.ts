import express from 'express'

import authentication from './authentication'
import users from './users'

const router = express.Router()

export default (): express.Router => {
  // api routes for fronend
  router.use('/api/auth', authentication())
  router.use('/api/users', users())

  return router
}
