import { MnObject, Region } from 'backbone.marionette';
import { ShowExerciceView } from './view.js';

const Controller = MnObject.extend({
  channelName: 'app',
  show(exercice) {
    const channel = this.getChannel();
    if (!exercice) {
      channel.trigger("popup:error", "Exercice inconnu.");
      return;
    }
    const view = new ShowExerciceView({
      model: exercice
    });
    new Region({ el: '#main-region' }).show(view);
  }
});

export const controller = new Controller();
