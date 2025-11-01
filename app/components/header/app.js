import { MnObject, Region } from 'backbone.marionette';
import { HeaderView } from './view.js';

const navbar = new HeaderView();
const headerRegion = new Region({ el: '#header-region' });

const HeaderApp = MnObject.extend({
  channelName: "app",
  radioEvents: {
    'loading:up': 'onLoadingUp',
    'loading:down': 'onLoadingDown',
    'logged:changed': 'onLoggedChanged'
  },
  ajaxCount: 0,

  initialize() {
    const channel = this.getChannel();
    navbar.on("home:show", () => { channel.trigger("home:show"); });
    navbar.on("home:editme", () => { channel.trigger("user:show:me"); });
    navbar.on("home:login", () => { channel.trigger("home:login"); });
    navbar.on("home:logout", () => { channel.trigger("home:logout"); });
    navbar.on("messages:list", () => { channel.trigger("messages:show:list"); });
  },

  show() {
    headerRegion.show(navbar);
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
  }
});

const headerApp = new HeaderApp();

export { headerApp };