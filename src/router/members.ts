import express from 'express'

import memberController from '../controllers/members'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', memberController.getAllMembers)
  router.get('/:id', memberController.getMember)
  router.post('/', memberController.createMember)
  router.delete('/:id', memberController.deleteMemberById)
  router.put('/:id', requestHandler.validate, memberController.updateMemberById)

  return router
}
