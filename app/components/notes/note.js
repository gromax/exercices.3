import { MyModel, MyCollection } from "../common/entity.js";
import Misc from "../common/misc.js";

const Item = MyModel.extend ({
  urlRoot: "api/notes",
  readOnly: true,

  defaults: {
    nom:"", // nom du devoir
    idOWner: null, // id du créateur du devoir
    idClasse: null, // id de la classe du devoir
    idDevoir: null, // id du devoir
    idUser:null, // id de l'élève
    nomClasse:"", // nom de la classe du devoir
    nomOwner:"", // nom du créateur du devoir
    nomUser:"", // nom de l'élève
    prenomUser:"", // prénom de l'élève
    dateDebut:"", // date de début du devoir
    dateFin:"", // date de fin du devoir
    note:0, // note de l'élève
    actif: true, // si le devoir est actif ou non
    timeLeft: null, // temps restant pour rendre le devoir
    exoCount:0 // nombre d'exercices liés
  },

  toString() {
    return `Note de ${this.get("prenomUser")} ${this.get("nomUser")} pour le devoir ${this.get("nom")} : ${this.get("note")} pts`;
  },

  parse(data) {
    data.idOwner = Number(data.idOwner);
    data.idDevoir = Number(data.idDevoir);
    data.idUser = Number(data.idUser);
    data.isClasse = Number(data.isClasse);
    data.note = Number(data.note);
    data.actif = Boolean(data.actif);
    data.exoCount = Number(data.exoCount);
    data.timeLeft = Misc.computeTimeLeft(data.dateDebut, data.dateFin);
    data.actif = (data.timeLeft !== null);
    return data;
  },
});

const Collection = MyCollection.extend({
  url: "api/notes",
  model: Item,
});

export { Item, Collection };