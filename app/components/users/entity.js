import { MyModel, MyCollection } from "../common/entity";
import Ranks from "../common/ranks";

const Item = MyModel.extend ({
  urlRoot: "api/users",
  defaults: {
    prenom: "",
    nom: "",
    email: "",
    nomClasse: "N/A",
    rank: Ranks.DISCONNECTED,
    pref: { mathquill: true }
  },
  
  toString() {
    const id = this.get('id') ? `#${this.get('id')} :` : "";
    return `${id} ${this.get("prenom")} ${this.get("nom")}`;
  },

  toJSON() {
    const output = _.clone(_.omit(this.attributes, "pref"));
    if (this.attributes.pref !== false) {
      output.pref = JSON.stringify(this.attributes.pref);
    }
    return output;
  },

  parse(data) {
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
    data.isEleve = (data.rank === "eleve");
    if (typeof data.pref === "string" && data.pref !== "") {
      data.pref = JSON.parse(data.pref);
    } else {
      data.pref = { mathquill: true };
    }
    if (typeof data.rank != "undefined" ){
      data.rank = Number(data.rank);
    }

    return data;
  },

  validate(attrs, options) {
    const errors = {};
    if (this.get("rank") === "root") {
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
      } else if (attrs.nom.length < 2) {
        errors.nom = "Trop court";
      }
    }
    if (attrs.pwd && attrs.pwdConfirm && (attrs.pwd != attrs.pwdConfirm)) {
      errors.pwdConfirm = "Les mots de passe sont différents.";
    }
    if (!_.isEmpty(errors)) {
      return errors;
    }
  },
});

const Collection = MyCollection.extend({
  url: "api/users",
  model: Item,
  comparator: "nomComplet",
});

export { Item, Collection }
