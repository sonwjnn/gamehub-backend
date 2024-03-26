import express from 'express'

import memberController from '../controllers/members'
import { isAuthenticated, isOwner } from '../middlewares'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/all', memberController.getAllMembers)
  router.get('/:id', memberController.getMember)
  router.post('/', isAuthenticated, memberController.createMember)
  router.delete('/:id', isAuthenticated, memberController.deleteMemberById)
  router.patch(
    '/:id',
    isAuthenticated,
    requestHandler.validate,
    memberController.updateMemberById
  )

  return router
}
