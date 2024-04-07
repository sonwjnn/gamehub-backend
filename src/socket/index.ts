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

import { User, Player, Table } from '@prisma/client'
import { jwtVerify } from '../helpers'
import { PokerActions } from '../pokergame/actions'
import { changeTurn, getTableById } from '../db/tables'
import { createMatch } from '../db/matches'

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

      if (table?.players.length >= 2) {
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

    changeTurnAndBroadcast(table)
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

    changeTurnAndBroadcast(table)
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

    changeTurnAndBroadcast(table)
  })

  socket.on(PokerActions.CALL, async ({ tableId, participantId }) => {
    const table = await getTableById(tableId)

    if (!table) return

    const participant = await handlePacticipantCall(participantId)

    if (!participant) return

    broadcastToTable(table, `player ${participant.player.user.username} called`)

    changeTurnAndBroadcast(table)
  })
  // socket.on(FOLD, tableId => {
  //   let table = tables[tableId]
  //   let res = table.handleFold(socket.id)
  //   res && broadcastToTable(table, res.message)
  //   res && changeTurnAndBroadcast(table, res.seatId)
  // })
  // socket.on(CHECK, tableId => {
  //   let table = tables[tableId]
  //   let res = table.handleCheck(socket.id)
  //   res && broadcastToTable(table, res.message)
  //   res && changeTurnAndBroadcast(table, res.seatId)
  // })
  // socket.on(CALL, tableId => {
  //   let table = tables[tableId]
  //   let res = table.handleCall(socket.id)
  //   res && broadcastToTable(table, res.message)
  //   res && changeTurnAndBroadcast(table, res.seatId)
  // })
  // socket.on(RAISE, ({ tableId, amount }) => {
  //   let table = tables[tableId]
  //   let res = table.handleRaise(socket.id, amount)
  //   res && broadcastToTable(table, res.message)
  //   res && changeTurnAndBroadcast(table, res.seatId)
  // })
  // socket.on(TABLE_MESSAGE, ({ message, from, tableId }) => {
  //   let table = tables[tableId]
  //   broadcastToTable(table, message, from)
  // })
  // socket.on(SIT_DOWN, ({ tableId, seatId, amount }) => {
  //   const table = tables[tableId]
  //   const player = players[socket.id]
  //   if (player) {
  //     table.sitPlayer(player, seatId, amount)
  //     let message = `${player.name} sat down in Seat ${seatId}`
  //     updatePlayerBankroll(player, -amount)
  //     broadcastToTable(table, message)
  //     if (table.activePlayers().length === 2) {
  //       initNewHand(table)
  //     }
  //   }
  // })
  // socket.on(REBUY, ({ tableId, seatId, amount }) => {
  //   const table = tables[tableId]
  //   const player = players[socket.id]
  //   table.rebuyPlayer(seatId, amount)
  //   updatePlayerBankroll(player, -amount)
  //   broadcastToTable(table)
  // })
  // socket.on(STAND_UP, tableId => {
  //   const table = tables[tableId]
  //   const player = players[socket.id]
  //   const seat = Object.values(table.seats).find(
  //     seat => seat && seat.player.socketId === socket.id
  //   )
  //   let message = ''
  //   if (seat) {
  //     updatePlayerBankroll(player, seat.stack)
  //     message = `${player.name} left the table`
  //   }
  //   table.standPlayer(socket.id)
  //   broadcastToTable(table, message)
  //   if (table.activePlayers().length === 1) {
  //     clearForOnePlayer(table)
  //   }
  // })
  // socket.on(SITTING_OUT, ({ tableId, seatId }) => {
  //   const table = tables[tableId]
  //   const seat = table.seats[seatId]
  //   seat.sittingOut = true
  //   broadcastToTable(table)
  // })
  // socket.on(SITTING_IN, ({ tableId, seatId }) => {
  //   const table = tables[tableId]
  //   const seat = table.seats[seatId]
  //   seat.sittingOut = false
  //   broadcastToTable(table)
  //   if (table.handOver && table.activePlayers().length === 2) {
  //     initNewHand(table)
  //   }
  // })
  // socket.on(DISCONNECT, () => {
  //   const seat = findSeatBySocketId(socket.id)
  //   if (seat) {
  //     updatePlayerBankroll(seat.player, seat.stack)
  //   }
  //   delete players[socket.id]
  //   removeFromTables(socket.id)
  //   socket.broadcast.emit(TABLES_UPDATED, getCurrentTables())
  //   socket.broadcast.emit(PLAYERS_UPDATED, getCurrentPlayers())
  // })
  // async function updatePlayerBankroll(player, amount) {
  //   const user = await User.findById(player.id)
  //   user.chipsAmount += amount
  //   await user.save()
  //   players[socket.id].bankroll += amount
  //   io.to(socket.id).emit(PLAYERS_UPDATED, getCurrentPlayers())
  // }
  // function findSeatBySocketId(socketId) {
  //   let foundSeat = null
  //   Object.values(tables).forEach(table => {
  //     Object.values(table.seats).forEach(seat => {
  //       if (seat && seat.player.socketId === socketId) {
  //         foundSeat = seat
  //       }
  //     })
  //   })
  //   return foundSeat
  // }
  // function removeFromTables(socketId) {
  //   for (let i = 0; i < Object.keys(tables).length; i++) {
  //     tables[Object.keys(tables)[i]].removePlayer(socketId)
  //   }
  // }
  function initNewMatch(table: TableWithPlayers) {
    if (table.players.length > 1) {
      broadcastToTable(table, '---New match starting in 5 seconds---')
    }
    setTimeout(async () => {
      // table.clearWinMessages();
      const { match, player } = await createMatch(table)
      broadcastToTable(table, '--- New match started ---')
      for (let i = 0; i < table.players.length; i++) {
        let socketId = table.players[i].socketId as string

        // let tableCopy = hideOpponentCards(table, socketId)
        io.to(socketId).emit(PokerActions.MATCH_STARTED, {
          tableId: table.id,
          match,
          player,
        })
      }
    }, 5000)
  }

  function broadcastToTable(
    table: TableWithPlayers,
    message = '',
    from = null
  ) {
    for (let i = 0; i < table.players.length; i++) {
      let socketId = table.players[i].socketId as string
      console.log(socketId)
      // let tableCopy = hideOpponentCards(table, socketId)
      io.to(socketId).emit(PokerActions.TABLE_MESSAGE, {
        message,
        from,
      })
    }
  }
  // function changeTurnAndBroadcast(table, seatId) {
  //   setTimeout(() => {
  //     table.changeTurn(seatId)
  //     broadcastToTable(table)
  //     if (table.handOver) {
  //       initNewHand(table)
  //     }
  //   }, 1000)
  // }
  // function initNewHand(table) {
  //   if (table.activePlayers().length > 1) {
  //     broadcastToTable(table, '---New hand starting in 5 seconds---')
  //   }
  //   setTimeout(() => {
  //     table.clearWinMessages()
  //     table.startHand()
  //     broadcastToTable(table, '--- New hand started ---')
  //   }, 5000)
  // }
  function clearForOnePlayer(table: TableWithPlayers) {
    // table.clearWinMessages()
    setTimeout(() => {
      // table.clearSeatHands()
      // table.resetBoardAndPot()
      broadcastToTable(table, 'Waiting for more players')
    }, 5000)
  }

  function changeTurnAndBroadcast(table: TableWithPlayers) {
    setTimeout(async () => {
      const nextPlayer = await changeTurn(table)

      for (let i = 0; i < table.players.length; i++) {
        let socketId = table.players[i].socketId as string
        // let tableCopy = hideOpponentCards(table, socketId)
        io.to(socketId).emit(PokerActions.CHANGE_TURN, {
          player: nextPlayer,
        })
      }

      // end match
      // if (table.handOver) {
      //   initNewHand(table);
      // }
    }, 1000)
  }
  // function hideOpponentCards(table, socketId) {
  //   let tableCopy = JSON.parse(JSON.stringify(table))
  //   let hiddenCard = { suit: 'hidden', rank: 'hidden' }
  //   let hiddenHand = [hiddenCard, hiddenCard]
  //   for (let i = 1; i <= tableCopy.maxPlayers; i++) {
  //     let seat = tableCopy.seats[i]
  //     if (
  //       seat &&
  //       seat.hand.length > 0 &&
  //       seat.player.socketId !== socketId &&
  //       !(seat.lastAction === WINNER && tableCopy.wentToShowdown)
  //     ) {
  //       seat.hand = hiddenHand
  //     }
  //   }
  //   return tableCopy
  // }
}

export default { init }
