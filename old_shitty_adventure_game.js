"use strict";

// a personalized remove function:
// removes an element only if it's found
Array.prototype.myRemove = function (item) {
    var index = this.index(item);
    if (index > -1) {
        this.splice(index, 1);
    }
}

// GAME OBJECTS
// ----------------------------------------------------------------

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

    // whether or not we've won the game; starts false
    success: false,
    
    // functions to check if a point is in bounds
    inBounds: function (x, y) {
	return this.inBoundsX(x) && this.inBoundsY(y);
    },

    // X check
    // note: a second argument as in inBoundsX(a, b)
    // will attempt to add b to the buffer, effectively shrinking
    // the window for the object; use this with an object's size so that
    // the edges of the object don't fall off the screen.
    // functionality also exists for Y
    inBoundsX: function (x) {
	// variable args handling
	var buffer = this.buffer +
	    typeof arguments[1] === "undefined" ?
	    0 : arguments[1];
	
	return between(buffer, x, this.width - buffer);
    },

    // Y check, see above for variable args
    inBoundsY: function (y) {
	// variable args handling
	var buffer = this.buffer +
	    typeof arguments[1] === "undefined" ?
	    0 : arguments[1];
	
	return between(buffer, y, this.height - buffer);
    },

    // initialization function
    init: function () {
	// window boundaries
	// thanks to:
	// http://stackoverflow.com/questions/3437786/get-the-size-of-the-screen-current-web-page-and-browser-window

	// find relevant information
	var w = window;
	var d = document;
	var e = d.documentElement;
	var g = d.getElementsByTagName('body')[0];

	// set the global width and height based on relevant information
	this.width = Math.min(w.innerWidth,
			      e.clientWidth,
			      g.clientWidth) - this.buffer * 3;
	this.height = Math.min(w.innerHeight,
			       e.clientHeight,
			       g.clientHeight) - this.buffer * 3
	 - 135 // this is to compensate for the text at the top of the screen
	// TODO: make this smarter
	;

	// y'know just in case
	if (draw !== undefined) {
            draw.remove();
	}

	// set the main SVG element
	var canvas = document.getElementById("drawing");
	draw = SVG(canvas).size(this.width, this.height);

	// set offsetX and offsetY
	var border = canvas.getBoundingClientRect();
	this.offsetX = border.left;
	this.offsetY = border.top;
    }
};

// the player character
var player = {
    // first, some numbers of interest
    // the player's direction
    dirX: 0,
    dirY: 0,
    // the player's speed
    speed: 4,
    // the player's size (also determines size of interaction box)
    size: 40,
    
    // the player's SVG object
    object: undefined,
    // the player's "radius of interaction", another SVG object
    interactBox: undefined,
    
    // init function
    init: function () {
	// define the player's SVG object
	this.object = draw
	// location and color and stuff
	    .rect(player.size, player.size)
	    .front()
	    .fill("red")
	    .center(world.width/2, world.height/2)
	// triggers
	// update on game tick
	    .on("update", function(e) {
		this.fire("move");
	    })
	// function to move
	    .on("move", function (e) {
		// find the new coordinates
		var newX = this.cx() + player.speed * player.dirX;
		var newY = this.cy() + player.speed * player.dirY;
		// move in X if valid
		if (world.inBoundsX(newX, player.size)) {
		    this.center(newX, this.cy());
		}
		// move in Y if valid
		if (world.inBoundsY(newY, player.size)) {
		    this.center(this.cx(), newY);
		}
		// these are separate for consistent behavior on diagonal move

		// also tell the interaction box to move
		player.interactBox.fire("move");
	    })
	// function to interact
	    .on("interact", function(e) {
		var interacted = false;
		// if they collide, interact, which will usually change the text field
		for (var key in entities) {
		    var entity = entities[key];
		    if (rboxIntersect(player.interactBox, entity.object)) {
			entity.object.fire("interact");
			interacted = true;
			break;
		    }
		}
		// if not, clear the text field
		if (!interacted) {
		    text.render("");
		}
	    });
	
	// the player's interaction box
	this.interactBox = draw
	// color and location and stuff
    	    .rect(player.size*3, player.size*3)
	    .center(world.width/2, world.height/2)
	    .opacity(0)
	// when told to move, just recenter on the player's coordinates
	    .on("move", function(e) {
		this.center(player.object.cx(),
			    player.object.cy());
	    });
    }
};

// the text field at the bottom of the screen
var text = {
    // SVG object
    object: undefined,
    
    // text.render will make text appear at the bottom of the screen
    render: function (string) {
	return this.object.text(string);
    },
    // init function
    init: function () {
	this.object = draw.text("")
    	    .fill("rgb(30, 55, 30)")
	// TODO: make constants into variables somewhere
	    .move(10, world.height - 100);
    }
};

// the background
var bg = {
    // SVG object
    object: undefined,
    // colors for win-state and not-won-state
    success: "rgb(230,255,230)",
    failure: "rgb(255,240,240)",
    // function to change color
    
    update: function () {
	this.object.fill(world.success ? this.success : this.failure);
    },
    // init function
    init: function () {
	this.object = draw
            .rect(world.width, world.height)
            .back()
	// game should start in not-won-state
	    .fill(this.failure);
    }
}

// an array of objects in the game world
var entities = {
    // a black box in the middle of the screen
    box: {
	// box's dimensions and whatnot
	width: 100,
	height: 20,
	
	// again, the box's SVG object
	object: undefined,
	
	// init function
	init: function () {
	    this.object = draw
	    // colors n stuff
		.rect(this.width, this.height)
		.front()
		.fill("black")
		.center(world.width / 2, world.height / 2 + 300)
	    // all interacting does is make the game say that you won,
	    // and change the background color
		.on("interact", function(e) {
		    world.success = true;
		    text.render("You win!");
		    bg.update();
		});
	}
    },

    // the pink box to the side of the screen
    princess: {
	// dimensions
	width: 35,
	height: 40,

	// SVG object
	object: undefined,

	// init function
	init: function () {
	    this.object = draw
	    // dimensions and stuff
		.rect(this.width, this.height)
		.front()
		.fill("pink")
		.center(world.width/2 + 300, world.height/2)
	    // display dialogue
		.on("interact", function(e) {
		    if (world.success) {
			text.render('"Nicely done."');
		    }
		    else {
			text.render('"You should interact with that box."');
		    }
		});
	}
    }
}

// ================================================================

// MISC. HELPERS
// ----------------------------------------------------------------
var between = function (a, b, c) {
    return (a < b && b < c);
}

var rboxIntersect = function (shape1, shape2) {

    // extract values, for corners
    var b1 = shape1.rbox();
    var b2 = shape2.rbox();
    
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
	case 69: player.object.fire("interact"); break;
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
    for (var key in entities) {
	entities[key].init();
    }
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
