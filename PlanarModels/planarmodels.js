var State = {
    ANIMATION_BLOCKED : 0,
    WAITING_CUT_START : 1,
    GOT_CUT_START : 2,
    WAITING_GLUE : 3,
    ELIMINATE_PAIRS: 4
    };
    
var Orientation = {
    FORWARD : 1,
    REVERSE : 2
    };
    
var STATE;

var Model, Cut, PairsForElimination;


/* For Raphael */
var R;
var DRAW_WIDTH = window.innerWidth;
var DRAW_HEIGHT = window.innerHeight;
var DRAW_RADIUS = DRAW_HEIGHT*0.3;
var ANIMATION_SPEED = 1000;
var ANIMATION_DELAY = 1.1;

var VERTEX_SIZE = 14;
var VERTEX_STYLE = {"stroke-width":4, stroke:"black", fill:"red", r: VERTEX_SIZE},
    EDGE_STYLE = {"stroke-width":4, stroke:"black"},
    CUT_STYLE = {"stroke-width":7, stroke:"white", "stroke-dasharray":"-"},
    FILL_STYLE = {fill: "#efaf07", stroke:"none"},
    LABEL_STYLE = {"font-size":28, "font-weight":300},
    GLUE_STYLE = {stroke: "#cb0e05", "stroke-width":7},
    PIECE_A_STYLE = {fill: "#fccf80", stroke:"none"},
    VERTEX_ELIM_STYLE = {fill: "#869fc4", stroke: "#869fc4"},
    EDGE_ELIM_STYLE = {stroke: "#869fc4"},
    INV_CIRC_HIDDEN = {"stroke-width":0, r: 200},
    INV_CIRC_SHOWN = {stroke: "#869fc4", "stroke-width":7, r: 20, opacity:1};

var LOWER_CHARS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
var AVAILABLE_CHARS;

var ALL_COLOURS = ["#1745ed", "#ffe400", "#8a00ff", "#12d912", "#ff8400", "#fc00ff", "#00fcff", "#000000", "#ffffff"];

var inverseButtonDiv;
var inverseButtonCircle;

//------------------------

function removeFromList(x, L) {
    L.splice(L.indexOf(x), 1);
}

function isValid(word) {
    word = word.replace(/\s/g, "").toLowerCase();
    var seen = new Object;
    var complete = 0;
    var split_word = [];
    i = 0;
    while (i < word.length) {
        if (elem(word[i], AVAILABLE_CHARS)) { // A new letter
            removeFromList(word[i], AVAILABLE_CHARS);
            if (i+1 < word.length && word[i+1] == '*') {
                seen[word[i]] = true;
                split_word.push([word[i], Orientation.REVERSE]);
                i++;
            } else {
                seen[word[i]] = true;
                split_word.push([word[i], Orientation.FORWARD]);
            }
        } else if (seen[word[i]]) {
            if (i+1 < word.length && word[i+1] == '*') {
                seen[word[i]] = false;
                split_word.push([word[i], Orientation.REVERSE]);
                complete++;
                i++;
            } else {
                seen[word[i]] = false;
                split_word.push([word[i], Orientation.FORWARD]);
                complete++;
            }
        } else {
            return false;
        }
        i++;
    }
    return split_word;
}

function newVertex() {
    var vertex = R.circle(-50, -50, VERTEX_SIZE).attr(VERTEX_STYLE);
    //vertex.attrs = {cx : 0, cy: 0};
    vertex.node.vertex = vertex;
    vertex.node.onclick = function () {
        switch (STATE) {
            case State.WAITING_CUT_START:
                startCut(this.vertex);
                break;
            case State.GOT_CUT_START:
                endCut(this.vertex);
                break;
            case State.ELIMINATE_PAIRS:
                eliminatePair.apply(null, this.vertex.eliminationSet);
                break;
        }
    };
    return vertex;
}

function newEdge(tail, head, label, orientation) {
    var edge = R.path(getEdgeString(tail, head)).attr(EDGE_STYLE).toBack();
    edge.label = label;
    edge.Label = R.text(-50, -50, edge.label).attr(LABEL_STYLE);
    edge.orientation = orientation;
    if (edge.orientation == Orientation.FORWARD) {
        edge.tail = tail;
        edge.head = head;
    } else {
        edge.head = tail;
        edge.tail = head;
    }
    edge.node.edge = edge;
    edge.prevVertex = function () {
        if (this.orientation == Orientation.FORWARD) {
            return this.tail;
        } else {
            return this.head;
        }
    }
    edge.nextVertex = function () {
        if (this.orientation == Orientation.FORWARD) {
            return this.head;
        } else {
            return this.tail;
        }
    }
    edge.node.onclick = function () {
        if (STATE == State.WAITING_GLUE) {
            glueEdge(this.edge);
        }
    }
    return edge;
}

window.onload = function () {

    // Initialise Raphael
    //R = Raphael("gameBoard", DRAW_WIDTH*0.99, DRAW_HEIGHT*0.99);
    R = Raphael("gameBoard", DRAW_WIDTH, DRAW_HEIGHT);
    
    //R.circle(DRAW_WIDTH/2, DRAW_HEIGHT/2, DRAW_HEIGHT*0.44).attr({fill: "none", stroke: "#d2dce9"});
    
    inverseButtonCircle = R.circle(DRAW_WIDTH/2, DRAW_HEIGHT-55, 20).attr(INV_CIRC_HIDDEN);
    
    var default_word = document.getElementById("wordInputBox").value;
    
    createModel(default_word);
    
    document.getElementById("goButton").onclick = function (e) {
        var inp = document.getElementById("wordInputBox");
        createModel(inp.value);
    }
    
    inverseButtonDiv = document.getElementById("bottomFloater");
    
    var inverseButton = document.getElementById("inverseButton");
    inverseButton.onclick = function (e) {
        if (STATE == State.WAITING_CUT_START) {
            changeState(State.ELIMINATE_PAIRS);
            //highlight each vertex in the elimination group
            for (var i = 0; i < PairsForElimination.length; i++) {
                PairsForElimination[i][0].attr(VERTEX_ELIM_STYLE);
                PairsForElimination[i][1].attr(EDGE_ELIM_STYLE);
                PairsForElimination[i][2].attr(EDGE_ELIM_STYLE);
                PairsForElimination[i][0].eliminationSet = PairsForElimination[i];
            }
        }
    }
    
    document.getElementById("inspectEquivIcon").onclick = function (e) {
        if (STATE == State.WAITING_CUT_START) {
            highlightEquivalenceClass();
        }
    }
    
    document.getElementById("randomWordIcon").onclick = function (e) {
        var word = randomWord();
        document.getElementById("wordInputBox").value = word;
        createModel(word);
    }
    
};

function randomWord() {
    var size = 3+Math.floor(Math.random()*5);
    var letters = LOWER_CHARS.slice(0, size).concat(LOWER_CHARS.slice(0, size));
    var word = "";
    while (letters.length > 0) {
        var i = Math.floor(Math.random()*letters.length);
        word += letters[i];
        letters.splice(i, 1);
        if (Math.floor(Math.random()*2)) {
            word += "*";
        }
        word += " ";
    }
    return word;
}

function highlightEquivalenceClass() {
    
    for (var i =0; i < Model.Vertices.length; i++) {
        Model.Vertices[i].seen = false;
    }
    
    var seen = 0;
    
    while (seen < Model.Vertices.length) {
        var c = ALL_COLOURS[0];
        ALL_COLOURS = ALL_COLOURS.slice(1).concat([c]);
        // Pick our start vertex
        var i = 0;
        while (Model.Vertices[i].seen) { i++; }
        var queue = [Model.Vertices[i]];
        // Color all equivalent vertices
        while (queue.length > 0) {
            var v = queue[0];
            if (!v.seen) {
                v.animate({fill: c}, 300);
                v.seen = true;
                seen++;
                for (var i = 0; i < Model.Edges.length; i++) {
                    var e = Model.Edges[i];
                    if (e.tail == v) {
                        var p = getPartner(e);
                        if (!p.tail.seen) { queue.push(p.tail); }
                    }
                    if (e.head == v) {
                        var p = getPartner(e);
                        if (!p.head.seen) { queue.push(p.head); }
                    }
                }
            }
            queue = queue.slice(1);
        }
    }
    
}

function eliminatePair(vertex, prev, next) {

    prev.Label.remove();
    next.Label.remove();

    var points = calculateNVertices(Model.Vertices.length-2);

    var i = 0;
    var offset = 0;
    var newpositions = new Array();
    while (i < Model.Vertices.length) {
        if (Model.Vertices[i] == vertex) {
            newpositions.push({attrs: {cx: DRAW_WIDTH/2, cy: DRAW_HEIGHT/2}});
            offset = -2;
        } else {
            if (vertex.index == 0 && i == 1) {
                newpositions.push(points[Model.Vertices.length-3]);
            } else if (vertex.index == Model.Vertices.length - 1 && i + 1 == vertex.index) {
                newpositions.push(points[0]);
            } else {
                newpositions.push(points[i+offset]);
            }
        }
        Model.Vertices[i].newposition = newpositions[i];
        Model.Vertices[i].animate(newpositions[i].attrs, ANIMATION_SPEED);
        i++;
    }
    for (var i = 0; i < Model.Vertices.length; i++) {
        Model.Edges[i].animate({path: getEdgeString(Model.Edges[i].tail.newposition, Model.Edges[i].head.newposition)}, ANIMATION_SPEED);
        var scale = 1.2,
            tail = Model.Edges[i].tail.newposition,
            head = Model.Edges[i].head.newposition,
            ex = (tail.attrs.cx + head.attrs.cx)/2,
            ey = (tail.attrs.cy + head.attrs.cy)/2,
            lx = (ex - (DRAW_WIDTH/2))*scale + DRAW_WIDTH/2,
            ly = (ey - (DRAW_HEIGHT/2))*scale + DRAW_HEIGHT/2;
        Model.Edges[i].Label.animate({x: lx, y: ly}, ANIMATION_SPEED);
    }
    Model.Fill.animate({path: getClosedPathString.apply(null, newpositions)}, ANIMATION_SPEED);
    
    setTimeout(function () { eliminatePairRemoval(vertex, prev, next); }, ANIMATION_SPEED);
}

function eliminatePairRemoval(vertex, prev, next) {

    prev.remove();
    next.remove();
    if (vertex.index + 1 < Model.Vertices.length) {
        var nextVertex = Model.Vertices[vertex.index+1];
        if (vertex.index == 0) {
            Model.Vertices.splice(vertex.index, 2);
            Model.Vertices = [Model.Vertices[Model.Vertices.length-1]].concat(Model.Vertices.slice(0,Model.Vertices.length-1));
            var e = Model.Edges[vertex.index + 1];
            if (e.orientation == Orientation.FORWARD) {
                e.tail = Model.Vertices[0];
            } else {
                e.head = Model.Vertices[0];
            }
            Model.Edges = Model.Edges.slice(1, Model.Edges.length-1);
        } else {
            Model.Vertices.splice(vertex.index, 2);
            var e = Model.Edges[vertex.index + 1];
            if (e.orientation == Orientation.FORWARD) {
                e.tail = Model.Vertices[vertex.index-1];
            } else {
                e.head = Model.Vertices[vertex.index-1];
            }
            Model.Edges.splice(vertex.index-1, 2);
        }
        nextVertex.remove();

    } else {
        var prevVertex = Model.Vertices[vertex.index-1];
        Model.Vertices.splice(vertex.index-1, 2);
        var e = Model.Edges[vertex.index-2];
        if (e.orientation == Orientation.FORWARD) {
            e.head = Model.Vertices[0];
        } else {
            e.tail = Model.Vertices[0];
        }
        Model.Edges.splice(vertex.index-1, 2);
        prevVertex.remove();
    }
    
    vertex.remove();
    
    showWord();
    var tmp = ANIMATION_SPEED;
    ANIMATION_SPEED = 0;
    regulariseModel();
    ANIMATION_SPEED = tmp;
}

function createModel(word) {

    if (Model) {
        removeModel();
    }
    
    AVAILABLE_CHARS = LOWER_CHARS.slice(0); // A _copy_ of the array

    var word_check = isValid(word);

    if (!word_check) {
        alert("Word is not valid");
        Model = undefined;
        return false;
    }

    var Vertices = [];
    for (var i = 0; i < word_check.length; i++) {
        var vertex = newVertex();
        vertex.index = i;
        Vertices.push(vertex);
    }
    
    var Edges = [];
    for (var i = 0; i < Vertices.length; i++) {
        var tail = Vertices[i],
            head = (i == (Vertices.length-1) && Vertices[0]) || Vertices[i+1];
        var edge = newEdge(tail, head, word_check[i][0], word_check[i][1]);
        Edges.push(edge);
    }
    
    var Fill = R.path(getClosedPathString.apply(this, Vertices)).toBack().attr(FILL_STYLE);
    
    Model = { Vertices: Vertices, Edges: Edges, Fill: Fill };
    
    document.getElementById("allWords").innerHTML = "";
    showWord();
    //document.getElementById("allWords").innerHTML = word.replace(/\*/g, " <sup>-1</sup>") + "<br>";
    
    var tmp = ANIMATION_SPEED;
    ANIMATION_SPEED = 0;
    regulariseModel(Model);
    ANIMATION_SPEED = tmp;
    
}

function removeModel() {
    if (Cut) {
        for (var i =0; i < Cut.PieceA.Vertices.length; i++) {
            Cut.PieceA.Vertices[i].remove();
            Cut.PieceA.Edges[i].Label.remove();
            Cut.PieceA.Edges[i].remove();
        }
        for (var i =0; i < Cut.PieceB.Vertices.length; i++) {
            Cut.PieceB.Vertices[i].remove();
            Cut.PieceB.Edges[i].Label.remove();
            Cut.PieceB.Edges[i].remove();
        }
        Cut.PieceA.Fill.remove();
        Cut.PieceB.Fill.remove();
    } else if (Model) {
        Model.Fill.remove();
        for (var i =0; i < Model.Vertices.length; i++) {
            Model.Vertices[i].remove();
            Model.Edges[i].Label.remove();
            Model.Edges[i].remove();
        }
    }
}

function showWord() {
    var wi = document.getElementById("wordInputBox");
    var s = "";
    for (var i =0; i < Model.Edges.length; i++) {
        var e = Model.Edges[i];
        s += e.label;
        if (e.orientation == Orientation.REVERSE) {
            s += '*';
        }
        s += ' ';
        
    }
    wi.value = s;
    document.getElementById("allWords").innerHTML += s.replace(/(.)\* \1\*/g, "$1 <sup>-2</sup>").replace(/(.) \1 /g, "$1 <sup>2</sup> ").replace(/\*/g, " <sup>-1</sup>") + "<br>"
}

function mergeModel(edge, partner) {
    /* Merge the piece A and piece B into a single model. Note that we keep the new 
       vertices from Piece A and destroy the ones from Piece B */
       
    // Now merge back into a single model.
    // Reassign indices for piece B
    for (var i = 0; i < Cut.PieceB.Vertices.length; i++) {
        Cut.PieceB.Vertices[i].index = i;
    }
    
    if (partner.tail.index == 0 && partner.orientation == Orientation.REVERSE) {
        Model.Vertices = [Cut.PieceA.Vertices[edge.head.index-1]].concat(Cut.PieceB.Vertices.slice(1, partner.tail.index-1)).concat(Cut.PieceA.Vertices.slice(edge.head.index)).concat(Cut.PieceA.Vertices.slice(0, edge.head.index-1));
        Model.Edges = Cut.PieceB.Edges.slice(0, partner.tail.index-1).concat(Cut.PieceA.Edges.slice(edge.head.index)).concat(Cut.PieceA.Edges.slice(0, edge.tail.index));
    } else if (partner.tail.index == 0 && partner.orientation == Orientation.FORWARD) {
        /*.concat(Cut.PieceB.Vertices.slice(1, Math.max(0, partner.tail.index-1)))*/
        Model.Vertices = [Cut.PieceA.Vertices[edge.tail.index]].concat(Cut.PieceA.Vertices.slice(edge.tail.index+1)).concat(Cut.PieceA.Vertices.slice(0, edge.tail.index)).concat(Cut.PieceB.Vertices.slice(partner.head.index+1));
        Model.Edges = Cut.PieceA.Edges.slice(edge.tail.index).concat(Cut.PieceA.Edges.slice(0, edge.head.index)).concat(Cut.PieceB.Edges.slice(partner.head.index));
    } else if (partner.head.index == 0 && partner.orientation == Orientation.FORWARD) {
        Model.Vertices = [Cut.PieceA.Vertices[edge.head.index]].concat(Cut.PieceB.Vertices.slice(1, partner.tail.index)).concat(Cut.PieceA.Vertices.slice(edge.tail.index)).concat(Cut.PieceA.Vertices.slice(0, edge.head.index));
        Model.Edges = Cut.PieceB.Edges.slice(0, partner.tail.index).concat(Cut.PieceA.Edges.slice(edge.head.index+1)).concat(Cut.PieceA.Edges.slice(0, edge.head.index));
    } else {
        Model.Vertices = Cut.PieceB.Vertices.slice(0, partner.prevVertex().index).concat(Cut.PieceA.Vertices.slice(edge.prevVertex().index+1)).concat(Cut.PieceA.Vertices.slice(0, edge.prevVertex().index+1)).concat(Cut.PieceB.Vertices.slice(partner.prevVertex().index+2));
        Model.Edges = Cut.PieceB.Edges.slice(0, partner.prevVertex().index).concat(Cut.PieceA.Edges.slice(edge.prevVertex().index+1)).concat(Cut.PieceA.Edges.slice(0, edge.prevVertex().index)).concat(Cut.PieceB.Edges.slice(partner.prevVertex().index+1));
    }
    //Model.Edges = Cut.PieceB.Edges.slice(0, partner.tail.index-1).concat(Cut.PieceA.Edges.slice(edge.head.index)).concat(Cut.PieceA.Edges.slice(0, edge.tail.index)).concat(Cut.PieceB.Edges.slice(partner.tail.index));
    
    /*Model.Vertices = Cut.PieceB.Vertices.slice(0, partner.tail.index-1).concat(Cut.PieceA.Vertices.slice(edge.head.index)).concat(Cut.PieceA.Vertices.slice(0, edge.head.index)).concat(Cut.PieceB.Vertices.slice(partner.tail.index+1));
    Model.Edges = Cut.PieceB.Edges.slice(0, partner.tail.index-1).concat(Cut.PieceA.Edges.slice(edge.head.index)).concat(Cut.PieceA.Edges.slice(0, edge.tail.index)).concat(Cut.PieceB.Edges.slice(partner.tail.index));
    */
    for (var i = 0; i < Model.Edges.length; i++) {
        if (Model.Edges[i] != partner && Model.Edges[i].tail == partner.tail) {
            Model.Edges[i].tail = edge.tail;
        }
        if (Model.Edges[i] != partner && Model.Edges[i].tail == partner.head) {
            Model.Edges[i].tail = edge.head;
        }
        if (Model.Edges[i] != partner && Model.Edges[i].head == partner.tail) {
            Model.Edges[i].head = edge.tail;
        }
        if (Model.Edges[i] != partner && Model.Edges[i].head == partner.head) {
            Model.Edges[i].head = edge.head;
        }
    }
    partner.head.remove();
    partner.tail.remove();
    edge.Label.remove();
    partner.Label.remove();
    AVAILABLE_CHARS.push(edge.label);
    
    edge.remove();
    partner.remove();
    Cut.PieceA.Fill.remove();
    Cut.PieceB.Fill.remove();
    
    Model.Fill = R.path(getClosedPathString.apply(this, Model.Vertices)).toBack().attr(FILL_STYLE);
    
    Cut = undefined;
    
    for (var i = 0; i < Model.Vertices.length; i++) {
        Model.Vertices[i].index = i;
    }
    
    showWord();
    
    regulariseModel(Model);
}

/* Function for glueing edges */

function flipPieceA(edge, partner) {
    
    var centrey = (edge.tail.attrs.cy + edge.head.attrs.cy) / 2;
    
    var newvertices = [];
    for (var i =0; i < Cut.PieceA.Vertices.length; i++) {
        var v = Cut.PieceA.Vertices[i];
        var newposition = {attrs: {cx: v.attrs.cx, cy: -v.attrs.cy + 2*centrey}};
        v.newposition = newposition;
        newvertices.push(newposition);
        v.animate(v.newposition.attrs, ANIMATION_SPEED);
        var l = Cut.PieceA.Edges[i].Label;
        l.animate({x: l.attrs.x, y: -l.attrs.y + 2*centrey}, ANIMATION_SPEED);
    }
    
    for (var i =0; i < Cut.PieceA.Edges.length; i++) {
        var e = Cut.PieceA.Edges[i];
        getEdgeString(e.tail.newposition, e.head.newposition);
        e.animate({path: getEdgeString(e.tail.newposition, e.head.newposition)}, ANIMATION_SPEED);
    }
    
    for (var i =0; i < Cut.PieceA.Edges.length; i++) {
        var e = Cut.PieceA.Edges[i];
        if (e.orientation == Orientation.FORWARD) {
            e.orientation = Orientation.REVERSE;
        } else {
            e.orientation = Orientation.FORWARD;
        }
    }
    
    Cut.PieceA.Edges.reverse();
    Cut.PieceA.Edges = Cut.PieceA.Edges.slice(1).concat([Cut.PieceA.Edges[0]]);
    Cut.PieceA.Vertices.reverse();
    
    Cut.PieceA.Fill.animate({path: getClosedPathString.apply(null, newvertices)}, ANIMATION_SPEED);
    
    STATE = State.ANIMATION_BLOCKED;
    setTimeout(function () { movePiece(edge, partner); }, ANIMATION_SPEED*ANIMATION_DELAY);
}

function glueEdge(edge) {
    
    if (!elem(edge, Cut.Valid)) {
        return false;
    }
    var partner = getPartner(edge);
        
    // Adjust styles of potential glue edges
    for (var i =0; i < Cut.PieceA.Edges.length; i++) {
        var e = Cut.PieceA.Edges[i];
        if (e != edge) {
            e.attr(EDGE_STYLE);
        }
    }
    partner.attr(GLUE_STYLE);

    
    if (edge.orientation == partner.orientation) {
        flipPieceA(edge, partner);
    } else {
        movePiece(edge, partner);
    }
    
}
    
function movePiece(edge, partner) {
    
    /* We know the piece is in pieceA, and its partner is in pieceB since it is a valid move */
    var newVertices = [];
    edge.tail.toFront();
    edge.head.toFront();
    
    if (!partner) {
        alert("no glue him!");
        return;
    }
    
    // Fix to stop fill from "flipping" (byproduct of animation in flipPiece)
    Cut.PieceA.Fill.attr({path: getClosedPathString.apply(null, Cut.PieceA.Vertices)});
    
    // Rotate the piece to the right place
    var xstep = partner.nextVertex().attrs.cx - edge.prevVertex().attrs.cx,
        ystep = partner.nextVertex().attrs.cy - edge.prevVertex().attrs.cy;
    // Translate each vertex
    for (var i = 0; i < Cut.PieceA.Vertices.length; i++) {
        newVertices.push({attrs: {cx: Cut.PieceA.Vertices[i].attrs.cx + xstep,
                                  cy: Cut.PieceA.Vertices[i].attrs.cy + ystep}});
        Cut.PieceA.Vertices[i].newposition = newVertices[i];
        Cut.PieceA.Vertices[i].index = i; // Reassign indices
    }
    
    // Animate the piece in to place
    
    var angle = -getAngle(partner.nextVertex(), partner.prevVertex(), edge.nextVertex().newposition);
    for (var i = 0; i < Cut.PieceA.Vertices.length; i++) {
        rotateAroundPoint(partner.nextVertex(), newVertices[i], angle);
    }
    
    for (var i = 0; i < Cut.PieceA.Vertices.length; i++) {
        Cut.PieceA.Vertices[i].animate({cx: newVertices[i].attrs.cx, cy: newVertices[i].attrs.cy}, ANIMATION_SPEED);
        Cut.PieceA.Edges[i].animate({path: getEdgeString(Cut.PieceA.Edges[i].tail.newposition, Cut.PieceA.Edges[i].head.newposition)}, ANIMATION_SPEED);
        Cut.PieceA.Fill.animate({path: getClosedPathString.apply(this, newVertices)}, ANIMATION_SPEED);
        var scale = 1.2,
            ex = (Cut.PieceA.Edges[i].tail.newposition.attrs.cx + Cut.PieceA.Edges[i].head.newposition.attrs.cx)/2,
            ey = (Cut.PieceA.Edges[i].tail.newposition.attrs.cy + Cut.PieceA.Edges[i].head.newposition.attrs.cy)/2,
            lx = (ex - (DRAW_WIDTH/2))*scale + DRAW_WIDTH/2,
            ly = (ey - (DRAW_HEIGHT/2))*scale + DRAW_HEIGHT/2;
       Cut.PieceA.Edges[i].Label.animate({x: lx, y: ly}, ANIMATION_SPEED);
    }
    
    STATE = State.ANIMATION_BLOCKED;
    setTimeout(function () { mergeModel(edge, partner); }, ANIMATION_SPEED*ANIMATION_DELAY);
    
}

function getAngle(p1, p2, p3) {
    var v1 = [p1.attrs.cx-p2.attrs.cx, p1.attrs.cy-p2.attrs.cy];
    var v2 = [p1.attrs.cx-p3.attrs.cx, p1.attrs.cy-p3.attrs.cy];
    var cp = v1[0]*v2[0] + v1[1]*v2[1];
    var lv1 = v1[0]*v1[0] + v1[1]*v1[1];
    var lv2 = v2[0]*v2[0] + v2[1]*v2[1];
    var r = (cp*cp)/(lv1*lv2);
    if (v1[0]*v2[1] - v1[1]*v2[0] < 0) {
        return -Math.acos(sign(cp) * Math.sqrt(r));
    } else {
        return Math.acos(sign(cp) * Math.sqrt(r));
    }
}

function sign(n) {
    if (n > 0) { return 1; } else { return -1; }
}

function elem(x, L) {
    if (L.indexOf(x) == -1) {
        return false;
    } else {
        return true;
    }
}

// (destructively) rotate a target point around a fixed point by a given angle
function rotateAroundPoint(fixed, target, angle) {
    var transx = target.attrs.cx - fixed.attrs.cx,
        transy = target.attrs.cy - fixed.attrs.cy;
    var rotatedx = transx * Math.cos(angle) - transy * Math.sin(angle),
        rotatedy = transx * Math.sin(angle) + transy * Math.cos(angle);
    target.attrs.cx = rotatedx + fixed.attrs.cx;
    target.attrs.cy = rotatedy + fixed.attrs.cy;
}

/* Functions for making and cancelling cuts */

function startCut(vertex) {
    var center = {attrs: {cx: DRAW_WIDTH/2, cy: DRAW_HEIGHT/2}};
    Cut = {tail: vertex, Line: R.path(getPathString(vertex, center)).attr(CUT_STYLE)};
    vertex.toFront();
    STATE = State.GOT_CUT_START;
}

function endCut(vertex) {
    Cut.head = vertex;
    
    if (Cut.tail.index > Cut.head.index) {
        var tmp = Cut.head;
        Cut.head = Cut.tail;
        Cut.tail = tmp;
    }
    
    Cut.Line.remove();
    
    // Make sure it is a valid cut
    if (Math.abs(Cut.head.index - Cut.tail.index) <= 1 || Math.abs(Cut.head.index - Cut.tail.index) == Model.Vertices.length-1) {
        STATE = State.WAITING_CUT_START;
        Cut.Line.remove();
        alert("Invalid Cut - must remove at least two edges");
        return;
    }
    
    // Separate the two pieces
    var PieceA = new Object,
        PieceB = new Object;
    
    /*var newEdgeA = R.path().attr(EDGE_STYLE),
        newEdgeB = R.path().attr(EDGE_STYLE);*/
    var newEdgeA, newEdgeB;
    var tailCopy = newVertex().attr({cx: Cut.tail.attrs.cx, cy: Cut.tail.attrs.cy}),
        headCopy = newVertex().attr({cx: Cut.head.attrs.cx, cy: Cut.head.attrs.cy});
    
    Model.Fill.remove();
    
    var newLabel = AVAILABLE_CHARS[0];
    AVAILABLE_CHARS = AVAILABLE_CHARS.slice(1);
    
    newEdgeA = newEdge(Cut.head.toFront(), Cut.tail.toFront(), newLabel, Orientation.REVERSE);
    newEdgeA.attr("path", getEdgeString(newEdgeA.tail, newEdgeA.head)); // Default rendering puts it the wrong way, since the edge is not "reversed" _yet_
    
    newEdgeB = newEdge(tailCopy.toFront(), headCopy.toFront(), newLabel, Orientation.FORWARD);

    var lx = (newEdgeA.head.attrs.cx + newEdgeA.tail.attrs.cx) / 2 + 40,
        ly = (newEdgeA.head.attrs.cy + newEdgeA.tail.attrs.cy) / 2;
    newEdgeA.Label.attr({x: lx, y: ly});
    newEdgeB.Label.attr({x: lx, y: ly});


    PieceA.Vertices = Model.Vertices.slice(Cut.tail.index, Cut.head.index + 1);
    PieceB.Vertices = Model.Vertices.slice(0, Cut.tail.index).concat([tailCopy, headCopy]).concat(Model.Vertices.slice(Cut.head.index + 1));
    
    PieceA.Fill = R.path(getClosedPathString.apply(this, PieceA.Vertices)).toBack().attr(PIECE_A_STYLE);
    PieceB.Fill = R.path(getClosedPathString.apply(this, PieceB.Vertices)).toBack().attr(FILL_STYLE);
    
    PieceA.Edges = Model.Edges.slice(Cut.tail.index, Cut.head.index).concat([newEdgeA]);
    PieceB.Edges = Model.Edges.slice(0, Cut.tail.index).concat([newEdgeB]).concat(Model.Edges.slice(Cut.head.index));
    
    // Get all the valid glue spots;
    Cut.Valid = new Array();
    for (i = 0; i < PieceA.Edges.length; i++) {
        var e = PieceA.Edges[i];
        var p = getPartner(e);
        if (elem(p, PieceB.Edges)) {
            Cut.Valid.push(e);
            e.attr(GLUE_STYLE);
        }
    }
    
    
    // Adjust head and tail of the edges that pointed to the removed vertices.
    for (var i = 0; i < PieceB.Edges.length; i++) {
        if (PieceB.Edges[i].head == Cut.head && PieceB.Edges[i] != newEdgeB) {
            PieceB.Edges[i].head = headCopy;
        }
        if (PieceB.Edges[i].tail == Cut.head && PieceB.Edges[i] != newEdgeB) {
            PieceB.Edges[i].tail = headCopy;
        }
        if (PieceB.Edges[i].head == Cut.tail && PieceB.Edges[i] != newEdgeB) {
            PieceB.Edges[i].head = tailCopy;
        }
        if (PieceB.Edges[i].tail == Cut.tail && PieceB.Edges[i] != newEdgeB) {
            PieceB.Edges[i].tail = tailCopy;
        }
    }
    
    Cut.PieceA = PieceA;
    Cut.PieceB = PieceB;
    
    STATE = State.WAITING_GLUE;

}

/* */

function getPartner(edge) {
    for (var i = 0; i < Model.Edges.length; i++) {
        if (Model.Edges[i].label == edge.label && edge != Model.Edges[i]) {
            return Model.Edges[i];
        }
    }
}

/* Functions for making Raphael path strings */

function getEdgeString(tail, head) {
    var x1 = tail.attrs.cx,
        x2 = head.attrs.cx,
        y1 = tail.attrs.cy,
        y2 = head.attrs.cy;
    var scale = 1.1;
    var pfar = {attrs: {cx: x1 + (x2-x1)*scale, cy: y1 + (y2-y1)*scale}};
    rotateAroundPoint(head, pfar, 3*Math.PI/4);
    var p1x = pfar.attrs.cx,
        p1y = pfar.attrs.cy;
    rotateAroundPoint(head, pfar, Math.PI/2);
    var p2x = pfar.attrs.cx,
        p2y = pfar.attrs.cy;
    var xstep = (x2 - x1)/2,
        ystep = (y2 - y1)/2;
    x2 -= xstep;
    y2 -= ystep;
    p1x -= xstep;
    p1y -= ystep;
    p2x -= xstep;
    p2y -= ystep;
    return getPathString(tail, head) + "M," + p1x + "," + p1y + "L" + x2 + "," + y2 + "L" + p2x + "," + p2y;
}

function getPathString() {
    var i = 0;
    var str = "";
    for (var i = 0; i < arguments.length; i++) {
        str += (i == 0 && "M") || "L";
        str += arguments[i].attrs.cx + "," + arguments[i].attrs.cy;
    }
    return str;
}

function getClosedPathString() {
    var str = getPathString.apply(this, arguments);
    return str + "L" + arguments[0].attrs.cx + "," + arguments[0].attrs.cy;
}

/* Function for resizing model to a regular polygon */

function calculateNVertices(N_EDGES) {
    var points = new Array();
    var cx = DRAW_WIDTH/2,
        cy = DRAW_HEIGHT/2,
        r = DRAW_RADIUS;
        
    for (var i = 0; i < N_EDGES; i++) {
        var point = new Object;
        point.attrs = new Object;
        var angle = Math.PI/2 + (i * (1 / N_EDGES) * 2 * Math.PI);
        point.attrs.cx = Math.round(cx + (r * Math.cos(angle)));
        point.attrs.cy = Math.round(cy + (r * Math.sin(angle)));
        points.push(point);
    }
    return points;
}

function regulariseModel() {
    
    STATE = State.ANIMATION_BLOCKED;
    
    var N_EDGES = Model.Edges.length;
    var points = calculateNVertices(N_EDGES);
    
    // Make sure all styles are standard
    for (var i = 0; i < N_EDGES; i++) {
        Model.Vertices[i].attr(VERTEX_STYLE);
        Model.Edges[i].attr(EDGE_STYLE);
    }
    
    for (var i = 0; i < N_EDGES; i++) {
        Model.Vertices[i].animate({cx: points[i].attrs.cx, cy: points[i].attrs.cy}, ANIMATION_SPEED, "<");
        Model.Vertices[i].index = i;
        var tail = points[i],
            head = (i == N_EDGES-1 && points[0]) || points[i+1];
        if (Model.Edges[i].orientation == Orientation.REVERSE) {
            var tmp = tail;
            tail = head;
            head = tmp;
        }
        Model.Edges[i].animate({path: getEdgeString(tail, head)}, ANIMATION_SPEED, "<");
        var scale = 1.2,
            ex = (tail.attrs.cx + head.attrs.cx)/2,
            ey = (tail.attrs.cy + head.attrs.cy)/2,
            lx = (ex - (DRAW_WIDTH/2))*scale + DRAW_WIDTH/2,
            ly = (ey - (DRAW_HEIGHT/2))*scale + DRAW_HEIGHT/2;
        Model.Edges[i].Label.animate({x: lx, y: ly}, ANIMATION_SPEED, "<");
    }
    
    Model.Fill.animate({path: getClosedPathString.apply(this, points)}, ANIMATION_SPEED, "<");
    
    // Event to change state once model has moved into place
    setTimeout(function () { changeState(State.WAITING_CUT_START) }, ANIMATION_SPEED);
}

function changeState(state) {
    if (state == State.WAITING_CUT_START && Model.Vertices.length > 2) {
        // Check if there are any pairs for elimination
        var i = 1;
        var lastLabel = Model.Edges[0].label;
        var lastOrientation = Model.Edges[0].orientation;
        PairsForElimination = new Array();
        while (i < Model.Vertices.length) {
            if (lastLabel == Model.Edges[i].label && lastOrientation != Model.Edges[i].orientation) {
                PairsForElimination.push([Model.Vertices[i], Model.Edges[i], Model.Edges[i-1]]);
            }
            lastLabel = Model.Edges[i].label;
            lastOrientation = Model.Edges[i].orientation;
            i++;
        }
        if (Model.Edges[0].label == Model.Edges[Model.Edges.length-1].label && 
            Model.Edges[0].orientation != Model.Edges[Model.Edges.length-1].orientation) {
            PairsForElimination.push([Model.Vertices[0], Model.Edges[0], Model.Edges[Model.Edges.length-1]]);
        }
        if (PairsForElimination.length > 0) {
            // Make the button for changing state visible
            inverseButtonDiv.style.visibility = 'visible';
            inverseButtonCircle.attr(INV_CIRC_SHOWN).animate(INV_CIRC_HIDDEN, ANIMATION_SPEED);
        } else {
            inverseButtonDiv.style.visibility = 'hidden';
        }
    } else {
        inverseButtonDiv.style.visibility = 'hidden';
    }
    STATE = state;
}

