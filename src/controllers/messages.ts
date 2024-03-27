import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getMessagesByRoomId } from '../db/messages'

const getMessages = async (req: Request, res: Response) => {
  try {
    const { roomId, cursor } = req.query

    if (!roomId) {
      return responseHandler.notfound(res)
    }

    const messages = await getMessagesByRoomId({
      roomId: roomId as string,
      cursor: cursor as string,
    })

    return responseHandler.ok(res, messages)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const createMessage = async (req: Request, res: Response) => {
  try {
    const { content, user } = req.body
    const { roomId } = req.query

    if (!content || !user || !roomId) {
      return responseHandler.notfound(res)
    }

    const room = await db.room.findFirst({
      where: {
        id: roomId as string,
      },
      include: {
        members: true,
      },
    })

    if (!room) {
      return responseHandler.badrequest(res, 'Room does not exist')
    }

    const member = room.members.find(member => member.userId === user.id)

    if (!member) {
      return responseHandler.badrequest(
        res,
        'You are not a member of this room'
      )
    }

    const message = await db.message.create({
      data: {
        content,
        roomId: roomId as string,
        memberId: member.id,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    })

    const roomKey = `chat:${roomId}:messages`

    // res?.socket?.server?.io?.emit(roomKey, message)

    return responseHandler.ok(res, message)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

export default {
  getMessages,
  createMessage,
}
