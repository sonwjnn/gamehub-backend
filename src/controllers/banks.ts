import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getBankById, getBanks } from '../db/banks'

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

    await db.bank.delete({
      where: {
        id,
      },
    })

    responseHandler.ok(res)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateBankById = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    responseHandler.error(res)
  }
}

const createBank = async (req: Request, res: Response) => {
  try {
    const bank = await db.bank.create({
      data: {
        ...req.body,
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

export default {
  getBank,
  createBank,
  getAllBanks,
  deleteBankById,
  updateBankById,
}
