// import express from 'express'
// import { Server as NetServer } from 'http'
// import { Server as ServerIO } from 'socket.io'
// import { Request, Response } from 'express'

// const router = express.Router({ mergeParams: true })

// export default (): express.Router => {
//   router.post('/socket/io', (req: Request, res: Response) => {
//     if (!res.socket?.server?.io) {
//       const path = '/api/socket/io'
//       const httpServer: NetServer = res.socket?.server as any
//       const io = new ServerIO(httpServer, {
//         path: path,
//         // @ts-ignore
//         addTrailingSlash: false,
//       })
//       if (res.socket?.server) res.socket.server.io = io
//     }
//     res.end()
//   })

//   return router
// }
