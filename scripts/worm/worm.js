// Copyright (c) 2011-2012 Turbulenz Limited

//
// Worm: Worm class
//
function Worm() {}
Worm.prototype =
{
    // Enums for worm direction
    direction :
    {
        NONE : -1,
        UP : 0,
        DOWN : 1,
        RIGHT : 2,
        LEFT : 3
    },

    upVector    : [ 0,  1],
    downVector  : [ 0, -1],
    rightVector : [ 1,  0],
    leftVector  : [-1,  0],
    zeroVector  : [ 0,  0],

    // Changes the worm's direction
    changeDirection : function changeDirectionFn(newDirection)
    {
        var direction = this.direction;
        var directionVector = this.directionVector;
        var newDirectionVector;

        switch (newDirection)
        {
        case direction.UP:
            if (directionVector !== this.downVector)
            {
                newDirectionVector = this.upVector;
            }
            break;
        case direction.DOWN:
            if (directionVector !== this.upVector)
            {
                newDirectionVector = this.downVector;
            }
            break;
        case direction.RIGHT:
            if (directionVector !== this.leftVector)
            {
                newDirectionVector = this.rightVector;
            }
            break;
        case direction.LEFT:
            if (directionVector !== this.rightVector)
            {
                newDirectionVector = this.leftVector;
            }
            break;
        default:
            newDirectionVector = this.zeroVector;
            break;
        }

        if (newDirectionVector !== undefined)
        {
            if (directionVector !== newDirectionVector)
            {
                this.directionVector = newDirectionVector;
                this.updated = true;
            }
        }
    },

    // Update called every frame
    update : function updateFn()
    {
        if (this.directionVector !== this.zeroVector)
        {
            this.moveBody();
            this.moveHead();
            this.updated = true;
        }

        this.killedBy = null;
    },

    // Collided with something
    die : function dieFn(killedBy)
    {
        this.directionVector = this.zeroVector;
        this.killedBy = killedBy;
        this.updated = true;
    },

    // Serialize worm information
    serialize : function serializeFn()
    {
        var directionVector = this.directionVector;
        var direction = this.direction;

        var dir;
        if (directionVector === this.downVector)
        {
            dir = direction.DOWN;
        }
        else if (directionVector === this.upVector)
        {
            dir = direction.UP;
        }
        else if (directionVector === this.leftVector)
        {
            dir = direction.LEFT;
        }
        else if (directionVector === this.rightVector)
        {
            dir = direction.RIGHT;
        }
        else //if (directionVector === this.zeroVector)
        {
            dir = direction.NONE;
        }

        var data = {
            dir: dir,
            x: this.partsPositionX.slice(),
            y: this.partsPositionY.slice()
        };

        var killedBy = this.killedBy;
        if (killedBy !== null)
        {
            data.killedBy = killedBy;
        }

        return data;
    },

    // Deserialize from external data
    deserialize : function deserializeFn(isHost, data)
    {
        var partsPositionX = this.partsPositionX;
        var partsPositionY = this.partsPositionY;
        var numParts = partsPositionX.length;

        if (!isHost)
        {
            var killedBy = data.killedBy;
            if (killedBy !== undefined)
            {
                this.killedBy = killedBy;
            }
            else
            {
                this.killedBy = null;
            }
        }

        var direction = this.direction;
        switch (data.dir)
        {
        case direction.UP:
            this.directionVector = this.upVector;
            break;
        case direction.DOWN:
            this.directionVector = this.downVector;
            break;
        case direction.RIGHT:
            this.directionVector = this.rightVector;
            break;
        case direction.LEFT:
            this.directionVector = this.leftVector;
            break;
        default:
            this.directionVector = this.zeroVector;
            break;
        }

        var newPartsPositionX = data.x;
        var newPartsPositionY = data.y;
        var newNumParts = newPartsPositionX.length;

        if (numParts !== newNumParts)
        {
            partsPositionX.length = newNumParts;
            partsPositionY.length = newNumParts;
        }

        for (var n = 0; n < newNumParts; n += 1)
        {
            partsPositionX[n] = newPartsPositionX[n];
            partsPositionY[n] = newPartsPositionY[n];
        }
    },

    // Moves all of worm parts as required
    moveBody : function moveBodyFn()
    {
        var partsPositionX = this.partsPositionX;
        var partsPositionY = this.partsPositionY;
        var length = partsPositionX.length;
        var tailIndex = (length - 1);

        var i;

        // Update the previous tail position
        this.previousTailX = partsPositionX[tailIndex];
        this.previousTailY = partsPositionY[tailIndex];

        // Copy positions from back to front
        for (i = tailIndex; i > 0; i -= 1)
        {
            partsPositionX[i] = partsPositionX[i - 1];
            partsPositionY[i] = partsPositionY[i - 1];
        }
    },

    // Moves head and loops over board edge if necessary
    moveHead : function moveHeadFn()
    {
        var boardWidth = this.boardWidth;
        var boardHeight = this.boardHeight;
        var partsPositionX = this.partsPositionX;
        var partsPositionY = this.partsPositionY;
        var directionVector = this.directionVector;
        var headPositionX = partsPositionX[0];
        var headPositionY = partsPositionY[0];

        // Update head of snake
        headPositionX += directionVector[0];
        headPositionY += directionVector[1];

        this.hasLooped = true;

        // Adjust if it has gone off edge
        if (headPositionX === boardWidth)
        {
            headPositionX = 0;
        }
        else if (headPositionX === -1)
        {
            headPositionX = boardWidth - 1;
        }
        else if (headPositionY === boardHeight)
        {
            headPositionY = 0;
        }
        else if (headPositionY === -1)
        {
            headPositionY = boardHeight - 1;
        }
        else
        {
            this.hasLooped = false;
        }

        partsPositionX[0] = headPositionX;
        partsPositionY[0] = headPositionY;
    },

    // Increases worm length by 1
    addToTail : function addToTailFn()
    {
        var partsPositionX = this.partsPositionX;
        var partsPositionY = this.partsPositionY;
        var length = partsPositionX.length;

        partsPositionX[length] = this.previousTailX;
        partsPositionY[length] = this.previousTailY;

        this.updated = true;
    },

    // Tests for self intersection
    isIntersectingSelf : function isIntersectingSelfFn()
    {
        var partsPositionX = this.partsPositionX;
        var partsPositionY = this.partsPositionY;
        var length = partsPositionX.length;
        var headX = partsPositionX[0];
        var headY = partsPositionY[0];

        var i;

        for (i = 1; i < length; i += 1)
        {
            if (partsPositionX[i] === headX &&
                partsPositionY[i] === headY)
            {
                return true;
            }
        }

        return false;
    },

    // Tests for intersection with other worms
    isIntersecting : function isIntersectingFn(otherWorm)
    {
        var otherPartsPositionX = otherWorm.partsPositionX;
        var otherPartsPositionY = otherWorm.partsPositionY;
        var otherLength = otherPartsPositionX.length;

        var headX = this.partsPositionX[0];
        var headY = this.partsPositionY[0];

        var i;

        for (i = 0; i < otherLength; i += 1)
        {
            if (otherPartsPositionX[i] === headX &&
                otherPartsPositionY[i] === headY)
            {
                return true;
            }
        }

        return false;
    },

    // Tests if position x,y is covered by worm
    containsPosition : function containsPosition(x, y)
    {
        var partsPositionX = this.partsPositionX;
        var partsPositionY = this.partsPositionY;
        var length = partsPositionX.length;

        var i;

        for (i = 0; i < length; i += 1)
        {
            if (partsPositionX[i] === x &&
                partsPositionY[i] === y)
            {
                return true;
            }
        }

        return false;
    },

    // Test if position x,y is covered by worm head
    isOnHead : function isOnHeadFn(x, y)
    {
        if (this.partsPositionX[0] === x &&
            this.partsPositionY[0] === y)
        {
            return true;
        }

        return false;
    },

    // Resets worm to original state
    reset : function reset(x, y)
    {
        this.hasLooped = false;

        var partsPositionX = this.partsPositionX;
        var partsPositionY = this.partsPositionY;

        this.directionVector = this.zeroVector;

        partsPositionX.length = 1;
        partsPositionY.length = 1;

        partsPositionX[0] = x;
        partsPositionY[0] = y;

        this.previousTailX = x;
        this.previousTailY = y;

        this.updated = true;
    }
};

Worm.create = function wormCreateFn(gameSettings)
{
    var worm = new Worm();

    worm.boardSpacing = gameSettings.boardSpacing;
    worm.boardWidth = gameSettings.width;
    worm.boardHeight = gameSettings.height;
    worm.maxPlayers = gameSettings.maxPlayers;

    worm.directionVector = worm.zeroVector;

    worm.partsPositionX = [];
    worm.partsPositionY = [];
    worm.previousTailX = 0;
    worm.previousTailY = 0;

    worm.killedBy = null;
    worm.updated = false;

    return worm;
};
