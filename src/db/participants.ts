import { db } from '../lib/db'
import { PokerActions, RaiseType } from '../pokergame/actions'
import { ParticipantWithPlayer } from '../types'

export const getParticipants = async () => {
  try {
    const participant = await db.participant.findMany({})
    return participant
  } catch (error) {
    return []
  }
}

export const getParticipantById = async (id: string) => {
  try {
    const participant = await db.participant.findFirst({
      where: {
        id,
      },
    })
    return participant
  } catch (error) {
    return null
  }
}

export const handlePacticipantFold = async (id: string) => {
  try {
    const participant = await db.participant.update({
      where: {
        id,
      },
      data: {
        isFolded: true,
        lastAction: PokerActions.FOLD,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
        match: true,
      },
    })
    return participant
  } catch (error) {
    return null
  }
}

const raise = async (
  currentParticipant: ParticipantWithPlayer,
  amount: number,
  type: RaiseType
) => {
  try {
    const stack = currentParticipant.player.stack
    const reRaiseAmount = amount - currentParticipant.bet

    if (reRaiseAmount > stack) return

    const participant = await db.participant.update({
      where: {
        id: currentParticipant.id,
      },
      data: {
        bet: amount,
        lastAction: type,
        isAllIn: type === RaiseType.ALLIN,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    await db.player.update({
      where: {
        id: currentParticipant.playerId,
      },
      data: {
        isTurn: false,
        stack: {
          decrement: reRaiseAmount,
        },
      },
    })

    return participant
  } catch {
    return null
  }
}

export const handlePacticipantRaise = async (
  id: string,
  amount: number,
  type: RaiseType
) => {
  try {
    const currentParticipant = await db.participant.findUnique({
      where: {
        id,
      },
      include: {
        match: true,
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!currentParticipant) return null

    const currentMatch = currentParticipant.match

    let addedToPot = amount - currentParticipant.bet

    const updatedCurrentParticipant = await raise(
      currentParticipant,
      amount,
      type
    )

    const updatedMinRaise = currentMatch.callAmount
      ? currentMatch.callAmount +
        (currentParticipant.bet - currentMatch.callAmount) * 2
      : currentParticipant.bet * 2

    await db.match.update({
      where: {
        id: currentMatch.id,
      },
      data: {
        pot: {
          increment: addedToPot,
        },
        callAmount: amount,
        minRaise: updatedMinRaise,
      },
    })

    return updatedCurrentParticipant
  } catch (error) {
    console.log(error)
    return null
  }
}

const callRaise = async (
  currentParticipant: ParticipantWithPlayer,
  amount: number
) => {
  try {
    const stack = currentParticipant.player?.stack
    let amountCalled = amount - currentParticipant.bet
    if (amountCalled >= stack) amountCalled = stack

    const participant = await db.participant.update({
      where: {
        id: currentParticipant.id,
      },
      data: {
        bet: {
          increment: amountCalled,
        },
        lastAction: PokerActions.CALL,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    await db.player.update({
      where: {
        id: currentParticipant.playerId,
      },
      data: {
        isTurn: false,
        stack: {
          decrement: amountCalled,
        },
      },
    })

    return participant
  } catch (error) {
    return null
  }
}

export const handlePacticipantCall = async (id: string) => {
  try {
    const currentParticipant = await db.participant.findUnique({
      where: {
        id,
      },
      include: {
        match: {
          include: {
            sidePots: true,
          },
        },
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!currentParticipant) return null

    const currentMatch = currentParticipant.match

    const stack = currentParticipant.player?.stack

    let addedToPot =
      currentMatch.callAmount > stack + currentParticipant.bet
        ? stack
        : currentMatch.callAmount - currentParticipant.bet

    const updatedCurrentParticipant = await callRaise(
      currentParticipant,
      currentMatch.callAmount
    )

    if (currentMatch.sidePots.length > 0) {
      const lastSidePot =
        currentMatch.sidePots[currentMatch.sidePots.length - 1]
      await db.match.update({
        where: {
          id: currentMatch.id,
        },
        data: {
          sidePots: {
            update: {
              where: {
                id: lastSidePot.id,
              },
              data: {
                amount: {
                  increment: addedToPot,
                },
              },
            },
          },
        },
      })
    } else {
      await db.match.update({
        where: {
          id: currentMatch.id,
        },
        data: {
          pot: {
            increment: addedToPot,
          },
        },
      })
    }

    return updatedCurrentParticipant
  } catch (error) {
    return null
  }
}

export const handlePacticipantCheck = async (id: string) => {
  try {
    const participant = await db.participant.update({
      where: {
        id,
      },
      data: {
        isChecked: true,
        lastAction: PokerActions.CHECK,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
        match: true,
      },
    })
    return participant
  } catch (error) {
    return null
  }
}
