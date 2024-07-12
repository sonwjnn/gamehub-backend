import {
  handleParticipantCall,
  handleParticipantCheck,
  handleParticipantFold,
  handleParticipantRaise,
} from './../db/participants'
import { Socket } from 'socket.io'
import { db } from '../lib/db'
import {
  ClientToServerEvents,
  CustomToastType,
  HighlightResponse,
  InterServerEvents,
  PlayerHighlightCards,
  PlayerWithUser,
  ServerToClientEvents,
  SocketData,
  TableWithPlayers,
} from '../types'
import { Server } from 'socket.io'

import { Card, Participant } from '@prisma/client'
import { PokerActions } from '../pokergame/actions'
import { changeTurn, getTableById } from '../db/tables'
import { createMatch } from '../db/matches'
import { removePlayerBySocketId } from '../db/players'
import {
  CustomCard,
  formattedCards,
  getHighlightCardsForPlayer,
} from '../db/poker'
import { Mutex } from 'async-mutex'

interface IInIt {
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
}

const DELAY_BETWEEN_MATCHES = 12000

const init = ({ socket, io }: IInIt) => {
  socket.on(
    PokerActions.TABLE_JOINED,
    async ({
      tableId,
      player,
    }: {
      tableId: string
      player: PlayerWithUser
    }) => {
      const table = await getTableById(tableId)

      if (!table) {
        return
      }

      broadcastToTable(table, `${player.user?.name} joined`, 'info')

      // if (table.handOver && table.players.length === 2) {
      //   await startNewMatch(tableId, 5000)
      // }
    }
  )
  socket.on(PokerActions.START_INIT_MATCH, async ({ tableId }) => {
    await startNewMatch(tableId, 5000)
  })

  socket.on(PokerActions.TABLE_LEFT, async ({ tableId, playerId }) => {
    const table = await getTableById(tableId)

    if (!table) {
      return
    }

    const currentPlayer = table.players.find(p => p.id === playerId)

    if (!currentPlayer) return null

    broadcastToTable(table, `${currentPlayer.user?.name} left`, 'error')

    if (table?.players.length === 1) {
      clearMatchInterval()
      clearForOnePlayer(table)
    }
  })

  socket.on(
    PokerActions.REBOUGHT,
    async ({
      tableId,
      player,
    }: {
      tableId: string
      player: PlayerWithUser
    }) => {
      // const table = await getTableById(tableId)
      // if (!table) {
      //   return
      // }
      // broadcastToTable(
      //   table,
      //   `${player.user?.name} is rebought $${player.stack}`,
      //   'info'
      // )
    }
  )

  socket.on(PokerActions.FOLD, async ({ tableId, participantId }) => {
    const table = await getTableById(tableId)

    if (!table) return

    const participant = await handleParticipantFold(participantId)

    if (!participant) return

    // broadcastToTable(table, `player ${participant.player.user.username} folded`)

    changeTurnAndBroadcast(table, participant)
  })

  socket.on(PokerActions.CHECK, async ({ tableId, participantId }) => {
    const table = await getTableById(tableId)

    if (!table) return

    const participant = await handleParticipantCheck(participantId)

    if (!participant) return

    // broadcastToTable(
    //   table,
    //   `player ${participant.player.user.username} checked`
    // )

    changeTurnAndBroadcast(table, participant)
  })

  socket.on(
    PokerActions.RAISE,
    async ({ tableId, participantId, amount, type }) => {
      const table = await getTableById(tableId)

      if (!table) return

      const data = await handleParticipantRaise(participantId, amount, type)

      if (!data) return

      const { participant, updatedPlayer } = data

      const players = table.players

      for (let i = 0; i < players.length; i++) {
        let socketId = players[i].socketId as string
        io.to(socketId).emit(PokerActions.PARTICIPANTS_UPDATED, {
          tableId,
          participant,
        })
      }

      for (let i = 0; i < players.length; i++) {
        let socketId = players[i].socketId as string
        io.to(socketId).emit(PokerActions.UPDATE_MISSING_PLAYER_STACK, {
          tableId,
          player: updatedPlayer,
        })
      }

      // broadcastToTable(
      //   table,
      //   `player ${participant.player.user.username} raises to $${amount.toFixed(2)}`
      // )

      changeTurnAndBroadcast(table, participant)
    }
  )

  socket.on(PokerActions.CALL, async ({ tableId, participantId }) => {
    const table = await getTableById(tableId)

    if (!table) return

    const data = await handleParticipantCall(participantId)

    if (!data) return

    const { participant, updatedPlayer } = data

    const players = table.players

    for (let i = 0; i < players.length; i++) {
      let socketId = players[i].socketId as string
      io.to(socketId).emit(PokerActions.PARTICIPANTS_UPDATED, {
        tableId,
        participant,
      })
    }

    for (let i = 0; i < players.length; i++) {
      let socketId = players[i].socketId as string
      io.to(socketId).emit(PokerActions.UPDATE_MISSING_PLAYER_STACK, {
        tableId,
        player: updatedPlayer,
      })
    }

    // broadcastToTable(table, `player ${participant.player.user.username} called`)

    changeTurnAndBroadcast(table, participant)
  })

  socket.on(PokerActions.SHOW_HAND, async ({ tableId, playerId }) => {
    const table = await getTableById(tableId)

    if (!table) return

    const player = table.players.find(p => p.id === playerId)

    if (!player) return

    const players = table.players

    for (let i = 0; i < players.length; i++) {
      let socketId = players[i].socketId as string
      io.to(socketId).emit(PokerActions.HAND_SHOWED, {
        tableId,
        playerId,
      })
    }
  })

  socket.on(PokerActions.LEAVE_NEXT_MATCH, async ({ tableId, playerId }) => {
    const table = await getTableById(tableId)

    if (!table) return

    const player = table.players.find(p => p.id === playerId)

    if (!player) return

    broadcastToTable(
      table,
      `${player.user.name} 가 다음 경기에서 나갑니다.`,
      'error'
    )
  })

  socket.on('disconnect', async () => {
    const player = await removePlayerBySocketId(socket.id)

    if (!player || !player.table) return

    const table = player.table

    broadcastToTable(table, `${player.user?.name} left`, 'error')

    for (let i = 0; i < table.players.length; i++) {
      let socketId = table.players[i].socketId as string

      io.to(socketId).emit(PokerActions.LEAVE_TABLE, {
        tableId: table.id,
        playerId: player.id,
      })
    }
  })

  let intervalId: NodeJS.Timeout | null = null

  const initNewMatch = async (tableId: string, delay: number) => {
    if (intervalId) return

    const table = await getTableById(tableId)

    if (!table) return null

    if (table.players.length > 1) {
      // broadcastToTable(table, 'New match starting in 8 seconds')
    }

    let elapsed = 0
    intervalId = setInterval(async () => {
      elapsed += 1000

      if (elapsed === delay - 3000) {
        for (let i = 0; i < table.players.length; i++) {
          let socketId = table.players[i].socketId as string
          io.to(socketId).emit(PokerActions.NEXT_MATCH_IS_COMING, {
            tableId,
            isComing: true,
          })
        }
      }

      if (elapsed >= (delay || 10000)) {
        clearInterval(intervalId as NodeJS.Timeout)

        // table.clearWinMessages();
        // broadcastToTable(table, ' Before call api create match ');

        const { match, playerId, table: newTable } = await createMatch(tableId)

        if (!match || !playerId || !newTable) {
          for (let i = 0; i < (newTable || table).players.length; i++) {
            let socketId = (newTable || table).players[i].socketId as string
            io.to(socketId).emit(PokerActions.NEXT_MATCH_IS_COMING, {
              tableId,
              isComing: false,
            })
          }
          // broadcastToTable(table, ' Match and playerId is null ');
          return
        }

        broadcastToTable(newTable, ' New match started ', 'success')

        for (let i = 0; i < newTable.players.length; i++) {
          let socketId = newTable.players[i].socketId as string
          io.to(socketId).emit(PokerActions.PLAYERS_UPDATED, {
            tableId,
            players: newTable.players.map(item => {
              return {
                ...item,
                isTurn: false,
              }
            }),
          })
        }

        for (let i = 0; i < newTable.players.length; i++) {
          let socketId = newTable.players[i].socketId as string

          // let tableCopy = hideOpponentCards(table, socketId);
          io.to(socketId).emit(PokerActions.MATCH_STARTED, {
            tableId,
            match,
            playerId,
          })
        }
      }
    }, 1000)
  }

  const startNewMatch = async (tableId: string, delay: number) => {
    clearMatchInterval()
    await initNewMatch(tableId, delay)
  }

  const clearMatchInterval = () => {
    if (intervalId) {
      clearInterval(intervalId as NodeJS.Timeout)
      intervalId = null
    }
  }

  const broadcastToTable = (
    table: TableWithPlayers,
    message: string,
    type?: CustomToastType
  ) => {
    for (let i = 0; i < table.players.length; i++) {
      let socketId = table.players[i].socketId as string
      io.to(socketId).emit(PokerActions.TABLE_MESSAGE, {
        message,
        type,
      })
    }
  }

  const clearForOnePlayer = (table: TableWithPlayers) => {
    // table.clearWinMessages()
    setTimeout(() => {
      // table.resetBoardAndPot()
      broadcastToTable(table, 'Waiting for more players', 'warning')
    }, 5000)
  }

  const changeTurnAndBroadcast = async (
      table: TableWithPlayers,
      participant: Participant
    ) => {
      const playerId = await changeTurn(table, participant)

      const currentMatch = await db.match.findUnique({
        where: {
          id: participant.matchId,
        },
        include: {
          table: {
            include: {
              players: {
                include: {
                  user: true,
                },
              },
            },
          },
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
          winners: true,
          winMessages: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      })

      const newPlayers = currentMatch?.table?.players || []

      for (let i = 0; i < newPlayers.length; i++) {
        let socketId = newPlayers[i].socketId as string
        io.to(socketId).emit(PokerActions.PLAYERS_UPDATED, {
          tableId: table.id,
          players: newPlayers.map(item => {
            return { ...item, isTurn: false }
          }),
          match: currentMatch,
        })
      }

      for (let i = 0; i < newPlayers.length; i++) {
        let socketId = newPlayers[i].socketId as string
        io.to(socketId).emit(PokerActions.CHANGE_TURN, {
          matchData: currentMatch,
          playerId,
        })
      }

      let boardCards = [] as Card[]
      if (currentMatch?.board) {
        if (
          currentMatch.isFlop &&
          !currentMatch.isTurn &&
          !currentMatch.isRiver
        ) {
          boardCards = currentMatch.board.slice(0, 3)
        }
        if (currentMatch.isTurn && !currentMatch.isRiver) {
          boardCards = currentMatch.board.slice(0, 4)
        }
        if (currentMatch.isRiver) {
          boardCards = currentMatch.board
        }
      }

      const formattedBoard = boardCards.map(card => formattedCards(card))

      const availableParticipants = currentMatch?.participants?.filter(
        participant =>
          !!participant && !!participant.cardOne && !!participant.cardTwo
      )

      const playerHighlightSet =
        availableParticipants?.reduce<PlayerHighlightCards>(
          (previous, current) => {
            const formattedParticipantCards = [
              formattedCards(current.cardOne as CustomCard),
              formattedCards(current.cardTwo as CustomCard),
            ]
            const highlightCards = getHighlightCardsForPlayer(
              formattedBoard,
              formattedParticipantCards
            )
            Object.assign(previous, {
              [current.playerId]: highlightCards,
            })
            return previous
          },
          {}
        ) || {}

      const highlightResponse: HighlightResponse = {
        playerHighlightSet,
        isAllAllIn: !!currentMatch?.isAllAllIn,
      }

      const highlightResponseEncoding = Buffer.from(
        JSON.stringify(highlightResponse)
      ).toString('base64')

      for (let i = 0; i < newPlayers.length; i++) {
        let socketId = newPlayers[i].socketId as string
        io.to(socketId).emit(
          PokerActions.HIGHLIGHT_CARDS,
          highlightResponseEncoding
        )
      }

      // end match
      if (currentMatch?.table.handOver) {
        await updateStatistical(newPlayers)

        // calculate complete delay for all player allin
        let completeDelay = DELAY_BETWEEN_MATCHES

        if (currentMatch?.roundNameBeforeComplete === 'PreFlop') {
          completeDelay = 20000
        } else if (currentMatch?.roundNameBeforeComplete === 'Flop') {
          completeDelay = 18000
        } else if (currentMatch?.roundNameBeforeComplete === 'Turn') {
          completeDelay = 17000
        } else if (currentMatch?.roundNameBeforeComplete === 'River') {
          completeDelay = 16000
        }

        const delay =
          (!currentMatch.isShowdown && 6000) ||
          (currentMatch.isShowdown &&
            currentMatch.isAllAllIn &&
            completeDelay) ||
          DELAY_BETWEEN_MATCHES

        if (newPlayers.length >= 2) {
          await startNewMatch(currentMatch?.table.id, delay)
        }
      }
    },
    updateStatistical = async (players: PlayerWithUser[]) => {
      for (let i = 0; i < players.length; i++) {
        const [winHistories, loseHistory] = await Promise.all([
          db.winMessages.findMany({
            where: {
              userId: players[i].userId,
              match: {
                tableId: players[i].tableId,
              },
            },
          }),
          db.loseHistory.findMany({
            where: {
              userId: players[i].userId,
              match: {
                tableId: players[i].tableId,
              },
            },
          }),
        ])

        const winCount = winHistories.length
        const loseCount = loseHistory.length

        const winAmount = winHistories
          .map(history => history.amount)
          .reduce((acc, cur) => acc + cur, 0)

        const loseAmount = loseHistory
          .map(history => history.amount)
          .reduce((acc, cur) => acc + cur, 0)

        let socketId = players[i].socketId as string
        io.to(socketId).emit(PokerActions.UPDATE_STATISTICAL, {
          winCount: winCount,
          loseCount: loseCount,
          winAmount: winAmount,
          loseAmount: loseAmount,
        })
      }
    }
}

export default { init }
