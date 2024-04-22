import express from 'express'

import rechargeController from '../controllers/recharges'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', rechargeController.getAllRecharges)
  router.get('/:id', rechargeController.getRecharge)
  router.get('/bank/:bankId', rechargeController.getAllByBankId)
  router.post('/', rechargeController.createRecharge)
  router.delete('/:id', rechargeController.deleteRechargeById)
  router.put(
    '/:id',
    requestHandler.validate,
    rechargeController.updateRechargeById
  )

  return router
}
