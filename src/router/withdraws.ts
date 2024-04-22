import express from 'express'

import withdrawController from '../controllers/withdraws'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', withdrawController.getAllWithdraws)
  router.get('/bank/:bankId', withdrawController.getAllByBankId)
  router.get('/:id', withdrawController.getWithdraw)
  router.post('/', withdrawController.createWithdraw)
  router.delete('/:id', withdrawController.deleteWithdrawById)
  router.put(
    '/:id',
    requestHandler.validate,
    withdrawController.updateWithdrawById
  )

  return router
}
