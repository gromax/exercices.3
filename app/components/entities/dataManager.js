import { MnObject } from 'backbone.marionette';

const Controller = MnObject.extend({
  channelName: 'entities',
  radioRequests: {
    'custom:entities': 'getCustomEntities',
    'data:purge': 'purge',
    'classe:entity': 'getClasse',
    'user:entity': 'getUser',
    'user:me': 'getMe',
    'user:destroy:update': 'userDestroyUpdate',
    'fiche:destroy:update': 'ficheDestroyUpdate',
    'aUE:destroy:update': 'aUEDestroyUpdate'
  },

  timeout:1500000, // 25 minutes
  stored_data:{},
  stored_time:{},

  getCustomEntities: (ask) => {
    const t = Date.now();
    const defer = $.Deferred();
    const toFetch = _.filter(ask, (item) => (typeof this.stored_data[item] === "undefined") || (typeof this.stored_time[item] === "undefined") || (t - this.stored_time[item] > this.timeout));
    if (toFetch.length === 0) {
      // Pas de fetch requis => on renvoie les résultats
      defer.resolve.apply(null,_.map(ask, (item) => this.stored_data[item]));
    } else {
      const request = $.ajax("api/customData/"+toFetch.join("&"),{
        method:'GET',
        dataType:'json'
      })

      request.done( (data) => {
        for (const colName in ask) {
          let colObj = false;
          switch (colName) {
            case "fiches": colObj = require("@entities/fiches.js"); break;
            case "devoirs": colObj = require("@entities/devoirs.js"); break;
            case "userfiches": colObj = require("@entities/userfiches.js"); break;
            case "users": colObj = require("@entities/users.js"); break;
            case "classes": colObj = require("@entities/classes.js"); break;
            case "exofiches": colObj = require("@entities/exofiches.js"); break;
            case "faits": colObj = require("@entities/faits.js"); break;
            case "exams": colObj = require("@entities/exams.js"); break;
            case "messages": colObj = require("@entities/messages.js"); break;
          }
          if ((colObj !== false) && (data[colName])) {
            this.stored_data[colName] = new colObj.Collection(data[colName], { parse:true });
            this.stored_time[colName] = t;
          }
        }
        defer.resolve.apply(null,_.map(ask, (item) => { return this.stored_data[item]; } ));
      }).fail( (response) => {
        defer.reject(response);
      });
    }
    return promise = defer.promise();
  },
  getItem: (entityName, idItem) => {
    $.Deferred().resolve(this.getCustomEntities([entityName]).get(idItem))
  },
  getUser: (id) => {
    this.getItem("users", id);
  },
  getClasse: (id) => {
    this.getItem("classes", id);
  },
  getMe: () => {
    const defer = $.Deferred();
    const t = Date.now();
    if (typeof this.stored_data.me !== "undefined" && typeof this.stored_time.me !== "undefined" && t - this.stored_time.me < this.timeout) {
      defer.resolve(this.stored_data.me);
    } else {
      request = $.ajax("api/me",{
        method:'GET',
        dataType:'json'
      })
      request.done( (data) => {
        User = require("entities/user").Item;
        this.stored_data.me = new User(data, {parse:true});
        this.stored_time.me = t;
        defer.resolve(this.stored_data.me);
      }).fail( (response) => {
        defer.reject(response);
      });
    }
    return defer.promise();
  },

  purge: () => {
    this.stored_data = {};
  },

  userDestroyUpdate: (idUser) => {
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

  ficheDestroyUpdate: (idFiche) => {
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

  aUEDestroyUpdate: () => {
    if (this.stored_data.messages) {
      delete this.stored_data.messages;
    }
  },
});

new Controller();

