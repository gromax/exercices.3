import { Behavior } from 'backbone.marionette';
import Radio from 'backbone.radio';
const radioApp = Radio.channel("app");

const DestroyWarn = Behavior.extend({
  ui: {
    destroy: '.js-delete'
  },

  events: {
    'click @ui.destroy': 'warnBeforeDestroy'
  },

  warnBeforeDestroy(e) {
    e.preventDefault();
    e.stopPropagation(); // empêche la propagation d'un click à l'élément parent dans le dom
    const model = this.view.model;
    const message = `Supprimer l'élément ${model} ?`;
    const modelId = model.get('id');
    if (confirm(message)) {
      const destroyRequest = model.destroy();
      radioApp.trigger("loading:up");
      $.when(destroyRequest).done( () => {
        // utiliser triggerMethod pour que cela remonte à la collection parente, sinon ne le fait pas
        this.view.triggerMethod("delete:success", modelId);
      }).fail( (response) => {
        alert("Erreur. Essayez à nouveau !");
      }).always( () => {
        radioApp.trigger("loading:down", modelId);
      });
    }
  }
});

export default DestroyWarn;