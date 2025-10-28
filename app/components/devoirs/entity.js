const Item = Backbone.Model.extend ({
  urlRoot: "api/devoirs",

  defaults: {
    nomOwner: "",
    idOwner: "",
    nom: "",
    description: "",
    dateDebut: "2000-01-01",
    dateFin: "2000-02-01",
    timeleft:null
  },

  toString() {
    const id = this.get('id') ? `#${this.get('id')} :` : "";
    return `${id} ${this.get("nom")} ${this.get("description")}`;
  },

  toJSON() {
    return _.pick(this.attributes, 'id', 'idOwner', 'idClasse', 'nom', 'description', 'dateDebut', 'dateFin');
  },

  /**
   * Retourne le temps restant entre now et la date fournie (yyyy-mm-dd).
   * Par défaut on considère la fin du jour (23:59:59.999) de la date.
   * Renvoie un objet { totalMs, days, hours, minutes, seconds, toString() }.
   * @param {string} dateStr Date au format 'yyyy-mm-dd'
   * @param {boolean} endOfDay Si true (par défaut), considère la fin de la journée
   * @return {int} nombre de millisecondes entre now et la date cible
   */
  computeTimeFromNowToDate(dateStr, endOfDay = true) {
    if (!dateStr) return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, toString(){ return '0:00:00'; } };
    // parser en local : nouvelle Date(y, m-1, d, hh, mm, ss)
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = endOfDay
      ? new Date(y, m - 1, d, 23, 59, 59, 999)
      : new Date(y, m - 1, d, 0, 0, 0, 0);

    const now = new Date();
    let diff = target - now;
    return diff;
  },

  computeTimeLeft(debut, fin) {
    if (!debut || !fin) return null;
    const nowToDebut = this.computeTimeFromNowToDate(debut, false);
    if (nowToDebut > 0) {
      // pas encore commencé
      return null;
    }
    const nowToFin = this.computeTimeFromNowToDate(fin, true);
    if (nowToFin <= 0) {
      // déjà fini
      return null;
    }
    return nowToFin;
  },

  parse(data) {
    if (data.id) data.id = Number(data.id);
    data.timeleft = this.computeTimeLeft(data.dateDebut, data.dateFin);
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