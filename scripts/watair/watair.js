
function Sprite() {}
Sprite.prototype =
{
    update: function (delta)
    {
        var pixelWidth = this.app.pixelWidth;
        this.x += delta;
        
        if (this.x > pixelWidth)
        {
            this.x = this.x - pixelWidth;
        }
        this.y = Math.sin(this.x);
    },
    
    setImage: function (img)
    {
        this.img = img
    },
    
    flood: function (delta)
    {
    	var pixelHeight = this.app.pixelHeight;
        this.y += delta;
        
        //if (this.y > pixelHeight)
        if (this.y > pixelHeight)
        {
            //this.y = this.y - pixelHeight;
        	this.y = 100;
        }
        this.x = Math.sin(this.y); 
    }
}

Sprite.create = function spriteCreateFn(x, y, imageName, app)
{
    var c = new Sprite();
    c.x = x;
    c.y = y;
    
    c.app = app;
    c.img = new Image();
    c.imageName = imageName ? imageName: 'textures/crate.jpg';
    
    return c;
};


//
// Watair:
//
function Watair() {}
Watair.prototype =
{
    init: function initFn()
    {
        var console = window.console;
        if (console)
        {
            console.log('Init');
        }
        
        for (var i = 0; i < 10; i++)
        {
            this.sprites.push(Sprite.create(i, i, '', this.app));
        }
        
        this.sprites.push(Sprite.create(100,100,'textures/under-glow-iphone-wallpaper.jpg',this.app))
     
    },
    
    update: function updateFn()
    {
        var console = window.console;
        if (console)
        {
            console.log('Update');
        }
        
        for (var i = 0; i < 10; i++)
        {
            this.sprites[i].update(Math.PI / 4);
        }
        
        this.sprites[10].flood(Math.PI / 4);
    },
    
    draw: function drawFn(ctx)
    {
        var sprite;
        for (var i = 0; i < 10; i++)
        {
            sprite = this.sprites[i];
            ctx.drawImage(sprite.img, sprite.x, sprite.y);
        }        
        
        sprite = this.sprites[10];
        ctx.drawImage(sprite.img, sprite.x, sprite.y);
    }
};

Watair.create = function watairCreateFn(gameSettings, app)
{
    var watair = new Watair();
    
    watair.app = app;
    watair.sprites = [];

    return watair;
};

