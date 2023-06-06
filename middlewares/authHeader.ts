import { RequestHandler } from 'express'
const secret = process.env.HEADER_SECRET

const production = process.env.PRODUCTION

const authHeader: RequestHandler = (req, res, next) => {
  const auth = req.headers['origin-auth-secret']

  const validOrigins = production ? ['https://www.yamabot.run.place', 'https://main.d1jzn7tu5zhaji.amplifyapp.com'] : ['http://localhost:3000']
  const origin = (req.headers.origin as string)
  const isOrigin = validOrigins.includes(origin)

  if (auth === secret && isOrigin) {
    return next()
  }

  return res.sendStatus(401)
}

export default authHeader
