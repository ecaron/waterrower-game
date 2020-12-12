require('dotenv').config()
const http = require('http')
const debug = require('debug')('waterrower-ble:main')
const S4 = require('./s4')
const memoryMap = require('./s4/memory-map')
const BluetoothPeripheral = require('./bluetooth-peripheral')
const UsbPeripheral = require('./usb-peripheral')

const mainUsb = async function (callback, testMode) {
  const rower = new S4(memoryMap)
  if (testMode) {
    return rower.fakeRower(callback)
  }
  const rowerPort = await rower.findPort()
  if (rowerPort !== false) {
    return rower.startRower(callback)
  }
  // wait till we get the right serial
  debug('[Init] Awaiting WaterRower S4.2 to be connected to USB port')

  // monitor USB attach and detach events
  const usbPeripheral = new UsbPeripheral()
  usbPeripheral.monitorWr(function () {
    rower.startRower(callback)
  }, rower.stopRower(rower))
}

const main = function () {
  const listener = function () {
    const ble = new BluetoothPeripheral('WaterRower S4')
    return function (event) {
      console.log(event)
      if ('watts' in event) {
        ble.notify(event)
      }
    }
  }
  mainUsb(listener, process.env.TEST_MODE)

  const requestListener = function (req, res) {
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.end(JSON.stringify(memoryMap))
  }

  const server = http.createServer(requestListener)
  server.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running on ${process.env.PORT || 8000}`)
  })
}

main()
