const Item = Backbone.Model.extend({
  urlRoot: "api/assosUF",
  defaults: {
    nomUser: "",
    prenomUser: "",
    idUser: 0,
    idFiche: 0,
    actif:false
  },

  parse(data) {
    if (data.id) {
      data.id = Number(data.id);
    }
    data.idUser = Number(data.idUser);
    data.idFiche = Number(data.idFiche);
    if (data.nomUser) {
      data.nomCompletUser = `${data.nomUser} ${data.prenomUser}`;
    } else {
      data.nomUser = "";
    }
    data.actif = (data.actif === "1") || (data.actif === 1) || (data.actif === true);
    if (data.notation) {
      // notation est transmis pour un chargement élève
      data.notation = Number(data.notation);
    } else {
      data.notation = 0;
    }
    if (data.ficheActive) {
      data.ficheActive = (data.ficheActive === "1") || (data.ficheActive === 1) || (data.ficheActive === true);
    }
    return data;
  },

  toJSON() {
    return _.pick(this.attributes, "idUser", "idFiche", "actif");
  },

  getCoeffs(aEFsCollec) {
    const exercices_coeff = {};
    if (aEFsCollec) {
      const models = aEFsCollec.models;
      models.forEach(item => {
        exercices_coeff[item.get("id")] = { coeff: item.get("coeff"), num: item.get("num") };
      });
    }
    return exercices_coeff;
  },

  calcNote(aEFs_models_array, notes_json_array, notation) {
    // notation = système de notation
    if (!notation) notation = this.get("notation"); // si notation n'est pas fourni, on prend celui donné par le modele
    const total = aEFs_models_array.reduce((memo, item) => {
      const notes_of_EF = _.where(notes_json_array, { aEF: item.get("id") });
      return item.calcNote(notes_of_EF, notation) * item.get("coeff") + memo;
    }, 0);

    const totalCoeff = aEFs_models_array.reduce((memo, item) => {
      return item.get("coeff") + memo;
    }, 0);
    return Math.ceil(total / totalCoeff);
  }
});

const Collection = Backbone.Collection.extend({
  url: "api/assosUF",
  model: Item,

  getNumberForEachUser() {
    return _.countBy(this.models, (m) => m.get("idUser"));
  }
});

export { Item, Collection }
