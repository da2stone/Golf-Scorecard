/****************************************
Class for getting the user's stats
****************************************/

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./golfdb.db');

/*
    Handicap calculations from the following sites:
    https://www.americangolf.com/blog/golf-tips/golf-handicap-how-to-calculate-your-score/
    https://gao.ca/golfer-resources/about-handicapping/establish-a-handicap/
*/
function getLowestXHandicapDifferentialFromList(x, handicapDifferentialList)
{
    let sum = 0;
    for(var i = 0; i < x; i++)
        sum += handicapDifferentialList[i];

    return sum / x * 0.96;
}

function getHandicapDifferentialForCourse(course)
{
    return (course.score - course.rating) * 113 / course.slope;
}

function getHandicapFromHandicapDifferentialList(handicapDifferentialList)
{
    handicapDifferentialList.sort((x, y) => x - y);

    let numRounds = handicapDifferentialList.length;

    if(numRounds < 5)
        return 'N/A';
    else if (numRounds <= 6)
        return getLowestXHandicapDifferentialFromList(1, handicapDifferentialList);
    else if (numRounds <= 8)
        return getLowestXHandicapDifferentialFromList(2, handicapDifferentialList);
    else if (numRounds <= 10)
        return getLowestXHandicapDifferentialFromList(3, handicapDifferentialList);
    else if (numRounds <= 12)
        return getLowestXHandicapDifferentialFromList(4, handicapDifferentialList);
    else if (numRounds <= 14)
        return getLowestXHandicapDifferentialFromList(5, handicapDifferentialList);
    else if (numRounds <= 16)
        return getLowestXHandicapDifferentialFromList(6, handicapDifferentialList);
    else if (numRounds == 17)
        return getLowestXHandicapDifferentialFromList(7, handicapDifferentialList);
    else if (numRounds == 18)
        return getLowestXHandicapDifferentialFromList(8, handicapDifferentialList);
    else if (numRounds == 19)
        return getLowestXHandicapDifferentialFromList(9, handicapDifferentialList);
    else if (numRounds == 20)
        return getLowestXHandicapDifferentialFromList(10, handicapDifferentialList);
    else
    {
        // TODO - only the 20 most recent games
    }
}

module.exports = {
    populateStatsFromScorecardList:
    function populateStatsFromScorecardList(scorecardList) {
        let userStats = {
            perHoleStats: [0,0,0,0,0],
            numHoleInOne: 0,
            avgScoreToPar: 0,
            bestScoreToPar: "N/A",
            handicap: 'N/A',
            favouriteCourse: "N/A"
        };

        if(scorecardList.length == 0)
            return userStats;

        let numRounds = scorecardList.length;
        let numHoles = 0;
        let numEagles = 0;
        let numBirdies = 0;
        let numPars = 0;
        let numBogeys = 0;
        let numDoubles = 0;
        let totalScoreToPar = 0;
        let handicapDifferentialList = [];
        let courseList = {};

        scorecardList.forEach((scorecard) => {
            let parList = scorecard.pars;
            let scoreList = scorecard.scores;

            if(courseList[scorecard.course] == null)
                courseList[scorecard.course] = 1;
            else
                courseList[scorecard.course]++;

            let course = {
                'score': scoreList[scoreList.length - 1],
                'slope': scorecard.slope,
                'rating': scorecard.rating
            }

            let handicapDifferential = getHandicapDifferentialForCourse(course);
            handicapDifferentialList.push(handicapDifferential);

            let currentScoreToPar = 0;
            for(var i = 0; i < parList.length; ++i)
            {
                if(isNaN(parList[i]))
                    continue;
                
                numHoles++;
                thisHoleToPar = scoreList[i] - parList[i]; 
                currentScoreToPar += thisHoleToPar;
                if(scoreList[i] == 1)
                    userStats.numHoleInOne++;

                if(thisHoleToPar <= -2)
                    numEagles++;
                else if(thisHoleToPar == -1)
                    numBirdies++;
                else if(thisHoleToPar == 0)
                    numPars++;
                else if(thisHoleToPar == 1)
                    numBogeys++;
                else if(thisHoleToPar >= 2)
                    numDoubles++;
            }

            totalScoreToPar += currentScoreToPar;
            if(userStats.bestScoreToPar == "N/A" || userStats.bestScoreToPar > currentScoreToPar)
                userStats.bestScoreToPar = currentScoreToPar;
        });

        let favouriteCourse = {
            'course': '',
            'numRounds': 0
        }

        for(var course in courseList)
        { 
            if(courseList[course] > favouriteCourse.numRounds)
            {
                favouriteCourse.course = course;
                favouriteCourse.numRounds = courseList[course];
            }
        }

        userStats.favouriteCourse = favouriteCourse.course;

        let eaglePerc = parseFloat(numEagles / numHoles * 100).toFixed(2);
        let birdiePerc = parseFloat(numBirdies / numHoles * 100).toFixed(2);
        let parPerc = parseFloat(numPars / numHoles * 100).toFixed(2);
        let bogeyPerc = parseFloat(numBogeys / numHoles * 100).toFixed(2);
        let doublePerc = parseFloat(numDoubles / numHoles * 100).toFixed(2);

        userStats.perHoleStats[0] = eaglePerc;
        userStats.perHoleStats[1] = birdiePerc;
        userStats.perHoleStats[2] = parPerc;
        userStats.perHoleStats[3] = bogeyPerc;
        userStats.perHoleStats[4] = doublePerc;

        userStats.avgScoreToPar = parseFloat(totalScoreToPar / numRounds).toFixed(2);

        if(numRounds >= 5)
            userStats.handicap = parseFloat(getHandicapFromHandicapDifferentialList(handicapDifferentialList)).toFixed(2);

        return userStats;
    },

    getScorecardResultFromRow:
    function getScorecardResultFromRow(row) {
        let scorecard = {
        'course': row.course,
        'slope': row.slope,
        'rating': row.rating,
        'date': row.date,
        'scores': [],
        'pars': [],
        'classes': []
        };
        let pars = false;

        let count = 1;
        let frontNineScore = 0;
        let backNineScore = 0;
        for(var col in row) {
            if(col != "course" && col != "date" && col != "slope" && col != "rating")
            {
                if(col == "par1")
                {
                    pars = true;
                    count = 1;
                }
                if(!pars)
                {
                    scorecard.scores.push(row[col]);
                    if(count < 10)
                        frontNineScore += row[col];
                    else
                        backNineScore += row[col];
                    count++;
                    if(count == 10)
                        scorecard.scores.push(frontNineScore);
                }
                else
                {
                    if(count == 10)
                        scorecard.pars.push("Out");
                    
                    scorecard.pars.push(row[col]);
                    count++;
                }
            }
        }

        scorecard.pars.push("In");
        scorecard.pars.push("Total");
        scorecard.scores.push(backNineScore);
        scorecard.scores.push(frontNineScore + backNineScore);

        for(var i = 0; i < 19; ++i)
        {
            if(i == 9)
                scorecard.classes.push("in");
            else
            {
                let par = scorecard.pars[i];
                let score = scorecard.scores[i];
                let difference = score - par;
                if(difference <= -2)
                    scorecard.classes.push("eagle");
                if(difference == -1)
                    scorecard.classes.push("birdie");
                if(difference == 0)
                    scorecard.classes.push("par");
                if(difference == 1)
                    scorecard.classes.push("bogey");
                if(difference >= 2)
                    scorecard.classes.push("double");
            }
        }

        scorecard.classes.push("out");
        scorecard.classes.push("total");

        return scorecard;
    }
}