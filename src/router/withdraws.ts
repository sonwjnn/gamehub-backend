import express from 'express'

import withdrawController from '../controllers/withdraws'
import { isAuthenticated, isOwner } from '../middlewares'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', withdrawController.getAllWithdraws)
  router.get('/:id', withdrawController.getWithdraw)
  router.post('/', isAuthenticated, withdrawController.createWithdraw)
  router.delete('/:id', isAuthenticated, withdrawController.deleteWithdrawById)
  router.patch(
    '/:id',
    isAuthenticated,
    requestHandler.validate,
    withdrawController.updateWithdrawById
  )

  return router
}
