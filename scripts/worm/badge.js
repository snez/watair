// Copyright (c) 2011-2012 Turbulenz Limited

//
// Badge: Holds the current progress for the badge
//
function Badge() {}
Badge.prototype =
{
    // Update the status of the badge before updateuserbadgeprogress is called
    onBeforeSet : function onBeforeSetFn()
    {
        this.isUpdating = true;
    },

    // After progress has been successfully set
    onSuccessfulSet : function onSuccessfulSetFn(currentProgress)
    {
        this.isUpdating = false;
        if (currentProgress >= this.currentProgress)
        {
            this.hasProgressed = false;
        }
    },

    // After progress failed to be set
    onUnsuccessfulSet : function onUnsuccessfulSet()
    {
        this.isUpdating = false;
    },

    // Adds to the progress of the badge
    addProgress : function addProgress()
    {
        this.currentProgress += 1;
        this.currentProgress = Math.min(this.totalRequired, this.currentProgress);
        this.hasProgressed = true;
    },

    // Updates the status of the badge before awardbadge is called
    award : function awardFn()
    {
        this.isUpdating = true;
    },

    // Tests if badge has been achieved
    isAchieved : function isAchievedFn()
    {
        return this.currentProgress >= this.totalRequired;
    }
};

Badge.create = function badgeCreateFn(totalRequired, description, title)
{
    var badge = new Badge();

    // If it is a progress badge
    if (!totalRequired)
    {
        badge.isNonProgress = true;
    }

    badge.currentProgress = 0;
    badge.totalRequired = totalRequired;
    badge.hasProgressed = false;

    badge.description = description;
    badge.title = title;
    badge.isUpdating = false;

    return badge;
};
