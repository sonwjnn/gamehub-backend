import express from 'express'

import bankController from '../controllers/banks'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', bankController.getAllBanks)
  router.get('/:id', bankController.getBank)
  router.get('/user/:userId', bankController.getBankByUserId)
  router.post('/', bankController.createBank)
  router.delete('/:id', bankController.deleteBankById)
  router.put('/:id', requestHandler.validate, bankController.updateBankById)

  return router
}
