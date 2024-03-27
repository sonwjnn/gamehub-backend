import express from 'express'
import { merge, get } from 'lodash'
import jwt from 'jsonwebtoken'
import { getUserById, getUserByToken } from '../db/users'
import responseHandler from '../handlers/response-handler'

// const tokenDecode = (req: express.Request) => {
//   try {
//     const bearerHeader = req.headers['authorization']
//     if (bearerHeader) {
//       const token = bearerHeader.split(' ')[1]
//       console.log(token)
//       return jwt.verify(token, process.env.SECRET_TOKEN!)
//     }

//     if (req.cookies.token) {
//       const token = req.cookies.token
//       return jwt.verify(token, process.env.SECRET_TOKEN!)
//     }
//     return false
//   } catch (error) {
//     return false
//   }
// }

// export const isAuthenticated = async (
//   req: express.Request,
//   res: express.Response,
//   next: express.NextFunction
// ) => {
//   try {
//     const tokenDecoded = tokenDecode(req)

//     if (!tokenDecoded) {
//       return responseHandler.badrequest(res, 'Invalid token')
//     }

//     const existingUser = await getUserById(tokenDecoded as string)

//     if (!existingUser) {
//       return responseHandler.badrequest(res, 'User not found')
//     }

//     merge(req, { user: existingUser })

//     return next()
//   } catch (error) {
//     console.log(error)
//     return responseHandler.error(res)
//   }
// }

export const isAuthenticated = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const sessionToken = req.cookies['SONWIN-AUTH']

    if (!sessionToken) {
      return res.sendStatus(403)
    }

    const existingUser = await getUserByToken(sessionToken)

    if (!existingUser) {
      return res.sendStatus(403)
    }

    merge(req, { user: existingUser })

    return next()
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

export const isOwner = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { id } = req.params
    const currentUserId = get(req, 'user.id') as unknown as string

    if (!currentUserId) {
      return responseHandler.badrequest(res, 'User not found')
    }

    if (currentUserId.toString() !== id) {
      return responseHandler.badrequest(res, 'You are not the owner')
    }

    next()
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}
