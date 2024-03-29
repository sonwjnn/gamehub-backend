import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getTableById, getTables, updateTableById } from '../db/tables'

const getAllTables = async (req: Request, res: Response) => {
  try {
    const tables = await getTables()

    responseHandler.ok(res, tables)
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

    const table = await updateTableById(id, req.body)

    responseHandler.ok(res, table)
  } catch (error) {
    responseHandler.error(res)
  }
}

const createTable = async (req: Request, res: Response) => {
  try {
    const { name, limit, userId } = req.body

    const minBet = limit / 200
    const minRaise = limit / 100

    const table = await db.table.create({
      data: {
        name,
        userId,
        limit,
        minBet,
        minRaise,
        smallBlind: minBet,
        bigBlind: minBet * 2,
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

export default {
  getTable,
  createTable,
  getAllTables,
  deleteTableById,
  updateTable,
}
