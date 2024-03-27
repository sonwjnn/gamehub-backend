import express from 'express'

import eventController from '../controllers/events'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', eventController.getAllEvents)
  router.get('/:id', eventController.getEvent)
  router.post('/', eventController.createEvent)
  router.delete('/:id', eventController.deleteEventById)
  router.put('/:id', requestHandler.validate, eventController.updateEventById)

  return router
}
