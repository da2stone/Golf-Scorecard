/****************************************
Main class for the logic of the Web App
****************************************/

var express = require("express");
var bodyParser = require("body-parser");

var db = require("./db");
var stats = require("./stats");

var app = express();
var urlencodedparser = bodyParser.urlencoded({extended: false});

var scorecardList = [];
var isCacheUpToDate = false;

var courseList = [];
var courses = {};

app.use(bodyParser.json());

app.set('view engine', 'ejs'); // set the view engine to use ejs 

// Able to access other css files
app.use(express.static(__dirname));

app.get('/', function(req, res) {
	if(!isCacheUpToDate)
	{
		// Contact the database so that we can display the scorecards
		db.selectFromDb('SELECT * FROM scorecards INNER JOIN courses ON scorecards.course = courses.course ORDER BY scorecards.date DESC')
		.then(function(result) {
			// Put the scorecards in the right format to display on the screen
			result.forEach((row) => {
				scorecardList.push(stats.getScorecardResultFromRow(row));
			});
			db.selectFromDb('SELECT * FROM courses')
			.then(function(result) {
	
				result.forEach((row) => {
					courseList.push(row.course);
	
					let parForCourse = [];
					for(var par in row)
					{
						if(par != "course")
						{
							parForCourse.push(row[par]);
						}
					}
					courses[row.course] = parForCourse;
				});
	
				isCacheUpToDate = true;
				res.render('index', {scorecards: scorecardList, courses: courseList});
			}, function(err) {
				console.log(`ERROR - ${err}`);
			});
		}, function(err) {
			console.log(`ERROR - ${err}`);
		});
	}
	else
	{
		res.render('index', {scorecards: scorecardList, courses: courseList});
	}
})
.get('/home', function(req, res){
	res.render('index');
})
.get('/myStats', function(req,res){
	let userStats = stats.populateStatsFromScorecardList(scorecardList);
	res.render('myStats', {userStats: userStats});
})
.post('/addCourse', urlencodedparser, function(req, res) {
	// This removes all invalid characters from the input course string
	let courseName = req.body.course.replace(/[^a-zA-Z0-9. ]/g, '');
	let slope = req.body.slope;
	let rating = req.body.rating;
	let parList = req.body.pars;

	let sql = `INSERT INTO courses(course`;
	
	for (var i = 1; i <= 18; ++i)
	{
		sql += `,par${i}`;
	}

	sql += `,rating,slope) VALUES ('${courseName}',${parList},${rating},${slope});`;

	db.insertIntoDb(sql);

	// Clear the cache
	isCacheUpToDate = false;
	scorecardList = [];
	courseList = [];
	courses = {};
})
.get('/getCourse', function(req,res){
	// Should never get to this url without updating the cache first
	if(isCacheUpToDate)
	{
		var currentCourse = req.query.getCourse;
		res.send({pars: courses[currentCourse]})
	}
})
.post('/addScorecard', urlencodedparser, function(req, res){
	// This removes all invalid characters from the input course string
	let courseName = `'${req.body.course.replace(/[^a-zA-Z0-9. ]/g, '')}'`;
	let date = `'${req.body.date}'`;
	let scoreList = req.body.scoreList;
	let puttList = req.body.puttList;
	let girList = req.body.girList;

	let sql = `INSERT INTO scorecards(course, date`;
	for (var i = 1; i <= 18; ++i) { sql += `,hole${i}`; }
	sql += `) VALUES (${courseName},${date},${scoreList})`;

	db.insertIntoDb(sql, function(lastId) {
		let sql2 = `INSERT INTO scorecards_putts(id, putt1`;
		for (var i = 2; i <= 18; ++i) { sql2 += `,putt${i}`; }
		sql2 += `) VALUES (${lastId}, ${puttList})`;
	
		let sql3 = `INSERT INTO scorecards_gir(id, gir1`;
		for (var i = 2; i <= 18; ++i) { sql3 += `,gir${i}`; }
		sql3 += `) VALUES (${lastId}, ${girList})`;

		db.insertIntoDb(sql2);
		db.insertIntoDb(sql3);
	});

	// Clear the cache
	isCacheUpToDate = false;
	scorecardList = [];
	courseList = [];
	courses = {};
})
.post('/editScorecard', urlencodedparser, function(req, res) {
	var input = req.body.input.split(',');
	let id = input[0];
	let sql = `UPDATE scorecards SET date = '${input[1]}'`;

	for(var i = 2; i < input.length; i++)
	{
		sql += `,hole${i-1} = '${input[i]}'`
	}

	sql += ` WHERE scorecards.id = ${id};`
	db.insertIntoDb(sql);

	// Clear the cache
	isCacheUpToDate = false;
	scorecardList = [];
	courseList = [];
	courses = {};
})
.use(function(res,req,next){
	// If the user inputs an invalid path we just redirect to the home page
})
.listen(3000);

console.log("Listening on port 3000 (http://localhost:3000)");
