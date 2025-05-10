module.exports = [
  function (_, request, callback) {
    if (/^@codeless\/.*/.test(request)) {
      return callback(null, request)
    }
    callback()
  },
  function (_, request, callback) {
    if (/^puppeteer.*/.test(request)) {
      return callback(null, request)
    }
    callback()
  },
]
