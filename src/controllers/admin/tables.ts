import { Request, Response } from 'express'
import responseHandler from '../../handlers/response-handler'
import { getTables } from '../../db/tables'

const getAllTables = async (req: Request, res: Response) => {
  try {
    const tables = await getTables()

    responseHandler.ok(res, tables)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

export default {
  getAllTables,
}
