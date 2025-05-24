/*eslint-env node*/
const crypto = require('crypto')
const fs = require('fs')

module.exports = {
  BundleToFunction: function (options) {
    const moduleName = options.moduleName
    const idDev = options.isDev
    if (!moduleName) {
      throw new Error('moduleName is required!')
    }
    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& означает всё найденное совпадение
    }
    const devStrToReplace = new RegExp(`(root\\["${moduleName}"\\] = )(factory\\(.[^\\)]*\\))`) // looking for root["rupayment"] = factory(...)
    const prodStrsToReplace = new RegExp(`:(.(\\.${escapeRegExp(moduleName)}|\\[['"]${escapeRegExp(moduleName)}['"]\\])=)(.\\(.[^\\)]*\\))`) // lookin for :e.moduleMame=t(...)
    return {
      apply: compiler => {
        compiler.hooks.emit.tap('emitPlugin', compilation => {
          const src = compilation.assets['index.js'].source()
          compilation.assets['index.js'].source = () => {
            if (idDev) {
              return src.replace(devStrToReplace, (...args) => {
                return `${args[1]}function(){${args[1]}${args[2]}}`
              })
            } else {
              return src.replace(prodStrsToReplace, (...args) => {
                return `:${args[1]}function(){${args[1]}${args[3]}}`
              })
            }
          }
        })
      },
    }
  },
  StreamInfo: function (options) {
    const dictionariesPath = options.dictionariesPath
    return {
      apply: compiler => {
        compiler.hooks.emit.tap('emitPlugin', compilation => {
          let locales = []
          if (fs.existsSync(dictionariesPath)) {
            locales = fs.readdirSync(dictionariesPath).map(file => file.toString().split('.')[1])
          }

          const data = {
            hash: crypto.createHash('md5').update(new Date().toString()).digest('hex'),
            locales,
            hasStyles: !!Array.from(compilation.fileDependencies).find(f => /(\.scss|\.css)$/.test(f)),
          }

          compilation.assets[`./info.json`] = {
            size: function () {
              return 0
            },
            source: function () {
              return JSON.stringify(data)
            },
          }
        })
      },
    }
  },
  IndexDtsGenerator: function (options) {
    return {
      apply: compiler => {
        compiler.hooks.emit.tap('emitPlugin', compilation => {
          compilation.assets['./index.d.ts'] = {
            size: function () {
              return 0
            },
            source: function () {
              return `export * from './declarations/${options.folder}'`
            },
          }
        })
      },
    }
  },
  FileGenerator: function (options) {
    return {
      apply: compiler => {
        compiler.hooks.emit.tap('emitPlugin', compilation => {
          compilation.assets[`./${options.name}`] = {
            size: function () {
              return 0
            },
            source: function () {
              return options.content
            },
          }
        })
      },
    }
  },
  DeclarationsOnlyForFolder: function (options) {
    return {
      apply: compiler => {
        compiler.hooks.emit.tap('emitPlugin', compilation => {
          compilation.assets[`./index.d.ts`] = {
            size: function () {
              return 0
            },
            source: function () {
              return `export * from './declarations'`
            },
          }
          if (!compilation.assets['declarations/index.d.ts']) {
            Object.keys(compilation.assets).forEach(key => {
              if (key.startsWith('declarations/') && !key.startsWith(`declarations/${options.folder}`)) {
                delete compilation.assets[key]
              }
            })

            Object.keys(compilation.assets).forEach(key => {
              if (key.startsWith(`declarations/${options.folder}`)) {
                const nextName = 'declarations' + key.replace(`declarations/${options.folder}`, '')
                compilation.assets[nextName] = compilation.assets[key]
                delete compilation.assets[key]
              }
            })
          }
        })
      },
    }
  },
}
