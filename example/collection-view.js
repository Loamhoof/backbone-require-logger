define(['backbone', 'model-view'], function(Backbone, ModelView) {
	return Backbone.View.extend({
		el: '#collection-view',
		initialize: function() {
			this.listenTo(this.collection, 'sync', this.render);
		},
		render: function() {
			var frag = document.createDocumentFragment();

			this.collection.each(function(model) {
				frag.appendChild(this.renderOne(model).el);
			}, this);

			this.$el.html(frag);
		},
		renderOne: function(model) {
			return (new ModelView({
				model: model
			})).render();
		}
	});
});