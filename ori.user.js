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
// @require     https://raw.githubusercontent.com/robcowie/jquery-stopwatch/master/jquery.stopwatch.js
// @version     1.1.5
// @resource    select2_CSS  http://cdnjs.cloudflare.com/ajax/libs/select2/3.4.8/select2.css
// @resource    bootstrap_CSS https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/css/bootstrap.css
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
GM_addStyle (".btn-success, .btn-primary, .btn-warning { color: #fff !important;}");
GM_addStyle ("#content h2{line-height:40px;");
GM_addStyle ("#fancybox-content .tabular p{padding-left:100px;");

// variables

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
    'DESCRIPTION'     : $('#issue_description_and_toolbar'),
    'SPENT_TIME'      : $('#time_entry_hours')
}

var isAssignedToMe = ($('#loggedas>a').attr('href') == $('td.assigned-to>a').attr('href'));
var myUserLink = $('#loggedas a').attr('href');
var myID = myUserLink.match(/(\d*)$/i)[0];
var issueID = location.pathname.match(/(\d*)$/i)[0];
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
 * is Timer started
 * @return bool
 */
function isTimerStarted()
{
    var key = issueID + '_startTime';
    return localStorage.getItem(key) !== null;
}

/**
 * Is timer shown
 */
function isTimerShown() {
    return $('.timer-btn').length > 0;
}

/**
 * Start timer
 */
function startTimer() {
    var key = issueID + '_startTime';
    if (!isTimerStarted()) {
        localStorage.setItem(key, new Date().getTime());
    }
}

/**
 * Show timer
 */
function showTimer() {
    var key = issueID + '_startTime';
    if (!isTimerStarted()) {
        return;
    }
    var pausedTime = 0;
    if (localStorage.getItem(issueID + '_pausedTime')) {
        pausedTime = parseInt(localStorage.getItem(issueID + '_pausedTime'), 10);
    } else {
        pausedTime = new Date().getTime() - parseInt(localStorage.getItem(key), 10);
    }
    addButton('<span id="timer-btn" class="timer-btn"></span>', '', 'btn-warning', 'glyphicon glyphicon-time');
    $('.timer-btn').stopwatch({
        startTime: pausedTime
    }).stopwatch('start');

}
/**
 * Get timer's time
 */
function getTimerTime() {
    if (!isTimerStarted() || !isTimerShown()) {
        return '';
    }
    var time = $('#timer-btn').stopwatch('getTime')/1000/60/60;
    return time.toFixed(2);
}

/**
 * Pause timer
 */
function pauseTimer() {
    if (!isTimerStarted() || !isTimerShown()) {
        return;
    }
    var pausedTime = 0;
    if (localStorage.getItem(issueID + '_pausedTime')) {
        pausedTime = localStorage.getItem(issueID + '_pausedTime');
    }
    pausedTime += $('#timer-btn').stopwatch('getTime');
    localStorage.setItem(issueID + '_pausedTime', pausedTime);
}

/**
 * Stop timer
 */
function stopTimer() {
    localStorage.removeItem(issueID + '_startTime');
    localStorage.removeItem(issueID + '_pausedTime');
}

/**
 * Start issue progress
 */
unsafeWindow.startProgress = function() {
    FIELDS.STATUS.val(STATUS.IN_PROGRESS.VALUE);
    $('#issue-form').submit();
    startTimer();
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
    FIELDS.SPENT_TIME.val(getTimerTime());
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
        'onComplete': function() {
                $('#issue-form').on('submit.resolve', function() {
                stopTimer();
            });
        },
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
            $('#issue-form').off('.resolve');
        }
    });
}

/**
 * Froze issue progress
 */
unsafeWindow.frozeProgress = function() {
    FIELDS.STATUS.val(STATUS.FROZEN.VALUE);
    $('#issue-form').submit();
    pauseTimer();
}

/**
 * Assign issue to me
 */
unsafeWindow.assignToMe = function() {
    FIELDS.ASSIGNEE.val(myID);
    $('#issue-form').submit();
}

/**
 * Show issue total regular time
 */
function showTotalRegularTime() {
    var url = location.origin + '/issues/' + issueID + '/time_entries?utf8=✓&f[]=spent_on&op' +
        '[spent_on]=*&f[]=cf_12&op[cf_12]=%3D&v[cf_12][]=Regular';
    $.get(url).done( function( data ) {
        $( "td.spent-time" ).append(' (R: ' + _parseRedmineHours(data) + ')' );
    });
}

/**
 * Show issue total regular time
 */
function showMyTime() {
    $('<tr><th></th><td></td>' +
        '<th class="spent-by-me">Spent by me:</th><td class="spent-by-me">loading...</td></tr>').insertAfter($('th.spent-time').parent());
    var totalHours, regularHours, fuckupHours;
    totalHours = regularHours = fuckupHours = '0';
    var url = location.origin + '/issues/' + issueID + '/time_entries?utf8=✓&f[]=spent_on' +
        '&op[spent_on]=*&f[]=user_id&op[user_id]=%3D&v[user_id][]=me';
    $.get(url).done( function( data ) {
        totalHours = _parseRedmineHours(data);
        url = location.origin + '/issues/' + issueID + '/time_entries?utf8=✓&f[]=spent_on' +
            '&op[spent_on]=*&f[]=user_id&op[user_id]=%3D&v[user_id][]=me&f[]=cf_12&op[cf_12]=%3D&v[cf_12][]=Regular';
        $.get(url).done( function( data ) {
            regularHours = _parseRedmineHours(data);
            url = location.origin + '/issues/' + issueID + '/time_entries?utf8=✓&f[]=spent_on' +
                '&op[spent_on]=*&f[]=user_id&op[user_id]=%3D&v[user_id][]=me&f[]=cf_12&op[cf_12]=%3D&v[cf_12][]=Fuc%25up';
            $.get(url).done( function( data ) {
                fuckupHours = _parseRedmineHours(data);
                $('td.spent-by-me').html(totalHours + ' hours (R: ' + regularHours + ', F: ' + fuckupHours + ')');
            });
        });
    });



}

/**
 * Parse redmine hours data
 * @param data string
 * @returns string
 * @private
 */
function _parseRedmineHours(data) {
    var content = $($.parseHTML(data)).filter('.total-hours').html();
    var result = content.match(/<span class="hours hours-int">(\d*)<\/span><span class="hours hours-dec">(\.\d*)<\/span>/i);
    return result[1] + result[2];
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
        addButton((isTimerStarted()) ? 'Continue' : 'Start Progress', 'startProgress()', 'btn-success', 'glyphicon-play-circle');
    } else if (currentStatus == STATUS.IN_PROGRESS.TEXT){
        addButton('Resolve…', 'resolveIssue()', 'btn-success', 'glyphicon glyphicon-ok');
        showTimer();
        addButton('Froze', 'frozeProgress()', 'btn-primary', 'glyphicon-pause');
    }
} else {
    addButton('Assign To Me', 'assignToMe()', 'btn-primary', 'glyphicon-user');
}


showTotalRegularTime();
showMyTime();