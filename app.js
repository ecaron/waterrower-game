require('dotenv').config()
const debug = require('debug')('waterrower-game:main')
const express = require('express')
const session = require('express-session')
const nunjucks = require('nunjucks')
const http = require('http')
const WebSocket = require('ws')
const path = require('path')
const Datastore = require('nedb')

const S4 = require('./s4')
const memoryMap = require('./s4/memory-map')

const db = new Datastore({ filename: path.join(__dirname, 'db', 'datafile'), autoload: true })

const app = express()
const map = new Map()

app.set('views', path.join(__dirname, 'views'))
nunjucks.configure('views', {
  express: app,
  autoescape: true
})
app.set('view engine', 'njk')

const sessionParser = session({
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET || 'forgotToSetEnv',
  resave: false
})

app.get('/memory.json', function (req, res) {
  if (process.env.DEV) {
    memoryMap.forEach(response => {
      if (typeof response.value === 'undefined') response.value = 1
      else response.value++
    })
  }
  res.send(memoryMap)
})
app.get('/reset', function (req, res) {
  memoryMap.forEach(response => {
    response.value = 0
  })
  res.redirect('/')
})
app.use(sessionParser)

app.use('/chart', express.static(path.join(__dirname, 'node_modules', 'chart.js', 'dist')))
app.use('/materialize', express.static(path.join(__dirname, 'node_modules', 'materialize-css', 'dist')))

app.get('/', function (req, res) {
  if (req.session.userId) {
    res.render('index')
  } else {
    res.render('login')
  }
})

app.post('/login', function (req, res) {
  req.session.userId = 'test' + new Date()
  res.send({ result: 'OK', message: 'Session updated' })
})

app.delete('/logout', function (request, response) {
  const ws = map.get(request.session.userId)

  console.log('Destroying session')
  request.session.destroy(function () {
    if (ws) ws.close()

    response.send({ result: 'OK', message: 'Session destroyed' })
  })
})

app.use(express.static(path.join(__dirname, 'public')))


//
// Create an HTTP server.
//
const server = http.createServer(app)

//
// Create a WebSocket server completely detached from the HTTP server.
//
const wss = new WebSocket.Server({ clientTracking: false, noServer: true })

server.on('upgrade', function (request, socket, head) {
  console.log('Parsing session from request...')

  sessionParser(request, {}, () => {
    if (!request.session.userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    console.log('Session is parsed!')

    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, request)
    })
  })
})

wss.on('connection', function (ws, request) {
  const userId = request.session.userId

  map.set(userId, ws)

  ws.on('message', function (message) {
    //
    // Here we can now use session parameters.
    //
    console.log(`Received message ${message} from user ${userId}`)
  })

  ws.on('close', function () {
    map.delete(userId)
  })
})

server.listen(process.env.PORT || 8080, function () {
  console.log(`Listening on http://localhost:${process.env.PORT || 8080}`)
})