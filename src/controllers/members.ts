import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getMemberById, getMembers } from '../db/members'

const getAllMembers = async (req: Request, res: Response) => {
  try {
    const members = await getMembers()

    responseHandler.ok(res, members)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteMemberById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await db.member.delete({
      where: {
        id,
      },
    })

    responseHandler.ok(res)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateMemberById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existingMember = await getMemberById(id)

    if (!existingMember) {
      return responseHandler.badrequest(res, 'Member not found')
    }

    const updatedMember = await db.member.update({
      where: {
        id,
      },
      data: {
        ...req.body,
      },
    })

    responseHandler.ok(res, {
      member: updatedMember,
      message: 'Update member successfully!',
    })
  } catch (error) {
    responseHandler.error(res)
  }
}

const createMember = async (req: Request, res: Response) => {
  try {
    const member = await db.member.create({
      data: {
        ...req.body,
      },
    })

    responseHandler.ok(res, member)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const member = await getMemberById(id)

    responseHandler.ok(res, member)
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  getMember,
  createMember,
  getAllMembers,
  deleteMemberById,
  updateMemberById,
}
