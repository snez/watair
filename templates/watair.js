/*{# Copyright (c) 2010-2012 Turbulenz Limited #}*/

/*{% if tz_development and not tz_canvas %}*/
/*{# Include JSON implementation for browsers without native support #}*/
/*{{ javascript("scripts/json2.js") }}*/
/*{% endif %}*/

/*{# jslib files #}*/
/*{{ javascript("jslib/aabbtree.js") }}*/
/*{{ javascript("jslib/camera.js")}}*/
/*{{ javascript("jslib/simplerendering.js") }}*/
/*{{ javascript("jslib/effectmanager.js") }}*/
/*{{ javascript("jslib/geometry.js") }}*/
/*{{ javascript("jslib/material.js") }}*/
/*{{ javascript("jslib/observer.js") }}*/
/*{{ javascript("jslib/renderingcommon.js") }}*/
/*{{ javascript("jslib/resourceloader.js") }}*/
/*{{ javascript("jslib/scene.js") }}*/
/*{{ javascript("jslib/scenenode.js") }}*/
/*{{ javascript("jslib/shadermanager.js") }}*/
/*{{ javascript("jslib/texturemanager.js") }}*/
/*{{ javascript("jslib/utilities.js") }}*/
/*{{ javascript("jslib/requesthandler.js") }}*/
/*{{ javascript("jslib/vertexbuffermanager.js") }}*/
/*{{ javascript("jslib/indexbuffermanager.js") }}*/
/*{{ javascript("jslib/vmath.js") }}*/
/*{{ javascript("jslib/services/badgemanager.js") }}*/
/*{{ javascript("jslib/services/gamesession.js") }}*/
/*{{ javascript("jslib/services/multiplayersession.js") }}*/
/*{{ javascript("jslib/services/turbulenzbridge.js") }}*/
/*{{ javascript("jslib/services/leaderboardmanager.js")}}*/
/*{{ javascript("jslib/services/mappingtable.js") }}*/
/*{{ javascript("jslib/services/turbulenzservices.js") }}*/
/*{{ javascript("jslib/services/userdatamanager.js") }}*/
/*{{ javascript("jslib/fontmanager.js") }}*/
/*{{ javascript("jslib/canvas.js") }}*/

/*{# scripts #}*/
/*{{ javascript("scripts/sceneloader.js")}}*/

/*{# watair files #}*/
/*{{ javascript("scripts/watair/watair.js") }}*/

/*{# app files #}*/
/*{{ javascript("scripts/worm/appscene.js") }}*/
/*{{ javascript("scripts/worm/badge.js")}}*/
/*{{ javascript("scripts/worm/game.js") }}*/
/*{{ javascript("scripts/worm/gamebadges.js") }}*/
/*{{ javascript("scripts/worm/gameleaderboards.js") }}*/
/*{{ javascript("scripts/worm/htmlwriter.js") }}*/
/*{{ javascript("scripts/worm/leaderboard.js")}}*/
/*{{ javascript("scripts/worm/worm.js") }}*/
/*{{ javascript("scripts/worm/wormapp.js") }}*/


/*global Application: false */

TurbulenzEngine.onload = function onloadFn()
{
    var application = Application.create(TurbulenzEngine.canvas);

    TurbulenzEngine.onunload = function onUnloadFn()
    {
        application.shutdown();
    };

    application.init();
};
