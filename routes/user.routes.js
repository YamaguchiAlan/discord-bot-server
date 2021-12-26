const {Router} = require("express")
const router = Router()
const cors = require("cors")

const { getToken, authenticate } = require("../controllers/user.controller")

router.get("/", (req, res) => {
    res.sendStatus(200)
})

router.get("/api/token", cors({origin:true, credentials: true}), getToken)

router.get("/api/authenticate", authenticate)

module.exports = router