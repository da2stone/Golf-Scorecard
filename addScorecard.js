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
                $("span#par1").html(data.pars[0]);
                $("span#par2").html(data.pars[1]);
                $("span#par3").html(data.pars[2]);
                $("span#par4").html(data.pars[3]);
                $("span#par5").html(data.pars[4]);
                $("span#par6").html(data.pars[5]);
                $("span#par7").html(data.pars[6]);
                $("span#par8").html(data.pars[7]);
                $("span#par9").html(data.pars[8]);
                $("span#par10").html(data.pars[9]);
                $("span#par11").html(data.pars[10]);
                $("span#par12").html(data.pars[11]);
                $("span#par13").html(data.pars[12]);
                $("span#par14").html(data.pars[13]);
                $("span#par15").html(data.pars[14]);
                $("span#par16").html(data.pars[15]);
                $("span#par17").html(data.pars[16]);
                $("span#par18").html(data.pars[17]);
            }
        });
    });

    $("input.addHole").on("change", function() {
        var scoreOut = parseFloat($("#addHole1").val()) 
                    + parseFloat($("#addHole2").val())
                    + parseFloat($("#addHole3").val())
                    + parseFloat($("#addHole4").val())
                    + parseFloat($("#addHole5").val())
                    + parseFloat($("#addHole6").val())
                    + parseFloat($("#addHole7").val())
                    + parseFloat($("#addHole8").val())
                    + parseFloat($("#addHole9").val());

        var scoreIn = parseFloat($("#addHole10").val()) 
                    + parseFloat($("#addHole11").val())
                    + parseFloat($("#addHole12").val())
                    + parseFloat($("#addHole13").val())
                    + parseFloat($("#addHole14").val())
                    + parseFloat($("#addHole15").val())
                    + parseFloat($("#addHole16").val())
                    + parseFloat($("#addHole17").val())
                    + parseFloat($("#addHole18").val());

        $("#scoreOut").html(scoreOut);
        $("#scoreIn").html(scoreIn);
        $("#scoreTotal").html(scoreIn + scoreOut);
    });
});

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

    let scoreList = [];

    scores.forEach(element => {
        scoreList.push(element.value);
    });

    // Send the post request with the new values
    let xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/addScorecard", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(`course=${course}&date=${date}&scoreList=${scoreList}`);

    // Reset the data
    window.location.href = '/';
}

// Clear the add scorecard panel
function addScorecardCancel()
{
    document.body.style.background = "white";
    document.getElementById("addScorecard").style.display = 'none';
}