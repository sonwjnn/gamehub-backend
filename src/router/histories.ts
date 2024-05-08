import express from 'express'

import historyController from '../controllers/histories'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/user/:userId', historyController.getHistoriesByUserId)
  router.get(
    '/statistical/:userId/:tableId',
    historyController.getStatisticalByTableId
  )

  return router
}
