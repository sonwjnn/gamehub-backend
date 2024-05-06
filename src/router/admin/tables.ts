import express from 'express'

import tableAdminController from '../../controllers/admin/tables'
import requestHandler from '../../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', tableAdminController.getAllTables)

  return router
}
