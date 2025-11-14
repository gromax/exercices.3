import { MyModel, MyCollection } from "../common/entity";
import Ranks from "../common/ranks";

const Item = MyModel.extend ({
  urlRoot: "api/users",
  defaults: {
    prenom: "",
    nom: "",
    email: "",
    nomClasse: "",
    rank: Ranks.DISCONNECTED
  },
  
  toString() {
    const id = this.get('id') ? `#${this.get('id')} :` : "";
    return `${id} ${this.get("prenom")} ${this.get("nom")}`;
  },

  toJSON() {
    return _.pick(this.attributes, "nom", "prenom", "email", "rank", "idClasse", "pwd", "classeMdp");
  },

  isRoot() {
    /* Renvoie true si l'utilisateur est root */
    return (this.get("rank") === Ranks.ROOT);
  },

  isAdmin() {
    /* Renvoie true si l'utilisateur est admin (ou root) */
    let rank = this.get("rank");
    return (rank === Ranks.ROOT) || (rank === Ranks.ADMIN);
  },

  isProf() {
    /* Renvoie true si l'utilisateur est prof (et pas eleve ni off) */
    return (this.get("rank") === Ranks.PROF);
  },

  isEleve() {
    /* Renvoie true si l'utilisateur est eleve (et pas prof ni off) */
    return (this.get("rank") === Ranks.ELEVE);
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
    if (typeof data.rank != "undefined" ){
      data.rank = Number(data.rank);
      data.rankName = Ranks.getLabel(data.rank);
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
