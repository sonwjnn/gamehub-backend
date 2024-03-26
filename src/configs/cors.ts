import { WHITELIST_DOMAINS } from '../utils/contant'

interface CorsOptions {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => void
}

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    if (!origin || WHITELIST_DOMAINS.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`${origin} not allowed by CORS.`))
    }
  },
}

export { corsOptions }
