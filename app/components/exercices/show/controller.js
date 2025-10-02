import { MnObject, Region } from 'backbone.marionette';
import { ShowExerciceView } from './view.js';

const Controller = MnObject.extend({
  channelName: 'app',
  show(id, exercice) {
    const channel = this.getChannel();
    if (exercice === undefined) {
      channel.trigger("ariane:reset", [
        { text: "Exercices", link: "exercices" },
        { text: "Exercice inconnu", link: `exercice:${id}` }
      ]);
      channel.trigger("missing:item");
      return;
    }
    channel.trigger("ariane:reset", [
      { text: "Exercices", link: "exercices" },
      { text: exercice.get("nom"), link: `exercice:${id}` }
    ]);
    const view = new ShowExerciceView({
      model: exercice
    });
    new Region({ el: '#main-region' }).show(view);
  }
});

export const controller = new Controller();
