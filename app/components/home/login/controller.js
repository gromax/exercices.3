import { MnObject } from 'backbone.marionette'
import { LoginView, ForgottenView } from './view'

const Controller = MnObject.extend({
    channelName: "app",
    showLogin() {
        const channel = this.getChannel();
        const view = new LoginView({
            model: channel.request("logged:get"),
            showForgotten:true
        });
        view.on("success", (data) => {
            channel.trigger("home:show");
        });

        channel.request("region:main").show(view);
    },

    showForgottenAsk() {
        const channel = this.getChannel()
        const view = new ForgottenView()
        view.on("forgotten:ask", (email) => {
            channel.trigger("loading:up")
            const sending = channel.request("session:forgotten:ask", email)
            $.when(sending).done( function(response){
                channel.trigger("popup:success", {
                  title:"Email envoyé",
                  message:`Si cet email existe, un message a été envoyé à l'adresse ${email}. Veuillez vérifier dans votre boîte mail et cliquer sur le lien contenu dans le mail. [Cela peut prendre plusieurs minutes...]`
                });
            }).fail( function(response){
                channel.trigger("data:fetch:fail", response)
            }).always( function(){
                channel.trigger("loading:down");
            })
        })
        channel.request("region:main").show(view);
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
        channel.request("region:main").show(view);
    }
});

const controller = new Controller();

export { controller };
