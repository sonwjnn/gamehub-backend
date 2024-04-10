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
  MatchWithParticipants,
  PlayerWithUser,
  ServerToClientEvents,
  SocketData,
  TableWithPlayers,
} from '../types'
import { Server } from 'socket.io'

import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken'

import { User, Player, Table, Participant } from '@prisma/client'
import { jwtVerify } from '../helpers'
import { PokerActions } from '../pokergame/actions'
import { changeTurn, getTableById } from '../db/tables'
import { createMatch, getMatchById } from '../db/matches'

async function getCurrentPlayers() {
  try {
    const players = await db.player.findMany()

    return players
  } catch {
    return []
  }
}

async function getCurrentTables() {
  try {
    const tables = await db.table.findMany()

    return tables
  } catch {
    return []
  }
}

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

      if (table?.players.length === 2) {
        // start game
        initNewMatch(table)
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

    const participant = await handlePacticipantRaise(participantId)

    if (!participant) return

    broadcastToTable(
      table,
      `player ${participant.player.user.username} raised ${amount}`
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

  function initNewMatch(table: TableWithPlayers) {
    if (table.players.length > 1) {
      broadcastToTable(table, '---New match starting in 10 seconds---')
    }
    setTimeout(async () => {
      // table.clearWinMessages();
      const { match, playerId } = await createMatch(table)

      if (!match || !playerId) return

      broadcastToTable(table, '--- New match started ---')
      for (let i = 0; i < table.players.length; i++) {
        let socketId = table.players[i].socketId as string

        // let tableCopy = hideOpponentCards(table, socketId)
        io.to(socketId).emit(PokerActions.MATCH_STARTED, {
          tableId: table.id,
          match,
          playerId,
        })
      }
    }, 10000)
  }

  function broadcastToTable(
    table: TableWithPlayers,
    message = '',
    from = null
  ) {
    for (let i = 0; i < table.players.length; i++) {
      let socketId = table.players[i].socketId as string
      // let tableCopy = hideOpponentCards(table, socketId)
      io.to(socketId).emit(PokerActions.TABLE_MESSAGE, {
        message,
        from,
      })
    }
  }

  function clearForOnePlayer(table: TableWithPlayers) {
    // table.clearWinMessages()
    setTimeout(() => {
      // table.resetBoardAndPot()
      broadcastToTable(table, 'Waiting for more players')
    }, 5000)
  }

  function changeTurnAndBroadcast(
    table: TableWithPlayers,
    participant: Participant
  ) {
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
        initNewMatch(currentMatch?.table)
      }
    }, 1000)
  }
}

export default { init }
