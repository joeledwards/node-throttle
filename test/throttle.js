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

tap.test('throttle', t => {
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
