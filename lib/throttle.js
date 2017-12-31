module.exports = throttle

// report throttle
function throttle ({
  reportFunc,
  minDelay = 1000,
  maxDelay = 5000,
  nowFunc,
  timerFunc
}) {
  const now = nowFunc || (() => Date.now())
  const timer = timerFunc || ((delay, action) => setTimeout(action, delay))

  let notifyCount = 0
  let lastReport = 0
  let timerRef = null

  function setTimer (delayCap) {
    const delay = delayCap - Math.min(delayCap, now() - lastReport)
    timerRef = timer(delay, tryReport)
  }

  function resetTimer () {
    if (timerRef) {
      clearTimeout(timerRef)
      timerRef = null
    }

    if (notifyCount > 0) {
      setTimer(minDelay)
    } else if (maxDelay && maxDelay > 0) {
      setTimer(Math.max(maxDelay, minDelay))
    }
  }

  function tryReport () {
    if (now() - lastReport >= minDelay) {
      if (reportFunc) {
        reportFunc(notifyCount)
      }

      lastReport = now()
      notifyCount = 0
    }

    resetTimer()
  }

  function notify (newReportFunc) {
    if (typeof newReportFunc === 'function') {
      reportFunc = newReportFunc
    }

    notifyCount++
    tryReport()
  }

  resetTimer()

  return notify
}
