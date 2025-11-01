import { Toast } from 'bootstrap';
import { View } from 'backbone.marionette'
import alert_tpl from '@templates/alerts/alert-view.jst'
import popup_tpl from '@templates/alerts/popup.jst'

const AlertView = View.extend ({
  tag: "div",
  type: "danger",
  title: "Erreur !",
  message: "Erreur inconnue. Reessayez !",
  dismiss:false,
  template: alert_tpl,
  className() {
    return `alert alert-${this.getOption('type')}`;
  },
  templateContext() {
    return {
      title: this.getOption("title"),
      message: this.getOption("message"),
      type: this.getOption("type"),
      dismiss: this.getOption("dismiss")
    };
  }
});

const PopupView = View.extend ({
  template: popup_tpl,
  title: "Alerte",
  message: "Ceci est un message d'alerte.",
  type: "alert",
  onRender() {
    const modalEl = this.el.querySelector('.toast');
    if (modalEl) {
      const toast = new Toast(modalEl, { autohide: false });
      toast.show();
    }
  },
  templateContext() {
    return {
      title: this.getOption("title"),
      message: this.getOption("message"),
      type: this.getOption("type"),
      time: this.getOption("time")
    };
  }
});

export { AlertView, PopupView };