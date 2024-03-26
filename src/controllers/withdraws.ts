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
    const withdraw = await db.withdraw.create({
      data: {
        ...req.body,
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

export default {
  getWithdraw,
  createWithdraw,
  getAllWithdraws,
  deleteWithdrawById,
  updateWithdrawById,
}
