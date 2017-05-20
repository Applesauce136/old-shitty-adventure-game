"use strict";

Array.prototype.myRemove = function (item) {
    var index = this.index(item);
    if (index > -1) {
        this.splice(index, 1);
    }
}

// VALUES
// ----------------------------------------------------------------
// NUMERICS
// --------------------------------

// the minimum distance between an object's starting position
// and the boundary of the screen
var buffer = 10;

// dimensions of window
var width;
var height;
// ================================

// SVG GENERAL
// --------------------------------

var canvas;

// the SVG object
var draw;

// offset of SVG canvas, for mouse purposes
var border;
var offsetX;
var offsetY;

// ================================

// SVG MINE
// --------------------------------

// the player character
var player;
var playerSize = 40;

// the player's direction of movement, determined by kepresses
var dirX = 0; var dirXp = 0;
var dirY = 0; var dirYp = 0;

// speed of the player character
var speed = 4;

// the player's interaction box
var interactBox;

// the box
var box;

// the text
var text;

// ================================
// ================================================================

var makeWindow = function () {

    // window boundaries
    // thanks to:
    // http://stackoverflow.com/questions/3437786/get-the-size-of-the-screen-current-web-page-and-browser-window
    var w = window;
    var d = document;
    var e = d.documentElement;
    var g = d.getElementsByTagName('body')[0];

    width = Math.min(w.innerWidth,
                     e.clientWidth,
                     g.clientWidth) - buffer * 3;
    height = Math.min(w.innerHeight,
                      e.clientHeight,
                      g.clientHeight) - buffer * 3;

    if (draw !== undefined) {
        draw.remove();
    }

    canvas = document.getElementById("drawing");
    draw = SVG(canvas).size(width, height);

    border = canvas.getBoundingClientRect();
    offsetX = border.left;
    offsetY = border.top;
}

// FUNCTIONS
// ----------------------------------------------------------------

// MISC. HELPERS
// --------------------------------
var inBounds = function (x, y) {
    return inBoundsX(x) && inBoundsY(y);
}

var inBoundsX = function (x, ...args) {
    var buffer = typeof args[0] === "undefined" ?
	0 : args[0];
    return between(buffer, x, width - buffer);
}

var inBoundsY = function (y, ...args) {
    var buffer = typeof args[0] === "undefined" ?
	0 : args[0];
    return between(buffer, y, height - buffer);
}

var between = function (a, b, c) {
    return (a < b && b < c);
}

// random number between min and max
var makeRandom = function (min, max) {
    return min + (max - min) * Math.random();
}

var tboxIntersect = function (shape1, shape2) {

    // extract values, for corners
    var b1 = shape1.tbox();
    var b2 = shape2.tbox();
    
    // check each corner
    return (shape1.inside(b2.x , b2.y) ||
            shape1.inside(b2.x , b2.y2) ||
            shape1.inside(b2.x2, b2.y) ||
            shape1.inside(b2.x2, b2.y2) ||

            shape2.inside(b1.x , b1.y) ||
            shape2.inside(b1.x , b1.y2) ||
            shape2.inside(b1.x2, b1.y) ||
            shape2.inside(b1.x2, b1.y2)
           );
}

// ================================

// CREATORS
// --------------------------------

var makePlayer = function() {
    interactBox = draw
	.center(width/2, height/2)
	.rect(playerSize*3,
	      playerSize*3)
	.opacity(0)
	.on("move", function(e) {
	    this.center(player.cx(),
			player.cy());
	});
    
    return draw
	.rect(playerSize, playerSize)
	.front()
	.fill("red")
	.center(width/2, height/2)
	.on("move", function (e) {
	    var newX = this.cx() + speed * dirX;
	    var newY = this.cy() + speed * dirY;

	    if (inBoundsX(newX, playerSize)) {
		this.center(newX, this.cy());
	    }
	    if (inBoundsY(newY, playerSize)) {
		this.center(this.cx(), newY);
	    }
	    interactBox.fire("move");
	})
	.on("interact", function(e) {
	    if (tboxIntersect(interactBox, box)) {
		box.fire("interact");
	    }
	    else {
		text.clear();
	    }
	});
}

var makeBox = function () {
    return draw
	.rect(100, 20)
	.front()
	.fill("black")
	.center(width / 2, height / 2 + 200)
	.on("interact", function(e) {
	    render("You win!");
	});
}

var makeBG = function () {
    return draw
        .rect(width, height)
        .back()
	.fill("rgb(230, 255, 230)");
}

var makeText = function() {
    return draw.text("")
    	.fill("rgb(30, 55, 30)")
	// .font("size", 32)
	.move(10, height - 100);
}

// ================================

var render = function(string) {
    return text.text(string);
}

// ================================================================


// INPUT PROCESSING
// ----------------------------------------------------------------

// the input processing triggers for when the game is active
var setGameInput = function () {

    // KEYBOARD PROCESSING THINGS
    // --------------------------------

    // when a key is pressed
    document.onkeydown = function (e) {

        // get the key
        var key = e.which || e.keyCode;

	switch (key) {
	    // shift
	case 16: speed = 12; break;
	    // W
	case 87: dirY = -1; break;
	    // A
	case 65: dirX = -1; break;
	    // S
	case 83: dirY =  1; break;
	    // D
	case 68: dirX =  1; break;
	    // E
	case 69: player.fire("interact"); break;
	}
    }

    // when a key is released
    document.onkeyup = function (e) {

        // get the key
        var key = e.which || e.keyCode;

	switch (key) {
	    // shift
	case 16: speed = 4; break;
	    // W
	case 87: dirY = 0; break;
	    // A
	case 65: dirX = 0; break;
	    // S
	case 83: dirY = 0; break;
	    // D
	case 68: dirX = 0; break;
	}
    }
}
// ================================
// ================================================================

var start = function () {
    makeWindow();
    player = makePlayer();
    box = makeBox();
    text = makeText();
    makeBG();
    setGameInput();
}

var loop = function (timestamp) {
    player.fire("move", dirX, dirY);
    window.requestAnimationFrame(loop);
}

start();
var lastRender = 0;
window.requestAnimationFrame(loop);
