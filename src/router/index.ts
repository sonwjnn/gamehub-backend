import express from 'express'

import authentication from './authentication'
import users from './users'
import messages from './messages'
import rooms from './rooms'
import members from './members'
import events from './events'
import banks from './banks'
import withdraws from './withdraws'
import recharges from './recharges'

const router = express.Router()

export default (): express.Router => {
  // api routes for fronend
  router.use('/api/auth', authentication())
  router.use('/api/users', users())
  router.use('/api/messages', messages())
  router.use('/api/rooms', rooms())
  router.use('/api/members', members())
  router.use('/api/events', events())
  router.use('/api/banks', banks())
  router.use('/api/withdraws', withdraws())
  router.use('/api/recharges', recharges())

  return router
}
