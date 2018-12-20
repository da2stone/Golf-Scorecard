/***************************************
 Class for adding courses and scorecards
***************************************/

// JQuery so that when the user selects a course it is auto populated
$(document).ready(function() {
    $("select").on("change", function() {
        var getSelectedCourse = "/getCourse?getCourse=" + this.value;

        $.ajax({
            'url': getSelectedCourse,
            'type': 'GET',
            'success': function(data) {
                for(var i = 1; i <= 18; i++)
                {
                    $(`span#par${i}`).html(data.pars[i - 1]);
                }
            }
        });
    });

    // Auto populate the score when the user enters the full nine
    $("input.addHole").on("change", function() {
        autoAdd("#addHole", "#score");
    });

    // Auto populate the number of putts when the user enters the full nine
    $("input.addPutts").on("change", function() {
        autoAdd("#addPutts", "#putts");
    });
});

function autoAdd(id, id2)
{
    var scoreOut = 0;
    var scoreIn = 0;
    
    for(var i = 1; i <= 9; i++) { scoreOut += parseFloat($(`${id}${i}`).val()); }
    for(var i = 10; i <= 18; i++) { scoreIn += parseFloat($(`${id}${i}`).val()); }

    $(`${id2}Out`).html(scoreOut);
    $(`${id2}In`).html(scoreIn);
    $(`${id2}Total`).html(scoreIn + scoreOut);
}

// Add Course or Add Scorecard tabs 
function openTab(tabId)
{
    if(tabId == "insertCourse")
    {
        document.getElementById("insertScorecard").style.display = 'none';
        document.getElementById("insertCourse").style.display = 'inline-block';
    }
    else
    {
        document.getElementById("insertCourse").style.display = 'none';
        document.getElementById("insertScorecard").style.display = 'inline-block';
    }
}

// Shows the add scorecard page
function addScorecard()
{
    document.body.style.background = "grey";
    document.getElementById("addScorecard").style.display = 'inline-block';
    document.getElementById("insertScorecard").style.display = 'inline-block';
}

// Save the course to the database
function addCourseSave()
{
    var courseName = document.getElementById('course').value;
    var rating = document.getElementById('rating').value;
    var slope = document.getElementById('slope').value;
    var parList = document.querySelectorAll('input.par');

    var pars = [];
    parList.forEach(element => {
        pars.push(element.value);
    });

    // Clear 
    addScorecardCancel();

    // Send the post request with the new values
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/addCourse", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(`course=${courseName}&rating=${rating}&slope=${slope}&pars=${pars}`);
    
    // Reset the data
    window.location.href = '/';
}

// Save the scorecard to the database
function addScorecardSave()
{
    let courseSelect = document.getElementById(`addScorecardCourse`);
    let course = courseSelect.options[courseSelect.selectedIndex].text;
    let scores = document.querySelectorAll(`input.addHole`);
    let date = document.getElementById(`addScorecardDate`).value;
    let putts = document.querySelectorAll(`input.addPutts`);
    let girs = document.querySelectorAll(`input.gir`);

    let scoreList = [];
    scores.forEach(element => {
        scoreList.push(element.value);
    });

    let puttList = [];
    putts.forEach(element => {
        puttList.push(element.value);
    });

    let girList = [];
    girs.forEach(element => {
        girList.push(element.checked === true ? 1 : 0);
    });

    // Send the post request with the new values
    let xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/addScorecard", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(`course=${course}&date=${date}&scoreList=${scoreList}&puttList=${puttList}&girList=${girList}`);

    // Reset the data
    window.location.href = '/';
}

// Clear the add scorecard panel
function addScorecardCancel()
{
    document.body.style.background = "white";
    document.getElementById("addScorecard").style.display = 'none';
}