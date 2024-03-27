import express from 'express'

import eventController from '../controllers/events'
import { isAuthenticated, isOwner } from '../middlewares'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', eventController.getAllEvents)
  router.get('/:id', eventController.getEvent)
  router.post('/', isAuthenticated, eventController.createEvent)
  router.delete('/:id', isAuthenticated, eventController.deleteEventById)
  router.patch(
    '/:id',
    isAuthenticated,
    requestHandler.validate,
    eventController.updateEventById
  )

  return router
}
