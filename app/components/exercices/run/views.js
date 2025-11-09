import { View } from 'backbone.marionette';
const JXG = require('jsxgraph');
import options_tpl from '@templates/exercices/run/exercice-options.jst'
import text_tpl from '@templates/exercices/run/exercice-text.jst'
import params_tpl from '@templates/exercices/run/exercice-apercu-params.jst' // pour l'aperçu des paramètres
import unknown_tpl from '@templates/exercices/run/exercice-unknown.jst'
import help_tpl from '@templates/exercices/run/exercice-help.jst'
import radio_tpl from '@templates/exercices/run/exercice-radio.jst'
import form_tpl from '@templates/exercices/run/exercice.form.jst'
import exercice_finished_tpl from '@templates/exercices/run/exercice-finished.jst'
import exercice_results_tpl from '@templates/exercices/run/exercice-results.jst'
import exercice_input_tpl from '@templates/exercices/run/exercice-input.jst'
import layout_tpl from '@templates/exercices/run/layout.jst'
import graph_tpl from '@templates/exercices/run/exercice-graph.jst'
import table_tpl from '@templates/exercices/run/exercice-table.jst'

const KEYS = {
  'sqrt': '$\\sqrt{x}$',
  'power': '$x^y$',
  'square': '$x^2$',
}

const OptionsView = View.extend({
  template: options_tpl,
  triggers: {
    'click .js-submit': 'submit'
  },
  templateContext() {
    return {
      options: this.getOption("options"),
      selected: this.getOption("selected")
    };
  },
  onSubmit() {
    const data = {};
    this.$('select').each(function() {
      data[this.name] = this.value;
    });
    this.trigger('change', data);
  }
});

const ParamsView = View.extend({
  template: params_tpl,
  templateContext() {
    return {
      params: this.getOption("params")
    };
  }
});

const UnknownView = View.extend({
  template: unknown_tpl,
  templateContext() {
    return {
      name: this.getOption("name"),
      code: this.getOption("code")
    };
  }
});

const TextView = View.extend({
  template: text_tpl,
  templateContext() {
    return {
      header: this.getOption("header"),
      subtitle: this.getOption("subtitle"),
      paragraphs: this.getOption("paragraphs"),
      footer: this.getOption("footer"),
      info: this.getOption("info"),
      warning: this.getOption("warning")
    };
  }
});

const HelpView = View.extend({
  template: help_tpl,
  triggers: {
    'click .js-collapse': 'toggleCollapse'
  },
  templateContext() {
    return {
      subtitle: this.getOption("subtitle"),
      paragraphs: this.getOption("paragraphs"),
    };
  },

  onToggleCollapse() {
    const target = this.el.querySelector('div .card-body');
    if (target) {
      target.classList.toggle('show');
    }
  }
});

const RadioView = View.extend({
  template: radio_tpl,
  templateContext() {
    return {
      name: this.getOption("name"),
      items: this.getOption("items"),
      answer: this.getOption("answer")
    };
  }
});

const InputView = View.extend({
  template: exercice_input_tpl,
  templateContext() {
    return {
      name: this.getOption("name"),
      tag: this.getOption("tag"),
      answer: this.getOption("answer"),
      keyboard: Object.fromEntries(this.getOption("keyboard").map(k => [k, KEYS[k] || k]))
    };
  },
  triggers: {
    'click .js-sqrt': 'keyboard:sqrt',
    'click .js-power': 'keyboard:power',
    'click .js-square': 'keyboard:square',
  },
  onKeyboardSqrt() {
    const {start, end, value} = this._getInputSelection();
    const newValue = value.slice(0, start) + 'sqrt(' + value.slice(start,end) + ')' + value.slice(end);
    const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
    input.value = newValue;
  },

  onKeyboardSquare() {
    const {start, end, value} = this._getInputSelection();
    const newValue = end-start <=1
      ? value.slice(0, end) + '^2' + value.slice(end)
      : value.slice(0, start) + '(' + value.slice(start,end) + ')^2' + value.slice(end);
    const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
    input.value = newValue;
  },

  onKeyboardPower() {
    const {start, end, value} = this._getInputSelection();
    const newValue = end-start <=1
      ? value.slice(0, end) + '^' + value.slice(end)
      : value.slice(0, start) + '(' + value.slice(start,end) + ')^' + value.slice(end);
    const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
    input.value = newValue;
  },

  _getInputSelection() {
    const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
    return { start: input.selectionStart, end: input.selectionEnd, value: input.value };
  }



});

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

const ResultsView = View.extend({
  template: exercice_results_tpl,
  templateContext() {
    return {
      items: this.getOption("items")
    };
  }
});

const Finished_View = View.extend({
  template: exercice_finished_tpl,
  templateContext() {
    return {
      score: this.getOption("score")
    };
  }
});

const LayoutView = View.extend({
  template: layout_tpl,
  regions: {
    optionsSet: ".options-set",
    initParams: ".initparams",
    run: ".run"
  }
});

const GraphView = View.extend({
  template: graph_tpl,
  onRender() {
    const container = this.el.querySelector('.js-content');
    const xmin = this.getOption("xmin") || -5;
    const xmax = this.getOption("xmax") || 5;
    const ymin = this.getOption("ymin") || -5;
    const ymax = this.getOption("ymax") || 5;
    const graph = JXG.JSXGraph.initBoard(container, {
      boundingbox: [xmin, ymax, xmax, ymin],
      axis: true
    });

    for (const element of this.getOption("elements") || []) {
      if (element.type == "function") {
        graph.create("functiongraph", [
          element.function,
          element.xmin || xmin,
          element.xmax || xmax
        ], element.options || {});
      }
    }
  }
});

const TableView = View.extend({
  template: table_tpl,
  templateContext() {
    return {
      headers: this.getOption("headers"),
      rows: this.getOption("rows")
    };
  }
});


export {
  OptionsView,
  ParamsView,
  TextView,
  Finished_View,
  UnknownView,
  HelpView,
  RadioView,
  FormView,
  ResultsView,
  InputView,
  LayoutView,
  TableView
};
