import Radio from 'backbone.radio';
import { MnObject, Region } from 'backbone.marionette';
import { HeaderView } from '@apps/header/show/header_show_view.js';

const navChannel = Radio.channel("navigation");

const navbar = new HeaderView();

const HeaderApp = MnObject.extend({
  channelName: "header",
  radioEvents: {
    'show': 'onShow',
    'loading:up': 'onLoadingUp',
    'loading:down': 'onLoadingDown',
    'logged:changed': 'onLoggedChanged'
  },
  ajaxCount: 0,

  initialize() {
    navbar.on("home:show", this.onHomeShow);
    navbar.on("home:editme", this.onHomeEditme);
    navbar.on("home:login", this.onHomeLogin);
    navbar.on("home:logout", this.onHomeLogout);
    navbar.on("messages:list", this.onHomeEditme);
  },

  onShow() {
    const myRegion = new Region({
      el: '#header-region'   // le sélecteur CSS du div cible
    });
    myRegion.show(navbar);
  },

  show() {
    this.onShow();
  },

  onLoadingDown() {
    this.ajaxCount--
    if (this.ajaxCount <= 0) {
      this.ajaxCount = 0;
      navbar.hideSpinner();
    }
  },

  onLoadingUp() {
    this.ajaxCount++;
    navbar.showSpinner();
  },

  onLoggedChanged() {
    navbar.render();
  },

  onHomeShow() {
    navChannel.trigger("home:show");
  },
  onHomeEditme() {
    navChannel.trigger("logged:show");
  },
  onHomeLogin() {
    navChannel.trigger("home:login");
  },
  onHomeLogout() {
    navChannel.trigger("home:logout");
  },
  onMessagesList() {
    navChannel.trigger("messages:show:list");
  },
});

const headerApp = new HeaderApp();

export { headerApp };