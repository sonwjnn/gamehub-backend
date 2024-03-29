import express from 'express'

import playerController from '../controllers/players'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', playerController.getAllPlayers)
  router.get('/:id', playerController.getPlayer)
  router.get('/:tableId/:userId', playerController.getCurrentPlayerOfTable)
  router.post('/', playerController.createPlayer)
  router.delete('/:id', playerController.deletePlayerById)
  router.put('/:id', requestHandler.validate, playerController.updatePlayerById)

  return router
}
