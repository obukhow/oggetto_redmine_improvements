// ==UserScript==
// @name        Oggetto Redmine Improvements
// @description Add some useful features to Redmine's issue page
// @author      Denis Obukhov
// @namespace   obukhow.redmine
// @downloadURL https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/ori.user.js
// @updateURL   https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/ori.user.js
// @include     http://redmine.oggettoweb.com/*
// @include     https://redmine.oggettoweb.com/*
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/select2/4.0.0/js/select2.min.js
// @require     https://raw.githubusercontent.com/robcowie/jquery-stopwatch/master/jquery.stopwatch.js
// @require     https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js
// @version     3.0.17
// @resource    select4_CSS  http://cdnjs.cloudflare.com/ajax/libs/select2/4.0.0/css/select2.min.css
// @resource    zen_CSS https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/css/zen.css?v=11
// @resource    configForm_HTML https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/html/config_2.1.html
// @resource    version_HTML https://raw.githubusercontent.com/obukhow/oggetto_redmine_improvements/master/html/version3.html?v=1
// @grant       unsafeWindow
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_registerMenuCommand
// @grant       GM_listValues
// @run-at document-start
// ==/UserScript==
var zen_CssSrc = GM_getResourceText("zen_CSS");
GM_addStyle(zen_CssSrc);
var select4_CssSrc = GM_getResourceText("select4_CSS");
GM_addStyle(select4_CssSrc);

GM_addStyle(".select2-container--open{ z-index:10000;} .fancybox-content .select2-container--below {width: 90% !important;}");
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
    START_PROGRESS: 'Начать работу',
    RESOLVE_ISSUE: 'Завершить…',
    FROZE_ISSUE: 'Заморозить',
    ASSIGN_TO_ME: 'Назначить на меня',
    SPENT_BY_ME: 'Затрачено мной',
    LOADING: 'загрузка...',
    MORE: 'Ещё ',
    ROLE_SETTINGS: 'Настройки роли',
    ONLY_WF_FIELDS: 'Только workflow',
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
    FROZE_ISSUE: 'Freeze',
    ASSIGN_TO_ME: 'Assign to Me',
    SPENT_BY_ME: 'Spent by me',
    LOADING: 'loading...',
    MORE: 'More ',
    ROLE_SETTINGS: 'Role Settings',
    ONLY_WF_FIELDS: 'Only workflow fields',
};

var isAssignedToMe = false;
var myUserLink = '';
var myID = '';
var issueID = location.pathname.match(/(\d*)$/i)[0];
var currentStatus = '';
var timeKey = issueID + '_startTime';
var token = '';
var isIssuePage = location.pathname.match(/\/issues\/[\d]{1,}$/i) !== null;
var isLogTimePage = location.pathname.match(/\/time_entries\/new$/i) !== null;
var time = {"total": 0, "types": {}, "me": {"total": 0, "r": 0, "f": 0}, "regular": 0, "inited": false, "loading": false};


var $buttonsContainer = '';
var TEXT = EN_TEXT;($('a.my-account').text() == 'My account') ? EN_TEXT : RU_TEXT;

var FIELDS;

var ROLES = {
    'BACKEND_DEVELOPER': 'back_dev',
    'FRONTEND_DEVELOPER': 'front_dev',
    'QA': 'qa',
    'PM': 'pm',
    'DESIGNER': 'designer',
    'ADMIN': 'admin'
};

var ACTIVITIES = {
    'BACKEND_DEVELOPMENT': 12,
    'FRONTEND_DEVELOPMENT': 13,
    'TESTING': 11,
    'PROJECT_MANAGEMENT': 16,
    'DESIGN': 8,
    'ADMIN': 35
};

var TIME_TYPE = {
    'REGULAR': 'Regular',
    'FUCKUP': 'Fuc%up',
    'TEAM_FUCKUP': 'Team Fuc%up'
};


var defaultLightBoxOptions = {
    'href': '#update',
    'width': '800',
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
        'DESIGN_ESTIMATE': $('#issue_custom_field_values_17'),
        'BE_ESTIMATE': $('#issue_custom_field_values_18'),
        'FE_ESTIMATE': $('#issue_custom_field_values_19'),
        'TST_ESTIMATE': $('#issue_custom_field_values_20'),
        'BA_ESTIMATE': $('#issue_custom_field_values_22'),
        'SA_ESTIMATE': $('#issue_custom_field_values_23'),
        'PM_ESTIMATE': $('#issue_custom_field_values_26'),
        'REVIEW_ESTIMATE': $('#issue_custom_field_values_37'),
        'DESCRIPTION': $('#issue_description_and_toolbar'),
        'SPENT_TIME': $('#time_entry_hours'),
        'TIME_COMMENT': $('#time_entry_comments'),
        'NOTES': $('#issue_notes'),
        'PRIVATE_NOTES': $('#issue_private_notes'),
        'PRIVATE_FLAG': $('#issue_is_private'),
        'PAID': $('#time_entry_custom_field_values_32')
    };
    if ( document.getElementById('issue_status_id')) {
        document.getElementById('issue_status_id').onchange = undefined;

    }

    FIELDS.ACTIVITY.val(getDefaultActivity()); // set default activity
    FIELDS.TIME_TYPE.val(TIME_TYPE.REGULAR); //type: regular
    FIELDS.ASSIGNEE.css('width', '60%');
    FIELDS.ASSIGNEE.select2(
    );

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
    FIELDS.BE_ESTIMATE.parent().hide();
    FIELDS.FE_ESTIMATE.parent().hide();
    FIELDS.TST_ESTIMATE.parent().hide();
    FIELDS.PM_ESTIMATE.parent().hide();
    FIELDS.REVIEW_ESTIMATE.parent().hide();
    FIELDS.BA_ESTIMATE.parent().hide();
    FIELDS.SA_ESTIMATE.parent().hide();
    FIELDS.DESIGN_ESTIMATE.parent().hide();
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
    FIELDS.BE_ESTIMATE.parent().show();
    FIELDS.FE_ESTIMATE.parent().show();
    FIELDS.TST_ESTIMATE.parent().show();
    FIELDS.PM_ESTIMATE.parent().show();
    FIELDS.REVIEW_ESTIMATE.parent().show();
    FIELDS.BA_ESTIMATE.parent().show();
    FIELDS.SA_ESTIMATE.parent().show();
    FIELDS.DESIGN_ESTIMATE.parent().show();
}

/**
 * Add hide fields element and add observers
 *
 * @return void
 */
function addHideFormFieldsControl() {
    $('#update h3').after('<label style="line-height: 16px; font-size:12px;" for="conf-hide_fieds"><input style="margin: 0px 4px 4px 20px;" id="conf-hide_fieds" value="1" type="checkbox"> ' + TEXT.ONLY_WF_FIELDS + '</label>');
    var $checkbox = $('#conf-hide_fieds');
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
function addButton(text, action, className) {

    if (typeof(className) === "undefinded") {
        className = 'btn-default';
    }
    if ($('.manage-issue-buttons').length == 0) {
        $('<div class="contextual manage-issue-buttons"></div>').insertAfter($buttonsContainer);
    }
    $('.manage-issue-buttons').append('<a class="icon ' + className + '" onclick="' + action + '; return false;" href="#">' + text + '</a>');
}

/**
 * Add "More" button
 *
 * @return void
 */
function addMoreButton() {
    var url = '/issues/context_menu?utf8=✓&&authenticity_token=' + token + '&ids[]=' + issueID +
        '&back_url=/issues/' + issueID;
    var buttonHtml =
        '<form data-cm-url="' + url + '"><a href="#" class="icon" onclick="contextMenuShow(event);" type="button"  id="moreMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">' +
        TEXT.MORE +
        '<span class="caret"></span>' +
        '</a></form>';
    $('#content').children().filter('.contextual').first().append(buttonHtml);
    if ($('a.icon-del')) {
        $('a.icon-del').first().detach();
    }
    if ($('a.icon-copy')) {
        $('a.icon-copy').first().detach();
    }
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
var showConfigLightBoxOnComplete = function () {
    setTimeout(function () {
        $('#user_role').val(getMyRole());
        $('#reviewer').prop('checked', isReviewer());
        $('#activity').val(getDefaultActivity());
        getApiKey().then(function(value) {
            $('#api_key').val(value);
        });
        $('#config_form').on('submit.save_config', function (e) {
            GM_setValue('user_role', $('#user_role').val());
            GM_setValue('is_reviewer', $('#reviewer').prop('checked'));
            GM_setValue('def_activity', $('#activity').val());
            GM_setValue('api_key', $('#api_key').val());
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
    'href': '#config_form_block',
    'width': '600',
    'height': '200',
    'type': 'inline'
};
unsafeWindow.showConfigLightBox = cloneInto(showConfigLightBox, unsafeWindow);
unsafeWindow.showConfigLightBox.afterShow = unsafeWindow.showConfigLightBoxOnComplete;
unsafeWindow.showConfigLightBox.afterClose = unsafeWindow.showConfigLightBoxOnClosed;
function showConfig() {

    if (typeof(unsafeWindow.jQuery.fancybox) == "undefined") {
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = "/plugin_assets/redmine_lightbox2/javascripts/jquery.fancybox-2.1.5.pack.js?1580029733";
        $("head").append(s);

        var l = document.createElement('link');
        l.setAttribute('rel', 'stylesheet');
        l.setAttribute('type', 'text/css');
        l.setAttribute('href', '/plugin_assets/redmine_lightbox2/stylesheets/jquery.fancybox-2.1.5.css?1580029733');
        $("head").append(l);
    }
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

var showVersionLightBox = {
    'href': '#versionPopup',
    'width': '600',
    'height': '200',
    'type': 'inline'
};
unsafeWindow.showVersionLightBox = cloneInto(showVersionLightBox, unsafeWindow);

function showVersion() {
    setTimeout(function () { // to allow inserted content be handled by browser
        if (unsafeWindow.jQuery('#versionPopup').length < 1) {
            unsafeWindow.jQuery('body').append(GM_getResourceText("version_HTML"));
        } else {
            unsafeWindow.jQuery('#versionPopup').show();
        }
        unsafeWindow.jQuery.fancybox(unsafeWindow.showVersionLightBox);
    }, 500);
}

function saveVersion() {
    GM_setValue('version_4', 1);
    unsafeWindow.jQuery.fancybox.close();
}
exportFunction(saveVersion, unsafeWindow, {defineAs: "saveVersion"});
exportFunction(showVersion, unsafeWindow, {defineAs: "showVersion"});




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

    addButton('<span id="timer-btn" class="timer-btn"></span>', 'logTimerTime()', 'icon-time-add timer');
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
        $('#issue-form').on('submit.resolve', function () {
            stopTimer();
        });
        $('#update').on('click', 'div.jstTabs a.tab-preview', function(event){
            var tab = $(event.target);

            var url = tab.data('url');
            var form = tab.parents('form');
            var jstBlock = tab.parents('.jstBlock');

            var element = encodeURIComponent(jstBlock.find('.wiki-edit').val());
            var attachments = form.find('.attachments_fields input').serialize();

            unsafeWindow.jQuery.ajax({
                url: url,
                type: 'post',
                data: "text=" + element + '&' + attachments,
                success: function(data){
                    jstBlock.find('.wiki-preview').html(data);
                }
            });
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
    $('#issue-form').on('submit.reviewResult', function () {
        localStorage.removeItem(issueID + '_review');
    });
    $('#update').on('click', 'div.jstTabs a.tab-preview', function(event){
        var tab = $(event.target);

        var url = tab.data('url');
        var form = tab.parents('form');
        var jstBlock = tab.parents('.jstBlock');

        var element = encodeURIComponent(jstBlock.find('.wiki-edit').val());
        var attachments = form.find('.attachments_fields input').serialize();

        unsafeWindow.jQuery.ajax({
            url: url,
            type: 'post',
            data: "text=" + element + '&' + attachments,
            success: function(data){
                jstBlock.find('.wiki-preview').html(data);
            }
        });
    });
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
unsafeWindow._showReviewResultPopupLightBox.afterShow = unsafeWindow._showReviewResultPopupOnComplete;
unsafeWindow._showReviewResultPopupLightBox.afterClose = unsafeWindow._showReviewResultPopupOnClosed;
function _showReviewResultPopup(status) {
    FIELDS.SPENT_TIME.val(getTimerTime());
    FIELDS.PRIVATE_NOTES.prop('checked', true);
    formPrepareToShowInPopup();
    FIELDS.STATUS.val(status);
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
            url: location.origin + location.pathname + '/time_entries/new',
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
    'href': '#log_time_container',
    'width': '600',
    'height': '250'
};
unsafeWindow._showLogTimePopupLightBox = cloneInto(_showLogTimePopupLightBox, unsafeWindow);
unsafeWindow._showLogTimePopupLightBox.afterShow = unsafeWindow._showLogTimePopupOnComplete;
unsafeWindow._showLogTimePopupLightBox.afterClose = unsafeWindow._showLogTimePopupOnClosed;
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
    getTimeData().then(function(time) {
        $("div.spent-time>div.value").append(' (R: <a href="' + url + '">' + time.regular.toFixed(2) + '</a>)');
    });
}

/**
 * Show issue total regular time
 */
function showMyTime() {
    $('<div class="spent-by-me attribute"><div class="label">' + TEXT.SPENT_BY_ME +
      ':</div><div class="value value-spent-by-me">' + TEXT.LOADING + '</div>').insertAfter($('div.spent-time'));
    getTimeData().then(function(time) {
        var tUrl = getTimeTrackerUrl(false, false, true);
        var rUrl = getTimeTrackerUrl(TIME_TYPE.REGULAR, false, true);
        var fUrl = getTimeTrackerUrl(TIME_TYPE.FUCKUP, false, true);

        $('div.value-spent-by-me').html('<a href="' + tUrl + '">' + time.me.total.toFixed(2) + ' hours</a> (R: <a href="' + rUrl + '">'
                                        + time.me.r.toFixed(2) + '</a>, F: <a href="' + fUrl + '">' + time.me.f.toFixed(2) + '</a>)');
    });
    addRtfBfqTime();
}

/**
 * Show table with Regular, Team-fuckup, Fuckup time for Back, Front, Testing
 */
function addRtfBfqTime() {

    if ($('div.spent-time>div.value').length > 0) {
        $('div.spent-time>div.value').prepend('<span id="rtfbfq" class="icon icon-time-add" aria-hidden="true" data-html="true" data-trigger="click" data-toggle="popover" data-content="' + TEXT.LOADING + '"></span>');

        $(function () {
            $('[data-toggle="popover"]').popover();
        });
        getTimeData().then(function (time) {
            insertRtfBfqTable(time);
        });
    }
}
function prepareTimeData(resp) {
    for (let i = 0; i < resp.time_entries.length; i++) {
        let entry = resp.time_entries[i];
        time.total += entry.hours;
        let type = entry.custom_fields[0]["value"];
        if (!time.types.hasOwnProperty(type)) {
            time.types[type] = {"id": entry.custom_fields[0]["id"], "name": entry.custom_fields[0]["value"], "hours": 0, "activities": {}};
        }
        time.types[type]["hours"] += entry.hours;
        if (!time.types[type]["activities"].hasOwnProperty(entry.activity.id)) {
            time.types[type]["activities"][entry.activity.id] = {"id": entry.activity.id, "name": entry.activity.name, "hours": 0};
        }
        time.types[type]["activities"][entry.activity.id]["hours"] += entry.hours;
        if (entry.custom_fields[0].value == TIME_TYPE.REGULAR) {
            time.regular += entry.hours;
        }
        if (entry.user.id == myID) {
            time.me.total += entry.hours;
            if (entry.custom_fields[0].value == TIME_TYPE.REGULAR) {
                time.me.r += entry.hours;
            }
            if (entry.custom_fields[0].value == TIME_TYPE.FUCKUP) {
                time.me.f += entry.hours;
            }
        }
    }
}

async function getTimeData() {
    return new Promise(function(resolve, reject) {
        if (time.inited) {
            resolve(time);
            return;
        }
        if (!time.loading) {
            time.loading = true;
            getApiKey().then(function(apiKey) {
                $.ajax({
                    url: '/time_entries.json',
                    data: {"f": ['issue_id'], "op": {"issue_id": "~"}, "v": {"issue_id": [issueID]}, "limit": 1000},
                    headers: {"X-Redmine-API-Key": apiKey},
                    complete: function (response) {
                        let resp = JSON.parse(response.responseText);
                        prepareTimeData(resp);
                        time.inited = true;
                        time.loading = false;
                    }
                });
            });
        }
        let timerId = setInterval(function() {
            if (time.inited) {
                resolve(time);
                clearInterval(timerId);
            }
        }, 100);
    });


}

/**
 * Insert RtfBfq table
 */
function insertRtfBfqTable(time) {

    let content = '<table class="rtfbfq">';
    for (var typeId in time.types) {
        if (time.types.hasOwnProperty(typeId)) {
            let type = time['types'][typeId];
            content += "<tr><th align='left'>" + type.name + "</th><th>" + type.hours.toFixed(2) + "</th></tr>";

            for (var activity in type.activities) {
                if (type.activities.hasOwnProperty(activity)) {
                    let act = type['activities'][activity];
                    content += "<tr><td align='left' style=\"font-size: 12px;padding-left: 15px;\">" + act.name + '</td><td style=\"font-size: 12px;\"><a href="' + getTimeTrackerUrl(type.name, act.id) + '" target="_blank">' + act.hours.toFixed(2) + '</a></td>';

                }
            }


        }
    }
    content += '</table>';
    document.getElementById('rtfbfq').dataset.content = content;
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
    var baseUrl = location.origin + '/time_entries';
    var uri = '?utf8=✓&set_filter=1&sort=spent_on:desc&f[]=spent_on&op[spent_on]=*&f[]=issue_id&op[issue_id]=~&v[issue_id][]=' + issueID;
    if (typeof(filterByMe) !== 'undefined' && filterByMe) {
        uri += '&f[]=user_id&op[user_id]==&v[user_id][]=me';
    }
    if (typeof(tracker) !== 'undefined' && tracker) {
        uri += '&f[]=cf_12&op[cf_12]==&v[cf_12][]=' + tracker.replace('%', '%25');
    }
    if (typeof(activity) !== 'undefined' && activity) {
        uri += '&f[]=activity_id&op[activity_id]==&v[activity_id][]=' + activity;
    }
    uri += '&f[]=&c[]=project&c[]=spent_on&c[]=user&c[]=activity&c[]=issue&c[]=comments&c[]=hours&group_by=&t[]=hours&t[]=';
    return baseUrl + uri;
}

/**
 * Parse redmine hours data
 * @param data string
 * @returns string
 * @private
 */
function _parseRedmineHours(data) {
    var content = $($.parseHTML(data)).filter('.query-totals').text();
    var result = content.match(/\:\s([\.\d]{1,})/i);
    if (result) {
        return result[1];
    }
    return 0;
}

async function getApiKey() {
    if (GM_getValue('api_key')) {
        return GM_getValue('api_key');
    }
    let resp = await unsafeWindow.jQuery.ajax({
        url: '/my/api_key',

    });
    const apiKey = resp.match(/<pre>([a-z0-9]{40})<\/pre>/i);
    GM_setValue('api_key', apiKey[1]);
    return apiKey[1];
}

function logIssueHistory() {
    let history = GM_getValue('issue_history', []);
    history = history.filter(function(item) {
        return item.issueID != issueID;
    });
    history.unshift({
        'project': document.getElementsByTagName('h1')[0].innerText,
        'issueID': issueID,
        'name': document.getElementsByClassName('subject')[0].getElementsByTagName('h3')[0].innerText,
        'tracker': document.getElementsByTagName('h2')[0].innerText,
        'link': window.location.origin + window.location.pathname,
        'trackerClass': document.getElementsByClassName('issue')[0].className.match(/(tracker-[\d])/im)[0]
    });
    history.slice(0, 12);
    GM_setValue('issue_history', history);
}
function addHistoryToMenu() {
    let history = GM_getValue('issue_history', []);
    history = history.filter(function(item) {
        return item.issueID != issueID;
    });
    let output = '<ul class="menu-children">';

    for (let i = 0; i < Math.min(history.length, 10); i++) {
        let item = history[i];
        output += '<li class="issue ' + item.trackerClass + '">';
        output += '<a href="' + item.link + '">';

        output += item.name;
        output += '</br>';

        output += '<span class="id">' + item.issueID + '</span><span class="project">';
        output += item.project;
        output += '</span>';
        output += '</a>';
        output +='</li>';

    }
    output += '</ul>';
    $('#main-menu a.issues').parent().append(output);
}


if (isIssuePage) {
    //add buttons
    $(function() {
        isAssignedToMe = ($('#loggedas>a').attr('href') == $('div.assigned-to>div.value>a').attr('href'));
        myUserLink = $('#loggedas a').attr('href');
        myID = myUserLink.match(/(\d*)$/i)[0];
        currentStatus = $('div.status>div.value').html();
        token = $('meta[name="csrf-token"]').attr('content');
        $buttonsContainer = $('div#content>div.contextual');
        TEXT = ($('a.my-account').text() == 'My account') ? EN_TEXT : RU_TEXT;


        if (isAssignedToMe) {
            if (canStartProgress()) {
                addButton(getStartProgressText(), getStartProgressFunction() + '()', 'icon-play');
            } else if (currentStatus == STATUS.IN_PROGRESS.TEXT) {
                if (isOnReview()) {
                    addButton(TEXT.REVIEW_PASSED, 'reviewPassed()', 'icon-good');
                    showTimer();
                    addButton(TEXT.REVIEW_FAILED, 'reviewFailed()', 'icon-bad');
                } else if (isOnTesting()) {
                    addButton(TEXT.TEST_PASSED, 'testPassed()', 'icon-good');
                    showTimer();
                    addButton(TEXT.TEST_FAILED, 'testFailed()', 'icon-bad');
                } else {
                    addButton(TEXT.RESOLVE_ISSUE, 'resolveIssue()', 'icon-ok');
                    showTimer();
                    addButton(TEXT.FROZE_ISSUE, 'frozeProgress()', 'icon-froze');
                }
            } else if (canStartTest()) {
                addButton(getStartProgressText(), getStartProgressFunction() + '()', 'icon-play', 'glyphicon-play-circle');
            } else if (canClose()) {
                addButton(TEXT.CLOSE_ISSUE, 'closeIssue()', 'icon-lock');
            } else if (canDoReview()) {
                addButton(TEXT.START_REVIEW, 'startReview()', 'icon-play');
            }
        } else {
            addButton(TEXT.ASSIGN_TO_ME, 'assignToMe()', 'icon-user');
        }

        addMoreButton();
        showTotalRegularTime();
        showMyTime();
        addHideFormFieldsControl();
        initFormElements();
        logIssueHistory();
        //change link styles

        $('a.icon-edit').append('…');
    });

}
$(function() {
    if (document.getElementById('main-menu')) {
        addHistoryToMenu();

    }
});
if (isLogTimePage) {
    $(function() {
        $('#time_entry_activity_id').val(getDefaultActivity());
        $('#time_entry_custom_field_values_12').val(TIME_TYPE.REGULAR);
    });
}

if (!GM_getValue('user_role')) {
    unsafeWindow.showConfig();
}

if (!GM_getValue('version_4') && isIssuePage) {
    unsafeWindow.showVersion();
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
exportFunction(showVersion, unsafeWindow, {defineAs: "showVersion"});
exportFunction(getApiKey, unsafeWindow, {defineAs: "getApiKey"});


unsafeWindow.STATUS = cloneInto(STATUS, unsafeWindow);
unsafeWindow.ACTIVITIES = cloneInto(ACTIVITIES, unsafeWindow);
unsafeWindow.ROLES = cloneInto(ROLES, unsafeWindow);
unsafeWindow.FIELDS = cloneInto(FIELDS, unsafeWindow);
