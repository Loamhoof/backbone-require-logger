define(['backbone'], function(Backbone) {
	return Backbone.Model.extend({
		defaults: {
			clickCount: 0
		}
	});
});