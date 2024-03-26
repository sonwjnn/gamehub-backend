import { db } from '../lib/db'

export const getMembers = async () => {
  try {
    const members = await db.member.findMany()
    return members
  } catch (error) {
    return []
  }
}

export const getMemberById = async (id: string) => {
  try {
    const member = await db.member.findFirst({
      where: {
        id,
      },
    })
    return member
  } catch (error) {
    return null
  }
}

export const getCurrentMemberOfRoom = async ({
  roomId,
  userId,
}: {
  roomId: string
  userId: string
}) => {
  try {
    const member = await db.member.findFirst({
      where: {
        roomId,
        userId,
      },
    })
    return member
  } catch (error) {
    return null
  }
}

export const getCurrentMemberOfRoomWithUser = async ({
  roomId,
  userId,
}: {
  roomId: string
  userId: string
}) => {
  try {
    const member = await db.member.findFirst({
      where: {
        roomId,
        userId,
      },
      include: {
        user: true,
      },
    })
    return member
  } catch (error) {
    return null
  }
}
