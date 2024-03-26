import { ExpressResponseServerIo } from './src/types'
import { Server as NetServer, Socket } from 'net'
import { Server as SocketIOServer } from 'socket.io'

declare global {
  namespace Express {
    export interface Response {
      socket?: Socket & {
        server?: NetServer & {
          io: SocketIOServer
        }
      }
    }
  }
}
