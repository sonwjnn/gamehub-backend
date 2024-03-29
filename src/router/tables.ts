import express from 'express'

import tableController from '../controllers/tables'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', tableController.getAllTables)
  router.get('/:id', tableController.getTable)
  router.post('/', tableController.createTable)
  router.delete('/:id', tableController.deleteTableById)
  router.put('/:id', requestHandler.validate, tableController.updateTable)

  return router
}
