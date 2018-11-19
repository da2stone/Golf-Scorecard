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

function getFavouriteCourse(courseList)
{
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

    return favouriteCourse.course;
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

        // Initialize the overall variables
        let totalNumRounds  = scorecardList.length;
        let totalNumHoles   = 0;
        let totalNumEagles  = 0;
        let totalNumBirdies = 0;
        let totalNumPars    = 0;
        let totalNumBogeys  = 0;
        let totalNumDoubles = 0;
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
                
                totalNumHoles++;
                thisHoleToPar = scoreList[i] - parList[i]; 
                currentScoreToPar += thisHoleToPar;
                if(scoreList[i] == 1)
                    userStats.totalNumHoleInOne++;

                if(thisHoleToPar <= -2)
                    totalNumEagles++;
                else if(thisHoleToPar == -1)
                    totalNumBirdies++;
                else if(thisHoleToPar == 0)
                    totalNumPars++;
                else if(thisHoleToPar == 1)
                    totalNumBogeys++;
                else if(thisHoleToPar >= 2)
                    totalNumDoubles++;
            }

            totalScoreToPar += currentScoreToPar;
            if(userStats.bestScoreToPar == "N/A" || userStats.bestScoreToPar > currentScoreToPar)
                userStats.bestScoreToPar = currentScoreToPar;
        });

        userStats.favouriteCourse = getFavouriteCourse(courseList);

        userStats.perHoleStats[0] = parseFloat(totalNumEagles / totalNumHoles * 100).toFixed(2);;
        userStats.perHoleStats[1] = parseFloat(totalNumBirdies / totalNumHoles * 100).toFixed(2);;
        userStats.perHoleStats[2] = parseFloat(totalNumPars / totalNumHoles * 100).toFixed(2);;
        userStats.perHoleStats[3] = parseFloat(totalNumBogeys / totalNumHoles * 100).toFixed(2);;
        userStats.perHoleStats[4] = parseFloat(totalNumDoubles / totalNumHoles * 100).toFixed(2);;

        userStats.avgScoreToPar = parseFloat(totalScoreToPar / totalNumRounds).toFixed(2);

        if(totalNumRounds >= 5)
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
        'cssClasses': []
        };

        let scoreList = Object.values(row).slice(2,20);
        let parList = Object.values(row).slice(20,38);

        let frontNineScore = 0;
        let backNineScore = 0;

        for(var i = 0; i < 18; i++)
        {
            let score = scoreList[i];
            let par = parList[i];
            scorecard.scores.push(score);
            scorecard.pars.push(par);

            let difference = score - par;
            if(difference <= -2)
                scorecard.cssClasses.push("eagle");
            if(difference == -1)
                scorecard.cssClasses.push("birdie");
            if(difference == 0)
                scorecard.cssClasses.push("par");
            if(difference == 1)
                scorecard.cssClasses.push("bogey");
            if(difference >= 2)
                scorecard.cssClasses.push("double");

            if(i < 9)
                frontNineScore += score;
            else
                backNineScore += score;
            if (i == 8)
            {
                scorecard.scores.push(frontNineScore);
                scorecard.pars.push("Out");
                scorecard.cssClasses.push("out");
            }
        }

        scorecard.scores.push(backNineScore);
        scorecard.scores.push(frontNineScore + backNineScore);
        scorecard.pars.push("In");
        scorecard.pars.push("Total");
        scorecard.cssClasses.push("in");
        scorecard.cssClasses.push("total");

        return scorecard;
    }
}