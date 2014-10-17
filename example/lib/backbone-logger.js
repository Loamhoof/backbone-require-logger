// backbone-require-logger.js v1.0.0
// (c) 2014 MEDARD Soeren, distributed under the MIT license
// https://github.com/Loamhoof/backbone-require-logger
//
// Configurable logging system for Backbone.js

define(['backbone', 'underscore', 'backbone-logger-config'],
function(Backbone, _, config) {
	// Some IE hack to begin with
	if(console.log.apply === undefined) {
		['log', 'info', 'warn', 'error', 'assert', 'dir', 'clear', 'profile', 'profileEnd'].forEach(function(method) {
			console[method] = this.call(console[method], console);
		}, Function.prototype.bind);
	}

	// First step, check the config object
	var i, j, k, obj, ptr;
	var types = ['creations', 'methods', 'events', 'requests', 'names'];
	var rules = ['exclude', 'include'];
	var formats = {
		creations: function(n) {return 'new ' + n;},
		methods: function(n, m, c) {return n + '.' + m + ' called' + (c && config.cid) ? ' (' + c + ')' : '';},
		events: function(n, e, c) {return n + ' triggered ' + e + (c && config.cid) ? ' (' + c + ')' : '';},
		requests: function(n, t, c) {return n + ' requested a ' + t + (c && config.cid) ? ' (' + c + ')' : '';}
	};

	// Check the type of defined properties
	if(('active' in config) && !_.isBoolean(config.active)) {
		console.error('Incorrect configuration of active in logger config.');
	}
	if(('collapsed' in config) && !_.isBoolean(config.collapsed)) {
		console.error('Incorrect configuration of collapsed in logger config.');
	}
	if(('cid' in config) && !_.isBoolean(config.cid)) {
		console.error('Incorrect configuration of cid in logger config.');
	}
	if(('changeNames' in config) && !_.isFunction(config.changeNames)) {
		console.error('Incorrect configuration of changeNames in logger config');
	}

	for(i = 0; i < types.length; i++) {
		if((types[i] in config)) {
			if(!_.isObject(config[types[i]])) {
				console.error('Incorrect configuration of', types[i], 'in logger config.');
			}
			else {
				ptr = config[types[i]];
				if((('exclude' in ptr) && !_.isArray(ptr.exclude)) || (('include' in ptr) && !_.isArray(ptr.include))) {
					console.error('Incorrect configuration of exclude/include', types[i], 'in logger config.');
				}
				if((('excludeRe' in ptr) && !_.isRegExp(ptr.excludeRe)) || (('includeRe' in ptr) && !_.isRegExp(ptr.includeRe))) {
					console.error('Incorrect configuration of excludeRe/includeRe', types[i], 'in logger config.');
				}
				if(('active' in ptr) && !_.isBoolean(ptr.active)) {
					console.error('Incorrect configuration of active', types[i], 'in logger config.');
				}
				if(('format' in ptr) && !_.isFunction(ptr.format)) {
					console.error('Incorrect configuration of format', types[i], 'in logger config.');
				}
			}
		}
	}

	// Normalize the config object
	_.defaults(config, {
		active: true,
		collapsed: false,
		cid: false,
		changeNames: _.identity,
		names: {}
	});

	if(config.active) {

		for(i = 0; i < types.length; i++) {
			!config[types[i]] && (config[types[i]] = {});
			_.defaults(config[types[i]], {
				active: true,
				format: formats[types[i]]
			});

			// Transform the arrays into objects
			for(j = 0; j < rules.length; j++) {
				if(config[types[i]][rules[j]]) {
					obj = {};
					for(k = 0; k < config[types[i]][rules[j]].length; k++) {
						obj[config[types[i]][rules[j]][k]] = true;
					}
					config[types[i]][rules[j]] = obj;
				}
			}
		}

		// First step, modify require & define to gather information

		var map;
		(function() {

			// Try using Maps if they're available
			try {
				map = new Map;
			}
			catch(e) {
				console.warn('Your browser does not support Maps or the functionality is not activated.');
				console.info('This may result in backbone-require-logger slowing down the app.');
				console.info('To activate Maps in Chrome, go to chrome://flags and activate #enable-javascript-harmony');
				// Maps aren't available in the current browser
				// Switch to a slower version that mimics their API with Arrays
				// Using a closure to make "private variables" that the rest of the file don't need
				(function() {
					// Could maybe improve the perfs by splitting the arrays
					// But don't want to spend so much time on compatibility issues
					var keys = [], values = [];
					map = {};
					// Some helper
					map.getI = function(k) {
						var i, l = keys.length;
						for(i = l; i > -1; i--) {
							if(k == keys[i]) break;
						}
						return i;
					};
					// set
					map.set = function(k, v) {
						var i = this.getI(k);
						if(i == -1) {
							keys.push(k);
							values.push(v);
						}
						else {
							values[i] = v;
						}
					};
					// get
					map.get = function(k) {
						return values[map.getI(k)];
					};
					// has
					map.has = function(k) {
						return map.getI(k) != -1;
					};
				})();
			}

			var d = define, r = require, wrap;

			// Define the wrap function that will be used to wrap define & require callbacks
			wrap = function(deps, cb) {
				return function() {
					var i, l = arguments.length;
					for(i = 0; i < l; i++) {
						if(!map.has(arguments[i])) {
							map.set(arguments[i], config.changeNames(deps[i]));
						}
					}
					return cb && cb.apply(this, arguments);
				};
			};

			define = function() {
				var i, args;
				for(i = 0; i < 2; i++) {
					// Do something if and only if there's an array followed by a function
					if(_.isArray(arguments[i]) && _.isFunction(arguments[i + 1])) {
						break;
					}
				}

				// If i is 2, do nothing
				// Otherwise, use the wrapper
				if(i == 2) {
					return d.apply(this, arguments);
				}
				else {
					args = _.first(arguments, i + 1);
					args.push(wrap(arguments[i], arguments[i + 1]));
					args.push(_.rest(arguments, i + 2));
					return d.apply(this, args);
				}
			};

			require = function(deps, callback) {
				return r.apply(this, [deps, wrap(deps, callback)].concat(_.rest(arguments, 2)));
			};

			// Don't forget to rebind the attributes
			_.extend(define, d);
			_.extend(require, r);

		})();

		// Second step, change Backbone key functions to log what we want

		(function() {

			var group = config.collapsed ? 'groupCollapsed' : 'group';

			// Helper to check the include/exclude conditions
			var cache = {
				names: {},
				creations: {},
				methods: {},
				events: {},
				requests: {}
			};
			var check = function(key, name) {
				if(name in cache[key]){
					return cache[key][name];
				}
				var ptr = config[key];
				if((ptr.include && !ptr.include[name]) ||	(ptr.includeRe && !ptr.includeRe.test(name))) {
					return cache[key][name] = false;
				} else if((ptr.exclude && ptr.exclude[name]) ||	(ptr.excludeRe && ptr.excludeRe.test(name))) {
					return cache[key][name] = false;
				} else{
					return cache[key][name] = true;
				}
			};

			_.defaults(console, {
				group: console.log,
				groupCollapsed: console.log,
				groupEnd: _.noop
			});

			// For filtered names, replace the methods by a noop
			var noLog = {};
			_.defaults(noLog, {
				log: _.noop,
				group: _.noop,
				groupCollapsed: _.noop,
				groupEnd: _.noop
			});

			// Create a get function that returns either noLog or console
			var get = function(name) {
				return check('names', name) ? console : noLog;
			};

			// If objects creation logging hasn't been shut down
			// Override each constructor
			if(config.creations.active) {

				var C = Backbone.Collection, M = Backbone.Model, V = Backbone.View, R = Backbone.Router;

				var override = function(cst, name) {
					Backbone[name] = function() {
						var result, name = map.get(this.constructor), c = get(name);

						c[group](config.creations.format(name));
						result = cst.apply(this, arguments);
						c.groupEnd();

						return result;
					};
					_.extend(Backbone[name], cst);
					Backbone[name].prototype = cst.prototype;
				};

				if(check('creations', 'collection')){
					override(C, 'Collection');
				}
				if(check('creations', 'model')){
					override(M, 'Model');
				}
				if(check('creations', 'view')){
					override(V, 'View');
				}
				if(check('creations', 'router')){
					override(R, 'Router');
				}

			}

			// If the method logging hasn't been shut down
			// Loop over the properties to add the logs
			if(config.methods.active) {

				var extend = Backbone.Model.extend;
				Backbone.Model.extend =
				Backbone.Collection.extend =
				Backbone.View.extend =
				Backbone.Router.extend = function(protoProps, staticProps) {
					var method, p = {};
					for(method in protoProps) {

						// If the method logging for this particular method hasn't been shut down
						// Try to prevent accidental overriding of wrong functions
						// Like the model properties of collections
						// By checking if the function is also module
						if(typeof protoProps[method] == 'function' &&
							check('methods', method) &&
							!map.has(protoProps[method])) {

							(function(method) {
								p[method] = function() {
									var result, name = map.get(this) || map.get(this.constructor), c = get(name);

									c[group](config.methods.format(name, method, this.cid));
									result = protoProps[method].apply(this, arguments);
									c.groupEnd();

									return result;
								};
							})(method);

						}
						else {
							p[method] = protoProps[method];
						}
					}
					return extend.call(this, p, staticProps);
				};

			}

			// If the event logging hasn't been shut down
			if(config.events.active) {

				var trigger = Backbone.Events.trigger;
				Backbone.Collection.prototype.trigger =
				Backbone.Model.prototype.trigger =
				Backbone.View.prototype.trigger =
				Backbone.Router.prototype.trigger =
				Backbone.Events.trigger = function(e) {

					// If the event logging for this particular event hasn't been shut down
					if(check('events', e)) {
						var result, name = map.get(this) || map.get(this.constructor), c = get(name);

						c[group](config.events.format(name, e, this.cid));
						result = trigger.apply(this, arguments);
						c.groupEnd();

						return result;
					}
					else {
						return trigger.apply(this, arguments);
					}
				};

			}

			// If the server calls logging hasn't been shut down
			if(config.requests.active) {

				var sync = Backbone.sync;

				Backbone.sync = function(m) {

					// If the request logging for this particular method hasn't been shut down
					if(check('requests', m)) {
						var name = map.get(this) || map.get(this.constructor), c = get(name);

						c.log(config.requests.format(name, m, this.cid));
					}

					return sync.apply(this, arguments);
				};

			}

		})();

	}
});