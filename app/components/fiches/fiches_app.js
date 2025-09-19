import { app } from 'app'

const Router = Backbone.Router.extend({
  routes: {
    "fiches": "fichesList",
    "fiche::id": "ficheShow",
    "fiches/fiche-eleve::id": "aUfShow",
    "fiche::id/exercices": "ficheShowExercices",
    "fiche::id/fiches-eleves": "ficheShowUserfiches",
    "fiche::id/ajout-fiche-eleve": "ficheAddUserfiche",
    "fiche::id/tex": "ficheShowExams",
    "fiche/tex::idT": "examShow",
    "fiche::idUF/exercice::idEF": "showExercicesFaits_Eleve",
    "fiches/fiche-eleve::idUF/exercice::idEF": "showExercicesFaits",
    "exercices-faits/fiche::idUF/exercice::idEF": "showExercicesFaits",
    "exercices/a-finir(::id)": "showUnfinished"
  },

  fichesList() {
    const auth = app.Auth;
    const profFct = () => {
      app.Ariane.reset([{ text: "Fiches", e: "fiches:list", link: "fiches" }]);
      require("./list/controller.js").controller.list();
    };

    const todo = auth.mapItem({
      "Admin": profFct,
      "Prof": profFct,
      "Eleve": () => app.trigger("not:found"),
      "def": () => app.trigger("home:login")
    });

    todo();
  },

  ficheShow(id) {
    const auth = app.Auth;
    const ficheEdition = () => {
      // Affichage de la fiche afin d'édition
      app.Ariane.reset([
        { text: "Fiches", e: "fiches:list", link: "fiches" },
        { text: `Fiche #${id}`, e: "fiche:show", data: id, link: `fiche:${id}` }
      ]);
      require("./edit/controller.js").controller.show(id);
    };
    const exoFicheRun = () => {
      app.Ariane.reset([]);
      require("./run/controller.js").controller.showEleve(id);
    };
    const todo = auth.mapItem({
      "Admin": ficheEdition,
      "Prof": ficheEdition,
      "Eleve": exoFicheRun,
      "def": () => app.trigger("home:login")
    });

    todo();
  },

  aUfShow(idUF) {
    // Permet au professeur de voir la fiche devoir d'un élève
    const auth = app.Auth;

    const exoFicheRun = () => {
      app.Ariane.reset([{ text: "Fiches", e: "fiches:list", link: "fiches" }]);
      require(["apps/fiches/run/run_controller"], function(Controller){
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

  ficheShowExercices: function(id){
    var auth = app.Auth;
    var ficheEF_list = function(){
      app.Ariane.reset([
        { text:"Fiches", e:"fiches:list", link:"fiches"},
        { text:"Fiche #"+id, e:"fiche:show", data:id, link:"fiche:"+id},
        { text:"Exercices", e:"fiche:showExercices", data:id, link:"fiche:"+id+"/exercices"},
      ]);

      require(["apps/fiches/edit/edit_fiche_controller"], function(Controller){
        Controller.showExercices(id);
      });
    }

    var todo = auth.mapItem({
      "Admin": ficheEF_list,
      "Prof": ficheEF_list,
      "Eleve": function(){ app.trigger("notFound"); },
      "def": function(){ app.trigger("home:login"); },
    });
    todo();
  },

  ficheShowUserfiches: function(id){
    var auth = app.Auth;
    var ficheUF_list = function(){
      app.Ariane.reset([
        { text:"Fiches", e:"fiches:list", link:"fiches"},
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

  ficheAddUserfiche: function(id){
    var auth = app.Auth;
    var ficheAddUF = function(){
      app.Ariane.reset([
        { text:"Fiches", e:"fiches:list", link:"fiches"},
        { text:"Fiche #"+id, e:"fiche:show", data:id, link:"fiche:"+id},
        { text:"Fiches élèves", e:"fiche:showUserfiches", data:id, link:"fiche:"+id+"/fiches-eleves"},
        { text:"Ajouter", e:"fiche:showAddUserfiche", data:id, link:"fiche:"+id+"/ajout-fiche-eleve"}
      ]);
      require(["apps/fiches/edit/edit_fiche_controller"], function(Controller){
        Controller.showAddUserfiche(id);
      });
    }

    var todo = auth.mapItem({
      "Admin": ficheAddUF,
      "Prof": ficheAddUF,
      "Eleve": function(){ app.trigger("notFound"); },
      "def": function(){ app.trigger("home:login"); },
    });
    todo();
  },

  ficheShowExams: function(id){
    var auth = app.Auth;
    var fct = function(){
      app.Ariane.reset([
        { text:"Fiches", e:"fiches:list", link:"fiches"},
        { text:"Fiche #"+id, e:"fiche:show", data:id, link:"fiche:"+id},
        { text:"Tex"},
      ]);
      require(["apps/fiches/edit/edit_fiche_controller"], function(Controller){
        Controller.showExams(id);
      });
    }

    var todo = auth.mapItem({
      "Admin": fct,
      "Prof": fct,
      "Eleve": function(){ app.trigger("notFound"); },
      "def": function(){ app.trigger("home:login"); },
    });
    todo();

  },

  examShow: function(idT){
    var auth = app.Auth;
    var fct = function(){
      app.Ariane.reset([
        { text:"Fiches", e:"fiches:list", link:"fiches"},
      ]);
      require(["apps/fiches/exam/exam_controller"], function(Controller){
        Controller.show(idT);
      });
    }

    var todo = auth.mapItem({
      "Admin": fct,
      "Prof": fct,
      "Eleve": function(){ app.trigger("notFound"); },
      "def": function(){ app.trigger("home:login"); },
    });
    todo();
  },

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
});


const router = new Router();

app.on("fiches:list", function(){
  app.navigate("fiches");
  router.fichesList();
});


app.on("fiche:show", function(id){
  app.navigate("fiche:" + id);
  API.ficheShow(id);
});

app.on("fiche:showExercices", function(id){
  app.navigate("fiche:" + id+"/exercices");
  API.ficheShowExercices(id);
});

app.on("fiche:showUserfiches", function(id){
  app.navigate("fiche:" + id+"/fiches-eleves");
  API.ficheShowUserfiches(id);
});

app.on("fiche:addUserfiche", function(id){
  app.navigate("fiche:" + id+"/ajout-fiche-eleve");
  API.ficheAddUserfiche(id);
});

app.on("fiche:exams", function(id){
  // app.navigate("fiche:" + id+"/ajout-fiche-eleve");
  // API.ficheAddUserfiche(id);
  app.navigate("fiche:" + id+"/tex");
  API.ficheShowExams(id);
});

app.on("fiche:exam", function(idT){
  app.navigate("fiche/tex:"+idT);
  API.examShow(idT);
});

app.on("fiches:fiche-eleve:show", function(id){
  // navigation prof depuis fiche
  app.navigate("fiches/fiche-eleve:" + id);
  API.aUfShow(id);
});


app.on("fiches:fiche-eleve:faits", function(idUF,idEF){
  // navigation prof depuis une fiche fiche vers l'élève
  // Voir la liste des exercices faits dans pour une fiche UF
  // et pour l'exercice EF
  app.navigate("fiches/fiche-eleve:"+idUF+"/exercice:"+idEF);
  API.showExercicesFaits(idUF,idEF);
});

app.on("userfiche:exofiche:faits", function(idUF,idEF){
  // navigation d'un élève
  // Voir la liste des exercices faits dans pour une fiche UF
  // et pour l'exercice EF
  app.navigate("fiche:"+idUF+"/exercice:"+idEF);
  API.showExercicesFaits_Eleve(idUF,idEF);
});


app.on("faits:unfinished", function(){
  // Voir la liste des exercices faits pas terminés
  app.navigate("exercices/a-finir");
  API.showUnfinished();
});
