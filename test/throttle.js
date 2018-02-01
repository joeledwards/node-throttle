const tap = require('tap')
const throttle = require('../lib/throttle')

function observer (inner) {
  function obs (...args) {
    obs.args = args
    obs.callCount++

    if (obs.inner) {
      obs.result = obs.inner(...args)
      return obs.result
    }
  }

  obs.callCount = 0
  obs.inner = inner

  return obs
}

function nullableArg (arg, defaultArg) {
  if (arg === null) {
    return
  }

  if (arg === undefined) {
    return defaultArg
  }

  return arg
}

function throttleTest ({
  minDelay,
  maxDelay,
  reportFunc,
  nowFunc,
  timerFunc
}) {
  const options = {
    minDelay,
    maxDelay,
    reportFunc: nullableArg(reportFunc, observer()),
    nowFunc: nullableArg(nowFunc, observer(() => 0)),
    timerFunc: nullableArg(timerFunc, observer(() => () => {}))
  }

  const notify = throttle(options)

  return {notify, ...options}
}

tap.test('should not call timer if maxDelay = null and no notifications', t => {
  const {notify, reportFunc, timerFunc, nowFunc} = throttleTest({
    minDelay: 1,
    maxDelay: null
  })

  t.equal(timerFunc.callCount, 0)

  nowFunc.inner = () => 1
  notify()
  t.equal(reportFunc.callCount, 1)
  t.equal(timerFunc.callCount, 0)

  notify()
  t.equal(reportFunc.callCount, 1)
  t.equal(timerFunc.callCount, 1)

  t.done()
})

tap.test('maxDelay should be set to default when not supplied', t => {
  const {reportFunc, timerFunc} = throttleTest({
    minDelay: 1
  })

  t.equal(reportFunc.callCount, 0)
  t.equal(timerFunc.callCount, 1)
  t.equal(timerFunc.args[0], 5000)

  t.done()
})
tap.test('minDelay should be set to default when not supplied', t => {
  const {notify, reportFunc, timerFunc, nowFunc} = throttleTest({
    maxDelay: 2000
  })

  t.equal(reportFunc.callCount, 0)
  t.equal(timerFunc.callCount, 1)
  t.equal(timerFunc.args[0], 2000)

  nowFunc.inner = () => 200
  notify()
  t.equal(reportFunc.callCount, 0)
  t.equal(timerFunc.callCount, 2)
  t.equal(timerFunc.args[0], 800)

  nowFunc.inner = () => 500
  notify()
  t.equal(reportFunc.callCount, 0)
  t.equal(timerFunc.callCount, 3)
  t.equal(timerFunc.args[0], 500)

  t.done()
})

tap.test('minDelay should be set to default when null', t => {
  const {notify, reportFunc, timerFunc, nowFunc} = throttleTest({
    minDelay: null,
    maxDelay: 2000
  })

  t.equal(reportFunc.callCount, 0)
  t.equal(timerFunc.callCount, 1)
  t.equal(timerFunc.args[0], 2000)

  nowFunc.inner = () => 200
  notify()
  t.equal(reportFunc.callCount, 0)
  t.equal(timerFunc.callCount, 2)
  t.equal(timerFunc.args[0], 800)

  nowFunc.inner = () => 500
  notify()
  t.equal(reportFunc.callCount, 0)
  t.equal(timerFunc.callCount, 3)
  t.equal(timerFunc.args[0], 500)

  t.done()
})

tap.test('when maxDelay < minDelay, minDelay will be used', t => {
  const {timerFunc} = throttleTest({
    minDelay: 3,
    maxDelay: 2
  })

  t.equal(timerFunc.callCount, 1)
  t.equal(timerFunc.args[0], 3)

  t.done()
})

tap.test('should set timer from maxDelay when there are no notifications', t => {
  const {reportFunc, timerFunc} = throttleTest({
    minDelay: 1,
    maxDelay: 2
  })

  t.equal(reportFunc.callCount, 0)
  t.equal(timerFunc.callCount, 1)
  t.equal(timerFunc.args[0], 2)

  t.done()
})

tap.test('should set timer from minDelay when there is at least one notification', t => {
  const {notify, reportFunc, timerFunc} = throttleTest({
    minDelay: 1,
    maxDelay: 2
  })

  t.equal(timerFunc.callCount, 1)

  notify()
  t.equal(reportFunc.callCount, 0)
  t.equal(timerFunc.callCount, 2)
  t.equal(timerFunc.args[0], 1)

  t.done()
})

tap.test('timer should be reset after timer function is invoked', t => {
  const {reportFunc, timerFunc, nowFunc} = throttleTest({
    minDelay: 5,
    maxDelay: 10
  })

  t.equal(reportFunc.callCount, 0)
  t.equal(timerFunc.callCount, 1)
  t.equal(timerFunc.args[0], 10)

  nowFunc.inner = () => 5
  timerFunc.args[1]()
  t.equal(reportFunc.callCount, 1)
  t.equal(timerFunc.callCount, 2)
  t.equal(timerFunc.args[0], 10)

  t.done()
})

tap.test('should set timer to remainder of minDelay when there are notifications', t => {
  const {notify, reportFunc, timerFunc, nowFunc} = throttleTest({
    minDelay: 5,
    maxDelay: 10
  })

  t.equal(timerFunc.callCount, 1)
  t.equal(timerFunc.args[0], 10)
  nowFunc.inner = () => 2

  notify()
  t.equal(reportFunc.callCount, 0)
  t.equal(timerFunc.callCount, 2)
  t.equal(timerFunc.args[0], 3)

  t.done()
})

tap.test('a replacement report function can be supplied to notify', t => {
  const reporterA = observer()
  const reporterB = observer()
  const {notify, nowFunc} = throttleTest({
    minDelay: 1,
    maxDelay: 2,
    reportFunc: reporterA
  })

  t.equal(reporterA.callCount, 0)
  t.equal(reporterB.callCount, 0)

  nowFunc.inner = () => 1
  notify()
  t.equal(reporterA.callCount, 1)
  t.equal(reporterB.callCount, 0)

  nowFunc.inner = () => 2
  notify({reportFunc: reporterB})
  t.equal(reporterA.callCount, 1)
  t.equal(reporterB.callCount, 1)

  nowFunc.inner = () => 3
  notify()
  t.equal(reporterA.callCount, 1)
  t.equal(reporterB.callCount, 2)

  t.done()
})

tap.test('should be able to halt when default timer',  t => {
  const {reportFunc, notify} = throttleTest({
    minDelay: 100,
    maxDelay: 0,
    timerFunc: null
  })

  notify({force: true})
  t.equal(reportFunc.callCount, 1)

  notify({halt: true})
  t.equal(reportFunc.callCount, 1)

  t.done()
})

tap.test('a lengthy sequence of throttle interactions', t => {
  const {notify, reportFunc, timerFunc, nowFunc} = throttleTest({
    minDelay: 1,
    maxDelay: 2
  })

  t.equal(reportFunc.callCount, 0)
  t.equal(nowFunc.result, 0)
  t.equal(timerFunc.callCount, 1)
  t.equal(timerFunc.args[0], 2)

  notify()
  t.equal(reportFunc.callCount, 0)
  t.equal(nowFunc.result, 0)
  t.equal(timerFunc.callCount, 2)
  t.equal(timerFunc.args[0], 1)

  nowFunc.inner = () => 1
  notify()
  t.equal(reportFunc.callCount, 1)
  t.equal(reportFunc.args[0], 2)
  t.equal(nowFunc.result, 1)
  t.equal(timerFunc.callCount, 3)
  t.equal(timerFunc.args[0], 2)

  notify()
  notify()
  notify()
  t.equal(reportFunc.callCount, 1)

  nowFunc.inner = () => 2
  notify()
  t.equal(reportFunc.callCount, 2)
  t.equal(reportFunc.args[0], 4)

  t.done()
})

tap.test('force should trigger a report early', t => {
  const {notify, reportFunc, timerFunc, nowFunc} = throttleTest({
    minDelay: 1,
    maxDelay: 2
  })

  t.equal(reportFunc.callCount, 0)
  t.equal(nowFunc.result, 0)
  t.equal(timerFunc.callCount, 1)
  t.equal(timerFunc.args[0], 2)

  notify({force: true})
  t.equal(reportFunc.callCount, 1)
  t.equal(reportFunc.args[0], 1)
  t.equal(nowFunc.result, 0)
  t.equal(timerFunc.callCount, 2)
  t.equal(timerFunc.args[0], 2)

  nowFunc.inner = () => 1
  notify()
  t.equal(reportFunc.callCount, 2)
  t.equal(reportFunc.args[0], 1)
  t.equal(nowFunc.result, 1)
  t.equal(timerFunc.callCount, 3)
  t.equal(timerFunc.args[0], 2)

  t.done()
})
