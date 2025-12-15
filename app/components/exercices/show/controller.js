import { MnObject } from 'backbone.marionette';
import { ShowExerciceView } from './view.js';
import renderTexInDomElement from '../../common/rendertex.js';


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
      showModButton: logged.id === exercice.get("idOwner") || logged.isAdmin(),
      showCloneButton: logged.isProf() || logged.isAdmin()
    });
    const regionMain = channel.request("region:main")
    regionMain.show(view);
    renderTexInDomElement(regionMain.el);
    const region = view.getRegion('exercice');
    require('../run/controller.js').controller.showApercu(exercice, region);
  }
});

export const controller = new Controller();
