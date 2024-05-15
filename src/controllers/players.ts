import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getPlayerById, getPlayers } from '../db/players'
import { PokerActions } from '../pokergame/actions'

const getAllPlayers = async (req: Request, res: Response) => {
  try {
    const players = await getPlayers()

    responseHandler.ok(res, players)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getPlayersByTableId = async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params

    const players = await db.player.findMany({
      where: {
        tableId,
      },
      include: {
        user: true,
      },
    })

    responseHandler.ok(res, players)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const removePlayer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { tableId } = req.query

    const tableExisting = await db.table.findUnique({
      where: {
        id: tableId as string,
      },
      include: {
        players: true,
      },
    })

    if (!tableExisting) {
      return responseHandler.badrequest(res, 'Table not found')
    }

    const playerExisting = tableExisting.players.find(
      player => player.id === id
    )

    if (!playerExisting) {
      return responseHandler.badrequest(res, 'Player not found')
    }

    await db.user.update({
      where: {
        id: playerExisting.userId,
      },
      data: {
        chipsAmount: {
          increment: playerExisting.stack,
        },
      },
    })

    const player = await db.player.delete({
      where: {
        id,
        tableId: tableId as string,
      },
      include: {
        user: true,
      },
    })

    const updatedPlayers = tableExisting.players.filter(
      player => player.id !== id
    )

    if (updatedPlayers.length === 1) {
      await db.table.update({
        where: {
          id: tableId as string,
        },
        data: {
          handOver: true,
        },
      })
    }

    res?.app
      .get('io')
      .emit(PokerActions.LEAVE_TABLE, { tableId, playerId: player.id })

    responseHandler.ok(res)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const updatePlayerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existingPlayer = await getPlayerById(id)

    if (!existingPlayer) {
      return responseHandler.badrequest(res, 'Player not found')
    }

    const updatedPlayer = await db.player.update({
      where: {
        id,
      },
      data: {
        ...req.body,
      },
    })

    responseHandler.ok(res, {
      player: updatedPlayer,
      message: 'Update player successfully!',
    })
  } catch (error) {
    responseHandler.error(res)
  }
}

const createPlayer = async (req: Request, res: Response) => {
  try {
    const { tableId, userId, socketId, buyIn } = req.body

    const isExistingPlayer = await db.player.findFirst({
      where: {
        tableId,
        userId,
      },
    })

    if (isExistingPlayer) {
      return responseHandler.badrequest(res, 'Player already exists')
    }

    const player = await db.player.create({
      data: {
        tableId,
        userId,
        socketId,
        buyIn,
        stack: buyIn,
        previousStack: buyIn,
      },
      include: {
        user: true,
      },
    })

    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        chipsAmount: {
          decrement: buyIn,
        },
      },
    })

    res?.app.get('io').emit(PokerActions.JOIN_TABLE, { tableId, player })

    responseHandler.ok(res, player)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getPlayer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const player = await getPlayerById(id)

    responseHandler.ok(res, player)
  } catch (error) {
    responseHandler.error(res)
  }
}

const getCurrentPlayerOfTable = async (req: Request, res: Response) => {
  try {
    const { tableId, userId } = req.params

    const player = await db.player.findFirst({
      where: {
        tableId,
        userId,
      },
    })

    responseHandler.ok(res, player)
  } catch (error) {
    responseHandler.error(res)
  }
}

const getCurrentPlayerWithoutTable = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    const player = await db.player.findFirst({
      where: {
        userId,
      },
    })

    responseHandler.ok(res, player)
  } catch (error) {
    responseHandler.error(res)
  }
}

const rebuy = async (req: Request, res: Response) => {
  try {
    const { tableId, userId, buyIn } = req.body
    const { id } = req.params

    const isExistingPlayer = await db.player.findUnique({
      where: {
        id,
      },
    })

    if (!isExistingPlayer) {
      return responseHandler.badrequest(res, 'Player does not exists!')
    }

    const player = await db.player.update({
      where: {
        id: isExistingPlayer.id,
      },
      data: {
        buyIn: {
          increment: buyIn,
        },
        stack: {
          increment: buyIn,
        },
      },
      include: {
        user: true,
      },
    })

    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        chipsAmount: {
          decrement: buyIn,
        },
      },
    })

    res?.app.get('io').emit(PokerActions.REBUY, { tableId, player })

    responseHandler.ok(res, player)
  } catch (error) {
    responseHandler.error(res)
  }
}
export default {
  getPlayer,
  createPlayer,
  getAllPlayers,
  removePlayer,
  updatePlayerById,
  getCurrentPlayerOfTable,
  getCurrentPlayerWithoutTable,
  getPlayersByTableId,
  rebuy,
}
