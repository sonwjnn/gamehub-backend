import express from 'express'

import matchController from '../controllers/matches'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', matchController.getAllMatches)
  router.get('/:id', matchController.getMatch)
  router.get('/table/:tableId', matchController.getCurrentMatchByTableId)
  router.post('/', matchController.createMatch)
  router.delete('/:id', matchController.removeMatch)
  router.put('/:id', requestHandler.validate, matchController.updateMatchById)

  return router
}
