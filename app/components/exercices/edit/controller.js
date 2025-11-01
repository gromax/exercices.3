import { MnObject, Region } from 'backbone.marionette'
import { EditExerciceView } from './views.js'
import { TwoColsView } from '../../common/views.js';
import { Item as SujetExercice } from '../sujetexo.js';

const Controller = MnObject.extend ({
  channelName: "app",
  edit(sujetExercice) {
    const channel = this.getChannel();

    if (!sujetExercice) {
      channel.trigger("popup:error", "Exercice introuvable.");
      return;
    }

    const layoutView = new TwoColsView();

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
      channel.trigger("exercice:apercu", exoApercu, layoutView.getRegion('right'));
    });
    channel.request("region:main").show(layoutView);
    layoutView.showChildView('left', view);
    view.triggerMethod("form:apercu");
  },



});

export const controller = new Controller();
