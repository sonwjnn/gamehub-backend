import { db } from '../lib/db'
import { Participant, Prisma } from '@prisma/client'
import { ParticipantWithPlayer, TableWithPlayers } from '../types'
import { PokerActions } from '../pokergame/actions'

// Table Actions
export const getTables = async () => {
  try {
    const tables = await db.table.findMany({
      include: {
        players: true,
        user: true,
      },
    })

    return tables
  } catch {
    return null
  }
}

export const getTableById = async (id: string) => {
  try {
    const table = await db.table.findUnique({
      where: {
        id,
      },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    })

    return table
  } catch {
    return null
  }
}

export const updateTableById = async (
  id: string,
  data: Prisma.TableUpdateInput
) => {
  try {
    const table = await db.table.update({
      where: {
        id,
      },
      data,
    })

    return table
  } catch (error) {
    throw new Error('Internal Error')
  }
}

const getUnfoldedParticipants = async (currentParticipant: Participant) => {
  const participants = await db.participant.findMany({
    where: {
      matchId: currentParticipant.matchId,
      isFolded: false,
    },
    include: {
      player: {
        include: {
          user: true,
        },
      },
    },
  })

  return participants
}

const endWithoutShowdown = async (winner: ParticipantWithPlayer) => {
  try {
    const currentMatch = await db.match.findUnique({
      where: {
        id: winner.matchId,
      },
      include: {
        participants: true,
      },
    })

    if (!currentMatch) {
      throw new Error('Match not found')
    }

    await db.player.update({
      where: {
        id: winner.player.id,
      },
      data: {
        isTurn: false,
      },
    })

    const updatedWinner = await db.participant.update({
      where: {
        id: winner.id,
      },
      data: {
        bet: 0,
        lastAction: PokerActions.WINNER,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    await db.user.update({
      where: {
        id: winner.player.userId,
      },
      data: {
        chipsAmount: updatedWinner.player.user.chipsAmount + currentMatch.pot,
      },
    })

    await endHand(currentMatch.tableId)
  } catch (error) {
    throw new Error('Table Error')
  }
}

const clearPlayerTurn = async (tableId: string) => {
  try {
    await db.player.updateMany({
      where: {
        tableId,
      },
      data: {
        isTurn: false,
      },
    })
  } catch (error) {
    throw new Error('Internal Error')
  }
}

const endHand = async (tableId: string) => {
  try {
    await clearPlayerTurn(tableId)

    await db.table.update({
      where: {
        id: tableId,
      },
      data: {
        handOver: true,
      },
    })
  } catch (error) {
    throw new Error('Table Error')
  }
}

const isActionComplete = async (participant: Participant) => {
  try {
    const currentPariticipants = await db.participant.findMany({
      where: {
        matchId: participant.matchId,
        isFolded: false,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    const newCurrentParticipants = currentPariticipants.filter(
      participant => participant.player.user.chipsAmount > 0
    )

    if (newCurrentParticipants.length === 0) return true

    return (
      newCurrentParticipants.length === 1 &&
      newCurrentParticipants[0].lastAction === 'CALL'
    )
  } catch {
    throw new Error('Internal Error')
  }
}

const isAllCheckedOrCalled = async (participant: Participant) => {
  try {
    const currentPariticipants = await db.participant.findMany({
      where: {
        matchId: participant.matchId,
        isFolded: false,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    const newCurrentParticipants = currentPariticipants.filter(
      participant => participant.player.user.chipsAmount > 0
    )

    // if (newCurrentParticipants.length === 0) return true

    return newCurrentParticipants.every(
      participant =>
        participant.lastAction === 'CHECK' || participant.lastAction === 'CALL'
    )
  } catch {
    throw new Error('Internal Error')
  }
}

const resetBetsAndActions = async (participant: Participant) => {
  try {
    await db.participant.updateMany({
      where: {
        matchId: participant.matchId,
      },
      data: {
        isChecked: false,
        bet: 0,
        lastAction: '',
      },
    })
  } catch (error) {
    throw new Error('Internal Error')
  }
}

const dealNextStreet = async (participant: Participant) => {
  try {
    await resetBetsAndActions(participant)

    const currentMatch = await db.match.findUnique({
      where: {
        id: participant.matchId,
      },
      include: {
        board: true,
      },
    })

    if (!currentMatch) {
      throw new Error('Match not found')
    }

    if (!currentMatch.isPreFlop && !currentMatch.isFlop) {
      await db.match.update({
        where: {
          id: participant.matchId,
        },
        data: {
          isPreFlop: true,
          isFlop: true,
        },
      })
    }

    if (currentMatch.isFlop && currentMatch.isPreFlop) {
      await db.match.update({
        where: {
          id: participant.matchId,
        },
        data: {
          isTurn: true,
        },
      })
    }

    if (currentMatch.isTurn && currentMatch.isFlop && currentMatch.isPreFlop) {
      await db.match.update({
        where: {
          id: participant.matchId,
        },
        data: {
          isRiver: true,
        },
      })
    }

    if (
      currentMatch.isRiver &&
      currentMatch.isTurn &&
      currentMatch.isFlop &&
      currentMatch.isPreFlop
    ) {
      await db.match.update({
        where: {
          id: participant.matchId,
        },
        data: {
          isShowdown: true,
        },
      })
    }
  } catch (error) {
    throw new Error('Internal Error')
  }
}

const updatePlayerTurn = async (table: TableWithPlayers, playerId: string) => {
  try {
    await clearPlayerTurn(table.id)

    const updatedNextPlayer = await db.player.update({
      where: {
        id: playerId,
      },
      data: {
        isTurn: true,
      },
      include: {
        user: true,
      },
    })

    return updatedNextPlayer
  } catch (error) {
    throw new Error('Internal Error')
  }
}

export const changeTurn = async (
  table: TableWithPlayers,
  participant: Participant
) => {
  try {
    if (!table) {
      throw new Error('Table not found')
    }

    const currentPlayer = table.players.find(player => player.isTurn)

    if (!currentPlayer) {
      throw new Error('Current player not found')
    }

    const unfoldedParticipants = await getUnfoldedParticipants(participant)

    if (unfoldedParticipants.length === 1) {
      await endWithoutShowdown(unfoldedParticipants[0])
      return ''
    }

    const isComplete = await isAllCheckedOrCalled(participant)

    if (isComplete) {
      await dealNextStreet(participant)

      const updatedNextPlayer = await updatePlayerTurn(
        table,
        table.players[0].id
      )

      return updatedNextPlayer.id
    }

    //normal case
    const nextPlayerIndex =
      table.players.findIndex(player => player.id === currentPlayer.id) + 1

    const nextPlayer =
      nextPlayerIndex === table.players.length
        ? table.players[0]
        : table.players[nextPlayerIndex]

    await db.player.update({
      where: {
        id: currentPlayer.id,
      },
      data: {
        isTurn: false,
      },
    })

    const updatedNextPlayer = await db.player.update({
      where: {
        id: nextPlayer.id,
      },
      data: {
        isTurn: true,
      },
      include: {
        user: true,
      },
    })

    return updatedNextPlayer.id
  } catch (error) {
    throw new Error('Internal Error')
  }
}
