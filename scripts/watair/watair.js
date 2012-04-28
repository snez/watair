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
        
    },
    
    update: function updateFn()
    {
        var console = window.console;
        if (console)
        {
            console.log('Update');
        }
    }
};

Watair.create = function watairCreateFn(gameSettings)
{
    var watair = new Watair();

    return watair;
};

