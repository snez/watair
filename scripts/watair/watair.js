
var CLASS_NO_COLLISION = 0;
var CLASS_PLAYER = 1;
var CLASS_BUBBLE = 2;

var CREATURE_UNKNOWN = 0;
var CREATURE_FISH = 1;
var CREATURE_BEE = 2;

function Sprite() {}
Sprite.prototype =
{
	/**
	 * Type of this Sprite (like class).
	 */
	type : CLASS_NO_COLLISION,

	/**
	 * Sprite animation frames.  null indicates this is not an animated sprite.
	 */
	animFrames:null,
  directionChanged : false,
  facing : 'right',
  setDirection : function(direction) {
    if (direction != this.facing) {
      this.facing = direction;
      this.directionChanged = true;
    }
  },

	creature : CREATURE_BEE,

	/**
	 * Which frame currently showing.
	 */
	frameNum:0,

    update: function(){},

    setImage: function(imgRight, imgLeft)
    {
        this.img = imgRight;
        this.imgRight = imgRight;
        this.imgLeft = imgLeft;
    },

	debugDraw: function debugDraw(ctx)
	{
        // Debug rendering by drawing boxes
        ctx.beginPath();
        ctx.rect(this.x - 2, this.y - 2, 36, 36);
        // ctx.fillStyle = "#8ED6FF";
	    // ctx.fill();
	    ctx.lineWidth = 4;
	    ctx.strokeStyle = "black";
	    ctx.stroke();
	},

    setAnimFrames: function(frames)
    {
    	this.animFrames = frames;
    	this.numFrames = frames.length;
    	this.draw = function animate(ctx)
    	{
    		// this.debugDraw(ctx);
    		var frameNum = this.frameNum;
    		if (++frameNum >= this.numFrames) {
    			frameNum = 0;
    		}
    		var img = this.animFrames[frameNum];
    		ctx.drawImage(img, this.x, this.y);
    		this.frameNum = frameNum;
    	};
    },

    draw : function(ctx)
    {
    	// this.debugDraw(ctx);
      ctx.drawImage(this.img, this.x, this.y);

    }

};

/**
 * @param imageName The image filename.  If contains a number, this is an animated sprite and the number represents the last frame number.
 */
Sprite.create = function spriteCreateFn(type, x, y, imageName, app, updateFunction)
{
    var c = new Sprite();
    c.type = type;
    c.x = x;
    c.y = y;

    c.app = app;
    c.img = new Image();
    c.imageName = imageName ? imageName: 'textures/cratebubble_up_1.png';

    // c.console = app.console;

    c.update = updateFunction;

    return c;
};

var FISH_FILENAME = "textures/fish anim/fish anim00012.png";
var BEE_FILENAME = "textures/bee anim/bee anim00012.png";

//
// Watair:
//
function Watair() {}
Watair.prototype =
{
	mvX: true,
	mvY: true,

	/**
	 * All of the player sprites.
	 */
	playerSprites : [],

	/**
	 * The sprite that the player controls.
	 */
	playerSprite: null,

	/**
	 * The water.
	 */
	waterSprite: null,

	createBubble : function createBubble()
	{
		var randomX = Math.floor((Math.random()*240)+1);
        var randomY = Math.floor((Math.random()*320)+1);
        var newBubble = Sprite.create(CLASS_BUBBLE, randomX, randomY, 'textures/down bubble float/down bubble float.png', this.app, function(){});
        newBubble.bubbleValue = (Math.random() >= 0.5) ? -20 : 20;
        if (newBubble.bubbleValue > 0) {
        	newBubble.imageName = 'textures/up bubble float/up bubble float0001.png';
        }
        this.sprites.push(newBubble);

	},

    init: function initFn()
    {
        var that = this;

		function buildPlayer(x, y, filename, allSprites) {
			var sprite = Sprite.create(CLASS_PLAYER, x, y, filename, this.app, function()
				{
					if (this.mvX && Math.abs(this.x - this.destX) > 9)
					{
						this.x += this.dx;
					} else {
						this.mvX = false;
					}
					if (this.mvY && Math.abs(this.y - this.destY) > 9)
					{
						this.y += this.dy;
					} else {
						this.mvY = false;
					}

				});

			sprite.speed = 5;
			sprite.destX = 150;
			sprite.destY = 150;
			sprite.dx = 0;
			sprite.dy = 0;

		    sprite.setDestination = function(x, y)
		    {
		    	this.destX = x;
		    	this.destY = y;
		    	var w = x - this.x;
		    	var h = y - this.y;
		    	var theta = Math.atan2(h, w);
		    	this.dx = this.speed * Math.cos(theta);
		    	this.dy = this.speed * Math.sin(theta);
          if (h < 0) {
            sprite.setDirection('left');
          } else {
            sprite.setDirection('right');
          }
		    	this.mvX = this.mvY = true;
		    };

			allSprites.push(sprite);
			return sprite;
		}

		this.playerSprites.push(buildPlayer(100, 100, BEE_FILENAME, this.sprites));
		this.playerSprites.push(buildPlayer(120, 200, FISH_FILENAME, this.sprites));
		this.playerSprite = this.playerSprites[0];
		this.opponentSprite = this.playerSprites[1];

        var waterSprite = Sprite.create(CLASS_NO_COLLISION, 0, 150, 'textures/under-glow-iphone-wallpaper.jpg', this.app, function()
	    {
	    	var pixelHeight = this.app.pixelHeight;
	    	if (0 === this.change) {
	    		// stationary
	    		return;
	    	} else if (this.change > 0) {
	    		this.y++;
	    		this.change--;
	    	} else {
	    		this.y--;
	    		this.change++;
	    	}

	        if (this.y > pixelHeight)
	        {
	        	this.y = 100;
	        }
	    });
	    waterSprite.change = 0;
	    waterSprite.addChange = function addChange(change) {
	    	this.change += change;
	    };
	    this.sprites.push(this.waterSprite = waterSprite);

        // bubble placement
        for (var j = 0; j < 10; j++)
        {
        	this.createBubble();
        }

    },

    movePlayerTo : function moveTo(x, y) {
      this.playerSprite.setDestination(x, y);
    },
    moveOpponentTo : function moveTo(x, y) {
      this.opponentSprite.setDestination(x, y);
    },
    setPlayer : function setPlayer(num) {
      if (num == 1) {
        this.playerSprite = this.playerSprites[0];
        this.playerSprite.creature = CREATURE_BEE;
        this.opponentSprite = this.playerSprites[1];
      } else {
        this.playerSprite = this.playerSprites[1];
        this.playerSprite.creature = CREATURE_FISH;
        this.opponentSprite = this.playerSprites[0];
      }
    },

    update: function updateFn()
    {
/*
        var console = window.console;
        if (console)
        {
            console.log('Updating '); // + this.sprites.length);
        }
*/
		var sprites = this.sprites;
        for (var i = sprites.length - 1; i >= 0; i--)
        {
            sprites[i].update();
        }

        this.collisionDetect();
    },

    draw: function drawFn(ctx)
    {
        for (var i = this.sprites.length - 1; i >= 0; i--)
        {
            this.sprites[i].draw(ctx);
        }
    },

    collisionDetect: function detectCollision()
    {
    	// collision detection
		for (var i = this.sprites.length - 1; i >= 0; i--)
        {
			var objRadius = 17; //image size is 35px at the moment of writing this code
			var charRadius = 16; //image size is 32px at the moment of writing this code
			var collisionDistance = 30 * 30; //(adding up radii, approximately)

			var theSprite = this.sprites[i];
			// Using distance calculation equation
			var actualDistance =
					(theSprite.x - this.playerSprite.x)*(theSprite.x - this.playerSprite.x)
					 + (theSprite.y - this.playerSprite.y)*(theSprite.y - this.playerSprite.y);

			if (theSprite.type == CLASS_BUBBLE)
			{

				if (actualDistance <= collisionDistance)
				{
					// Collision
					// console.log("pop");

					// bubble disappear
					this.sprites.splice(i--, 1); // i-- sets position to redo this bubble

					// TODO: Animate bubble disappearance

					// bubble reappear
					this.createBubble(); // TODO: Bubble appear on correct side

					// water moves up/down
					this.waterSprite.addChange(theSprite.bubbleValue);
				}

			}


			// FIXME: Switch to using background height check for water level.
			var waterSprite = this.waterSprite;
			if (this.playerSprite.creature == CREATURE_FISH && waterSprite.y >= this.playerSprite.y) {
				// TODO: FISH DIED
				window.console.log("fish died");
			} else if (this.playerSprite.creature == CREATURE_BEE && waterSprite.y <= this.playerSprite.y) {
				// TODO: BEE DIED
				window.console.log("bee died");
			}

/*
			if ((theSprite.imageName == 'textures/under-glow-iphone-wallpaper.jpg')
					&& (this.playerSprite.imageName != FISH_FILENAME))
				{
					// Termination
					// Bee loses
				}

			if ((theSprite.imageName == 'textures/under-glow-iphone-wallpaper.jpg')
					&& (this.playerSprite.imageName == FISH_FILENAME)
					&& (this.playerSprite.y < theSprite.y))
				{
					// Termination
					// Fish loses
					// this.console.log('Dead Fish');
				}
*/
        }

    }
};

Watair.create = function watairCreateFn(gameSettings, app)
{
    var watair = new Watair();

    watair.app = app;
    watair.sprites = [];

    watair.console = app.console;

    return watair;
};

