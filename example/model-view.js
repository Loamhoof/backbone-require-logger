define(['backbone'], function(Backbone) {
	return Backbone.View.extend({
		tagName: 'li',
		initialize: function() {
			this.listenTo(this.model, {
				'change': this.onChange,
				'change:clickCount': this.onClickCountChange
			});
		},
		render: function() {
			this.$el.html(JSON.stringify(this.model.toJSON()));
			return this;
		},
		onChange: function() {
			console.log('Changes detected!');
		},
		onClickCountChange: function(_, val) {
			this.$el.html(JSON.stringify(this.model.toJSON()));
		},
		events: {
			click: 'onClick',
		},
		onClick: function() {
			this.model.set('clickCount', this.model.get('clickCount') + 1);
		}
	});
});