import { MnObject, Region } from 'backbone.marionette'
import { OptionsView, ParamsView, TextView } from './views.js'
import { Item as ExerciceTry } from '../exotry.js'
import MainBloc from '../tools/mainbloc.js';

import renderMathInElement from "katex/contrib/auto-render";

const Controller = MnObject.extend ({
  channelName: "app",

  showApercu(sujetExercice) {
    const channel = this.getChannel();
    try {
      const {options, defaultsOptions} = MainBloc.parseOptions(sujetExercice.get("options"));
      const optionsView = new OptionsView({ options: options, selected: defaultsOptions });
      optionsView.on("change", (data) => {
        const exerciceTry = this.refreshExerciceTry(sujetExercice, data);
        this.showExerciceTry(sujetExercice, exerciceTry);
      });
      const exerciceTry = this.newExerciceTry(sujetExercice, defaultsOptions);
      new Region({ el: '#exercice-options-set' }).show(optionsView);
      this.showExerciceTry(sujetExercice, exerciceTry);
    } catch (error) {
      console.error(error);
      channel.trigger("popup:error", {
        title: "Erreur de compilation",
        message: error.message
      });
    }
  },

  newExerciceTry(sujetExercice, options, idDevoir=null) {
    const channel = this.getChannel();
    try {
      const initParams = MainBloc.parseParams(sujetExercice.get("init"), options);
      return exoTry = new ExerciceTry({
        idExercice: sujetExercice.id,
        options: options,
        init: initParams,
        idUser: channel.request("logged:get").id || null,
        idDevoir: idDevoir
      });
    } catch (error) {
      console.error(error);
      this.getChannel().trigger("popup:error", {
        title: "Initialisation des paramètres",
        message: error.message
      });
    }
  },

  showExerciceTry(sujetExercice, exerciceTry) {
    const selectedOptions = exerciceTry.get("options");
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const showParams = (logged.id === sujetExercice.get("idOwner") || logged.isAdmin());
    try {
      const initParams = exerciceTry.get("init");
      if (showParams) {
        const paramsView = new ParamsView({ params: initParams });
        new Region({ el: '#exercice-initparams' }).show(paramsView);
      }
      const region = document.querySelector('#exercice-run');
      region.innerHTML = "";
      const main = Tools.parseCode(sujetExercice.get("code"));

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
    const region = document.querySelector('#exercice-run');
    const items = main.run();
    for (const item of items) {
      if (typeof item.view !== 'function') {
        throw new Error("Le bloc principal doit uniquement produire des vues.");
      }
      const itemView = item.view();
      if (typeof item.validation === 'function') {
        itemView.on("validation", (data) => {
          const {validation,verification} = item.validation(data);
          if (validation) {
            itemView.trigger("validation:error", validation);
            return;
          }
          console.log("Vérification des réponses...", verification);
        });
      }
      region.appendChild(itemView.el);
      
      itemView.render();

    }
    // Rendu de KaTeX dans la zone d'exercice
    renderMathInElement(region, {
      delimiters: [
        {left: "$", right: "$", display: false},
        {left: "$$", right: "$$", display: true}
      ],
      throwOnError: false
    });
  }
});

export const controller = new Controller();

/*
  Je réalise ici que je fais une confusion entre l'exercice en tant qu'il
  porte les informations relatives à la fabrication d'un exercice
  et la réalisation d'un exercice par l'utilisateur, avec les réponses,
  un score, un choix d'options, des paramètres.
  Le second ne devrait être initialisé lors de l'aperçu.
 */