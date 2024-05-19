import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getTableById, getTables, updateTableById } from '../db/tables'

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
    const { minBuyIn, maxBuyIn, name, ante } = req.body

    const table = await db.table.update({
      where: {
        id,
      },
      data: {
        minBuyIn,
        maxBuyIn,
        name,
        ante,
      },
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

    const existingTable = await db.table.findUnique({
      where: {
        id,
      },
    })

    if (!existingTable) {
      return responseHandler.badrequest(res, 'Table not found')
    }

    const tables = await db.table.findMany({
      include: {
        players: true,
      },
    })

    const sameBuyInTables = tables.filter(
      table => table.minBuyIn === existingTable.minBuyIn
    )

    // Filter tables that are not full
    const notFullTables = sameBuyInTables.filter(
      table => table.players.length < table.maxPlayers
    )

    // If there are not full tables, use them, otherwise use all tables
    const targetTables =
      notFullTables.length > 0 ? notFullTables : sameBuyInTables

    const currentTableIndex = targetTables.findIndex(
      table => table.id === existingTable.id
    )

    let nextTable = null
    if (currentTableIndex + 1 < targetTables.length) {
      nextTable = targetTables[currentTableIndex + 1]
    } else {
      nextTable = targetTables[0]
    }

    if (!nextTable) {
      return responseHandler.badrequest(res, 'Table not found')
    }

    responseHandler.ok(res, { id: nextTable.id })
  } catch (error) {
    responseHandler.error(res)
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
