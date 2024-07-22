import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { deleteBank, getBankById, getBanks } from '../db/banks'

const getAllBanks = async (req: Request, res: Response) => {
  try {
    const banks = await getBanks()

    responseHandler.ok(res, banks)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteBankById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await deleteBank(id)

    responseHandler.ok(res)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateBankById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { cardNumber, securityCode, cardHolderName, expiryDate } = req.body

    await db.bank.update({
      where: {
        id,
      },
      data: {
        cardNumber,
        securityCode,
        cardHolderName,
        expiryDate,
      },
    })

    responseHandler.ok(res)
  } catch (error) {
    responseHandler.error(res)
  }
}

const createBank = async (req: Request, res: Response) => {
  try {
    const { cardNumber, securityCode, cardHolderName, expiryDate, userId } =
      req.body

    const bank = await db.bank.create({
      data: {
        cardNumber,
        securityCode,
        cardHolderName,
        expiryDate,
        userId,
      },
    })

    responseHandler.ok(res, bank)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getBank = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const bank = await getBankById(id)

    responseHandler.ok(res, bank)
  } catch (error) {
    responseHandler.error(res)
  }
}

const getBankByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    const bank = await db.bank.findFirst({
      where: {
        userId,
      },
    })

    responseHandler.ok(res, bank)
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  getBank,
  createBank,
  getAllBanks,
  deleteBankById,
  updateBankById,
  getBankByUserId,
}
