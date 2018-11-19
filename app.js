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
var isScorecardCacheUpToDate = false;

var courseList = [];
var courses = {};
var isCourseCacheUpToDate = false;

app.use(bodyParser.json());

app.set('view engine', 'ejs'); // set the view engine to use ejs 

// Able to access other css files
app.use(express.static(__dirname));

app.get('/', function(req, res) {
	if(!isScorecardCacheUpToDate)
	{
		// Contact the database so that we can display the scorecards
		db.selectFromDb('SELECT * FROM scorecards INNER JOIN courses ON scorecards.course = courses.course ORDER BY scorecards.date DESC')
		.then(function(result) {
			// Put the scorecards in the right format to display on the screen
			result.forEach((row) => {
				scorecardList.push(stats.getScorecardResultFromRow(row));
			});
			isScorecardCacheUpToDate = true;
			res.render('index', {scorecards: scorecardList});
		}, function(err) {
			console.log(`ERROR - ${err}`);
		});
	}
	else
	{
		res.render('index', {scorecards: scorecardList});
	}
})
.get('/home', function(req, res){
	res.render('index');
})
.get('/myStats', function(req,res){
	let userStats = stats.populateStatsFromScorecardList(scorecardList);
	res.render('myStats', {userStats: userStats});
})
.get('/addCourse', function(req, res) {
	res.render('addCourse');
})
.post('/addCourse', urlencodedparser, function(req, res) {
	let keyArr = "";
	let valueArr = "";

	// Create strings for the sql insert statement 
	for(var value in req.body)
	{
		keyArr += value + ",";

		// This removes all invalid characters from the input course string
		let input = req.body[value].replace(/[^a-zA-Z0-9. ]/g, '');
		valueArr += `'${input}',`;
	}

	keyArr = keyArr.slice(0,-1);
	valueArr = valueArr.slice(0,-1);

	let sql = `INSERT INTO courses(${keyArr}) VALUES (${valueArr});`

	db.insertIntoDb(sql);

	// Clear the cache
	isCourseCacheUpToDate = false;
	courseList = [];
	courses = {};

	res.render('addCourse');
})
.get('/addScorecard', function(req,res){
	if(!isCourseCacheUpToDate)
	{
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

			isCourseCacheUpToDate = true;
			res.render('addScorecard', {courses: courseList});
		}, function(err) {
			console.log(`ERROR - ${err}`);
		});
	}
	else
	{
		res.render('addScorecard', {courses: courseList});
	}
})
.get('/addScorecard/getCourse', function(req,res){
	// Should never get to this url without updating the cache first
	if(isCourseCacheUpToDate)
	{
		var currentCourse = req.query.getCourse;
		res.send({pars: courses[currentCourse]})
	}
	// TODO add redirect to home page if this is not the case
})
.post('/addScorecard', urlencodedparser, function(req, res){

	// Format the data for easier insertion into the database
	let keyArr = "";
	let valueArr = "";

	for(var value in req.body)
	{
		keyArr += value + ",";
		valueArr += "'" + req.body[value] + "',";
	}

	keyArr = keyArr.slice(0,-1);
	valueArr = valueArr.slice(0,-1);

	let sql = `INSERT INTO scorecards(${keyArr}) VALUES (${valueArr});`
	db.insertIntoDb(sql);

	// Clear the scorecard cache
	isScorecardCacheUpToDate = false;
	scorecardList = [];

	res.redirect('/addScorecard');
})
.use(function(res,req,next){
	// If the user inputs an invalid path we just redirect to the home page
})
.listen(3000);

console.log("Listening on port 3000 (http://localhost:3000)");
