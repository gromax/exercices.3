import Backbone from 'backbone'
import Radio from 'backbone.radio'

const sessionChannel = Radio.channel('session');

const Session = Backbone.Model.extend({
    urlRoot: "api/session",

    defaults: {
        isOff: true,
        age: 0
    },

    initialize() {
        // Hook into jquery
        // Use withCredentials to send the server cookies
        // The server must allow this through response headers
        $.ajaxPrefilter( function( options, originalOptions, jqXHR) {
            options.xhrFields = {
                withCredentials: true
            };
        });
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
        logged.isRoot = (logged.rank === "Root")
        logged.isAdmin = (logged.rank === "Root") || (logged.rank === "Admin");
        logged.isProf = (logged.rank === "Prof");
        logged.isEleve = (logged.rank === "Élève");
        logged.logged_in = (logged.rank !== "Off");
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

    refresh(data) {
        this.set(this.parse(data));
    },

    load() {
        this.fetch({
            success: function(){
                sessionChannel.trigger("load:success");
            },
            error: function(model, xhr, options) {
                sessionChannel.trigger("load:error", {status:xhr.status, response:xhr.responseText});
            }
        });
    },

    getWithForgottenKey(key) {
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
    },
    
    isAdmin() {
        let rank = this.get("rank");
        return (rank === "Root") || (rank === "Admin");
    },

    isProf() {
        return (this.get("rank") === "Prof");
    },

    isEleve() {
        return (this.get("rank") === "Élève");
    },

    isOff() {
        return this.get("isOff");
    },

    sudo(id) {
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
    },

    mapItem(itemsList){
        itemsList = itemsList || {};
        let rank = this.get("rank");
        switch (rank) {
            case "Root":
                if (_.has(itemsList,"Root")) {
                    return itemsList["Root"]
                } else if (_.has(itemsList,"Admin")) {
                    return itemsList["Admin"];
                } else {
                    return itemsList.def;
                }
            case "Admin":
                if (_.has(itemsList,"Admin")) {
                    return itemsList["Admin"];
                } else {
                    return itemsList.def;
                }
            case "Prof":
                if (_.has(itemsList,"Prof")) {
                    return itemsList["Prof"];
                } else {
                    return itemsList.def;
                }
            case "Élève":
                if (_.has(itemsList,"Eleve")) {
                    return itemsList["Eleve"];
                } else {
                    return itemsList.def;
                }
            default:
                if (_.has(itemsList,"Off")) {
                    return itemsList["Off"];
                } else {
                    return itemsList.def;
                }
        }
    }
});

export { Session };