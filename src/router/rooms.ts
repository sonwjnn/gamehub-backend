import express from 'express'

import roomController from '../controllers/rooms'
import { isAuthenticated } from '../middlewares'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', roomController.getAllRooms)
  router.get('/:id', roomController.getRoom)
  router.post('/', roomController.createRoom)
  router.delete('/:id', isAuthenticated, roomController.deleteRoomById)
  router.put('/:id', roomController.updateRoom)

  return router
}
