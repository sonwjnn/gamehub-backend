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
  } catch {
    throw new Error('Internal Error')
  }
}
