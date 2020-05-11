const express = require('express')
const bodyParser = require('body-parser')
var path = require('path');
const app = express()
const db = require('./queries')
const port = 3000

app.use(bodyParser.json({limit: '50mb'}))
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: true
  })
)

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})

var dir = path.join(__dirname, 'Images');

app.use(express.static(dir));


app.post('/signIn/', db.signIn)
app.post('/signUp', db.signUp)
app.post('/getMainCategories', db.getMainCategories)
app.post('/getSubCategories', db.getSubCategories)
app.post('/addComplain', db.addComplain)
app.post('/loadComplains', db.loadComplains)
app.post('/searchComplain', db.searchComplain)
app.post('/getComplainStatus', db.getComplainStatus)

app.put('/userdfs/:id', db.updateUser)
app.delete('/usesdrs/:id', db.deleteUser)

app.listen(port, () => {
  var datetime = new Date();
  console.log(`Server running on port:- ${port} Started at:- ${datetime} `)
})