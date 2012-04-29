// Copyright (c) 2011-2012 Turbulenz Limited

/*global TurbulenzEngine: false*/
/*global Loader: false*/
/*global Game: false*/
/*global TurbulenzServices: false*/
/*global RequestHandler: false*/
/*global TextureManager: false*/
/*global ShaderManager: false*/
/*global EffectManager: false*/
/*global FontManager: false*/
/*global GameBadges: false*/
/*global GameLeaderboards: false*/
/*global AppScene: false*/
/*global Utilities: false*/
/*global HtmlWriter: false*/
/*global window: false*/

//
// Application: The global for the whole application (singleton)
//
function Application() {}
Application.prototype =
{
  soundBubbleUp : false,
  soundBubbleDown : false,
  soundTitleMusic : false,
  soundMainMusic : false,
  soundScoreScreen : false,
  soundWinner : false,
  soundLoser : false,

    gameSettings : {
        width : 30,  // Must be a multiple of 2
        height : 16, // Must be a multiple of 2
        boardSpacing : 1.1,
        maxPlayers : 3
    },

    gameTimeStep : 0.05,

    networkIds : {
        joining : 0,
        update : 1,
        leaving : 2
    },

    staleTime : 1.5,

    // Error callback - uses window alert
    errorCallback : function errorCallbackFn(msg)
    {
        window.alert(msg);
    },

    // Initialise the application
    init : function initFn()
    {
        // Test for minimum engine version, device creation, and shader support
        if (!this.createDevices())
        {
            return;
        }

        this.watair.init();

        this.pixelWidth = 240;
        this.pixelHeight = 320;
        this.ratio = this.pixelWidth / this.pixelHeight;
        this.wInnerWidth = 0;
        this.wInnerHeight = 0;

        this.canvasResize();

        var creationFunctions =
        [
            {func : this.createGameSession, isDependent : false},
            {func : this.createMappingTable, isDependent : true},
            {func : this.createLeaderboardManager, isDependent : true},
            {func : this.createBadgeManager, isDependent : false, noCallback : true},
            {func : this.createGameLeaderboards, isDependent : true},
            {func : this.createGameBadges, isDependent : false},
            {func : this.createGameSounds, isDependent : false, noCallback : true },
            {func : this.createGame, isDependent : true, noCallback : true},
            {func : this.createHTMLWriter, isDependent : true, noCallback : true},
            {func : this.enterLoadingLoop, isDependent : true}
        ];
        this.enterCallbackChain(this, creationFunctions);

        var endpoint = 'http://10.10.2.44:8083';
        var socket = io.connect(endpoint);
        var app = this;
        this.socket = socket;

        // Socket events
        socket.on('connect', function(){
          console.log("Connected to server!");
        });

        socket.on('disconnect', function(s){
          console.log("Disconnected from server!");
        });

        socket.on('msg', function(data) {
          if (typeof data.type != 'undefined') {
            if (data.type == 'move') {
              app.watair.moveOpponentTo(data.player.coordinates.x, data.player.coordinates.y);
              console.log('Player has moved');
              console.log('x: '+ data.player.coordinates.x + ', y: '+data.player.coordinates.y);
            }
            if (data.type == 'setPlayer') {
              app.watair.setPlayer(num);
            }
          }
          console.log(data);
        });

    },

    // Update function called in main loop
    update : function updateFn(currentTime)
    {
        var devices = this.devices;

        devices.inputDevice.update();

        devices.networkDevice.update();

        var heartbeat = false;

        if ((currentTime - this.previousGameUpdateTime) > this.gameTimeStep)
        {
            this.previousGameUpdateTime = currentTime;

            this.checkOthers();

            heartbeat = true;
        }

        if (this.updateGame(heartbeat))
        {
            this.watair.update();

            this.leaderboards.update(currentTime);

            this.badges.update(currentTime);

            this.htmlWriter.update();

            return true;
        }

        return false;
    },

    loadImages : function loadImagesFn(mappingTable)
    {
    	this.images = [];

		var backgroundImageName = 'textures/bg.jpg';
		this.backgroundImage = new Image();
        var bgImgURL = mappingTable[backgroundImageName];
        if (bgImgURL)
        {

            this.backgroundImage.src = bgImgURL;
        }
        else
        {
            var console = window.console;
            if (console)
            {
                console.error('Image missing: ', backgroundImageName);
            }

        }

		function loadImage(sprite, imageName, images)
		{
			imageURL = mappingTable[imageName];
            if (imageURL)
            {
                image = images[imageName];
                if (!image)
                {
                    image = new Image();
                }
                image.src = imageURL;
                images[imageName] = image;
                return image;
            } else {
            	var console = window.console;
	            if (console)
	            {
	                console.error('Image for sprite ' + sprite + ' missing: ', sprite.imageName);
	            }
            }
		}

		function pad(number, length)
		{
		    var str = '' + number;
		    while (str.length < length)
		    {
		        str = '0' + str;
		    }

		    return str;
		}

		function getAnimatedFilenames(filename)
		{
			var matches = filename.match(/([a-z \/]+)(\d+)\.([a-z]+)/);
			if (null === matches) {
				return null;
			}

			var max = matches[2], paddedNum, animFilenames = [];
			for (var i = 1; i <= max; i++) {
				paddedNum = pad(i, 4);
				frameName = matches[1] + paddedNum + "." + matches[3];
				animFilenames.push(frameName);
			}
			return animFilenames;
		}

		function loadAnimFrames(sprite, images, animFilenames, animFrames) {
        	var animFrames = [];
        	for (var i = 0; i < animFilenames.length; i++)
        	{
        		image = loadImage(sprite, animFilenames[i], images);
        		animFrames.push(image);
        	}
        	sprite.setAnimFrames(animFrames);
		}

		function loadSprites(sprites, images) {
	        var sprite, image, imageName, animFilenames;

	        for (var i = sprites.length - 1; i >= 0; i--)
	        {
	            sprite = sprites[i];
	            imageName = sprite.imageName;
	            animFilenames = getAnimatedFilenames(imageName);
	            if (animFilenames)
	            {
	            	window.console.log("image \"" + imageName + "\" is animated: " + animFilenames);
	            	loadAnimFrames(sprite, images, animFilenames, animFilenames);
	            } else {
		            image = loadImage(sprite, imageName, images);
		            sprite.setImage(image);
	            }
	        }
		}
		loadSprites(this.watair.sprites, this.images);
    },

    // Update game state
    updateGame : function updateGameFn(heartbeat)
    {
        var isHost = this.isHost;
        var game = this.game;

        game.update(isHost, heartbeat);

        var multiplayerSession = this.multiplayerSession;
        if (multiplayerSession)
        {
            var updateData = {
                frame: this.frameCounter
            };

            var needToSend = game.serializeDelta(isHost, updateData);
            if (needToSend)
            {
                if (isHost)
                {
                    updateData.host = true;
                }

                multiplayerSession.sendToAll(this.networkIds.update, JSON.stringify(updateData));
            }
            else if (heartbeat)
            {
                multiplayerSession.sendToAll(this.networkIds.update);
            }
        }

        if (heartbeat)
        {
            this.frameCounter += 1;
            this.needToRender = true;
        }

        return this.needToRender;
    },

    // Render function called in main loop
    render : function renderFn(currentTime)
    {
        this.renderCanvas();

        this.needToRender = false;
    },

    canvasResize : function canvasResizeFn()
    {
        var canvas = this.canvas;
        var canvas2dContext = this.canvas2dContext;

        this.wInnerHeight = window.innerHeight;
        this.wInnerWidth = window.innerWidth;

        canvas.width = (window.innerHeight * this.ratio);
        canvas.height = window.innerHeight;

        this.scaleX = window.innerHeight / this.pixelHeight;
        this.scaleY = canvas.width / this.pixelWidth;


        //canvas2dContext.translate(
         //                       -(((canvas2dContext.canvas.width * scale) - canvas2dContext.canvas.width) >> 1),
         //                       -(((canvas2dContext.canvas.height * scale) - canvas2dContext.canvas.height) >> 1));
        canvas2dContext.scale(this.scaleX, this.scaleY);

        this.width = canvas.width;
        this.height = canvas.height;
    },

    renderCanvas : function renderCanvasFn()
    {
        var canvas = this.canvas;
        var canvas2dContext = this.canvas2dContext;

        var innerHeight = window.innerHeight;
        var innerWidth = window.innerWidth;

        if (innerHeight != this.wInnerHeight || innerWidth != this.wInnerWidth)
        {
            this.canvasResize();
        }

        canvas2dContext.clearRect(0 , 0, this.width, this.height);

        // Clear background to red or grey
        canvas2dContext.fillStyle = "#555500";
        canvas2dContext.fillRect(0, 0, 240, 320);

        canvas2dContext.fillStyle = "#000000";
        canvas2dContext.fillText("Height: " + canvas.height + ', Width: ' + canvas.width, 10, 20);

        canvas2dContext.drawImage(this.backgroundImage , 0, 0);
        this.watair.draw(canvas2dContext);




        // Focus
        //if (this.isFocused)
        //{
        //    this.drawFocusBorder();
        //}
        //
        //// Lock button
        //this.drawLockButton();
        //
        //// Draw text event output
        //this.drawEventText();
        //
        //if (this.logPadMoveInput)
        //{
        //    this.drawPadMove();
        //}
        //
        //this.drawCursor();
    },

    // Load UI
    loadUI : function loadUI()
    {
        //var managers = this.managers;
        //managers.fontManager.load('fonts/hero.fnt');
        //managers.shaderManager.load('shaders/font.cgfx');
    },

    hasUILoaded : function hasUILoadedFn()
    {
        return true;
        var managers = this.managers;
        var fontManager = managers.fontManager;
        var shaderManager = managers.shaderManager;
        if (fontManager.getNumPendingFonts() === 0 &&
            shaderManager.getNumPendingShaders() === 0)
        {
            if (!this.technique2D)
            {
                /*var devices = this.devices;

                var font = fontManager.load('fonts/hero.fnt');
                this.font = font;

                var shader = shaderManager.get('shaders/font.cgfx');
                this.technique2D = shader.getTechnique('font');
                this.technique2Dparameters = devices.graphicsDevice.createTechniqueParameters({
                    clipSpace: devices.mathDevice.v4BuildZero(),
                    alphaRef: 0.01,
                    color: devices.mathDevice.v4BuildOne()
                });*/
            }

            return true;
        }

        return false;
    },

    // Draw UI
    drawUI : function drawUIFn()
    {
        var game = this.game;
        var devices = this.devices;
        var graphicsDevice = devices.graphicsDevice;
        var mathDevice = devices.mathDevice;

        var width = graphicsDevice.width;
        var height = graphicsDevice.height;

        var font = this.font;
        var technique2Dparameters = this.technique2Dparameters;

        graphicsDevice.setTechnique(this.technique2D);

        technique2Dparameters.clipSpace = mathDevice.v4Build(2.0 / width, -2.0 / height, -1.0, 1.0,
                                                             technique2Dparameters.clipSpace);
        graphicsDevice.setTechniqueParameters(technique2Dparameters);

        // Draw score
        font.drawTextRect('Score: ' + game.score, {
                rect : [10, 10, (width * 0.5) - 10, 32],
                scale : 1.0,
                spacing : 0,
                alignment : 0
            });

        font.drawTextRect('Kills: ' + game.kills, {
                rect : [(width * 0.5), 10, (width * 0.5) - 10, 32],
                scale : 1.0,
                spacing : 0,
                alignment : 2
            });

        // Draw dead info
        if (game.currentState === game.state.DEAD)
        {
            font.drawTextRect('DEAD', {
                    rect : [0, 20, (width - 10), 32],
                    scale : 1.5,
                    spacing : 0,
                    alignment : 1
                });

            font.drawTextRect('Press SPACE to continue', {
                    rect : [0, 84, (width - 10), 32],
                    scale : 1.0,
                    spacing : 0,
                    alignment : 1
                });
        }

        // Draw connection and host status flags
        if (!this.multiplayerSession)
        {
            font.drawTextRect('No multiplayer servers. Playing solo!', {
                    rect : [0, (height - 32), (width - 10), 32],
                    scale : 0.5,
                    spacing : 0,
                    alignment : 1
                });
        }
        else
        {
            if (this.isHost)
            {
                graphicsDevice.setScissor((width - 6), 2, 4, 4);
                graphicsDevice.clear([1, 0, 0, 1]);
                graphicsDevice.setScissor(0, 0, width, height);
            }

            if (!this.multiplayerSession.connected())
            {
                font.drawTextRect('Connection lost!', {
                        rect : [0, (height - 32), (width - 10), 32],
                        scale : 0.5,
                        spacing : 0,
                        alignment : 1
                    });
            }
        }
    },

    // Checks for shading language support
    hasShaderSupport : function hasShaderSupportFn()
    {
        //var graphicsDevice = this.devices.graphicsDevice;

        //if (!graphicsDevice.shadingLanguageVersion)
        //{
        //    this.errorCallback("No shading language support detected.\nPlease check your graphics drivers are up

//to date.");
        //    graphicsDevice = null;
        //    return false;
        //}
        return true;
    },

    // Create the device interfaces required
    createDevices : function createDevicesFn()
    {
        var devices = this.devices;
        var managers = this.managers;
        var errorCallback = this.errorCallback;

        //var graphicsDeviceParameters = { multisample: 4 };
        //var graphicsDevice = TurbulenzEngine.createGraphicsDevice(graphicsDeviceParameters);

        var mathDeviceParameters = {};
        var mathDevice = TurbulenzEngine.createMathDevice(mathDeviceParameters);

        var inputDeviceParameters = {};
        var inputDevice = TurbulenzEngine.createInputDevice(inputDeviceParameters);

        var networkDeviceParameters = {};
        var networkDevice = TurbulenzEngine.createNetworkDevice(networkDeviceParameters);

        var soundDeviceParameters = {linearDistance : false};
        var soundDevice = TurbulenzEngine.createSoundDevice(soundDeviceParameters);

        //devices.graphicsDevice = graphicsDevice;
        devices.mathDevice = mathDevice;
        devices.inputDevice = inputDevice;
        devices.networkDevice = networkDevice;
        devices.soundDevice = soundDevice;

        var requestHandlerParameters = {};
        var requestHandler = RequestHandler.create(requestHandlerParameters);
        this.requestHandler = requestHandler;

        //managers.textureManager = TextureManager.create(graphicsDevice, requestHandler, null, errorCallback);
        //managers.shaderManager = ShaderManager.create(graphicsDevice, requestHandler, null, errorCallback);
        //managers.effectManager = EffectManager.create(graphicsDevice, mathDevice, managers.shaderManager, null,

//errorCallback);
        //managers.fontManager = FontManager.create(graphicsDevice, requestHandler, null, errorCallback);


        this.canvas = TurbulenzEngine.canvas;
        this.canvas2dContext = this.canvas.getContext('2d');




        return true;
    },

    // Calls functions in order
    enterCallbackChain : function enterCallbackChainFn(context, functions)
    {
        var length = functions.length;
        var localCallback;
        var callNextFunction;

        // Invariant: currentFunction always refers to the last uncalled function
        var currentFunction = -1;

        // Invariant: activeCallbacks refers to the number of functions whose callbacks have not yet been received
        var activeCallbacks = 0;

        callNextFunction = function callNextFunctionFn()
        {
            currentFunction += 1;

            if (!functions[currentFunction].noCallback)
            {
                activeCallbacks += 1;
            }

            functions[currentFunction].func.call(context, localCallback, arguments);
        };

        localCallback = function localCallbackFn()
        {
            activeCallbacks -= 1;

            // If no callbacks are left then call functions consecutively until dependent (or blocker) function is seen
            if (activeCallbacks === 0 &&
                currentFunction < (length - 1))
            {
                // No active callbacks so immediately call next function
                callNextFunction();

                // Call functions until we hit a dependent (blocking) function
                while (currentFunction < (length - 1) &&
                       ((0 === activeCallbacks) || (!functions[currentFunction].isDependent)))
                {
                    callNextFunction();
                }
            }
        };

        // Start the async callback chain
        callNextFunction();
    },

    createGameSounds : function createGameSoundsFn()
    {
      var devices = this.devices;
      var soundDevice = devices.soundDevice;
      var app = this;

      // Create a sound source for each object (different pitch)
      this.backgroundSoundSource = soundDevice.createSource({
          position : [0,0,0],
          relative : false,
          pitch : 1.0
      });
      var backgroundSoundSource = this.backgroundSoundSource;

      this.playerOneSoundSource = soundDevice.createSource({
          position : [0,0,0],
          relative : false,
          pitch : 1.0
      });
      this.playerTwoSoundSource = soundDevice.createSource({
          position : [0,0,0],
          relative : false,
          pitch : 1.0
      });


      // Create the sound for the source to emit

      soundDevice.createSound({
        src: this.mappingTable.getURL("sounds/TitleMusic.mp3"),
        onload : function (sound)
        {
          if (sound)
          {
            app.soundTitleMusic = sound;
            backgroundSoundSource.play(app.soundTitleMusic);
          } else {
            console.log('Failed to load sounds');
          }
        }
      });

      soundDevice.createSound({
        src: this.mappingTable.getURL("sounds/MainGameMusic.mp3"),
        onload : function (sound)
        {
          if (sound)
          {
//            backgroundSoundSource.play(sound);
            app.soundMainMusic = sound;
          } else {
            console.log('Failed to load sounds');
          }
        }
      });

      soundDevice.createSound({
        src: this.mappingTable.getURL("sounds/BubbleDown.mp3"),
        onload : function (sound)
        {
          if (sound)
          {
            app.soundBubbleDown = sound;
          } else {
            console.log('Failed to load sounds');
          }
        }
      });

      soundDevice.createSound({
        src: this.mappingTable.getURL("sounds/BubbleUp.mp3"),
        onload : function (sound)
        {
          if (sound)
          {
            app.soundBubbleUp = sound;
          } else {
            console.log('Failed to load sounds');
          }
        }
      });

      soundDevice.createSound({
        src: this.mappingTable.getURL("sounds/Loser.mp3"),
        onload : function (sound)
        {
          if (sound)
          {
            app.soundLooser = sound;
          } else {
            console.log('Failed to load sounds');
          }
        }
      });

      soundDevice.createSound({
        src: this.mappingTable.getURL("sounds/Winner.mp3"),
        onload : function (sound)
        {
          if (sound)
          {
            app.soundWinner = sound;
          } else {
            console.log('Failed to load sounds');
          }
        }
      });

      soundDevice.createSound({
        src: this.mappingTable.getURL("sounds/ScoreScreen.mp3"),
        onload : function (sound)
        {
          if (sound)
          {
            app.soundScoreScreen = sound;
          } else {
            console.log('Failed to load sounds');
          }
        }
      });


    },


    // Creates the game with the settings provided
    createGame : function createGameFn()
    {
        var devices = this.devices;
        var inputDevice = devices.inputDevice;

        this.game = Game.create(this.gameSettings,
                                devices.graphicsDevice,
                                this.gameSession,
                                this.leaderboards,
                                this.badges,
                                inputDevice.keyCodes,
                                inputDevice.mouseCodes);

        this.createInputDeviceCallbacks();
    },

    // Adds onKeyDown functions to inputDevice
    createInputDeviceCallbacks : function createInputDeviceCallbacksFn()
    {
        var game = this.game;
        var socket = this.socket;
        var inputDevice = this.devices.inputDevice;
        var app = this;

        // Closure for keyDown callback
        function onKeyDown(keynum)
        {
            game.onKeyDown(keynum);
            switch (keynum) {
              case 200: // Left
                var coordinates = { x: 1, y: 1 };
                socket.emit('move', coordinates);
                break;
              case 201: // Right
                var coordinates = { x: 2, y: 2 };
                socket.emit('move', coordinates);
                break;
              case 202: // Up
                if (app.playerOneSoundSource)
                  app.playerOneSoundSource.play(app.soundBubbleUp);
                var coordinates = { x: 3, y: 3 };
                socket.emit('move', coordinates);
                break;
              case 203: // Down
                if (app.playerTwoSoundSource)
                  app.playerTwoSoundSource.play(app.soundBubbleDown);
                var coordinates = { x: 4, y: 4 };
                socket.emit('move', coordinates);
                break;
              default:
                console.log('Unknown keynum:' +keynum);
                break;
            }
        }

        function onMouseDown(keynum)
        {
        	console.log("onMouseDown");
          //game.onMouseDown(keynum);
        }

        inputDevice.addEventListener('keydown', onKeyDown);
        inputDevice.addEventListener('mousedown', this.onPlayerTouch.bind(this));
    },

    // Create GameLeaderboards
    createGameLeaderboards : function createGameLeaderboardsFn(callback)
    {
        this.leaderboards = GameLeaderboards.create(this.leaderboardManager, callback);
    },

    // Create GameBadges
    createGameBadges : function createGameBadgesFn(callback)
    {
        this.badges = GameBadges.create(this.badgeManager, callback);
    },

    // Create HTML Writer
    createHTMLWriter : function createHTMLWriterFn()
    {
        // Must be created after badges, leaderboards, and game have been initialised
        this.htmlWriter = HtmlWriter.create(this.leaderboards, this.badges, this.game);
    },

    // Create multiplayer session
    createMultiplayerSession : function createMultiplayerSessionFn()
    {
        var that = this;

        function onMultiplayerMessage(senderID, messageType, messageData)
        {
            that.onMessage(senderID, messageType, messageData);
        }

        function onMultiplayerClose()
        {
            that.errorCallback("Connection lost!");
        }

        function createMultiplayerSessionSuccess(multiplayerSession, numplayers)
        {
            if (1 === numplayers)
            {
                that.isHost = true;
                that.game.start();
            }

            that.multiplayerSession = multiplayerSession;

            multiplayerSession.onmessage = onMultiplayerMessage;

            multiplayerSession.onclose = onMultiplayerClose;

            multiplayerSession.sendToAll(that.networkIds.joining);

            that.connectionTime = TurbulenzEngine.time;
        }

        function createMultiplayerSessionError()
        {
            that.multiplayerSession = null;
            that.isHost = true;
            that.game.badges = that.badges;
            that.game.leaderboards = that.leaderboards;
            that.game.start();
        }

        TurbulenzServices.createMultiplayerSession(this.gameSettings.maxPlayers,
                                                   this.requestHandler,
                                                   createMultiplayerSessionSuccess,
                                                   createMultiplayerSessionError);
    },

    // Create game session
    createGameSession : function createGameSessionFn(callback)
    {
        this.gameSession = TurbulenzServices.createGameSession(this.requestHandler, callback);
    },

    // Create mapping table
    createMappingTable : function createMappingTableFn(callback)
    {
        this.mappingTable = TurbulenzServices.createMappingTable(this.requestHandler, this.gameSession, callback);
    },

    // Create leaderboard manager
    createLeaderboardManager : function createLeaderboardManagerFn(callback)
    {
        var that = this;

        function createLeaderboardManagerError()
        {
            that.leaderboardManager = null;
            callback();
        }

        this.leaderboardManager = TurbulenzServices.createLeaderboardManager(this.requestHandler,
                                                                             this.gameSession,
                                                                             callback,
                                                                             createLeaderboardManagerError);
    },

    // Create badge manager
    createBadgeManager : function createBadgeManagerFn()
    {
        // Only create badge manager if leaderboardManager has been initialised successfully
        if (this.leaderboardManager)
        {
            this.badgeManager = TurbulenzServices.createBadgeManager(this.requestHandler, this.gameSession);
        }
    },

    // Starts loading scene and creates an interval to check loading progress
    enterLoadingLoop : function enterLoadingLoopFn()
    {

        var that = this;
        var managers = this.managers;
        var mappingTable = this.mappingTable;
        var urlMapping = mappingTable.urlMapping;
        var assetPrefix = mappingTable.assetPrefix;

        this.loadImages(urlMapping);
        // loadSounds

        //managers.textureManager.setPathRemapping(urlMapping, assetPrefix);
        //managers.shaderManager.setPathRemapping(urlMapping, assetPrefix);
        //managers.fontManager.setPathRemapping(urlMapping, assetPrefix);
        // sound set asset path

        this.appScene = AppScene.create(this.devices, this.managers,
                                        this.requestHandler, this.mappingTable,
                                        this.game);
        this.loadUI();

        // Enter loading state
        function localLoadingStateLoop()
        {
            return that.loadingStateLoop();
        }
        this.intervalID = TurbulenzEngine.setInterval(localLoadingStateLoop, (1000 / 10));
    },

    // Called until assets have been loaded at which point the connecting loop is entered
    loadingStateLoop : function loadingStateLoopFn()
    {
        var that = this;

        function localConnectingStateLoop()
        {
            return that.connectingStateLoop();
        }

        // If everything has finished loading/initialising
        if (this.appScene.hasLoaded() &&
            this.hasUILoaded() /* && sound manager loaded, wait till sounds loaded is zero */ )
        {
            TurbulenzEngine.clearInterval(this.intervalID);

            this.createMultiplayerSession();

            this.intervalID = TurbulenzEngine.setInterval(localConnectingStateLoop, (1000 / 10));
        }
    },

    // Called until connected to the multiplayer session at which point the main loop is entered
    connectingStateLoop : function connectingStateLoopFn()
    {
        var that = this;

        function localMainStateLoop()
        {
            return that.mainStateLoop();
        }

        this.devices.networkDevice.update();

        // If joined game
        if (this.game.myWormIndex >= 0)
        {
            TurbulenzEngine.clearInterval(this.intervalID);

            this.appScene.setupScene();

            this.intervalID = TurbulenzEngine.setInterval(localMainStateLoop, (1000 / 60));
        }
        else
        {
            // If connected to session
            if (this.multiplayerSession)
            {
                var currentTime = TurbulenzEngine.time;
                var connectionTime = this.connectionTime;
                var staleTime = this.staleTime;
                if ((connectionTime + staleTime) < currentTime)
                {
                    this.isHost = true;
                    this.game.start();
                }
                else if ((connectionTime + (staleTime * 0.5)) < currentTime)
                {
                    // Keep requesting to join to avoid problems when starting in the middle of a host transition
                    this.multiplayerSession.sendToAll(this.networkIds.joining);
                }
            }
        }
    },

    mainStateLoop : function mainStateLoopFn()
    {
        var currentTime = TurbulenzEngine.time;
        if (this.update(currentTime))
        {
            this.render(currentTime);
        }
    },

    onMessage : function onMessageFn(senderID, messageType, messageData)
    {
        //Utilities.log(senderID, messageType, messageData);
        var networkIds = this.networkIds;

        switch (messageType)
        {
        case networkIds.joining:
            this.onJoiningMessage(senderID);
            break;

        case networkIds.update:
            this.onUpdateMessage(senderID, messageData);
            break;

        case networkIds.leaving:
            this.onLeavingMessage(senderID);
            break;
        }
    },

    onJoiningMessage : function onJoiningMessageFn(senderID)
    {
        var multiplayerSession = this.multiplayerSession;
        var myID = multiplayerSession.playerId;
        var networkIds = this.networkIds;
        var theOthers = this.others;
        var other = theOthers[senderID];
        var game = this.game;
        var updateData, others, n, otherID, wormIndex;

        var time = TurbulenzEngine.time;

        if (other === undefined)
        {
            if (!this.isHost)
            {
                return;
            }

            var maxPlayers = this.gameSettings.maxPlayers;

            wormIndex = game.myWormIndex;

            var usedWormIndex = {};
            usedWormIndex[wormIndex] = true;

            others = {};
            others[myID] = wormIndex;
            for (otherID in theOthers)
            {
                if (theOthers.hasOwnProperty(otherID))
                {
                    var another = theOthers[otherID];
                    wormIndex = another.wormIndex;
                    usedWormIndex[wormIndex] = true;
                    others[otherID] = wormIndex;
                }
            }

            for (n = 0; n < maxPlayers; n += 1)
            {
                if (!usedWormIndex[n])
                {
                    theOthers[senderID] = {
                        wormIndex: n,
                        heartbeat: time
                    };

                    others[senderID] = n;

                    //Utilities.log('New player wormIndex: ' + n);

                    break;
                }
            }

            updateData = {
                frame: this.frameCounter,
                others: others,
                host: true
            };

            game.serialize(updateData);

            multiplayerSession.sendTo(senderID, networkIds.update, JSON.stringify(updateData));
        }
    },

    onUpdateMessage : function onUpdateMessageFn(senderID, messageData)
    {
        var multiplayerSession = this.multiplayerSession;
        var myID = multiplayerSession.playerId;
        var networkIds = this.networkIds;
        var theOthers = this.others;
        var other = theOthers[senderID];
        var game = this.game;
        var updateData, others, otherID, wormIndex;

        var time = TurbulenzEngine.time;

        if (other !== undefined)
        {
            other.heartbeat = time;
        }

        if (messageData)
        {
            updateData = JSON.parse(messageData);
            if (updateData)
            {
                others = updateData.others;
                if (others !== undefined)
                {
                    for (otherID in others)
                    {
                        if (others.hasOwnProperty(otherID))
                        {
                            wormIndex = others[otherID];

                            if (otherID === myID)
                            {
                                if (game.myWormIndex < 0)
                                {
                                    this.frameCounter = updateData.frame;
                                }
                                game.myWormIndex = wormIndex;
                            }
                            else
                            {
                                var another = theOthers[otherID];
                                if (another === undefined)
                                {
                                    theOthers[otherID] = another = {};
                                }
                                another.wormIndex = wormIndex;
                                another.heartbeat = time;
                            }
                        }
                    }
                }

                if (updateData.host)
                {
                    // Check for host conflict
                    if (this.isHost)
                    {
                        if (myID > senderID)
                        {
                            // This instance should not be the host
                            this.isHost = false;
                            game.myWormIndex = -1;
                            multiplayerSession.sendTo(senderID, networkIds.leaving);
                            multiplayerSession.sendTo(senderID, networkIds.joining);
                        }
                        return;
                    }

                    if (other !== undefined)
                    {
                        other.host = true;
                    }

                    this.hostFrameCounter = updateData.frame;
                }

                if (game.deserialize(this.isHost, updateData))
                {
                    this.needToRender = true;
                }
            }
        }
    },

    onLeavingMessage : function onLeavingMessageFn(senderID)
    {
        var theOthers = this.others;
        var other = theOthers[senderID];
        var game = this.game;

        if (other !== undefined)
        {
            if (this.isHost)
            {
                delete theOthers[senderID];
                game.placeWorm(other.wormIndex);
            }
            else if (other.host)
            {
                // it would be cleared out later by checkOthers
                other.host = false;
                other.heartbeat = 0;
            }
        }
    },



    // Migrate host to player with lower index
    migrateHost : function migrateHostFn()
    {
        var myWormIndex = this.game.myWormIndex;

        var others = this.others;
        for (var otherID in others)
        {
            if (others.hasOwnProperty(otherID))
            {
                var wormIndex = others[otherID].wormIndex;
                if (wormIndex < myWormIndex)
                {
                    return;
                }
            }
        }

        // If we reach this code we should be the host
        this.isHost = true;

        //window.alert("You have become the host of the game!");
    },

    // Check state of others
    checkOthers : function checkOthersFn()
    {
        var staleTime = (TurbulenzEngine.time - this.staleTime);
        var others = this.others;
        var needToMigrate = (!this.isHost);
        var staleWorms = [];
        var numStale = 0;
        var other;

        for (var otherID in others)
        {
            if (others.hasOwnProperty(otherID))
            {
                other = others[otherID];
                if (other.heartbeat < staleTime)
                {
                    staleWorms[numStale] = other.wormIndex;
                    numStale += 1;

                    delete others[otherID];
                }
                else if (other.host)
                {
                    needToMigrate = false;
                }
            }
        }

        if (needToMigrate)
        {
            this.migrateHost();
        }

        if (0 < numStale)
        {
            if (this.isHost)
            {
                var game = this.game;
                var n = 0;
                do
                {
                    game.placeWorm(staleWorms[n]);
                    n += 1;
                }
                while (n < numStale);
            }
        }
    },

    // Attempts to free memory - called from onbeforeunload and/or TurbulenzEngine.onUnload
    shutdown : function shutdownFn()
    {
        if (!this.hasShutdown)
        {
            this.hasShutdown = true;

            TurbulenzEngine.clearInterval(this.intervalID);

            // Leave the multiplayer session
            var multiplayerSession = this.multiplayerSession;
            if (multiplayerSession)
            {
                multiplayerSession.sendToAll(this.networkIds.leaving);

                multiplayerSession.destroy();
            }

            // Tell the Turbulenz Services that the game session is over
            this.gameSession.destroy();

            // Destroy vars in reverse order from creation
            this.technique2Dparameters = null;
            this.technique2D = null;
            this.font = null;
            this.others = null;
            this.managers = null;
            this.devices = null;
            this.game = null;
            this.appScene = null;
            this.htmlWriter = null;
            this.multiplayerSession = null;
            this.badges = null;
            this.leaderboards = null;
            this.badgeManager = null;
            this.leaderBoardManager = null;
            this.gameSession = null;
            this.previousGameUpdateTime = null;
            this.runInEngine = null;

            // Attempt to force clearing of the garbage collector
            TurbulenzEngine.flush();

            // Clear native engine references
            this.devices = null;
        }
    },

    onPlayerTouch : function onPlayerTouch(ignored, x, y) {
      console.log("touch: " + x + ", " + y);
      this.watair.movePlayerTo((x - 16) / this.scaleX, (y - 16) / this.scaleY);
      this.socket.emit('move', { x: x, y: y });
    }

};

// Application constructor function
Application.create = function applicationCreateFn(runInEngine)
{
    var application = new Application();

    // Ensures shutdown function is only called once
    application.hasShutDown = false;
    application.runInEngine = runInEngine;

    application.previousGameUpdateTime = 0;
    application.gameSession = {};
    application.multiplayerSession = null;
    application.leaderboardManager = null;
    application.badgeManager = null;
    application.leaderboards = {};
    application.badges = {};
    application.htmlWriter = {};
    application.appScene = {};
    application.game = {};
    application.devices = {};
    application.managers = {};
    application.others = {};
    application.isHost = false;
    application.connectionTime = 0;
    application.frameCounter = 0;
    application.hostFrameCounter = 0;
    application.needToRender = true;

    // UI
    application.font = null;
    application.technique2D = null;
    application.technique2Dparameters = null;

    application.watair = Watair.create({}, application);

    // Disable dragging on ios
    document.ontouchmove = function(event){
        event.preventDefault();
    };

    return application;
};
