import { Message } from '@prisma/client'
import { db } from '../lib/db'

const MESSAGES_BATCH = 10

export const getMessagesByTableId = async ({
  cursor,
  tableId,
}: {
  cursor: string | undefined
  tableId: string
}) => {
  try {
    if (!tableId) {
      throw new Error('Table ID missing')
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
          tableId,
        },
        include: {
          player: {
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
          tableId,
        },
        include: {
          player: {
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
