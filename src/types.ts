import { Card, Match, Participant, Player, Table, User } from '@prisma/client'
import { Server as NetServer, Socket } from 'net'
import { Server as SocketIOServer } from 'socket.io'
import { PokerActions, RaiseType } from './pokergame/actions'

export type PlayerWithUser = Player & { user: User }

export type ServerIo = {
  socket?: Socket & {
    server?: NetServer & {
      io: SocketIOServer
    }
  }
}

type Statistical = {
  winCount: number
  winAmount: number
  loseCount: number
  loseAmount: number
}

type CustomCard = {
  id: string
  rank: string
  suit: string
}

export type HighlightCard = {
  cards: CustomCard[]
  name: string
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

  [PokerActions.JOIN_TABLE]: ({
    tableId,
    player,
    playerLength,
  }: {
    tableId: string
    player: Player
    playerLength: number
  }) => void

  [PokerActions.TABLES_UPDATED]: ({ table }: { table: Table }) => void

  [PokerActions.LEAVE_TABLE]: ({
    tableId,
    playerId,
  }: {
    tableId: string
    playerId: string
  }) => void
  [PokerActions.TABLE_MESSAGE]: ({
    message,
    from,
  }: {
    message: string
    from: any
  }) => void

  [PokerActions.UPDATE_STATISTICAL]: (data: Statistical) => void
  [PokerActions.HIGHLIGHT_CARDS]: (data: HighlightCard) => void
  [PokerActions.MATCH_STARTED]: ({
    tableId,
    match,
    playerId,
  }: {
    tableId: string
    match: MatchWithParticipants
    playerId: string
  }) => void

  [PokerActions.PLAYERS_UPDATED]: ({
    tableId,
    players,
  }: {
    tableId: string
    players: PlayerWithUser[]
  }) => void

  [PokerActions.PARTICIPANTS_UPDATED]: ({
    tableId,
    participant,
  }: {
    tableId: string
    participant: Participant
  }) => void

  [PokerActions.DISCONNECTED]: ({ table }: { table: Table }) => void
  [PokerActions.CHANGE_TURN]: ({
    matchData,
    playerId,
  }: {
    matchData: Match | null
    playerId: string
  }) => void
  [PokerActions.FOLD]: ({
    tableId,
    participantId,
  }: {
    tableId: string
    participantId: string
  }) => void
  [PokerActions.HAND_SHOWED]: ({
    tableId,
    playerId,
  }: {
    tableId: string
    playerId: string
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

  [PokerActions.REBOUGHT]: ({
    tableId,
    player,
  }: {
    tableId: string
    player: PlayerWithUser
  }) => void
  [PokerActions.TABLE_LEFT]: ({
    tableId,
    playerId,
  }: {
    tableId: string
    playerId: string
  }) => void
  [PokerActions.LEAVE_TABLE]: ({
    tableId,
    playerId,
  }: {
    tableId: string
    playerId: string
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
    type,
  }: {
    tableId: string
    participantId: string
    amount: number
    type: RaiseType
  }) => void
  [PokerActions.SHOW_HAND]: ({
    tableId,
    playerId,
  }: {
    tableId: string
    playerId: string
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

export type ParticipantWithPlayerAndCards = ParticipantWithCards & {
  player: PlayerWithUser
}

export type PlayerWithParticipants = Player & {
  participants: Participant[]
}
