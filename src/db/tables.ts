import { db } from '../lib/db'
import { Prisma } from '@prisma/client'

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

export const startHand = async (tableId: string) => {
  try {
    const table = await db.table.findUnique({
      where: {
        id: tableId,
      },
      include: {
        players: true,
      },
    })

    if (!table) {
      throw new Error('Table not found')
    }

    const players = table.players

    if (players.length < 2) {
      throw new Error('Not enough players')
    }

    const tableUpdate = await db.table.update({
      where: {
        id: tableId,
      },
      data: {
        // status: 'IN_PROGRESS',
      },
    })

    return tableUpdate
  } catch (error) {
    throw new Error('Internal Error')
  }
}
