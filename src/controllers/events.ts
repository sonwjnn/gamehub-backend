import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getEventById, getEvents } from '../db/events'

const getAllEvents = async (req: Request, res: Response) => {
  try {
    const events = await getEvents()

    responseHandler.ok(res, events)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await db.event.delete({
      where: {
        id,
      },
    })

    responseHandler.ok(res)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateEventById = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    responseHandler.error(res)
  }
}

const createEvent = async (req: Request, res: Response) => {
  try {
    const event = await db.event.create({
      data: {
        ...req.body,
      },
    })

    responseHandler.ok(res, event)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const event = await getEventById(id)

    responseHandler.ok(res, event)
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  getEvent,
  createEvent,
  getAllEvents,
  deleteEventById,
  updateEventById,
}
