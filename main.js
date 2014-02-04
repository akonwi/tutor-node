// Generated by CoffeeScript 1.6.3
(function() {
  var __slice = [].slice;

  define(['views', 'word'], function(Views, WordModule) {
    var Router, Words;
    Words = WordModule.collection;
    Router = (function() {
      function Router() {}

      Router.prototype.go = function() {
        var args, page;
        page = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        if (this[page] != null) {
          return typeof this[page] === "function" ? this[page](args[0], args[1]) : void 0;
        } else {
          return this.home();
        }
      };

      Router.prototype.home = function() {
        return this.render(new Views.home());
      };

      Router.prototype.addWords = function() {
        return this.render(new Views.addWords({
          collection: this.words()
        }));
      };

      Router.prototype.studyWords = function(words) {
        if (words != null) {
          return this.render(new Views.study({
            collection: words
          }));
        } else {
          return this.render(new Views.preStudy({
            collection: this.words()
          }));
        }
      };

      Router.prototype.render = function(view) {
        return App.container.show(view);
      };

      Router.prototype.words = function() {
        return App.words;
      };

      return Router;

    })();
    return function() {
      window.App = new Marionette.Application;
      App.addRegions({
        container: '#container'
      });
      App.addInitializer(function(options) {
        this.router = new Router();
        return this.words = new Words(_.shuffle(db.getAllData()));
      });
      App.on('initialize:after', function() {
        return this.router.go('home');
      });
      return App.start();
    };
  });

}).call(this);
