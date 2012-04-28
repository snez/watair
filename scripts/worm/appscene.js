// Copyright (c) 2011-2012 Turbulenz Limited

/*global TurbulenzEngine: false*/
/*global SimpleRendering: false*/
/*global Camera: false*/
/*global Scene: false*/
/*global SceneNode: false*/
/*global SceneLoader: false*/
/*global window: false*/

//
// AppScene - creates and stores the application scene
//
function AppScene() {}
AppScene.prototype =
{
    // Error callback - uses window alert
    errorCallback : function errorCallbackFunctionFn(msg)
    {
        window.alert(msg);
    },

    // Tests whether there are things being loaded
    hasLoaded : function hasLoadedFn()
    {
        return true;
    
        var sceneLoader = this.sceneLoader;
        if (sceneLoader)
        {
            /*if (sceneLoader.complete())
            {
                this.sceneLoader = null;

                //this.renderer.updateShader(this.managers.shaderManager);

                //this.createMaterials();

                return true;
            }
            else
            {
                return false;
            }*/
        }
        else
        {
            //return true;
        }
    },

    // Loads the cube asset
    loadCube : function loadCubeFunction()
    {
        var devices = this.devices;
        var managers = this.managers;
        var mappingTable = this.mappingTable;

        var request = function requestFn(assetName, onload)
        {
            return TurbulenzEngine.request(mappingTable.getURL(assetName), onload);
        };

        var cubeLoadingParameters =
        {
            scene : this.scene,
            append : true,
            assetPath : "models/cube.dae",
            keepLights : false,
            keepCameras : false,
            graphicsDevice : devices.graphicsDevice,
            mathDevice : devices.mathDevice,
            textureManager : managers.textureManager,
            shaderManager : managers.shaderManager,
            effectManager : managers.effectManager,
            requestHandler : this.requestHandler,
            request : request
        };

        this.sceneLoader.load(cubeLoadingParameters);
    },

    createMaterials : function createMaterialsFn()
    {
        var scene = this.scene;
        var devices = this.devices;
        var graphicsDevice = devices.graphicsDevice;
        var mathDevice = devices.mathDevice;
        var v4Build = mathDevice.v4Build;
        var managers = this.managers;
        var materials;
        var materialName;
        var material;

        // The materials we will use
        this.materials =
        {
            blueMaterial :
            {
                effect : "constant",
                meta :
                {
                    materialcolor : true
                },
                parameters :
                {
                    materialColor : v4Build.call(mathDevice, 0.0, 0.0, 1.0, 1.0)
                }
            },
            greenMaterial :
            {
                effect : "constant",
                meta :
                {
                    materialcolor : true
                },
                parameters :
                {
                    materialColor : v4Build.call(mathDevice, 0.0, 1.0, 0.0, 1.0)
                }
            },
            redMaterial :
            {
                effect : "constant",
                meta :
                {
                    materialcolor : true
                },
                parameters :
                {
                    materialColor : v4Build.call(mathDevice, 1.0, 0.0, 0.0, 1.0)
                }
            },
            grayMaterial :
            {
                effect : "constant",
                meta :
                {
                    materialcolor : true
                },
                parameters :
                {
                    materialColor : v4Build.call(mathDevice, 0.5, 0.5, 0.5, 1.0)
                }
            }
        };

        materials = this.materials;

        // Load the materials
        for (materialName in materials)
        {
            if (materials.hasOwnProperty(materialName))
            {
                material = materials[materialName];

                if (scene.loadMaterial(graphicsDevice,
                                       managers.textureManager,
                                       managers.effectManager,
                                       materialName,
                                       material))
                {
                    material.loaded = true;
                    scene.getMaterial(materialName).reference.add();
                }
                else
                {
                    this.errorCallback("Failed to load material: " + materialName);
                }
            }
        }
    },

    // Populates the scene with board and worm
    setupScene : function setupSceneFn()
    {
        // Cached vars
        var scene = this.scene;
        var gameSettings = this.game.gameSettings;
        var mathDevice = this.devices.mathDevice;
        var v3Build = mathDevice.v3Build;

        // Board dimensions
        var boardCenter = v3Build.call(mathDevice, 0, 0, 0);
        var boardSpacing = gameSettings.boardSpacing;
        var horizontalCubes = gameSettings.width;
        var verticalCubes = gameSettings.height;
        var maxPlayers = gameSettings.maxPlayers;

        this.setupCamera();

        // Create our reference cubeNode for board, worm and food
        //this.createCubeNodes(maxPlayers);

        // Setup root node and children for use in game
        //this.createNodeStructure(maxPlayers);

        //this.createBoard(boardCenter, boardSpacing, horizontalCubes, verticalCubes);

        //scene.update();
    },

    // Setup the camera
    setupCamera : function setupCamera()
    {
        var mathDevice = this.devices.mathDevice;
        var v3Build = mathDevice.v3Build;

        // Camera looks along -ive z direction towards origin - has 60 degree FOV
        var cameraPosition = v3Build.call(mathDevice, -0.5, -25.0, 25.0);
        var cameraTarget = v3Build.call(mathDevice, -0.5, 0.0, 0.0);
        var worldUp = v3Build.call(mathDevice, 0.0, 1.0, 0.0);
        var halfFov = Math.tan(30 * (Math.PI / 180));
        var camera = Camera.create(mathDevice);

        camera.recipViewWindowX = (1.0 / halfFov);
        camera.recipViewWindowY = (1.0 / halfFov);
        camera.updateProjectionMatrix();
        camera.lookAt(cameraTarget, worldUp, cameraPosition);
        camera.updateViewMatrix();

        this.camera = camera;
    },

    // Resets the worm to starting state
    resetWorm : function resetWormFn(wormIndex)
    {
        return;
        var wormNode = this.wormNodes[wormIndex];
        var wormPartsNodes = this.wormPartsNodes[wormIndex];

        var n = wormPartsNodes.length;
        while (n)
        {
            n -= 1;
            var wormPartsNode = wormPartsNodes[n];
            wormNode.removeChild(wormPartsNode);
            wormPartsNode.destroy();
        }

        wormPartsNodes.length = 0;
    },

    // Creates our reference cube node to be duplicated
    createCubeNodes : function createCubeNodeFn(maxPlayers)
    {
        // Find and get renderable out of loaded node
        var loadedCubeNode = this.scene.findNode("cube");
        var boardCubeRenderable = loadedCubeNode.renderables[0].clone();
        var wormCubeRenderable = boardCubeRenderable.clone();
        var otherWormCubeRenderable = boardCubeRenderable.clone();
        var foodCubeRenderable = boardCubeRenderable.clone();

        // Set the materials
        this.setMaterial(boardCubeRenderable, "blueMaterial");
        this.setMaterial(wormCubeRenderable, "greenMaterial");
        this.setMaterial(otherWormCubeRenderable, "grayMaterial");
        this.setMaterial(foodCubeRenderable, "redMaterial");

        var boardCubeNodeParameters =
        {
            name: "boardCube",
            dynamic: false,
            disabled: false
        };
        var wormCubeNodeParameters =
        {
            name: "wormCube",
            dynamic: true,
            disabled: false
        };
        var foodCubeNodeParameters =
        {
            name: "foodCube",
            dynamic: true,
            disabled: false
        };

        // Nodes to be used as template for board, worm, and food cubes
        var boardCubeNode = SceneNode.create(boardCubeNodeParameters);
        boardCubeNode.addRenderable(boardCubeRenderable);
        this.boardCubeNode = boardCubeNode;

        this.wormCubeRenderable = wormCubeRenderable;
        this.otherWormCubeRenderable = otherWormCubeRenderable;

        var wormCubeNode = SceneNode.create(wormCubeNodeParameters);
        this.wormCubeNode = wormCubeNode;

        var foodCubeNodes = this.foodCubeNodes;
        for (var n = 0; n < maxPlayers; n += 1)
        {
            var foodCubeNode = SceneNode.create(foodCubeNodeParameters);
            foodCubeNode.addRenderable(n === 0 ? foodCubeRenderable : foodCubeRenderable.clone());
            foodCubeNodes[n] = foodCubeNode;
        }
    },

    // Sets up the root node and children for the game
    createNodeStructure : function createNodeStructureFn(maxPlayers)
    {
        // Structure is game as root node, with board and worm as children

        var scene = this.scene;
        var gameNode;
        var boardNode;
        var wormNode;
        var loadedCubeNode;
        var gameNodeParameters =
        {
            name: "game",
            dynamic: false,
            disabled: false
        };
        var boardNodeParameters =
        {
            name: "board",
            dynamic: false,
            disabled: false
        };
        var wormNodeParameters =
        {
            name: "worm",
            dynamic: false,
            disabled: false
        };

        // Create the game, board and worm nodes
        gameNode = SceneNode.create(gameNodeParameters);
        this.gameNode = gameNode;

        boardNode = SceneNode.create(boardNodeParameters);
        this.boardNode = boardNode;
        gameNode.addChild(boardNode);

        var n;
        for (n = 0; n < maxPlayers; n += 1)
        {
            wormNode = SceneNode.create(wormNodeParameters);
            this.wormNodes[n] = wormNode;
            this.wormPartsNodes[n] = [];
            gameNode.addChild(wormNode);
        }

        var foodCubeNodes = this.foodCubeNodes;
        for (n = 0; n < maxPlayers; n += 1)
        {
            gameNode.addChild(foodCubeNodes[n]);
        }

        // Remove loaded node
        loadedCubeNode = this.scene.findNode("cube");
        scene.removeRootNode(loadedCubeNode);

        // Add game as root node
        scene.addRootNode(gameNode);
    },

    // Create the back grid to play on
    createBoard : function createBoardFn(boardCenter, boardSpacing, horizontalCubes, verticalCubes)
    {
        // Cached vars
        var mathDevice = this.devices.mathDevice;
        var m43BuildTranslation = mathDevice.m43BuildTranslation;

        var boardNode = this.boardNode;
        var boardCubeNode = this.boardCubeNode;
        var boardWidth = (horizontalCubes * boardSpacing);
        var boardHeight = (verticalCubes * boardSpacing);
        var minX = (boardCenter[0] - (boardWidth / 2));
        var minY = (boardCenter[1] - (boardHeight / 2));
        var z = boardCenter[2];

        var i, j;
        var x, y;
        var newCubeNode, local;

        x = minX;
        for (i = 0; i < horizontalCubes; i += 1)
        {
            y = minY;
            for (j = 0; j < verticalCubes; j += 1)
            {
                // Create new node, position it, and add to scene
                newCubeNode = boardCubeNode.clone();
                boardNode.addChild(newCubeNode);

                // Reset node transform
                local = newCubeNode.getLocalTransform();

                m43BuildTranslation.call(mathDevice, x, y, z, local);

                newCubeNode.setLocalTransform(local);

                y += boardSpacing;
            }

            x += boardSpacing;
        }
    },

    // Update function - called every frame
    update : function updateFn()
    {
        //this.updateGameScene();
        //this.updateCamera();
    },

    // Updates the camera
    updateCamera : function updateCameraFn()
    {
        var camera = this.camera;
        var graphicsDevice = this.devices.graphicsDevice;
        var deviceWidth = graphicsDevice.width;
        var deviceHeight = graphicsDevice.height;
        var aspectRatio = (deviceWidth / deviceHeight);

        // Adjust camera if aspect ratio has changed
        if (aspectRatio !== camera.aspectRatio)
        {
            camera.aspectRatio = aspectRatio;
            camera.updateProjectionMatrix();
        }
        camera.updateViewProjectionMatrix();
    },

    // Updates the worm node
    updateGameScene : function updateGameSceneFn()
    {
        var game = this.game;
        var state = game.state;
        var currentState = game.currentState;

        if (currentState === state.DEAD)
        {
            if (this.previousGameState !== currentState)
            {
                this.clearColor = this.devices.mathDevice.v4Build(1, 0, 0, 1, this.clearColor);
            }
            else
            {
                return;
            }
        }
        else if (currentState === state.PLAY)
        {
            if (this.previousGameState !== currentState)
            {
                this.resetWorm(game.myWormIndex);

                this.scene.update();

                this.clearColor = this.devices.mathDevice.v4Build(0, 0, 0, 1, this.clearColor);
            }
        }

        this.previousGameState = currentState;

        this.updateTransforms();
    },

    // Updates the local transforms of the worm part nodes
    moveWormNodes : function moveWormNodesFn(wormIndex)
    {
        var mathDevice = this.devices.mathDevice;
        var m43BuildTranslation = mathDevice.m43BuildTranslation;
        var game = this.game;
        var gameSettings = game.gameSettings;
        var boardSpacing = gameSettings.boardSpacing;
        var offsetX = (gameSettings.width  / 2);
        var offsetY = (gameSettings.height / 2);

        var worm = game.getWorm(wormIndex);
        var partsPositionX = worm.partsPositionX;
        var partsPositionY = worm.partsPositionY;
        var numParts = partsPositionX.length;

        var wormPartNodes = this.wormPartsNodes[wormIndex];
        var numWormPartNodes = wormPartNodes.length;
        var i;

        if (numParts < numWormPartNodes)
        {
            this.resetWorm(wormIndex);
            numWormPartNodes = 0;
        }

        if (numWormPartNodes < numParts)
        {
            var isOther = (wormIndex !== game.myWormIndex);
            var wormNode = this.wormNodes[wormIndex];
            var wormCubeNode = this.wormCubeNode;
            for (i = numWormPartNodes; i < numParts; i += 1)
            {
                var newWormCubeNode = wormCubeNode.clone();
                if (isOther)
                {
                    newWormCubeNode.addRenderable(this.otherWormCubeRenderable.clone());
                }
                else
                {
                    newWormCubeNode.addRenderable(this.wormCubeRenderable.clone());
                }
                wormNode.addChild(newWormCubeNode);
                wormPartNodes.push(newWormCubeNode);
            }
        }

        for (i = 0; i < numParts; i += 1)
        {
            var wormPartNode = wormPartNodes[i];

            var local = wormPartNode.getLocalTransform();

            m43BuildTranslation.call(mathDevice, (partsPositionX[i] - offsetX) * boardSpacing,
                                                 (partsPositionY[i] - offsetY) * boardSpacing,
                                                 1,
                                                 local);

            wormPartNode.setLocalTransform(local);
        }
    },

    // Update scene from game
    updateTransforms : function updateTransformsFn()
    {
        var mathDevice = this.devices.mathDevice;
        var game = this.game;
        var gameSettings = game.gameSettings;
        var boardSpacing = gameSettings.boardSpacing;
        var offsetX = (gameSettings.width  / 2);
        var offsetY = (gameSettings.height / 2);
        var maxPlayers = gameSettings.maxPlayers;
        var foodCubeNodes = this.foodCubeNodes;
        var local;

        for (var n = 0; n < maxPlayers; n += 1)
        {
            // Food
            var food = game.getFood(n);

            var foodCubeNode = foodCubeNodes[n];

            local = foodCubeNode.getLocalTransform();

            mathDevice.m43BuildTranslation((food.x - offsetX) * boardSpacing,
                                           (food.y - offsetY) * boardSpacing,
                                           1,
                                           local);

            foodCubeNode.setLocalTransform(local);

            // Worm
            this.moveWormNodes(n);
        }

        this.scene.update();
    },

    // Sets node renderable with material specified
    setMaterial : function setMaterial(renderable, materialName)
    {
        var material;

        if (renderable)
        {
            material = this.materials[materialName];
            if (material && material.loaded)
            {
                renderable.setMaterial(this.scene.getMaterial(materialName));
            }
        }
    }
};

// AppScene constructor function
AppScene.create = function appSceneCreateFn(devices, managers, requestHandler, mappingTable, game)
{
    var mathDevice = devices.mathDevice;

    var appScene = new AppScene();

    appScene.renderer = null;
    appScene.materials = {};
    appScene.devices = devices;
    appScene.requestHandler = requestHandler;
    appScene.managers = managers;
    appScene.mappingTable = mappingTable;
    appScene.game = game;
    appScene.previousGameState = null;
    appScene.gameNode = {};
    appScene.boardNode = {};
    appScene.wormNodes = [];
    appScene.boardCubeNode = {};
    appScene.wormCubeNode = {};
    appScene.foodCubeNodes = [];
    appScene.camera = {};
    appScene.scene = Scene.create(devices.mathDevice);
    appScene.sceneLoader = SceneLoader.create();
    appScene.clearColor = mathDevice.v4Build(0, 0, 0, 1);

    // Stores references to worm parts for setting local transforms quickly
    appScene.wormPartsNodes = [];

    // Load the scene
    var v3Build = mathDevice.v3Build;
    var globalLightPosition = v3Build.call(mathDevice, 20.0, 0.0, 100.0);
    var ambientColor = v3Build.call(mathDevice, 0.3, 0.3, 0.4);

    /*var renderer = SimpleRendering.create(devices.graphicsDevice,
                                          mathDevice,
                                          managers.shaderManager,
                                          managers.effectManager);

    appScene.renderer = renderer;

    renderer.setGlobalLightPosition(globalLightPosition);
    renderer.setAmbientColor(ambientColor);*/

    //appScene.loadCube();

    return appScene;
};
