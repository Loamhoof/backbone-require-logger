define(['backbone', 'collection', 'collection-view'], function(Backbone, Collection, CollectionView) {
	var Router = Backbone.Router.extend({
		initialize: function() {
			Backbone.history.start();
		},
		hello: function() {
			console.log('Hello World!');
		},
		routes: {
			'*path': 'default'
		},
		default: function() {
			var c = new Collection;
			new CollectionView({
				collection: c
			});
			c.fetch({
				error: function() {
					// To prevent cross-origin failures...
					c.set([{"I": "don't"}, {"know": "what"}, {"to": "write."}]);
					c.trigger('sync');
				}
			});
		}
	});

	return new Router;
});