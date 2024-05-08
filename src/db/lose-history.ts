import { db } from '../lib/db'
import { getTableById } from './tables'

export const createLoseHistories = async (tableId: string, matchId: string) => {
  try {
    const table = await getTableById(tableId)

    if (!table) {
      return null
    }

    const players = table.players

    if (!players.length) {
      return null
    }

    for (const player of players) {
      const amount = player.previousStack - player.stack

      if (amount <= 0) return null

      await db.loseHistory.create({
        data: {
          matchId,
          userId: player.userId,
          amount,
        },
      })
    }
  } catch {
    return null
  }
}
