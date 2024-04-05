import { Player, Table, User } from '@prisma/client'
import { Server as NetServer, Socket } from 'net'
import { Server as SocketIOServer } from 'socket.io'
import { PokerActions } from './pokergame/actions'

export type PlayerWithUser = Player & { user: User }

export type ServerIo = {
  socket?: Socket & {
    server?: NetServer & {
      io: SocketIOServer
    }
  }
}

export interface ServerToClientEvents {
  noArg: () => void
  basicEmit: (a: number, b: string, c: Buffer) => void
  withAck: (d: string, callback: (e: number) => void) => void
  [PokerActions.RECEIVE_LOBBY_INFO]: ({
    players,
    tables,
    socketId,
  }: {
    players: Player[]
    tables: Table[]
    socketId: string
  }) => void

  [PokerActions.PLAYERS_UPDATED]: (players: Player[]) => void
  [PokerActions.JOIN_TABLE]: ({
    tableId,
    player,
  }: {
    tableId: string
    player: Player
  }) => void
  [PokerActions.LEAVE_TABLE]: ({
    tableId,
    player,
  }: {
    tableId: string
    player: Player
  }) => void
}

export interface ClientToServerEvents {
  [PokerActions.FETCH_LOBBY_INFO]: (token: string) => void

  [PokerActions.JOIN_TABLE]: ({
    tableId,
    player,
  }: {
    tableId: string
    player: Player
  }) => void
  [PokerActions.LEAVE_TABLE]: ({
    tableId,
    player,
  }: {
    tableId: string
    player: Player
  }) => void
  [PokerActions.FOLD]: (tableId: string) => void
  [PokerActions.CHECK]: (tableId: string) => void
  [PokerActions.CALL]: (tableId: string) => void
  [PokerActions.RAISE]: ({
    tableId,
    amount,
  }: {
    tableId: string
    amount: number
  }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  name: string
  age: number
}
