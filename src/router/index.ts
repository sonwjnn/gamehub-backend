import express from 'express'

import authentication from './authentication'
import users from './users'
import messages from './messages'
import tables from './tables'
import players from './players'
import events from './events'
import banks from './banks'
import withdraws from './withdraws'
import recharges from './recharges'
import socket from './socket'

const router = express.Router()

export default (): express.Router => {
  // api routes for fronend
  router.use('/api/auth', authentication())
  router.use('/api/users', users())
  router.use('/api/messages', messages())
  router.use('/api/tables', tables())
  router.use('/api/players', players())
  router.use('/api/events', events())
  router.use('/api/banks', banks())
  router.use('/api/withdraws', withdraws())
  router.use('/api/recharges', recharges())
  router.use('/api/socket', socket())

  return router
}
