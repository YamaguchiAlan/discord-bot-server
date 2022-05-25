import 'dotenv/config'
import connectDb from './database'
import app from './server'

connectDb()
app.listen(app.get('port'), () => {
  console.log(`Server on port ${app.get('port')}`)
})
