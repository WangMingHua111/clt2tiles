const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const zlib = require('zlib')
const _ = require('lodash')

function wrap(fn) {
    return new Promise((resolve, reject) => {
        fn(resolve, reject)
    })
}

exports.defalut = async function (clt, { outdir = '', alias = '3dtiles', zip = false, page = false, size = 1000 }, parentDir = '') {
    size = Number(size)
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
    const db = new sqlite3.Database(
        clt,
        sqlite3.OPEN_READONLY,
        function (err) {
            if (err) {
                return console.log(err.message)
            }
            console.log('connect database successfully')
        }
    )
    if (page) {
        const count = await wrap(r => db.get('SELECT COUNT(md5) as count FROM tiles', (err, row) => r(row.count)))
        for (let i = 0; i < count; i += size) {
            await wrap(r => {
                db.each('SELECT * FROM tiles limit ?,?', [i, size], (err, result) => {
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
                }, (err, count) => r(count))
            })
        }
    } else {
        await wrap(r => {
            db.each('SELECT * FROM tiles', (err, result) => {
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
            }, (err, count) => r(count))
        })
    }

    console.log('output dir ' + dir)
}