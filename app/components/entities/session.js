import Backbone from 'backbone'
import Radio from 'backbone.radio'

const sessionChannel = Radio.channel('session');

const Session = Backbone.Model.extend({
    urlRoot: "api/session",

    defaults: {
        isOff: true,
        age: 0
    },

    validate(attrs, options) {
        const errors = [];
        if (!attrs.identifiant) {
            errors.push({ success:false, message:"L'email ne doit pas être vide" });
        }
        if (!attrs.pwd) {
            errors.push({ success:false, message:"Le mot de passe ne doit pas être vide" });
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
        let logged = data;
        if (data.logged) {
            logged = data.logged;
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

    load() {
        this.fetch({
            success: function(){
                console.log("Session loaded");
            },
            error: function(model, xhr, options) {
                sessionChannel.trigger("load:error", {status:xhr.status, response:xhr.responseText});
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
    
    isAdmin() {
        let rank = this.get("rank");
        return (rank === "root") || (rank === "admin");
    },

    isProf() {
        return (this.get("rank") === "prof");
    },

    isEleve() {
        return (this.get("rank") === "eleve");
    },

    isOff() {
        return this.get("isOff");
    },

    /*sudo(id) {
        let that = this;
        let defer = $.Deferred();
        if (!this.isAdmin()){
            defer.reject({status:403});
        } else {
            let request = $.ajax(`api/session/sudo/${id}`, {
                method:"POST",
                dataType:"json"
            });
            request.done( function(response) {
                that.refresh(response);
                Radio.channel('entities').request("data:purge");
                defer.resolve();
            }).fail( function(response){
                defer.reject(response);
            });
        }
        return defer.promise();
    },*/

    mapItem(itemsList){
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