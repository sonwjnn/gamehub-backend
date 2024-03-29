import { db } from '../lib/db'

export const getPlayers = async () => {
  try {
    const players = await db.player.findMany()
    return players
  } catch (error) {
    return []
  }
}

export const getPlayerById = async (id: string) => {
  try {
    const player = await db.player.findFirst({
      where: {
        id,
      },
    })
    return player
  } catch (error) {
    return null
  }
}

export const getCurrentPlayerOfTable = async ({
  tableId,
  userId,
}: {
  tableId: string
  userId: string
}) => {
  try {
    const player = await db.player.findFirst({
      where: {
        tableId,
        userId,
      },
    })
    return player
  } catch (error) {
    return null
  }
}

export const getCurrentPlayerOfTableWithUser = async ({
  tableId,
  userId,
}: {
  tableId: string
  userId: string
}) => {
  try {
    const player = await db.player.findFirst({
      where: {
        tableId,
        userId,
      },
      include: {
        user: true,
      },
    })
    return player
  } catch (error) {
    return null
  }
}
