import { Card, CardRank as Rank, CardSuit as Suit } from '@prisma/client'
import { PlayingCard } from '@xpressit/winning-poker-hand-rank/dist/types'

export const formatPriceToVND = (price: number) => {
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  })
  return formatter.format(price)
}

enum CardRank {
  A = 'A',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = 'T',
  J = 'J',
  Q = 'Q',
  K = 'K',
}

enum CardSuit {
  HEARTS = 'H',
  DIAMONDS = 'D',
  CLUBS = 'C',
  SPADES = 'S',
}

export const formatCardForSolver = (card: Card): PlayingCard => {
  return `${CardRank[card.rank]}${CardSuit[card.suit]}` as PlayingCard
}
