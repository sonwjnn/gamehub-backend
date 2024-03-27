import express from 'express'

import roomController from '../controllers/rooms'
import { isAuthenticated, isOwner } from '../middlewares'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', roomController.getAllRooms)
  router.get('/:id', roomController.getRoom)
  router.post('/', isAuthenticated, roomController.createRoom)
  router.delete('/:id', isAuthenticated, roomController.deleteRoomById)
  router.patch(
    '/:id',
    isAuthenticated,
    requestHandler.validate,
    roomController.updateRoomById
  )

  return router
}
