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

function throttleTest ({minDelay, maxDelay}) {
  const options = {
    minDelay,
    maxDelay,
    reportFunc: observer(),
    nowFunc: observer(() => 0),
    timerFunc: observer()
  }

  const notify = throttle(options)

  return {notify, ...options}
}

tap.test('should not call timer if no maxDelay and no notifications', t => {
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

tap.test('when maxDelay < minDelay, minDelay will be used', t => {
  const {notify, reportFunc, timerFunc, nowFunc} = throttleTest({
    minDelay: 3,
    maxDelay: 2
  })

  t.equal(timerFunc.callCount, 1)
  t.equal(timerFunc.args[0], 3)

  t.done()
})

tap.test('should set timer from maxDelay when there are no notifications', t => {
  const {notify, reportFunc, timerFunc, nowFunc} = throttleTest({
    minDelay: 1,
    maxDelay: 2
  })

  t.equal(reportFunc.callCount, 0)
  t.equal(timerFunc.callCount, 1)
  t.equal(timerFunc.args[0], 2)

  t.done()
})

tap.test('should set timer from minDelay when there is at least one notification', t => {
  const {notify, reportFunc, timerFunc, nowFunc} = throttleTest({
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
