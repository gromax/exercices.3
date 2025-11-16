import { View } from 'backbone.marionette';
import form_tpl from '@templates/exercices/run/exercice.form.jst';

const FormView = View.extend({
  template: form_tpl,
  triggers: {
    'submit form': 'submit'
  },
  templateContext() {
    return {
      header: this.getOption("header")
    };
  },
  onRender() {
    const container = this.el.querySelector('.js-content');
    const subViews = this.getOption("subViews") || [];
    for (const subView of subViews) {
      container.appendChild(subView.el);
      subView.render();
    }
  },

  onSubmit() {
    const form = this.el.querySelector('form');
    const fdata = new FormData(form);
    const data = Object.fromEntries(fdata.entries());
    this.dataSubmit(data);
  },

  dataSubmit(data) {
    const blocParent = this.getOption("blocParent");
    if (!blocParent || typeof blocParent.validation !== 'function') {
      console.warn("Pas de validation possible, bloc parent manquant ou invalide");
      this.trigger("validation:success", data);
      return;
    }
    const errors = blocParent.validation(data);
    if (errors) {
      this.showErrors(errors);
      return;
    }
    this.trigger("validation:success", data);
  },

  clearForm() {
    let $view = this.$el;
    $(".is-invalid",$view).each(function() { $(this).removeClass("is-invalid"); });
    $(".is-valid",$view).each(function() { $(this).removeClass("is-valid"); });
    $view.find(".invalid-feedback.d-block").remove();
  },

  showErrors(errors) {
    let $view = this.$el;
    this.clearForm();

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
});

export default FormView;
