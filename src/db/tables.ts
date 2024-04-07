import { db } from '../lib/db'
import { Prisma } from '@prisma/client'
import { TableWithPlayers } from '../types'

// Table Actions
export const getTables = async () => {
  try {
    const tables = await db.table.findMany({
      include: {
        players: true,
        user: true,
      },
    })

    return tables
  } catch {
    return null
  }
}

export const getTableById = async (id: string) => {
  try {
    const table = await db.table.findUnique({
      where: {
        id,
      },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    })

    return table
  } catch {
    return null
  }
}

export const updateTableById = async (
  id: string,
  data: Prisma.TableUpdateInput
) => {
  try {
    const table = await db.table.update({
      where: {
        id,
      },
      data,
    })

    return table
  } catch (error) {
    throw new Error('Internal Error')
  }
}

export const changeTurn = async (table: TableWithPlayers) => {
  try {
    if (!table) {
      throw new Error('Table not found')
    }

    const currentPlayer = table.players.find(player => player.isTurn)

    if (!currentPlayer) {
      throw new Error('Current player not found')
    }

    const nextPlayerIndex =
      table.players.findIndex(player => player.id === currentPlayer.id) + 1

    const nextPlayer =
      nextPlayerIndex === table.players.length
        ? table.players[0]
        : table.players[nextPlayerIndex]

    await db.player.updateMany({
      where: {
        id: currentPlayer.id,
      },
      data: {
        isTurn: false,
      },
    })

    const updatedNextPlayer = await db.player.update({
      where: {
        id: nextPlayer.id,
      },
      data: {
        isTurn: true,
      },
      include: {
        user: true,
      },
    })

    return updatedNextPlayer
  } catch (error) {
    throw new Error('Internal Error')
  }
}
