import express from 'express'
import http from 'http'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import cors from 'cors'
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

const app = express()

app.use(
  cors({
    credentials: true,
    // ...corsOptions,
  })
)

app.use(compression())
app.use(cookieParser())
app.use(bodyParser.json())
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
