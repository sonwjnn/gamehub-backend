import crypto from 'crypto'
import { verify } from 'jsonwebtoken'

export const authentication = (salt: string, password: string): string => {
  return crypto
    .createHmac('sha256', [salt, password].join('/'))
    .update(process.env.SECRET_TOKEN!)
    .digest('hex')
}

export const random = () => crypto.randomBytes(128).toString('base64')

export async function jwtVerify(token: string, secret: string): Promise<any> {
  return new Promise((resolve, reject) => {
    verify(token, secret, (err, decoded) => {
      if (err) return reject(err)
      resolve(decoded)
    })
  })
}
