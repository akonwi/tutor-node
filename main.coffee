Messenger.options =
  extraClasses: 'messenger-fixed messenger-on-top'
  theme: 'ice'

class Tutor extends Cosmo.Router
  initialize: ->
    @addRegions
      sidebar: '#side-menu'
    @set 'lawnchair', new Lawnchair(name: 'words', record: 'word')
    @get 'lawnchair'
    .all (words) =>
      @set 'words', new Words(words)

    # setup semantic sidebar
    @regions.sidebar.sidebar().toggle()

  home: -> @render new Views.home

  addWords: -> @render new Views.addWords

  studyWords: (words) ->
    if words?
      @render new Views.study(collection: words)
    else
      @render new Views.preStudy

  edit: ->
    @get('lawnchair').all (words) =>
      if words.length
        words = new Words(words)
        @render new Views.editWords(collection: words)
      else
        Messenger().post
          message: "There are no words to edit"
          type: ''

  # if no view, hide the sidebar
  menu: (view=null) ->
    if view is null
      @regions.sidebar.hide()
    else
      @regions.sidebar.html view
      @regions.sidebar.show()

window.Tutor = new Tutor().start()
