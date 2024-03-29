import { CardRank, CardSuit } from '@prisma/client'
import { db } from '../lib/db'

const main = async () => {
  try {
    console.log('Seeding database')

    await db.card.deleteMany()

    const suits = Object.values(CardSuit)

    const ranks = Object.values(CardRank)

    let cards = []

    for (let suit of suits) {
      for (let rank of ranks) {
        cards.push({
          suit: suit as CardSuit,
          rank: rank as CardRank,
        })
      }
    }

    await db.card.createMany({
      data: cards,
    })

    console.log('Seeding finished')
  } catch (error) {
    console.error(error)
    throw new Error('Failed to seed the database')
  }
}

main()
