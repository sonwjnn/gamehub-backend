import { getParticipants } from './participants'
import { db } from '../lib/db'
import { Match, Participant, Player, Prisma } from '@prisma/client'
import {
  ParticipantWithPlayer,
  ParticipantWithPlayerAndCards,
  TableWithPlayers,
} from '../types'
import { PokerActions } from '../pokergame/actions'
import { getWinner } from './poker'

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

const getUnfoldedParticipants = async (matchId: string) => {
  const participants = await db.participant.findMany({
    where: {
      matchId,
      isFolded: false,
    },
    include: {
      player: {
        include: {
          user: true,
        },
      },
      cardOne: true,
      cardTwo: true,
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
      return null
    }

    await db.player.update({
      where: {
        id: winner.playerId,
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

    await db.match.update({
      where: {
        id: winner.matchId,
      },
      data: {
        winnerId: winner.playerId,
        isShowdown: true,
      },
    })

    await endHand(currentMatch.tableId)
  } catch (error) {
    console.log(error)
    // throw new Error('Table Error')
    return null
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

const isActionComplete = async (matchId: string) => {
  try {
    const currentPariticipants = await db.participant.findMany({
      where: {
        matchId: matchId,
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
    // throw new Error('Internal Error')
    return null
  }
}

const isAllCheckedOrCalled = async (currentMatch: Match) => {
  try {
    const currentPariticipants = await db.participant.findMany({
      where: {
        matchId: currentMatch.id,
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

    return newCurrentParticipants.every(participant => {
      const betMatchesCallAmount =
        currentMatch.callAmount &&
        participant.bet.toFixed(2) === currentMatch.callAmount.toFixed(2)
      const noCallAmountButChecked =
        !currentMatch.callAmount && participant.isChecked

      return betMatchesCallAmount || noCallAmountButChecked
    })
  } catch {
    throw new Error('Check Or Call Error')
  }
}

const resetBetsAndActions = async (matchId: string) => {
  try {
    await db.match.update({
      where: {
        id: matchId,
      },
      data: {
        callAmount: 0,
        minRaise: 0,
      },
    })

    await db.participant.updateMany({
      where: {
        matchId,
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

const determineMainPotWinner = async (matchId: string) => {
  try {
    const currentMatch = await db.match.findUnique({
      where: {
        id: matchId,
      },
    })

    if (!currentMatch) {
      return null
    }

    const winnerParticipant = await determineWinner(matchId, currentMatch.pot)

    if (!winnerParticipant) {
      return null
    }

    const updatedMatch = await db.match.update({
      where: {
        id: matchId,
      },
      data: {
        isShowdown: true,
        winnerId: winnerParticipant.playerId,
      },
    })

    await endHand(updatedMatch.tableId)
  } catch (error) {
    console.log(error)
    return null
  }
}

const determineWinner = async (matchId: string, amount: number) => {
  try {
    const unfoldedParticipants = (await getUnfoldedParticipants(
      matchId
    )) as ParticipantWithPlayerAndCards[]

    if (
      !Array.isArray(unfoldedParticipants) ||
      unfoldedParticipants.length === 0
    ) {
      return null
    }

    const winnerIds = await getWinner(unfoldedParticipants)

    if (!winnerIds?.length) return null

    // TODO: Hoa Bai
    const winnerParticipant = await db.participant.update({
      where: {
        id: winnerIds[0] as string,
      },
      data: {
        bet: 0,
        lastAction: 'WINNER',
      },
    })

    const updatedPlayer = await db.player.update({
      where: {
        id: winnerParticipant.playerId,
      },
      data: {
        isTurn: false,
      },
      include: {
        user: true,
      },
    })

    await db.user.update({
      where: {
        id: updatedPlayer.userId,
      },
      data: {
        chipsAmount: updatedPlayer.user.chipsAmount + amount,
      },
    })

    return winnerParticipant
  } catch (error) {
    console.log(error)
    return null
  }
}

const dealNextStreet = async (matchId: string) => {
  try {
    await resetBetsAndActions(matchId)

    const currentMatch = await db.match.findUnique({
      where: {
        id: matchId,
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
          id: matchId,
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
          id: matchId,
        },
        data: {
          isTurn: true,
        },
      })
    }

    if (currentMatch.isTurn && currentMatch.isFlop && currentMatch.isPreFlop) {
      await db.match.update({
        where: {
          id: matchId,
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
      await determineMainPotWinner(matchId)
    }
  } catch (error) {
    console.log(error)
    return null
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
    return null
  }
}

const findNextPlayerUnfolded = (
  table: TableWithPlayers,
  currentPlayer: Player,
  unfoldedParticipants: Participant[]
) => {
  const sortedOrderByTablePlayers = unfoldedParticipants.sort((a, b) => {
    const playerAIndex = table.players.findIndex(
      player => player.id === a.playerId
    )
    const playerBIndex = table.players.findIndex(
      player => player.id === b.playerId
    )

    if (playerAIndex > playerBIndex) {
      return 1
    } else if (playerAIndex < playerBIndex) {
      return -1
    } else {
      return 0
    }
  })

  //normal case
  const nextPlayerIndex =
    sortedOrderByTablePlayers.findIndex(
      player => player.playerId === currentPlayer.id
    ) + 1

  const nextPlayer =
    nextPlayerIndex === unfoldedParticipants.length
      ? unfoldedParticipants[0]
      : unfoldedParticipants[nextPlayerIndex]

  return nextPlayer.playerId
}

export const changeTurn = async (
  table: TableWithPlayers,
  participant: Participant
) => {
  try {
    if (!table) {
      return ''
    }

    const currentMatch = await db.match.findUnique({
      where: {
        id: participant.matchId,
      },
    })

    if (!currentMatch) {
      return ''
    }

    const currentPlayer = table.players.find(player => player.isTurn)

    if (!currentPlayer) {
      return ''
    }

    const unfoldedParticipants = await getUnfoldedParticipants(
      participant.matchId
    )

    if (unfoldedParticipants.length === 1) {
      await endWithoutShowdown(unfoldedParticipants[0])
      return ''
    }

    const isActionIsComplete = await isActionComplete(participant.matchId)

    if (isActionIsComplete) {
      // this.calculateSidePots()
      while (!currentMatch.isRiver && !table.handOver) {
        dealNextStreet(participant.matchId)
      }

      return ''
    }

    const isComplete = await isAllCheckedOrCalled(currentMatch)

    if (isComplete) {
      await dealNextStreet(participant.matchId)

      const currentTable = await db.table.findUnique({
        where: {
          id: table.id,
        },
      })

      if (!currentTable?.handOver) {
        const nextPlayerId = findNextPlayerUnfolded(
          table,
          currentPlayer,
          unfoldedParticipants
        )

        await updatePlayerTurn(table, nextPlayerId)

        return nextPlayerId
      }
      return ''
    }

    const nextPlayerId = findNextPlayerUnfolded(
      table,
      currentPlayer,
      unfoldedParticipants
    )

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
        id: nextPlayerId,
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
    return ''
  }
}

const getAllInThisTurn = async (matchId: string) => {
  try {
    const getParticipants = await db.participant.findMany({
      where: {
        matchId,
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

    const participants = getParticipants.filter(
      participant =>
        participant.player.user.chipsAmount === 0 && participant.bet > 0
    )

    return participants
  } catch (error) {
    return []
  }
}

const calculateSidePots = async (participant: Participant) => {
  try {
    const allInParticipants = await getAllInThisTurn(participant.matchId)

    const unfoldedParticipants = await getUnfoldedParticipants(
      participant.matchId
    )

    if (allInParticipants.length < 1) return null

    let sortedAllInParticipants = allInParticipants.sort(
      (a, b) => a.bet - b.bet
    )
    if (
      sortedAllInParticipants.length > 1 &&
      sortedAllInParticipants.length === unfoldedParticipants.length
    ) {
      sortedAllInParticipants.pop()
    }

    for (const par of allInParticipants) {
    }
  } catch (error) {
    console.log(error)
    return null
  }
}
