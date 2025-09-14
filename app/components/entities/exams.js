const Item = Backbone.Model.extend({
  urlRoot: "api/exams",
  defaults: {
    nom: "Version papier"
  },

  parse: (data) => {
    if (data.id) {
      data.id = Number(data.id);
    }
    data.idFiche = Number(data.idFiche);
    data.locked = (data.locked === "1") || (data.locked === 1) || (data.locked === true);
    if (typeof data.data === "string") {
      data.data = JSON.parse(data.data);
    }
    return data;
  },

  toJSON: () => {
    const output = _.pick(this.attributes, 'id', 'nom', 'idFiche', 'data', 'locked');
    if (typeof output.data === "object") {
      output.data = JSON.stringify(output.data);
    }
    return output;
  },

  toExamBriques: () => {
    const params = this.get("data");
    // params est un tableau de inputs avec idE, options, inputs array
    // Les options sont sous forme { key:value }

    const deferGlobal = $.Deferred();
    let counter = params.length; // permet de compter le travail restant à faire
    const out = params.map(() => ({ children: [], message: false }));

    fct_item_exo = (item, index) => {
      itemParams = params[index];
      idE = itemParams.idE;
      // formatage : options sont données sous forme key:value
      // on le transforme en { key: { value: value } }
      const iteratee_options = (option_item) => { return { value: option_item }; };
      const options = _.mapObject(itemParams.options, iteratee_options);
      const inputs = itemParams.inputs;

      const exoData = Catalog.get(idE);
      if (exoData) {
        const filename = exoData.filename;
        item.title = exoData.title;
        // Prise en compte des paramètres d'options

        const successCB = (exoController) => {
          if (typeof exoController.getExamBriques === "function") {
            _.extend(item, exoController.getExamBriques(inputs, options, exoData.fixedSettings));
          } else {
            item.message = `Cet exercice n'a pas de fonction Exam [#${idE}]`;
          }
          counter--;
          if (counter === 0) {
            deferGlobal.resolve(new ExerciceCollection(out));
          }
        };

        const failedCB = () => {
          item.message = "Le fichier " + filename + " n'a pu être chargé.";
          counter--;
          if (counter === 0) {
            deferGlobal.resolve(new ExerciceCollection(out));
          }
        };

        require([`@entities/exercices/${filename}`], successCB, failedCB);
      } else {
        item.message = `L'exercice #${idE} n'est pas dans le catalogue.`;
        item.title = "Exercice inconnu !";
        counter--;
        if (counter === 0) {
          deferGlobal.resolve(new ExerciceCollection(out));
        }
      }
    };

    if (counter === 0) {
      deferGlobal.resolve(new ExerciceCollection(out));
    } else {
      _.each(out, fct_item_exo);
    }

    return deferGlobal.promise();
  },

  refresh: (exo_index, item_index) => {
    const defer = $.Deferred();
    const data = this.get("data");
    if (data.length < exo_index) {
      defer.reject(`Il n'y a que ${data.length} exercices dans la liste, pas ${exo_index+1} !`);
      return defer.promise();
    }
    const exo_data = data[exo_index];
    if (exo_data.inputs.length < item_index) {
      defer.reject(`L'exercice ${exo_index+1} ne doit être répété que ${exo_data.length}, pas ${exo_index+1} fois !`);
      return defer.promise();
    }
    // L'item peut être réinitialisé
    const idE = exo_data.idE;
    // Il faut reconstruire l'objet options
    const options = _.mapObject(exo_data.options, (itO) => {
      return { value: itO };
    });

    const exoInCatalog = Catalog.get(idE);
    if (exoInCatalog) {
      const filename = exoInCatalog.filename;
      // Prise en compte des paramètres d'options

      const successCB = (exoController) => {
        const inputs = {};
        exoController.init(inputs, options); // Cette fonction change inputs
        exo_data.inputs[item_index] = inputs;

        const briques = { children:[], message:false, title:exoInCatalog.title };

        if (typeof exoController.getExamBriques === "function") {
          _.extend(briques, exoController.getExamBriques(exo_data.inputs,options, exoInCatalog.fixedSettings));
        } else {
          briques.message = "Cet exercice n'a pas de fonction Exam";
        }

        defer.resolve({
          inputs: inputs,
          briques: briques
        });
      };

      const failedCB = () => defer.reject(`Fichier ${filename} introuvable.`);

      require([`@entities/exercices/${filename}`], successCB, failedCB);
    } else {
      defer.reject(`Exercice #${idE} introuvable dans le catalogue.`);
    }
    return defer.promise();
  },

  getTex: () => {
    const defer = $.Deferred();
    const params = this.get("data");
    // params est un tableau de inputs avec idE, options, inputs array
    // Les options sont sous forme { key:value }

    const counter = params.length; // permet de compter le travail restant à faire
    const exercices_tex_object = params.map(() => ({ children: [], title: "", message: false }));
    const templateDatas = {
      exercices: exercices_tex_object,
      id: this.get("id"),
      nom: this.get("nom")
    }

    const fct_remove_blank_lines = (text) => text.replace(/^\s*[\r\n]/gm, "\r\n");

    const fct_item_exo = (item, index) => {
      const template = window.JST["devoirs/exam/exam-tex"];
      const itemParams = params[index];
      const idE = itemParams.idE;
      const iteratee_options = (option_item) => ({ value: option_item });

      const options = _.mapObject(itemParams.options, iteratee_options);
      const inputs = itemParams.inputs;

      const exoData = Catalog.get(idE);
      if (exoData) {
        const filename = exoData.filename;
        item.title = exoData.title;
        // Prise en compte des paramètres d'options

        const successCB = (exoController) => {
          if (typeof exoController.getTex === "function") {
            _.extend(item, exoController.getTex(inputs, options, exoData.fixedSettings));
          } else {
            item.message = "\\textcolor{red}{Cet exercice n'a pas de fonction Tex [#{idE}]}"
          }
          counter--
          if (counter === 0) {
            defer.resolve(fct_remove_blank_lines(template(templateDatas)));
          }
        }

        const failedCB = () => {
          item.message = `\\textcolor{red}{Le fichier \\verb?${filename}? n'a pu être chargé.}`;
          counter--;
          if (counter === 0) {
            defer.resolve(fct_remove_blank_lines(template(templateDatas)));
          }
        }

        require([`entities/exercices/${filename}`], successCB, failedCB);
      } else {
        item.message = `\\textcolor{red}{L'exercice [#${idE}] n'est pas dans le catalogue.}`;
        item.title = "Exercice inconnu";
        counter--;
        if (counter === 0) {
          defer.resolve(fct_remove_blank_lines(template(templateDatas)));
        }
      }
    }

    if (counter === 0) {
      defer.resolve(fct_remove_blank_lines(template(templateDatas)));
    } else {
      _.each(exercices_tex_object, fct_item_exo);
    }

    return defer.promise();
  }
});

const Collection = Backbone.Collection.extend({
  url: "api/exams",
  model: Item
});

export { Item, Collection }
