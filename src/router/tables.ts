import express from 'express'

import tableController from '../controllers/tables'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', tableController.getAllTables)
  router.get('/:id', tableController.getTable)
  router.post('/switch/:id', tableController.switchTable)
  router.post('/', tableController.createTable)
  router.put('/:id', requestHandler.validate, tableController.updateTable)
  router.delete('/:id', tableController.deleteTableById)

  return router
}
