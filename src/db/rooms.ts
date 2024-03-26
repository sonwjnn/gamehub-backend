import { db } from '../lib/db'
import { Prisma } from '@prisma/client'

// Room Actions
export const getRooms = async () => {
  try {
    const room = await db.room.findMany()

    return room
  } catch {
    return null
  }
}

export const getRoomById = async (id: string) => {
  try {
    const room = await db.room.findUnique({
      where: {
        id,
      },
    })

    return room
  } catch {
    return null
  }
}

export const updateRoomById = async (
  id: string,
  data: Prisma.RoomUpdateInput
) => {
  try {
    const room = await db.room.update({
      where: {
        id,
      },
      data,
    })

    return room
  } catch {
    throw new Error('Internal Error')
  }
}
