import express from 'express'

import { getAllUsers, deleteUser, updateUser } from '../controllers/users'
import { isAuthenticated, isOwner } from '../middlewares'
import requestHandler from '../handlers/request-handler'

export default (router: express.Router) => {
  router.get('/users', isAuthenticated, getAllUsers)
  router.delete('/users/:id', isAuthenticated, isOwner, deleteUser)
  router.patch(
    '/users/:id',
    isAuthenticated,
    isOwner,
    requestHandler.validate,
    updateUser
  )
}
