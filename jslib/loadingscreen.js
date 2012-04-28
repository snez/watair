// Copyright (c) 2009-2011 Turbulenz Limited

function LoadingScreen() {}
LoadingScreen.prototype =
{
    version : 1,

    setTexture: function setTextureFn(texture)
    {
        this.textureMaterial.diffuse = texture;
        this.textureWidthHalf  = (texture.width  * 0.5);
        this.textureHeightHalf = (texture.height * 0.5);
    }
};

// Constructor function
LoadingScreen.create = function loadingScreenCreateFn(gd, backgroundColor)
{
    var f = new LoadingScreen();
    f.backgroundColor = backgroundColor;

    var primitive = gd.PRIMITIVE_TRIANGLE_STRIP;

    var backgroundTechnique = null;
    var backgroundMaterial = gd.createTechniqueParameters();

    var textureTechnique = null;
    var textureMaterial = gd.createTechniqueParameters();
    var textureVertexFormats = [gd.VERTEXFORMAT_SHORT2, gd.VERTEXFORMAT_SHORT2];
    var textureSemantics = gd.createSemantics(['POSITION', 'TEXCOORD0']);
    var posSemantics = gd.createSemantics(['POSITION']);

    f.textureWidthHalf = 0;
    f.textureHeightHalf = 0;
    f.textureMaterial = textureMaterial;

    f.render = function loadingScreenRenderFn(backgroundAlpha, textureAlpha)
    {
        var writer;
        if (0 < backgroundAlpha)
        {
            var backgroundColor = this.backgroundColor;
            backgroundColor[3] = backgroundAlpha;

            if (backgroundAlpha >= 1)
            {
                gd.clear(backgroundColor);
            }
            else
            {
                gd.setTechnique(backgroundTechnique);

                backgroundMaterial.color = backgroundColor;
                gd.setTechniqueParameters(backgroundMaterial);

                writer = gd.beginDraw('TRIANGLE_STRIP', 4, ['SHORT2'],
                                      posSemantics);
                if (writer)
                {
                    writer(-1, -1);
                    writer(1, -1);
                    writer(-1, 1);
                    writer(1, 1);

                    gd.endDraw(writer);
                    writer = null;
                }
            }
        }

        var textureWidthHalf = this.textureWidthHalf;
        var textureHeightHalf = this.textureHeightHalf;
        if (0 < textureWidthHalf)
        {
            gd.setTechnique(textureTechnique);

            var screenWidth  = gd.width;
            var screenHeight = gd.height;
            textureMaterial.clipSpace = VMath.v4Build(2.0 / screenWidth, -2.0 / screenHeight, -1.0, 1.0);
            textureMaterial.alpha = textureAlpha;
            gd.setTechniqueParameters(textureMaterial);

            writer = gd.beginDraw(primitive, 4, textureVertexFormats,
                                  textureSemantics);
            if (writer)
            {
                var centerx = (screenWidth  * 0.5);
                var centery = (screenHeight * 0.5);
                var left   = (centerx - textureWidthHalf);
                var right  = (centerx + textureWidthHalf);
                var top    = (centery - textureHeightHalf);
                var bottom = (centery + textureHeightHalf);
                writer(left,  top,    0, 0);
                writer(right, top,    1, 0);
                writer(left,  bottom, 0, 1);
                writer(right, bottom, 1, 1);
                gd.endDraw(writer);
                writer = null;
            }
        }
    };

    /*jslint white: false*/
    var shaderParams =
    {
        "version": 1,
        "name": "loadingscreen.cgfx",
        "samplers":
        {
            "diffuse":
            {
                "MinFilter": 9729,
                "MagFilter": 9729,
                "WrapS": 10496,
                "WrapT": 10496
            }
        },
        "parameters":
        {
            "color":
            {
                "type": "float",
                "columns": 4
            },
            "clipSpace":
            {
                "type": "float",
                "columns": 4
            },
            "alpha":
            {
                "type": "float"
            },
            "diffuse":
            {
                "type": "sampler2D"
            }
        },
        "techniques":
        {
            "background":
            [
                {
                    "parameters": ["color"],
                    "semantics": ["POSITION"],
                    "states":
                    {
                        "DepthTestEnable": false,
                        "DepthMask": false,
                        "CullFaceEnable": false,
                        "BlendEnable": true,
                        "BlendFunc": [770,771]
                    },
                    "programs": ["vp_background","fp_background"]
                }
            ],
            "texture":
            [
                {
                    "parameters": ["clipSpace","alpha","diffuse"],
                    "semantics": ["POSITION","TEXCOORD0"],
                    "states":
                    {
                        "DepthTestEnable": false,
                        "DepthMask": false,
                        "CullFaceEnable": false,
                        "BlendEnable": true,
                        "BlendFunc": [770,771]
                    },
                    "programs": ["vp_texture","fp_texture"]
                }
            ]
        },
        "programs":
        {
            "fp_texture":
            {
                "type": "fragment",
                "code": "#ifdef GL_ES\nprecision mediump float;precision mediump int;\n#endif\nvarying vec4 tz_TexCoord[1];float _TMP10;float _b0015;uniform float alpha;uniform sampler2D diffuse;void main()\n{vec4 _textureColor;_textureColor=texture2D(diffuse,tz_TexCoord[0].xy);_b0015=min(1.0,alpha);_TMP10=max(0.0,_b0015);_textureColor.w=_textureColor.w*_TMP10*_TMP10*(3.0-2.0*_TMP10);gl_FragColor=_textureColor;}"
            },
            "vp_texture":
            {
                "type": "vertex",
                "code": "#ifdef GL_ES\nprecision mediump float;precision mediump int;\n#endif\nvarying vec4 tz_TexCoord[1];attribute vec4 ATTR8;attribute vec4 ATTR0;\nuniform vec4 clipSpace;void main()\n{vec4 _position;_position=ATTR0;_position.xy=ATTR0.xy*clipSpace.xy+clipSpace.zw;tz_TexCoord[0].xy=ATTR8.xy;gl_Position=_position;}"
            },
            "fp_background":
            {
                "type": "fragment",
                "code": "#ifdef GL_ES\nprecision mediump float;precision mediump int;\n#endif\nvec4 _ret_0;float _TMP9;float _b0014;uniform vec4 color;void main()\n{_b0014=min(1.0,color.w);_TMP9=max(0.0,_b0014);_ret_0=vec4(color.x,color.y,color.z,_TMP9*_TMP9*(3.0-2.0*_TMP9));gl_FragColor=_ret_0;}"
            },
            "vp_background":
            {
                "type": "vertex",
                "code": "#ifdef GL_ES\nprecision mediump float;precision mediump int;\n#endif\nattribute vec4 ATTR0;\nvoid main()\n{gl_Position=ATTR0;}"
            }
        }
    };
    /*jslint white: true*/

    var shader = gd.createShader(shaderParams);
    if (shader)
    {
        backgroundTechnique = shader.getTechnique("background");
        textureTechnique = shader.getTechnique("texture");
        return f;
    }

    return null;
};
