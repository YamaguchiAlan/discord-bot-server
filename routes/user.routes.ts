import { Router, RequestHandler } from 'express'
import cors, { CorsOptions } from 'cors'
import authHeader from '../middlewares/authHeader'

import { getToken, authenticate, logout } from '../controllers/user.controller'
const router = Router()

const corsOpt: CorsOptions = { origin: true, credentials: true }
router.get<string, RequestHandler, any>('/', cors(corsOpt), (req, res) => {
  res.status(200).send({ isOk: true })
})

router.get('/api/token', getToken)

router.get('/api/authenticate', authHeader, authenticate)

router.get('/api/logout', authHeader, logout)

export default router
