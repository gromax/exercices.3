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
        const exerciceTry = this.newExerciceTry(sujetExercice, data);
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
      return new ExerciceTry({
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
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const showParams = (logged.id === sujetExercice.get("idOwner") || logged.isAdmin());
    try {
      if (showParams) {
        const paramsView = new ParamsView({
          params: exerciceTry.get("init")
        });
        new Region({ el: '#exercice-initparams' }).show(paramsView);
      }
      const region = document.querySelector('#exercice-run');
      region.innerHTML = "";
      const mainPile = MainBloc.runCode(
        sujetExercice.get("code"),
        exerciceTry.get("init"),
        exerciceTry.get("options")
      );
      this.runExercice(mainPile, exerciceTry);
    } catch (error) {
      console.error(error);
      channel.trigger("popup:error", {
        title: "Erreur de compilation",
        message: error.message
      });
    }
  },

  runExercice(mainPile, exerciceTry) {
    const region = document.querySelector('#exercice-run');
    while (mainPile.length > 0) {
      const item = mainPile.pop();
      if (typeof item.view !== 'function') {
        throw new Error("Le bloc principal doit uniquement produire des vues.");
      }
      const itemView = item.view(exerciceTry);
      if (typeof itemView.onSubmit === 'function') {
        itemView.on("verification:success", (data) => {
          console.log("Vérification des réponses...", data);
        });
      }
      region.appendChild(itemView.el);
      
      itemView.render();
      if (typeof itemView.onSubmit === 'function') {
        break;
      }
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