const Item = Backbone.Model.extend ({
  urlRoot: "api/classes",
  defaults: {
    nomOwner: "",
    idOwner:"",
    nom: "",
    description: "",
    ouverte: false,
    pwd:""
  },
  parse(data) {
    if (typeof data.ouverte === "string") {
      data.ouverte = (Number(data.ouverte) === 1);
    }
    data.idOwner = Number(data.idOwner);
    return data;
  },
  fill(liste) {
    console.log(liste);
    const promise = $.ajax(`api/classe/${this.get('id')}/fill`, {
      data: { liste: liste },
      dataType: "json",
      method: "POST"
    });
    return promise;
  },

  validate(attrs, options) {
    const errors = {};
    if (!attrs.nom) {
      errors.nom = "Ne doit pas être vide";
    } else {
      if (attrs.nom.length < 2) {
        errors.nom = "Trop court";
      }
    }
    if (!_.isEmpty(errors)) {
      return errors;
    }
  },

  sync(method, model, options) {
    options = options || {};
    const token = localStorage.getItem('jwt');
    console.log("Token dans users.js :", token);
    options.beforeSend = function (xhr) {
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
    };
    return Backbone.sync(method, model, options);
  }
});

const Collection = Backbone.Collection.extend({
  url: "api/classes",
  model: Item,
  comparator: "nom",

  sync(method, model, options) {
    options = options || {};
    const token = localStorage.getItem('jwt');
    console.log("Token dans users.js :", token);
    options.beforeSend = function (xhr) {
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
    };
    return Backbone.sync(method, model, options);
  }
});

export { Collection, Item }
