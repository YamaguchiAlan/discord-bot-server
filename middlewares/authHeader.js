const secret = process.env.HEADER_SECRET;

const authHeader = (req, res, next) => {
    const auth = req.headers["origin-auth-secret"];

    const validOrigins = ["https://app.yamabot.tk", "https://main.d15femcy0yv5xj.amplifyapp.com"];
    const origin = req.headers["origin"];
    const isOrigin = validOrigins.includes(origin)

    if(auth === secret && isOrigin){
        return next();
    }

    return res.sendStatus(401)
}

module.exports = authHeader;