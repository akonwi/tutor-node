window.Word = class Word extends Backbone.Model
  idAttribute: 'key'

  db_options:
    name: 'words'
    record: 'word'

  sync: (method, model, options) ->
    if method is 'create'
      console.log 'creating word', model
      new Lawnchair @db_options, ->
        @save model.toJSON(), (word) ->
          console.log 'created word', word
          if word?
            options.success?(word)
          else
            options.error?(model)
    if method is 'update'
      console.log 'updating word', model
      new Lawnchair @db_options, ->
        @where "word.word === '#{model.get('word')}'", (words) ->
          words[0].definition = model.get('definition')
          @save words[0], (word) ->
            console.log 'updated word', word
    if method is 'delete'
      new Lawnchair @db_options, ->
        @remove model.toJSON()

window.Words = class Words extends Backbone.Collection
  model: Word
