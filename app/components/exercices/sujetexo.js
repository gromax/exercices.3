const Item = Backbone.Model.extend({
  urlRoot: "api/exercices",
  defaults: {
    title: "Titre de l'exercice",
    description: "Description de l'exercice",
    keywords: "",
    options: "",
    code: "",
    init: ""
  },

  toString() {
    const id = this.get('id') ? `#${this.get('id')} :` : "";
    return `${id} ${this.get("title")}`;
  },

  parse(data) {
    if (data.id) {
      data.id = Number(data.id);
    }
    data.options = data.options;
    data.code = data.code;
    return data;
  },

  sync(method, model, options) {
    options = options || {};
    const token = localStorage.getItem('jwt');
    options.beforeSend = function (xhr) {
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
    };
    return Backbone.sync(method, model, options);
  }
});


const Collection = Backbone.Collection.extend({
  url: "api/exercices",
  model: Item,
  comparator: "title"
});

export { Item, Collection }
