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
// @version     1.2.1
// @resource    select2_CSS  http://cdnjs.cloudflare.com/ajax/libs/select2/3.4.8/select2.css
// @resource    bootstrap_CSS https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/css/bootstrap.css
// @grant       unsafeWindow
// @grant       GM_getValue
// @grant       GM_setValue
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
GM_addStyle (".btn-success, .btn-primary, .btn-warning, .btn-danger { color: #fff !important;}");
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
    'SPENT_TIME'      : $('#time_entry_hours'),
    'TIME_COMMENT'    : $('#time_entry_comments'),
    'NOTES'           : $('#issue_notes'),
    'PRIVATE_NOTES'   : $('#issue_private_notes')
}

var isAssignedToMe = ($('#loggedas>a').attr('href') == $('td.assigned-to>a').attr('href'));
var myUserLink = $('#loggedas a').attr('href');
var myID = myUserLink.match(/(\d*)$/i)[0];
var issueID = location.pathname.match(/(\d*)$/i)[0];
var currentStatus = $('td.status').html();
var timeKey       = issueID + '_startTime';

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
 * Can do issue review
 */
function canDoReview() {
    if (currentStatus == STATUS.RESOLVED.TEXT) { //if issue in Resolved status
        var $a = $('.journal:last');
        if ($a.length > 0 && $a.hasClass('has-notes')) { // and last comment has text
            if ($a.find('.user').attr('href') != myUserLink) { // and comment does not belong to current user
                if ($a.find('.external').length > 0) { // and comment has external links
                    return ( $a.find('.external').attr('href') // and link href is pull request link
                        .match(/^https:\/\/github\.com\/[a-zA-Z0-9]{1,}\/[a-zA-Z0-9]{1,}\/pull\/[0-9]{1,}$/i) )
                }
            }
        }
    }
    return false;
}

/**
 * is Timer started
 * @return bool
 */
function isTimerStarted()
{
    return localStorage.getItem(timeKey) !== null;
}

/**
 * Is timer shown
 */
function isTimerShown() {
    return $('.timer-btn').length > 0;
}
/**
 * Get time diff between current time and stored time
 * @returns {number}
 */
function getTimeDiff() {
    return (new Date().getTime() - parseInt(localStorage.getItem(timeKey), 10));
}
/**
 * Start timer
 */
function startTimer() {
    var pausedKey = issueID + '_pausedTime';
    var startTime = new Date().getTime();
    if (localStorage.getItem(pausedKey)) {
        startTime -= parseInt(localStorage.getItem(pausedKey), 10);
        localStorage.removeItem(pausedKey);
    }
    localStorage.setItem(timeKey, startTime);
}

/**
 * Show timer
 */
function showTimer() {
    if (!isTimerStarted()) {
        return;
    }
    var pausedTime = getTimeDiff();

    addButton('<span id="timer-btn" class="timer-btn"></span>', 'logTimerTime()', 'btn-warning', 'glyphicon-time');
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
    var time = getTimeDiff()/1000/60/60;
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
    pausedTime += getTimeDiff();
    localStorage.setItem(issueID + '_pausedTime', pausedTime);
}

/**
 * Stop timer
 */
function stopTimer() {
    localStorage.removeItem(timeKey);
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

function formPrepareToShowInPopup() {
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
}

function formReturnToPreviousStateAfterPopupClose() {
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
    FIELDS.SPENT_TIME.val('');
    FIELDS.TIME_COMMENT.val('');
    FIELDS.PRIVATE_NOTES.prop('checked', false);
    FIELDS.NOTES.val('');
    FIELDS.ASSIGNEE.val(myID);
}
/**
 * Resolve issue
 */
unsafeWindow.resolveIssue = function() {
    FIELDS.STATUS.val(STATUS.RESOLVED.VALUE);
    formPrepareToShowInPopup();
    FIELDS.SPENT_TIME.val(getTimerTime());
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
            formReturnToPreviousStateAfterPopupClose();
            $('#issue-form').off('.resolve');
        }
    });
}

/**
 * Show review result form
 *
 * @private
 */
function _showReviewResultPopup() {
    FIELDS.SPENT_TIME.val('0.1');
    FIELDS.TIME_COMMENT.val('Проверка кода по пул-реквесту');
    FIELDS.PRIVATE_NOTES.prop('checked', true);
    formPrepareToShowInPopup();
    unsafeWindow.jQuery.fancybox({
        'type': 'inline',
        'content': '#update',
        'autoScale': false,
        'autoDimensions': false,
        'width': '800',
        'height': '700',
        'onClosed': function () {
            formReturnToPreviousStateAfterPopupClose();

        }
    });
}
/**
 * Review Passed
 */
unsafeWindow.reviewPassed = function() {
    FIELDS.STATUS.val(STATUS.RESOLVED.VALUE);
    FIELDS.NOTES.val('Review Passed');
    _showReviewResultPopup();
}

/**
 * Review failed
 */
unsafeWindow.reviewFailed = function() {
    FIELDS.NOTES.val('Комментарии к пулл-реквесту');
    FIELDS.STATUS.val(STATUS.REVIEW_FAILED.VALUE);
    _showReviewResultPopup();
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
 * Log time from timer
 */
unsafeWindow.logTimerTime = function() {
    return false; // @todo fix this feature
    unsafeWindow.jQuery.fancybox(   {
        'type': 'ajax',
        'href': location.href + '/time_entries/new#content',
        'autoScale': false,
        'autoDimensions': false,
        'width':'800',
        'height': '700',
        'onComplete': function() {
            $('#new_time_entry').on('submit.resolve', function() {
                stopTimer();
                startTimer();
            });
        },
        'onClosed': function() {
            $('#issue-form').off('.resolve');
        }
    });
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
        addButton('Resolve…', 'resolveIssue()', 'btn-success', 'glyphicon-ok');
        showTimer();
        addButton('Froze', 'frozeProgress()', 'btn-primary', 'glyphicon-pause');
    } else if (canDoReview()) {
        addButton('Review passed…', 'reviewPassed()', 'btn-success', 'glyphicon-thumbs-up');
        addButton('Review failed…', 'reviewFailed()', 'btn-danger', 'glyphicon-thumbs-down');
    }
} else {
    addButton('Assign To Me', 'assignToMe()', 'btn-primary', 'glyphicon-user');
}


showTotalRegularTime();
showMyTime();