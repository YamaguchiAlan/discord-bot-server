const {Router} = require("express")
const router = Router()
const cors = require("cors")
const authHeader = require("../middlewares/authHeader")

const { getToken, authenticate } = require("../controllers/user.controller")

router.get("/", cors({origin:true}), (req, res) => {
    res.status(200).send({isOk: true})
})

router.get("/api/token", getToken)

router.get("/api/authenticate", authHeader, authenticate)

module.exports = router