const mysql = require('mysql')

const delay = async time =>
    new Promise(resolve => {
        const timer = setTimeout(() => {
            clearTimeout(timer)
            resolve()
        }, time)
    })

class App {
    constructor({ opts, params: { reconnect, stepInc, stepSumMax } = {} }) {
        this.pool = mysql.createPool(opts)

        this.mustReconnect = reconnect
        this.stepInc = stepInc || 50
        this.stepSumMax = stepSumMax || 3000
    }

    escape(str) {
        return this.pool.escape(str)
    }

    async getConnection({ step = 0, stepSum = 0 }) {
        const con = await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                clearTimeout(timer)
                const err = new Error('ECONNREFUSED')

                reject(err)
            }, this.stepSumMax)

            this.pool.getConnection((err, connection) => {
                clearTimeout(timer)

                // TODO DEV - emulate connection errors
                // if (Math.random() < 0.3) {
                // 	connection.release()
                // 	reject({code: 'ECONNREFUSED'})
                // }

                if (err) {
                    reject(err)

                    return
                }

                resolve(connection)
            })
        })
            .then(res => ({ status: 'ok', connection: res }))
            .catch(err => ({ status: 'no', err }))

        if (con.status === 'ok') {
            return con.connection
        }

        if (this.mustReconnect) {
            return this.reconnect({ err: con.err, step: step + 1, stepSum })
        }

        return Promise.reject(con.err)
    }

    async reconnect({ err = {}, step, stepSum }) {
        if (
            ['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST'].includes(
                err.code || ''
            )
        ) {
            if (stepSum > this.stepSumMax) {
                return Promise.reject(err)
            }

            const newDelay = step * this.stepInc

            await delay(newDelay)

            return this.getConnection({ step, stepSum: stepSum + newDelay })
        }

        return Promise.reject(err)
    }

    async sql(query) {
        const con = await this.getConnection()
            .then(res => ({ status: 'ok', connection: res }))
            .catch(err => ({ status: 'no', err }))

        if (con.status === 'no') {
            return Promise.reject(con.err)
        }

        return new Promise((resolve, reject) => {
            con.connection.query(query, (err, res) => {
                con.connection.release()

                if (err) {
                    reject(err)

                    return
                }

                resolve(res)
            })
        })
    }
}

module.exports = App
