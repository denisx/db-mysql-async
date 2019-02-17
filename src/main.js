const mysql = require("mysql");

module.exports = class DBMysqlPoolAsync {
	constructor(opts) {
		this.pool = mysql.createPool(opts);
	}

	escape(str) {
		return this.pool.escape(str);
	}

	async getConnection() {
		return new Promise((resolve, reject) => {
			this.pool.getConnection((err, connection) => {
				if (err) {
					reject(err);

					return;
				}

				resolve(connection);
			});
		});
	}

	async sql(query) {
		const connection = await this.getConnection().catch(err => {
			console.error(err);
		});

		if (!connection) {
			return null;
		}

		return new Promise((resolve, reject) => {
			connection.query(query, (err, rows) => {
				connection.release();

				if (err) {
					reject(err);

					return
				}

				resolve(rows);
			});
		});
	}
};
