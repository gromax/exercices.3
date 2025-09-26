import Backbone from 'backbone'
import Radio from 'backbone.radio'

const channel = Radio.channel('app');

const Session = Backbone.Model.extend({
    urlRoot: "api/session",

    defaults: {
        isOff: true,
        age: 0
    },

    sync(method, model, options) {
        options = options || {};
        const token = localStorage.getItem('jwt');
        options.beforeSend = function (xhr) {
            if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
        };
        return Backbone.sync(method, model, options);
    },

    validate(attrs, options) {
        const errors = {};
        if (!attrs.identifiant) {
            errors["identifiant"] = "L'email ne doit pas être vide";
        }
        if (!attrs.pwd) {
            errors["pwd"] = "Le mot de passe ne doit pas être vide";
        }
        if (!_.isEmpty(errors)){
            return errors;
        }
    },

    toJSON() {
        return {
            identifiant: this.get("identifiant"),
            pwd: this.get("pwd")
        };
    },

    parse(data) {
        let logged = data.logged;
        if (data.token) {
            localStorage.setItem('jwt', data.token);
        }
        if (!logged.nomClasse) {
            logged.nomClasse = "N/A";
        }
        logged.unread = Number(logged.unread || 0);
        logged.isRoot = (logged.rank === "root")
        logged.isAdmin = (logged.rank === "root") || (logged.rank === "admin");
        logged.isProf = (logged.rank === "prof");
        logged.isEleve = (logged.rank === "eleve");
        logged.logged_in = (logged.rank !== "off");
        if (logged.logged_in) {
            logged.nomComplet = `${logged.prenom} ${logged.nom}`;
        } else {
            logged.nomComplet = "";
        }
        logged.isOff = ! logged.logged_in;
        if ((typeof logged.pref === "string") && (logged.pref !== "")){
            logged.pref = JSON.parse(logged.pref);
        } else {
            logged.pref = {
                mathquill:true
            };
        }
        return logged;
    },

    load(callBack) {
        /* Charge la session depuis le serveur */
        const that = this;
        this.fetch({
            success: function(){
                console.log("Session loaded");
                if (callBack) callBack();
            },
            error: function(model, xhr, options) {
                channel.trigger("popup:error", {
                    message: "Erreur au chargment de la session."
                })
                console.warn(`session error : ${xhr.status}, response:${xhr.responseText}`);
            }
        });
    },

    /*getWithForgottenKey(key) {
        let defer = $.Deferred()
        let request = $.ajax(`api/forgotten/${key}`, {
            method:'GET',
            dataType:'json'
        });
        request.done( (response) => {
            this.refresh(response)
            defer.resolve()
        }).fail( function(response){
            defer.reject(response);
        });
        return defer.promise();
    },*/
    
    isRoot() {
        /* Renvoie true si l'utilisateur est root */
        return (this.get("rank") === "root");
    },

    isAdmin() {
        /* Renvoie true si l'utilisateur est admin (ou root) */
        let rank = this.get("rank");
        return (rank === "root") || (rank === "admin");
    },

    isProf() {
        /* Renvoie true si l'utilisateur est prof (et pas eleve ni off) */
        return (this.get("rank") === "prof");
    },

    isEleve() {
        /* Renvoie true si l'utilisateur est eleve (et pas prof ni off) */
        return (this.get("rank") === "eleve");
    },

    isOff() {
        /* Renvoie true si l'utilisateur est off (et pas prof ni eleve) */
        return this.get("isOff");
    },

    sudo(id) {
        let that = this;
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
            channel.request("data:purge");
            const logged = channel.request("logged:get");
            localStorage.setItem('jwt', response.token);
            logged.set(logged.parse(response));
            defer.resolve();
        }).fail( function(response){
            defer.reject(response);
        });
        return defer.promise();
    },

    mapItem(itemsList){
        /* Renvoie l'item de la liste correspondant au rang de l'utilisateur
        itemsList doit être un objet avec des clés "root", "admin", "prof", "eleve", "off" et "def"
        Si la clé correspondant au rang n'existe pas, on renvoie l'item "def"
        Si le rang est inconnu, on renvoie l'item "off" ou "def" s'il n'existe pas
        */
        itemsList = itemsList || {};
        let rank = this.get("rank");
        switch (rank) {
            case "root":
                if (_.has(itemsList,"root")) {
                    return itemsList["root"]
                } else if (_.has(itemsList,"admin")) {
                    return itemsList["admin"];
                } else {
                    return itemsList.def;
                }
            case "admin":
                if (_.has(itemsList,"admin")) {
                    return itemsList["admin"];
                } else {
                    return itemsList.def;
                }
            case "prof":
                if (_.has(itemsList,"prof")) {
                    return itemsList["prof"];
                } else {
                    return itemsList.def;
                }
            case "eleve":
                if (_.has(itemsList,"eleve")) {
                    return itemsList["eleve"];
                } else {
                    return itemsList.def;
                }
            default:
                if (_.has(itemsList,"off")) {
                    return itemsList["off"];
                } else {
                    return itemsList.def;
                }
        }
    }
});

export { Session };