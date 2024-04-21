import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'

const getHistoriesByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    const histories = await db.winMessages.findMany({
      where: {
        userId,
      },

      include: {
        match: {
          include: {
            table: true,
          },
        },
      },
    })

    responseHandler.ok(res, histories)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

export default {
  getHistoriesByUserId,
}
