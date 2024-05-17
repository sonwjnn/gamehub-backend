import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'

const getHistoriesByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    const winHistories = await db.winMessages.findMany({
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

    const loseHistory = await db.loseHistory.findMany({
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

    const formatedWinHistories = winHistories.map(history => ({
      ...history,
      type: 'win',
    }))

    const formatedLoseHistories = loseHistory.map(history => ({
      ...history,
      type: 'lose',
    }))

    responseHandler.ok(
      res,
      [...formatedWinHistories, ...formatedLoseHistories].sort((a, b) => {
        const dateA = new Date(a.createdAt)
        const dateB = new Date(b.createdAt)

        return dateB.getTime() - dateA.getTime()
      })
    )
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getStatisticalByTableId = async (req: Request, res: Response) => {
  try {
    const { userId, tableId } = req.params

    const winHistories = await db.winMessages.findMany({
      where: {
        userId,
        match: {
          tableId,
        },
      },
    })

    const loseHistory = await db.loseHistory.findMany({
      where: {
        userId,
        match: {
          tableId,
        },
      },
    })

    const winAmount = winHistories
      .map(history => history.amount)
      .reduce((acc, cur) => acc + cur, 0)

    const loseAmount = loseHistory
      .map(history => history.amount)
      .reduce((acc, cur) => acc + cur, 0)

    responseHandler.ok(res, {
      winCount: winHistories.length,
      loseCount: loseHistory.length,
      winAmount,
      loseAmount,
    })
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

export default {
  getHistoriesByUserId,
  getStatisticalByTableId,
}
