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
import matches from './matches'
import histories from './histories'

import usersAdmin from './admin/users'
import tablesAdmin from './admin/tables'

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
  router.use('/api/matches', matches())
  router.use('/api/histories', histories())

  // api routes for admin
  router.use('/api/admin/users', usersAdmin())
  router.use('/api/admin/tables', tablesAdmin())

  return router
}
