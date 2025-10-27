const Item = Backbone.Model.extend ({
  urlRoot: "api/exodevoirs",

  defaults: {
    idDevoir: "",
    idExo: "",
    options: "",
    idOwner: 0,
    idClasse: 0,
    num: 0
  },

  toString() {
    const id = this.get('id') ? `#${this.get('id')} :` : "";
    return `${id} ${this.get("title")}`;
  },

  parse(data) {
    if (data.id) data.id = Number(data.id);
    data.idExo = Number(data.idExo);
    data.idDevoir = Number(data.idDevoir);
    data.num = Number(data.num);
    data.idOwner = Number(data.idOwner);
    data.idClasse = Number(data.idClasse);
    return data;
  },

  toJSON() {
    return _.pick(this.attributes, 'id', 'idDevoir', 'idExo', 'options', 'num');
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