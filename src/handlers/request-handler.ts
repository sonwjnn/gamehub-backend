import { validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const error = validationResult(req)
  if (!error.isEmpty()) {
    return res.status(400).json({ message: error.array()[0].msg })
  }
  next()
}

export default {
  validate,
}
