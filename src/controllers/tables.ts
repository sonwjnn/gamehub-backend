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
    const { minBuyIn, maxBuyIn, name } = req.body

    const table = await db.table.update({
      where: {
        id,
      },
      data: {
        minBuyIn,
        maxBuyIn,
        name,
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
    const { name, userId, minBuyIn, maxBuyIn } = req.body

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

export default {
  getTable,
  createTable,
  getAllTables,
  deleteTableById,
  updateTable,
}
