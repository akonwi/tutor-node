View::go = (page, args...) ->
  switch args.length
    when 1 then Tutor.go page, args[0]
    when 2 then Tutor.go page, args[0], args[1]
    else Tutor.go page

View::isString = (obj) ->
  toString.call(obj).indexOf('String') isnt -1

View::capitalize = (word) ->
  word[0].toUpperCase() + word[1..-1].toLowerCase()

View::menu = (view) -> Tutor.menu(view)

window.Views = {}

## Btn component
# @props url
# @props text to display
UrlBtn = React.createClass
  onClick: (e) -> Tutor.go @props.url
  render: ->
    {button} = _
    button onClick: @onClick, @props.text

Views.Home = React.createClass
  render: ->
    {div, h1, h2, li, ul} = _
    div {},
      div className: 'text-center',
        h1 'Tutor'
        h2 "Let's Study!"
      div {},
        ul className: 'unstyled',
          li(UrlBtn url: 'preStudy', text: 'Study')
          li(UrlBtn url: 'addWords', text: 'Add words')
          li(UrlBtn url: 'editWords', text: 'Edit words')

Views.PreStudy = React.createClass
  render: ->
    {div, h2, h3, ul, li} = _
    div className: 'text-center',
      h2 'Study'
      h3 'Study by type'
      ul className: 'unstyled',
        li(UrlBtn url: 'study/all', text: 'All')
        li(UrlBtn url: 'study/verb', text: 'Verbs')
        li(UrlBtn url: 'study/noun', text: 'Nouns')
        li(UrlBtn url: 'study/adjective', text: 'Adjectives')
        li(UrlBtn url: 'study/stuff', text: 'Stuff')

Views.AddWords = React.createClass
  componentDidMount: -> @refs.word.getDOMNode().focus()
  validate: (e) ->
    e.preventDefault()
    valid = true

    wordInput = @refs.word.getDOMNode()
    if wordInput.value.trim() is ''
      wordInput.classList.add('error')
      valid = false
    else
      wordInput.classList.remove('error')

    definitionInput = @refs.definition.getDOMNode()
    if definitionInput.value.trim() is ''
      definitionInput.classList.add('error')
      valid = false
    else
      definitionInput.classList.remove('error')

    if valid
      attrs =
        id: wordInput.value
        definition: definitionInput.value
        type: @refs.types.getDOMNode().value
      word = new Word(attrs)
      word.save {}, success: (saved) ->
        wordInput.value = ''
        wordInput.focus()
        definitionInput.value = ''

  render: ->
    {div, h2, select, option, form, input, button} = _
    div className: 'text-center',
      h2 'Add Words'
      form id: 'stacked',
        select ref: 'types',
          option value: 'verb', 'Verb'
          option value: 'adjective', 'Adjective'
          option value: 'noun', 'Noun'
          option value: 'stuff', 'Stuf'
        input id: 'word', ref: 'word', type: 'text', placeholder: 'Word'
        input id: 'definition', ref: 'definition', type: 'text', placeholder: 'Definition'
        button id: 'save', onClick: @validate, 'Save'

foobar =
  addWords: class AddWordsView extends View
    @content: ->
      @div id: 'content', =>
        @div class: 'ui huge center aligned header', 'Add Words'
        @div class: 'ui center aligned three column grid', =>
          @div class: 'column'
          @div class: 'column', =>
            @subview 'addWordsForm', new AddWordsForm
          @div class: 'column'

    initialize: -> @menu new AddWordsMenu

  preStudy: class ChooseWordsView extends View
    @content: ->
      @div id: 'content', =>
        @div class: 'ui huge center aligned header', 'Study'
        @div class: 'ui center aligned three column grid', =>
          @div class: 'column'
          @div class: 'column', =>
            @div class: 'ui teal medium center aligned header', 'Study by type'
            @div class: 'ui form segment', =>
              @subview 'typeDropdown', new TypeDropdown
              @div class: 'ui green submit button', 'Continue'
          @div class: 'column'

    initialize: ->
      @menu new StudyMenu
      # first add 'All' option to dropdown
      @typeDropdown.find('.menu').prepend $$ ->
        @div class: 'item', 'data-value': 'all', 'All'

      rules =
        type:
          identifier: 'type'
          rules: [
            type: 'empty'
            prompt: 'Need a type'
          ]

      $dropdown = @find('.ui.selection.dropdown').dropdown()
      $form = @find('.ui.form')
      $form.form rules, on: 'submit'
      .form 'setting',
        onSuccess: =>
          word_type = $dropdown.dropdown('get value')
          Tutor.get('db').all (words) =>
            collection = new Words(words)
            unless word_type is 'all'
              collection = new Words(collection.where(type: word_type))
            if collection.length is 0
              Messenger().post
                message: 'There are no words'
                type: ''
              @go 'home'
            else
              console.log collection
              @go 'studyWords', collection.shuffle()
        onFailure: ->
          Messenger().post
            message: 'Please choose which type of words to study'
            type: ''

  study: class StudyView extends View
    @content: ->
      @div id: 'content', =>
        @div class: 'ui huge center aligned header', 'Study'
        @div class: 'ui center aligned three column grid', =>
          @div class: 'column'
          @div class: 'column', =>
            @subview 'wordTitle', new WordTitle
            @div class: 'ui form segment', =>
              @div class: 'field', =>
                @div class: 'ui input', =>
                  @input id: 'definition-input',
                    type: 'text',
                    name: 'definition',
                    placeholder: 'Definition'
              @div class: 'ui green submit button', 'Check'
          @div class: 'column'

    initialize: ({@collection}) ->
      @model = @collection.shift().clone()
      @initialize_form()
      @wordTitle.changeTo @capitalize(@model.get('id'))
      @model.on 'change', (model) =>
        @wordTitle.changeTo @capitalize(model.get('id'))
        @initialize_form()

    initialize_form: ->
      definition = @model.get('definition')
      rules =
        definition:
          identifier: 'definition'
          rules: [
            {
              type: 'empty'
              prompt: 'Give it a try'
            }, {
              type: "is[" + definition + "]"
              prompt: "Sorry that's incorrect"
            }
          ]

      $form = @find('.ui.form').form(rules, inline: true, on: 'submit')
      .form 'setting',
        onSuccess: =>
          @showNext()
        onFailure: =>
          console.log "The answer is #{definition}"

    showNext: ->
      if next_word = @collection.shift()
        @model.flush(next_word.attributes)
        @find('input').val ''
      else
        Messenger().post
          message: 'There are no more words'
          type: ''
        @go 'home'

  editWords: class EditWords extends View
    @content: (collection) ->
      @div id: 'content', =>
        @div class: 'ui huge center aligned header', 'Edit'
        @div class: 'ui center aligned three column grid', =>
          @div class: 'column'
          @div class: 'column', =>
            @subview 'wordSection', new WordSection(collection)
          @div class: 'column'

    initialize: -> @menu new EditWordsMenu(@wordSection)

class WordSection extends View
  @content: (collection) ->
    # collection of subviews for each word to edit
    @subViews = []
    @div id: 'content', =>
      collection.each (word) =>
        view = new EditWord(word)
        @subViews.push view
        @subview 'word', view

  initialize: ->
    # filter which words are shown based on user input
    @on 'filterChange', (e, query) =>
      for view in @constructor.subViews
        if ~view.word.get('id').indexOf query
          view.show()
        else
          view.hide()

class EditWord extends View
  @content: (@word) ->
    @div class: 'ui form segment', =>
      @div class: 'ui huge center header', @word.get('id')
      @div class: 'field', =>
        @div class: 'ui input', =>
          @input id: 'definition-input',
            type: 'text',
            name: 'definition',
            value: @word.get('definition'),
            placeholder: 'Definition'
      @div class: 'ui green submit mini button', 'Update'
      @div class: 'ui red mini button', click: 'delete', 'Delete'

  initialize: (@word) ->
    rules =
      definition:
        identifier: 'definition'
        rules: [
          {
            type: 'empty'
            prompt: "Can't be empty"
          }
        ]

    @form rules, inline: true, on: 'submit'
    .form 'setting',
      onSuccess: =>
        @word.save definition: new_def

  delete: ->
    @word.destroy()
    @hide()

class EditWordsMenu extends View
  @content: ->
    @div id: 'content', =>
      @div class: 'item', =>
        @div class: 'ui form', =>
          @div class: 'field', =>
            @div class: 'ui small icon input', =>
              @input id: 'search-input',
                type: 'text',
                name: 'search',
                placeholder: 'Search'
              @i class: 'search icon'
      @a class: 'item', click: 'goHome', =>
        @raw "<i class='home icon'></i>Home"
      @a class: 'item', click: 'goAdd', =>
        @raw "<i class='add icon'></i>Add Words"
      @a class: 'item', click: 'goStudy', =>
        @raw "<i class='pencil icon'></i>Study"

  # given the view that is displaying words,
  # trigger updating filter as user types query
  initialize: (wordSection) ->
    searchInput = @find('input')
    .on 'input', =>
      wordSection.trigger 'filterChange', searchInput.val()

  goHome: ->
    @menu()
    @go 'home'

  goAdd: ->
    @menu()
    @go 'addWords'

  goStudy: ->
    @menu()
    @go 'studyWords'

class StudyMenu extends View
  @content: ->
    @div id: 'content', =>
      @a class: 'item', click: 'goHome', =>
        @raw "<i class='home icon'></i>Home"
      @a class: 'item', click: 'goAdd', =>
        @raw "<i class='add icon'></i>Add Words"

  goHome: ->
    @menu()
    @go 'home'

  goAdd: ->
    @menu()
    @go 'addWords'

class AddWordsMenu extends View
  @content: ->
    @div id: 'content', =>
      @a class: 'item', click: 'goHome', =>
        @raw "<i class='home icon'></i>Home"
      @a class: 'item', click: 'goStudy', =>
        @raw "<i class='pencil icon'></i>Study"

  goHome: ->
    @menu()
    @go 'home'

  goStudy: ->
    @menu()
    @go 'studyWords'

class AddWordsForm extends View
  @content: ->
    @div class: 'ui form segment', =>
      @subview 'typeDropdown', new TypeDropdown
      @div class: 'field', =>
        @div class: 'ui input', =>
          @input id: 'word-input', type: 'text', name: 'word', placeholder: 'Word'
      @div class: 'field', =>
        @div class: 'ui input', =>
          @input id: 'word-definition', type: 'text', name: 'definition', placeholder: 'Definition'
      @div class: 'ui green submit button', 'Save'

  initialize: ->
    rules =
      word:
        identifier: 'word'
        rules: [
          {
            type: 'empty',
            prompt: "Can't have a blank entry"
          }, {
            type: 'exists'
            prompt: 'That word already exists'
          }
        ]
      definition:
        identifier: 'definition'
        rules: [
          type: 'empty'
          prompt: 'Need a definition'
        ]

    $.fn.form.settings.rules.empty = (value) ->
      not (value.length is 0)

    $.fn.form.settings.rules.exists = (value) ->
      not Tutor.get('words').findWhere(id: value)

    $dropdown = @find('.ui.selection.dropdown').dropdown()
    # this is the form so call `this.form`
    @form rules,
      inline: true
      on: 'submit'
    .form 'setting',
      onSuccess: =>
        attr = {}
        attr.type = $dropdown.dropdown('get value')
        if @isString attr.type
          attr.id = @form('get field', 'word').val()
          attr.definition = @form('get field', 'definition').val()
          word = new Word(attr)
          word.save {}, success: (model) =>
            console.log 'do it'
            @form('get field', 'word').val ''
            @form('get field', 'definition').val ''
            @find('#word-input').focus()
        else
          Messenger().post
            message: 'Please choose a type'
            type: ''

class TypeDropdown extends View
  @content: ->
    @div class: 'field', =>
      @div class: 'ui selection dropdown', =>
        @input type: 'hidden', name: 'type'
        @div class: 'default text', 'Type'
        @i class: 'dropdown icon'
        @div class: 'menu ui transition hidden', =>
          for type in ['Verb', 'Noun', 'Adjective', 'Stuff']
            @div class: 'item', 'data-value': type.toLowerCase(), type

class WordTitle extends View
  @content: (word='') ->
    @div class: 'ui teal medium center aligned header', word

  changeTo: (word) ->
    @html word
