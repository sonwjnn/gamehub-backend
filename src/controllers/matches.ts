import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getMatchById, getMatches } from '../db/matches'

const getAllMatches = async (req: Request, res: Response) => {
  try {
    const matches = await getMatches()

    responseHandler.ok(res, matches)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const removeMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const matchExisting = await db.match.findUnique({
      where: {
        id,
      },
    })

    if (!matchExisting) {
      return responseHandler.badrequest(res, 'Match not found')
    }

    await db.match.delete({
      where: {
        id,
      },
    })

    responseHandler.ok(res)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const updateMatchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existingMatch = await getMatchById(id)

    if (!existingMatch) {
      return responseHandler.badrequest(res, 'Match not found')
    }

    const updatedMatch = await db.match.update({
      where: {
        id,
      },
      data: {
        ...req.body,
      },
    })

    responseHandler.ok(res, {
      match: updatedMatch,
      message: 'Update match successfully!',
    })
  } catch (error) {
    responseHandler.error(res)
  }
}

function shuffle(array: any) {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}

const createMatch = async (req: Request, res: Response) => {
  try {
    const { tableId, numberPlayers, participants } = req.body

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
        tableId,
        cards: {
          connect: deckCards,
        },
      },
    })

    const match = await db.match.create({
      data: {
        tableId,
        numberPlayers,
        deckId: deck.id,
        board: {
          connect: boardCards,
        },
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

    const newMatch = await db.match.findUnique({
      where: {
        id: match.id,
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

    responseHandler.ok(res, newMatch)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const match = await getMatchById(id)

    responseHandler.ok(res, match)
  } catch (error) {
    responseHandler.error(res)
  }
}

const getCurrentMatchByTableId = async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params

    const matches = await db.match.findMany({
      where: {
        tableId,
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

    responseHandler.ok(res, matches.pop())
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  getMatch,
  createMatch,
  getAllMatches,
  removeMatch,
  updateMatchById,
  getCurrentMatchByTableId,
}
