(function() {
	var template = {
	'todo': Handlebars.compile($('#todo').remove().html()),
	'edit_form': Handlebars.compile($('#todo_edit').remove().html()),
};
	
	Handlebars.registerHelper('shorten', function(name) {
		var shorten;
		
		shorten = name.length > 10 ? name.slice(0, 10) + '...' : name;
		return shorten;
	});

	var Todo = Backbone.Model.extend({
		defaults: {
			complete: false,
		},
		initialize: function() {
			this.collection.incrementId();
			this.set('id', this.collection.lastId);
		},
	});

	var Todos = Backbone.Collection.extend({
		model: Todo,
		lastId: 0,
		incrementId: function() {
			this.lastId++;
		},
	});

	var TodoView = Backbone.View.extend({
		tagName: 'li',
		template: template.todo,
		events: {
			"click": "edit",
			"click a.toggle": "toggleComplete",
			"click a.delete": "delete",
		},
		toggleComplete: function(e) {
			e.preventDefault();

			var id = +this.$el.data('id'),
					model = App.Todos.findWhere({id: id});

			model.set('complete', !model.get('complete'))
		},
		delete: function(e) {
			e.preventDefault();

			var id = +this.$el.data('id'),
					model = App.Todos.findWhere({id: id});

			App.Todos.remove(model);
		},
		edit: function(e) {
			if (!$(e.target).is('li')) {
				return;
			}

			var id = +this.$el.data('id'),
					model = App.Todos.findWhere({id: id}),
					edit_form = template.edit_form,
					$edit_view = $(edit_form(model.toJSON())),
					$form_input = $edit_view.find('input');

			this.$el.replaceWith($edit_view);
			this.undelegateEvents();
			$form_input.focus();
			$form_input.val($form_input.val());

			$edit_view.on('blur', 'input', {edit_view: $edit_view}, this.update.bind(this));
		},
		update: function(e) {
			var $target = $(e.target),
					id = $target.closest('li').data('id'),
					$edit_view = e.data.edit_view,
					todo = $target.val();

			this.model.set('name', todo);
			$edit_view.replaceWith(this.$el);

			this.delegateEvents();
		},
		render: function() {
			var json = this.model.toJSON();

			this.$el.attr("data-id", json.id);
			this.$el.html(this.template(json));
		},
		initialize: function() {
			this.render();

			this.listenTo(this.model, 'remove', this.remove);
			this.listenTo(this.model, 'change', this.render);
		}
	});

	var TodosView = Backbone.View.extend({
		el: $('ul#todos')[0],
		tagName: 'li',
		render: function() {
			this.$el.empty();

			this.collection.models.forEach(function(model) {
				var view = new TodoView({model: model});

				if (model.get('complete')) {
					view.$el.attr('class', 'complete');
				}

				this.$el.append(view.$el);
			}.bind(this));
		},
		sortByComplete: function() {
			this.collection.comparator = 'complete';
			this.collection.sort();

			this.render();
		},
		initialize: function() {
			this.listenTo(this.collection, 'add change', this.sortByComplete);
		},
	});

	var App = {
		$el: $('ul#todos'),
		init: function() {	
			this.Todos = new Todos();

			this.TodosView = new TodosView({collection: this.Todos});

			this.bind();
		},
		bind: function() {
			$('form').on('submit', this.addTodo.bind(this));
			$('#clear').on('click', this.clearComplete.bind(this));
		},
		addTodo: function(e) {
			e.preventDefault();

			var todo = $(e.target).find('input').val();

			this.Todos.add({name: todo});

			e.target.reset();
		},
		clearComplete: function(e) {
			e.preventDefault();
			var not_completes = this.Todos.where({complete: false});

			this.Todos.set(not_completes);
		},
	};

	App.init();
}());