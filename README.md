Oggetto Web Redmine Improvements
================================

Oggetto Web Redmine Improvement Greasemonkey/Tampermonkey User Script

## Installation

### Step 1
Install Greasemonkey or Tampermonkey for your browser:

<a class="btn btn-sm js-menu-target css-truncate" href="https://addons.mozilla.org/ru/firefox/addon/greasemonkey/"><span class="octicon octicon-browser"></span>Mozilla Firefox</a>

<a class="btn btn-sm js-menu-target css-truncate" href="https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo"><span class="octicon octicon-browser"></span>Google Chrome</a>

### Step 2

Install script to your browser.

<a class="btn btn-sm js-menu-target css-truncate" href="https://github.com/obukhow/oggetto_redmine_improvements/raw/master/ori.user.js"><span class="octicon octicon-browser"></span>Install</a>


![Redmine Improvement Image](http://i.imgur.com/IYRWTC7.jpg)

![Redmine Improvement Image](http://i.imgur.com/6g2dQ74.jpg)

Features
--------

* Oggetto Redmine workflow particular support (Start Progress|Continue -> Froze|Resolve Issue -> Review Pased|Review Failed -> Test Passed|Test Failed -> Closed)
* Quick Issue updates in a popup for the workflow
* One-click "Assign to me"
* Easy select for asignee with text-filter (uses [Select2](http://ivaynberg.github.io/select2/))
* Flag to hide obligatory fields from issue update form
* User role configuration and separate workflows for each role
* Default value for Log time "Activity" according to user role
* Default value for Log time "Time" is "Regular"
* In progress time counter (+ pause/resume). Fills the "Spent time" field on resolve issue
* Click on timer to log time and reset counter
* Adds total regular time, shows time "Spent by me" with "Regular" and "Fuckup" trackers

Roadmap
-------

* ~~In progress time counter (+ pause/resume)~~
* My recent issues menu
* ~~Review passed/Review failed buttons to workflow~~
* ~~User role configuration and separate workflows for each role~~
* Comment markup preview in popup
* ~~Fix double toolbar~~
* Log time update in a popup
