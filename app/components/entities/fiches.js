const Item = Backbone.Model.extend ({
  urlRoot: "api/fiches",

  defaults: {
    nomOwner: false,
    idOwner: "",
    nom: "",
    description: "",
    visible: false,
    actif: false,
    notation: 0,
    date: "2000-01-01",
  },

  toJSON() {
    return _.pick(this.attributes, 'id', 'idOwner', 'nom', 'description', 'visible', 'actif', 'notation');
  },

  parse(data) {
    if (data.id) data.id = Number(data.id);
    data.idOwner = Number(data.idOwner);
    data.notation = Number(data.notation);
    data.actif = (data.actif === "1") || (data.actif === 1) || (data.actif === true);
    data.visible = (data.visible === "1") || (data.visible === 1) || (data.visible === true);
    return data;
  },

  validate(attrs, options) {
    errors = {};
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
  }
});

const Collection = Backbone.Collection.extend({
  url: "api/fiches",
  model: Item,
  comparator: "nom"
});


export { Item, Collection }
