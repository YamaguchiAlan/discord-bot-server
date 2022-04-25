import express, {Express} from "express"
import cors, {CorsOptions} from "cors"
import cookieParser from "cookie-parser";
import session, {SessionOptions} from 'express-session';
import MongoStore from "connect-mongo"
import morgan from "morgan";
import serverRoutes from '../routes/server.routes'
import userRoutes from '../routes/user.routes'

const app: Express = express()
const production = process.env.PRODUCTION

// Setting
app.set('port', process.env.PORT || 4000);
app.set('trust proxy', true);

// Middlewares
app.use(express.urlencoded({extended: true}));
app.use(express.json())

if(!production){
    app.use(morgan("dev"))
}

const corsOpt: CorsOptions = {
    origin: production ? ["https://app.yamabot.tk", "https://main.d15femcy0yv5xj.amplifyapp.com"] : "http://localhost:3000",
    credentials: true
}
app.use(cors(corsOpt))

const sixHour: number = 1000 * 60 * 60 * 6;
const URI: string = process.env.MONGODB_URI
    ? process.env.MONGODB_URI
    : 'mongodb://localhost/databasetest'

const sessionOpt: SessionOptions = {
    secret: (process.env.COOKIE_SECRET as string),
    saveUninitialized: false,
    cookie: {
        maxAge: sixHour,
        httpOnly: true,
        secure: production ? true : false,
        sameSite: production ? "none" : "strict"
    },
    resave: false,
    unset: "destroy",
    store: MongoStore.create({
        mongoUrl: URI,
        ttl: sixHour
    })
}
app.use(session(sessionOpt));

app.use(cookieParser());

// Routes
app.use(serverRoutes);
app.use(userRoutes)

export default app