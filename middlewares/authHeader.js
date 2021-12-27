const secret = process.env.HEADER_SECRET;

const authHeader = (req, res, next) => {
    const auth = req.headers.sfd;

    if(auth === secret){
        return next();
    }
    return res.sendStatus(401)
}

module.exports = authHeader;