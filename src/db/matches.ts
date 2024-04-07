import { db } from '../lib/db'

export const getMatches = async () => {
  try {
    const matches = await db.match.findMany({})
    return matches
  } catch (error) {
    return []
  }
}

export const getMatchById = async (id: string) => {
  try {
    const match = await db.match.findFirst({
      where: {
        id,
      },
      include: {
        board: true,
        participants: {
          include: {
            cardOne: true,
            cardTwo: true,
          },
        },
      },
    })
    return match
  } catch (error) {
    return null
  }
}
