"use strict";

Array.prototype.myRemove = function (item) {
    var index = this.index(item);
    if (index > -1) {
        this.splice(index, 1);
    }
}

// the SVG object
var draw;

// properties of the game world
var world = {
    // width and height of the game world
    width: 0,
    height: 0,

    // the minimum distance between an object's starting position
    // and the boundary of the screen
    buffer: 10,
    
    // offset of SVG canvas, for mouse purposes
    offsetX: 0,
    offsetY: 0,

    // initialization function
    init: function () {
	// window boundaries
	// thanks to:
	// http://stackoverflow.com/questions/3437786/get-the-size-of-the-screen-current-web-page-and-browser-window
	var w = window;
	var d = document;
	var e = d.documentElement;
	var g = d.getElementsByTagName('body')[0];

	this.width = Math.min(w.innerWidth,
			      e.clientWidth,
			      g.clientWidth) - this.buffer * 3;
	this.height = Math.min(w.innerHeight,
			       e.clientHeight,
			       g.clientHeight) - this.buffer * 3;

	if (draw !== undefined) {
            draw.remove();
	}

	var canvas = document.getElementById("drawing");
	draw = SVG(canvas).size(this.width, this.height);

	var border = canvas.getBoundingClientRect();
	this.offsetX = border.left;
	this.offsetY = border.top;
    }
};

// the player character
var player = {
    dirX: 0, dirXp: 0,
    dirY: 0, dirYp: 0,
    speed: 4,
    size: 40,
    object: undefined,
    interactBox: undefined,
    init: function () {
	this.object = draw
	    .rect(player.size, player.size)
	    .front()
	    .fill("red")
	    .center(world.width/2, world.height/2)
	    .on("update", function(e) {
		this.fire("move");
	    })
	    .on("move", function (e) {
		var newX = this.cx() + player.speed * player.dirX;
		var newY = this.cy() + player.speed * player.dirY;

		if (inBoundsX(newX, player.size)) {
		    this.center(newX, this.cy());
		}
		if (inBoundsY(newY, player.size)) {
		    this.center(this.cx(), newY);
		}
		player.interactBox.fire("move");
	    })
	    .on("interact", function(e) {
		if (tboxIntersect(player.interactBox, e.detail.object)) {
		    e.detail.object.fire("interact");}
		else {text.render("");}});
	this.interactBox = draw
    	    .rect(player.size*3, player.size*3)
	    .center(world.width/2, world.height/2)
	    .opacity(0)
	    .on("move", function(e) {
		this.center(player.object.cx(),
			    player.object.cy());});
    }
};

// the box
var box = {
    object: undefined,
    init: function () {
	this.object = draw
	    .rect(100, 20)
	    .front()
	    .fill("black")
	    .center(world.width / 2, world.height / 2 + 200)
	    .on("interact", function(e) {
		text.render("You win!");
	    });
    }
};

// the text
var text = {
    object: undefined,
    render: function (string) {
	return this.object.text(string);
    },
    init: function () {
	this.object = draw.text("")
    	    .fill("rgb(30, 55, 30)")
	    .move(10, world.height - 100);
    }
};

var bg = {
    object: undefined,
    init: function() {
	this.object = draw
            .rect(world.width, world.height)
            .back()
	    .fill("rgb(230, 255, 230)");
    }
}

// MISC. HELPERS
// ----------------------------------------------------------------
var inBounds = function (x, y) {
    return inBoundsX(x) && inBoundsY(y);
}

var inBoundsX = function (x, ...args) {
    var buffer = world.buffer +
	typeof args[0] === "undefined" ?
	0 : args[0];
    return between(buffer, x, world.width - buffer);
}

var inBoundsY = function (y, ...args) {
    var buffer = world.buffer +
	typeof args[0] === "undefined" ?
	0 : args[0];
    return between(buffer, y, world.height - buffer);
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
	case 16: player.speed = 12; break;
	    // W
	case 87: player.dirY = -1; break;
	    // A
	case 65: player.dirX = -1; break;
	    // S
	case 83: player.dirY =  1; break;
	    // D
	case 68: player.dirX =  1; break;
	    // E
	case 69: player.object.fire("interact", {object: box.object}); break;
	}
    }

    // when a key is released
    document.onkeyup = function (e) {

        // get the key
        var key = e.which || e.keyCode;

	switch (key) {
	    // shift
	case 16: player.speed = 4; break;
	    // W
	case 87: player.dirY = 0; break;
	    // A
	case 65: player.dirX = 0; break;
	    // S
	case 83: player.dirY = 0; break;
	    // D
	case 68: player.dirX = 0; break;
	}
    }
}
// ================================
// ================================================================

var start = function () {
    world.init();
    player.init();
    box.init();
    text.init();
    bg.init();
    setGameInput();
}

var loop = function (timestamp) {
    player.object.fire("update");
    window.requestAnimationFrame(loop);
}

start();
var lastRender = 0;
window.requestAnimationFrame(loop);
