storage = chrome.storage.local
runtime = chrome.runtime

toArray = (obj) ->
  array = []
  for key, value of obj
    array.push value
  array

# simple wrapper class for chrome.storage.local
window.Store = class Store
  # given a pure json object, it will be saved with it's 'id' as the key
  # callback is given error if it exists
  set: (obj, func) ->
    (toSave = {})[obj.word] = obj
    console.log "to save", toSave
    storage.set toSave, =>
      if func?
        if error = runtime.lastError
          func.call this, error
        else
          func.call(this)

  # follows chrome api but results given to callback will be an array
  get: (key, func) ->
    storage.get key, (results) ->
      func.call this, toArray(results)

  # like ::get but returns only the first result
  getOne: (key, func) ->
    @get key, (results) ->
      func.call this, results[0]

  # chrome api will return an object so convert it to array
  all: (func) ->
    storage.get null, (items) ->
      func.call this, toArray(items)

  # follows chrome api but callback is given error and 'this' store object
  remove: (key, func) ->
    storage.remove key, ->
      if func?
        if error = runtime.lastError
          func.call this, error
        else
          func.call this
