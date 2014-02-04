// Generated by CoffeeScript 1.6.3
(function() {
  module.exports = function(Backbone) {
    var method_map;
    Backbone.sync = function(method, model, options) {
      return method_map[method](model, options);
    };
    return method_map = {
      create: function(model, options) {
        var attributes;
        console.log("creating model...");
        attributes = model.toJSON();
        return db.insert(attributes, function(err, doc) {
          if (err != null) {
            model.trigger('request', model, err, options);
          }
          model.trigger('request', model, doc, options);
          if (err != null) {
            if (typeof options.error === "function") {
              options.error(doc, err);
            }
          }
          return typeof options.success === "function" ? options.success(doc, err) : void 0;
        });
      },
      update: function(model, options) {
        var attributes;
        console.log("updating , model");
        attributes = model.toJSON();
        return db.update({
          _id: attributes._id
        }, attributes, {}, function(err, numReplaced) {
          if (err != null) {
            model.trigger('request', model, err, options);
          }
          model.trigger('request', model, numReplaced, options);
          if (err != null) {
            if (typeof options.error === "function") {
              options.error(numReplaced);
            }
          }
          if (numReplaced != null) {
            return typeof options.success === "function" ? options.success(numReplaced) : void 0;
          }
        });
      },
      "delete": function(model, options) {
        var attributes;
        console.log("deleting model...");
        attributes = model.toJSON();
        return db.remove({
          _id: attributes._id
        }, function(err) {
          if (err != null) {
            model.trigger('request', model, err, options);
          }
          model.trigger('request', model, null, options);
          if (err != null) {
            return typeof options.error === "function" ? options.error(err) : void 0;
          } else {
            return typeof options.success === "function" ? options.success() : void 0;
          }
        });
      },
      read: function(model, options) {
        console.log("fetching model from database...");
        return db.findOne({
          _id: model.get('_id')
        }, function(err, doc) {
          if (err != null) {
            model.trigger('request', model, err, options);
          }
          model.trigger('request', model, doc, options);
          if (typeof options.error === "function") {
            options.error(doc, err);
          }
          return typeof options.success === "function" ? options.success(doc) : void 0;
        });
      }
    };
  };

}).call(this);
