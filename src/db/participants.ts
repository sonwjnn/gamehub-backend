import { db } from '../lib/db'

export const getParticipants = async () => {
  try {
    const participant = await db.participant.findMany({})
    return participant
  } catch (error) {
    return []
  }
}

export const getParticipantById = async (id: string) => {
  try {
    const participant = await db.participant.findFirst({
      where: {
        id,
      },
    })
    return participant
  } catch (error) {
    return null
  }
}

export const handlePacticipantFold = async (id: string) => {
  try {
    const participant = await db.participant.update({
      where: {
        id,
      },
      data: {
        isFolded: true,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })
    return participant
  } catch (error) {
    return null
  }
}

export const handlePacticipantRaise = async (id: string) => {
  try {
    const participant = await db.participant.update({
      where: {
        id,
      },
      data: {
        isFolded: true,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })
    return participant
  } catch (error) {
    return null
  }
}

export const handlePacticipantCall = async (id: string) => {
  try {
    const participant = await db.participant.update({
      where: {
        id,
      },
      data: {
        isFolded: true,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })
    return participant
  } catch (error) {
    return null
  }
}

export const handlePacticipantCheck = async (id: string) => {
  try {
    const participant = await db.participant.update({
      where: {
        id,
      },
      data: {
        isChecked: true,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })
    return participant
  } catch (error) {
    return null
  }
}
