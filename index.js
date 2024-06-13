const express = require("express");
const app = express()

const dotenv = require('dotenv')
dotenv.config()

const cors = require('cors')
app.use(cors())
app.use(express.static("public"))
app.use('/uploads', express.static("uploads"))

const http = require("http");
const server = http.createServer(app)

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
mongoose.connect(process.env.DATABASE_URL)

const db = mongoose.connection

db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to database'))

server.listen(process.env.PORT || 8080, () => {
  console.log(`server is listening on ${process.env.PORT || 8080}`);
});


const userRouters = require('./routes/users')
const foodRouters = require('./routes/food')
const foodRecourdRouters = require('./routes/foodRecord')
const foodRecourdLogRouters = require('./routes/foodRecordLog')
const recipeRouters = require('./routes/recipe')
const bookmarkRecipeRouters = require('./routes/bookmarkRecipe')

app.use(express.json());
app.use('/users', userRouters)
app.use('/food', foodRouters)
app.use('/foodRecord', foodRecourdRouters)
app.use('/foodRecordLog', foodRecourdLogRouters)
app.use('/recipe', recipeRouters)
app.use('/bookmarkRecipe', bookmarkRecipeRouters)

app.get('/', (req, res) => {
  res.send('Server online')
})

module.exports = app