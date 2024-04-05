import express from 'express'

import messageController from '../controllers/messages'
import playerController from '../controllers/players'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.post('/messages', messageController.createMessage)
  router.post('/players', playerController.createPlayer)

  return router
}
