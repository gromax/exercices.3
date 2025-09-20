const Item = Backbone.Model.extend({
  urlRoot: "api/exercices",
  defaults: {
    title: "Titre de l'exercice",
    description: "Description de l'exercice",
    keywords: [],
    options: {},
    code: {}
  },

  parse(data) {
    if (data.id) {
      data.id = Number(data.id);
    }
    if (data.keywords) {
      data.keywords = data.keywords.split(',').map(kw => kw.trim());
    }
    data.options = JSON.parse(data.options || '{}');
    data.code = JSON.parse(data.code || '{}');
    return data;
  },
});


const Collection = Backbone.Collection.extend({
  url: "api/exercices",
  model: Item,
  comparator: "title"
});

export { Item, Collection }
