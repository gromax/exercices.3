import { MnObject } from 'backbone.marionette';

const Controller = MnObject.extend({
  channelName: 'app',
  radioRequests: {
    'classes:tojoin:fetch': 'classesToJoinFetch',
    'custom:entities': 'getCustomEntities',
    'user:me': 'getMe',
    'data:getitem': 'getItem',
  },

  radioEvents: {
    'data:collection:additem': 'addItemToCache',
    'data:removeitem': 'removeItemFromCache',
    'data:purge': 'purge',
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

  /**
   * Récupère des entités personnalisées
   * @param {Array} ask Liste des entités à récupérer de forme key ou [key,id]
   * @returns {Promise} Promesse résolue avec les entités demandées
   */
  getCustomEntities(ask) {
    const defer = $.Deferred();
    const alreadyKnown = Object.fromEntries(ask.map(
      (name) => [name, this.getEntityFromCache(name)]
    ));
    const toFetch = ask.filter(
      (name) => alreadyKnown[name] === false
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
    const col = this.getChachedCollection(entityName);
    if (col === null) {
      const fetching = this.getCustomEntities([entityName]);
      $.when(fetching).done( (data) => {
        const col = data[entityName];
        defer.resolve(col.get(idItem));
      }).fail( (response) => {
        defer.reject(response);
      });
    } else {
      defer.resolve(col.get(idItem));
    }
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
      col.add(itemData, { parse:Array.isArray(itemData) });
    } else {
      const ColConstructor = this.getCollectionConstructor(colName);
      if (ColConstructor) {
        // Création d'une collection partielle
        // Pour stocker cet item
        const col = this.addEmptyCollectionToCache(colName);
        if (col) {
          col.setPartial(true);
          col.add(itemData, { parse:Array.isArray(itemData) });
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
        if (col.partial) return false;
        return null;
      }
      return false;
    } else {
      return this.getChachedCollection(name);
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
    const col = this.stored_data[colName];
    if (col.partial) {
      return false;
    }
    return col;
  },

});

new Controller();