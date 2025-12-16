import { View } from 'backbone.marionette';
import header_tpl from '@templates/header/show/header-navbar.jst';
import Radio from 'backbone.radio';

const HeaderView = View.extend({
    template: header_tpl,
    logged: { isOff: true },
    triggers: {
        "click a.js-home": "home:show",
        "click a.js-edit-me": "home:editme",
        "click a.js-login": "home:login",
        "click a.js-logout": "logout",
        "click a.js-message": "messages:list"
    },

    events: {
        "click button.js-hamburger": "onClickHamburger"
    },

    onClickHamburger(e){
        // le bouton bootstrap ne fait pas le collapse tout seul car le header
        // j'ai donc ôté la cible data-bs-target et je gère le toggle moi-même
        e.preventDefault();
        const div = $("#navbarContent")
        div.toggleClass("show")
    },

    showSpinner(){
        $("span.js-spinner", this.$el).html("<i class='fa fa-spinner fa-spin'></i>");
    },

    hideSpinner(){
        $("span.js-spinner", this.$el).html("");
    },

    templateContext() {
        const logged = Radio.channel("app").request("logged:get");
        return {
            isRoot: logged.isRoot(),
            isAdmin: logged.isAdmin(),
            isProf: logged.isProf(),
            isEleve: logged.isEleve(),
            isOff: logged.isOff(),
            nomComplet: logged.get("nomComplet"),
            unread: (logged.unread || 0),
        };
    },
});

export { HeaderView };
