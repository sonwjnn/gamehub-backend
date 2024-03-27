import express from 'express'

import roomController from '../controllers/rooms'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', roomController.getAllRooms)
  router.get('/:id', roomController.getRoom)
  router.post('/', roomController.createRoom)
  router.delete('/:id', roomController.deleteRoomById)
  router.put('/:id', requestHandler.validate, roomController.updateRoom)

  return router
}
