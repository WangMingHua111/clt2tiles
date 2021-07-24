const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const zlib = require('zlib')

exports.defalut = function (clt, { outdir = '', alias = '3dtiles', zip = false }, parentDir = '') {
    clt = path.resolve(clt)
    if (!fs.existsSync(clt)) throw new Error(`file not exist：${clt}`)
    const dir = path.isAbsolute(outdir) ? path.resolve(path.join(outdir, parentDir, alias)) : path.resolve(path.join(path.dirname(clt), parentDir, outdir, alias))
    if (fs.existsSync(dir)) {
        fs.rmdirSync(dir, {
            recursive: true
        })
    }
    fs.mkdirSync(dir, {
        recursive: true
    })
    var db = new sqlite3.Database(
        clt,
        sqlite3.OPEN_READONLY,
        function (err) {
            if (err) {
                return console.log(err.message)
            }
            console.log('connect database successfully')
        }
    )
    db.each('SELECT tiles.* FROM tiles', (err, result) => {
        if (err) {
            return console.log(err.message)
        } else {
            var tile = result.tile
            if (zip) {
                tile = zlib.unzipSync(tile)
            }
            fs.writeFileSync(path.resolve(path.join(dir, result.path)), tile)
            console.log(result.path)
        }
    })
    console.log('output dir ' + dir)
}