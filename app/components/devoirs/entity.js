const Item = Backbone.Model.extend ({
  urlRoot: "api/devoirs",

  defaults: {
    nomOwner: "",
    idOwner: "",
    nom: "",
    description: "",
    dateDebut: "2000-01-01",
    dateFin: "2000-02-01",
  },

  toJSON() {
    return _.pick(this.attributes, 'id', 'idOwner', 'idClasse', 'nom', 'description', 'dateDebut', 'dateFin');
  },

  parse(data) {
    if (data.id) data.id = Number(data.id);
    data.idOwner = Number(data.idOwner);
    return data;
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
    if (!attrs.dateDebut) {
      errors.dateDebut = "Ne doit pas être vide";
    }
    if (!attrs.dateFin) {
      errors.dateFin = "Ne doit pas être vide";
    }
    if (attrs.dateDebut && attrs.dateFin && attrs.dateDebut > attrs.dateFin) {
      errors.dateFin = "La date de fin doit être postérieure à la date de début";
    }

    if (!_.isEmpty(errors)) {
      return errors;
    }
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
  url: "api/devoirs",
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



export { Item, Collection };