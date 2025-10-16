import { MnObject, Region } from 'backbone.marionette'
import { OptionsView, ParamsView, Finished_View } from './views.js'
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
      const scoreMax = mainPile.reduce(
        (sum, item) => typeof item.nombrePts === 'function' ? sum + item.nombrePts() || 0 : sum,
        0
      );
      exerciceTry.set("scoreMax", scoreMax);
      exerciceTry.set("intScore", 0);
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
    let questionLeft = false;
    const region = document.querySelector('#exercice-run');
    const answers = exerciceTry.get("answers") || {};
    while (mainPile.length > 0) {
      const item = mainPile.pop();
      const itemScore = item.score;
      if (itemScore) {
        exerciceTry.set("intScore", exerciceTry.get("intScore") + itemScore);
      }
      if (typeof item.view !== 'function') {
        console.warn(`<${item.tag}> le bloc principal doit uniquement produire des vues.`);
        continue;
      }
      const itemView = item.view(answers);
      if (typeof itemView.onSubmit === 'function') {
        itemView.on("validation:success", (data) => {
          // 1. ajouter dans exerciceTry les réponses
          exerciceTry.addAnswers(data);
          // 2. détruire la vue du formulaire
          itemView.el.remove();
          // 3. relancer la vue pour le même item.
          const newItemView = item.view(exerciceTry.get("answers"));
          region.appendChild(newItemView.el);
          newItemView.render();
          //    le formulaire doit afficher les résultats avec
          //    tous les commentaies nécessaires
          exerciceTry.set("intScore", exerciceTry.get("intScore") + item.score);
          // 4. poursuivre l'exécution de la pile jusqu'au prochain stop
          //    ce qui pourra amener à modifier l'état "finished" de l'exercice
          this.runExercice(mainPile, exerciceTry);
          if (mainPile.length === 0) {
            exerciceTry.set("finished", true);
          }
          // 5. sauvegarder l'état de l'exerciceTry
          if (exerciceTry.isEleveTry()) {
            exerciceTry.save();
          }
        });
      }
      region.appendChild(itemView.el);
      
      itemView.render();
      if (typeof itemView.onSubmit === 'function') {
        questionLeft = true;
        break;
      }
    }
    if (!questionLeft) {
      exerciceTry.set("finished", true);
      const finishedView = new Finished_View({
        score: exerciceTry.get("score")
      });
      region.appendChild(finishedView.el);
      finishedView.render();
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