module.exports = throttle

function defaultTimer (delay, action) {
  let timerRef = setTimeout(action, delay)

  const clear = () => {
    if (timerRef) {
      clearTimeout(timerRef)
      timerRef = null
    }
  }

  return clear
}

// report throttle
function throttle ({
  reportFunc,
  minDelay,
  maxDelay = 5000,
  nowFunc,
  timerFunc
}) {
  const now = nowFunc || (() => Date.now())
  const timer = timerFunc || defaultTimer

  minDelay = (minDelay === null || minDelay === undefined) ? 1000 : minDelay

  let notifyCount = 0
  let lastReport = 0
  let clearTimer = null

  function setTimer (delayCap) {
    const delay = delayCap - Math.min(delayCap, now() - lastReport)
    clearTimer = timer(delay, tryReport)
  }

  function resetTimer () {
    if (clearTimer) {
      clearTimer()
      clearTimer = null
    }

    if (notifyCount > 0) {
      setTimer(minDelay)
    } else if (maxDelay && maxDelay > 0) {
      setTimer(Math.max(maxDelay, minDelay))
    }
  }

  function tryReport ({
    force = false,
    halt = false
  } = {}) {
    if (force || (now() - lastReport >= minDelay)) {
      if (reportFunc) {
        reportFunc(notifyCount)
      }

      lastReport = now()
      notifyCount = 0
    }

    if (!halt) {
      resetTimer()
    } else if (clearTimer) {
      clearTimer()
    }
  }

  function notify ({
    reportFunc: newReportFunc,
    force = false,
    halt = false
  } = {}) {
    if (typeof newReportFunc === 'function') {
      reportFunc = newReportFunc
    }

    notifyCount++
    tryReport({force, halt})
  }

  resetTimer()

  return notify
}
