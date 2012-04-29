
function Sprite() {}
Sprite.prototype =
{
    update: function(){},

    setImage: function (img)
    {
        this.img = img;
    }

};

Sprite.create = function spriteCreateFn(x, y, imageName, app, updateFunction)
{
    var c = new Sprite();
    c.x = x;
    c.y = y;

    c.app = app;
    c.img = new Image();
    c.imageName = imageName ? imageName: 'textures/cratebubble_up_1.png';

    c.update = updateFunction;

    return c;
};


//
// Watair:
//
function Watair() {}
Watair.prototype =
{
	mvX: true,
	mvY: true,

	playerSprite : function(){
		var sprite = Sprite.create(100, 100, 'textures/fish.png', this.app, function()
			{
				if (this.mvX && Math.abs(this.x - this.destX) > 9)
				{
					this.x += this.dx;
				} else {
					if (this.mvX) { console.log("reached X:" + this.x + " which is close enough to " + this.destX); }
					this.mvX = false;
				}
				if (this.mvY && Math.abs(this.y - this.destY) > 9)
				{
					this.y += this.dy;
				} else {
					if (this.mvY) { console.log("reached y:" + this.y + " which is close enough to " + this.destY); }
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
	    	this.destX = x; // * window.app.scaleX;
	    	this.destY = y; // * window.app.scaleY;
	    	var w = x - this.x;
	    	var h = y - this.y;
	    	// var theta = Math.atan(h/w);
	    	var theta = Math.atan2(h, w);
	    	this.dx = this.speed * Math.cos(theta);
	    	this.dy = this.speed * Math.sin(theta);
	    	console.log("delta:" + this.dx + ", " + this.dy);
	    	this.mvX = this.mvY = true;
	    };

		return sprite;
	}(),

    init: function initFn()
    {
        var console = window.console;
        if (console)
        {
            console.log('Init');
        }

        this.sprites.push(this.playerSprite);
        this.sprites.push(Sprite.create(0, 100, 'textures/under-glow-iphone-wallpaper.jpg', this.app, function()
		    {
		    	var pixelHeight = this.app.pixelHeight;
		        this.y += 1;

		        //if (this.y > pixelHeight)
		        if (this.y > pixelHeight)
		        {
		        	this.y = 100;
		        }
		    }));
    },

    movePlayerTo : function moveTo(x, y) {
    	console.log("moving to " + x + ", " + y);
		this.playerSprite.setDestination(x, y);
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
    },

    draw: function drawFn(ctx)
    {
        var sprite;
        for (var i = this.sprites.length - 1; i >= 0; i--)
        {
            sprite = this.sprites[i];

/*
            // Debug rendering by drawing boxes
            ctx.beginPath();
            ctx.rect(sprite.x - 2, sprite.y - 2, 36, 36);
            // ctx.fillStyle = "#8ED6FF";
		    // ctx.fill();
		    ctx.lineWidth = 4;
		    ctx.strokeStyle = "black";
		    ctx.stroke();
*/

            ctx.drawImage(sprite.img, sprite.x, sprite.y);
        }
    }
};

Watair.create = function watairCreateFn(gameSettings, app)
{
    var watair = new Watair();

    watair.app = app;
    watair.sprites = [];

    return watair;
};

