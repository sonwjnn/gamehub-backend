import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getMessagesByTableId } from '../db/messages'

const getMessages = async (req: Request, res: Response) => {
  try {
    const { tableId, cursor } = req.query

    if (!tableId) {
      return responseHandler.notfound(res)
    }

    const messages = await getMessagesByTableId({
      tableId: tableId as string,
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
    const { content, user, stickerImageSrc } = req.body
    const { tableId } = req.query

    if (!user || !tableId || (!content && !stickerImageSrc)) {
      return responseHandler.notfound(res)
    }

    const table = await db.table.findFirst({
      where: {
        id: tableId as string,
      },
      include: {
        players: true,
      },
    })

    if (!table) {
      return responseHandler.badrequest(res, 'Table does not exist')
    }

    const player = table.players.find(player => player.userId === user.id)

    if (!player) {
      return responseHandler.badrequest(
        res,
        'You are not a player of this table'
      )
    }

    const message = await db.message.create({
      data: {
        content: content || '',
        stickerImageSrc: stickerImageSrc || '',
        tableId: tableId as string,
        playerId: player.id,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    const tableKey = `chat:${tableId}:messages`

    res?.app.get('io').emit(tableKey, message)

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
