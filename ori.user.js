// ==UserScript==
// @name        Oggetto Redmine Improvements
// @description Add some useful features to Redmine's issue page
// @author      Denis Obukhov
// @namespace   obukhow.redmine
// @downloadURL https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/ori.user.js
// @updateURL   https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/ori.user.js
// @include     http://redmine.oggettoweb.com/issues/*
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/select2/3.4.8/select2.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/select2/3.4.8/select2_locale_ru.js
// @version     1.0.0
// @resource    jqUI_CSS  http://cdnjs.cloudflare.com/ajax/libs/select2/3.4.8/select2.css
// @resource    bootstrap_CSS http://netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css
// @grant       GM_addStyle
// @grant       GM_getResourceText
// ==/UserScript==
var jqUI_CssSrc = GM_getResourceText ("jqUI_CSS");
var bootstrap_CssSrc = GM_getResourceText ("bootstrap_CSS");
GM_addStyle (jqUI_CssSrc);
GM_addStyle (bootstrap_CssSrc);
GM_addStyle ("@font-face {"+
  "font-family: 'Glyphicons Halflings';"+
  "src: url('http://netdna.bootstrapcdn.com/bootstrap/3.1.1/fonts/glyphicons-halflings-regular.eot');" +
  "src: url('http://netdna.bootstrapcdn.com/bootstrap/3.1.1/fonts/glyphicons-halflings-regular.eot?#iefix') format('embedded-opentype'), url('http://netdna.bootstrapcdn.com/bootstrap/3.1.1/fonts/glyphicons-halflings-regular.woff') format('woff'), url('http://netdna.bootstrapcdn.com/bootstrap/3.1.1/fonts/glyphicons-halflings-regular.ttf') format('truetype'), url('http://netdna.bootstrapcdn.com/bootstrap/3.1.1/fonts/glyphicons-halflings-regular.svg#glyphicons_halflingsregular') format('svg');"+
"}");
GM_addStyle (".btn-success, .btn-primary { color: #fff !important;}");

//
var STATUS = {
    'NEW' : {"VALUE": 1, 'TEXT': "New"},
    'IN_PROGRESS': {"VALUE": 2, "TEXT": "In Progress"},
    'RESOLVED': {"VALUE": 3, "TEXT": "Resolved"},
    'FEEDBACK': {"VALUE": 4, "TEXT": "Feedback"},
    'FROZEN': {"VALUE": 8, "TEXT": "Frozen"},
    'REVIEW_FAILED': {"VALUE": 18, "TEXT": "Review failed"},
    'VERIFY_FAILED': {"VALUE": 17, "TEXT": "Verify failed"},
    'READY_FOR_STAGE': {"VALUE": 14, "TEXT": "Ready for Stage"}
}

var FIELDS = {
    'ACTIVITY'        : $('#time_entry_activity_id'),
    'STATUS'          : $('#issue_status_id'),
    'ASSIGNEE'        : $('#issue_assigned_to_id'),
    'TIME_TYPE'       : $('#time_entry_custom_field_values_12'),
    'ISSUE_START_DATE': $('#issue_start_date'),
    'ISSUE_DUE_DATE'  : $('#issue_due_date'),
    'ORDER'           : $('#issue_custom_field_values_16'),
    'CATEGORY_ID'     : $('#issue_category_id'),
    'TAG'             : $('#issue_custom_field_values_1'),
    'DESCRIPTION'     : $('#issue_description_and_toolbar')
}

var isAssignedToMe = ($('#loggedas>a').attr('href') == $('td.assigned-to>a').attr('href'));
var myID = $('#loggedas a').attr('href').match(/\/users\/(\d*)/i)[1];
var currentStatus = $('td.status').html();

var $buttonsContainer = $('a.icon-edit').parent();

FIELDS.ASSIGNEE.select2();

//functions

/**
 *  Add button function 
 */
function addButton(text, action, className, icon) {
    if (typeof(icon) === "undefinded") {
        var iconHtml = '';
    } else {
        var iconHtml = '<span class="glyphicon '+ icon +'"></span> ';
    }
    if (typeof(className) === "undefinded") {
        className = 'btn-default';
    }
    $('<div class="contextual"><a class="btn '+ className +'" onclick="' + action + '; return false;" href="#">' + iconHtml + '' + text + '</a></div>').insertAfter($buttonsContainer);
}

/**
 * Start issue progress
 */
unsafeWindow.startProgress = function() {
    FIELDS.STATUS.val(STATUS.IN_PROGRESS.VALUE);
    $('#issue-form').submit();
}

/**
 * Froze issue progress
 */
unsafeWindow.frozeProgress = function() {
    FIELDS.STATUS.val(STATUS.FROZEN.VALUE);
    $('#issue-form').submit();
}

/**
 * Assign issue to me
 */
unsafeWindow.assignToMe = function() {
    FIELDS.ASSIGNEE.val(myID);
    $('#issue-form').submit();
}



// set default values
FIELDS.ACTIVITY.val(12); // activity: backend development
FIELDS.TIME_TYPE.val('Regular'); //type: regular
// hide fields
FIELDS.ISSUE_START_DATE.parent().hide(); // issue start date
FIELDS.ISSUE_DUE_DATE.parent().hide(); //issue end date
FIELDS.ORDER.parent().hide(); //order
FIELDS.CATEGORY_ID.parent().hide(); // category ID
FIELDS.TAG.parent().hide(); //tag
FIELDS.DESCRIPTION.parent().hide(); //description


//change link styles

$buttonsContainer.addClass('btn-group');
$buttonsContainer.children().addClass('btn btn-default');
$('a.icon-copy').remove();
$('a.icon-edit').prepend('<span class="glyphicon glyphicon-pencil"></span> ');
$('a.icon-time-add').prepend('<span class="glyphicon glyphicon-time"></span> ');
$('a.icon-fav-off').prepend('<span class="glyphicon glyphicon-eye-open"></span> ');


//add buttons

if (isAssignedToMe) {
    if (currentStatus == STATUS.NEW.TEXT || currentStatus == STATUS.FEEDBACK.TEXT ||
        currentStatus == STATUS.REVIEW_FAILED.TEXT || currentStatus == STATUS.VERIFY_FAILED.TEXT ||
        currentStatus == STATUS.FROZEN.TEXT
    ) {
        addButton('Start Progress', 'startProgress()', 'btn-success', 'glyphicon-play-circle');
    } else if (currentStatus == STATUS.IN_PROGRESS.TEXT){
        addButton('Froze', 'frozeProgress()', 'btn-primary', 'glyphicon-pause');
    } 
} else {
    addButton('Assign To Me', 'assignToMe()', 'btn-primary', 'glyphicon-user');
}


