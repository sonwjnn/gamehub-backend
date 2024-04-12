import { db } from '../lib/db'
import { getTableById } from './tables'

export const getPlayers = async () => {
  try {
    const players = await db.player.findMany({
      include: {
        user: true,
        table: true,
      },
    })
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

export const removePlayerBySocketId = async (socketId: string) => {
  try {
    const existingPlayer = await db.player.findFirst({
      where: {
        socketId,
      },
    })

    if (!existingPlayer) {
      return
    }

    const player = await db.player.delete({
      where: {
        id: existingPlayer.id,
      },
      include: {
        user: true,
      },
    })

    const updatedTable = await getTableById(player.tableId)

    return { ...player, table: updatedTable }
  } catch (error) {
    console.log(error)

    return null
  }
}
