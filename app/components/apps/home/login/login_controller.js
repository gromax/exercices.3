import { MnObject, Region } from 'backbone.marionette';
import { LoginView } from '@apps/home/login/login_view.js';

const Controller = MnObject.extend({
  channelName: "app",
  showLogin() {
    const channel = this.getChannel();
    const view = new LoginView({ generateTitle: true, showForgotten:true });
    view.on("form:submit", (data) => {
      let logged = channel.request("logged:get");
      let openingSession = logged.save(data);
      if (openingSession){
        channel.trigger("loading:up");
        $.when(openingSession).done( function(response){
          channel.trigger("home:show");
        }).fail((xhr) => {
          channel.trigger("data:fetch:fail", xhr, "025");
        }).always(() => {
          channel.trigger("loading:down");
        });
        /*Promise.resolve(openingSession)
          .then(() => {
            channel.trigger("home:show");
          })
          .catch((xhr) => {
            commonChannel.trigger("data:fetch:fail", xhr, "025");
          })
          .finally(() => {
            headerChannel.trigger("loading:down");
          })*/
      } else {
        view.triggerMethod("form:data:invalid", logged.validationError);
      }
    });

    view.on("login:forgotten", (email) => {
      // Vérification de l'email
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      if (!re.test(email)){
        view.triggerMethod("form:data:invalid", [{ success:false, message: "L'email n'est pas valide"}]);
      } else {
        channel.trigger("loading:up");
        let sendingMail = channel.request("forgotten:password", email);
        sendingMail.done( function(response){
          channel.trigger("show:message:success", {
            title:"Email envoyé",
            message:"Un message a été envoyé à l'adresse #{email}. Veuillez vérifier dans votre boîte mail et cliquer sur le lien contenu dans le mail. [Cela peut prendre plusieurs minutes...]"
          });
        }).fail( function(response){
          channel.trigger("data:fetch:fail", response, "033");
        }).always( function(){
          channel.trigger("loading:down");
        })
      }
    });
    new Region({ el: '#main-region'}).show(view);
  },
  showReLogin(options) {
    let that = this;
    let view = new LoginView({ generateTitle: false, showForgotten:false, title:"Reconnexion" });
    this.listenTo(view, "dialog:closed", function(){
      return (options && typeof options.fail == 'function') && options.fail();
    });

    const channel = this.getChannel();

    view.on("form:submit", function(data){
      const logged = sessionChannel.request("get");
      if ((data.identifiant === "") || (data.identifiant === logged.get("identifiant"))){
        // C'est bien la même personne qui se reconnecte
        let openingSession = logged.save(data);
        if (openingSession){
          channel.trigger("loading:up");
          $.when(openingSession).done( function(response){
            that.stopListening();
            view.trigger("dialog:close");
            return (options && typeof options.done == 'function') && options.done();
          }).fail( function(response){
            channel.trigger("data:fetch:fail", response, "025");
          }).always( function(){
            channel.trigger("loading:down");
          });
        } else {
          view.triggerMethod("form:data:invalid", logged.validationError);
        }
      } else {
        view.triggerMethod("form:data:invalid", [{success:false, message:"C'est une reconnexion : Vous devez réutiliser le même identifiant que précedemment."}]);
      }
    });
    new Region({ el: '#main-region'}).show(view);
  }
});

const controller = new Controller();

export { controller };
