// Copyright (c) 2010-2011 Turbulenz Limited

/*
  Player profile
*/
function PlayerProfile() {}
PlayerProfile.prototype =
{
    version : 1
};

PlayerProfile.create = function playerProfileCreateFn(gameName, onready)
{
    var settings;
    var achievements;
    var statistics;
    var savedgames;
    var profileURL = ("/api/games/" + gameName + "/");
    var savedgamesURL = ("/api/savedgames/");

    var pp = new PlayerProfile();

    var dataRequested = 0;

    function requestSaveGamesListFn()
    {
        dataRequested += 1;

        var xhr;
        if (window.XMLHttpRequest)
        {
            xhr = new window.XMLHttpRequest();
        }
        else if (window.ActiveXObject)
        {
            xhr = new window.ActiveXObject("Microsoft.XMLHTTP");
        }

        function savedgameslistFn()
        {
            if (xhr.readyState === 4) /* complete */
            {
                if (xhr.status === 200)
                {
                    var savedGamesList = JSON.parse(xhr.responseText);
                    if (savedGamesList)
                    {
                        savedgames = savedGamesList.savedgames;
                    }
                }

                dataRequested -= 1;
                if (0 === dataRequested)
                {
                    onready();
                }
            }
        }

        xhr.open("GET", (savedgamesURL + "list"), true);
        xhr.onreadystatechange = savedgameslistFn;
        xhr.send();
    }

    requestSaveGamesListFn();

    pp.getSavedGame = function getSavedGameFn(slot)
    {
        if (0 <= slot)
        {
            return savedgames[slot];
        }
        else
        {
            return undefined;
        }
    };

    pp.setSavedGame = function setSavedGameFn(savedgameinfo)
    {
        var slot = savedgameinfo.slot;
        if (0 > slot)
        {
            return false;
        }

        var onsaved = savedgameinfo.onsaved;
        var savedGame = {
                date: (new Date()).toString(),
                location: savedgameinfo.location,
                description: savedgameinfo.description,
                thumbnail: savedgameinfo.thumbnail,
                gamestate: JSON.stringify(savedgameinfo.gamestate)
            };

        var xhr;
        if (window.XMLHttpRequest)
        {
            xhr = new window.XMLHttpRequest();
        }
        else if (window.ActiveXObject)
        {
            xhr = new window.ActiveXObject("Microsoft.XMLHTTP");
        }

        function onreadystatechangeFn()
        {
            if (xhr.readyState === 4) /* complete */
            {
                if (xhr.status === 200)
                {
                    var savedGame = JSON.parse(xhr.responseText);
                    if (savedGame)
                    {
                        savedgames[slot] = savedGame;

                        onsaved(savedGame);
                    }
                    else
                    {
                        onsaved(null);
                    }
                }
                else
                {
                    onsaved(null);
                }
            }
        }

        xhr.open("POST", (savedgamesURL + slot), true);
        xhr.onreadystatechange = onreadystatechangeFn;
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(savedGame));

        return true;
    };

    pp.deleteSavedGame = function deleteSavedGameFn(slot)
    {
        if (0 > slot)
        {
            return false;
        }

        var xhr;
        if (window.XMLHttpRequest)
        {
            xhr = new window.XMLHttpRequest();
        }
        else if (window.ActiveXObject)
        {
            xhr = new window.ActiveXObject("Microsoft.XMLHTTP");
        }

        xhr.open("POST", (savedgamesURL + slot + "/delete"), true);
        xhr.send();

        return true;
    };

    pp.release = function playerProfileReleaseFn(prm)
    {
        settings = undefined;
        achievements = undefined;
        statistics = undefined;
        savedgames = undefined;
    };

    return pp;
};
