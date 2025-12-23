import { MnObject, Region } from 'backbone.marionette'
import {
  OptionsView,
  ParamsView,
  Finished_View,
  LayoutView,
  PanelEleveView,
  PanelProfTrialView
} from './views.js'
import { Item as ExerciceTry } from '../trial.js'
import MainBloc from '../tools/blocs/mainbloc.js';
import renderTexInDomElement from '../../common/rendertex';

const Controller = MnObject.extend ({
  channelName: "app",

  showApercu(sujet, region) {
    const channel = this.getChannel();
    try {
      const layoutView = new LayoutView();
      region.show(layoutView);
      const {options, defaultsOptions} = MainBloc.parseOptions(sujet.get("options"));
      const optionsView = new OptionsView({ options: options, selected: defaultsOptions });
      optionsView.on("change", (data) => {
        const trial = this.newTrial(sujet, data, null, null);
        this.showTrial(sujet, trial, layoutView);
      });
      const trial = this.newTrial(sujet, defaultsOptions, null, null);
      if (!trial) {
        return;
      }
      layoutView.showChildView('optionsSet', optionsView);
      this.showTrial(sujet, trial, layoutView);
    } catch (error) {
      console.error(error);
      channel.trigger("popup:error", {
        title: "Erreur de compilation",
        message: error.message
      });
    }
  },

  showApercuInDevoir(sujet, exoDevoir, region) {
    const channel = this.getChannel();
    try {
      const layoutView = new LayoutView();
      region.show(layoutView);
      const {options, defaultsOptions} = MainBloc.parseOptions(sujet.get("options"));
      const optionsSelected = { ...defaultsOptions, ...exoDevoir.get("options") };
      const optionsView = new OptionsView({ options: options, selected: optionsSelected });
      optionsView.on("change", (data) => {
        exoDevoir.set("options", data);
        const saving = exoDevoir.save();
        channel.trigger("loading:up");
        $.when(saving).done(() => {
          const trial = this.newTrial(sujet, data, exoDevoir.id, exoDevoir.idDevoir);
          this.showTrial(sujet, trial, layoutView);
        }).fail((response) => {
          console.warn("Erreur sauvegarde options exo-devoir", response.responseJSON);
          channel.trigger("popup:error", "Erreur inconnue lors de la sauvegarde des options de l'exercice dans le devoir.");
        }).always(() => {
          channel.trigger("loading:down");
        });
      });
      const trial = this.newTrial(sujet, optionsSelected, exoDevoir.id, exoDevoir.idDevoir);
      if (!trial) {
        return;
      }
      layoutView.showChildView('optionsSet', optionsView);
      this.showTrial(sujet, trial, layoutView);
    } catch (error) {
      console.error(error);
      channel.trigger("popup:error", {
        title: "Erreur de compilation",
        message: error.message
      });
    }
  },

  showTrialForProf(noteexo, sujet, note, user, trial, region) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!noteexo||!note||!sujet||!user||!trial) {
      channel.trigger("popup:error", "Données de l'exercice ou du devoir incorrectes.");
      return;
    }
    try {
      const {options, defaultsOptions} = MainBloc.parseOptions(sujet.get("options"));
      const optionsSelected = { ...defaultsOptions, ...noteexo.get("options") };
      trial.set("options", optionsSelected);
      trial.set("idDevoir", note.get("idDevoir"));
      trial.resetNeedSave();
      
      const layoutView = new LayoutView();
      region.show(layoutView);

      const panelView = new PanelProfTrialView({
        model: trial,
        nom: user.get("nomComplet"),
      });
      layoutView.showChildView('panel', panelView);
      renderTexInDomElement(layoutView.getRegion('panel').el);
      this.showTrial(sujet, trial, layoutView);
    } catch (error) {
      console.error(error);
      channel.trigger("popup:error", {
        title: "Erreur de compilation",
        message: error.message
      });
    }

  },

  runExoDevoirForEleve(noteexo, sujet, note, user, trial, region) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!noteexo||!note||!sujet||!user) {
      channel.trigger("popup:error", "Données de l'exercice ou du devoir incorrectes.");
      return;
    }
    try {
      const {options, defaultsOptions} = MainBloc.parseOptions(sujet.get("options"));
      const optionsSelected = { ...defaultsOptions, ...noteexo.get("options") };
      if (trial) {
        trial.set("options", optionsSelected);
        trial.set("idDevoir", note.get("idDevoir"));
      } else {
        trial = this.newTrial(sujet, optionsSelected, noteexo.get("idExoDevoir"), noteexo.get("idDevoir"));
        trial.save();
        channel.trigger("data:update:trials:count", trial);
      }
      trial.setNeedSave();
      const layoutView = new LayoutView();
      region.show(layoutView);
      if (logged.isEleve()) {
        const panelView = new PanelEleveView({
          model: noteexo,
          total: note.get("exosCount"),
          num: note.get("num")
        });
        panelView.on("prev", () => {
          channel.trigger("exodevoir:run:bynumber", note.get("idDevoir"), noteexo.get("num")-1);
        });
        panelView.on("next", () => {
          channel.trigger("exodevoir:run:bynumber", note.get("idDevoir"), noteexo.get("num")+1);
        });
        layoutView.showChildView('panel', panelView);
        renderTexInDomElement(layoutView.getRegion('panel').el);
      }
      this.showTrial(sujet, trial, layoutView);
    } catch (error) {
      console.error(error);
      channel.trigger("popup:error", {
        title: "Erreur de compilation",
        message: error.message
      });
    }
  },


  newTrial(sujet, options, idExoDevoir, idDevoir) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const idUser = logged.isEleve() ? logged.id : null;
    try {
      const initParams = MainBloc.parseParams(sujet.get("init"), options);
      return new ExerciceTry({
        idExo: sujet.id,
        options: options,
        init: initParams,
        idUser: idUser,
        idExoDevoir: idExoDevoir,
        idDevoir: idDevoir
      });
    } catch (error) {
      console.error(error);
      this.getChannel().trigger("popup:error", {
        title: "Initialisation des paramètres",
        message: error.message
      });
      return null;
    }
  },

  showTrial(sujet, trial, layoutView) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const showParams = (logged.id === sujet.get("idOwner") || logged.isAdmin());
    try {
      if (showParams) {
        const paramsView = new ParamsView({
          params: trial.get("init")
        });
        layoutView.showChildView('initParams', paramsView);
        paramsView.on("recycle", () => {
          const ntrial = this.newTrial(sujet, trial.get("options"), null, null);
          this.showTrial(sujet, ntrial, layoutView);
        });
      }
      layoutView.getRegion('run').empty();
      const mainPile = MainBloc.runCode(
        sujet.get("code"),
        trial.get("init"),
        trial.get("options")
      );
      const scoreMax = mainPile.reduce(
        (sum, item) => typeof item.nombrePts === 'function' ? sum + item.nombrePts() || 0 : sum,
        0
      );
      trial.set("scoreMax", scoreMax);
      trial.set("intScore", 0);
      this.runExercice(mainPile, trial, layoutView);
    } catch (error) {
      console.error(error);
      channel.trigger("popup:error", {
        title: "Erreur de compilation",
        message: error.message
      });
    }
  },

  runExercice(mainPile, trial, layoutView) {
    let questionLeft = false;
    const channel = this.getChannel();
    const region = layoutView.getRegion('run').el;
    const answers = trial.get("answers") || {};
    while (mainPile.length > 0) {
      const item = mainPile.pop();
      if (item === "") {
        continue;
      }
      const itemScore = item.score(answers);
      if (itemScore) {
        trial.set("intScore", trial.get("intScore") + itemScore);
      }
      if (typeof item.view !== 'function') {
        console.warn(`<${item.tag}> le bloc principal doit uniquement produire des vues.`);
        continue;
      }
      const itemView = item.view(answers);
      if (typeof itemView.onSubmit === 'function') {
        itemView.on("validation:success", (data) => {
          // 1. ajouter dans trial les réponses
          trial.addAnswers(data);
          // 2. détruire la vue du formulaire
          itemView.el.remove();
          // 3. relancer la vue pour le même item.
          const newItemView = item.view(trial.get("answers"));
          region.appendChild(newItemView.el);
          newItemView.render();
          //    le formulaire doit afficher les résultats avec
          //    tous les commentaies nécessaires
          
          // si suite à cela l'exercice est fini, marquer le trial comme terminé
          if (mainPile.length === 0) {
            trial.set("finished", true);
          }
          // mettre à jour le score
          trial.set("intScore", trial.get("intScore") + item.score(data));
          // 4. poursuivre l'exécution de la pile jusqu'au prochain stop
          //    ce qui pourra amener à modifier l'état "finished" de l'exercice
          this.runExercice(mainPile, trial, layoutView);
          
          // 5. sauvegarder l'état du trial
          if (trial.needSave()) {
            trial.save();
            channel.trigger("data:update:notes", trial);
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
      trial.set("finished", true);
      const finishedView = new Finished_View({
        score: trial.get("score"),
        restart: trial.needSave()
      });
      finishedView.on("restart", () => {
        console.log("Restarting exercice...");
        console.log(trial.get("idExoDevoir"), trial.get("idExo"), trial.get("idDevoir"), trial.get("idUser"));
        channel.trigger("exodevoir:run", trial.get("idExoDevoir"), trial.get("idExo"), trial.get("idDevoir"), trial.get("idUser"));
      });
      region.appendChild(finishedView.el);
      finishedView.render();
    }
    // Rendu de KaTeX dans la zone d'exercice
    renderTexInDomElement(region);
  }
});

export const controller = new Controller();