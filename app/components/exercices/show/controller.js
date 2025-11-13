import { MnObject } from 'backbone.marionette';
import { ShowExerciceView } from './view.js';

const Controller = MnObject.extend({
  channelName: 'app',
  show(exercice) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!exercice) {
      channel.trigger("popup:error", "Exercice inconnu.");
      return;
    }
    const view = new ShowExerciceView({
      model: exercice,
      showModButton: logged.id === exercice.get("idOwner") || logged.isAdmin()
    });
    channel.request("region:main").show(view);
    const region = view.getRegion('exercice');
    require('../run/controller.js').controller.showApercu(exercice, region);
  }
});

export const controller = new Controller();
