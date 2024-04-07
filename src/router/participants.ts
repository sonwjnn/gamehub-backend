import express from 'express'

import participantController from '../controllers/participants'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', participantController.getAllParticipants)
  router.get('/:id', participantController.getParticipant)
  router.post('/', participantController.createParticipant)
  router.delete('/:id', participantController.removeParticipant)
  router.put(
    '/:id',
    requestHandler.validate,
    participantController.updateParticipantById
  )

  return router
}
