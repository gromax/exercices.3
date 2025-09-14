const Item = Backbone.Model.extend ({
  urlRoot: "api/users",
  defaults: {
    prenom: "",
    nom: "",
    email: "",
    nomClasse: "N/A",
    rank: "Off"
  },
  toJSON: () => {
    const output = _.clone(_.omit(this.attributes, "pref"));
    if (this.attributes.pref !== false) {
      output.pref = JSON.stringify(this.attributes.pref);
    }
    return output;
  },
  parse: (data) => {
    if (data.id) {
      data.id = Number(data.id);
    }
    if (data.idClasse) {
      data.idClasse = Number(data.idClasse);
    }
    if (data.nomClasse === null) {
      data.nomClasse = "N/A";
    }
    data.nomComplet = `${data.nom} ${data.prenom}`;
    data.isEleve = (data.rank === "Élève");
    if (typeof data.pref === "string" && data.pref !== "") {
      data.pref = JSON.parse(data.pref);
    } else {
      data.pref = false;
    }
    return data;
  },
  testClasseMdp: (mdp) => {
    const promise = $.ajax(`api/classes/${this.get('idClasse')}/test`, {
      data: {
        pwd: mdp
      },
      dataType: "json",
      method: "GET"
    });
    return promise;
  },
  validate: (attrs, options) => {
    const errors = {};
    if (this.get("rank") === "Root") {
      errors.email = "Root ne peut être modifié";
    } else {
      if (typeof attrs.pwd !== "undefined" && typeof attrs.pwdConfirm !== "undefined" && attrs.pwd !== attrs.pwdConfirm) {
        errors.pwdConfirm = "Les mots de passe sont différents.";
      }
      if (!attrs.prenom) {
        errors.prenom = "Ne doit pas être vide";
      }
      if (!attrs.nom) {
        errors.nom = "Ne doit pas être vide";
      } else {
        if (attrs.nom.length < 2) {
          errors.nom = "Trop court";
        }
      }
    }
    if (!_.isEmpty(errors)) {
      return errors;
    }
  }
});

const Collection = Backbone.Collection.extend({
  url: "api/users",
  model: Item,
  comparator: "nomComplet"
});

export { Item, Collection }
