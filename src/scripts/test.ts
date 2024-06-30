import { getHighlightCardsForPlayer } from '../db/poker'

const boardCards = [
  { id: '1', rank: '7', suit: 'D' },
  { id: '2', rank: '10', suit: 'D' },
  { id: '3', rank: '6', suit: 'S' },
  { id: '4', rank: '7', suit: 'S' },
  { id: '5', rank: '8', suit: 'S' },
]
const playerCards = [
  {
    id: '6',
    rank: '9',
    suit: 'S',
  },
  {
    id: '13',
    rank: '1',
    suit: 'D',
  },
]

const test = () => {
  const cards = getHighlightCardsForPlayer(boardCards, playerCards)
}

test()
