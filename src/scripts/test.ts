import { getHighlightCardsForPlayer } from '../db/poker'

const boardCards = [
  { id: '1', rank: '11', suit: 'D' },
  { id: '2', rank: '7', suit: 'D' },
  { id: '3', rank: '8', suit: 'S' },
  // { id: '4', rank: '1', suit: 'S' },
]
const playerCards = [
  {
    id: '5',
    rank: '2',
    suit: 'S',
  },
  {
    id: '6',
    rank: '3',
    suit: 'S',
  },
]

const test = () => {
  const cards = getHighlightCardsForPlayer(boardCards, playerCards)
  console.log(cards)
}

test()
