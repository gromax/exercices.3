import { MnObject } from 'backbone.marionette';
import { MyModel } from './common/entity.js';

const Controller = MnObject.extend({
  channelName: 'app',
  radioRequests: {
    'classes:tojoin:fetch': 'classesToJoinFetch',
    'custom:entities': 'getCustomEntities',
    'user:me': 'getMe',
    'data:getitem': 'getItem',
    'data:trials': 'getTrials',
  },

  radioEvents: {
    'data:collection:additem': 'addItemToCache',
    'data:removeitem': 'removeItemFromCache',
    'data:purge': 'purge',
    'data:update:notes': 'updateNotes',
    'data:update:trials:count': 'updateTrialsCount',
  },

  timeout:1500000, // 25 minutes
  stored_data:{},
  stored_time:{},

  fetch(url) {
    const token = localStorage.getItem('jwt');
    return $.ajax(url, {
      method:'GET',
      dataType:'json',
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    });
  },

  getCollectionConstructor(name) {
    switch (name) {
      case "devoirs": return require("./devoirs/entity.js").Collection;
      case "exodevoirs": return require("./devoirs/exodevoir.js").Collection;
      case "users": return require("./users/entity.js").Collection;
      case "classes": return require("./classes/entity.js").Collection;
      case "sujetsexercices": return require("./exercices/sujetexo.js").Collection;
      case "notesexos": return require("./notes/noteexo.js").Collection;
      case "notes": return require("./notes/note.js").Collection;
      case "unfinished": return require("./exercices/trial.js").Collection;
      case "trials": return require("./exercices/trial.js").Collection;
      default: return null;
    }
  },

  classesToJoinFetch() {
    const defer = $.Deferred();
    if (
      typeof this.stored_data.classestojoin !== "undefined" &&
      typeof this.stored_time.classestojoin !== "undefined" &&
      (Date.now() - this.stored_time.classestojoin < this.timeout)
    ) {
      defer.resolve(this.stored_data.classestojoin);
      return defer.promise();
    }
    const fetching = this.fetch("api/classestojoin");
    fetching.done( (data) => {
      const Classes = require("./classes/entity.js").Collection;
      this.stored_time.classestojoin = Date.now();
      this.stored_data.classestojoin = new Classes(data, { parse:true });
      defer.resolve(this.stored_data.classestojoin);
    }).fail( (response) => {
      defer.reject(response);
    });
    return defer.promise();
  },

  getTrials(idUser, idExoDevoir) {
    // on ne fait pas de cache pour cela
    const defer = $.Deferred();
    const fetching = this.fetch(`api/trials/${idUser}/${idExoDevoir}`);
    fetching.done( (data) => {
        const Trials = require("./exercices/trial.js").Collection;
        const trials = new Trials(data, { parse:true });
        defer.resolve(trials);
    }).fail( (response) => {
      defer.reject(response);
    });
    return defer.promise();
  },

  /**
   * Récupère des entités personnalisées
   * @param {Array} ask Liste des entités à récupérer de forme key ou [key,id]
   * @returns {Promise} Promesse résolue avec les entités demandées
   */
  getCustomEntities(ask) {
    const alreadyKnown = Object.fromEntries(ask.map(
      (name) => [name, this.getEntityFromCache(name)]
    ));
    return this._getCustomEntitiesHelper(ask, alreadyKnown);
  },

  /**
   * Récupère des entités personnalisées en forçant le rechargemnt
   * @param {Array} ask Liste des entités à récupérer de forme key ou [key,id]
   * @returns {Promise} Promesse résolue avec les entités demandées
   */
  getCustomEntitiesForceReload(ask) {
    return this._getCustomEntitiesHelper(ask, {});
  },


  /**
   * Helper pour récupérer des entités personnalisées
   * @param {Array} ask Liste des entités à récupérer de forme key ou [key,id]
   * @param {Object} alreadyKnown Objet contenant les entités déjà connues
   * @returns {Promise} Promesse résolue avec les entités demandées
   */
  _getCustomEntitiesHelper(ask, alreadyKnown) {
    const defer = $.Deferred();
    const toFetch = ask.filter(
      (name) => !alreadyKnown[name]
    );
    if (toFetch.length === 0) {
      // Pas de fetch requis => on renvoie les résultats
      defer.resolve(alreadyKnown);
    } else {
      const request = this.fetch("api/customData/"+toFetch.join("&"));
      request.done( (data) => {
        for (const name of ask) {
          if (!data[name]) continue;
          if (name.includes(":")) {
            const [key, id] = name.split(":");
            this.addItemToCache(key, data[name]);
            alreadyKnown[name] = this.stored_data[key].get(id);
            continue;
          }
          const col = this.addEmptyCollectionToCache(name);
          if (!col) continue;
          try {
            col.add(data[name], { parse:true });
            alreadyKnown[name] = col;
          } catch(e) {
            console.warn(`Erreur lors du parse de la collection ${name}`);
          }
        }
        defer.resolve(alreadyKnown);
      }).fail( (response) => {
        defer.reject(response);
      });
    }
    const promise = defer.promise();
    return promise;
  },

  
  /**
   * Récupère un item dans le cache ou via une requête si non présent
   * @param {string} entityName Nom de l'entité
   * @param {int} idItem ID de l'item
   * @returns une promesse résolue avec l'item demandé
   */
  getItem(entityName, idItem) {
    const defer = $.Deferred();
    const name = `${entityName}:${idItem}`;
    const fetching = this.getCustomEntities([name]);
    $.when(fetching).done( (data) => {
      defer.resolve(data[name]);
    }).fail( (response) => {
      defer.reject(response);
    });
    return defer.promise();
  },

  getMe() {
    const defer = $.Deferred();
    const t = Date.now();
    if (typeof this.stored_data.me !== "undefined" && typeof this.stored_time.me !== "undefined" && t - this.stored_time.me < this.timeout) {
      defer.resolve(this.stored_data.me);
    } else {
      const request = this.fetch("api/me");
      request.done( (data) => {
        const User = require("./users/entity.js").Item;
        this.stored_data.me = new User(data, {parse:true});
        this.stored_time.me = t;
        defer.resolve(this.stored_data.me);
      }).fail( (response) => {
        defer.reject(response);
      });
    }
    return defer.promise();
  },

  /**
   * Purge le cache des données stockées
   * @param {string} colName Nom de la collection à purger (optionnel)
   */
  purge(colName) {
    if (colName) {
      delete this.stored_data[colName];
      delete this.stored_time[colName];
    } else {
      this.stored_data = {};
    }
  },

  /**
   * Ajoute un item à une collection en cache si elle existe
   * @param {string} colName 
   * @param {Object} itemData
   */
  addItemToCache(colName, itemData) {
    const col = this.getChachedCollection(colName);
    if (col) {
      col.add(itemData, { parse:!(itemData instanceof MyModel), merge: true });
    } else {
      const ColConstructor = this.getCollectionConstructor(colName);
      if (ColConstructor) {
        // Création d'une collection partielle
        // Pour stocker cet item
        const col = this.addEmptyCollectionToCache(colName);
        if (col) {
          col.setPartial(true);
          col.add(itemData, { parse:!(itemData instanceof MyModel), merge: true });
        }
      }
    }
  },

  /**
   * supprime un item d'une collection en cache si elle existe
   * @param {string} colName 
   * @param {int} idItem
   */
  removeItemFromCache(colName, idItem) {
    const col = this.getChachedCollection(colName);
    if (col) {
      col.remove(idItem);
    }
  },

  /**
   * Renvoie un élément du cache s'il existe et n'est pas expiré
   * si renvoie false, l'élément n'existe pas mais pourrait exister côté serveur
   * si renvoie null, l'élément n'existe pas et a priori pas sur le serveur non plus
   * @param {string} name 
   * @returns {Item|Collection|null|false}
   */
  getEntityFromCache(name) {
    if (name.includes(":")) {
      const [key, id] = name.split(":");
      const col = this.getChachedCollection(key);
      if (col) {
        const item = col.get(id);
        if (item) return item;
        if (col.getPartial()) return false;
        return null;
      }
      return false;
    } else {
      const col = this.getChachedCollection(name);
      if (!col) return false;
      if (col.getPartial() === true) {
        return false;
      }
      return col;
    }
  },

  /**
   * Ajoute une collection vide au cache
   * @param {string} colName 
   */
  addEmptyCollectionToCache(colName) {
    const ColConstructor = this.getCollectionConstructor(colName);
    if (!ColConstructor) {
      return null;
    }
    this.stored_data[colName] = new ColConstructor([], { parse:false });
    this.stored_time[colName] = Date.now();
    return this.stored_data[colName];
  },
  /**
   * renvoie la collection si elle est stockée en cache et pas expirée,
   * et complète, sinon false
   * @param {string} colName 
   * @returns {Collection|false}
   */
  getChachedCollection(colName) {
    if (this.stored_data[colName] === undefined ||
        this.stored_time[colName] === undefined ||
        Date.now() - this.stored_time[colName] > this.timeout
    ) {
          return false;
    }
    return this.stored_data[colName];
  },

  updateNotes(trial) {
    const idUser = trial.get("idUser");
    const idExoDevoir = trial.get("idExoDevoir");
    const idDevoir = trial.get("idDevoir");
    const notesExos = this.getChachedCollection("notesexos");
    let needReloadNote = false;
    if (notesExos) {
      const noteExo = notesExos.findWhere({ idUser, idExoDevoir });
      if (noteExo) {
        let oldNote = noteExo.get("note"); 
        noteExo.set("note", Math.max(trial.get("score"), noteExo.get("note")));
        let newNote = noteExo.get("note");
        if (oldNote !== newNote) {
          needReloadNote = true;
        }
      } else needReloadNote = true;
    } else needReloadNote = true;
    // On met à jour la note globale si on a suffisamment d'infos
    const notes = this.getChachedCollection("notes");
    if (!notes) {
      return;
    }
    
    // Vérifions déjà si cet objet note est présent
    if (notes.get(`${idUser}_${idDevoir}`) && !needReloadNote) {
      return;
    }
    // Donc soit l'objet n'existe pas, soit il faut le forcer
    const fetch = this.getCustomEntitiesForceReload([`notes:${idUser}_${idDevoir}`])
    // chargement
    $.when(fetch).error( (response) => {
      console.error("Error fetching custom entities:", response);
    });
  },

  updateTrialsCount(trial) {
    const idUser = trial.get("idUser");
    const idExoDevoir = trial.get("idExoDevoir");
    const notesExos = this.getChachedCollection("notesexos");
    if (notesExos) {
      const noteExo = notesExos.findWhere({ idUser, idExoDevoir });
      if (noteExo) {
        noteExo.set("trials", noteExo.get("trials") + 1);
      }
    }
  }

});

new Controller();