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
      $sortEl.append("<span class='js-sort-icon'>&nbsp;<i class='fa fa-sort-amount-desc'></i></span>");
      collection.comparatorAttr = `inv_${tag}`;
      collection.comparator = function(a,b) {
        if (a.get(tag)>b.get(tag)) {
          return -1;
        } else {
          return 1;
        }
      };
    } else {
       $sortEl.append("<span class='js-sort-icon'>&nbsp;<i class='fa fa-sort-amount-asc'></i></span>");
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
    let model = this.view.model
    let message = `Supprimer l'élément #${model.get("id")} ?`;
    if (confirm(message)) {
      destroyRequest = model.destroy()
      radioApp.trigger("loading:up");
      $.when(destroyRequest).done( function(){
        let view = this.view;
        view.$el.fadeOut( function(){
          view.trigger("model:destroy", view.model);
          view.remove();
        });
      }).fail( function(response){
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
  events: {
    'click @ui.submit': 'submitClicked'
  },

  submitClicked(e) {
    e.preventDefault();
    e.stopPropagation() // empêche la propagation d'un click à l'élément parent dans le dom
    const form = this.el.querySelector('form');
    const fdata = new FormData(form);
    const data = Object.fromEntries(fdata.entries());
    this.view.trigger("form:submit", data);
  },
  clearForm() {
    let $view = this.view.$el
    $(".is-invalid",$view).each(function() { $(this).removeClass("is-invalid"); });
    //$(".is-valid",$view).each -> $(@).removeClass("is-valid")
    $view.find("div.alert").each(function(){ $(this).remove(); });
    $view.find(".invalid-feedback.d-block").remove();
  },
  onFormDataValid() {
    // nettoyage d'erreurs précédentes
    this.clearForm();
  },
  onFormDataInvalid(errors) {
    let $view = this.view.$el;
    let messagesDivId = this.getOption("messagesDivId");
    let markErrors;
    if (Array.isArray(errors)) {
      let $messagesContainer = $(`#${messagesDivId}`,$view);
      if (!$messagesContainer) {
        $messagesContainer = $view.append(`<div id='${messagesDivId}'></div>`);
      }
      markErrors = function(value) {
        if (value.success) {
          $messagesContainer.append($("<div>", { class: "alert alert-success", role:"alert", text: value.message }));
        } else {
          $messagesContainer.append($("<div>", { class: "alert alert-danger", role:"alert", text: value.message }));
        }
      };
    } else {
      markErrors = function(value, key) {
        let $inp = $view.find("input[name='#{key}']");
        let html = "";
        if (Array.isArray(value)){
          let reduceFct = function(m,v,i) { return `${m}<p>${v}</p>`; }
          html = _.reduce(value, reduceFct, "")
        } else {
          html = value;
        }
        let $feedback = $inp.siblings('.invalid-feedback').first();
        if ($feedback.length === 0) {
          let $parent = $inp.closest('.form-group');
          $feedback = $("<div class='invalid-feedback d-block'></div>").appendTo($parent)
        }
        $feedback.html(html);
        $inp.addClass("is-invalid");
      }
    }
    // nettoyage d'erreurs précédentes
    this.clearForm();
    _.each(errors, markErrors)
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
    // pour une création fournir listView
    // pour une modification fournir itemView
    let model = this.view.model
    // éventuellement une création, si on a fourni "collection"
    let updatingFunctionName = this.getOption("updatingFunctionName");
    let updatingItem = model[updatingFunctionName](data);
    if (updatingItem) {
      radioApp.trigger("loading:up");
      let view = this.view;
      $.when(updatingItem).done( function(){
        let itemView = view.getOption("itemView");
        let listView = view.getOption("listView");
        itemView?.render() // cas d'une itemView existante
        const collection = listView?.collection;
        if (collection && !collection.get(model.get("id"))) {
          // c'est un ajout
          collection.add(model);
        }
        view.trigger("dialog:close"); // si ce n'est pas une vue dialog, le trigger ne fait rien
        // soit itemView éxistait et on flash direct
        itemView?.trigger("flash:success");
        // soit on a fournit la liste et on flash via la liste
        listView?.children.findByModel(model)?.trigger("flash:success");
        let onSuccess = view.getOption("onSuccess");
        if (onSuccess) {
          onSuccess(model,data);
        }
      }).fail( function(response){
        switch (response.status) {
          case 422:
            view.trigger("form:data:invalid", response.responseJSON.errors);
            break;
          case 401:
            alert("Vous devez vous (re)connecter !");
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
            alert(`Erreur inconnue. Essayez à nouveau ou prévenez l'administrateur [code ${response.status}${errorCode}]`);
        }
      }).always( function() {
        radioApp.trigger("loading:down");
      });
    } else {
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
