import { rankHands } from '@xpressit/winning-poker-hand-rank'
import { PlayingCard } from '@xpressit/winning-poker-hand-rank/dist/types'

const test = () => {
  const gameType = 'texas'
  const board = ['2D', '3D', '4S', '5S', '6S'] as [
    PlayingCard,
    PlayingCard,
    PlayingCard,
    PlayingCard,
    PlayingCard,
  ]
  const player1Cards = ['KC', 'QS'] as [PlayingCard, PlayingCard]
  const player2Cards = ['9D', 'TD'] as [PlayingCard, PlayingCard]

  const result = rankHands(gameType, board, [player1Cards, player2Cards])
}

test()
