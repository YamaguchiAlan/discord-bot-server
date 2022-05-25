import mongoose from 'mongoose'

const URI = process.env.MONGODB_URI
  ? process.env.MONGODB_URI
  : 'mongodb://localhost/databasetest'

const connectDb = () => {
  mongoose.connect(URI, (err) => {
    if (err) throw err
    console.log('DB is connected')
  })
}

export default connectDb
