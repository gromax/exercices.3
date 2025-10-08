import { MnObject, Region } from 'backbone.marionette'
import { EditExerciceView, ParamsView } from './views.js'
import { Item as Exercice } from '../entity.js';

const Controller = MnObject.extend ({
  channelName: "app",
  edit(id, exercice) {
    const channel = this.getChannel();
    channel.trigger("ariane:reset", [
      { text:"Exercices", link:"exercices" },
      { text:exercice ? exercice.get("title") : "Exercice inconnu", link:`exercice:${id}` },
      { text:"Modification", link:`exercice:${id}/edit` }
    ]);

    if (exercice === undefined) {
      channel.trigger("missing:item");
      return;
    }

    const view = new EditExerciceView({
        model: exercice
    });

    view.on("success", function (model, data) {
      //channel.trigger("exercice:show", id);
    });

    view.on("form:apercu", function() {
      const values = {};
      view.$('input, select, textarea').each(function() {
        values[this.name] = this.value;
      });
      const exoApercu = new Exercice(values);
      channel.trigger("exercice:apercu", exoApercu);
    });

    new Region({el: "#main-region"}).show(view);
    view.triggerMethod("form:apercu");
  },



});

export const controller = new Controller();
