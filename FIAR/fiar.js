// Game related initialisations
var grid;
var N = 7; // n x n grid
var tmp = getParameterByName("N");
if (tmp != ""){
    N = parseInt(tmp);
}

var turn; // Player whose turn it is (1 or 2)
var scores;
var totalmoves;
var maxmoves = N*N;
if (N % 2 == 1) { maxmoves-- }

grid = new Array();
for (i = 0; i < N; i++) {
    grid.push(new Array());
    for (j = 0; j < N; j++) {
        grid[i].push({piece: 0, valid:false});
    }
}

var p1button, p2button, p1div, p2div;

var lines = new Array();

//------------------------
// Raphael-related
var R;
var targets; // set of valid move squares

var BOARDSIZE  = 900;
tmp = getParameterByName("BOARDSIZE");
if (tmp != ""){
    BOARDSIZE = parseInt(tmp);
}

var PIECESIZE = BOARDSIZE / N;
var GRID_STYLE = { stroke: "#CCCCCC", "stroke-dasharray": "--" };
var DEFAULT_STYLE = { "stroke-width": 0, fill: "#000000" };
var TARGET_STYLE = { "stroke-width": 0, fill: "#CCCCCC", opacity: 0.23 };
var P_COLOURS = ["#cc0404", "#F29F05"];
var P_PIECES = [{ fill: P_COLOURS[0], opacity: 1 }, { fill: P_COLOURS[1], opacity: 1 }];
var P_LINES = [{ stroke: P_COLOURS[0], "stroke-width": 10 }, { stroke: P_COLOURS[1], "stroke-width": 10 }];

var score_displays;

//------------------------
window.onload = function () {

    // Initialise Raphael
    R = Raphael("gameBoard", BOARDSIZE, BOARDSIZE);

    // Draw the grid lines
    for (i = 1; i < N; i ++) {
        R.path(["M", i*PIECESIZE, 0, "L", i*PIECESIZE, BOARDSIZE].join(",")).attr(GRID_STYLE);
        R.path(["M", 0, i*PIECESIZE, "L", BOARDSIZE, i*PIECESIZE].join(",")).attr(GRID_STYLE);
    }
    
    for (i = 0; i < N; i++) {
        for (j = 0; j < N; j++) {
            grid[i][j].r = R.circle(i*PIECESIZE + PIECESIZE/2, j*PIECESIZE + PIECESIZE/2, 0.9 * PIECESIZE/2);
            grid[i][j].r.i = i;
            grid[i][j].r.j = j;
            grid[i][j].movef = function() { makeMove(this.i, this.j) };
        }
    }
    
    p1button = document.getElementById("bottomButton");
    p2button = document.getElementById("topButton");
    p1div = document.getElementById("p1turn");
    p2div = document.getElementById("p2turn");
    
    startNewGame();
    
};

function startNewGame() {

    turn = 1;
    totalmoves = 0;
    scores = [0, 0];
    
    //   Clear the grid array
    for (i = 0; i < N; i++) {
        for (j = 0; j < N; j++) {
            if (grid[i][j].valid) {
                grid[i][j].r.unclick(grid[i][j].movef);
                grid[i][j].valid = false;
            }
            grid[i][j].piece = 0;
            grid[i][j].r.attr(DEFAULT_STYLE);
        }
    }
    
    for (i = 0; i < lines.length; i++) {
        lines[i].path.remove();
    }
    lines = new Array();
    
    p1div.className = "myturn";
    p2div.className = "notmyturn";
    
    p1button.innerHTML = "Undo"; p1button.className = "inactiveButton";
    p2button.innerHTML = "Undo"; p2button.className = "inactiveButton";
    
    score_displays = [document.getElementById("p1score"), document.getElementById("p2score")];
    
    score_displays[0].innerHTML = 0;
    score_displays[1].innerHTML = 0;
    
    showValidMoves ();
    
}

var HVLIM = N-3;
var DLIM = N-4;

function checkNewLines (i, j) {
    // A move have just been made at (i, j) with piece $turn
    /* R  V  L
        o o o
         ooo
       GooOoo H
         ooo
        o o o  */
    // Check for vertical
    for (k = Math.max(0, j-3); k < Math.min(HVLIM, j+3); k++) {
        if (grid[i][k].piece == turn &&
            grid[i][k+1].piece == turn &&
            grid[i][k+2].piece == turn &&
            grid[i][k+3].piece == turn) {
            addLine([i,k], [i,k+1], [i,k+2], [i,k+3]);
        }
    }
    // Check for horizontal
    for (k = Math.max(0, i-3); k < Math.min(HVLIM, i+3); k++) {
        if (grid[k][j].piece == turn &&
            grid[k+1][j].piece == turn &&
            grid[k+2][j].piece == turn &&
            grid[k+3][j].piece == turn) {
            addLine([k,j], [k+1,j], [k+2,j], [k+3,j]);
        }
    }
    // check right diagonal
    for(k = -Math.min(3, i, j); k <= Math.min(0, DLIM-i, DLIM-j); k++) {
        if (grid[i+k][j+k].piece == turn &&
            grid[i+k+1][j+k+1].piece == turn &&
            grid[i+k+2][j+k+2].piece == turn &&
            grid[i+k+3][j+k+3].piece == turn) {
            addLine([i+k,j+k], [i+k+1,j+k+1], [i+k+2,j+k+2], [i+k+3,j+k+3]);
        }
    }
    // check left diagonal
    
    for(k = -Math.min(3, N-1-i, j); k <= Math.min(0, i-3, DLIM-j); k++) {
        if (grid[i-k][j+k].piece == turn &&
            grid[i-k-1][j+k+1].piece == turn &&
            grid[i-k-2][j+k+2].piece == turn &&
            grid[i-k-3][j+k+3].piece == turn) {
            addLine([i-k,j+k], [i-k-1,j+k+1], [i-k-2,j+k+2], [i-k-3,j+k+3]);
        }
    }
}

function addLine(p1, p2, p3, p4) {
    // Add the line IFF no other line exists sharing two pieces with this one.
    for (i = 0; i < lines.length; i++) {
        if (getLineIntersect([p1,p2,p3,p4], lines[i].line).length > 1) {
            return;
        }
    }
    lines.push({line: [p1, p2, p3, p4],
                path: R.path(["M", p1[0]*PIECESIZE + PIECESIZE/2, p1[1] * PIECESIZE + PIECESIZE/2,
                              "L", p4[0]*PIECESIZE + PIECESIZE/2, p4[1] * PIECESIZE + PIECESIZE/2]).attr(P_LINES[turn-1])
                });
    scores[turn - 1]++;
}

function showValidMoves () {
    for (i = 0; i < N; i++) {
        // Check for valid moves connecting to top
        j = 0;
        while (j < N && grid[i][j].piece != 0) { j++; }
        if (j < N && !grid[i][j].valid) {
            grid[i][j].r.attr(TARGET_STYLE).click(grid[i][j].movef);
            grid[i][j].valid = true;
        }
        // .................. connecting to bottom
        j = N - 1;
        while (j >= 0 && grid[i][j].piece != 0) { j--; }
        if (j >= 0 && !grid[i][j].valid) {
            grid[i][j].r.attr(TARGET_STYLE).click(grid[i][j].movef);
            grid[i][j].valid = true;
        }
    }
    for (j = 0; j < N; j++) {
        // Check for valid mvoes connecting to left
        i = 0;
        while (i < N && grid[i][j].piece != 0) { i++; }
        if (i < N && !grid[i][j].valid) {
            grid[i][j].r.attr(TARGET_STYLE).click(grid[i][j].movef);
            grid[i][j].valid = true;
        }
        // Check for valid mvoes connecting to left
        i = N - 1;
        while (i >= 0 && grid[i][j].piece != 0) { i--; }
        if (i >= 0 && !grid[i][j].valid) {
            grid[i][j].r.attr(TARGET_STYLE).click(grid[i][j].movef);
            grid[i][j].valid = true;
        }
    }
}

function makeMove (i, j) {
    // Colour and remove clicking of the piece
    grid[i][j].r.attr(P_PIECES[turn - 1]).unclick(grid[i][j].movef);
    grid[i][j].valid = false;
    grid[i][j].piece = turn;
    
    totalmoves++;
    checkNewLines(i, j);
    
    if (turn == 1) {
        p1button.className = "inactiveButton"; p1div.className = "notmyturn";
        p2button.className = "activeButton"; p2div.className = "myturn";
        turn = 2;
    } else {
        p2button.className = "inactiveButton"; p1div.className = "myturn";
        p1button.className = "activeButton"; p2div.className = "notmyturn";
        turn = 1;
    }
    
    score_displays[0].innerHTML = scores[0];
    score_displays[1].innerHTML = scores[1];
    
    if (totalmoves == maxmoves) {
        endGame();
    } else {
        showValidMoves();
    }
}

function endGame () {
    // Update display of winner/loser
    p1div.className = p2div.className = "notmyturn";
    if (scores[0] > scores[1]) {
        p1button.innerHTML = "WINNER"; p1button.className = "winner";
        p2button.innerHTML = "LOSER"; p2button.className = "loser";
    } else if (scores[0] < scores[1]) {
        p2button.innerHTML = "WINNER"; p2button.className = "winner";
        p1button.innerHTML = "LOSER"; p1button.className = "loser";
    } else {
        p1button.innerHTML = "DRAW"; p1button.className = "draw";
        p2button.innerHTML = "DRAW"; p2button.className = "draw";
    }
    // Remove ability to click on squares
    for (i = 0; i < N; i++) {
        for (j = 0; j < N; j++) {
            grid[i][j].r.attr({opacity: 0.6});
            if (grid[i][j].valid) {
                grid[i][j].r.unclick(grid[i][j].movef);
                grid[i][j].valid = false;
            }
        }
    }
}

// Array Intersection
function getLineIntersect(arr1, arr2) {
    var temp = [];
    for(var i = 0; i < arr1.length; i++){
        for(var k = 0; k < arr2.length; k++){
            if(arr1[i][0] == arr2[k][0] && arr1[i][1] == arr2[k][1]){
                temp.push(arr1[i]);
                break;
            }
        }
    }
    return temp;
}

// Return: "" if variable not defined, "<value>" otherwise
function getParameterByName(name)
{
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.href);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}
