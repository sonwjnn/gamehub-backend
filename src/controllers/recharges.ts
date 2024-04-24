import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getRechargeById, getRecharges } from '../db/recharges'

const getAllRecharges = async (req: Request, res: Response) => {
  try {
    const recharges = await getRecharges()

    responseHandler.ok(res, recharges)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteRechargeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await db.recharge.delete({
      where: {
        id,
      },
    })

    responseHandler.ok(res)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateRechargeById = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    responseHandler.error(res)
  }
}

const createRecharge = async (req: Request, res: Response) => {
  try {
    const { amount, bankId } = req.body

    const requestingRecharge = await db.recharge.findFirst({
      where: {
        bankId,
        status: 'PENDING',
      },
    })

    if (requestingRecharge) {
      responseHandler.badrequest(res, 'You have a pending recharge request')
      return
    }

    const recharge = await db.recharge.create({
      data: {
        amount,
        bankId,
      },
    })

    responseHandler.ok(res, recharge)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getRecharge = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const recharge = await getRechargeById(id)

    responseHandler.ok(res, recharge)
  } catch (error) {
    responseHandler.error(res)
  }
}

const getAllByBankId = async (req: Request, res: Response) => {
  try {
    const { bankId } = req.params

    const recharges = await db.recharge.findMany({
      where: {
        bankId,
      },
    })

    responseHandler.ok(res, recharges)
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  getRecharge,
  createRecharge,
  getAllRecharges,
  deleteRechargeById,
  updateRechargeById,
  getAllByBankId,
}
