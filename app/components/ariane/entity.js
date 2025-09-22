import Backbone from 'backbone'

const ArianeItem = Backbone.Model.extend({});

const ArianeCollection = Backbone.Collection.extend({
    model:ArianeItem
});

const home = {
    text: "<i class='fa fa-home'></i>",
    link: "home",
    active: false
}

const arianeController = {
    collection: new ArianeCollection([ home ]), // comme on ne parse pas ici, le active restera false
    reset(models) {
        models.unshift(home)
        _.each(models, function(item) {
            item.active = true;
        });
        _.last(models).active = false;
        this.collection.reset(models);
    },
    add(model) {
        _.last(this.collection.models).set("active",true)
        if (_.isArray(model)) {
            _.each(model, function(item) {
                item.active = true;
            });
            _.last(model).active = false;
        } else {
            model.active = false;
        }
        this.collection.add(model);
    }
}

export { arianeController }
