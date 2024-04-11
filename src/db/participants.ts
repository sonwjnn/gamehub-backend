import { Match, Participant } from '@prisma/client'
import { db } from '../lib/db'
import { PokerActions } from '../pokergame/actions'
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
  amount: number
) => {
  try {
    const chipsAmount = currentParticipant.player?.user?.chipsAmount
    const reRaiseAmount = amount - currentParticipant.bet
    if (reRaiseAmount > chipsAmount) return

    const participant = await db.participant.update({
      where: {
        id: currentParticipant.id,
      },
      data: {
        bet: amount,
        lastAction: PokerActions.RAISE,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    const updatedPlayer = await db.player.update({
      where: {
        id: currentParticipant.playerId,
      },
      data: {
        isTurn: false,
      },
    })

    await db.user.update({
      where: {
        id: updatedPlayer.userId,
      },
      data: {
        chipsAmount: chipsAmount - reRaiseAmount,
      },
    })

    return participant
  } catch {
    return null
  }
}

export const handlePacticipantRaise = async (id: string, amount: number) => {
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

    const updatedCurrentParticipant = await raise(currentParticipant, amount)

    const updatedMinRaise = currentMatch.callAmount
      ? currentMatch.callAmount +
        (currentParticipant.bet - currentMatch.callAmount) * 2
      : currentParticipant.bet * 2

    await db.match.update({
      where: {
        id: currentMatch.id,
      },
      data: {
        pot: currentMatch.pot + addedToPot,
        callAmount: amount,
        minRaise: updatedMinRaise,
      },
    })

    return updatedCurrentParticipant
  } catch (error) {
    return null
  }
}

const callRaise = async (
  currentParticipant: ParticipantWithPlayer,
  match: Match,
  amount: number
) => {
  try {
    const chipsAmount = currentParticipant.player?.user?.chipsAmount
    let amountCalled = amount - currentParticipant.bet
    if (amountCalled >= chipsAmount) amountCalled = chipsAmount

    const participant = await db.participant.update({
      where: {
        id: currentParticipant.id,
      },
      data: {
        bet: currentParticipant.bet + amount,
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

    const updatedPlayer = await db.player.update({
      where: {
        id: currentParticipant.playerId,
      },
      data: {
        isTurn: false,
      },
    })

    await db.user.update({
      where: {
        id: updatedPlayer.userId,
      },
      data: {
        chipsAmount: chipsAmount - amountCalled,
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

    const chipsAmount = currentParticipant.player?.user?.chipsAmount

    let addedToPot =
      currentMatch.callAmount > chipsAmount + currentParticipant.bet
        ? chipsAmount
        : currentMatch.callAmount - currentParticipant.bet

    const updatedCurrentParticipant = await callRaise(
      currentParticipant,
      currentMatch,
      addedToPot
    )

    await db.match.update({
      where: {
        id: currentMatch.id,
      },
      data: {
        pot: currentMatch.pot + addedToPot,
      },
    })

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
