/****************************************
Class for getting the user's stats
****************************************/

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./golfdb.db');
	 
module.exports = {
    populateStatsFromScorecardList:
    function populateStatsFromScorecardList(scorecardList) {
        let userStats = {
            perHoleStats: [],
            numHoleInOne: 0,
            avgScoreToPar: 0,
            bestScoreToPar: null,
        };

        let numRounds = scorecardList.length;
        let numHoles = 0;
        let numEagles = 0;
        let numBirdies = 0;
        let numPars = 0;
        let numBogeys = 0;
        let numDoubles = 0;
        let totalScoreToPar = 0;

        scorecardList.forEach((scorecard) => {
            let parList = scorecard.pars;
            let scoreList = scorecard.scores;

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
            if(userStats.bestScoreToPar == null || userStats.bestScoreToPar > currentScoreToPar)
                userStats.bestScoreToPar = currentScoreToPar;
        });

        let eaglePerc = parseFloat(numEagles / numHoles * 100).toFixed(2);
        let birdiePerc = parseFloat(numBirdies / numHoles * 100).toFixed(2);
        let parPerc = parseFloat(numPars / numHoles * 100).toFixed(2);
        let bogeyPerc = parseFloat(numBogeys / numHoles * 100).toFixed(2);
        let doublePerc = parseFloat(numDoubles / numHoles * 100).toFixed(2);

        userStats.perHoleStats.push(eaglePerc);
        userStats.perHoleStats.push(birdiePerc);
        userStats.perHoleStats.push(parPerc);
        userStats.perHoleStats.push(bogeyPerc);
        userStats.perHoleStats.push(doublePerc);

        userStats.avgScoreToPar = parseFloat(totalScoreToPar / numRounds).toFixed(2);

        return userStats;
    },

    getScorecardResultFromRow:
    function getScorecardResultFromRow(row) {
        let scorecard = {
        'course': row.course,
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
            if(col != "course" && col != "date")
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