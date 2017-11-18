class DBMysqlAsync {
	constructor(opts) {
		const mysql = require('mysql')
		this.pool = mysql.createPool(opts)
	}

	escape(str) {
		return this.pool.escape(str)
	}

	async getConnection() {
		return new Promise((resolve, reject) => {
			this.pool.getConnection((err, connection) => {
				if (err) {
					reject(err)
				} else {
					resolve(connection)
				}
			})
		})
	}

	async sql(query) {
		const connection = await this.getConnection()
			.catch(err => console.error('Mysql getConnection', err))

		if (!connection) {
			return Promise.reject('no connection')
		}

		return new Promise((resolve, reject) => {
			connection.query(query, (err, rows) => {
				connection.release()
				if (err) {
					reject(err)
				} else {
					resolve(rows)
				}
			})
		})
	}
}

module.exports = (opts) => {
	if (!opts) {
		console.error('Empty opts')
		return
	}

	return new DBMysqlAsync(opts)
}
