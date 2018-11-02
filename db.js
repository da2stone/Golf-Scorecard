/****************************************
Class for accessing the sqlite database
****************************************/

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./golfdb.db');
	 
module.exports = {
	selectFromDb: 
	function selectFromDb(sql)
	{	 
		return new Promise(function(resolve, reject) {
			db.all(sql, [], (err, rows) => {
			  if (err) {
			    reject(err);
			  }
			  else
			  {
			  	resolve(rows);
			  }
		  	});
		});
	},

	insertIntoDb:
	function insertIntoDb(sql)
	{
		db.run(sql, [], function(err) {
			if(err)
			{
				console.log("ERROR INSERTING INTO DATABASE");
				console.log(err);
			}
		});
	}
}