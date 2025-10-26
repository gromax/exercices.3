const Item = Backbone.Model.extend ({
  urlRoot: "api/exodevoirs",

  defaults: {
    idDevoir: "",
    idExo: "",
    options: ""
  },

  parse(data) {
    if (data.id) data.id = Number(data.id);
    data.idExo = Number(data.idExo);
    data.idDevoir = Number(data.idDevoir);
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
  url: "api/exodevoirs",
  model: Item,
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

export { Item, Collection };