import { db } from '../lib/db'
import { Prisma } from '@prisma/client'

// Event Actions
export const getEvents = async () => {
  try {
    const event = await db.event.findMany()

    return event
  } catch {
    return null
  }
}

export const getEventById = async (id: string) => {
  try {
    const event = await db.event.findUnique({
      where: {
        id,
      },
    })

    return event
  } catch {
    return null
  }
}

export const updateEventById = async (
  id: string,
  data: Prisma.EventUpdateInput
) => {
  try {
    const event = await db.event.update({
      where: {
        id,
      },
      data,
    })

    return event
  } catch {
    throw new Error('Internal Error')
  }
}
