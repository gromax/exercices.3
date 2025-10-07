import { MnObject, Region } from 'backbone.marionette'
import { EditExerciceView, ParamsView } from './views.js'
import { OptionsView } from '../run/views.js';
import Tools from '../tools.js';

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
      const optionsText = view.el.querySelector("#exercice-options").value;
      const initCode = view.el.querySelector("#exercice-init").value;
      const code = view.el.querySelector("#exercice-code").value;
      this.showApercu(optionsText, initCode, code);
    }.bind(this));

    new Region({el: "#main-region"}).show(view);
    view.triggerMethod("form:apercu");
  },

  showApercu(optionsText, initCode, code) {
    const channel = this.getChannel();
    try {
      const {options, defaultsOptions} = Tools.parseOptions(optionsText);
      const optionsView = new OptionsView({ options: options, selected: defaultsOptions });
      optionsView.on("change", (data) => {
        this.refreshExercice(data, initCode, code);
      });
      new Region({ el: '#apercu-options' }).show(optionsView);
      this.refreshExercice(defaultsOptions, initCode, code);
    } catch (error) {
      console.error(error);
      channel.trigger("popup:error", {
        title: "Erreur de compilation",
        message: error.message
      });
    }
  },

  refreshExercice(selectedOptions, initCode, code) {
    const channel = this.getChannel();
    try {
      const initParams = Tools.initExoParams(initCode, selectedOptions);
      const paramsView = new ParamsView({ params: initParams });
      new Region({ el: '#apercu-initparams' }).show(paramsView);
    } catch (error) {
      console.error(error);
      channel.trigger("popup:error", {
        title: "Erreur de compilation",
        message: error.message
      });
    }
  }

});

export const controller = new Controller();
