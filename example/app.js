require.config({
	paths: {
		backbone: 'lib/backbone',
		underscore: 'lib/underscore',
		jquery: 'lib/jquery',
		'backbone-logger': 'lib/backbone-logger',
		'backbone-logger-config': 'lib/backbone-logger-config'
	}
});

// Have to do it in 2 steps
require(['backbone-logger'], function() {
	require(['router'], function(router) {
		router.hello();
	});
});