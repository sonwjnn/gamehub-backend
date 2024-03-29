import express from 'express'

import messageController from '../controllers/messages'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', messageController.getMessages)

  return router
}
