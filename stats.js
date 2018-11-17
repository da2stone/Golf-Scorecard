/****************************************
Class for getting the user's stats
****************************************/

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./golfdb.db');
	 
module.exports = {
    populateStatsFromScorecardList:
    function populateStatsFromScorecardList(scorecardList) {
        let userStats = {
            numHoles: 0,
            numEagles:  0,
            numBirdies: 0,
            numPars:   0,
            numBogeys: 0,
            numDoubles: 0,
            numHoleInOne: 0,
            numRounds: 0,
            bestScoreToPar: null,
            totalScoreToPar: 0,
        };
        let courses = {};

        scorecardList.forEach((scorecard) => {
            userStats.numRounds++;
            let parList = scorecard.pars;
            let scoreList = scorecard.scores;

            let currentScoreToPar = 0;
            for(var i = 0; i < parList.length; ++i)
            {
                if(isNaN(parList[i]))
                    continue;
                
                userStats.numHoles++;
                thisHoleToPar = scoreList[i] - parList[i]; 
                currentScoreToPar += thisHoleToPar;
                if(scoreList[i] == 1)
                    userStats.numHoleInOne++;

                if(thisHoleToPar >= 2)
                    userStats.numEagles++;
                else if(thisHoleToPar == 1)
                    userStats.numBirdies++;
                else if(thisHoleToPar == 0)
                    userStats.numPars++;
                else if(thisHoleToPar == -1)
                    userStats.numBogeys++;
                else if(thisHoleToPar <= -2)
                    userStats.numDoubles++;
            }

            userStats.totalScoreToPar += currentScoreToPar;
            if(userStats.bestScoreToPar == null || userStats.bestScoreToPar > currentScoreToPar)
                userStats.bestScoreToPar = currentScoreToPar;
        });

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