export enum PokerActions {
  FOLD = 'FOLD',
  CHECK = 'CHECK',
  CALL = 'CALL',
  RAISE = 'RAISE',
  WINNER = 'WINNER',
  FETCH_LOBBY_INFO = 'FETCH_LOBBY_INFO',
  RECEIVE_LOBBY_INFO = 'RECEIVE_LOBBY_INFO',
  PLAYERS_UPDATED = 'PLAYERS_UPDATED',
  JOIN_TABLE = 'JOIN_TABLE',
  TABLE_JOINED = 'TABLE_JOINED',
  LEAVE_TABLE = 'LEAVE_TABLE',
  TABLE_LEFT = 'TABLE_LEFT',
  TABLES_UPDATED = 'TABLES_UPDATED',
  TABLE_UPDATED = 'TABLE_UPDATED',
  MATCH_STARTED = 'MATCH_STARTED',
  TABLE_MESSAGE = 'TABLE_MESSAGE',
  CHANGE_TURN = 'CHANGE_TURN',
  REBUY = 'REBUY',
  SIT_DOWN = 'SIT_DOWN',
  STAND_UP = 'STAND_UP',
  SITTING_OUT = 'SITTING_OUT',
  SITTING_IN = 'SITTING_IN',
  DISCONNECTED = 'DISCONNECTED',
}
