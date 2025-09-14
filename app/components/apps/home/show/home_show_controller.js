import Radio from 'backbone.radio';
import { MnObject, Region } from 'backbone.marionette';
import { EleveListeDevoirs, EleveLayout, UnfinishedsView } from './home_eleve_views';
import { NotFoundView } from './not_found_view';
import { OffView } from './off_view';
import { ForgottenKeyView } from './forgotten_key_view';
import { AdminProfPanel } from './admin_prof_panel';

// import { AlertView } from 'apps/common/common_views.coffee'

const headerChannel = Radio.channel("header");

const Controller = MnObject.extend({
  channelName: "navigation",
  notFound() {
    const view = new NotFoundView();
    new Region({ el: '#main-region'}).show(view);
  },
  showAdminHome() {
    let unread = Radio.channel('session').request("get").get("unread");
    const view = new AdminProfPanel({adminMode:true, unread:unread});
    view.on("show:list", (cible)=> this.getChannel().trigger(`${cible}:list`));
    new Region({ el: '#main-region'}).show(view);
  },
  showProfHome() {
    let unread = Radio.channel('session').request("get").get("unread");
    const view = new AdminProfPanel({adminMode:false, unread:unread});
    view.on("show:list", (cible)=> this.getChannel().trigger(`${cible}:list`));
    new Region({ el: '#main-region'}).show(view);
  },
  showOffHome() {
    const view = new OffView();
    view.on("home:login", () => { this.getChannel().trigger("home:login"); });
    new Region({ el: '#main-region'}).show(view);
  },
  showEleveHome() {
    headerChannel.trigger("loading:up");
    let layout = new EleveLayout();
    let channel = this.getChannel();
    //require('entities/dataManager.coffee');
    let fetchingData = channel.request("custom:entities", ["userfiches", "exofiches", "faits"]);
    $.when(fetchingData).done( (userfiches, exofiches, faits) => {
      listEleveView = new EleveListeDevoirs({
        collection: userfiches,
        exofiches: exofiches,
        faits: faits
      });
      listEleveView.on("item:devoir:show", (childView) => {
        model = childView.model;
        this.getChannel().trigger("devoir:show", model.get("id"));
      });
      let unfinishedMessageView = null;
      listeUnfinished = _.filter(
        faits.where({ finished: false }),
        function(item){
          let uf = userfiches.get(item.get("aUF"));
          if (uf.get("actif") && uf.get("ficheActive")){
            return true;
          } else {
            return false;
          }
        }
      );
      let n = listeUnfinished.length;
      if (n>0){
        // Il existe des exerices non terminés, on affiche la vue correspondante
        unfinishedMessageView = new UnfinishedsView({ number:n });
        unfinishedMessageView.on("unfinished:show", () => {
          this.getChannel().trigger("faits:unfinished");
        });
        layout.on("render", function(){
          layout.getRegion('devoirsRegion').show(listEleveView);
          if (unfinishedMessageView){
            layout.getRegion('unfinishedRegion').show(unfinishedMessageView);
          }
        });
        new Region({ el: '#main-region'}).show(layout);
      }
    }).fail( (response) => {
      this.getChannel().trigger("data:fetch:fail", response);
    }).always( function(){
      headerChannel.trigger("loading:down");
    });
  },

  showLogOnForgottenKey(success) {
    if (success) {
      let view = new ForgottenKeyView();
      view.on("forgotten:reinitMDP:click", () => {
        this.getChannel().trigger("user:editPwd", null);
      });
      new Region({ el: '#main-region'}).show(view);
    } else {
      this.getChannel().trigger("show:message:error", {
        title:"Clé introuvable !",
        message:"L'adresse que vous avez saisie n'est pas valable."
      });
    }
  }
});

const controller = new Controller();

export { controller }

