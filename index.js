'use strict';
var npm = require('npm');
var _ = require('lodash');
var semver = require('semver');
var util = require('util');
var Slack = require('node-slackr');

var DEFAULT_OPTIONS = {
  depth: 0,
  color: 'warning',
  ignorePreReleases: true,
  ignoredModules: [],
  channel: '#general',
  username: 'npm-outdated'
};


/**
 * Goes through the list and returns a nicer object and removes ignored stuff
 * @param list the raw list returned by npm outdated
 * @param options the an options object. It can have the ignoredModules and ignorePreReleases properties
 */
function convertOutdatedList(list, options) {
  var out = {};
  list.forEach(function(p) {
    var ignoredModule = _.contains(options.ignoredModules, p[1]);
    var shouldIgnorePreRelease = options.ignorePreReleases && semver.parse(p[4]).prerelease.length !== 0;

    if (!shouldIgnorePreRelease && !ignoredModule) {
      var currentVersion = p[2];
      var wantedVersion = p[3];
      var latestVersion = p[4];
      var severity = 'patch';
      if (semver.major(latestVersion) > semver.major(currentVersion)) {
        severity = 'major';
      } else if (semver.minor(latestVersion) > semver.minor(currentVersion)) {
        severity = 'minor';
      }

      out[p[1]] = {
        current: currentVersion, wanted: wantedVersion, latest: latestVersion, severity: severity
      };
    }
  });
  return out;
}

function sendToSlack(outdated, options) {

  var slack = new Slack(options.webhook, {
    channel: options.channel,
    username: options.username,
    icon_emoji: ':ghost:'
  });

  var outdatedModules = _.keys(outdated).sort();
  outdatedModules = _.sortBy(outdatedModules, function(moduleName) {
    return outdated[moduleName].severity;
  });

  var message = util.format('*npm outdated*: There are *%s* modules out of date in _%s_', outdatedModules.length, options.project);
  var fields = [];
  var attachments = [];
  outdatedModules.forEach(function(moduleName) {
    var moduleStatus = outdated[moduleName];
    var outdatedText = util.format('%s -> *%s*', moduleStatus.current, moduleStatus.latest);
    var color = '#439FE0';
    if (moduleStatus.severity == 'major') {
      color = 'danger';
    } else if (moduleStatus.severity === 'minor') {
      color = 'warning';
    }
    attachments.push({
      fallback: outdatedText,
      color: color,
      mrkdwn_in: ['fields', 'text'],
      text: outdatedText,
      title: moduleName,
      title_link: 'https://www.npmjs.com/package/' + moduleName
    });
    fields.push({
      title: moduleName,
      value: util.format('%s -> *%s*', moduleStatus.current, moduleStatus.latest),
      short: true
    });
  });

  var messages = {
    text: message,
    channel: options.channel,
    mrkdwn: true,
    attachments: attachments
  };


  slack.notify(messages, function(err, result) {
    if (err) {
      console.err(err, result);
    }
  });
}
function report(options, callback) {
  if (!options) {
    throw new Error('No options specified');
  }

  options = _.merge(DEFAULT_OPTIONS, options);

  npm.load({
    depth: options.depth,
    json: true
  }, function() {
    npm.outdated(function(err, res) {
      if (!res || !res.length) {
        if (callback) {
          callback(null);
        }
        return;
      }

      var outdated = convertOutdatedList(res, options);
      if (!_.isEmpty(outdated)) {
        sendToSlack(outdated, options);
      }
    });

  });
}

module.exports = report;