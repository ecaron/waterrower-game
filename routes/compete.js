const express = require('express')
const router = express.Router()
const debug = require('debug')('waterrower-game:compete')

const db = require('../lib/db')
const S4 = require('../s4')

router.post('/', function (req, res) {
  req.session.competitor = req.body.competitor
  res.redirect('/compete')
})
router.get('/', function (req, res) {
  if (!req.session.userId || !req.session.competitor) {
    return res.redirect('/')
  }
  db.rowers.find({ _id: { $in: [req.session.userId, req.session.competitor] } }, function (err, rowers) {
    if (err) debug(err)
    const data = {}
    rowers.forEach(function (rower) {
      if (rower._id === req.session.userId) data.rower = rower
      else data.competitor = rower
    })
    res.render('compete', data)
  })
})

router.get('/memory.json', function (req, res) {
  if (process.env.DEV) {
    S4.memoryMap.forEach(response => {
      if (typeof response.value === 'undefined') response.value = 1
      else response.value++
    })
  }
  res.send(S4.memoryMap)
})
router.get('/reset', function (req, res) {
  S4.memoryMap.forEach(response => {
    response.value = 0
  })
  res.redirect('/')
})
module.exports = router