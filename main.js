const delay = async(time) => {
	return new Promise((resolve) => {
		const timer = setTimeout(() => {
			clearTimeout(timer)
			resolve()
		}, time)
	})
		.catch(err => {
			console.error(err)
		})
}

class DBMysqlAsync {
	constructor(opts, params = {}) {
		const mysql = require('mysql')
		this.pool = mysql.createPool(opts)

		this.mustReconnect = params.reconnect
		this.stepInc = params.stepInc || 50
		this.stepSumMax = params.stepSumMax || 3000
	}

	escape(str) {
		return this.pool.escape(str)
	}

	async getConnection(step = 0, stepSum = 0) {
		const con = await new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				clearTimeout(timer)
				reject({code: 'ECONNREFUSED'})
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
			.then(res => ({status: 'ok', connection: res}))
			.catch(err => ({status: 'no', err}))

		if (con.status === 'ok') {
			return con.connection
		}

		if (this.mustReconnect) {
			return await this.reconnect(con.err, step + 1, stepSum)
		}

		return Promise.reject(con.err)
	}

	async reconnect(err = {}, step, stepSum) {
		if ([
			'ECONNREFUSED',
			'PROTOCOL_CONNECTION_LOST'
		].includes(err.code || '')) {
			if (stepSum > this.stepSumMax) {
				return Promise.reject(err)
			}

			const newDelay = step * this.stepInc
			stepSum += newDelay
			await delay(newDelay)

			return this.getConnection(step, stepSum)
		}

		return Promise.reject(err)
	}


	async sql(query) {
		const con = await this.getConnection()
			.then(res => ({status: 'ok', connection: res}))
			.catch(err => ({status: 'no', err}))

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

module.exports = (opts, params) => {
	if (!opts) {
		return
	}

	return new DBMysqlAsync(opts, params)
}
