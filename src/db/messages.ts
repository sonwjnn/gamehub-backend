import { Message } from '@prisma/client'
import { db } from '../lib/db'

const MESSAGES_BATCH = 10

export const getMessagesByRoomId = async ({
  cursor,
  roomId,
}: {
  cursor: string | undefined
  roomId: string
}) => {
  try {
    if (!roomId) {
      throw new Error('Room ID missing')
    }

    let messages: Message[] = []

    if (cursor) {
      messages = await db.message.findMany({
        take: MESSAGES_BATCH,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where: {
          roomId,
        },
        include: {
          member: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } else {
      messages = await db.message.findMany({
        take: MESSAGES_BATCH,
        where: {
          roomId,
        },
        include: {
          member: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    }

    let nextCursor = null

    if (messages.length === MESSAGES_BATCH) {
      nextCursor = messages[MESSAGES_BATCH - 1].id
    }

    return {
      items: messages,
      nextCursor,
    }
  } catch {
    return []
  }
}
