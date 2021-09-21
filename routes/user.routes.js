const {Router} = require("express")
const router = Router()

const { getToken, authenticate } = require("../controllers/user.controller")

router.get("/api/token", getToken)

router.get("/api/authenticate", authenticate)

module.exports = router