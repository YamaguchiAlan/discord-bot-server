const secret = process.env.HEADER_SECRET;

const authHeader = (req, res, next) => {
    const auth = req.headers["origin-auth-secret"];

    if(auth === secret){
        return next();
    }

    return res.sendStatus(401)
}

module.exports = authHeader;