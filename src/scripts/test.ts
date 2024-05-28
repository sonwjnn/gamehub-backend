import { getHighlightCardsForPlayer } from '../db/poker'

const boardCards = [
  { id: '1', rank: '2', suit: 'D' },
  { id: '2', rank: '11', suit: 'S' },
  { id: '3', rank: '12', suit: 'D' },
  { id: '4', rank: '13', suit: 'S' },
  { id: '5', rank: '1', suit: 'S' },
]
const playerCards = [
  {
    id: '6',
    rank: '10',
    suit: 'S',
  },
  {
    id: '7',
    rank: '6',
    suit: 'D',
  },
]

const test = () => {
  const cards = getHighlightCardsForPlayer(boardCards, playerCards)
}

test()
