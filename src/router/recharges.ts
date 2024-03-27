import express from 'express'

import rechargeController from '../controllers/recharges'
import { isAuthenticated, isOwner } from '../middlewares'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', rechargeController.getAllRecharges)
  router.get('/:id', rechargeController.getRecharge)
  router.post('/', isAuthenticated, rechargeController.createRecharge)
  router.delete('/:id', isAuthenticated, rechargeController.deleteRechargeById)
  router.patch(
    '/:id',
    isAuthenticated,
    requestHandler.validate,
    rechargeController.updateRechargeById
  )

  return router
}
