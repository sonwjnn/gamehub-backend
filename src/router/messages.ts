import express from 'express'

import messageController from '../controllers/messages'
import { isAuthenticated, isOwner } from '../middlewares'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', messageController.getMessages)
  router.post('/', isAuthenticated, isOwner, messageController.createMessage)

  return router
}
