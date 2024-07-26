import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getTableById } from '../db/tables'
import { PokerActions } from '../pokergame/actions'
import { Table } from '@prisma/client'

const getAllTables = async (req: Request, res: Response) => {
  try {
    const { page } = req.query

    const tableCount = await db.table.count()
    const pageCount = Math.ceil(tableCount / 8)

    const tables = await db.table.findMany({
      include: {
        players: true,
        user: true,
      },
      skip: page ? (Number(page) - 1) * 8 : 0,
      take: 8,
    })

    responseHandler.ok(res, {
      tables,
      pageCount,
    })
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteTableById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const deletedTable = await db.table.delete({
      where: {
        id,
      },
    })

    responseHandler.ok(res, deletedTable)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { minBuyIn, maxBuyIn, name, ante, chatBanned } = req.body

    const table = await db.table.update({
      where: {
        id,
      },
      data: {
        minBuyIn,
        maxBuyIn,
        name,
        ante,
        chatBanned,
      },
    })

    res?.app.get('io').emit(PokerActions.TABLE_UPDATED, {
      table,
    })

    responseHandler.ok(res, table)
  } catch (error) {
    console.log(error)

    responseHandler.error(res)
  }
}

const createTable = async (req: Request, res: Response) => {
  try {
    const { name, userId, minBuyIn } = req.body

    const maxBuyIn = minBuyIn * 100

    const table = await db.table.create({
      data: {
        name,
        userId,
        minBuyIn,
        maxBuyIn,
      },
    })

    responseHandler.ok(res, table)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const table = await getTableById(id)

    responseHandler.ok(res, table)
  } catch (error) {
    responseHandler.error(res)
  }
}

const switchTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { playerId } = req.body
  

    const currentPlayer = await db.player.findUnique({
      where: {
        id: playerId
      }
    })

    let stackOfCurrentUser = currentPlayer?.stack ?? 0;

    const tables = await db.table.findMany({
      where: {
        removedAt: null,
      },
      include: {
        players: true
      },
      orderBy: { 
        minBuyIn: 'asc'
      }
    })

    const notFullTables = tables.filter((table) => table.players.length < table.maxPlayers)

    if (notFullTables.length === 0) {
      responseHandler.badrequest(res, 'No available tables')
    }

    // Get tables with max_buy_in is less than the stack of current player
    const tablesWithMaxBuyInLessThanCurrentStack = notFullTables.filter(
      (table) => table.maxBuyIn <= stackOfCurrentUser)

    if (tablesWithMaxBuyInLessThanCurrentStack.length > 0) {
      const randomTable = tablesWithMaxBuyInLessThanCurrentStack.length === 0 ? tablesWithMaxBuyInLessThanCurrentStack[0] : getRandomTable(tablesWithMaxBuyInLessThanCurrentStack)
      const maxBuyIn = randomTable.maxBuyIn

      const interestAmount = stackOfCurrentUser - maxBuyIn
      stackOfCurrentUser = maxBuyIn

      await updateStackForPlayer({
        amount: stackOfCurrentUser, 
        playerId
      })

      await updateChipsForPlayer({
        amount: interestAmount, 
        playerId,
        type: 'increase'
      })

      await updateTableIdForPlayer({playerId, tableId: randomTable.id})

      responseHandler.ok(res, {
        movedTableId: randomTable.id
      })
      return;
    }

    // Get the table with minimum min_buy_in
    const tableWithTheGreatestMinBuyIn = getRandomTable(notFullTables)

    const minBuyIn = tableWithTheGreatestMinBuyIn.minBuyIn
    if (minBuyIn <= stackOfCurrentUser) {
      const interestAmount = stackOfCurrentUser - minBuyIn
      stackOfCurrentUser = minBuyIn

      await updateStackForPlayer({
        amount: stackOfCurrentUser, 
        playerId
      })

      await updateChipsForPlayer({
        amount: interestAmount, 
        playerId,
        type: 'increase'
      })
    
      await updateTableIdForPlayer({playerId, tableId: tableWithTheGreatestMinBuyIn.id})

      responseHandler.ok(res, {
        movedTableId: tableWithTheGreatestMinBuyIn.id
      })
      return;
    }

    // Recharge for moving table
    const rechargeAmount = minBuyIn - stackOfCurrentUser
    stackOfCurrentUser = minBuyIn

    await updateStackForPlayer({
      amount: stackOfCurrentUser, 
      playerId
    })

    await updateChipsForPlayer({
      amount: rechargeAmount, 
      playerId,
      type: 'decrease'
    })

    await updateTableIdForPlayer({playerId, tableId: tableWithTheGreatestMinBuyIn.id})

    responseHandler.ok(res, {
      movedTableId: tableWithTheGreatestMinBuyIn.id
    })

    return;
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getRandomTable = (tables: Table[]) => {
  const randomIndex = Math.floor(Math.random() * (tables.length - 1))
  return tables[randomIndex]
}

const updateStackForPlayer = async (
{ amount, playerId }: { amount: number; playerId: string }) => {
  try {
    const result = await db.player.update({
      where: {
        id: playerId
      }, 
      data: {
        stack: amount
      }
    })

    return result
  } catch (err) {
    console.error(err)
  }
}

const updateChipsForPlayer = async (
{ 
  amount, 
  playerId, 
  type 
}: { 
  amount: number; 
  playerId: string; 
  type: 'increase' | 'decrease' 
}) => {
  try {
    const currentUser = await db.player.findUnique({
      where: {
        id: playerId
      }, 
      select: {
        userId: true
      }
    })

    if (type === 'increase') {
      const result = await db.user.update({
        where: {
          id: currentUser?.userId
        }, 
        data: {
          chipsAmount: {
            increment: amount
          }
        }
      })

      return result
    }

    const result = await db.user.update({
      where: {
        id: currentUser?.userId
      }, 
      data: {
        chipsAmount: {
          decrement: amount
        }
      }
    })

    return result
  } catch (err) {
    console.error(err)
  }
}

const updateTableIdForPlayer = async (
{
  playerId,
  tableId
} : { playerId: string; tableId: string }
) => {
  try {
    const result = await db.player.update({
      where: {
        id: playerId
      }, 
      data: {
        tableId
      }
    })

    return result
  } catch (err) {
    console.error(err)
  }
}

export default {
  getTable,
  createTable,
  getAllTables,
  deleteTableById,
  updateTable,
  switchTable,
}
