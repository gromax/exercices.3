import { MnObject } from 'backbone.marionette';
import { get } from 'jquery';

const Controller = MnObject.extend({
  channelName: 'app',
  radioRequests: {
    'classes:tojoin:fetch': 'classesToJoinFetch',
    'custom:entities': 'getCustomEntities',
    'logged:destroy': 'purge',
    'data:purge': 'purge',
    'classe:entity': 'getClasse',
    'user:entity': 'getUser',
    'sujetexercice:entity': 'getSujetExercice',
    'user:me': 'getMe',
    'user:destroy:update': 'userDestroyUpdate',
    'fiche:destroy:update': 'ficheDestroyUpdate',
    'aUE:destroy:update': 'aUEDestroyUpdate'
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

  getCustomEntities(ask) {
    const defer = $.Deferred();
    const toFetch = _.filter(ask, (item) => (typeof this.stored_data[item] === "undefined") || (typeof this.stored_time[item] === "undefined") || (Date.now() - this.stored_time[item] > this.timeout));
    if (toFetch.length === 0) {
      // Pas de fetch requis => on renvoie les résultats
      defer.resolve.apply(null,_.map(ask, (item) => this.stored_data[item]));
    } else {
      const request = this.fetch("api/customData/"+toFetch.join("&"));
      request.done( (data) => {
        for (const colName of ask) {
          if (!data[colName]) continue;
          let colObj = false;
          switch (colName) {
            //case "fiches": colObj = require("@entities/fiches.js"); break;
            //case "devoirs": colObj = require("@entities/devoirs.js"); break;
            //case "userfiches": colObj = require("@entities/userfiches.js"); break;
            case "users": colObj = require("./users/entity.js"); break;
            case "classes": colObj = require("./classes/entity.js"); break;
            case "sujetsexercices": colObj = require("./exercices/sujetexo.js"); break;
            //case "exofiches": colObj = require("@entities/exofiches.js"); break;
            //case "faits": colObj = require("@entities/faits.js"); break;
            //case "exams": colObj = require("@entities/exams.js"); break;
          }
          if (colObj !== false) {
            try {
              this.stored_data[colName] = new colObj.Collection(data[colName], { parse:true });
              this.stored_time[colName] = Date.now();
            } catch(e) {
              this.stored_data[colName] = new colObj.Collection([]);
              this.stored_time[colName] = Date.now();
              console.warn("Erreur lors du parse de la collection "+colName);
            }
          }
        }
        defer.resolve.apply(null,_.map(ask, (item) => { return this.stored_data[item]; } ));
      }).fail( (response) => {
        defer.reject(response);
      });
    }
    const promise = defer.promise();
    return promise;
  },
  getItem(entityName, idItem) {
    const defer = $.Deferred();
    if ((typeof this.stored_data[entityName] === "undefined") || (typeof this.stored_time[entityName] === "undefined") || (Date.now() - this.stored_time[entityName] > this.timeout)) {
      const fetching = this.getCustomEntities([entityName]);
      $.when(fetching).done( (col) => {
        defer.resolve(col.get(idItem));
      }).fail( (response) => {
        defer.reject(response);
      });
    } else {
      defer.resolve(this.stored_data[entityName].get(idItem));
    }
    return defer.promise();
  },
  getUser(id) {
    return this.getItem("users", id);
  },
  getClasse(id) {
    return this.getItem("classes", id);
  },
  getSujetExercice(id) {
    return this.getItem("sujetsexercices", id);
  },
  getMe() {
    const defer = $.Deferred();
    const t = Date.now();
    if (typeof this.stored_data.me !== "undefined" && typeof this.stored_time.me !== "undefined" && t - this.stored_time.me < this.timeout) {
      defer.resolve(this.stored_data.me);
    } else {
      const request = $.ajax("api/me",{
        method:'GET',
        dataType:'json',
        headers: localStorage.getItem('jwt') ? { Authorization: 'Bearer ' + localStorage.getItem('jwt') } : {}
      })
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

  purge() {
    this.stored_data = {};
  },

  userDestroyUpdate(idUser) {
    //  Assure le cache quand un user est supprimé
    if (this.stored_data.userfiches) {
      userfichesToPurge = this.stored_data.userfiches.where({idUser : idUser});
      this.stored_data.userfiches.remove(userfichesToPurge);
    }
    if (this.stored_data.faits) {
      delete this.stored_data.faits;
    }
    if (this.stored_data.messages) {
      delete this.stored_data.messages;
    }
  },

  ficheDestroyUpdate(idFiche) {
    //  Assure le cache quand un user est supprimé
    if (this.stored_data.userfiches) {
      userfichesToPurge = this.stored_data.userfiches.where({idFiche : idFiche});
      this.stored_data.userfiches.remove(userfichesToPurge);
    }
    if (this.stored_data.exofiches) {
      exofichesToPurge = this.stored_data.exofiches.where({idFiche : idFiche});
      this.stored_data.exofiches.remove(exofichesToPurge);
    }
    if (this.stored_data.faits) {
      delete this.stored_data.faits;
    }
    if (this.stored_data.messages) {
      delete this.stored_data.messages;
    }
  },

  aUEDestroyUpdate() {
    if (this.stored_data.messages) {
      delete this.stored_data.messages;
    }
  },
});

new Controller();

