import { MnObject, Region } from 'backbone.marionette'
import { EditExerciceView } from './views.js'

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
      channel.trigger("exercice:show", id);
    });
    new Region({ el: '#main-region' }).show(view);
  },

});

export const controller = new Controller();
