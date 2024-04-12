import {
  handlePacticipantCall,
  handlePacticipantCheck,
  handlePacticipantFold,
  handlePacticipantRaise,
} from './../db/participants'
import { Socket } from 'socket.io'
import { db } from '../lib/db'
import {
  ClientToServerEvents,
  InterServerEvents,
  PlayerWithUser,
  ServerToClientEvents,
  SocketData,
  TableWithPlayers,
} from '../types'
import { Server } from 'socket.io'

import { Participant } from '@prisma/client'
import { PokerActions } from '../pokergame/actions'
import { changeTurn, getTableById } from '../db/tables'
import { createMatch } from '../db/matches'
import playerController from '../controllers/players'
import { removePlayerBySocketId } from '../db/players'

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

let currentTimeout: NodeJS.Timeout | null = null
const DELAY_BETWEEN_MATCHES = 10000

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

      broadcastToTable(table, `${player.user?.username} joined`)

      if (table?.players.length >= 2 && table.handOver) {
        // start game
        initNewMatch(table, DELAY_BETWEEN_MATCHES)
      }
    }
  )
  socket.on(PokerActions.TABLE_LEFT, async ({ tableId, player }) => {
    const table = await getTableById(tableId)

    if (!table) {
      return
    }

    broadcastToTable(table, `${player.user?.username} left`)

    if (table?.players.length === 1) {
      clearForOnePlayer(table)
    }
  })

  socket.on(PokerActions.FOLD, async ({ tableId, participantId }) => {
    const table = await getTableById(tableId)

    if (!table) return

    const participant = await handlePacticipantFold(participantId)

    if (!participant) return

    broadcastToTable(table, `player ${participant.player.user.username} folded`)

    changeTurnAndBroadcast(table, participant)
  })

  socket.on(PokerActions.CHECK, async ({ tableId, participantId }) => {
    const table = await getTableById(tableId)

    if (!table) return

    const participant = await handlePacticipantCheck(participantId)

    if (!participant) return

    broadcastToTable(
      table,
      `player ${participant.player.user.username} checked`
    )

    changeTurnAndBroadcast(table, participant)
  })

  socket.on(PokerActions.RAISE, async ({ tableId, participantId, amount }) => {
    const table = await getTableById(tableId)

    if (!table) return

    const participant = await handlePacticipantRaise(participantId, amount)

    if (!participant) return

    broadcastToTable(
      table,
      `player ${participant.player.user.username} raises to $${amount.toFixed(2)}`
    )

    changeTurnAndBroadcast(table, participant)
  })

  socket.on(PokerActions.CALL, async ({ tableId, participantId }) => {
    const table = await getTableById(tableId)

    if (!table) return

    const participant = await handlePacticipantCall(participantId)

    if (!participant) return

    broadcastToTable(table, `player ${participant.player.user.username} called`)

    changeTurnAndBroadcast(table, participant)
  })

  socket.on('disconnect', async () => {
    const player = await removePlayerBySocketId(socket.id)

    if (!player || !player.table) return

    const table = player.table

    broadcastToTable(table, `${player.user?.username} left`)

    for (let i = 0; i < table.players.length; i++) {
      let socketId = table.players[i].socketId as string

      io.to(socketId).emit(PokerActions.LEAVE_TABLE, {
        tableId: table.id,
        player,
      })
    }
  })

  const initNewMatch = (table: TableWithPlayers, delay: number) => {
    if (currentTimeout) {
      clearTimeout(currentTimeout)
    }

    if (table.players.length > 1) {
      broadcastToTable(table, 'New match starting in 10 seconds')
    }

    currentTimeout = setTimeout(async () => {
      // table.clearWinMessages();
      const { match, playerId } = await createMatch(table)

      if (!match || !playerId) return

      broadcastToTable(table, ' New match started ')
      for (let i = 0; i < table.players.length; i++) {
        let socketId = table.players[i].socketId as string

        // let tableCopy = hideOpponentCards(table, socketId)
        io.to(socketId).emit(PokerActions.MATCH_STARTED, {
          tableId: table.id,
          match,
          playerId,
        })
      }
    }, delay || 10000)
  }

  const broadcastToTable = (
    table: TableWithPlayers,
    message: string,
    from = null
  ) => {
    for (let i = 0; i < table.players.length; i++) {
      let socketId = table.players[i].socketId as string
      // let tableCopy = hideOpponentCards(table, socketId)
      io.to(socketId).emit(PokerActions.TABLE_MESSAGE, {
        message,
        from,
      })
    }

    // socket.emit(PokerActions.TABLE_MESSAGE, { message, from })

    // socket.join(table.id)
  }

  const clearForOnePlayer = (table: TableWithPlayers) => {
    // table.clearWinMessages()
    setTimeout(() => {
      // table.resetBoardAndPot()
      broadcastToTable(table, 'Waiting for more players')
    }, 5000)
  }

  const changeTurnAndBroadcast = (
    table: TableWithPlayers,
    participant: Participant
  ) => {
    setTimeout(async () => {
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
        },
      })

      for (let i = 0; i < table.players.length; i++) {
        let socketId = table.players[i].socketId as string
        // let tableCopy = hideOpponentCards(table, socketId)
        io.to(socketId).emit(PokerActions.CHANGE_TURN, {
          match: currentMatch,
          playerId,
        })
      }

      // end match
      if (currentMatch?.table.handOver) {
        initNewMatch(currentMatch?.table, DELAY_BETWEEN_MATCHES)
      }
    }, 1000)
  }
}

export default { init }
