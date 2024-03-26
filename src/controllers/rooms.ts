import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getRoomById, getRooms } from '../db/rooms'

const getAllRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await getRooms()

    responseHandler.ok(res, rooms)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await db.room.delete({
      where: {
        id,
      },
    })

    responseHandler.ok(res)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateRoomById = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    responseHandler.error(res)
  }
}

const createRoom = async (req: Request, res: Response) => {
  try {
    const room = await db.room.create({
      data: {
        ...req.body,
      },
    })

    responseHandler.ok(res, room)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const room = await getRoomById(id)

    responseHandler.ok(res, room)
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  getRoom,
  createRoom,
  getAllRooms,
  deleteRoomById,
  updateRoomById,
}
