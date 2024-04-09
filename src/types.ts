import { Card, Match, Participant, Player, Table, User } from '@prisma/client'
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
  [PokerActions.TABLE_MESSAGE]: ({
    message,
    from,
  }: {
    message: string
    from: any
  }) => void
  [PokerActions.MATCH_STARTED]: ({
    tableId,
    match,
    playerId,
  }: {
    tableId: string
    match: MatchWithParticipants
    playerId: string
  }) => void
  [PokerActions.CHANGE_TURN]: ({
    match,
    playerId,
  }: {
    match: Match | null
    playerId: string
  }) => void
  [PokerActions.FOLD]: ({
    tableId,
    participantId,
  }: {
    tableId: string
    participantId: string
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
  [PokerActions.TABLE_JOINED]: ({
    tableId,
    player,
  }: {
    tableId: string
    player: PlayerWithUser
  }) => void
  [PokerActions.TABLE_LEFT]: ({
    tableId,
    player,
  }: {
    tableId: string
    player: PlayerWithUser
  }) => void
  [PokerActions.LEAVE_TABLE]: ({
    tableId,
    player,
  }: {
    tableId: string
    player: Player
  }) => void
  [PokerActions.FOLD]: ({
    tableId,
    participantId,
  }: {
    tableId: string
    participantId: string
  }) => void
  [PokerActions.CHECK]: ({
    tableId,
    participantId,
  }: {
    tableId: string
    participantId: string
  }) => void
  [PokerActions.CALL]: ({
    tableId,
    participantId,
  }: {
    tableId: string
    participantId: string
  }) => void
  [PokerActions.RAISE]: ({
    tableId,
    participantId,
    amount,
  }: {
    tableId: string
    participantId: string
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

export type TableWithPlayers = Table & { players: PlayerWithUser[] }

export type ParticipantWithCards = Participant & {
  cardOne: Card
  cardTwo: Card
}

export type MatchWithParticipants = Match & {
  participants: ParticipantWithCards[]
  board: Card[]
}

export type ParticipantWithPlayer = Participant & { player: PlayerWithUser }
