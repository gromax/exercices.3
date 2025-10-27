import { Behavior } from 'backbone.marionette';
import Radio from 'backbone.radio';
const radioApp = Radio.channel("app");

const Form = Behavior.extend({
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
  },
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
    let updatingItem = model.save(data);
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

export default Form;