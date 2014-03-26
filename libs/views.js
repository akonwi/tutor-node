(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['word'], function(WordsModule) {
    var AddWordsView, ChooseWordsView, EditWordView, EditWords, EditWordsCollection, EditWordsSearch, HomeView, StudyView, TitleView, Word, Words, to_return;
    Word = WordsModule.model;
    Words = WordsModule.collection;
    Backbone.View.prototype.router = function() {
      return Tutor.router;
    };
    to_return = {
      home: HomeView = (function(_super) {
        __extends(HomeView, _super);

        function HomeView() {
          return HomeView.__super__.constructor.apply(this, arguments);
        }

        HomeView.prototype.template = Handlebars.compile($('#home-view').html());

        HomeView.prototype.events = {
          'click #add-words-button': function(e) {
            return this.router().go('addWords');
          },
          'click #study-button': function(e) {
            return this.router().go('studyWords');
          },
          'click #edit-words-button': function(e) {
            return this.router().go('edit');
          }
        };

        return HomeView;

      })(Marionette.Layout),
      addWords: AddWordsView = (function(_super) {
        __extends(AddWordsView, _super);

        function AddWordsView() {
          return AddWordsView.__super__.constructor.apply(this, arguments);
        }

        AddWordsView.prototype.template = Handlebars.compile($('#add-words-view').html());

        AddWordsView.prototype.events = {
          'click #home': function(e) {
            return this.router().go('home');
          },
          'click #studyWords': function(e) {
            return this.router().go('studyWords');
          }
        };

        AddWordsView.prototype.render = function() {
          this.$el.html(this.template());
          this.initialize_form();
          return this;
        };

        AddWordsView.prototype.initialize_form = function() {
          var $dropdown, $form, rules;
          rules = {
            word: {
              identifier: 'word',
              rules: [
                {
                  type: 'empty',
                  prompt: "Can't have a blank entry"
                }, {
                  type: 'exists',
                  prompt: 'That word already exists'
                }
              ]
            },
            definition: {
              identifier: 'definition',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Need a definition'
                }
              ]
            }
          };
          $.fn.form.settings.rules.empty = function(value) {
            return !_.isEmpty(value);
          };
          $.fn.form.settings.rules.exists = (function(_this) {
            return function(value) {
              var exists;
              exists = _this.collection.findWhere({
                word: value
              });
              return exists == null;
            };
          })(this);
          $dropdown = this.$el.find('.ui.selection.dropdown').dropdown();
          $form = this.$el.find('.ui.form');
          $form.form(rules, {
            inline: true,
            on: 'submit'
          });
          return $form.form('setting', {
            onSuccess: function() {
              var attr, word;
              attr = {};
              attr.type = $dropdown.dropdown('get value');
              if (_.isString(attr.type)) {
                attr.word = $form.form('get field', 'word').val();
                attr.definition = $form.form('get field', 'definition').val();
                word = new Word(attr);
                return word.save({}, {
                  success: function(model) {
                    $form.form('get field', 'word').val('');
                    $form.form('get field', 'definition').val('');
                    return $('#word-input').focus();
                  }
                });
              } else {
                return Messenger().post({
                  message: 'Please choose a type',
                  type: ''
                });
              }
            }
          });
        };

        return AddWordsView;

      })(Marionette.Layout),
      preStudy: ChooseWordsView = (function(_super) {
        __extends(ChooseWordsView, _super);

        function ChooseWordsView() {
          return ChooseWordsView.__super__.constructor.apply(this, arguments);
        }

        ChooseWordsView.prototype.template = Handlebars.compile($('#choose-words-view').html());

        ChooseWordsView.prototype.events = {
          'click #home': function(e) {
            return this.router().go('home');
          }
        };

        ChooseWordsView.prototype.render = function() {
          this.$el.html(this.template());
          this.initialize_form();
          return this;
        };

        ChooseWordsView.prototype.initialize_form = function() {
          var $dropdown, $form, rules;
          rules = {
            type: {
              identifier: 'type',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Need a type'
                }
              ]
            }
          };
          $dropdown = this.$el.find('.ui.selection.dropdown').dropdown();
          $form = this.$el.find('.ui.form');
          $form.form(rules, {
            on: 'submit'
          });
          return $form.form('setting', {
            onSuccess: (function(_this) {
              return function() {
                var word_type, words;
                word_type = $dropdown.dropdown('get value');
                words = _this.collection;
                if (word_type !== 'all') {
                  words = new Words(words).where({
                    type: word_type
                  });
                }
                return _this.router().go('studyWords', words);
              };
            })(this),
            onFailure: function() {
              return Messenger().post({
                message: 'Please choose which type of words to study',
                type: ''
              });
            }
          });
        };

        return ChooseWordsView;

      })(Marionette.Layout),
      study: StudyView = (function(_super) {
        __extends(StudyView, _super);

        function StudyView() {
          return StudyView.__super__.constructor.apply(this, arguments);
        }

        StudyView.prototype.template = Handlebars.compile($('#study-words-view').html());

        StudyView.prototype.events = {
          'click #studyWords': function(e) {
            return this.router().go('studyWords');
          },
          'click #addWords': function(e) {
            return this.router().go('addWords');
          }
        };

        StudyView.prototype.regions = {
          title: '.teal.header'
        };

        StudyView.prototype.initialize = function() {
          this.model = this.collection.shift().clone();
          return this.model.on('change', (function(_this) {
            return function(model) {
              _this.title.show(new TitleView({
                model: model
              }));
              return _this.initialize_form();
            };
          })(this));
        };

        StudyView.prototype.render = function() {
          this.$el.html(this.template());
          this.title.show(new TitleView({
            model: this.model
          }));
          this.initialize_form();
          return this;
        };

        StudyView.prototype.initialize_form = function() {
          var $form, definition, rules;
          definition = this.model.get('definition');
          rules = {
            definition: {
              identifier: 'definition',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Give it a try'
                }, {
                  type: "is[" + definition + "]",
                  prompt: "Sorry that's incorrect"
                }
              ]
            }
          };
          $form = this.$el.find('.ui.form').form(rules, {
            inline: true,
            on: 'submit'
          });
          return $form.form('setting', {
            onSuccess: (function(_this) {
              return function() {
                return _this.showNext();
              };
            })(this)
          });
        };

        StudyView.prototype.showNext = function() {
          var next_word;
          if (next_word = this.collection.shift()) {
            this.model.set(next_word.attributes);
            return $('#definition-input').val('');
          } else {
            Messenger().post({
              message: 'There are no more words',
              type: ''
            });
            return this.router().go('home');
          }
        };

        return StudyView;

      })(Marionette.Layout),
      editWords: EditWords = (function(_super) {
        __extends(EditWords, _super);

        function EditWords() {
          return EditWords.__super__.constructor.apply(this, arguments);
        }

        EditWords.prototype.template = Handlebars.compile($('#edit-words-view').html());

        EditWords.prototype.regions = {
          main: '#center-column',
          search: '#search-column'
        };

        EditWords.prototype.render = function() {
          var collectionView, searchView;
          this.$el.html(this.template());
          collectionView = new EditWordsCollection({
            collection: this.collection
          });
          this.main.show(collectionView);
          searchView = new EditWordsSearch().on('filterChange', function(val) {
            return collectionView.filterBy(val);
          });
          this.search.show(searchView);
          return this;
        };

        return EditWords;

      })(Marionette.Layout)
    };
    EditWordView = (function(_super) {
      __extends(EditWordView, _super);

      function EditWordView() {
        return EditWordView.__super__.constructor.apply(this, arguments);
      }

      EditWordView.prototype.template = Handlebars.compile($('#edit-word-view').html());

      EditWordView.prototype.events = {
        'click .red.button': 'delete'
      };

      EditWordView.prototype.render = function() {
        this.$el.html(this.template(this.model.attributes));
        this.initialize_form();
        return this;
      };

      EditWordView.prototype.initialize_form = function() {
        var $form, rules;
        rules = {
          definition: {
            identifier: 'definition',
            rules: [
              {
                type: 'empty',
                prompt: 'Need a definition'
              }
            ]
          }
        };
        $form = this.$el.find('.ui.form').form(rules, {
          inline: true,
          on: 'submit'
        });
        return $form.form('setting', {
          onSuccess: (function(_this) {
            return function() {
              var new_def;
              new_def = $form.form('get field', 'definition').val();
              return _this.model.save({
                definition: new_def
              });
            };
          })(this)
        });
      };

      EditWordView.prototype["delete"] = function(e) {
        return this.model.destroy();
      };

      return EditWordView;

    })(Marionette.ItemView);
    EditWordsCollection = (function(_super) {
      __extends(EditWordsCollection, _super);

      function EditWordsCollection() {
        return EditWordsCollection.__super__.constructor.apply(this, arguments);
      }

      EditWordsCollection.prototype.itemView = EditWordView;

      EditWordsCollection.prototype.initialize = function() {
        return this.filteredBy = '';
      };

      EditWordsCollection.prototype.filterBy = function(val) {
        this.filteredBy = val;
        return this.render();
      };

      EditWordsCollection.prototype.addItemView = function(model) {
        if (!~model.get('word').indexOf(this.filteredBy)) {
          return;
        }
        return EditWordsCollection.__super__.addItemView.apply(this, arguments);
      };

      return EditWordsCollection;

    })(Marionette.CollectionView);
    EditWordsSearch = (function(_super) {
      __extends(EditWordsSearch, _super);

      function EditWordsSearch() {
        return EditWordsSearch.__super__.constructor.apply(this, arguments);
      }

      EditWordsSearch.prototype.template = Handlebars.compile($('#edit-words-search-view').html());

      EditWordsSearch.prototype.className = 'ui inverted floating thin right sidebar vertical menu active';

      EditWordsSearch.prototype.events = {
        'input': function(e) {
          return this.trigger('filterChange', $(e.target).val());
        }
      };

      return EditWordsSearch;

    })(Marionette.Layout);
    TitleView = (function(_super) {
      __extends(TitleView, _super);

      function TitleView() {
        return TitleView.__super__.constructor.apply(this, arguments);
      }

      TitleView.prototype.template = Handlebars.compile("{{word}}");

      return TitleView;

    })(Marionette.ItemView);
    return to_return;
  });

}).call(this);
