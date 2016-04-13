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
// @version     2.0.3
// @resource    select4_CSS  http://cdnjs.cloudflare.com/ajax/libs/select2/4.0.0/css/select2.min.css
// @resource    bootstrap3_CSS https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/css/bootstrap.css?v=2000
// @resource    configForm_HTML https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/html/config_1.3.html
// @grant       unsafeWindow
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_registerMenuCommand
// @grant       GM_listValues
// ==/UserScript==
var select4_CssSrc = GM_getResourceText("select4_CSS");
var bootstrap3_CssSrc = GM_getResourceText("bootstrap3_CSS");
GM_addStyle(select4_CssSrc);
GM_addStyle(bootstrap3_CssSrc);
GM_addStyle("@font-face {" +
    "font-family: 'Glyphicons Halflings';" +
    "src: url('http://netdna.bootstrapcdn.com/bootstrap/3.3.6/fonts/glyphicons-halflings-regular.eot');" +
    "src: url('http://netdna.bootstrapcdn.com/bootstrap/3.3.6/fonts/glyphicons-halflings-regular.eot?#iefix') format('embedded-opentype')," +
    "url('http://netdna.bootstrapcdn.com/bootstrap/3.3.6/fonts/glyphicons-halflings-regular.woff') format('woff'), " +
    "url('http://netdna.bootstrapcdn.com/bootstrap/3.3.6/fonts/glyphicons-halflings-regular.ttf') format('truetype'), " +
    "url('http://netdna.bootstrapcdn.com/bootstrap/3.3.6/fonts/glyphicons-halflings-regular.svg#glyphicons_halflingsregular') format('svg');" +
    "}");
GM_addStyle(".btn-success, .btn-primary, .btn-warning, .btn-danger { color: #fff !important;}");
GM_addStyle(".select2-container .select2-choice {height: auto; line-height: 1.4em;} .select2-container .select2-choice .select2-arrow b {background-image: url('http://cdnjs.cloudflare.com/ajax/libs/select2/3.4.8/select2.png') !important;} .select2-container--open{ z-index:10000;} .fancybox-content .select2-container--below {width: 90% !important;}");
GM_addStyle("#content h2{line-height:40px;");
GM_addStyle("#fancybox-content .tabular p{padding-left:100px;} #config_form p {padding-left:200px !important;}");
GM_addStyle("#fancybox-content .tabular p{padding-left:100px;} #config_form p {padding-left:200px !important;}");
GM_addStyle("table.rtfbfq {text-align:right; border:1px solid #fff;} .rtfbfqHeader {font-weight:bold; text-align:center; color: #DDD; min-width: 20px;}");

// variables

var STATUS = {
    'NEW': {"VALUE": 1, 'TEXT': "New"},
    'IN_PROGRESS': {"VALUE": 2, "TEXT": "In Progress"},
    'RESOLVED': {"VALUE": 3, "TEXT": "Resolved"},
    'FEEDBACK': {"VALUE": 4, "TEXT": "Feedback"},
    'FROZEN': {"VALUE": 8, "TEXT": "Frozen"},
    'REVIEW_FAILED': {"VALUE": 18, "TEXT": "Review failed"},
    'VERIFY_FAILED': {"VALUE": 17, "TEXT": "Verify failed"},
    'READY_FOR_STAGE': {"VALUE": 14, "TEXT": "Ready for Stage"},
    'CLOSED': {"VALUE": 5, "TEXT": "Closed"}
};

var RU_TEXT = {
    START_REVIEW: 'Начать ревью',
    REVIEW_PASSED: 'Ревью пройдено…',
    REVIEW_FAILED: 'Потрачено…',
    TEST_PASSED: 'Успешно…',
    TEST_FAILED: 'Нашлись баги…',
    CLOSE_ISSUE: 'Закрыть',
    START_TESTING: 'Начать тестирование',
    CONTINUE_PROGRESS: 'Продолжить работу',
    START_PROGRESS: 'Продолжить работу',
    RESOLVE_ISSUE: 'Завершить…',
    FROZE_ISSUE: 'На паузу',
    ASSIGN_TO_ME: 'Назначить на меня',
    SPENT_BY_ME: 'Затрачено мной',
    LOADING: 'загрузка...',
    MORE: 'Ещё ',
    ROLE_SETTINGS: 'Настройки роли'
};

var EN_TEXT = {
    START_REVIEW: 'Start Review',
    REVIEW_PASSED: 'Review passed…',
    REVIEW_FAILED: 'Review failed…',
    TEST_PASSED: 'Test passed…',
    TEST_FAILED: 'Test failed…',
    CLOSE_ISSUE: 'Close',
    START_TESTING: 'Start Testing',
    CONTINUE_PROGRESS: 'Continue Progress',
    START_PROGRESS: 'Start Progress',
    RESOLVE_ISSUE: 'Resolve…',
    FROZE_ISSUE: 'Froze',
    ASSIGN_TO_ME: 'Assign to Me',
    SPENT_BY_ME: 'Spent by me',
    LOADING: 'loading...',
    MORE: 'More ',
    ROLE_SETTINGS: 'Role Settings'
};

var TEXT = ($('a.my-account').text() == 'My account') ? EN_TEXT : RU_TEXT;

var FIELDS;

var ROLES = {
    'BACKEND_DEVELOPER': 'back_dev',
    'FRONTEND_DEVELOPER': 'front_dev',
    'QA': 'qa',
    'PM': 'pm',
    'DESIGNER': 'designer'
};

var ACTIVITIES = {
    'BACKEND_DEVELOPMENT': 12,
    'FRONTEND_DEVELOPMENT': 13,
    'TESTING': 11,
    'PROJECT_MANAGEMENT': 16,
    'DESIGN': 8
};

var TIME_TYPE = {
    'REGULAR': 'Regular',
    'FUCKUP': 'Fuc%up',
    'TEAM_FUCKUP': 'Team Fuc%up'
};

var isAssignedToMe = ($('#loggedas>a').attr('href') == $('td.assigned-to>a').attr('href'));
var myUserLink = $('#loggedas a').attr('href');
var myID = myUserLink.match(/(\d*)$/i)[0];
var issueID = location.pathname.match(/(\d*)$/i)[0];
var currentStatus = $('td.status').html();
var timeKey = issueID + '_startTime';
var token = $('meta[name="csrf-token"]').attr('content');

var $buttonsContainer = $('a.icon-edit').parent();

var defaultLightBoxOptions = {
    'content': '#update',
    'width': '600',
    'height': '200',
    'type': 'inline'
};


//functions

/**
 * Init form elements
 *
 * @return void
 */
function initFormElements() {
    FIELDS = {
        'TRACKER': $('#issue_tracker_id'),
        'PROJECT': $('#issue_project_id'),
        'SUBJECT': $('#issue_subject'),
        'PRIORITY': $('#issue_priority_id'),
        'PARENT': $('#issue_parent_issue_id'),
        'ESTIMATE': $('#issue_estimated_hours'),
        'VERSION': $('#issue_fixed_version_id'),
        'ACTIVITY': $('#time_entry_activity_id'),
        'STATUS': $('#issue_status_id'),
        'ASSIGNEE': $('#issue_assigned_to_id'),
        'TIME_TYPE': $('#time_entry_custom_field_values_12'),
        'ISSUE_START_DATE': $('#issue_start_date'),
        'ISSUE_DUE_DATE': $('#issue_due_date'),
        'ORDER': $('#issue_custom_field_values_16'),
        'CATEGORY_ID': $('#issue_category_id'),
        'TAG': $('#issue_custom_field_values_1'),
        'DESCRIPTION': $('#issue_description_and_toolbar'),
        'SPENT_TIME': $('#time_entry_hours'),
        'TIME_COMMENT': $('#time_entry_comments'),
        'NOTES': $('#issue_notes'),
        'PRIVATE_NOTES': $('#issue_private_notes'),
        'PRIVATE_FLAG': $('#issue_is_private')
    };
    FIELDS.ASSIGNEE.css('width', '60%');
    FIELDS.ASSIGNEE.select2(
    );
    if ((document.location.href.indexOf('time_entries') == -1) ||
        (document.location.href.indexOf('time_entries') > 0 && document.location.href.indexOf('edit') == -1)
    ) {
        // set default values
        FIELDS.ACTIVITY.val(getDefaultActivity()); // activity: backend development
        FIELDS.TIME_TYPE.val(TIME_TYPE.REGULAR); //type: regular

    }
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
    FIELDS.PROJECT.parent().hide();
    FIELDS.PRIVATE_FLAG.parent().hide();
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
    FIELDS.PROJECT.parent().show();
    FIELDS.PRIVATE_FLAG.parent().show();
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
    $checkbox.change(function () {
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
        var iconHtml = '<span class="glyphicon ' + icon + '"></span> ';
    }
    if (typeof(className) === "undefinded") {
        className = 'btn-default';
    }
    if ($('.manage-issue-buttons').length == 0) {
        $('<div class="contextual manage-issue-buttons btn-group"></div>').insertAfter($buttonsContainer);
    }
    $('.manage-issue-buttons').append('<a class="btn ' + className + '" onclick="' + action + '; return false;" href="#">' + iconHtml + '' + text + '</a>');
}

/**
 * Add "More" button
 *
 * @return void
 */
function addMoreButton() {
    var buttonHtml =
        '<a href="#" class="btn btn-default dropdown-toggle" type="button" id="moreMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">' +
        TEXT.MORE +
        '<span class="caret"></span>' +
        '</a>' +
        '<ul class="dropdown-menu pull-right" aria-labelledby="moreMenu" id="moreMenuList">' +
        '<li role="separator" class="divider"></li>' +
        '<li><a href="#" onclick="showConfig(); return false;"><span class="glyphicon glyphicon-cog"></span> ' + TEXT.ROLE_SETTINGS + '</a></li>' +
        '</ul>';
    $('.btn-group').not('.manage-issue-buttons').first().append(buttonHtml);
    if ($('a.icon-del')) {
        $('a.icon-del').last().detach();
        $('a.icon-del').first().removeClass('btn btn-default');
        $('#moreMenuList').prepend($('<li>').append($('a.icon-del').removeClass('icon icon-del').
            prepend('<span class="glyphicon glyphicon-trash"></span> ')));
    }
    if ($('a.icon-copy')) {
        $('a.icon-copy').last().detach();
        $('a.icon-copy').first().removeClass('btn btn-default');
        $('#moreMenuList').prepend($('<li>').append($('a.icon-copy').first().removeClass('icon icon-copy').
            prepend('<span class="glyphicon glyphicon-duplicate"></span> ')));

    }
    var url = '/issues/context_menu?utf8=✓&&authenticity_token=' + token + '&ids[]=' + issueID +
        '&back_url=/issues/' + issueID;

    $.get(url).done(function (data) {
        var $lis = $($.parseHTML(data)).children();

        $lis.slice(1, 8).each(function () {
            var $li = $(this);
            $li.addClass('status').children('a').addClass('trigger left-caret');
            $li.addClass('status').children('ul').addClass('dropdown-menu sub-menu');
            $li.children('ul').children('li').each(function () {
                var $chidLi = $(this);
                if ($chidLi.children('a').hasClass('icon-checked')) {
                    $chidLi.children('a').removeClass('icon-checked').
                        prepend('<span class="glyphicon glyphicon-ok"></span> ');
                }
                if ($chidLi.children('a').hasClass('disabled')) {
                    $chidLi.addClass('disabled');
                }
            });
            $('#moreMenuList').prepend($li);
        });
        $(".dropdown-menu > li > a.trigger").on("click", function (e) {
            var current = $(this).next();
            var grandparent = $(this).parent().parent();
            if ($(this).hasClass('left-caret') || $(this).hasClass('right-caret'))
                $(this).toggleClass('right-caret left-caret');
            grandparent.find('.left-caret').not(this).toggleClass('right-caret left-caret');
            grandparent.find(".sub-menu:visible").not(current).hide();
            current.toggle();
            e.stopPropagation();
        });
        $(".dropdown-menu > li > a:not(.trigger)").on("click", function () {
            var root = $(this).closest('.dropdown');
            root.find('.left-caret').toggleClass('right-caret left-caret');
            root.find('.sub-menu:visible').hide();
        });
    });
}

/**
 * get start progress button text
 *
 * @returns {string}
 */
function getStartProgressText() {
    if (isTimerStarted()) {
        return TEXT.CONTINUE_PROGRESS;
    }
    if (getMyRole() == ROLES.QA) {
        return TEXT.START_TESTING;
    }
    if (canDoReview()) {
        return TEXT.START_REVIEW;
    }
    return TEXT.START_PROGRESS;
}

/**
 * get start progress button text
 *
 * @returns {string}
 */
function getStartProgressFunction() {
    if (isTimerStarted()) {
        return camelCase(EN_TEXT.CONTINUE_PROGRESS);
    }
    if (getMyRole() == ROLES.QA) {
        return camelCase(EN_TEXT.START_TESTING);
    }
    if (canDoReview()) {
        return camelCase(EN_TEXT.START_REVIEW);
    }
    return camelCase(EN_TEXT.START_PROGRESS);
}

/**
 * Show config popup
 */
showConfigLightBoxOnComplete = function () {
    setTimeout(function () {
        $('#user_role').val(getMyRole());
        $('#reviewer').prop('checked', isReviewer());
        $('#activity').val(getDefaultActivity());
        $('#config_form').on('submit.save_config', function (e) {
            GM_setValue('user_role', $('#user_role').val());
            GM_setValue('is_reviewer', $('#reviewer').prop('checked'));
            GM_setValue('def_activity', $('#activity').val());
            FIELDS.ACTIVITY.val(getDefaultActivity());
            unsafeWindow.jQuery.fancybox.close();
        });
    }, 0);
};
exportFunction(showConfigLightBoxOnComplete, unsafeWindow, {defineAs: "showConfigLightBoxOnComplete"});
var showConfigLightBoxOnClosed = function () {
    $('#config_form').off('.save_config');
    $('#configFormContainer').hide();
};
exportFunction(showConfigLightBoxOnClosed, unsafeWindow, {defineAs: "showConfigLightBoxOnClosed"});
var showConfigLightBox = {
    'content': '#config_form_block',
    'width': '600',
    'height': '200',
    'type': 'inline'
};
unsafeWindow.showConfigLightBox = cloneInto(showConfigLightBox, unsafeWindow);
unsafeWindow.showConfigLightBox.onComplete = unsafeWindow.showConfigLightBoxOnComplete;
unsafeWindow.showConfigLightBox.onClosed = unsafeWindow.showConfigLightBoxOnClosed;
function showConfig() {

    setTimeout(function () { // to allow inserted content be handled by browser
        if (unsafeWindow.jQuery('#configFormContainer').length < 1) {
            unsafeWindow.jQuery('body').append(GM_getResourceText("configForm_HTML"));
        } else {
            unsafeWindow.jQuery('#configFormContainer').show();
        }
        unsafeWindow.jQuery.fancybox(unsafeWindow.showConfigLightBox);
    }, 500);
}
exportFunction(showConfig, unsafeWindow, {defineAs: "showConfig"});


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
    return localStorage.getItem(issueID + '_review');
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
function isTimerStarted() {
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
    var time = getTimeDiff() / 1000 / 60 / 60;
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
function startProgress() {
    FIELDS.STATUS.val(STATUS.IN_PROGRESS.VALUE);
    $('#issue-form').submit();
    startTimer();
}

/**
 * Continue issue progress
 */
function continueProgress() {
    unsafeWindow.startProgress();
}

/**
 * Start issue review
 */
function startReview() {
    setTimeout(function () {
        localStorage.setItem(issueID + '_review', true);
    }, 0);
    startProgress();
}

/**
 * Start issue testing
 */
function startTesting() {
    setTimeout(function () {
        GM_setValue(issueID + '_testing', true);
    }, 0);

    unsafeWindow.startProgress();
}

/**
 * Rewritten function from redmine core
 *
 * @param url
 */
unsafeWindow.updateIssueFrom = function (url) {
    unsafeWindow.jQuery.ajax({
        url: url,
        type: 'post',
        data: $('#issue-form').serialize()
    }).done(function () {
        setTimeout(function () {
            initFormElements();
        }, 200);
    });
}

function formPrepareToShowInPopup() {
    setTimeout(function () {
        hideFields(true);
    }, 0);

    $('#attachments_fields').parents('fieldset').hide();
    $('#update').show();
    $('#update h3').hide();
    $('.form-preview-btn').hide();
}

function formReturnToPreviousStateAfterPopupClose() {
    setTimeout(function () {
        showFields();
    }, 0);
    $('#attachments_fields').parents('fieldset').show();
    $('#update').hide();
    $('.form-preview-btn').show();
    $('#update h3').show().parent().parent().css({'width': 'auto', 'height': 'auto'});
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
var resolveIssueOnComplete = function () {
    setTimeout(function () {
        FIELDS.STATUS.val(STATUS.RESOLVED.VALUE);
        $('.jstEditor>.jstElements').hide();
        $('#issue-form').on('submit.resolve', function () {
            stopTimer();
        });
    }, 0);
};
exportFunction(resolveIssueOnComplete, unsafeWindow, {defineAs: "resolveIssueOnComplete"});
var resolveIssueOnClosed = function () {
    formReturnToPreviousStateAfterPopupClose();
    $('#issue-form').off('.resolve');
};
exportFunction(resolveIssueOnClosed, unsafeWindow, {defineAs: "resolveIssueOnClosed"});
var resolveIssueLightBox = defaultLightBoxOptions;
unsafeWindow.resolveIssueLightBox = cloneInto(resolveIssueLightBox, unsafeWindow);
unsafeWindow.resolveIssueLightBox.onComplete = unsafeWindow.resolveIssueOnComplete;
unsafeWindow.resolveIssueLightBox.onClosed = unsafeWindow.resolveIssueOnClosed;
function resolveIssue() {
    formPrepareToShowInPopup();
    FIELDS.SPENT_TIME.val(getTimerTime());
    unsafeWindow.jQuery.fancybox(unsafeWindow.resolveIssueLightBox);
};

/**
 * Show review result form
 *
 * @private
 */
var _showReviewResultPopupOnComplete = function () {
    setTimeout(function () {
        FIELDS.STATUS.val(status);
        $('#issue-form').on('submit.reviewResult', function () {
            localStorage.removeItem(issueID + '_review');
        });
    }, 0);
};
exportFunction(_showReviewResultPopupOnComplete, unsafeWindow, {defineAs: "_showReviewResultPopupOnComplete"});
var _showReviewResultPopupOnClosed = function () {
    $('.jstEditor>.jstElements').hide();
    formReturnToPreviousStateAfterPopupClose();
    $('#issue-form').off('.reviewResult');
};
exportFunction(_showReviewResultPopupOnClosed, unsafeWindow, {defineAs: "_showReviewResultPopupOnClosed"});
var _showReviewResultPopupLightBox = defaultLightBoxOptions;
unsafeWindow._showReviewResultPopupLightBox = cloneInto(_showReviewResultPopupLightBox, unsafeWindow);
unsafeWindow._showReviewResultPopupLightBox.onComplete = unsafeWindow._showReviewResultPopupOnComplete;
unsafeWindow._showReviewResultPopupLightBox.onClosed = unsafeWindow._showReviewResultPopupOnClosed;
function _showReviewResultPopup(status) {
    FIELDS.SPENT_TIME.val(getTimerTime());
    FIELDS.PRIVATE_NOTES.prop('checked', true);
    formPrepareToShowInPopup();
    unsafeWindow.jQuery.fancybox(unsafeWindow._showReviewResultPopupLightBox);

}
/**
 * Review Passed
 */
function reviewPassed() {
    FIELDS.NOTES.val('Ревью пройдено');
    FIELDS.TIME_COMMENT.val('Проверка кода по пул-реквесту');
    _showReviewResultPopup(STATUS.RESOLVED.VALUE);
}

/**
 * Review failed
 */
function reviewFailed() {
    FIELDS.NOTES.val('Комментарии к пулл-реквесту');
    FIELDS.TIME_COMMENT.val('Проверка кода по пул-реквесту');
    _showReviewResultPopup(STATUS.REVIEW_FAILED.VALUE);
}

/*
 * Test failed
 */
function testFailed() {
    FIELDS.TIME_COMMENT.val('Тестирование');
    _showReviewResultPopup(STATUS.VERIFY_FAILED.VALUE);
}

/*
 * Test passed
 */
function testPassed() {
    FIELDS.TIME_COMMENT.val('Тестирование');
    _showReviewResultPopup(STATUS.READY_FOR_STAGE.VALUE);
}

/**
 * Froze issue progress
 */
function frozeProgress() {
    FIELDS.STATUS.val(STATUS.FROZEN.VALUE);
    $('#issue-form').submit();
    pauseTimer();
}

/**
 * Assign issue to me
 */
function assignToMe() {
    FIELDS.ASSIGNEE.val(myID);
    $('#issue-form').submit();
}

/**
 * Log time from timer
 */
function logTimerTime() {
    if ($('#log_time_container').length > 0) {
        return unsafeWindow._showLogTimePopup();
    } else {
        $.ajax({
            url: location.href + '/time_entries/new',
            dataType: 'text'
        }).done(function (data) {
            $('body').append('<div id="log_time_container"></div>');
            $('#log_time_container').append($(data).find('#content').children()).hide();
            $('#new_time_entry #time_entry_issue_id').parent().hide();
            $('#new_time_entry input[type=submit]:first').addClass('btn btn-primary').val('Log Time');
            $('#new_time_entry input[type=submit]:last').hide();
            setTimeout(function () {
                $('#new_time_entry #time_entry_activity_id').val(getDefaultActivity());
            }, 0);
            $('#new_time_entry #time_entry_custom_field_values_12').val(TIME_TYPE.REGULAR);
            // initialize datepicker (copied from redmine source)
            var datepickerOptions = {
                dateFormat: 'yy-mm-dd',
                firstDay: 0,
                showOn: 'button',
                buttonImageOnly: true,
                buttonImage: '/images/calendar.png?1370089946',
                showButtonPanel: true,
                showWeek: true,
                showOtherMonths: true,
                selectOtherMonths: true
            };
            unsafeWindow.$('#time_entry_spent_on').datepicker(datepickerOptions);
            unsafeWindow._showLogTimePopup();
        });
    }

}

/**
 * Show log time popup
 * @private
 */
var _showLogTimePopupOnComplete = function () {
    setTimeout(function () {
        $('#new_time_entry #time_entry_hours').val(getTimerTime());
    }, 0);
    $('#new_time_entry').on('submit.log_time', function () {
        stopTimer();
        startTimer();
    });
};
exportFunction(_showLogTimePopupOnComplete, unsafeWindow, {defineAs: "_showLogTimePopupOnComplete"});
var _showLogTimePopupOnClosed = function () {
    $('#new_time_entry').off('.log_time');
    $('#log_time_container').hide();
};
exportFunction(_showLogTimePopupOnClosed, unsafeWindow, {defineAs: "_showLogTimePopupOnClosed"});
var _showLogTimePopupLightBox = {
    'content': '#log_time_container',
    'width': '600',
    'height': '250'
};
unsafeWindow._showLogTimePopupLightBox = cloneInto(_showLogTimePopupLightBox, unsafeWindow);
unsafeWindow._showLogTimePopupLightBox.onComplete = unsafeWindow._showLogTimePopupOnComplete;
unsafeWindow._showLogTimePopupLightBox.onClosed = unsafeWindow._showLogTimePopupOnClosed;
function _showLogTimePopup() {
    $('#log_time_container').show();
    unsafeWindow.jQuery.fancybox(unsafeWindow._showLogTimePopupLightBox);
}

/**
 * Close issue
 */
function closeIssue() {
    FIELDS.STATUS.val(STATUS.CLOSED.VALUE);
    $('#issue-form').submit();
}

/**
 * Show issue total regular time
 */
function showTotalRegularTime() {
    var url = getTimeTrackerUrl(TIME_TYPE.REGULAR);
    $.get(url).done(function (data) {
        $("td.spent-time").append(' (R: <a href="' + url + '">' + _parseRedmineHours(data) + '</a>)');
    });
}

/**
 * Show issue total regular time
 */
function showMyTime() {
    $('<tr><th></th><td></td>' +
        '<th class="spent-by-me">' + TEXT.SPENT_BY_ME +
        ':</th><td class="spent-by-me">' + TEXT.LOADING + '</td></tr>').insertAfter($('th.spent-time').parent());
    var totalHours = 0, regularHours = 0, fuckupHours = 0;
    var tUrl = getTimeTrackerUrl(false, false, true);
    var rUrl = getTimeTrackerUrl(TIME_TYPE.REGULAR, false, true);
    var fUrl = getTimeTrackerUrl(TIME_TYPE.FUCKUP, false, true);
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

    $('td.spent-time').prepend('<span id="rtfbfq" class="glyphicon glyphicon-th" aria-hidden="true" data-html="true" data-trigger="click" data-toggle="popover" data-content="' + TEXT.LOADING + '"></span>');

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
 * Insert RtfBfq table
 */
function insertRtfBfqTable(data) {
    var time = {RB: 0, RF: 0, RT: 0, TB: 0, TF: 0, TT: 0, FB: 0, FF: 0, FT: 0};
    $.extend(time, data);
    document.getElementById('rtfbfq').dataset.content = '<table class="rtfbfq">' +
        '<tr><td></td><td class="rtfbfqHeader">B</td><td class="rtfbfqHeader">F</td><td class="rtfbfqHeader">Q</td></tr>' +
        '<tr>' +
        '<td class="rtfbfqHeader">R</td>' +
        '<td><a href="' + getTimeTrackerUrl(TIME_TYPE.REGULAR, ACTIVITIES.BACKEND_DEVELOPMENT) + '" target="_blank">' + time.RB + '</a></td>' +
        '<td><a href="' + getTimeTrackerUrl(TIME_TYPE.REGULAR, ACTIVITIES.FRONTEND_DEVELOPMENT) + '" target="_blank">' + time.RF + '</a></td>' +
        '<td><a href="' + getTimeTrackerUrl(TIME_TYPE.REGULAR, ACTIVITIES.TESTING) + '" target="_blank">' + time.RT + '</a></td>' +
        '</tr>' +
        '<tr>' +
        '<td class="rtfbfqHeader">T</td>' +
        '<td><a href="' + getTimeTrackerUrl(TIME_TYPE.TEAM_FUCKUP, ACTIVITIES.BACKEND_DEVELOPMENT) + '" target="_blank">' + time.TB + '</a></td>' +
        '<td><a href="' + getTimeTrackerUrl(TIME_TYPE.TEAM_FUCKUP, ACTIVITIES.BACKEND_DEVELOPMENT) + '" target="_blank">' + time.TF + '</a></td>' +
        '<td><a href="' + getTimeTrackerUrl(TIME_TYPE.TEAM_FUCKUP, ACTIVITIES.BACKEND_DEVELOPMENT) + '" target="_blank">' + time.TT + '</a></td>' +
        '</tr>' +
        '<tr>' +
        '<td class="rtfbfqHeader">F</td>' +
        '<td><a href="' + getTimeTrackerUrl(TIME_TYPE.FUCKUP, ACTIVITIES.BACKEND_DEVELOPMENT) + '" target="_blank">' + time.FB + '</a></td>' +
        '<td><a href="' + getTimeTrackerUrl(TIME_TYPE.FUCKUP, ACTIVITIES.BACKEND_DEVELOPMENT) + '" target="_blank">' + time.FF + '</a></td>' +
        '<td><a href="' + getTimeTrackerUrl(TIME_TYPE.FUCKUP, ACTIVITIES.BACKEND_DEVELOPMENT) + '" target="_blank">' + time.FT + '</a></td>' +
        '</tr>' +
        '</table>';
}

/**
 * Get time tracker URL
 *
 * @param tracker string
 * @param activity string
 *
 * @return sting
 */
function getTimeTrackerUrl(tracker, activity, filterByMe) {
    var baseUrl = location.origin + '/issues/' + issueID + '/time_entries?utf8=✓&f[]=spent_on' +
        '&op[spent_on]=*';
    if (typeof(filterByMe) !== 'undefined' && filterByMe) {
        baseUrl += '&f[]=user_id&op[user_id]=%3D&v[user_id][]=me';
    }
    if (typeof(tracker) !== 'undefined' && tracker) {
        baseUrl += '&f[]=cf_12&op[cf_12]=%3D&v[cf_12][]=' + tracker.replace('%', '%25');
    }
    if (typeof(activity) !== 'undefined' && activity) {
        baseUrl += '&f[]=activity_id&op[activity_id]=%3D&f[]=&c[]=project&c[]=spent_on&c[]=user&c[]=activity&c[]=issue&c[]=comments&c[]=hours&v[activity_id][]=' + activity;
    }
    return baseUrl;
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

$('a.icon-edit').prepend('<span class="glyphicon glyphicon-pencil"></span> ').append('…');
$('a.icon-time-add').prepend('<span class="glyphicon glyphicon-time"></span> ');
$('a.icon-fav-off').prepend('<span class="glyphicon glyphicon-eye-open"></span> ');
$('#issue-form input[type=submit]').addClass('btn btn-success form-submit-btn');
$('#issue-form input[type=submit]').next().addClass('btn btn-primary form-preview-btn').prepend('<span class="glyphicon glyphicon-eye-open"></span> ');

//add buttons

if (isAssignedToMe) {
    if (canStartProgress()) {
        var text = getStartProgressText();
        addButton(text, getStartProgressFunction() + '()', 'btn-success', 'glyphicon-play-circle');
    } else if (currentStatus == STATUS.IN_PROGRESS.TEXT) {
        if (isOnReview()) {
            addButton(TEXT.REVIEW_PASSED, 'reviewPassed()', 'btn-success', 'glyphicon-thumbs-up');
            showTimer();
            addButton(TEXT.REVIEW_FAILED, 'reviewFailed()', 'btn-danger', 'glyphicon-thumbs-down');
        } else if (isOnTesting()) {
            addButton(TEXT.TEST_PASSED, 'testPassed()', 'btn-success', 'glyphicon-thumbs-up');
            showTimer();
            addButton(TEXT.TEST_FAILED, 'testFailed()', 'btn-danger', 'glyphicon-thumbs-down');
        } else {
            addButton(TEXT.RESOLVE_ISSUE, 'resolveIssue()', 'btn-success', 'glyphicon-ok');
            showTimer();
            addButton(TEXT.FROZE_ISSUE, 'frozeProgress()', 'btn-primary', 'glyphicon-pause');
        }
    } else if (canStartTest()) {
        var text = getStartProgressText();
        addButton(text, getStartProgressFunction() + '()', 'btn-success', 'glyphicon-play-circle');
    } else if (canClose()) {
        addButton(TEXT.CLOSE_ISSUE, 'closeIssue()', 'btn-danger', 'glyphicon-remove');
    } else if (canDoReview()) {
        addButton(TEXT.START_REVIEW, 'startReview()', 'btn-success', 'glyphicon-play-circle');
    }
} else {
    addButton(TEXT.ASSIGN_TO_ME, 'assignToMe()', 'btn-primary', 'glyphicon-user');
}

addMoreButton();
showTotalRegularTime();
showMyTime();
addHideFormFieldsControl();

if (!GM_getValue('user_role')) {
    unsafeWindow.showConfig();
}

GM_registerMenuCommand("Preferences…", unsafeWindow.showConfig, "C");
exportFunction(assignToMe, unsafeWindow, {defineAs: "assignToMe"});
exportFunction(startProgress, unsafeWindow, {defineAs: "startProgress"});
exportFunction(startTesting, unsafeWindow, {defineAs: "startTesting"});
exportFunction(testFailed, unsafeWindow, {defineAs: "testFailed"});
exportFunction(testPassed, unsafeWindow, {defineAs: "testPassed"});
exportFunction(frozeProgress, unsafeWindow, {defineAs: "frozeProgress"});
exportFunction(continueProgress, unsafeWindow, {defineAs: "continueProgress"});
exportFunction(resolveIssue, unsafeWindow, {defineAs: "resolveIssue"});
exportFunction(startReview, unsafeWindow, {defineAs: "startReview"});
exportFunction(reviewPassed, unsafeWindow, {defineAs: "reviewPassed"});
exportFunction(reviewFailed, unsafeWindow, {defineAs: "reviewFailed"});
exportFunction(_showReviewResultPopup, unsafeWindow, {defineAs: "_showReviewResultPopup"});
exportFunction(startTimer, unsafeWindow, {defineAs: "startTimer"});
exportFunction(stopTimer, unsafeWindow, {defineAs: "stopTimer"});
exportFunction(isTimerStarted, unsafeWindow, {defineAs: "isTimerStarted"});
exportFunction(isTimerShown, unsafeWindow, {defineAs: "isTimerShown"});
exportFunction(getTimerTime, unsafeWindow, {defineAs: "getTimerTime"});
exportFunction(getTimeDiff, unsafeWindow, {defineAs: "getTimeDiff"});
exportFunction(logTimerTime, unsafeWindow, {defineAs: "logTimerTime"});
exportFunction(_showLogTimePopup, unsafeWindow, {defineAs: "_showLogTimePopup"});
exportFunction(formPrepareToShowInPopup, unsafeWindow, {defineAs: "formPrepareToShowInPopup"});
exportFunction(formReturnToPreviousStateAfterPopupClose, unsafeWindow, {defineAs: "formReturnToPreviousStateAfterPopupClose"});
exportFunction(insertRtfBfqTable, unsafeWindow, {defineAs: "insertRtfBfqTable"});

unsafeWindow.STATUS = cloneInto(STATUS, unsafeWindow);
unsafeWindow.ACTIVITIES = cloneInto(ACTIVITIES, unsafeWindow);
unsafeWindow.ROLES = cloneInto(ROLES, unsafeWindow);
unsafeWindow.FIELDS = cloneInto(FIELDS, unsafeWindow);
