var $, Builder, Events, SelfClosingTags, Tags, View, callAttachHook, docEl, exports, idCounter, jQuery, matches, matchesSelector, methodName, originalCleanData, _fn, _fn1, _i, _j, _len, _len1, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

if (typeof require === 'function') {
  $ = jQuery = require('./jquery-extensions');
} else {
  $ = jQuery = window.jQuery;
}

Tags = 'a abbr address article aside audio b bdi bdo blockquote body button canvas caption cite code colgroup datalist dd del details dfn div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup html i iframe ins kbd label legend li map mark menu meter nav noscript object ol optgroup option output p pre progress q rp rt ruby s samp script section select small span strong style sub summary sup table tbody td textarea tfoot th thead time title tr u ul video area base br col command embed hr img input keygen link meta param source track wbrk'.split(/\s+/);

SelfClosingTags = {};

'area base br col command embed hr img input keygen link meta param source track wbr'.split(/\s+/).forEach(function(tag) {
  return SelfClosingTags[tag] = true;
});

Events = 'blur change click dblclick error focus input keydown keypress keyup load mousedown mousemove mouseout mouseover mouseup resize scroll select submit unload'.split(/\s+/);

docEl = document.documentElement;

matches = docEl.matchesSelector || docEl.mozMatchesSelector || docEl.webkitMatchesSelector || docEl.oMatchesSelector || docEl.msMatchesSelector;

matchesSelector = matches ? (function(elem, selector) {
  return matches.call(elem[0], selector);
}) : (function(elem, selector) {
  return elem.is(selector);
});

idCounter = 0;

View = (function(_super) {
  __extends(View, _super);

  View.builderStack = null;

  Tags.forEach(function(tagName) {
    return View[tagName] = function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = this.currentBuilder).tag.apply(_ref, [tagName].concat(__slice.call(args)));
    };
  });

  View.subview = function(name, view) {
    return this.currentBuilder.subview(name, view);
  };

  View.text = function(string) {
    return this.currentBuilder.text(string);
  };

  View.tag = function() {
    var args, tagName, _ref;
    tagName = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return (_ref = this.currentBuilder).tag.apply(_ref, [tagName].concat(__slice.call(args)));
  };

  View.raw = function(string) {
    return this.currentBuilder.raw(string);
  };

  View.pushBuilder = function() {
    var builder;
    builder = new Builder;
    if (this.builderStack == null) {
      this.builderStack = [];
    }
    this.builderStack.push(builder);
    return this.currentBuilder = builder;
  };

  View.popBuilder = function() {
    this.currentBuilder = this.builderStack[this.builderStack.length - 2];
    return this.builderStack.pop();
  };

  View.buildHtml = function(fn) {
    var html, postProcessingSteps, _ref;
    this.pushBuilder();
    fn.call(this);
    return _ref = this.popBuilder().buildHtml(), html = _ref[0], postProcessingSteps = _ref[1], _ref;
  };

  View.render = function(fn) {
    var div, fragment, html, postProcessingSteps, step, _i, _len, _ref;
    _ref = this.buildHtml(fn), html = _ref[0], postProcessingSteps = _ref[1];
    div = document.createElement('div');
    div.innerHTML = html;
    fragment = $(div.childNodes);
    for (_i = 0, _len = postProcessingSteps.length; _i < _len; _i++) {
      step = postProcessingSteps[_i];
      step(fragment);
    }
    return fragment;
  };

  function View() {
    var args, element, html, postProcessingSteps, step, _i, _j, _len, _len1, _ref, _ref1;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    _ref = this.constructor.buildHtml(function() {
      return this.content.apply(this, args);
    }), html = _ref[0], postProcessingSteps = _ref[1];
    jQuery.fn.init.call(this, html);
    if (this.length !== 1) {
      throw new Error("View markup must have a single root element");
    }
    this.wireOutlets(this);
    this.bindEventHandlers(this);
    jQuery.data(this[0], 'view', this);
    _ref1 = this[0].getElementsByTagName('*');
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      element = _ref1[_i];
      jQuery.data(element, 'view', this);
    }
    this[0].setAttribute('callAttachHooks', true);
    for (_j = 0, _len1 = postProcessingSteps.length; _j < _len1; _j++) {
      step = postProcessingSteps[_j];
      step(this);
    }
    if (typeof this.initialize === "function") {
      this.initialize.apply(this, args);
    }
  }

  View.prototype.buildHtml = function(params) {
    var html, postProcessingSteps, _ref;
    this.constructor.builder = new Builder;
    this.constructor.content(params);
    _ref = this.constructor.builder.buildHtml(), html = _ref[0], postProcessingSteps = _ref[1];
    this.constructor.builder = null;
    return postProcessingSteps;
  };

  View.prototype.wireOutlets = function(view) {
    var element, outlet, _i, _len, _ref;
    _ref = view[0].querySelectorAll('[outlet]');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      element = _ref[_i];
      outlet = element.getAttribute('outlet');
      view[outlet] = $(element);
      element.removeAttribute('outlet');
    }
    return void 0;
  };

  View.prototype.bindEventHandlers = function(view) {
    var element, eventName, methodName, selector, _fn, _i, _j, _len, _len1, _ref;
    for (_i = 0, _len = Events.length; _i < _len; _i++) {
      eventName = Events[_i];
      selector = "[" + eventName + "]";
      _ref = view[0].querySelectorAll(selector);
      _fn = function(element) {
        var methodName;
        methodName = element.getAttribute(eventName);
        element = $(element);
        return element.on(eventName, function(event) {
          return view[methodName](event, element);
        });
      };
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        element = _ref[_j];
        _fn(element);
      }
      if (matchesSelector(view, selector)) {
        methodName = view[0].getAttribute(eventName);
        (function(methodName) {
          return view.on(eventName, function(event) {
            return view[methodName](event, view);
          });
        })(methodName);
      }
    }
    return void 0;
  };

  View.prototype.pushStack = function(elems) {
    var ret;
    ret = jQuery.merge(jQuery(), elems);
    ret.prevObject = this;
    ret.context = this.context;
    return ret;
  };

  View.prototype.end = function() {
    var _ref;
    return (_ref = this.prevObject) != null ? _ref : jQuery(null);
  };

  View.prototype.command = function(commandName, selector, options, handler) {
    return View.__super__.command.call(this, commandName, selector, options, handler);
  };

  View.prototype.preempt = function(eventName, handler) {
    return View.__super__.preempt.call(this, eventName, handler);
  };

  return View;

})(jQuery);

Builder = (function() {
  function Builder() {
    this.document = [];
    this.postProcessingSteps = [];
  }

  Builder.prototype.buildHtml = function() {
    return [this.document.join(''), this.postProcessingSteps];
  };

  Builder.prototype.tag = function() {
    var args, name, options;
    name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    options = this.extractOptions(args);
    this.openTag(name, options.attributes);
    if (SelfClosingTags.hasOwnProperty(name)) {
      if ((options.text != null) || (options.content != null)) {
        throw new Error("Self-closing tag " + name + " cannot have text or content");
      }
    } else {
      if (typeof options.content === "function") {
        options.content();
      }
      if (options.text) {
        this.text(options.text);
      }
      return this.closeTag(name);
    }
  };

  Builder.prototype.openTag = function(name, attributes) {
    var attributeName, attributePairs, attributesString, value;
    attributePairs = (function() {
      var _results;
      _results = [];
      for (attributeName in attributes) {
        value = attributes[attributeName];
        _results.push("" + attributeName + "=\"" + value + "\"");
      }
      return _results;
    })();
    attributesString = attributePairs.length ? " " + attributePairs.join(" ") : "";
    return this.document.push("<" + name + attributesString + ">");
  };

  Builder.prototype.closeTag = function(name) {
    return this.document.push("</" + name + ">");
  };

  Builder.prototype.text = function(string) {
    var escapedString;
    escapedString = string.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return this.document.push(escapedString);
  };

  Builder.prototype.raw = function(string) {
    return this.document.push(string);
  };

  Builder.prototype.subview = function(outletName, subview) {
    var subviewId;
    subviewId = "subview-" + (++idCounter);
    this.tag('div', {
      id: subviewId
    });
    return this.postProcessingSteps.push(function(view) {
      view[outletName] = subview;
      subview.parentView = view;
      return view.find("div#" + subviewId).replaceWith(subview);
    });
  };

  Builder.prototype.extractOptions = function(args) {
    var arg, options, _i, _len;
    options = {};
    for (_i = 0, _len = args.length; _i < _len; _i++) {
      arg = args[_i];
      switch (typeof arg) {
        case 'function':
          options.content = arg;
          break;
        case 'string':
        case 'number':
          options.text = arg.toString();
          break;
        default:
          options.attributes = arg;
      }
    }
    return options;
  };

  return Builder;

})();

jQuery.fn.view = function() {
  return this.data('view');
};

jQuery.fn.views = function() {
  return this.toArray().map(function(elt) {
    return $(elt).view();
  });
};

callAttachHook = function(element) {
  var child, elementsWithHooks, onDom, _i, _j, _len, _len1, _ref, _ref1, _results;
  if (!(element instanceof jQuery && element[0])) {
    return;
  }
  onDom = (typeof element.parents === "function" ? element.parents('html').length : void 0) > 0;
  elementsWithHooks = [];
  if (element[0].getAttribute('callAttachHooks')) {
    elementsWithHooks.push(element[0]);
  }
  if (onDom) {
    _ref = element[0].querySelectorAll('[callAttachHooks]');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      elementsWithHooks.push(child);
    }
  }
  _results = [];
  for (_j = 0, _len1 = elementsWithHooks.length; _j < _len1; _j++) {
    element = elementsWithHooks[_j];
    _results.push((_ref1 = $(element).view()) != null ? typeof _ref1.afterAttach === "function" ? _ref1.afterAttach(onDom) : void 0 : void 0);
  }
  return _results;
};

_ref = ['append', 'prepend', 'after', 'before'];
_fn = function(methodName) {
  var originalMethod;
  originalMethod = $.fn[methodName];
  return jQuery.fn[methodName] = function() {
    var arg, args, flatArgs, result, _j, _len1, _ref1;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    flatArgs = (_ref1 = []).concat.apply(_ref1, args);
    result = originalMethod.apply(this, flatArgs);
    for (_j = 0, _len1 = flatArgs.length; _j < _len1; _j++) {
      arg = flatArgs[_j];
      callAttachHook(arg);
    }
    return result;
  };
};
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  methodName = _ref[_i];
  _fn(methodName);
}

_ref1 = ['prependTo', 'appendTo', 'insertAfter', 'insertBefore'];
_fn1 = function(methodName) {
  var originalMethod;
  originalMethod = jQuery.fn[methodName];
  return jQuery.fn[methodName] = function() {
    var args, result;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    result = originalMethod.apply(this, args);
    callAttachHook(this);
    return result;
  };
};
for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
  methodName = _ref1[_j];
  _fn1(methodName);
}

originalCleanData = jQuery.cleanData;

jQuery.cleanData = function(elements) {
  var element, view, _k, _len2;
  for (_k = 0, _len2 = elements.length; _k < _len2; _k++) {
    element = elements[_k];
    view = $(element).view();
    if (view && (view != null ? view[0] : void 0) === element) {
      if (typeof view.beforeRemove === "function") {
        view.beforeRemove();
      }
    }
  }
  return originalCleanData(elements);
};

exports = exports != null ? exports : this;

exports.View = View;

exports.jQuery = jQuery;

exports.$ = $;

exports.$$ = function(fn) {
  return View.render.call(View, fn);
};

exports.$$$ = function(fn) {
  return View.buildHtml.call(View, fn)[0];
};

var __slice = [].slice;

window.Cosmo = {
  version: '0.1.0'
};

Cosmo.Router = (function() {
  function Router() {}

  Router.prototype.regions = {
    container: $('#container')
  };

  Router.prototype.initialize = function() {};

  Router.prototype.start = function() {
    this.initialize();
    this.go('home');
    return this;
  };

  Router.prototype.addRegions = function(regions) {
    var key, value;
    for (key in regions) {
      value = regions[key];
      this.regions[key] = $(value);
    }
    return this;
  };

  Router.prototype.set = function(key, val) {
    if (val != null) {
      this[key] = val;
    } else {
      this[key] = null;
    }
    return this;
  };

  Router.prototype.get = function(key) {
    return this[key];
  };

  Router.prototype.go = function() {
    var args, page;
    page = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (this[page] != null) {
      return typeof this[page] === "function" ? this[page](args[0], args[1]) : void 0;
    } else {
      return this.home();
    }
  };

  Router.prototype.render = function(view) {
    return this.regions.container.html(view);
  };

  return Router;

})();

var Store, runtime, storage;

storage = chrome.storage.local;

runtime = chrome.runtime;

window.Store = Store = (function() {
  function Store() {}

  Store.prototype.set = function(obj, func) {
    var toSave;
    (toSave = {})[obj.word] = obj;
    console.log("to save", toSave);
    return storage.set(toSave, (function(_this) {
      return function() {
        var error;
        if (func != null) {
          if (error = runtime.lastError) {
            return func.call(_this, error);
          } else {
            return func.call(_this);
          }
        }
      };
    })(this));
  };

  Store.prototype.get = function(key, func) {
    return storage.get(key, function(results) {
      return func.call(this, _.toArray(results));
    });
  };

  Store.prototype.getOne = function(key, func) {
    return this.get(key, function(results) {
      return func.call(this, results[0]);
    });
  };

  Store.prototype.all = function(func) {
    return storage.get(null, function(items) {
      return func.call(this, _.toArray(items));
    });
  };

  Store.prototype.remove = function(key, func) {
    return storage.remove(key, function() {
      var error;
      if (func != null) {
        if (error = runtime.lastError) {
          return func.call(this, error);
        } else {
          return func.call(this);
        }
      }
    });
  };

  return Store;

})();

var AddWordsForm, AddWordsMenu, AddWordsView, ChooseWordsView, EditWord, EditWords, EditWordsMenu, HomeView, StudyMenu, StudyView, TypeDropdown, WordSection, WordTitle,
  __slice = [].slice,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

View.prototype.go = function() {
  var args, page;
  page = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  switch (args.length) {
    case 1:
      return Tutor.go(page, args[0]);
    case 2:
      return Tutor.go(page, args[0], args[1]);
    default:
      return Tutor.go(page);
  }
};

View.prototype.isString = function(obj) {
  return toString.call(obj).indexOf('String') !== -1;
};

View.prototype.capitalize = function(word) {
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
};

View.prototype.menu = function(view) {
  return Tutor.menu(view);
};

window.Views = {
  home: HomeView = (function(_super) {
    __extends(HomeView, _super);

    function HomeView() {
      return HomeView.__super__.constructor.apply(this, arguments);
    }

    HomeView.content = function() {
      return this.div({
        id: 'content'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'ui huge center aligned header'
          }, 'Tutor');
          _this.div({
            "class": 'ui large center aligned header'
          }, "Let's Study!");
          return _this.div({
            "class": 'ui center aligned three column grid'
          }, function() {
            _this.div({
              "class": 'row'
            }, function() {
              return _this.div({
                id: 'study-button'
              }, {
                "class": 'ui button',
                click: 'study'
              }, 'Study');
            });
            _this.div({
              "class": 'row'
            }, function() {
              return _this.div({
                id: 'add-words-button'
              }, {
                "class": 'ui button',
                click: 'add'
              }, 'Add words');
            });
            return _this.div({
              "class": 'row'
            }, function() {
              return _this.div({
                id: 'edit-words-button'
              }, {
                "class": 'ui button',
                click: 'edit'
              }, 'Edit Words');
            });
          });
        };
      })(this));
    };

    HomeView.prototype.study = function() {
      return this.go('studyWords');
    };

    HomeView.prototype.add = function() {
      return this.go('addWords');
    };

    HomeView.prototype.edit = function() {
      return this.go('edit');
    };

    return HomeView;

  })(View),
  addWords: AddWordsView = (function(_super) {
    __extends(AddWordsView, _super);

    function AddWordsView() {
      return AddWordsView.__super__.constructor.apply(this, arguments);
    }

    AddWordsView.content = function() {
      return this.div({
        id: 'content'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'ui huge center aligned header'
          }, 'Add Words');
          return _this.div({
            "class": 'ui center aligned three column grid'
          }, function() {
            _this.div({
              "class": 'column'
            });
            _this.div({
              "class": 'column'
            }, function() {
              return _this.subview('addWordsForm', new AddWordsForm);
            });
            return _this.div({
              "class": 'column'
            });
          });
        };
      })(this));
    };

    AddWordsView.prototype.initialize = function() {
      return this.menu(new AddWordsMenu);
    };

    return AddWordsView;

  })(View),
  preStudy: ChooseWordsView = (function(_super) {
    __extends(ChooseWordsView, _super);

    function ChooseWordsView() {
      return ChooseWordsView.__super__.constructor.apply(this, arguments);
    }

    ChooseWordsView.content = function() {
      return this.div({
        id: 'content'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'ui huge center aligned header'
          }, 'Study');
          return _this.div({
            "class": 'ui center aligned three column grid'
          }, function() {
            _this.div({
              "class": 'column'
            });
            _this.div({
              "class": 'column'
            }, function() {
              _this.div({
                "class": 'ui teal medium center aligned header'
              }, 'Study by type');
              return _this.div({
                "class": 'ui form segment'
              }, function() {
                _this.subview('typeDropdown', new TypeDropdown);
                return _this.div({
                  "class": 'ui green submit button'
                }, 'Continue');
              });
            });
            return _this.div({
              "class": 'column'
            });
          });
        };
      })(this));
    };

    ChooseWordsView.prototype.initialize = function() {
      var $dropdown, $form, rules;
      this.menu(new StudyMenu);
      this.typeDropdown.find('.menu').prepend($$(function() {
        return this.div({
          "class": 'item',
          'data-value': 'all'
        }, 'All');
      }));
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
      $dropdown = this.find('.ui.selection.dropdown').dropdown();
      $form = this.find('.ui.form');
      return $form.form(rules, {
        on: 'submit'
      }).form('setting', {
        onSuccess: (function(_this) {
          return function() {
            var word_type;
            word_type = $dropdown.dropdown('get value');
            return Tutor.get('db').all(function(words) {
              var collection;
              collection = new Words(words);
              if (word_type !== 'all') {
                collection = new Words(collection.where({
                  type: word_type
                }));
              }
              if (collection.length === 0) {
                Messenger().post({
                  message: 'There are no words',
                  type: ''
                });
                return _this.go('home');
              } else {
                return _this.go('studyWords', collection.shuffle());
              }
            });
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

  })(View),
  study: StudyView = (function(_super) {
    __extends(StudyView, _super);

    function StudyView() {
      return StudyView.__super__.constructor.apply(this, arguments);
    }

    StudyView.content = function() {
      return this.div({
        id: 'content'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'ui huge center aligned header'
          }, 'Study');
          return _this.div({
            "class": 'ui center aligned three column grid'
          }, function() {
            _this.div({
              "class": 'column'
            });
            _this.div({
              "class": 'column'
            }, function() {
              _this.subview('wordTitle', new WordTitle);
              return _this.div({
                "class": 'ui form segment'
              }, function() {
                _this.div({
                  "class": 'field'
                }, function() {
                  return _this.div({
                    "class": 'ui input'
                  }, function() {
                    return _this.input({
                      id: 'definition-input'
                    }, {
                      type: 'text',
                      name: 'definition',
                      placeholder: 'Definition'
                    });
                  });
                });
                return _this.div({
                  "class": 'ui green submit button'
                }, 'Check');
              });
            });
            return _this.div({
              "class": 'column'
            });
          });
        };
      })(this));
    };

    StudyView.prototype.initialize = function(params) {
      var _ref;
      this.params = params;
      this.incorrect = 0;
      this.collection = this.params.collection;
      this.model = (_ref = this.collection.shift()) != null ? _ref.clone() : void 0;
      this.initialize_form();
      return this.wordTitle.changeTo(this.capitalize(this.model.get('word')));
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
      return $form = this.find('.ui.form').form(rules, {
        inline: true,
        on: 'submit'
      }).form('setting', {
        onSuccess: (function(_this) {
          return function() {
            return _this.showNext();
          };
        })(this),
        onFailure: (function(_this) {
          return function() {
            if (_this.incorrect === 2) {
              _this.incorrect = 0;
              Messenger().post({
                message: "The answer is " + definition,
                type: ''
              });
              return _this.showNext();
            } else {
              return _this.incorrect++;
            }
          };
        })(this)
      });
    };

    StudyView.prototype.showNext = function() {
      var next_word;
      this.incorrect = 0;
      if (next_word = this.collection.shift()) {
        this.model.set(next_word.attributes);
        return this.find('input').val('');
      } else {
        Messenger().post({
          message: 'There are no more words',
          type: ''
        });
        return this.go('home');
      }
    };

    return StudyView;

  })(View),
  editWords: EditWords = (function(_super) {
    __extends(EditWords, _super);

    function EditWords() {
      return EditWords.__super__.constructor.apply(this, arguments);
    }

    EditWords.content = function(params) {
      return this.div({
        id: 'content'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'ui huge center aligned header'
          }, 'Edit');
          return _this.div({
            "class": 'ui center aligned three column grid'
          }, function() {
            _this.div({
              "class": 'column'
            });
            _this.div({
              "class": 'column'
            }, function() {
              return _this.subview('wordSection', new WordSection(params));
            });
            return _this.div({
              "class": 'column'
            });
          });
        };
      })(this));
    };

    EditWords.prototype.initialize = function() {
      return this.menu(new EditWordsMenu(this.wordSection));
    };

    return EditWords;

  })(View)
};

WordSection = (function(_super) {
  __extends(WordSection, _super);

  function WordSection() {
    return WordSection.__super__.constructor.apply(this, arguments);
  }

  WordSection.content = function(_arg) {
    var collection;
    collection = _arg.collection;
    this.subViews = [];
    return this.div({
      id: 'content'
    }, (function(_this) {
      return function() {
        return collection.each(function(word) {
          var view;
          view = new EditWord(word);
          _this.subViews.push(view);
          return _this.subview('word', view);
        });
      };
    })(this));
  };

  WordSection.prototype.initialize = function() {
    return this.on('filterChange', (function(_this) {
      return function(e, query) {
        var view, _i, _len, _ref, _results;
        _ref = _this.constructor.subViews;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          if (~view.word.get('word').indexOf(query)) {
            _results.push(view.show());
          } else {
            _results.push(view.hide());
          }
        }
        return _results;
      };
    })(this));
  };

  return WordSection;

})(View);

EditWord = (function(_super) {
  __extends(EditWord, _super);

  function EditWord() {
    return EditWord.__super__.constructor.apply(this, arguments);
  }

  EditWord.content = function(word) {
    this.word = word;
    return this.div({
      "class": 'ui form segment'
    }, (function(_this) {
      return function() {
        _this.div({
          "class": 'ui huge center header'
        }, _this.word.get('word'));
        _this.div({
          "class": 'field'
        }, function() {
          return _this.div({
            "class": 'ui input'
          }, function() {
            return _this.input({
              id: 'definition-input'
            }, {
              type: 'text',
              name: 'definition',
              value: _this.word.get('definition'),
              placeholder: 'Definition'
            });
          });
        });
        _this.div({
          "class": 'ui green submit mini button'
        }, 'Update');
        return _this.div({
          "class": 'ui red mini button',
          click: 'delete'
        }, 'Delete');
      };
    })(this));
  };

  EditWord.prototype.initialize = function(word) {
    var rules;
    this.word = word;
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
    return this.form(rules, {
      inline: true,
      on: 'submit'
    }).form('setting', {
      onSuccess: (function(_this) {
        return function() {
          var new_def;
          new_def = _this.form('get field', 'definition').val();
          return _this.word.save({
            definition: new_def
          });
        };
      })(this)
    });
  };

  EditWord.prototype["delete"] = function() {
    this.word.destroy();
    return this.hide();
  };

  return EditWord;

})(View);

EditWordsMenu = (function(_super) {
  __extends(EditWordsMenu, _super);

  function EditWordsMenu() {
    return EditWordsMenu.__super__.constructor.apply(this, arguments);
  }

  EditWordsMenu.content = function() {
    return this.div({
      id: 'content'
    }, (function(_this) {
      return function() {
        _this.div({
          "class": 'item'
        }, function() {
          return _this.div({
            "class": 'ui form'
          }, function() {
            return _this.div({
              "class": 'field'
            }, function() {
              return _this.div({
                "class": 'ui small icon input'
              }, function() {
                _this.input({
                  id: 'search-input'
                }, {
                  type: 'text',
                  name: 'search',
                  placeholder: 'Search'
                });
                return _this.i({
                  "class": 'search icon'
                });
              });
            });
          });
        });
        _this.a({
          "class": 'item',
          click: 'goHome'
        }, function() {
          return _this.raw("<i class='home icon'></i>Home");
        });
        _this.a({
          "class": 'item',
          click: 'goAdd'
        }, function() {
          return _this.raw("<i class='add icon'></i>Add Words");
        });
        return _this.a({
          "class": 'item',
          click: 'goStudy'
        }, function() {
          return _this.raw("<i class='pencil icon'></i>Study");
        });
      };
    })(this));
  };

  EditWordsMenu.prototype.initialize = function(wordSection) {
    var searchInput;
    return searchInput = this.find('input').on('input', (function(_this) {
      return function() {
        return wordSection.trigger('filterChange', searchInput.val());
      };
    })(this));
  };

  EditWordsMenu.prototype.goHome = function() {
    this.menu();
    return this.go('home');
  };

  EditWordsMenu.prototype.goAdd = function() {
    this.menu();
    return this.go('addWords');
  };

  EditWordsMenu.prototype.goStudy = function() {
    this.menu();
    return this.go('studyWords');
  };

  return EditWordsMenu;

})(View);

StudyMenu = (function(_super) {
  __extends(StudyMenu, _super);

  function StudyMenu() {
    return StudyMenu.__super__.constructor.apply(this, arguments);
  }

  StudyMenu.content = function() {
    return this.div({
      id: 'content'
    }, (function(_this) {
      return function() {
        _this.a({
          "class": 'item',
          click: 'goHome'
        }, function() {
          return _this.raw("<i class='home icon'></i>Home");
        });
        return _this.a({
          "class": 'item',
          click: 'goAdd'
        }, function() {
          return _this.raw("<i class='add icon'></i>Add Words");
        });
      };
    })(this));
  };

  StudyMenu.prototype.goHome = function() {
    this.menu();
    return this.go('home');
  };

  StudyMenu.prototype.goAdd = function() {
    this.menu();
    return this.go('addWords');
  };

  return StudyMenu;

})(View);

AddWordsMenu = (function(_super) {
  __extends(AddWordsMenu, _super);

  function AddWordsMenu() {
    return AddWordsMenu.__super__.constructor.apply(this, arguments);
  }

  AddWordsMenu.content = function() {
    return this.div({
      id: 'content'
    }, (function(_this) {
      return function() {
        _this.a({
          "class": 'item',
          click: 'goHome'
        }, function() {
          return _this.raw("<i class='home icon'></i>Home");
        });
        return _this.a({
          "class": 'item',
          click: 'goStudy'
        }, function() {
          return _this.raw("<i class='pencil icon'></i>Study");
        });
      };
    })(this));
  };

  AddWordsMenu.prototype.goHome = function() {
    this.menu();
    return this.go('home');
  };

  AddWordsMenu.prototype.goStudy = function() {
    this.menu();
    return this.go('studyWords');
  };

  return AddWordsMenu;

})(View);

AddWordsForm = (function(_super) {
  __extends(AddWordsForm, _super);

  function AddWordsForm() {
    return AddWordsForm.__super__.constructor.apply(this, arguments);
  }

  AddWordsForm.content = function() {
    return this.div({
      "class": 'ui form segment'
    }, (function(_this) {
      return function() {
        _this.subview('typeDropdown', new TypeDropdown);
        _this.div({
          "class": 'field'
        }, function() {
          return _this.div({
            "class": 'ui input'
          }, function() {
            return _this.input({
              id: 'word-input',
              type: 'text',
              name: 'word',
              placeholder: 'Word'
            });
          });
        });
        _this.div({
          "class": 'field'
        }, function() {
          return _this.div({
            "class": 'ui input'
          }, function() {
            return _this.input({
              id: 'word-definition',
              type: 'text',
              name: 'definition',
              placeholder: 'Definition'
            });
          });
        });
        return _this.div({
          "class": 'ui green submit button'
        }, 'Save');
      };
    })(this));
  };

  AddWordsForm.prototype.initialize = function() {
    var $dropdown, rules;
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
      return !(value.length === 0);
    };
    $.fn.form.settings.rules.exists = function(value) {
      return !Tutor.get('words').findWhere({
        word: value
      });
    };
    $dropdown = this.find('.ui.selection.dropdown').dropdown();
    return this.form(rules, {
      inline: true,
      on: 'submit'
    }).form('setting', {
      onSuccess: (function(_this) {
        return function() {
          var attr, word;
          attr = {};
          attr.type = $dropdown.dropdown('get value');
          if (_this.isString(attr.type)) {
            attr.word = _this.form('get field', 'word').val();
            attr.definition = _this.form('get field', 'definition').val();
            return word = new Word(attr).save({}, {
              success: function(model) {
                _this.form('get field', 'word').val('');
                _this.form('get field', 'definition').val('');
                return _this.find('#word-input').focus();
              }
            });
          } else {
            return Messenger().post({
              message: 'Please choose a type',
              type: ''
            });
          }
        };
      })(this)
    });
  };

  return AddWordsForm;

})(View);

TypeDropdown = (function(_super) {
  __extends(TypeDropdown, _super);

  function TypeDropdown() {
    return TypeDropdown.__super__.constructor.apply(this, arguments);
  }

  TypeDropdown.content = function() {
    return this.div({
      "class": 'field'
    }, (function(_this) {
      return function() {
        return _this.div({
          "class": 'ui selection dropdown'
        }, function() {
          _this.input({
            type: 'hidden',
            name: 'type'
          });
          _this.div({
            "class": 'default text'
          }, 'Type');
          _this.i({
            "class": 'dropdown icon'
          });
          return _this.div({
            "class": 'menu ui transition hidden'
          }, function() {
            var type, _i, _len, _ref, _results;
            _ref = ['Verb', 'Noun', 'Adjective', 'Stuff'];
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              type = _ref[_i];
              _results.push(_this.div({
                "class": 'item',
                'data-value': type.toLowerCase()
              }, type));
            }
            return _results;
          });
        });
      };
    })(this));
  };

  return TypeDropdown;

})(View);

WordTitle = (function(_super) {
  __extends(WordTitle, _super);

  function WordTitle() {
    return WordTitle.__super__.constructor.apply(this, arguments);
  }

  WordTitle.content = function(word) {
    if (word == null) {
      word = '';
    }
    return this.div({
      "class": 'ui teal medium center aligned header'
    }, word);
  };

  WordTitle.prototype.changeTo = function(word) {
    return this.html(word);
  };

  return WordTitle;

})(View);

var Word, Words, clone, isArray, random, shuffle;

clone = function(obj) {
  var key, twin, value;
  twin = null;
  if (isArray(obj)) {
    twin = obj.slice();
  } else {
    twin = {};
    for (key in obj) {
      value = obj[key];
      twin[key] = value;
    }
  }
  return twin;
};

isArray = function(obj) {
  return toString.call(obj).indexOf('Array') !== -1;
};

random = function(min, max) {
  if (max == null) {
    max = min;
    min = 0;
  }
  return min + Math.floor(Math.random() * (max - min + 1));
};

shuffle = function(array) {
  var index, obj, rand, shuffled, _i, _len;
  shuffled = [];
  for (index = _i = 0, _len = array.length; _i < _len; index = ++_i) {
    obj = array[index];
    rand = random(index++);
    shuffled[index - 1] = shuffled[rand];
    shuffled[rand] = obj;
  }
  return shuffled;
};

window.Word = Word = (function() {
  Word.prototype.toAttributes = {
    id: function() {
      return this.get('word');
    }
  };

  function Word(attributes) {
    this.attributes = attributes != null ? attributes : {};
  }

  Word.prototype.set = function(attr, val) {
    var key;
    if (typeof attr === 'object') {
      for (key in attr) {
        val = attr[key];
        this.attributes[key] = val;
      }
    } else {
      this.attributes[attr] = val;
    }
    return void 0;
  };

  Word.prototype.get = function(attr) {
    return this.attributes[attr] || this.toAttributes[attr].call(this);
  };

  Word.prototype.clone = function() {
    return new this.constructor(clone(this.attributes));
  };

  Word.prototype.toJSON = function() {
    return clone(this.attributes);
  };

  Word.prototype.save = function(attr, val, options) {
    this.set(attr, val);
    return Tutor.get('db').set(this.toJSON(), function(err) {
      if (err != null) {
        return typeof options.error === "function" ? options.error(model) : void 0;
      } else {
        return typeof options.success === "function" ? options.success(model) : void 0;
      }
    });
  };

  Word.prototype.destroy = function() {
    return Tutor.get('db').remove(this.get('id'));
  };

  return Word;

})();

window.Words = Words = (function() {
  Words.prototype.length = 0;

  function Words(collection) {
    var word, _i, _len;
    if (collection == null) {
      collection = [];
    }
    this.collection = [];
    for (_i = 0, _len = collection.length; _i < _len; _i++) {
      word = collection[_i];
      this.collection.push(new Word(word));
    }
    this.length = this.collection.length;
  }

  Words.prototype.each = function(callback) {
    var word, _i, _len, _ref, _results;
    console.log("this is", this);
    console.log("callback is", callback);
    _ref = this.collection;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      word = _ref[_i];
      _results.push(callback.call(this, word));
    }
    return _results;
  };

  Words.prototype.first = function() {
    return this.collection[0];
  };

  Words.prototype.last = function() {
    return this.collection[this.collection.length - 1];
  };

  Words.prototype.where = function(query) {
    var attr, match, results, value, word, _i, _len, _ref;
    if (query == null) {
      query = {};
    }
    results = [];
    if (query === {}) {
      return results;
    } else {
      _ref = this.collection;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        word = _ref[_i];
        match = true;
        for (attr in query) {
          value = query[attr];
          if (word.get(attr) !== value) {
            match = false;
            break;
          }
        }
        if (match) {
          results.push(word);
        }
      }
      return results;
    }
  };

  Words.prototype.findWhere = function(query) {
    if (query == null) {
      query = {};
    }
    return this.where(query)[0];
  };

  Words.prototype.shift = function() {
    var length;
    length = this.collection.length - 1;
    return this.collection.shift();
  };

  Words.prototype.shuffle = function() {
    var shuffled, toShuffle, word, _i, _len, _ref;
    toShuffle = [];
    _ref = this.collection;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      word = _ref[_i];
      toShuffle.push(word.toJSON());
    }
    shuffled = shuffle(toShuffle);
    return new this.constructor(shuffled);
  };

  Words.prototype._isEmpty = function(obj) {
    var empty, key, value;
    empty = true;
    for (key in obj) {
      value = obj[key];
      empty = false;
      break;
    }
    return empty;
  };

  return Words;

})();