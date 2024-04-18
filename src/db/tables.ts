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

    await db.player.update({
      where: {
        id: winner.player.id,
      },
      data: {
        stack: updatedWinner.player.stack + currentMatch.pot,
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
    return null
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
    return null
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
      participant => participant.player.stack > 0
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
      participant => participant.player.stack > 0
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

const resetBetsAndActions = async (matchId: string, limit: number) => {
  try {
    await db.match.update({
      where: {
        id: matchId,
      },
      data: {
        callAmount: 0,
        minRaise: limit / 200,
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
      include: {
        table: true,
      },
    })

    await endHand(updatedMatch.tableId)

    return updatedMatch
  } catch (error) {
    console.log(error)
    return null
  }
}

const determineSidePotWinners = async (matchId: string) => {
  try {
    const currentMatch = await db.match.findUnique({
      where: {
        id: matchId,
      },
      include: {
        sidePots: true,
      },
    })

    if (!currentMatch) return null

    if (currentMatch.sidePots.length < 0) return null

    currentMatch.sidePots.map(async sidePot => {
      const winnerParticipant = await determineWinner(matchId, sidePot.amount)

      if (!winnerParticipant) {
        return null
      }

      return winnerParticipant
    })
  } catch {
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

    await db.player.update({
      where: {
        id: winnerParticipant.playerId,
      },
      data: {
        isTurn: false,
        stack: {
          increment: amount,
        },
      },
      include: {
        user: true,
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
    const currentMatch = await db.match.findUnique({
      where: {
        id: matchId,
      },
      include: {
        table: true,
        board: true,
      },
    })

    if (!currentMatch) {
      return null
    }

    await resetBetsAndActions(matchId, currentMatch.table.maxBuyIn)

    if (!currentMatch.isPreFlop && !currentMatch.isFlop) {
      const updatedMatch = await db.match.update({
        where: {
          id: matchId,
        },
        data: {
          isPreFlop: true,
          isFlop: true,
        },
        include: {
          table: true,
        },
      })
      return updatedMatch
    }

    if (currentMatch.isFlop && currentMatch.isPreFlop && !currentMatch.isTurn) {
      const updatedMatch = await db.match.update({
        where: {
          id: matchId,
        },
        data: {
          isTurn: true,
        },
        include: {
          table: true,
        },
      })

      return updatedMatch
    }

    if (
      currentMatch.isTurn &&
      currentMatch.isFlop &&
      currentMatch.isPreFlop &&
      !currentMatch.isRiver
    ) {
      const updatedMatch = await db.match.update({
        where: {
          id: matchId,
        },
        data: {
          isRiver: true,
        },
        include: {
          table: true,
        },
      })

      return updatedMatch
    }

    if (
      currentMatch.isRiver &&
      currentMatch.isTurn &&
      currentMatch.isFlop &&
      currentMatch.isPreFlop &&
      !currentMatch.isShowdown
    ) {
      await determineSidePotWinners(matchId)
      const updatedMatch = await determineMainPotWinner(matchId)

      return updatedMatch
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

export const findNextActivePlayer = async (
  players: Player[],
  playerId: string,
  places: number
) => {
  try {
    const player = players.findIndex(player => player.id === playerId)

    const nextPlayer =
      player + places >= players.length
        ? player + places - players.length
        : player + places

    return players[nextPlayer].id
  } catch {
    return ''
  }
}

export const placeBlinds = async (
  tableId: string,
  matchId: string,
  playerId: string,
  amount: number
) => {
  try {
    const player = await db.player.findUnique({
      where: {
        id: playerId,
        tableId,
      },
      include: {
        user: true,
      },
    })

    if (!player) {
      return null
    }

    const currentParticipant = await db.participant.findFirst({
      where: {
        playerId,
        matchId,
      },
    })

    if (!currentParticipant) return null

    await db.participant.update({
      where: {
        id: currentParticipant.id,
        playerId,
        matchId,
      },
      data: {
        bet: amount,
      },
    })

    await db.player.update({
      where: {
        id: player.id,
      },
      data: {
        stack: {
          decrement: amount,
        },
      },
    })
  } catch {
    return null
  }
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
      await calculateSidePots(participant.matchId)

      let match = await dealNextStreet(participant.matchId)

      if (!match) return ''

      // this.calculateSidePots()
      while (match && !match.isShowdown && !match.table.handOver) {
        match = await dealNextStreet(participant.matchId)
      }

      return ''
    }

    const isComplete = await isAllCheckedOrCalled(currentMatch)

    if (isComplete) {
      await calculateSidePots(participant.matchId)

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
      participant => participant.player.stack === 0 && participant.bet > 0
    )

    return participants
  } catch (error) {
    return []
  }
}

const calculateSidePots = async (matchId: string) => {
  try {
    const allInParticipants = await getAllInThisTurn(matchId)
    const unfoldedParticipants = await getUnfoldedParticipants(matchId)

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

    for (const allInParticipant of sortedAllInParticipants) {
      if (allInParticipant.bet > 0) {
        const sidePot = await db.sidePot.create({
          data: {
            matchId: matchId,
            amount: 0,
            participants: {
              connect: sortedAllInParticipants.map(participant => ({
                id: participant.id,
              })),
            },
          },
        })

        for (const participant of unfoldedParticipants) {
          const amountOver = participant.bet - allInParticipant.bet
          if (amountOver > 0) {
            const lastSidePot = await db.sidePot.findFirst({
              where: {
                matchId: participant.matchId,
              },
              orderBy: {
                createdAt: 'desc',
              },
            })

            if (!lastSidePot) throw new Error('No last side pot found')

            if (lastSidePot.amount > 0) {
              await db.sidePot.update({
                where: {
                  id: lastSidePot.id,
                },
                data: {
                  amount: {
                    increment: -amountOver,
                  },
                },
              })
            } else {
              await db.match.update({
                where: { id: participant.matchId },
                data: { pot: { increment: -amountOver } },
              })
            }

            participant.bet -= amountOver
            await db.participant.update({
              where: { id: participant.id },
              data: { bet: participant.bet },
            })

            sidePot.amount += amountOver
          }
        }

        allInParticipant.bet = 0
        await db.participant.update({
          where: { id: allInParticipant.id },
          data: { bet: allInParticipant.bet },
        })

        await db.sidePot.update({
          where: { id: sidePot.id },
          data: { amount: sidePot.amount },
        })
      }
    }
  } catch (error) {
    console.log(error)
    throw error
  }
}
