
function Sprite() {}
Sprite.prototype =
{
	/**
	 * Sprite animation frames.  null indicates this is not an animated sprite.
	 */
	animFrames:null,

	/**
	 * Which frame currently showing.
	 */
	frameNum:0,

    update: function(){},

    setImage: function(img)
    {
        this.img = img;
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
    	this.console.log("animFrames:" + frames);
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
Sprite.create = function spriteCreateFn(x, y, imageName, app, updateFunction)
{
    var c = new Sprite();
    c.x = x;
    c.y = y;

    c.app = app;
    c.img = new Image();
    c.imageName = imageName ? imageName: 'textures/cratebubble_up_1.png';
    
    c.console = app.console;

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

    init: function initFn()
    {
        this.console.log('Init');
        
        var that = this;

		function buildPlayer(x, y, filename, allSprites) {
			var sprite = Sprite.create(x, y, filename, that.app, function()
				{
					if (this.mvX && Math.abs(this.x - this.destX) > 9)
					{
						this.x += this.dx;
					} else {
						if (this.mvX) { that.console.log("reached X:" + this.x + " which is close enough to " + this.destX); }
						this.mvX = false;
					}
					if (this.mvY && Math.abs(this.y - this.destY) > 9)
					{
						this.y += this.dy;
					} else {
						if (this.mvY) { that.console.log("reached y:" + this.y + " which is close enough to " + this.destY); }
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
		    	that.console.log("delta:" + this.dx + ", " + this.dy);
		    	this.mvX = this.mvY = true;
		    };

			allSprites.push(sprite);
			return sprite;
		}

		this.playerSprites.push(buildPlayer(100, 100, BEE_FILENAME, this.sprites));
		this.playerSprites.push(buildPlayer(120, 200, FISH_FILENAME, this.sprites));
		this.playerSprite = this.playerSprites[0];
    this.opponentSprite = this.playerSprites[1];

        this.sprites.push(Sprite.create(0, 150, 'textures/under-glow-iphone-wallpaper.jpg', this.app, function()
		    {
		    	var pixelHeight = this.app.pixelHeight;
		        this.y += 1;

		        if (this.y > pixelHeight)
		        {
		        	this.y = 100;
		        }
		    }));

        // bubble placement
        for (var j = 0; j < 10; j++)
        {
        	var randomX = Math.floor((Math.random()*240)+1);
            var randomY = Math.floor((Math.random()*320)+1);

            this.sprites.push(Sprite.create(randomX, randomY, 'textures/bubble.png', this.app, function(){}));
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
        this.opponentSprite = this.playerSprites[1];
      } else {
        this.playerSprite = this.playerSprites[1];
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
			var collisionDistance = 30; //(adding up radii, approximately)

			// Using distance calculation equation
			var actualDistance =
				Math.sqrt((this.sprites[i].x - this.playerSprite.x)*(this.sprites[i].x - this.playerSprite.x)
						+ (this.sprites[i].y - this.playerSprite.y)*(this.sprites[i].y - this.playerSprite.y));

			if (this.sprites[i].imageName == 'textures/bubble.png')
			{

				if (actualDistance <= collisionDistance)
				{
					// Collision
					// bubble disappear reappear
					// water moves up/down
				}

			}

			if ((this.sprites[i].imageName == 'textures/under-glow-iphone-wallpaper.jpg')
					&& (this.playerSprite.imageName != FISH_FILENAME))
				{
					// Termination
					// Bee loses
				}

			if ((this.sprites[i].imageName == 'textures/under-glow-iphone-wallpaper.jpg')
					&& (this.playerSprite.imageName == FISH_FILENAME)
					&& (this.playerSprite.y < this.sprites[i].y))
				{
					// Termination
					// Fish loses
					this.console.log('Dead Fish');
				}
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

