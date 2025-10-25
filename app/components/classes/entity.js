const d = new Date();
const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const Item = Backbone.Model.extend ({
  urlRoot: "api/classes",
  defaults: {
    nomOwner: "",
    idOwner:"",
    nom: "",
    description: "",
    ouverte: false,
    pwd:"",
    expiration: today,
    date: today
  },
  
  parse(data) {
    if (typeof data.ouverte === "string") {
      data.ouverte = (Number(data.ouverte) === 1);
    }
    data.idOwner = Number(data.idOwner);
    return data;
  },

  validate(attrs, options) {
    const errors = {};
    if (!attrs.nom) {
      errors.nom = "Ne doit pas être vide";
    } else {
      /*if (attrs.nom.length < 3) {
        errors.nom = "Trop court";
      }*/
    }
    if (!attrs.expiration) {
      errors.expiration = "Ne doit pas être vide";
    }
    if (!_.isEmpty(errors)) {
      return errors;
    }
  },

  testClasseMdp(mdp) {
    const promise = $.ajax(`api/classes/${this.get('idClasse')}/test`, {
      data: {
        pwd: mdp
      },
      dataType: "json",
      method: "GET"
    });
    return promise;
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
  url: "api/classes",
  model: Item,
  comparator: "nom",

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

export { Collection, Item }
