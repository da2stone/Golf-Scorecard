/************************************
Class for editing existing scorecards
*************************************/

function editScorecard(scorecardId, length) {
    document.body.style.background = "grey";
    for(var i = 0; i < length; ++i)
    {
        if(i == scorecardId)
            document.getElementById(`scorecard-${i}`).style.display='inline-block';
        else
            document.getElementById(`scorecard-${i}`).style.display='none';
    }
}

function save(scorecardId, length) {
    var scorecard = document.querySelector(`#scorecard-${scorecardId}`);
    var inputs = scorecard.querySelectorAll("input");

    var newFields = [];

    inputs.forEach(element => {
        newFields.push(element.value);
    });

    // Clear the popup
    editScorecard(-1, length);
    document.body.style.background = "white";

    // Send the post request with the new values
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/editScorecard", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(`input=${newFields}`);
}

function cancel(scorecardId) {
    document.body.style.background = "white";
    document.getElementById(`scorecard-${scorecardId}`).style.display='none';
}