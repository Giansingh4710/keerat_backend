const express = require('express')
const app = express()
const cors = require('cors')
const { getShabads } = require('./logic')

app.use(
  cors({
    origin: '*', // or specify domains like 'http://example.com'
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.get('/', (req, res) => {
  res.send('Get all shabads data api')
})

app.get('/getShabads', (req, res) => {
  try {
    const results = getShabads(req.query.input)
    res.status(200).json({ results })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

const PORT = 3000
app.listen(PORT, (error) => {
  if (!error) {
    console.log(
      'Server is Successfully Running, and App is listening on port ' + PORT,
    )
  } else {
    console.log("Error occurred, server can't start", error)
  }
})
