import { shuffle } from 'lodash'
import { db } from '../lib/db'
import { MatchWithParticipants } from '../types'
import { findNextActivePlayer, getTableById, placeBlinds } from './tables'
import { updatePreviousStackPlayers } from './players'

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

export const createMatch = async (tableId: string) => {
  try {
    const table = await getTableById(tableId)

    if (!table) {
      return { match: null, playerId: null }
    }

    await updatePreviousStackPlayers(table.players)

    const participants = table.players.map(player => player.id)

    if (!participants.length) {
      return { match: null, playerId: null }
    }

    const cards = await db.card.findMany()

    const cardConnections = cards.map(card => ({ id: card.id }))

    const deckCards = shuffle(cardConnections)

    const participantCards = [] as any
    for (let i = 0; i < participants.length * 2; i++) {
      participantCards.push(deckCards.pop())
    }

    const boardCards = [] as any
    for (let i = 0; i < 5; i++) {
      boardCards.push(deckCards.pop())
    }

    const deck = await db.deck.create({
      data: {
        tableId: table.id,
        cards: {
          connect: deckCards,
        },
      },
    })

    // find button id
    const oldMatch = await db.match.findFirst({
      where: {
        tableId: table.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    let buttonId = table.players[0].id

    let lastButtonId = oldMatch ? oldMatch.buttonId : ''

    if (lastButtonId) {
      buttonId = findNextActivePlayer(table.players, lastButtonId, 1)
    }

    // minus ante from player stack
    let anteSum = 0
    for (const player of table.players) {
      const updatedStack = player.stack - table.ante

      if (updatedStack >= 0) {
        await db.player.update({
          where: {
            id: player.id,
          },
          data: {
            stack: {
              decrement: table.ante,
            },
          },
        })

        anteSum += table.ante
      }
    }

    // set blinds
    const isHeadUp = table.players.length === 2
    const smallBlindId = isHeadUp
      ? buttonId
      : findNextActivePlayer(table.players, buttonId, 1)
    const bigBlindId = isHeadUp
      ? findNextActivePlayer(table.players, buttonId, 1)
      : findNextActivePlayer(table.players, buttonId, 2)

    const minBet = Math.floor(table.minBuyIn / 200)
    const pot = minBet * 3 + anteSum
    const callAmount = minBet * 2
    const minRaise = minBet * 4

    const match = await db.match.create({
      data: {
        tableId: table.id,
        numberPlayers: table.players.length,
        deckId: deck.id,
        board: {
          connect: boardCards,
        },
        buttonId,
        smallBlindId,
        bigBlindId,
        callAmount,
        pot,
        minBet,
        minRaise,
      },

      include: {
        board: true,
        deck: {
          include: {
            cards: true,
          },
        },
      },
    })

    const participantInputs = participants.map((playerId: string) => ({
      playerId,
      matchId: match.id,
      cardOneId: participantCards.pop().id,
      cardTwoId: participantCards.pop().id,
    }))

    await db.participant.createMany({
      data: participantInputs,
    })

    // update unfold player (default = true -> false)
    await db.participant.updateMany({
      where: {
        matchId: match.id,
      },
      data: {
        isFolded: false,
      },
    })

    // update blinds
    await placeBlinds(table.id, match.id, smallBlindId, match.minBet)
    await placeBlinds(table.id, match.id, bigBlindId, match.minBet * 2)

    // set new turn
    const turnPlayerId =
      table.players.length <= 3
        ? buttonId
        : findNextActivePlayer(table.players, buttonId, 3)
    const updatedPlayer = await db.player.update({
      where: {
        id: turnPlayerId,
        tableId: table.id,
      },
      data: {
        isTurn: true,
      },
      include: {
        user: true,
      },
    })

    const newMatch = (await db.match.findUnique({
      where: {
        id: match.id,
      },
      include: {
        table: true,
        board: true,
        participants: {
          include: {
            player: {
              include: {
                user: true,
              },
            },
            cardOne: true,
            cardTwo: true,
          },
        },
      },
    })) as MatchWithParticipants

    const updatedTable = await db.table.update({
      where: {
        id: table.id,
      },
      data: {
        handOver: false,
      },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    })

    return { match: newMatch, playerId: updatedPlayer.id, table: updatedTable }
  } catch (error) {
    console.log(error)
    return { match: null, playerId: null }
  }
}
