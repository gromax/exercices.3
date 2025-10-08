import { MnObject, Region } from 'backbone.marionette'
import { OptionsView, ParamsView, TextView } from './views.js'
import Tools from '../tools.js';

const Controller = MnObject.extend ({
  channelName: "app",

  showApercu(exercice) {
    const channel = this.getChannel();
    try {
      const {options, defaultsOptions} = Tools.parseOptions(exercice.get("options"));
      const optionsView = new OptionsView({ options: options, selected: defaultsOptions });
      optionsView.on("change", (data) => {
        this.refreshExercice(exercice, data, true);
      });
      new Region({ el: '#exercice-options-set' }).show(optionsView);
      this.refreshExercice(exercice, defaultsOptions, true);
    } catch (error) {
      console.error(error);
      channel.trigger("popup:error", {
        title: "Erreur de compilation",
        message: error.message
      });
    }
  },

  refreshExercice(exercice, selectedOptions, showParams) {
    const channel = this.getChannel();
    try {
      const initParams = Tools.initExoParams(exercice.get("init"), selectedOptions);
      if (showParams) {
        const paramsView = new ParamsView({ params: initParams });
        new Region({ el: '#exercice-initparams' }).show(paramsView);
      }
      const main = Tools.parseCode(exercice.get("code"));
      main.initRun(initParams, selectedOptions);
      this.runExercice(main);
    } catch (error) {
      console.error(error);
      channel.trigger("popup:error", {
        title: "Erreur de compilation",
        message: error.message
      });
    }
  },

  runExercice(main) {
    const region = new Region({ el: '#exercice-run' });
    const items = main.run();
    for (const item of items) {
      if (item.label === 'text') {
        const textView = new TextView(item);
        region.show(textView);
      }
    }
  }
});

export const controller = new Controller();