import express from 'express'
import cookieParser from 'cookie-parser'
// import helmet from 'helmet';
// import xssClean from 'xss-clean'
import compression from 'compression'
import bodyParser from 'body-parser'

import expressRateLimit from 'express-rate-limit'
import hpp from 'hpp'
import cors from 'cors'
// import logger from './logger';

const configureMiddleware = (app: express.Express) => {
  app.use(express.json())

  app.use(compression())

  // Cookie Parser
  app.use(cookieParser())

  // Body Parser
  app.use(bodyParser.json())

  // Helmet improves API security by setting some additional header checks
  // app.use(helmet());

  // Additional protection against XSS attacks
  // app.use(xssClean())

  // Add rate limit to API (100 requests per 10 mins)
  // app.use(
  //   expressRateLimit({
  //     windowMs: 10 * 60 * 1000,
  //     max: 100,
  //   })
  // )

  // Prevent http param pollution
  app.use(hpp())

  // Enable CORS
  app.use(
    cors({
      credentials: true,
      // ...corsOptions,
    })
  )

  // Custom logging middleware
  // app.use(logger)
}

export default configureMiddleware
