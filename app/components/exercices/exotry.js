/**
 * Modèle décrivant un essai de réalisation d'un exercice
 */

const Item = Backbone.Model.extend({
  urlRoot: "api/tryexos",
  defaults: {
    idExercice: null,
    options: {},
    init: {},
    answers: {},
    idUser: null,
    idDevoir: null,
    score: 0,
    finished: false
  },

  parse(data) {
    if (data.id) {
      data.id = Number(data.id);
    }
    data.options = JSON.parse(data.options);
    data.init = JSON.parse(data.init);
    data.answers = JSON.parse(data.answers);
    data.score = Number(data.score);
    data.finished = Boolean(data.finished);
    return data;
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

export { Item }