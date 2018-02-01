# throttle

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]


Controls the frequency at which a report function is called.

## Installation

```
npm install @buzuli/throttle
```

## Usage

```
const throttle = require('@buzuli/throttle')

const notify = throttle(options)
```

## API

The throttle package exports the function (aliased `throttle`). This function accepts an object (aliased `options`) and returns a notifier function (aliased `notify`).

### options
* `reportFunc` - the report function which will be run at the `maxDelay` interval
  * type is `function`
  * default is `undefined`
  * if `undefined` or `null`, it is a no-op not an error
  * may be replaced at any time using the `notify` function
* `minDelay` - reports will never run more frequently than this
  * type is `number`
  * units is milliseconds
  * default is `1000`
  * if `undefined` or `null`, the default value is used
* `maxDelay` - reports will be forced at this frequency
  * type is `number`
  * units is milliseconds
  * default is `5000`
  * if `undefined`, the default value is used
  * if `null` or `<= 0`, then reports will only run when triggered by a notifier event
  * if `< minDelay`, the value of `minDelay` will be used in its stead

### notify({reportFunc, force, halt})

The notifier function causes the internal notification count to increase, and will cause the report function to be run if `minDelay` has been met.

If `maxDelay` is `> 0`, reports will be forced when it has been `>= maxDelay` milliseconds since the last report.

If `maxDelay` is `null` or `<= 0` and the notify function has NOT been called, then reports will not be scheduled.

If `maxDelay` is `null` or `<= 0` and the notify function HAS been called, then a report will either be run (if time since last reports `> minDelay`) or will be schedule to run in `reportDelay = minDelay - (now - lastReport)`.

If `reportFunc` is a function, it will replace the report function for this and all further reports.

If `force` is true, the report will be run, even if the time elapsed since the last run is less than `minDelay`.

If `halt` is true, the next notification will not be scheduled, permitting the process to halt.

[travis-url]: https://travis-ci.org/joeledwards/node-throttle
[travis-image]: https://img.shields.io/travis/joeledwards/node-throttle/master.svg
[npm-url]: https://www.npmjs.com/package/@buzuli/throttle
[npm-image]: https://img.shields.io/npm/v/@buzuli/throttle.svg
