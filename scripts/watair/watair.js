
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
    },
    
    draw: function drawFn(ctx)
    {
        var sprite;
        for (var i = 0; i < 10; i++)
        {
            sprite = this.sprites[i];
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

