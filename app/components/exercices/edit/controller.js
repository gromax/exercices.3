import { MnObject, Region } from 'backbone.marionette'
import { EditExerciceView, ParamsView } from './views.js'
import { Item as SujetExercice } from '../sujetexo.js';

const Controller = MnObject.extend ({
  channelName: "app",
  edit(id, sujetExercice) {
    const channel = this.getChannel();
    channel.trigger("ariane:reset", [
      { text:"Exercices", link:"exercices" },
      { text:sujetExercice ? sujetExercice.get("title") : "Exercice inconnu", link:`exercice:${id}` },
      { text:"Modification", link:`exercice:${id}/edit` }
    ]);

    if (sujetExercice === undefined) {
      channel.trigger("missing:item");
      return;
    }

    const view = new EditExerciceView({
        model: sujetExercice
    });

    view.on("success", function (model, data) {
      //channel.trigger("exercice:show", id);
    });

    view.on("form:apercu", function() {
      const values = {};
      view.$('input, select, textarea').each(function() {
        values[this.name] = this.value;
      });
      // il faudrait que l'aperçu sauvegarde
      const exoApercu = new SujetExercice(sujetExercice.attributes);
      for (const key in values) {
        exoApercu.set(key, values[key]);
      }
      channel.trigger("exercice:apercu", exoApercu);
    });

    new Region({el: "#main-region"}).show(view);
    view.triggerMethod("form:apercu");
  },



});

export const controller = new Controller();
