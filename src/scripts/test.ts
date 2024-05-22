import { getHighlightCardsForPlayer } from '../db/poker'

const boardCards = [
  { id: '1', rank: '2', suit: 'D' },
  { id: '2', rank: '2', suit: 'S' },
  { id: '3', rank: '3', suit: 'S' },
  { id: '4', rank: '4', suit: 'S' },
  { id: '5', rank: '1', suit: 'S' },
]
const playerCards = [
  {
    id: '6',
    rank: '5',
    suit: 'S',
  },
  {
    id: '7',
    rank: '10',
    suit: 'D',
  },
]

const test = () => {
  const cards = getHighlightCardsForPlayer(boardCards, playerCards)
  console.log(cards)
}

test()
