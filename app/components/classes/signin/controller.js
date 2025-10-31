import { MnObject, Region } from 'backbone.marionette';
import { SigninClassesCollectionView } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',

  showSigninClasses(classes) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (logged.isEleve()) {
      const idClasseEleve = logged.get("idClasse");
      classes = classes.filter( (c) => c.get("id") !== idClasseEleve );
    }
    const listClassesView = new SigninClassesCollectionView({
      collection: classes
    });
    listClassesView.on("item:join", (childView) => {
      channel.trigger("user:classe:signin", childView.model.get("id"));
    });
    new Region({ el: "#main-region" }).show(listClassesView);
  },
});

export const controller = new Controller();
