import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getWithdrawById, getWithdraws } from '../db/withdraws'

const getAllWithdraws = async (req: Request, res: Response) => {
  try {
    const withdraws = await getWithdraws()

    responseHandler.ok(res, withdraws)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteWithdrawById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await db.withdraw.delete({
      where: {
        id,
      },
    })

    responseHandler.ok(res)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateWithdrawById = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    responseHandler.error(res)
  }
}

const createWithdraw = async (req: Request, res: Response) => {
  try {
    const {amount, bankId} = req.body

    const requestingWithdraw = await db.withdraw.findFirst({
      where: {
        bankId,
        status:"PENDING"
      },
    })

    if(requestingWithdraw) {
      responseHandler.badrequest(res, "You have a pending withdraw request")
      return
    }

    const withdraw = await db.withdraw.create({
      data: {
        amount, bankId
      },
    })

    responseHandler.ok(res, withdraw)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getWithdraw = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const withdraw = await getWithdrawById(id)

    responseHandler.ok(res, withdraw)
  } catch (error) {
    responseHandler.error(res)
  }
}

const getAllByBankId = async (req: Request, res: Response) => {
  try {
    const { bankId } = req.params

    const withdraws = await db.withdraw.findMany({
      where: {
        bankId,
      },
    })

    responseHandler.ok(res, withdraws)
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  getWithdraw,
  createWithdraw,
  getAllWithdraws,
  deleteWithdrawById,
  updateWithdrawById,
  getAllByBankId,
}
