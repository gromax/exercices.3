import { Behavior } from 'backbone.marionette';
import Radio from 'backbone.radio';

const radioApp = Radio.channel("app");

const SortList = Behavior.extend({
  events: {
    "click a.js-sort":"sortFct"
  },

  sortFct(e) {
    e.preventDefault();
    this.view.$el.find(".js-sort-icon").remove();
    let $sortEl = $(e.currentTarget);
    let tag = $sortEl.data("sort");
    let collection = this.view.collection;
    if (collection.comparatorAttr === tag) {
      $sortEl.append("<span class='js-sort-icon' style='margin-left: 5px;'><i class='fa fa-sort-amount-desc'></i></span>");
      collection.comparatorAttr = `inv_${tag}`;
      collection.comparator = function(a,b) {
        if (a.get(tag)>b.get(tag)) {
          return -1;
        } else {
          return 1;
        }
      };
    } else {
       $sortEl.append("<span class='js-sort-icon' style='margin-left: 5px;'><i class='fa fa-sort-amount-asc'></i></span>");
       collection.comparatorAttr = tag;
       collection.comparator = tag;
    }
    collection.sort();
  }
});

const FilterList = Behavior.extend({
  initialize() {
    if ((typeof this.view.options.filterCriterion !== "undefined") && (this.options.filterCriterion !== "")) {
      this.trigger("set:filter:criterion", this.view.options.filterCriterion, { preventRender: true });
    }
  },
  onSetFilterCriterion(criterion, options) {
    criterion = criterion.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if ((criterion === "") || (typeof this.view.getOption("filterKeys") === "undefined")) {
      this.view.removeFilter(options);
    } else {
      let filterKeys = this.view.getOption("filterKeys");
      let parseFct = function(model){
        const reductionFct = function(m,k) {
          return m+model.get(k);
        }
        return _.reduce(filterKeys, reductionFct, "").normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
      };
      let filterFct = function(view, index, children) {
        return parseFct(view.model).indexOf(criterion) !== -1;
      };
      this.view.setFilter(filterFct, options);
    }
  }
});

const DestroyWarn = Behavior.extend({
  ui: {
    destroy: '.js-delete'
  },

  events: {
    'click @ui.destroy': 'warnBeforeDestroy'
  },

  warnBeforeDestroy(e) {
    e.preventDefault();
    e.stopPropagation(); // empêche la propagation d'un click à l'élément parent dans le dom
    const model = this.view.model;
    const message = `Supprimer l'élément #${model.get("id")} : ${model.get("nomComplet")} ?`;
    if (confirm(message)) {
      const destroyRequest = model.destroy();
      radioApp.trigger("loading:up");
      $.when(destroyRequest).fail( function(response){
        alert("Erreur. Essayez à nouveau !");
      }).always( function() {
        radioApp.trigger("loading:down");
      });
    }
  }
});

const SubmitClicked = Behavior.extend({
  ui: {
    submit: 'button.js-submit'
  },
  messagesDivId: "messages",

  onRender() {
    // Ce code s’exécute après le render de la vue
    // Tu peux manipuler le DOM ici, le formulaire existe
    const that = this;
    let form = this.view.el.querySelector('form');
    if (!form) {
      console.warn("Aucun formulaire trouvé dans la vue !");
      return;
    }

    form.addEventListener('submit', function(event) {
      event.preventDefault();
      event.stopPropagation();
      const fdata = new FormData(form);
      const data = Object.fromEntries(fdata.entries());
      Array.from(form.elements).filter(el => el.type === "checkbox").forEach(function(element) {
        if (element.name) {
          data[element.name] = element.checked ? 1 : 0; // ou true/false
        }
      });
      if (that.view.model) {
        const errors = that.view.model.validate ? that.view.model.validate(data) : null;
        if (errors) {
          that.view.trigger("form:data:invalid", errors);
          return;
        }
      }
      that.view.trigger("form:submit", data);
    }, false);
  },

  clearForm() {
    let $view = this.view.$el
    $(".is-invalid",$view).each(function() { $(this).removeClass("is-invalid"); });
    $(".is-valid",$view).each(function() { $(this).removeClass("is-valid"); });
    $view.find(".invalid-feedback.d-block").remove();
  },
  onFormDataValid() {
    this.clearForm();
  },
  onFormDataInvalid(errors) {
    let $view = this.view.$el;
    this.clearForm();
    if (Array.isArray(errors)) {
      for (const key in errors) {
        const error = errors[key];
        if (error.success) {
          radioApp.trigger("popup:success", error.message);
        } else {
          radioApp.trigger("popup:error", error.message);
        }
      }
      return;
    }
    $view.find("input").each(function(index, item) {
      $(item).addClass("is-valid").off("input").on("input", function() {
        $(this).removeClass("is-invalid").removeClass("is-valid");
      });
    });
    Object.entries(errors).forEach(([key, value]) => {
      const $inp = $view.find(`input[name='${key}']`);
      if ($inp.length === 0) {
        console.warn(`Aucun champ trouvé pour la clé ${key}`);
        return;
      }
      let $feedback = $inp.siblings('.invalid-feedback').first();
      if ($feedback.length === 0) {
        let $parent = $inp.parent();
        $feedback = $("<div class='invalid-feedback d-block'></div>").appendTo($parent);
      }
      let html = value;
      if (Array.isArray(value)){
        let reduceFct = function(m,v,i) { return `${m}<p>${v}</p>`; }
        html = _.reduce(value, reduceFct, "")
      }
      $feedback.html(html);
      $inp.removeClass("is-valid");
      $inp.addClass("is-invalid");
    });
  }
});

const FlashItem = Behavior.extend({
  onFlashSuccess() {
    this.flash("success");
  },
  onFlashError() {
    this.flash("danger");
  },
  flash(cssClass) {
    let $view = this.$el;
    let preCss;
    if (this.view.tagName === "tr") {
      preCss = "table-"; // dans Bootstrap
    } else {
      preCss = "";
    }
    $view.hide().toggleClass(preCss+cssClass).fadeIn(800, function(){
      setTimeout( function(){ $view.toggleClass(preCss+cssClass); }, 500);
    });
  }
});

const ToggleItemValue = Behavior.extend({
  onToggleAttribute(attributeName) {
    let model = this.view.model;
    let attributeValue = model.get(attributeName);
    model.set(attributeName, !attributeValue);
    let updatingItem = model.save();
    let self = this;
    if (updatingItem) {
      radioApp.trigger("loading:up");
      $.when(updatingItem).done( function(){
        self.view.render();
        self.view.trigger("flash:success");
      }).fail( function(response) {
        if (response.status === 401) {
          alert("Vous devez vous (re)connecter !");
          radioApp.trigger("home:logout");
        } else {
          let errorCode = self.view.getOption("errorCode");
          if (errorCode) {
            errorCode = `/${errorCode}`
          } else {
            errorCode = ""
          }
          alert(`Erreur inconnue. Essayez à nouveau ou prévenez l'administrateur [code ${response.status}${errorCode}]`);
        }
      }).always( function(){
        radioApp.trigger("loading:down");
      });
    } else {
      this.view.trigger("flash:error");
    }
  }
});

const EditItem = Behavior.extend({
  updatingFunctionName: "save",
  onFormSubmit(data) {
    let fct = this.view.getOption("onFormSubmit");
    if (typeof fct === "function") {
      fct(data);
    } else {
      this.view.trigger("edit:submit", data);
    }
  },
  onEditSubmit(data) {
    let model = this.view.model
    let updatingFunctionName = this.getOption("updatingFunctionName");
    let updatingItem = model[updatingFunctionName](data);
    if (updatingItem) {
      radioApp.trigger("loading:up");
      let view = this.view;
      $.when(updatingItem).done( function(){
        view.trigger("dialog:close");
        view.trigger("success", model, data);
      }).fail( function(response){
        switch (response.status) {
          case 422:
            view.trigger("form:data:invalid", response.responseJSON.errors);
            break;
          case 401:
            radioApp.trigger("popup:alert", "Vous devez vous (re)connecter !");
            view.trigger("dialog:close");
            radioApp.trigger("home:logout");
            break;
          default:
            let errorCode= view.getOption("errorCode");
            if (errorCode) {
              errorCode = `/${errorCode}`;
            } else {
              errorCode = "";
            }
            radioApp.trigger("popup:alert", `Erreur inconnue. Essayez à nouveau ou prévenez l'administrateur [code ${response.status}${errorCode}]`);
        }
      }).always( function() {
        radioApp.trigger("loading:down");
      });
    } else {
      console.log("Validation errors :", model.validationError);
      this.view.trigger("form:data:invalid",model.validationError);
    }
  }
});

const FilterPanel = Behavior.extend({
  ui: {
    criterion: "input.js-filter-criterion",
    form: "#filter-form",
  },
  events: {
    "submit @ui.form": "applyFilter",
  },

  applyFilter(e) {
    e.preventDefault();
    let criterion = this.ui.criterion.val();
    this.view.trigger("items:filter", criterion);
  },
  onSetFilterCriterion(criterion) {
    this.ui.criterion.val(criterion);
  }
});

export { SortList, FilterList, DestroyWarn, SubmitClicked, FlashItem, EditItem, ToggleItemValue, FilterPanel }
