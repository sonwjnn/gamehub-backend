import { db } from '../lib/db'
import { Prisma } from '@prisma/client'

// Withdraw Actions
export const getWithdraws = async () => {
  try {
    const withdraw = await db.withdraw.findMany({
      include: {
        bank: {
          include: {
            user: true,
          },
        },
      },
    })

    return withdraw
  } catch {
    return null
  }
}

export const getWithdrawById = async (id: string) => {
  try {
    const withdraw = await db.withdraw.findUnique({
      where: {
        id,
      },
    })

    return withdraw
  } catch {
    return null
  }
}

export const updateWithdrawById = async (
  id: string,
  data: Prisma.WithdrawUpdateInput
) => {
  try {
    const withdraw = await db.withdraw.update({
      where: {
        id,
      },
      data,
    })

    return withdraw
  } catch {
    throw new Error('Internal Error')
  }
}
