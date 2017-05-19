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
var buffer = 20;

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

// the player's direction of movement, determined by kepresses
var dirX = 0; var dirXp = 0;
var dirY = 0; var dirYp = 0;

// speed of the player character
var speed = 4;

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

var inBoundsX = function (x) {
    return between(buffer, x, width - buffer);
}

var inBoundsY = function (y) {
    return between(buffer, y, height - buffer);
}

var between = function (a, b, c) {
    return (a < b && b < c);
}

// random number between min and max
var makeRandom = function (min, max) {
    return min + (max - min) * Math.random();
}

// ================================

// CREATORS
// --------------------------------

var makePlayer = function() {
    return draw
	.rect(40, 40)
	.front()
	.fill("red")
	.center(width / 2, height / 2)
	.on("move", function (e) {
	    var newX = this.x() + speed * dirX;
	    var newY = this.y() + speed * dirY;

	    if (inBoundsX(newX)) {
		this.move(newX, this.y());
	    }
	    if (inBoundsY(newY)) {
		this.move(this.x(), newY);
	    }
	});
}


var makeBG = function () {
    return draw
        .rect(width, height)
        .back()
	.fill("rgb(230, 255, 230)");
}

// ================================
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



