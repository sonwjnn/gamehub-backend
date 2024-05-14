import { getHighlightCardsForPlayer } from '../db/poker'

const boardCards = [
  { id: '1', rank: '11', suit: 'D' },
  { id: '2', rank: '12', suit: 'D' },
  { id: '3', rank: '13', suit: 'S' },
  { id: '4', rank: '1', suit: 'S' },
]
const playerCards = [
  {
    id: '5',
    rank: '9',
    suit: 'S',
  },
  {
    id: '6',
    rank: '10',
    suit: 'S',
  },
]

const test = () => {
  const cards = getHighlightCardsForPlayer(boardCards, playerCards)
  console.log(cards)
}

test()
