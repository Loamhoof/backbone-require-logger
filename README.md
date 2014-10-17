backbone-require-logger
=======================

Goal
----
This plugin aims to give the developers a logging system for Backbone.js to ease debugging. As such, it provides configurable, automatic logs written directly in the console. As it's simply a debugging tool, a version to replace the source file when building your app is also included.  
It will only work with the AMD loader require.js.

Usage
-----
The plugin is loaded via require.js and needs to be loaded before any module using Backbone is. Basically, include it before anything else:

> require(['backbone-logger'], function() {
>   // Your other require calls here
> });

The file `backbone-logger` also tries to load 3 modules: `backbone`, `underscore`, `backbone-logger-config`. In order to make it work, you have to make sure those paths are defined in your require config call.

Doing so will do the necessary changes to require.js and Backbone functions to enable the logs.

Options
------

You can specify a number of options in the config file. All available options are included and commented out in the commited configuration file. Here are all of them:
* `active`
  * `type`: `boolean`
  * `default`: `true`
  * `description`: Set the value to `false` to deactivate completely the logger.
* `collapsed`
  * `type`: `boolean`
  * `default`: `false`
  * `description`: Set the value to `true` to use the `groupCollapsed` method of the `console` instead of `group`.
* `cid`
  * `type`: `boolean`
  * `default`: `false`
  * `description`: Set the value to `true` to display the `cid` attribute in the logs when it's available.
  * `note`: Because of code matters, the `cid` is never available when logging the creation of an object, though it's available in the `initialize` method log. It's possible to remove the logging of object creations, and use the one of the `initialize` method instead.
* `changeNames`
  * `type`: `function`
  * `default`: `identity`
  * `description`: Allows the user to change the name of the modules. The default names are the paths used in require.js to load the modules. You can for example used this option to change *models/myModel* to *myModel*. An example is available in the config file.
* `names`
  * `type`: `object`
  * `default`: `{}`
  * `description`: Contains the options allowing to filter modules based on their names.
  * `sub-options`:
    * `exclude`
      * `type`: `array`
      * `default`: `Ø`
      * `description`: Logs of modules specified in this array will entirely be removed.
    * `excludeRe`
      * `type`: `regexp`
      * `default`: `Ø`
      * `description`: Logs of modules matching this regular expression will entirely be removed.
    * `include`:
      * `type`: `array`
      * `default`: `Ø`
      * `description`: Logs of modules not specified in this array will entirely be removed.
    * `includeRe`:
      * `type`: `regexp`
      * `default`: `Ø`
      * `description`: Logs of modules not matching this regular expressionwill entirely be removed.
    * `note` regarding `exclude`/`excludeRe`/`include`/`includeRe`: The system will first check if the module is in the _include_ options if those are specified, then check if it's in the _exclude_ options.
* `creations`/`methods`/`events`/`requests`
  * `type`: `object`
  * `default`: `{}`
  * `description`: Options regarding the logging of creation of objects, method calls, event triggers and server requests. All of those options have the same sub-options available. The content of those options is still related to the parent-option.
  * `sub-options`:
    * `active`
      * `type`: `boolean`
      * `default`: `true`
      * `description`: Set the value to `false` to completely remove this kind of logs.
    * `format`
      * `type`: `function`
      * `default`: Dependant of the parent-option... For creations: `function(n) {return 'new ' + n;}`
      * `description`: You can specify a function here to change the way the logs look like. Arguments received by the function depends on the parent-option. The first is always the name of the module. The second can be: the method name, the event name or the type of request. For those 3 parent-option, the third is the cid when available (always passed as argument, even when the `cid` option is set to `false` - this option is only useful when default formats are used).
    * `exclude`/`excludeRe`/`include`/`includeRe`: Those are the same than for the `names` options, except that they're related to their parent-option. For example, setting `excludeRe` of `events` to `/^change:/` will exclude any attribute change event of the logs. Another example, setting `exclude` of `methods` to `['initialize']` will exclude `initialize` calls when objects are created (instead of having both the creation log and the initialize call log).
