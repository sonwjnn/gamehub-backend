import { Member, User } from '@prisma/client'
import { Server as NetServer, Socket } from 'net'
import { Server as SocketIOServer } from 'socket.io'
export type MemberWithUser = Member & { user: User }

export type ServerIo = {
  socket?: Socket & {
    server?: NetServer & {
      io: SocketIOServer
    }
  }
}
