npm-outdated-hipchat
====================

A small utility to report the result of npm outdated to a slack channel. If you want your CI server to report what module dependencies are outdated to your slack channel this tool is for you.


# Usage

You can use this on the command line. All you have to do is run the following from your project's directory
```
npm install npm-outdated-slack -g
npm-outdated-slack --project your_project_name --webhook your_slack_webhook --channel your_slack_channel_name (#dev|#someotherroom|@someusername)
```

And you will get a message in your slack room like the following:
```
your_project_name
express (3.5.0 -> 4.9.4)
```
If you have a dependency to epxress set at 3.5.0 and 4.9.4 is available.

## Options

You can specify some options on the command-line:

* project
  *  *Required*. You need to specify the name of your project
* webhook
  *  *Required*. The Slack webhook used for this.
* channel
  *  *Required*. The Name of your slack channel. **Note**: This can also be specified as an environment variable, using NPM_OUTDATED_SLACK_WEBHOOK.
*  depth
  *  Max depth for checking dependency tree. See the documentation for [npm outdated](https://www.npmjs.org/doc/cli/npm-outdated.html). default value: 0
* ignorePreReleases
  *  If the latest version is a pre-release, it is ignored. default value: true
* ignoredModules
  *  A comma-separated list of modules to ignore from the check