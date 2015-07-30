// ==UserScript==
// @name        Oggetto Redmine Improvements
// @description Add some useful features to Redmine's issue page
// @author      Denis Obukhov
// @namespace   obukhow.redmine
// @downloadURL https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/ori.user.js
// @updateURL   https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/ori.user.js
// @include     http://redmine.oggettoweb.com/issues/*
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/select2/4.0.0/js/select2.min.js
// @require     https://raw.githubusercontent.com/robcowie/jquery-stopwatch/master/jquery.stopwatch.js
// @require     https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js
// @version     1.3.8
// @resource    select4_CSS  http://cdnjs.cloudflare.com/ajax/libs/select2/4.0.0/css/select2.min.css
// @resource    bootstrap_CSS https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/css/bootstrap.css
// @resource    configForm_HTML https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/html/config_1.3.html
// @grant       unsafeWindow
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_registerMenuCommand
// @grant       GM_listValues
// ==/UserScript==
var select4_CssSrc = GM_getResourceText ("select4_CSS");
var bootstrap_CssSrc = GM_getResourceText ("bootstrap_CSS");
GM_addStyle (select4_CssSrc);
GM_addStyle (bootstrap_CssSrc);
GM_addStyle ("@font-face {"+
    "font-family: 'Glyphicons Halflings';"+
    "src: url('http://netdna.bootstrapcdn.com/bootstrap/3.1.1/fonts/glyphicons-halflings-regular.eot');" +
    "src: url('http://netdna.bootstrapcdn.com/bootstrap/3.1.1/fonts/glyphicons-halflings-regular.eot?#iefix') format('embedded-opentype'), url('http://netdna.bootstrapcdn.com/bootstrap/3.1.1/fonts/glyphicons-halflings-regular.woff') format('woff'), url('http://netdna.bootstrapcdn.com/bootstrap/3.1.1/fonts/glyphicons-halflings-regular.ttf') format('truetype'), url('http://netdna.bootstrapcdn.com/bootstrap/3.1.1/fonts/glyphicons-halflings-regular.svg#glyphicons_halflingsregular') format('svg');"+
    "}");
GM_addStyle (".btn-success, .btn-primary, .btn-warning, .btn-danger { color: #fff !important;}");
GM_addStyle (".select2-container .select2-choice {height: auto; line-height: 1.4em;} .select2-container .select2-choice .select2-arrow b {background-image: url('http://cdnjs.cloudflare.com/ajax/libs/select2/3.4.8/select2.png') !important;}");
GM_addStyle ("#content h2{line-height:40px;");
GM_addStyle ("#fancybox-content .tabular p{padding-left:100px;} #config_form p {padding-left:200px !important;}");
GM_addStyle ("#fancybox-content .tabular p{padding-left:100px;} #config_form p {padding-left:200px !important;}");
GM_addStyle ("table.rtfbfq {text-align:right; border:1px solid #fff;} .rtfbfqHeader {font-weight:bold; text-align:center; color: #DDD; min-width: 20px;}");

// variables

var STATUS = {
    'NEW' : {"VALUE": 1, 'TEXT': "New"},
    'IN_PROGRESS': {"VALUE": 2, "TEXT": "In Progress"},
    'RESOLVED': {"VALUE": 3, "TEXT": "Resolved"},
    'FEEDBACK': {"VALUE": 4, "TEXT": "Feedback"},
    'FROZEN': {"VALUE": 8, "TEXT": "Frozen"},
    'REVIEW_FAILED': {"VALUE": 18, "TEXT": "Review failed"},
    'VERIFY_FAILED': {"VALUE": 17, "TEXT": "Verify failed"},
    'READY_FOR_STAGE': {"VALUE": 14, "TEXT": "Ready for Stage"},
    'CLOSED': {"VALUE": 5, "TEXT": "Closed"}
}

var FIELDS;

var ROLES = {
    'BACKEND_DEVELOPER' : 'back_dev',
    'FRONTEND_DEVELOPER': 'front_dev',
    'QA'                : 'qa',
    'PM'                : 'pm',
    'DESIGNER'          : 'designer'
};

var ACTIVITIES = {
    'BACKEND_DEVELOPMENT' : 12,
    'FRONTEND_DEVELOPMENT': 13,
    'TESTING'             : 11,
    'PROJECT_MANAGEMENT'  : 16,
    'DESIGN'              : 8
};

var isAssignedToMe = ($('#loggedas>a').attr('href') == $('td.assigned-to>a').attr('href'));
var myUserLink = $('#loggedas a').attr('href');
var myID = myUserLink.match(/(\d*)$/i)[0];
var issueID = location.pathname.match(/(\d*)$/i)[0];
var currentStatus = $('td.status').html();
var timeKey       = issueID + '_startTime';

var $buttonsContainer = $('a.icon-edit').parent();


//functions

/**
 * Init form elements
 *
 * @return void
 */
function initFormElements() {
    FIELDS = {
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
    };
    FIELDS.ASSIGNEE.css('width', '60%');
    FIELDS.ASSIGNEE.select2();
    // set default values
    FIELDS.ACTIVITY.val(getDefaultActivity()); // activity: backend development
    FIELDS.TIME_TYPE.val('Regular'); //type: regular
// hide fields
    hideFields();
}

/**
 * Hide form fields
 *
 * @return void
 */
function hideFields(force) {
    if (typeof(force) === 'undefined') {
        force = false;
    }
    if (!canHideFields() && !force) {
        return;
    }
    FIELDS.ISSUE_START_DATE.parent().hide();
    FIELDS.ISSUE_DUE_DATE.parent().hide();
    FIELDS.ORDER.parent().hide();
    FIELDS.CATEGORY_ID.parent().hide();
    FIELDS.TAG.parent().hide();
    FIELDS.DESCRIPTION.parent().hide();
    FIELDS.TRACKER.parent().hide();
    FIELDS.SUBJECT.parent().hide();
    FIELDS.PRIORITY.parent().hide();
    FIELDS.VERSION.parent().hide();
    FIELDS.PARENT.parent().hide();
    FIELDS.ESTIMATE.parent().hide();
}

/**
 * Show form fields
 *
 * @return void
 */
function showFields() {
    if (canHideFields()) {
        return;
    }
    FIELDS.ISSUE_START_DATE.parent().show();
    FIELDS.ISSUE_DUE_DATE.parent().show();
    FIELDS.ORDER.parent().show();
    FIELDS.CATEGORY_ID.parent().show();
    FIELDS.TAG.parent().show();
    FIELDS.DESCRIPTION.parent().show();
    FIELDS.TRACKER.parent().show();
    FIELDS.SUBJECT.parent().show();
    FIELDS.PRIORITY.parent().show();
    FIELDS.VERSION.parent().show();
    FIELDS.PARENT.parent().show();
    FIELDS.ESTIMATE.parent().show();
}

/**
 * Add hide fields element and add observers
 *
 * @return void
 */
function addHideFormFieldsControl() {
    $('#update h3').append('<label style="line-height: 16px; font-size:12px;" for="conf-hide_fieds"><input style="margin: 0px 4px 4px 20px;" id="conf-hide_fieds" value="1" type="checkbox"> Hide Workflow Unrelated Fields</label>');
    $checkbox = $('#conf-hide_fieds');
    $checkbox.prop('checked', canHideFields());
    $checkbox.change(function() {
        GM_setValue('conf_hide_fields', $(this).prop('checked'));
        if (canHideFields()) {
            hideFields();
        } else {
            showFields();
        }
    });
}

/**
 * Can hide fields
 *
 * @returns {boolean}
 */
function canHideFields() {
    return GM_getValue('conf_hide_fields', true);
}

/**
 * Get my role
 *
 * @returns {string}
 */
function getMyRole() {
    return GM_getValue('user_role', ROLES.BACKEND_DEVELOPER);
}

/**
 * Get reviewer flag
 * @returns {boolean}
 */
function isReviewer() {
    return GM_getValue('is_reviewer', false);
}
/**
 * Is Project Manager
 *
 * @returns {boolean}
 */
function isPM() {
    return (getMyRole() == ROLES.PM);
}

/**
 * Get default activity
 * @returns {numeric}
 */
function getDefaultActivity() {
    return GM_getValue('def_activity', ACTIVITIES.BACKEND_DEVELOPMENT);
}

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
 * get start progress button text
 *
 * @returns {string}
 */
function getStartProgressText() {
    if (isTimerStarted()) {
        return 'Continue Progress';
    }
    if (getMyRole() == ROLES.QA) {
        return 'Start Testing';
    }
    if (canDoReview()) {
        return 'Start Review';
    }
    return 'Start Progress';
}

/**
 * Show config popup
 */
function showConfig() {
    if ($('#configFormContainer').length < 1) {
        $('body').append(GM_getResourceText("configForm_HTML"));
    } else {
        $('#configFormContainer').show();
    }
    setTimeout(function(){ // to allow inserted content be handled by browser
        unsafeWindow.jQuery.fancybox({
            'type': 'inline',
            'content': '#config_form_block',
            'autoScale': false,
            'autoDimensions': false,
            'width':'600',
            'height': '200',
            'onComplete': function() {
                setTimeout(function() {
                    $('#user_role').val(getMyRole());
                    $('#reviewer').prop('checked', isReviewer());
                    $('#activity').val(getDefaultActivity());
                }, 0);


                $('#config_form').on('submit.save_config', function(e) {
                    GM_setValue('user_role', $('#user_role').val());
                    GM_setValue('is_reviewer', $('#reviewer').prop('checked'));
                    GM_setValue('def_activity', $('#activity').val());
                    FIELDS.ACTIVITY.val(getDefaultActivity());
                    unsafeWindow.jQuery.fancybox.close();
                });
            },
            'onClosed': function() {
                $('#config_form').off('.save_config');
                $('#configFormContainer').hide();
            }
        });
    }, 500);
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
 * Can start test
 *
 * @returns {boolean}
 */
function canStartTest() {
    return (currentStatus == STATUS.RESOLVED.TEXT && getMyRole() == ROLES.QA)
}

/**
 * Can start test
 *
 * @returns {boolean}
 */
function canClose() {
    return (currentStatus == STATUS.RESOLVED.TEXT && isPM())
}

/**
 * Can do issue review
 */
function canDoReview() {
    return (currentStatus == STATUS.RESOLVED.TEXT && isReviewer());
}

/**
 * Camel case string formatter
 *
 * @param str
 * @returns {string}
 */
function camelCase(str) {
    var camelCased = str.toLowerCase().replace(/[-_ .]+(.)?/g, function (match, p) {
        if (p) {
            return p.toUpperCase();
        }
        return '';
    }).replace(/[^\w]/gi, '');
    return camelCased;
}

/**
 * issue on review flag
 *
 * @returns {boolean}
 */
function isOnReview() {
    return GM_getValue(issueID + '_review');
}

/**
 * issue on testing flag
 *
 * @returns {boolean}
 */
function isOnTesting() {
    return GM_getValue(issueID + '_testing');
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

/**
 * Continue issue progress
 */
unsafeWindow.continueProgress = function() {
    unsafeWindow.startProgress();
}

/**
 * Start issue review
 */
unsafeWindow.startReview = function() {
    setTimeout(function() {
        GM_setValue(issueID + '_review', true);
    }, 0);
    unsafeWindow.startProgress();
}

/**
 * Start issue testing
 */
unsafeWindow.startTesting = function() {
    setTimeout(function() {
        GM_setValue(issueID + '_testing', true);
    }, 0);

    unsafeWindow.startProgress();
}

/**
 * Rewritten function from redmine core
 *
 * @param url
 */
unsafeWindow.updateIssueFrom = function(url) {
    unsafeWindow.jQuery.ajax({
        url: url,
        type: 'post',
        data: $('#issue-form').serialize()
    }).done(function() {
        setTimeout(function() {
            initFormElements();
        }, 200);
    });
}

function formPrepareToShowInPopup() {
    setTimeout(function() {
        hideFields(true);
    }, 0);

    $('#attachments_fields').parents('fieldset').hide();
    $('#update').show();
    $('#update h3').hide();
    $('.form-preview-btn').hide();
}

function formReturnToPreviousStateAfterPopupClose() {
    setTimeout(function() {
        showFields();
    }, 0);
    $('#attachments_fields').parents('fieldset').show();
    $('#update').hide();
    $('.form-preview-btn').show();
    $('#update h3').show().parent().parent().css({'width':'auto', 'height': 'auto'});
    FIELDS.SPENT_TIME.val('');
    FIELDS.TIME_COMMENT.val('');
    FIELDS.PRIVATE_NOTES.prop('checked', false);
    FIELDS.NOTES.val('');
    FIELDS.ASSIGNEE.val(myID);
    FIELDS.ACTIVITY.val(getDefaultActivity());
}
/**
 * Resolve issue
 */
unsafeWindow.resolveIssue = function() {
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
            FIELDS.STATUS.val(STATUS.RESOLVED.VALUE);
            $('.jstEditor>.jstElements').hide();
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
function _showReviewResultPopup(status) {
    FIELDS.SPENT_TIME.val(getTimerTime());
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
            $('.jstEditor>.jstElements').hide();
            formReturnToPreviousStateAfterPopupClose();
            $('#issue-form').off('.reviewResult');
        },
        'onComplete': function() {
            FIELDS.STATUS.val(status);
            $('#issue-form').on('submit.reviewResult', function() {
                GM_deleteValue(issueID + '_review');
            });
        }
    });
}
/**
 * Review Passed
 */
unsafeWindow.reviewPassed = function() {
    FIELDS.NOTES.val('Review Passed');
    _showReviewResultPopup(STATUS.RESOLVED.VALUE);
}

/**
 * Review failed
 */
unsafeWindow.reviewFailed = function() {
    FIELDS.NOTES.val('Комментарии к пулл-реквесту');
    _showReviewResultPopup(STATUS.REVIEW_FAILED.VALUE);
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
    if ($('#log_time_container').length > 0 ){
        return _showLogTimePopup();
    } else {
        $.ajax({
            url: location.href + '/time_entries/new',
            dataType: 'text'
        }).done(function(data) {
            $('body').append('<div id="log_time_container"></div>');
            $('#log_time_container').append($(data).find('#content').children()).hide();
            $('#new_time_entry #time_entry_issue_id').parent().hide();
            $('#new_time_entry input[type=submit]:first').addClass('btn btn-primary').val('Log Time');
            $('#new_time_entry input[type=submit]:last').hide();
            setTimeout(function() {
                $('#new_time_entry #time_entry_activity_id').val(getDefaultActivity());
            }, 0);
            $('#new_time_entry #time_entry_custom_field_values_12').val('Regular');
            // initialize datepicker (copied from redmine source)
            var datepickerOptions={dateFormat: 'yy-mm-dd', firstDay: 0, showOn: 'button', buttonImageOnly: true, buttonImage: '/images/calendar.png?1370089946', showButtonPanel: true, showWeek: true, showOtherMonths: true, selectOtherMonths: true};
            unsafeWindow.$('#time_entry_spent_on').datepicker(datepickerOptions);
            _showLogTimePopup();
        });
    }

}

/**
 * Show log time popup
 * @private
 */
function _showLogTimePopup() {
    $('#log_time_container').show();
    unsafeWindow.jQuery.fancybox(   {
        'type': 'inline',
        'content': '#log_time_container',
        'autoScale': false,
        'autoDimensions': false,
        'width':'600',
        'height': '250',
        'onComplete': function() {
            setTimeout(function() {
                $('#new_time_entry #time_entry_hours').val(getTimerTime());
            }, 0);
            $('#new_time_entry').on('submit.log_time', function() {
                stopTimer();
                startTimer();
            });
        },
        'onClosed': function() {
            $('#new_time_entry').off('.log_time');
            $('#log_time_container').hide();
        }
    });
}

/**
 * Close issue
 */
unsafeWindow.closeIssue = function() {
    FIELDS.STATUS.val(STATUS.CLOSED.VALUE);
    $('#issue-form').submit();
}

/**
 * Show issue total regular time
 */
function showTotalRegularTime() {
    var url = location.origin + '/issues/' + issueID + '/time_entries?utf8=✓&f[]=spent_on&op' +
        '[spent_on]=*&f[]=cf_12&op[cf_12]=%3D&v[cf_12][]=Regular';
    $.get(url).done( function( data ) {
        $( "td.spent-time" ).append(' (R: <a href="' + url + '">' + _parseRedmineHours(data) + '</a>)' );
    });
}

/**
 * Show issue total regular time
 */
function showMyTime() {
    $('<tr><th></th><td></td>' +
        '<th class="spent-by-me">Spent by me:</th><td class="spent-by-me">loading...</td></tr>').insertAfter($('th.spent-time').parent());
    var totalHours = 0 , regularHours = 0, fuckupHours = 0;
    var baseUrl = location.origin + '/issues/' + issueID + '/time_entries?utf8=✓&f[]=spent_on' +
        '&op[spent_on]=*&f[]=user_id&op[user_id]=%3D&v[user_id][]=me';
    var tUrl = baseUrl;
    var rUrl = baseUrl + '&f[]=cf_12&op[cf_12]=%3D&v[cf_12][]=Regular';
    var fUrl = baseUrl + '&f[]=cf_12&op[cf_12]=%3D&v[cf_12][]=Fuc%25up';
    $.when($.get(tUrl), $.get(rUrl), $.get(fUrl)).done(function (tData, rData, fData) {
        totalHours = _parseRedmineHours(tData[0]);
        regularHours = _parseRedmineHours(rData[0]);
        fuckupHours = _parseRedmineHours(fData[0]);
        $('td.spent-by-me').html('<a href="' + tUrl + '">' + totalHours + ' hours</a> (R: <a href="' + rUrl + '">'
            + regularHours + '</a>, F: <a href="' + fUrl + '">' + fuckupHours + '</a>)');
    });
    addRtfBfqTime();
}

/**
 * Show table with Regular, Team-fuckup, Fuckup time for Back, Front, Testing
 */
function addRtfBfqTime() {

    $('td.spent-time').prepend('<span id="rtfbfq" class="glyphicon glyphicon-th" aria-hidden="true" data-html="true" data-trigger="hover" data-toggle="popover" data-content="Loading..."></span>');

    $(function () {
        $('[data-toggle="popover"]').popover();
    });
    $.ajax({
        url: 'http://new.oggy.co/api/timeEntry?id=' + issueID,
        dataType: 'jsonp',
        jsonpCallback: 'insertRtfBfqTable'
    });
}

/**
 * Insert
 */
function insertRtfBfqTable(data) {
    var time = {RB: 0, RF: 0, RT:0, TB: 0, TF: 0, TT: 0, FB: 0, FF: 0, FT: 0};
    $.extend(time, data);
    document.getElementById('rtfbfq').dataset.content = '<table class="rtfbfq">' +
        '<tr><td></td><td class="rtfbfqHeader">B</td><td class="rtfbfqHeader">F</td><td class="rtfbfqHeader">Q</td></tr>' +
        '<tr><td class="rtfbfqHeader">R</td><td>' + time.RB + '</td><td>' + time.RF + '</td><td>' + time.RT + '</td></tr>' +
        '<tr><td class="rtfbfqHeader">T</td><td>' + time.TB + '</td><td>' + time.TF + '</td><td>' + time.TT + '</td></tr>' +
        '<tr><td class="rtfbfqHeader">F</td><td>' + time.FB + '</td><td>' + time.FF + '</td><td>' + time.FT + '</td></tr>' +
        '</table>';
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

initFormElements();


//change link styles

$buttonsContainer.addClass('btn-group');
$buttonsContainer.children().addClass('btn btn-default');
if (!isPM()) {
    $('a.icon-copy').remove();
    $('a.icon-del').remove();
} else {
    $('a.icon-del').prepend('<span class="glyphicon glyphicon-trash"></span> ');
}
$('a.icon-edit').prepend('<span class="glyphicon glyphicon-pencil"></span> ').append('…');
$('a.icon-time-add').prepend('<span class="glyphicon glyphicon-time"></span> ');
$('a.icon-fav-off').prepend('<span class="glyphicon glyphicon-eye-open"></span> ');
$('#issue-form input[type=submit]').addClass('btn btn-success form-submit-btn');
$('#issue-form input[type=submit]').next().addClass('btn btn-primary form-preview-btn').prepend('<span class="glyphicon glyphicon-eye-open"></span> ');

//add buttons

if (isAssignedToMe) {
    if (canStartProgress()) {
        var text = getStartProgressText();
        addButton(text, camelCase(text) + '()', 'btn-success', 'glyphicon-play-circle');
    } else if (currentStatus == STATUS.IN_PROGRESS.TEXT){
        if (isOnReview()) {
            addButton('Review passed…', 'reviewPassed()', 'btn-success', 'glyphicon-thumbs-up');
            showTimer();
            addButton('Review failed…', 'reviewFailed()', 'btn-danger', 'glyphicon-thumbs-down');
        } else if (isOnTesting()) {
            addButton('Test passed…', 'resolveIssue()', 'btn-success', 'glyphicon-thumbs-up');
            showTimer();
            addButton('Test failed…', 'reviewFailed()', 'btn-danger', 'glyphicon-thumbs-down');
        } else {
            addButton('Resolve…', 'resolveIssue()', 'btn-success', 'glyphicon-ok');
            showTimer();
            addButton('Froze', 'frozeProgress()', 'btn-primary', 'glyphicon-pause');
        }
    } else if (canStartTest()) {
        var text = getStartProgressText();
        addButton(text, camelCase(text) + '()', 'btn-success', 'glyphicon-play-circle');
    } else if (canClose()) {
        addButton('Close', 'closeIssue()', 'btn-danger', 'glyphicon-remove');
    } else if (canDoReview()) {
        addButton('Start Review', 'startReview()', 'btn-success', 'glyphicon-play-circle');
    }
} else {
    addButton('Assign To Me', 'assignToMe()', 'btn-primary', 'glyphicon-user');
}

exportFunction(insertRtfBfqTable, unsafeWindow, {defineAs: "insertRtfBfqTable"});

showTotalRegularTime();
showMyTime();
addHideFormFieldsControl();

if (!GM_getValue('user_role')) {
    showConfig();
}
GM_registerMenuCommand("Preferences…", showConfig, "C");
