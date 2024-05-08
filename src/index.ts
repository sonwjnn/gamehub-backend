import express from 'express'
import http from 'http'
import { corsOptions } from './configs/cors'
import { Server } from 'socket.io'
import gameSocket from './socket'
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './types'

import router from './router'
import configureMiddleware from './middlewares/config'

const app = express()

configureMiddleware(app)

app.use('/', router())

const server = http.createServer(app)

//  Handle real-time poker game logic with socket.io
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server)

io.on('connection', socket => gameSocket.init({ socket, io }))

app.set('io', io)

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080/')
})
