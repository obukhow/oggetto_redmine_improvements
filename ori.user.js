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
// @version     1.0.2
// @resource    select2_CSS  http://cdnjs.cloudflare.com/ajax/libs/select2/3.4.8/select2.css
// @resource    bootstrap_CSS http://netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css
// @grant       GM_addStyle
// @grant       GM_getResourceText
// ==/UserScript==
var select2_CssSrc = GM_getResourceText ("select2_CSS");
var bootstrap_CssSrc = GM_getResourceText ("bootstrap_CSS");
GM_addStyle (select2_CssSrc);
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
    'TRACKER'         : $('#issue_tracker_id'),
    'SUBJECT'         : $('#issue_subject'),
    'PRIORITY'        : $('#issue_priority_id'),
    'PARENT'          : $('#issue_parent_issue_id'),
    'ESTIMATE'        : $('#issue_estimated_hours'),
    'VERSION'         : $('#issue_fixed_version_id'),
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
var myUserLink = $('#loggedas a').attr('href');
var myID = myUserLink.match(/(\d*)$/i)[0];
var issueID = location.pathname.match(/(\d*)$/i);
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
    if ($('.manage-issue-buttons').length == 0) {
        $('<div class="contextual manage-issue-buttons btn-group"></div>').insertAfter($buttonsContainer);
    }
    $('.manage-issue-buttons').append('<a class="btn '+ className +'" onclick="' + action + '; return false;" href="#">' + iconHtml + '' + text + '</a>');
}

/**
 * Can start progress flag
 *
 * @returns {boolean}
 */
function canStartProgress() {
    return (currentStatus == STATUS.NEW.TEXT ||
        currentStatus == STATUS.FEEDBACK.TEXT ||
        currentStatus == STATUS.REVIEW_FAILED.TEXT ||
        currentStatus == STATUS.VERIFY_FAILED.TEXT ||
        currentStatus == STATUS.FROZEN.TEXT);
}

/**
 * Start issue progress
 */
unsafeWindow.startProgress = function() {
    FIELDS.STATUS.val(STATUS.IN_PROGRESS.VALUE);
    $('#issue-form').submit();
}

/**
 * Resolve issue
 */
unsafeWindow.resolveIssue = function() {
    FIELDS.STATUS.val(STATUS.RESOLVED.VALUE);
    FIELDS.TRACKER.parent().hide();
    FIELDS.SUBJECT.parent().hide();
    FIELDS.PRIORITY.parent().hide();
    FIELDS.VERSION.parent().hide();
    FIELDS.PARENT.parent().hide();
    FIELDS.ESTIMATE.parent().hide();
    $('#attachments_fields').parents('fieldset').hide();
    $('#update').show();
    $('#update h3').hide();
    $('.form-preview-btn').hide();
    unsafeWindow.jQuery.fancybox({
        'type': 'inline',
        'content': '#update',
        'autoScale': false,
        'autoDimensions': false,
        'width':'800',
        'height': '700',
        'onClosed': function() {
            FIELDS.TRACKER.parent().show();
            FIELDS.SUBJECT.parent().show();
            FIELDS.PRIORITY.parent().show();
            FIELDS.VERSION.parent().show();
            FIELDS.PARENT.parent().show();
            FIELDS.ESTIMATE.parent().show();
            $('#attachments_fields').parents('fieldset').show();
            $('#update').hide();
            $('.form-preview-btn').show();
            $('#update h3').show();
        }
    });
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
$('a.icon-edit').prepend('<span class="glyphicon glyphicon-pencil"></span> ').append('…');
$('a.icon-time-add').prepend('<span class="glyphicon glyphicon-time"></span> ');
$('a.icon-fav-off').prepend('<span class="glyphicon glyphicon-eye-open"></span> ');
$('#issue-form input[type=submit]').addClass('btn btn-success form-submit-btn');
$('#issue-form input[type=submit]').next().addClass('btn btn-primary form-preview-btn').prepend('<span class="glyphicon glyphicon-eye-open"></span> ');

//add buttons

if (isAssignedToMe) {
    if (canStartProgress()) {
        addButton('Start Progress', 'startProgress()', 'btn-success', 'glyphicon-play-circle');
    } else if (currentStatus == STATUS.IN_PROGRESS.TEXT){
        addButton('Resolve…', 'resolveIssue()', 'btn-success', 'glyphicon glyphicon-ok');
        addButton('Froze', 'frozeProgress()', 'btn-primary', 'glyphicon-pause');
    }
} else {
    addButton('Assign To Me', 'assignToMe()', 'btn-primary', 'glyphicon-user');
}


