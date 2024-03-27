import express from 'express'

import bankController from '../controllers/banks'
import { isAuthenticated } from '../middlewares'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', bankController.getAllBanks)
  router.get('/:id', bankController.getBank)
  router.post('/', isAuthenticated, bankController.createBank)
  router.delete('/:id', isAuthenticated, bankController.deleteBankById)
  router.patch(
    '/:id',
    isAuthenticated,
    requestHandler.validate,
    bankController.updateBankById
  )

  return router
}
