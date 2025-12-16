import { MyModel } from '../common/entity.js'
import Radio from 'backbone.radio'
import Ranks from '../common/ranks.js'
import Misc from '../common/misc.js';

const channel = Radio.channel('app');

const Session = MyModel.extend({
    urlRoot: "api/session",

    defaults: {
        isOff: true,
        nomComplet: "Déconnecté",
        rank: Ranks.DISCONNECTED,
        unread: 0,
        age: 0
    },

    validate(attrs, options) {
        const errors = {}
        if (!attrs.identifiant) {
            errors["identifiant"] = "L'email ne doit pas être vide"
        }
        if (!attrs.pwd) {
            errors["pwd"] = "Le mot de passe ne doit pas être vide"
        }
        if (!_.isEmpty(errors)){
            return errors
        }
    },

    toJSON() {
        return {
            identifiant: this.get("identifiant"),
            pwd: this.get("pwd")
        };
    },

    parse(data) {
        let logged = data.logged
        if (data.token) {
            localStorage.setItem('jwt', data.token)
        }
        if (!logged.nomClasse) {
            logged.nomClasse = "N/A"
        }
        logged.unread = Number(logged.unread || 0)
        if (typeof logged.rank != "undefined" ){
            logged.rank = Number(logged.rank)
        } else {
            logged.rank = Ranks.DISCONNECTED
        }
        logged.rankName = Ranks.getLabel(logged.rank)
        if (logged.rank !== Ranks.DISCONNECTED) {
            logged.nomComplet = `${logged.prenom} ${logged.nom}`
        } else {
            logged.nomComplet = "Déconnecté"
        }
        if ((typeof logged.pref === "string") && (logged.pref !== "")){
            logged.pref = JSON.parse(logged.pref)
        } else {
            logged.pref = {
                mathquill:true
            }
        }
        if (typeof logged.adminMode !== "undefined"){
            logged.adminMode = Misc.parseBoolean(logged.adminMode)
        } else if ((typeof logged.adminMode === "undefined") && (logged.rank === Ranks.ADMIN)) {
            logged.adminMode = false
        }
        return logged
    },

    load(callBack) {
        /* Charge la session depuis le serveur */
        this.fetch({
            success: function(){
                if (callBack) callBack()
            },
            error: function(model, xhr, options) {
                channel.trigger("popup:error", {
                    message: "Erreur au chargment de la session."
                })
                console.warn(`session error : ${xhr.status}, response:${xhr.responseText}`)
            }
        });
    },

    getWithForgottenKey(key) {
        const defer = $.Deferred()
        const request = $.ajax(`api/forgotten/${key}`, {
            method:'GET',
            dataType:'json'
        })
        request.done( (response) => {
            if (response && response.token) {
                localStorage.setItem('jwt', response.token)
            }
            // parse() attend { logged: {...} } donc passer response complet
            this.set(this.parse(response), { validate: false })
            defer.resolve()
        }).fail( function(response){
            defer.reject(response)
        })
        return defer.promise()
    },
    
    isRoot() {
        /* Renvoie true si l'utilisateur est root */
        return (this.get("rank") === Ranks.ROOT);
    },

    isAdmin() {
        /* Renvoie true si l'utilisateur est admin (ou root) */
        let rank = this.get("rank");
        return (rank === Ranks.ROOT) || ((rank === Ranks.ADMIN) && this.get("adminMode"));
    },

    isProf() {
        /* Renvoie true si l'utilisateur est prof (et pas eleve ni off) */
        return (this.get("rank") === Ranks.PROF) || (this.get("rank") === Ranks.ADMIN && !this.get("adminMode"));
    },

    isEleve() {
        /* Renvoie true si l'utilisateur est eleve (et pas prof ni off) */
        return (this.get("rank") === Ranks.ELEVE);
    },

    isOff() {
        /* Renvoie true si l'utilisateur est off (et pas prof ni eleve) */
        return this.get("rank") === Ranks.DISCONNECTED;
    },

    sudo(id) {
        let defer = $.Deferred();
        if (!this.isAdmin()){
            defer.reject({status:403});
            return defer.promise();
        }
        let request = $.ajax(`api/session/sudo/${id}`, {
            method:"POST",
            dataType:"json",
            headers: localStorage.getItem('jwt') ? { Authorization: 'Bearer ' + localStorage.getItem('jwt') } : {}
        });
        request.done( function(response) {
            // le token
            channel.trigger("data:purge");
            const logged = channel.request("logged:get");
            localStorage.setItem('jwt', response.token);
            logged.set(logged.parse(response));
            defer.resolve();
        }).fail( function(response){
            defer.reject(response);
        });
        return defer.promise();
    },

    kill() {
        this.unset("id");
        localStorage.removeItem('jwt');
    },

    promotable() {
        /* Indique si l'utilisateur peut être promu en admin */
        return this.get("rank") === Ranks.ADMIN && !this.get("adminMode");
    },

    demotable() {
        /* Indique si l'utilisateur peut quitter le mode admin */
        return this.get("rank") === Ranks.ADMIN && this.get("adminMode");
    }

});

export { Session };