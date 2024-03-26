import { db } from '../lib/db'
import { Prisma } from '@prisma/client'

// User Actions
export const getUsers = async () => {
  try {
    const user = await db.user.findMany()

    return user
  } catch {
    return null
  }
}

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        email,
      },
    })

    return user
  } catch {
    return null
  }
}

export const getUserByToken = async (token: string) => {
  try {
    const user = await db.user.findFirst({
      where: {
        token,
      },
    })

    return user
  } catch {
    return null
  }
}

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        id,
      },
    })

    return user
  } catch {
    return null
  }
}

export const getUserByUsername = async (username: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        username,
      },
    })

    return user
  } catch {
    return null
  }
}

export const updateUserById = async (
  id: string,
  data: Prisma.UserUpdateInput
) => {
  try {
    const user = await db.user.update({
      where: {
        id,
      },
      data,
    })

    return user
  } catch {
    throw new Error('Internal Error')
  }
}
