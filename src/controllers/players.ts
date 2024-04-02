import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getPlayerById, getPlayers } from '../db/players'

const getAllPlayers = async (req: Request, res: Response) => {
  try {
    const players = await getPlayers()

    responseHandler.ok(res, players)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deletePlayerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await db.player.delete({
      where: {
        id,
      },
    })

    responseHandler.ok(res)
  } catch (error) {
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
    const { tableId, userId } = req.body

    const player = await db.player.create({
      data: {
        tableId,
        userId,
      },
    })

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
export default {
  getPlayer,
  createPlayer,
  getAllPlayers,
  deletePlayerById,
  updatePlayerById,
  getCurrentPlayerOfTable,
}
