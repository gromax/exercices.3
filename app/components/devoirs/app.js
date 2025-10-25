import Backbone from 'backbone'
import { MnObject } from 'backbone.marionette'

const Controller = MnObject.extend({
  channelName: 'app',
  radioEvents: {
    "devoir:show": "onDevoirShow",
  },

  onDevoirShow(id) {
    Backbone.history.navigate(`devoir:${id}`, {});
    this.devoirShow(id);
  },

  devoirsList() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const forProf = () => {
      channel.trigger("ariane:reset", [{ text: "Devoirs", link: "devoirs" }]);
      channel.trigger("loading:up");
      const fetching = channel.request("custom:entities", ["devoirs"]);
      $.when(fetching).done((devoirs) => {
        require("./list/controller.js").controller.list(devoirs);
      }).fail((response) => {
        channel.trigger("data:fetch:fail", response);
      }).always(() => {
        channel.trigger("loading:down");
      });
    };

    const todo = logged.mapItem({
      "admin": forProf,
      "prof": forProf,
      "eleve": () => channel.trigger("not:found"),
      "def": () => channel.trigger("home:login")
    });

    todo();
  },


  /*
  devoirShowExercices: function(id){
    var auth = app.Auth;
    var devoirEF_list = function(){
      app.Ariane.reset([
        { text:"Devoirs", link:"devoirs"},
        { text:`Devoir #${id}`, link:`devoir:${id}`},
        { text:"Exercices", link:`devoir:${id}/exercices`},
      ]);

      require(["apps/devoirs/edit/edit_fiche_controller"], function(Controller){
        Controller.showExercices(id);
      });
    }

    var todo = auth.mapItem({
      "Admin": devoirEF_list,
      "Prof": devoirEF_list,
      "Eleve": function(){ app.trigger("notFound"); },
      "def": function(){ app.trigger("home:login"); },
    });
    todo();
  },
  */

  devoirShow(id) {
    const channel = this.getChannel();
    channel.trigger("popup:error", "L'affichage de devoir non implémenté pour le moment.");
  },

  /*
  devoirShow(id) {
    const auth = app.Auth;
    const devoirEdition = () => {
      // Affichage du devoir afin d'édition
      app.Ariane.reset([
        { text: "Devoirs", e: "devoirs:list", link: "devoirs" },
        { text: `Devoir #${id}`, e: "devoir:show", data: id, link: `devoir:${id}` }
      ]);
      require("./edit/controller.js").controller.show(id);
    };
    const exoDevoirRun = () => {
      app.Ariane.reset([]);
      require("./run/controller.js").controller.showEleve(id);
    };
    const todo = auth.mapItem({
      "Admin": devoirEdition,
      "Prof": devoirEdition,
      "Eleve": exoDevoirRun,
      "def": () => app.trigger("home:login")
    });

    todo();
  },
  */

  devoirNew() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!logged.isProf()) {
      channel.trigger("not:found");
      return;
    }

    channel.trigger("loading:up");
      const fetching = channel.request("custom:entities", ["classes"]);
      $.when(fetching).done((classes) => {
        if (classes.length === 0) {
          channel.trigger("popup:error", "Impossible de créer un devoir sans classe existante.");
          channel.trigger("not:found");
          return;
        }
        require("./edit/controller.js").controller.newDevoir(classes);
      }).fail((response) => {
        channel.trigger("data:fetch:fail", response);
      }).always(() => {
        channel.trigger("loading:down");
      });
  },
});

const controller = new Controller();

const Router = Backbone.Router.extend({
  routes: {
    "devoirs": "devoirsList",
    "devoir::id": "devoirShow",
    "devoirs/nouveau": "devoirNew",
    //"fiches/fiche-eleve::id": "aUfShow",
    //"devoir::id/exercices": "devoirShowExercices",
    //"devoir::id/fiches-eleves": "devoirShowUserfiches",
    //"devoir::id/ajout-fiche-eleve": "devoirAddUserfiche",
    //"devoir::idUF/exercice::idEF": "showExercicesFaits_Eleve",
    //"devoirs/fiche-eleve::idUF/exercice::idEF": "showExercicesFaits",
    //"exercices-faits/devoir::idUF/exercice::idEF": "showExercicesFaits",
    //"exercices/a-finir(::id)": "showUnfinished"
  },
  devoirsList() {
    controller.devoirsList();
  },

  devoirShow(id) {
    controller.devoirShow(id);
  },

  devoirNew() {
    controller.devoirNew();
  },




  /*
  aUfShow(idUF) {
    // Permet au professeur de voir la fiche devoir d'un élève
    const auth = app.Auth;

    const exoDevoirRun = () => {
      app.Ariane.reset([{ text: "Devoirs", e: "devoirs:list", link: "devoirs" }]);
      require(["apps/devoirs/run/run_controller"], function(Controller){
        Controller.showProf(idUF);
      });
    };

    const todo = auth.mapItem({
      "Admin": exoFicheRun,
      "Prof": exoFicheRun,
      "Eleve": () => app.trigger("notFound"),
      "def": () => app.trigger("home:login"),
    });
    todo();
  },
  */
  


  /*
  devoirShowUserfiches: function(id){
    var auth = app.Auth;
    var devoirUF_list = function(){
      app.Ariane.reset([
        { text:"Devoirs", e:"devoirs:list", link:"devoirs"},
        { text:"Fiche #"+id, e:"fiche:show", data:id, link:"fiche:"+id},
        { text:"Fiches élèves", e:"fiche:showUserfiches", data:id, link:"fiche:"+id+"/fiches-eleves"},
      ]);
      require(["apps/fiches/edit/edit_fiche_controller"], function(Controller){
        Controller.showUserfiches(id);
      });
    }

    var todo = auth.mapItem({
      "Admin": ficheUF_list,
      "Prof": ficheUF_list,
      "Eleve": function(){ app.trigger("notFound"); },
      "def": function(){ app.trigger("home:login"); },
    });
    todo();
  },
  */
  
  /*
  devoirAddUserfiche: function(id){
    var auth = app.Auth;
    var devoirAddUF = function(){
      app.Ariane.reset([
        { text:"Devoirs", e:"devoirs:list", link:"devoirs"},
        { text:"Fiche #"+id, e:"fiche:show", data:id, link:"fiche:"+id},
        { text:"Fiches élèves", e:"fiche:showUserfiches", data:id, link:"fiche:"+id+"/fiches-eleves"},
        { text:"Ajouter", e:"fiche:showAddUserfiche", data:id, link:"fiche:"+id+"/ajout-fiche-eleve"}
      ]);
      require(["apps/fiches/edit/edit_fiche_controller"], function(Controller){
        Controller.showAddUserfiche(id);
      });
    }

    var todo = auth.mapItem({
      "Admin": devoirAddUF,
      "Prof": devoirAddUF,
      "Eleve": function(){ app.trigger("notFound"); },
      "def": function(){ app.trigger("home:login"); },
    });
    todo();
  },
  */

  /*
  showExercicesFaits_Eleve:function(idUF,idEF){
    var auth = app.Auth;
    var forEleve = function(){
      app.Ariane.reset([]);
      require(["apps/fiches/faits/faits_controller"], function(Controller){
        Controller.listForEleve(idUF,idEF);
      });
    }
    var todo = auth.mapItem({
      "Admin": function(){ app.trigger("notFound"); },
      "Prof": function(){ app.trigger("notFound"); },
      "Eleve": forEleve,
      "def": function(){ app.trigger("home:login"); },
    });

    todo();
  },
  */

  /*
  showExercicesFaits(idUF, idEF) {
    const auth = app.Auth;
    const forProf = function(){
      if (!idUF){
        app.trigger("not:found")
      } else if (!idEF) {
        // On affiche la fiche UF pour aiguiller vers les exercices faits par l'élève
        // debug : cette possibilité fait doublon... avec aUfShow
        this.aUfShow(idUF);
      } else {
        app.Ariane.reset([{ text:"Fiches", e:"fiches:list", link:"fiches"}]);
        require(["apps/fiches/faits/faits_controller"], function(Controller){
          Controller.listForProf(idUF,idEF);
        });
      }
    }

    var todo = auth.mapItem({
      "Admin": forProf,
      "Prof": forProf,
      "Eleve": function(){ app.trigger("notFound"); },
      "def": function(){ app.trigger("home:login"); },
    });

    todo();
  },
  */

  /*
  showUnfinished:function(){
    var auth = app.Auth;
    var forEleve = function(){
      app.Ariane.reset([{ text:"Exercices à terminer", e:"faits:unfinished", link:"exercices/a-finir"}]);
      require(["apps/fiches/faits/faits_controller"], function(Controller){
        Controller.unfinishedForEleve();
      });
    }

    var todo = auth.mapItem({
      "Admin": function(){ app.trigger("notFound"); },
      "Prof": function(){ app.trigger("notFound"); },
      "Eleve": forEleve,
      "def": function(){ app.trigger("home:login"); },
    });

    todo();
  },
  */
});


new Router();