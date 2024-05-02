import { db } from '../lib/db'
import { Prisma } from '@prisma/client'

// Bank Actions
export const getBanks = async () => {
  try {
    const bank = await db.bank.findMany({
      include: {
        user: true,
      },
    })

    return bank
  } catch {
    return null
  }
}

export const getBankById = async (id: string) => {
  try {
    const bank = await db.bank.findUnique({
      where: {
        id,
      },
    })

    return bank
  } catch {
    return null
  }
}

export const updateBankById = async (
  id: string,
  data: Prisma.BankUpdateInput
) => {
  try {
    const bank = await db.bank.update({
      where: {
        id,
      },
      data,
    })

    return bank
  } catch {
    throw new Error('Internal Error')
  }
}
