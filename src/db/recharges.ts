import { db } from '../lib/db'
import { Prisma } from '@prisma/client'

// Recharge Actions
export const getRecharges = async () => {
  try {
    const recharge = await db.recharge.findMany({
      include: {
        bank: {
          include: {
            user: true,
          },
        },
      },
    })

    return recharge
  } catch {
    return null
  }
}

export const getRechargeById = async (id: string) => {
  try {
    const recharge = await db.recharge.findUnique({
      where: {
        id,
      },
    })

    return recharge
  } catch {
    return null
  }
}

export const updateRechargeById = async (
  id: string,
  data: Prisma.RechargeUpdateInput
) => {
  try {
    const recharge = await db.recharge.update({
      where: {
        id,
      },
      data,
    })

    return recharge
  } catch {
    throw new Error('Internal Error')
  }
}
