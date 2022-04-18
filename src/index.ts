require("dotenv").config()

require('./database')
import app from './server'

app.listen(app.get("port"), () => {
    console.log(`Server on port ${app.get('port')}`);
})