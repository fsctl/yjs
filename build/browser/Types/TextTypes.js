(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var __slice = [].slice,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = function(HB) {
  var Delete, Delimiter, ImmutableObject, Insert, Operation, execution_listener, parser;
  parser = {};
  execution_listener = [];
  Operation = (function() {
    function Operation(uid) {
      if (uid == null) {
        uid = HB.getNextOperationIdentifier();
      }
      this.creator = uid['creator'], this.op_number = uid['op_number'];
    }

    Operation.prototype.on = function(events, f) {
      var e, _base, _i, _len, _results;
      if (this.event_listeners == null) {
        this.event_listeners = {};
      }
      if (events.constructor !== [].constructor) {
        events = [events];
      }
      _results = [];
      for (_i = 0, _len = events.length; _i < _len; _i++) {
        e = events[_i];
        if ((_base = this.event_listeners)[e] == null) {
          _base[e] = [];
        }
        _results.push(this.event_listeners[e].push(f));
      }
      return _results;
    };

    Operation.prototype.deleteListener = function(events, f) {
      var e, _i, _len, _ref, _results;
      if (events.constructor !== [].constructor) {
        events = [events];
      }
      _results = [];
      for (_i = 0, _len = events.length; _i < _len; _i++) {
        e = events[_i];
        if (((_ref = this.event_listeners) != null ? _ref[e] : void 0) != null) {
          _results.push(this.event_listeners[e] = this.event_listeners[e].filter(function(g) {
            return f !== g;
          }));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Operation.prototype.callEvent = function() {
      return this.forwardEvent.apply(this, [this].concat(__slice.call(arguments)));
    };

    Operation.prototype.forwardEvent = function() {
      var args, event, f, op, _i, _len, _ref, _ref1, _results;
      op = arguments[0], event = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (((_ref = this.event_listeners) != null ? _ref[event] : void 0) != null) {
        _ref1 = this.event_listeners[event];
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          f = _ref1[_i];
          _results.push(f.call.apply(f, [op, event].concat(__slice.call(args))));
        }
        return _results;
      }
    };

    Operation.prototype.setParent = function(parent) {
      this.parent = parent;
    };

    Operation.prototype.getParent = function() {
      return this.parent;
    };

    Operation.prototype.getUid = function() {
      return {
        'creator': this.creator,
        'op_number': this.op_number
      };
    };

    Operation.prototype.execute = function() {
      var l, _i, _len;
      this.is_executed = true;
      for (_i = 0, _len = execution_listener.length; _i < _len; _i++) {
        l = execution_listener[_i];
        l(this._encode());
      }
      return this;
    };

    Operation.prototype.saveOperation = function(name, op) {
      if ((op != null ? op.execute : void 0) != null) {
        return this[name] = op;
      } else if (op != null) {
        if (this.unchecked == null) {
          this.unchecked = {};
        }
        return this.unchecked[name] = op;
      }
    };

    Operation.prototype.validateSavedOperations = function() {
      var name, op, op_uid, success, uninstantiated, _ref;
      uninstantiated = {};
      success = this;
      _ref = this.unchecked;
      for (name in _ref) {
        op_uid = _ref[name];
        op = HB.getOperation(op_uid);
        if (op) {
          this[name] = op;
        } else {
          uninstantiated[name] = op_uid;
          success = false;
        }
      }
      delete this.unchecked;
      if (!success) {
        this.unchecked = uninstantiated;
      }
      return success;
    };

    return Operation;

  })();
  Delete = (function(_super) {
    __extends(Delete, _super);

    function Delete(uid, deletes) {
      this.saveOperation('deletes', deletes);
      Delete.__super__.constructor.call(this, uid);
    }

    Delete.prototype._encode = function() {
      return {
        'type': "Delete",
        'uid': this.getUid(),
        'deletes': this.deletes.getUid()
      };
    };

    Delete.prototype.execute = function() {
      if (this.validateSavedOperations()) {
        this.deletes.applyDelete(this);
        return Delete.__super__.execute.apply(this, arguments);
      } else {
        return false;
      }
    };

    return Delete;

  })(Operation);
  parser['Delete'] = function(o) {
    var deletes_uid, uid;
    uid = o['uid'], deletes_uid = o['deletes'];
    return new Delete(uid, deletes_uid);
  };
  Insert = (function(_super) {
    __extends(Insert, _super);

    function Insert(uid, prev_cl, next_cl, origin) {
      this.saveOperation('prev_cl', prev_cl);
      this.saveOperation('next_cl', next_cl);
      if (origin != null) {
        this.saveOperation('origin', origin);
      } else {
        this.saveOperation('origin', prev_cl);
      }
      Insert.__super__.constructor.call(this, uid);
    }

    Insert.prototype.applyDelete = function(o) {
      if (this.deleted_by == null) {
        this.deleted_by = [];
      }
      this.deleted_by.push(o);
      if ((this.parent != null) && this.deleted_by.length === 1) {
        return this.parent.callEvent("delete", this);
      }
    };

    Insert.prototype.isDeleted = function() {
      var _ref;
      return ((_ref = this.deleted_by) != null ? _ref.length : void 0) > 0;
    };

    Insert.prototype.getDistanceToOrigin = function() {
      var d, o;
      d = 0;
      o = this.prev_cl;
      while (true) {
        if (this.origin === o) {
          break;
        }
        d++;
        if (this === this.prev_cl) {
          throw new Error("this should not happen ;) ");
        }
        o = o.prev_cl;
      }
      return d;
    };

    Insert.prototype.update_sl = function() {
      var o;
      o = this.prev_cl;
      ({
        update: function(dest_cl, dest_sl) {
          var _results;
          _results = [];
          while (true) {
            if (o.isDeleted()) {
              _results.push(o = o[dest_cl]);
            } else {
              this[dest_sl] = o;
              break;
            }
          }
          return _results;
        }
      });
      update("prev_cl", "prev_sl");
      return update("next_cl", "prev_sl");
    };

    Insert.prototype.execute = function() {
      var distance_to_origin, i, o, parent, _ref, _ref1, _ref2;
      if (this.is_executed != null) {
        return this;
      }
      if (!this.validateSavedOperations()) {
        return false;
      } else {
        if (((_ref = this.prev_cl) != null ? _ref.validateSavedOperations() : void 0) && ((_ref1 = this.next_cl) != null ? _ref1.validateSavedOperations() : void 0) && this.prev_cl.next_cl !== this) {
          distance_to_origin = 0;
          o = this.prev_cl.next_cl;
          i = 0;
          while (true) {
            if (o == null) {
              console.log(JSON.stringify(this.prev_cl.getUid()));
              console.log(JSON.stringify(this.next_cl.getUid()));
            }
            if (o !== this.next_cl) {
              if (o.getDistanceToOrigin() === i) {
                if (o.creator < this.creator) {
                  this.prev_cl = o;
                  distance_to_origin = i + 1;
                } else {

                }
              } else if (o.getDistanceToOrigin() < i) {
                if (i - distance_to_origin <= o.getDistanceToOrigin()) {
                  this.prev_cl = o;
                  distance_to_origin = i + 1;
                } else {

                }
              } else {
                break;
              }
              i++;
              o = o.next_cl;
            } else {
              break;
            }
          }
          this.next_cl = this.prev_cl.next_cl;
          this.prev_cl.next_cl = this;
          this.next_cl.prev_cl = this;
        }
        parent = (_ref2 = this.prev_cl) != null ? _ref2.getParent() : void 0;
        if (parent != null) {
          this.setParent(parent);
          this.parent.callEvent("insert", this);
        }
        return Insert.__super__.execute.apply(this, arguments);
      }
    };

    Insert.prototype.getPosition = function() {
      var position, prev;
      position = 0;
      prev = this.prev_cl;
      while (true) {
        if (prev instanceof Delimiter) {
          break;
        }
        if ((prev.isDeleted != null) && !prev.isDeleted()) {
          position++;
        }
        prev = prev.prev_cl;
      }
      return position;
    };

    return Insert;

  })(Operation);
  ImmutableObject = (function(_super) {
    __extends(ImmutableObject, _super);

    function ImmutableObject(uid, content, prev, next, origin) {
      this.content = content;
      ImmutableObject.__super__.constructor.call(this, uid, prev, next, origin);
    }

    ImmutableObject.prototype.val = function() {
      return this.content;
    };

    ImmutableObject.prototype._encode = function() {
      var json;
      json = {
        'type': "ImmutableObject",
        'uid': this.getUid(),
        'content': this.content
      };
      if (this.prev_cl != null) {
        json['prev'] = this.prev_cl.getUid();
      }
      if (this.next_cl != null) {
        json['next'] = this.next_cl.getUid();
      }
      if ((this.origin != null) && this.origin !== this.prev_cl) {
        json["origin"] = this.origin.getUid();
      }
      return json;
    };

    return ImmutableObject;

  })(Insert);
  parser['ImmutableObject'] = function(json) {
    var content, next, origin, prev, uid;
    uid = json['uid'], content = json['content'], prev = json['prev'], next = json['next'], origin = json['origin'];
    return new ImmutableObject(uid, content, prev, next, origin);
  };
  Delimiter = (function(_super) {
    __extends(Delimiter, _super);

    function Delimiter(uid, prev_cl, next_cl, origin) {
      this.saveOperation('prev_cl', prev_cl);
      this.saveOperation('next_cl', next_cl);
      this.saveOperation('origin', prev_cl);
      Delimiter.__super__.constructor.call(this, uid);
    }

    Delimiter.prototype.isDeleted = function() {
      return false;
    };

    Delimiter.prototype.execute = function() {
      var _ref, _ref1;
      if (((_ref = this.unchecked) != null ? _ref['next_cl'] : void 0) != null) {
        return Delimiter.__super__.execute.apply(this, arguments);
      } else if ((_ref1 = this.unchecked) != null ? _ref1['prev_cl'] : void 0) {
        if (this.validateSavedOperations()) {
          if (this.prev_cl.next_cl != null) {
            throw new Error("Probably duplicated operations");
          }
          this.prev_cl.next_cl = this;
          delete this.prev_cl.unchecked.next_cl;
          return Delimiter.__super__.execute.apply(this, arguments);
        } else {
          return false;
        }
      } else if ((this.prev_cl != null) && (this.prev_cl.next_cl == null)) {
        delete this.prev_cl.unchecked.next_cl;
        return this.prev_cl.next_cl = this;
      } else if ((this.prev_cl != null) || (this.next_cl != null)) {
        return Delimiter.__super__.execute.apply(this, arguments);
      } else {
        throw new Error("Delimiter is unsufficient defined!");
      }
    };

    Delimiter.prototype._encode = function() {
      var _ref, _ref1;
      return {
        'type': "Delimiter",
        'uid': this.getUid(),
        'prev': (_ref = this.prev_cl) != null ? _ref.getUid() : void 0,
        'next': (_ref1 = this.next_cl) != null ? _ref1.getUid() : void 0
      };
    };

    return Delimiter;

  })(Operation);
  parser['Delimiter'] = function(json) {
    var next, prev, uid;
    uid = json['uid'], prev = json['prev'], next = json['next'];
    return new Delimiter(uid, prev, next);
  };
  return {
    'types': {
      'Delete': Delete,
      'Insert': Insert,
      'Delimiter': Delimiter,
      'Operation': Operation,
      'ImmutableObject': ImmutableObject
    },
    'parser': parser,
    'execution_listener': execution_listener
  };
};


},{}],2:[function(require,module,exports){
var basic_types_uninitialized,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

basic_types_uninitialized = require("./BasicTypes");

module.exports = function(HB) {
  var AddName, ListManager, MapManager, ReplaceManager, Replaceable, basic_types, parser, types;
  basic_types = basic_types_uninitialized(HB);
  types = basic_types.types;
  parser = basic_types.parser;
  MapManager = (function(_super) {
    __extends(MapManager, _super);

    function MapManager(uid) {
      this.map = {};
      MapManager.__super__.constructor.call(this, uid);
    }

    MapManager.prototype.val = function(name, content) {
      var o, obj, result, _ref, _ref1;
      if (content != null) {
        if (this.map[name] == null) {
          HB.addOperation(new AddName(void 0, this, name)).execute();
        }
        this.map[name].replace(content);
        return this;
      } else if (name != null) {
        obj = (_ref = this.map[name]) != null ? _ref.val() : void 0;
        if (obj instanceof types.ImmutableObject) {
          return obj.val();
        } else {
          return obj;
        }
      } else {
        result = {};
        _ref1 = this.map;
        for (name in _ref1) {
          o = _ref1[name];
          obj = o.val();
          if (obj instanceof types.ImmutableObject || obj instanceof MapManager) {
            obj = obj.val();
          }
          result[name] = obj;
        }
        return result;
      }
    };

    return MapManager;

  })(types.Operation);
  AddName = (function(_super) {
    __extends(AddName, _super);

    function AddName(uid, map_manager, name) {
      this.name = name;
      this.saveOperation('map_manager', map_manager);
      AddName.__super__.constructor.call(this, uid);
    }

    AddName.prototype.execute = function() {
      var beg, end, uid_beg, uid_end, uid_r;
      if (!this.validateSavedOperations()) {
        return false;
      } else {
        uid_r = this.map_manager.getUid();
        uid_r.op_number = "_" + uid_r.op_number + "_RM_" + this.name;
        if (HB.getOperation(uid_r) == null) {
          uid_beg = this.map_manager.getUid();
          uid_beg.op_number = "_" + uid_beg.op_number + "_RM_" + this.name + "_beginning";
          uid_end = this.map_manager.getUid();
          uid_end.op_number = "_" + uid_end.op_number + "_RM_" + this.name + "_end";
          beg = HB.addOperation(new types.Delimiter(uid_beg, void 0, uid_end)).execute();
          end = HB.addOperation(new types.Delimiter(uid_end, beg, void 0)).execute();
          this.map_manager.map[this.name] = HB.addOperation(new ReplaceManager(void 0, uid_r, beg, end));
          this.map_manager.map[this.name].setParent(this.map_manager, this.name);
          this.map_manager.map[this.name].execute();
        }
        return AddName.__super__.execute.apply(this, arguments);
      }
    };

    AddName.prototype._encode = function() {
      return {
        'type': "AddName",
        'uid': this.getUid(),
        'map_manager': this.map_manager.getUid(),
        'name': this.name
      };
    };

    return AddName;

  })(types.Operation);
  parser['AddName'] = function(json) {
    var map_manager, name, uid;
    map_manager = json['map_manager'], uid = json['uid'], name = json['name'];
    return new AddName(uid, map_manager, name);
  };
  ListManager = (function(_super) {
    __extends(ListManager, _super);

    function ListManager(uid, beginning, end, prev, next, origin) {
      if ((beginning != null) && (end != null)) {
        this.saveOperation('beginning', beginning);
        this.saveOperation('end', end);
      } else {
        this.beginning = HB.addOperation(new types.Delimiter(void 0, void 0, void 0));
        this.end = HB.addOperation(new types.Delimiter(void 0, this.beginning, void 0));
        this.beginning.next_cl = this.end;
        this.beginning.execute();
        this.end.execute();
      }
      ListManager.__super__.constructor.call(this, uid, prev, next, origin);
    }

    ListManager.prototype.execute = function() {
      if (this.validateSavedOperations()) {
        this.beginning.setParent(this);
        this.end.setParent(this);
        return ListManager.__super__.execute.apply(this, arguments);
      } else {
        return false;
      }
    };

    ListManager.prototype.getLastOperation = function() {
      return this.end.prev_cl;
    };

    ListManager.prototype.getFirstOperation = function() {
      return this.beginning.next_cl;
    };

    ListManager.prototype.toArray = function() {
      var o, result;
      o = this.beginning.next_cl;
      result = [];
      while (o !== this.end) {
        result.push(o);
        o = o.next_cl;
      }
      return result;
    };

    ListManager.prototype.getOperationByPosition = function(position) {
      var o;
      o = this.beginning.next_cl;
      if ((position > 0 || o.isDeleted()) && !(o instanceof types.Delimiter)) {
        while (o.isDeleted() && !(o instanceof types.Delimiter)) {
          o = o.next_cl;
        }
        while (true) {
          if (o instanceof types.Delimiter) {
            break;
          }
          if (position <= 0 && !o.isDeleted()) {
            break;
          }
          o = o.next_cl;
          if (!o.isDeleted()) {
            position -= 1;
          }
        }
      }
      return o;
    };

    return ListManager;

  })(types.Insert);
  ReplaceManager = (function(_super) {
    __extends(ReplaceManager, _super);

    function ReplaceManager(initial_content, uid, beginning, end, prev, next, origin) {
      ReplaceManager.__super__.constructor.call(this, uid, beginning, end, prev, next, origin);
      if (initial_content != null) {
        this.replace(initial_content);
      }
    }

    ReplaceManager.prototype.replace = function(content, replaceable_uid) {
      var o, op;
      o = this.getLastOperation();
      op = new Replaceable(content, this, replaceable_uid, o, o.next_cl);
      return HB.addOperation(op).execute();
    };

    ReplaceManager.prototype.setParent = function(parent, property_name) {
      var addPropertyListener;
      this.on('insert', (function(_this) {
        return function(event, op) {
          if (op.next_cl instanceof types.Delimiter) {
            return _this.parent.callEvent('change', property_name);
          }
        };
      })(this));
      this.on('change', (function(_this) {
        return function(event) {
          return _this.parent.callEvent('change', property_name);
        };
      })(this));
      addPropertyListener = (function(_this) {
        return function(event, op) {
          if (op.next_cl instanceof types.Delimiter && op.prev_cl instanceof types.Delimiter) {
            _this.parent.callEvent('addProperty', property_name);
          }
          return _this.deleteListener('addProperty', addPropertyListener);
        };
      })(this);
      this.on('insert', addPropertyListener);
      return ReplaceManager.__super__.setParent.call(this, parent);
    };

    ReplaceManager.prototype.val = function() {
      var o;
      o = this.getLastOperation();
      return typeof o.val === "function" ? o.val() : void 0;
    };

    ReplaceManager.prototype._encode = function() {
      var json;
      json = {
        'type': "ReplaceManager",
        'uid': this.getUid(),
        'beginning': this.beginning.getUid(),
        'end': this.end.getUid()
      };
      if ((this.prev_cl != null) && (this.next_cl != null)) {
        json['prev'] = this.prev_cl.getUid();
        json['next'] = this.next_cl.getUid();
      }
      if ((this.origin != null) && this.origin !== this.prev_cl) {
        json["origin"] = this.origin.getUid();
      }
      return json;
    };

    return ReplaceManager;

  })(ListManager);
  parser["ReplaceManager"] = function(json) {
    var beginning, content, end, next, origin, prev, uid;
    content = json['content'], uid = json['uid'], prev = json['prev'], next = json['next'], origin = json['origin'], beginning = json['beginning'], end = json['end'];
    return new ReplaceManager(content, uid, beginning, end, prev, next, origin);
  };
  Replaceable = (function(_super) {
    __extends(Replaceable, _super);

    function Replaceable(content, parent, uid, prev, next, origin) {
      this.saveOperation('content', content);
      this.saveOperation('parent', parent);
      if (!((prev != null) && (next != null) && (content != null))) {
        throw new Error("You must define content, prev, and next for Replaceable-types!");
      }
      Replaceable.__super__.constructor.call(this, uid, prev, next, origin);
    }

    Replaceable.prototype.val = function() {
      return this.content;
    };

    Replaceable.prototype.replace = function(content) {
      return this.parent.replace(content);
    };

    Replaceable.prototype.execute = function() {
      var _base;
      if (!this.validateSavedOperations()) {
        return false;
      } else {
        if (typeof (_base = this.content).setReplaceManager === "function") {
          _base.setReplaceManager(this.parent);
        }
        return Replaceable.__super__.execute.apply(this, arguments);
      }
    };

    Replaceable.prototype._encode = function() {
      var json;
      json = {
        'type': "Replaceable",
        'content': this.content.getUid(),
        'ReplaceManager': this.parent.getUid(),
        'prev': this.prev_cl.getUid(),
        'next': this.next_cl.getUid(),
        'uid': this.getUid()
      };
      if ((this.origin != null) && this.origin !== this.prev_cl) {
        json["origin"] = this.origin.getUid();
      }
      return json;
    };

    return Replaceable;

  })(types.Insert);
  parser["Replaceable"] = function(json) {
    var content, next, origin, parent, prev, uid;
    content = json['content'], parent = json['ReplaceManager'], uid = json['uid'], prev = json['prev'], next = json['next'], origin = json['origin'];
    return new Replaceable(content, parent, uid, prev, next, origin);
  };
  types['ListManager'] = ListManager;
  types['MapManager'] = MapManager;
  types['ReplaceManager'] = ReplaceManager;
  types['Replaceable'] = Replaceable;
  return basic_types;
};


},{"./BasicTypes":1}],3:[function(require,module,exports){
var structured_types_uninitialized,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

structured_types_uninitialized = require("./StructuredTypes");

module.exports = function(HB) {
  var TextDelete, TextInsert, Word, parser, structured_types, types;
  structured_types = structured_types_uninitialized(HB);
  types = structured_types.types;
  parser = structured_types.parser;
  TextDelete = (function(_super) {
    __extends(TextDelete, _super);

    function TextDelete() {
      return TextDelete.__super__.constructor.apply(this, arguments);
    }

    return TextDelete;

  })(types.Delete);
  parser["TextDelete"] = parser["Delete"];
  TextInsert = (function(_super) {
    __extends(TextInsert, _super);

    function TextInsert(content, uid, prev, next, origin) {
      this.content = content;
      if (!((prev != null) && (next != null))) {
        throw new Error("You must define prev, and next for TextInsert-types!");
      }
      TextInsert.__super__.constructor.call(this, uid, prev, next, origin);
    }

    TextInsert.prototype.getLength = function() {
      if (this.isDeleted()) {
        return 0;
      } else {
        return this.content.length;
      }
    };

    TextInsert.prototype.val = function(current_position) {
      if (this.isDeleted()) {
        return "";
      } else {
        return this.content;
      }
    };

    TextInsert.prototype._encode = function() {
      var json;
      json = {
        'type': "TextInsert",
        'content': this.content,
        'uid': this.getUid(),
        'prev': this.prev_cl.getUid(),
        'next': this.next_cl.getUid()
      };
      if ((this.origin != null) && this.origin !== this.prev_cl) {
        json["origin"] = this.origin.getUid();
      }
      return json;
    };

    return TextInsert;

  })(types.Insert);
  parser["TextInsert"] = function(json) {
    var content, next, origin, prev, uid;
    content = json['content'], uid = json['uid'], prev = json['prev'], next = json['next'], origin = json['origin'];
    return new TextInsert(content, uid, prev, next, origin);
  };
  Word = (function(_super) {
    __extends(Word, _super);

    function Word(uid, beginning, end, prev, next, origin) {
      Word.__super__.constructor.call(this, uid, beginning, end, prev, next, origin);
    }

    Word.prototype.insertText = function(position, content) {
      var c, o, op, _i, _len, _results;
      o = this.getOperationByPosition(position);
      _results = [];
      for (_i = 0, _len = content.length; _i < _len; _i++) {
        c = content[_i];
        op = new TextInsert(c, void 0, o.prev_cl, o);
        _results.push(HB.addOperation(op).execute());
      }
      return _results;
    };

    Word.prototype.deleteText = function(position, length) {
      var d, delete_ops, i, o, _i;
      o = this.getOperationByPosition(position);
      delete_ops = [];
      for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
        if (o instanceof types.Delimiter) {
          break;
        }
        d = HB.addOperation(new TextDelete(void 0, o)).execute();
        o = o.next_cl;
        while (!(o instanceof types.Delimiter) && o.isDeleted()) {
          o = o.next_cl;
        }
        delete_ops.push(d._encode());
      }
      return delete_ops;
    };

    Word.prototype.replaceText = function(text) {
      var word;
      if (this.replace_manager != null) {
        word = HB.addOperation(new Word(void 0)).execute();
        word.insertText(0, text);
        return this.replace_manager.replace(word);
      } else {
        throw new Error("This type is currently not maintained by a ReplaceManager!");
      }
    };

    Word.prototype.val = function() {
      var c, o;
      c = (function() {
        var _i, _len, _ref, _results;
        _ref = this.toArray();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          o = _ref[_i];
          if (o.val != null) {
            _results.push(o.val());
          } else {
            _results.push("");
          }
        }
        return _results;
      }).call(this);
      return c.join('');
    };

    Word.prototype.setReplaceManager = function(op) {
      this.saveOperation('replace_manager', op);
      this.validateSavedOperations();
      return this.on(['insert', 'delete'], (function(_this) {
        return function() {
          var _ref;
          return (_ref = _this.replace_manager) != null ? _ref.callEvent('change') : void 0;
        };
      })(this));
    };

    Word.prototype.bind = function(textfield) {
      var word;
      word = this;
      textfield.value = this.val();
      this.on("insert", function(event, op) {
        var fix, left, o_pos, right;
        o_pos = op.getPosition();
        fix = function(cursor) {
          if (cursor <= o_pos) {
            return cursor;
          } else {
            cursor += 1;
            return cursor;
          }
        };
        left = fix(textfield.selectionStart);
        right = fix(textfield.selectionEnd);
        textfield.value = word.val();
        return textfield.setSelectionRange(left, right);
      });
      this.on("delete", function(event, op) {
        var fix, left, o_pos, right;
        o_pos = op.getPosition();
        fix = function(cursor) {
          if (cursor < o_pos) {
            return cursor;
          } else {
            cursor -= 1;
            return cursor;
          }
        };
        left = fix(textfield.selectionStart);
        right = fix(textfield.selectionEnd);
        textfield.value = word.val();
        return textfield.setSelectionRange(left, right);
      });
      textfield.onkeypress = function(event) {
        var char, diff, new_pos, pos;
        char = null;
        if (event.key != null) {
          if (event.charCode === 32) {
            char = " ";
          } else if (event.keyCode === 13) {
            char = '\n';
          } else {
            char = event.key;
          }
        } else {
          char = String.fromCharCode(event.keyCode);
        }
        if (char.length > 0) {
          pos = Math.min(textfield.selectionStart, textfield.selectionEnd);
          diff = Math.abs(textfield.selectionEnd - textfield.selectionStart);
          word.deleteText(pos, diff);
          word.insertText(pos, char);
          new_pos = pos + char.length;
          textfield.setSelectionRange(new_pos, new_pos);
          return event.preventDefault();
        } else {
          return event.preventDefault();
        }
      };
      textfield.onpaste = function(event) {
        return event.preventDefault();
      };
      textfield.oncut = function(event) {
        return event.preventDefault();
      };
      return textfield.onkeydown = function(event) {
        var del_length, diff, new_pos, pos, val;
        pos = Math.min(textfield.selectionStart, textfield.selectionEnd);
        diff = Math.abs(textfield.selectionEnd - textfield.selectionStart);
        if ((event.keyCode != null) && event.keyCode === 8) {
          if (diff > 0) {
            word.deleteText(pos, diff);
            textfield.setSelectionRange(pos, pos);
          } else {
            if ((event.ctrlKey != null) && event.ctrlKey) {
              val = textfield.value;
              new_pos = pos;
              del_length = 0;
              if (pos > 0) {
                new_pos--;
                del_length++;
              }
              while (new_pos > 0 && val[new_pos] !== " " && val[new_pos] !== '\n') {
                new_pos--;
                del_length++;
              }
              word.deleteText(new_pos, pos - new_pos);
              textfield.setSelectionRange(new_pos, new_pos);
            } else {
              word.deleteText(pos - 1, 1);
            }
          }
          return event.preventDefault();
        } else if ((event.keyCode != null) && event.keyCode === 46) {
          if (diff > 0) {
            word.deleteText(pos, diff);
            textfield.setSelectionRange(pos, pos);
          } else {
            word.deleteText(pos, 1);
            textfield.setSelectionRange(pos, pos);
          }
          return event.preventDefault();
        }
      };
    };

    Word.prototype._encode = function() {
      var json;
      json = {
        'type': "Word",
        'uid': this.getUid(),
        'beginning': this.beginning.getUid(),
        'end': this.end.getUid()
      };
      if (this.prev_cl != null) {
        json['prev'] = this.prev_cl.getUid();
      }
      if (this.next_cl != null) {
        json['next'] = this.next_cl.getUid();
      }
      if ((this.origin != null) && this.origin !== this.prev_cl) {
        json["origin"] = this.origin.getUid();
      }
      return json;
    };

    return Word;

  })(types.ListManager);
  parser['Word'] = function(json) {
    var beginning, end, next, origin, prev, uid;
    uid = json['uid'], beginning = json['beginning'], end = json['end'], prev = json['prev'], next = json['next'], origin = json['origin'];
    return new Word(uid, beginning, end, prev, next, origin);
  };
  types['TextInsert'] = TextInsert;
  types['TextDelete'] = TextDelete;
  types['Word'] = Word;
  return structured_types;
};


},{"./StructuredTypes":2}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2Rtb25hZC9Ecm9wYm94L1lhdHRhIS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9kbW9uYWQvRHJvcGJveC9ZYXR0YSEvbGliL1R5cGVzL0Jhc2ljVHlwZXMuY29mZmVlIiwiL2hvbWUvZG1vbmFkL0Ryb3Bib3gvWWF0dGEhL2xpYi9UeXBlcy9TdHJ1Y3R1cmVkVHlwZXMuY29mZmVlIiwiL2hvbWUvZG1vbmFkL0Ryb3Bib3gvWWF0dGEhL2xpYi9UeXBlcy9UZXh0VHlwZXMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQTs7aVNBQUE7O0FBQUEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxFQUFELEdBQUE7QUFFZixNQUFBLGlGQUFBO0FBQUEsRUFBQSxNQUFBLEdBQVMsRUFBVCxDQUFBO0FBQUEsRUFDQSxrQkFBQSxHQUFxQixFQURyQixDQUFBO0FBQUEsRUFhTTtBQU1TLElBQUEsbUJBQUMsR0FBRCxHQUFBO0FBQ1gsTUFBQSxJQUFPLFdBQVA7QUFDRSxRQUFBLEdBQUEsR0FBTSxFQUFFLENBQUMsMEJBQUgsQ0FBQSxDQUFOLENBREY7T0FBQTtBQUFBLE1BR2EsSUFBQyxDQUFBLGNBQVosVUFERixFQUVnQixJQUFDLENBQUEsZ0JBQWYsWUFKRixDQURXO0lBQUEsQ0FBYjs7QUFBQSx3QkFhQSxFQUFBLEdBQUksU0FBQyxNQUFELEVBQVMsQ0FBVCxHQUFBO0FBQ0YsVUFBQSw0QkFBQTs7UUFBQSxJQUFDLENBQUEsa0JBQW1CO09BQXBCO0FBQ0EsTUFBQSxJQUFHLE1BQU0sQ0FBQyxXQUFQLEtBQXdCLEVBQUUsQ0FBQyxXQUE5QjtBQUNFLFFBQUEsTUFBQSxHQUFTLENBQUMsTUFBRCxDQUFULENBREY7T0FEQTtBQUdBO1dBQUEsNkNBQUE7dUJBQUE7O2VBQ21CLENBQUEsQ0FB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LENBRmpCLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSAoSEIpLT5cbiAgIyBAc2VlIEVuZ2luZS5wYXJzZVxuICBwYXJzZXIgPSB7fVxuICBleGVjdXRpb25fbGlzdGVuZXIgPSBbXVxuXG4gICNcbiAgIyBBIGdlbmVyaWMgaW50ZXJmYWNlIHRvIG9wZXJhdGlvbnMuXG4gICNcbiAgIyBBbiBvcGVyYXRpb24gaGFzIHRoZSBmb2xsb3dpbmcgbWV0aG9kczpcbiAgIyBfZW5jb2RlOiBlbmNvZGVzIGFuIG9wZXJhdGlvbiAobmVlZGVkIG9ubHkgaWYgaW5zdGFuY2Ugb2YgdGhpcyBvcGVyYXRpb24gaXMgc2VudCkuXG4gICMgZXhlY3V0ZTogZXhlY3V0ZSB0aGUgZWZmZWN0cyBvZiB0aGlzIG9wZXJhdGlvbnMuIEdvb2QgZXhhbXBsZXMgYXJlIEluc2VydC10eXBlIGFuZCBBZGROYW1lLXR5cGVcbiAgIyB2YWw6IGluIHRoZSBjYXNlIHRoYXQgdGhlIG9wZXJhdGlvbiBob2xkcyBhIHZhbHVlXG4gICNcbiAgIyBGdXJ0aGVybW9yZSBhbiBlbmNvZGFibGUgb3BlcmF0aW9uIGhhcyBhIHBhcnNlci5cbiAgI1xuICBjbGFzcyBPcGVyYXRpb25cblxuICAgICNcbiAgICAjIEBwYXJhbSB7T2JqZWN0fSB1aWQgQSB1bmlxdWUgaWRlbnRpZmllci4gSWYgdWlkIGlzIHVuZGVmaW5lZCwgYSBuZXcgdWlkIHdpbGwgYmUgY3JlYXRlZC5cbiAgICAjIEBzZWUgSGlzdG9yeUJ1ZmZlci5nZXROZXh0T3BlcmF0aW9uSWRlbnRpZmllclxuICAgICNcbiAgICBjb25zdHJ1Y3RvcjogKHVpZCktPlxuICAgICAgaWYgbm90IHVpZD9cbiAgICAgICAgdWlkID0gSEIuZ2V0TmV4dE9wZXJhdGlvbklkZW50aWZpZXIoKVxuICAgICAge1xuICAgICAgICAnY3JlYXRvcic6IEBjcmVhdG9yXG4gICAgICAgICdvcF9udW1iZXInIDogQG9wX251bWJlclxuICAgICAgfSA9IHVpZFxuXG4gICAgI1xuICAgICMgQWRkIGFuIGV2ZW50IGxpc3RlbmVyLiBJdCBkZXBlbmRzIG9uIHRoZSBvcGVyYXRpb24gd2hpY2ggZXZlbnRzIGFyZSBzdXBwb3J0ZWQuXG4gICAgIyBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gICAgIyBAcGFyYW0ge0Z1bmN0aW9ufSBmIGYgaXMgZXhlY3V0ZWQgaW4gY2FzZSB0aGUgZXZlbnQgZmlyZXMuXG4gICAgI1xuICAgIG9uOiAoZXZlbnRzLCBmKS0+XG4gICAgICBAZXZlbnRfbGlzdGVuZXJzID89IHt9XG4gICAgICBpZiBldmVudHMuY29uc3RydWN0b3IgaXNudCBbXS5jb25zdHJ1Y3RvclxuICAgICAgICBldmVudHMgPSBbZXZlbnRzXVxuICAgICAgZm9yIGUgaW4gZXZlbnRzXG4gICAgICAgIEBldmVudF9saXN0ZW5lcnNbZV0gPz0gW11cbiAgICAgICAgQGV2ZW50X2xpc3RlbmVyc1tlXS5wdXNoIGZcblxuICAgIGRlbGV0ZUxpc3RlbmVyOiAoZXZlbnRzLCBmKS0+XG4gICAgICBpZiBldmVudHMuY29uc3RydWN0b3IgaXNudCBbXS5jb25zdHJ1Y3RvclxuICAgICAgICBldmVudHMgPSBbZXZlbnRzXVxuICAgICAgZm9yIGUgaW4gZXZlbnRzXG4gICAgICAgIGlmIEBldmVudF9saXN0ZW5lcnM/W2VdP1xuICAgICAgICAgIEBldmVudF9saXN0ZW5lcnNbZV0gPSBAZXZlbnRfbGlzdGVuZXJzW2VdLmZpbHRlciAoZyktPlxuICAgICAgICAgICAgZiBpc250IGdcblxuICAgICNcbiAgICAjIEZpcmUgYW4gZXZlbnQuXG4gICAgIyBUT0RPOiBEbyBzb21ldGhpbmcgd2l0aCB0aW1lb3V0cy4gWW91IGRvbid0IHdhbnQgdGhpcyB0byBmaXJlIGZvciBldmVyeSBvcGVyYXRpb24gKGUuZy4gaW5zZXJ0KS5cbiAgICAjXG4gICAgY2FsbEV2ZW50OiAoKS0+XG4gICAgICBAZm9yd2FyZEV2ZW50IEAsIGFyZ3VtZW50cy4uLlxuXG4gICAgI1xuICAgICMgRmlyZSBhbiBldmVudCBhbmQgc3BlY2lmeSBpbiB3aGljaCBjb250ZXh0IHRoZSBsaXN0ZW5lciBpcyBjYWxsZWQgKHNldCAndGhpcycpLlxuICAgICNcbiAgICBmb3J3YXJkRXZlbnQ6IChvcCwgZXZlbnQsIGFyZ3MuLi4pLT5cbiAgICAgIGlmIEBldmVudF9saXN0ZW5lcnM/W2V2ZW50XT9cbiAgICAgICAgZm9yIGYgaW4gQGV2ZW50X2xpc3RlbmVyc1tldmVudF1cbiAgICAgICAgICBmLmNhbGwgb3AsIGV2ZW50LCBhcmdzLi4uXG5cbiAgICAjXG4gICAgIyBTZXQgdGhlIHBhcmVudCBvZiB0aGlzIG9wZXJhdGlvbi5cbiAgICAjXG4gICAgc2V0UGFyZW50OiAoQHBhcmVudCktPlxuXG4gICAgI1xuICAgICMgR2V0IHRoZSBwYXJlbnQgb2YgdGhpcyBvcGVyYXRpb24uXG4gICAgI1xuICAgIGdldFBhcmVudDogKCktPlxuICAgICAgQHBhcmVudFxuXG4gICAgI1xuICAgICMgQ29tcHV0ZXMgYSB1bmlxdWUgaWRlbnRpZmllciAodWlkKSB0aGF0IGlkZW50aWZpZXMgdGhpcyBvcGVyYXRpb24uXG4gICAgI1xuICAgIGdldFVpZDogKCktPlxuICAgICAgeyAnY3JlYXRvcic6IEBjcmVhdG9yLCAnb3BfbnVtYmVyJzogQG9wX251bWJlciB9XG5cbiAgICAjXG4gICAgIyBAcHJpdmF0ZVxuICAgICMgTm90aWZ5IHRoZSBhbGwgdGhlIGxpc3RlbmVycy5cbiAgICAjXG4gICAgZXhlY3V0ZTogKCktPlxuICAgICAgQGlzX2V4ZWN1dGVkID0gdHJ1ZVxuICAgICAgZm9yIGwgaW4gZXhlY3V0aW9uX2xpc3RlbmVyXG4gICAgICAgIGwgQF9lbmNvZGUoKVxuICAgICAgQFxuXG4gICAgI1xuICAgICMgQHByaXZhdGVcbiAgICAjIE9wZXJhdGlvbnMgbWF5IGRlcGVuZCBvbiBvdGhlciBvcGVyYXRpb25zIChsaW5rZWQgbGlzdHMsIGV0Yy4pLlxuICAgICMgVGhlIHNhdmVPcGVyYXRpb24gYW5kIHZhbGlkYXRlU2F2ZWRPcGVyYXRpb25zIG1ldGhvZHMgcHJvdmlkZVxuICAgICMgYW4gZWFzeSB3YXkgdG8gcmVmZXIgdG8gdGhlc2Ugb3BlcmF0aW9ucyB2aWEgYW4gdWlkIG9yIG9iamVjdCByZWZlcmVuY2UuXG4gICAgI1xuICAgICMgRm9yIGV4YW1wbGU6IFdlIGNhbiBjcmVhdGUgYSBuZXcgRGVsZXRlIG9wZXJhdGlvbiB0aGF0IGRlbGV0ZXMgdGhlIG9wZXJhdGlvbiAkbyBsaWtlIHRoaXNcbiAgICAjICAgICAtIHZhciBkID0gbmV3IERlbGV0ZSh1aWQsICRvKTsgICBvclxuICAgICMgICAgIC0gdmFyIGQgPSBuZXcgRGVsZXRlKHVpZCwgJG8uZ2V0VWlkKCkpO1xuICAgICMgRWl0aGVyIHdheSB3ZSB3YW50IHRvIGFjY2VzcyAkbyB2aWEgZC5kZWxldGVzLiBJbiB0aGUgc2Vjb25kIGNhc2UgdmFsaWRhdGVTYXZlZE9wZXJhdGlvbnMgbXVzdCBiZSBjYWxsZWQgZmlyc3QuXG4gICAgI1xuICAgICMgQG92ZXJsb2FkIHNhdmVPcGVyYXRpb24obmFtZSwgb3BfdWlkKVxuICAgICMgICBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgb3BlcmF0aW9uLiBBZnRlciB2YWxpZGF0aW5nICh3aXRoIHZhbGlkYXRlU2F2ZWRPcGVyYXRpb25zKSB0aGUgaW5zdGFudGlhdGVkIG9wZXJhdGlvbiB3aWxsIGJlIGFjY2Vzc2libGUgdmlhIHRoaXNbbmFtZV0uXG4gICAgIyAgIEBwYXJhbSB7T2JqZWN0fSBvcF91aWQgQSB1aWQgdGhhdCByZWZlcnMgdG8gYW4gb3BlcmF0aW9uXG4gICAgIyBAb3ZlcmxvYWQgc2F2ZU9wZXJhdGlvbihuYW1lLCBvcClcbiAgICAjICAgQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIG9wZXJhdGlvbi4gQWZ0ZXIgY2FsbGluZyB0aGlzIGZ1bmN0aW9uIG9wIGlzIGFjY2Vzc2libGUgdmlhIHRoaXNbbmFtZV0uXG4gICAgIyAgIEBwYXJhbSB7T3BlcmF0aW9ufSBvcCBBbiBPcGVyYXRpb24gb2JqZWN0XG4gICAgI1xuICAgIHNhdmVPcGVyYXRpb246IChuYW1lLCBvcCktPlxuXG4gICAgICAjXG4gICAgICAjIEV2ZXJ5IGluc3RhbmNlIG9mICRPcGVyYXRpb24gbXVzdCBoYXZlIGFuICRleGVjdXRlIGZ1bmN0aW9uLlxuICAgICAgIyBXZSB1c2UgZHVjay10eXBpbmcgdG8gY2hlY2sgaWYgb3AgaXMgaW5zdGFudGlhdGVkIHNpbmNlIHRoZXJlXG4gICAgICAjIGNvdWxkIGV4aXN0IG11bHRpcGxlIGNsYXNzZXMgb2YgJE9wZXJhdGlvblxuICAgICAgI1xuICAgICAgaWYgb3A/LmV4ZWN1dGU/XG4gICAgICAgICMgaXMgaW5zdGFudGlhdGVkXG4gICAgICAgIEBbbmFtZV0gPSBvcFxuICAgICAgZWxzZSBpZiBvcD9cbiAgICAgICAgIyBub3QgaW5pdGlhbGl6ZWQuIERvIGl0IHdoZW4gY2FsbGluZyAkdmFsaWRhdGVTYXZlZE9wZXJhdGlvbnMoKVxuICAgICAgICBAdW5jaGVja2VkID89IHt9XG4gICAgICAgIEB1bmNoZWNrZWRbbmFtZV0gPSBvcFxuXG4gICAgI1xuICAgICMgQHByaXZhdGVcbiAgICAjIEFmdGVyIGNhbGxpbmcgdGhpcyBmdW5jdGlvbiBhbGwgbm90IGluc3RhbnRpYXRlZCBvcGVyYXRpb25zIHdpbGwgYmUgYWNjZXNzaWJsZS5cbiAgICAjIEBzZWUgT3BlcmF0aW9uLnNhdmVPcGVyYXRpb25cbiAgICAjXG4gICAgIyBAcmV0dXJuIFtCb29sZWFuXSBXaGV0aGVyIGl0IHdhcyBwb3NzaWJsZSB0byBpbnN0YW50aWF0ZSBhbGwgb3BlcmF0aW9ucy5cbiAgICAjXG4gICAgdmFsaWRhdGVTYXZlZE9wZXJhdGlvbnM6ICgpLT5cbiAgICAgIHVuaW5zdGFudGlhdGVkID0ge31cbiAgICAgIHN1Y2Nlc3MgPSBAXG4gICAgICBmb3IgbmFtZSwgb3BfdWlkIG9mIEB1bmNoZWNrZWRcbiAgICAgICAgb3AgPSBIQi5nZXRPcGVyYXRpb24gb3BfdWlkXG4gICAgICAgIGlmIG9wXG4gICAgICAgICAgQFtuYW1lXSA9IG9wXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB1bmluc3RhbnRpYXRlZFtuYW1lXSA9IG9wX3VpZFxuICAgICAgICAgIHN1Y2Nlc3MgPSBmYWxzZVxuICAgICAgZGVsZXRlIEB1bmNoZWNrZWRcbiAgICAgIGlmIG5vdCBzdWNjZXNzXG4gICAgICAgIEB1bmNoZWNrZWQgPSB1bmluc3RhbnRpYXRlZFxuICAgICAgc3VjY2Vzc1xuXG5cblxuICAjXG4gICMgQSBzaW1wbGUgRGVsZXRlLXR5cGUgb3BlcmF0aW9uIHRoYXQgZGVsZXRlcyBhbiBJbnNlcnQtdHlwZSBvcGVyYXRpb24uXG4gICNcbiAgY2xhc3MgRGVsZXRlIGV4dGVuZHMgT3BlcmF0aW9uXG5cbiAgICAjXG4gICAgIyBAcGFyYW0ge09iamVjdH0gdWlkIEEgdW5pcXVlIGlkZW50aWZpZXIuIElmIHVpZCBpcyB1bmRlZmluZWQsIGEgbmV3IHVpZCB3aWxsIGJlIGNyZWF0ZWQuXG4gICAgIyBAcGFyYW0ge09iamVjdH0gZGVsZXRlcyBVSUQgb3IgcmVmZXJlbmNlIG9mIHRoZSBvcGVyYXRpb24gdGhhdCB0aGlzIHRvIGJlIGRlbGV0ZWQuXG4gICAgI1xuICAgIGNvbnN0cnVjdG9yOiAodWlkLCBkZWxldGVzKS0+XG4gICAgICBAc2F2ZU9wZXJhdGlvbiAnZGVsZXRlcycsIGRlbGV0ZXNcbiAgICAgIHN1cGVyIHVpZFxuXG4gICAgI1xuICAgICMgQHByaXZhdGVcbiAgICAjIENvbnZlcnQgYWxsIHJlbGV2YW50IGluZm9ybWF0aW9uIG9mIHRoaXMgb3BlcmF0aW9uIHRvIHRoZSBqc29uLWZvcm1hdC5cbiAgICAjIFRoaXMgcmVzdWx0IGNhbiBiZSBzZW50IHRvIG90aGVyIGNsaWVudHMuXG4gICAgI1xuICAgIF9lbmNvZGU6ICgpLT5cbiAgICAgIHtcbiAgICAgICAgJ3R5cGUnOiBcIkRlbGV0ZVwiXG4gICAgICAgICd1aWQnOiBAZ2V0VWlkKClcbiAgICAgICAgJ2RlbGV0ZXMnOiBAZGVsZXRlcy5nZXRVaWQoKVxuICAgICAgfVxuXG4gICAgI1xuICAgICMgQHByaXZhdGVcbiAgICAjIEFwcGx5IHRoZSBkZWxldGlvbi5cbiAgICAjXG4gICAgZXhlY3V0ZTogKCktPlxuICAgICAgaWYgQHZhbGlkYXRlU2F2ZWRPcGVyYXRpb25zKClcbiAgICAgICAgQGRlbGV0ZXMuYXBwbHlEZWxldGUgQFxuICAgICAgICBzdXBlclxuICAgICAgZWxzZVxuICAgICAgICBmYWxzZVxuXG4gICNcbiAgIyBEZWZpbmUgaG93IHRvIHBhcnNlIERlbGV0ZSBvcGVyYXRpb25zLlxuICAjXG4gIHBhcnNlclsnRGVsZXRlJ10gPSAobyktPlxuICAgIHtcbiAgICAgICd1aWQnIDogdWlkXG4gICAgICAnZGVsZXRlcyc6IGRlbGV0ZXNfdWlkXG4gICAgfSA9IG9cbiAgICBuZXcgRGVsZXRlIHVpZCwgZGVsZXRlc191aWRcblxuICAjXG4gICMgQSBzaW1wbGUgaW5zZXJ0LXR5cGUgb3BlcmF0aW9uLlxuICAjXG4gICMgQW4gaW5zZXJ0IG9wZXJhdGlvbiBpcyBhbHdheXMgcG9zaXRpb25lZCBiZXR3ZWVuIHR3byBvdGhlciBpbnNlcnQgb3BlcmF0aW9ucy5cbiAgIyBJbnRlcm5hbGx5IHRoaXMgaXMgcmVhbGl6ZWQgYXMgYXNzb2NpYXRpdmUgbGlzdHMsIHdoZXJlYnkgZWFjaCBpbnNlcnQgb3BlcmF0aW9uIGhhcyBhIHByZWRlY2Vzc29yIGFuZCBhIHN1Y2Nlc3Nvci5cbiAgIyBGb3IgdGhlIHNha2Ugb2YgZWZmaWNpZW5jeSB3ZSBtYWludGFpbiB0d28gbGlzdHM6XG4gICMgICAtIFRoZSBzaG9ydC1saXN0IChhYmJyZXYuIHNsKSBtYWludGFpbnMgb25seSB0aGUgb3BlcmF0aW9ucyB0aGF0IGFyZSBub3QgZGVsZXRlZFxuICAjICAgLSBUaGUgY29tcGxldGUtbGlzdCAoYWJicmV2LiBjbCkgbWFpbnRhaW5zIGFsbCBvcGVyYXRpb25zXG4gICNcbiAgY2xhc3MgSW5zZXJ0IGV4dGVuZHMgT3BlcmF0aW9uXG5cbiAgICAjXG4gICAgIyBAcGFyYW0ge09iamVjdH0gdWlkIEEgdW5pcXVlIGlkZW50aWZpZXIuIElmIHVpZCBpcyB1bmRlZmluZWQsIGEgbmV3IHVpZCB3aWxsIGJlIGNyZWF0ZWQuXG4gICAgIyBAcGFyYW0ge09wZXJhdGlvbn0gcHJldl9jbCBUaGUgcHJlZGVjZXNzb3Igb2YgdGhpcyBvcGVyYXRpb24gaW4gdGhlIGNvbXBsZXRlLWxpc3QgKGNsKVxuICAgICMgQHBhcmFtIHtPcGVyYXRpb259IG5leHRfY2wgVGhlIHN1Y2Nlc3NvciBvZiB0aGlzIG9wZXJhdGlvbiBpbiB0aGUgY29tcGxldGUtbGlzdCAoY2wpXG4gICAgI1xuICAgICMgQHNlZSBIaXN0b3J5QnVmZmVyLmdldE5leHRPcGVyYXRpb25JZGVudGlmaWVyXG4gICAgI1xuICAgIGNvbnN0cnVjdG9yOiAodWlkLCBwcmV2X2NsLCBuZXh0X2NsLCBvcmlnaW4pLT5cbiAgICAgIEBzYXZlT3BlcmF0aW9uICdwcmV2X2NsJywgcHJldl9jbFxuICAgICAgQHNhdmVPcGVyYXRpb24gJ25leHRfY2wnLCBuZXh0X2NsXG4gICAgICBpZiBvcmlnaW4/XG4gICAgICAgIEBzYXZlT3BlcmF0aW9uICdvcmlnaW4nLCBvcmlnaW5cbiAgICAgIGVsc2VcbiAgICAgICAgQHNhdmVPcGVyYXRpb24gJ29yaWdpbicsIHByZXZfY2xcbiAgICAgIHN1cGVyIHVpZFxuXG4gICAgI1xuICAgICMgQHByaXZhdGVcbiAgICAjXG4gICAgYXBwbHlEZWxldGU6IChvKS0+XG4gICAgICBAZGVsZXRlZF9ieSA/PSBbXVxuICAgICAgQGRlbGV0ZWRfYnkucHVzaCBvXG4gICAgICBpZiBAcGFyZW50PyBhbmQgQGRlbGV0ZWRfYnkubGVuZ3RoIGlzIDFcbiAgICAgICAgIyBjYWxsIGlmZiB3YXNuJ3QgZGVsZXRlZCBlYXJseWVyXG4gICAgICAgIEBwYXJlbnQuY2FsbEV2ZW50IFwiZGVsZXRlXCIsIEBcblxuICAgICNcbiAgICAjIElmIGlzRGVsZXRlZCgpIGlzIHRydWUgdGhpcyBvcGVyYXRpb24gd29uJ3QgYmUgbWFpbnRhaW5lZCBpbiB0aGUgc2xcbiAgICAjXG4gICAgaXNEZWxldGVkOiAoKS0+XG4gICAgICBAZGVsZXRlZF9ieT8ubGVuZ3RoID4gMFxuXG4gICAgI1xuICAgICMgQHByaXZhdGVcbiAgICAjIFRoZSBhbW91bnQgb2YgcG9zaXRpb25zIHRoYXQgJHRoaXMgb3BlcmF0aW9uIHdhcyBtb3ZlZCB0byB0aGUgcmlnaHQuXG4gICAgI1xuICAgIGdldERpc3RhbmNlVG9PcmlnaW46ICgpLT5cbiAgICAgIGQgPSAwXG4gICAgICBvID0gQHByZXZfY2xcbiAgICAgIHdoaWxlIHRydWVcbiAgICAgICAgaWYgQG9yaWdpbiBpcyBvXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgZCsrXG4gICAgICAgICNUT0RPOiBkZWxldGUgdGhpc1xuICAgICAgICBpZiBAIGlzIEBwcmV2X2NsXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwidGhpcyBzaG91bGQgbm90IGhhcHBlbiA7KSBcIlxuICAgICAgICBvID0gby5wcmV2X2NsXG4gICAgICBkXG5cbiAgICAjXG4gICAgIyBAcHJpdmF0ZVxuICAgICMgVXBkYXRlIHRoZSBzaG9ydCBsaXN0XG4gICAgIyBUT0RPIChVbnVzZWQpXG4gICAgdXBkYXRlX3NsOiAoKS0+XG4gICAgICBvID0gQHByZXZfY2xcbiAgICAgIHVwZGF0ZTogKGRlc3RfY2wsZGVzdF9zbCktPlxuICAgICAgICB3aGlsZSB0cnVlXG4gICAgICAgICAgaWYgby5pc0RlbGV0ZWQoKVxuICAgICAgICAgICAgbyA9IG9bZGVzdF9jbF1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBAW2Rlc3Rfc2xdID0gb1xuXG4gICAgICAgICAgICBicmVha1xuICAgICAgdXBkYXRlIFwicHJldl9jbFwiLCBcInByZXZfc2xcIlxuICAgICAgdXBkYXRlIFwibmV4dF9jbFwiLCBcInByZXZfc2xcIlxuXG5cblxuICAgICNcbiAgICAjIEBwcml2YXRlXG4gICAgIyBJbmNsdWRlIHRoaXMgb3BlcmF0aW9uIGluIHRoZSBhc3NvY2lhdGl2ZSBsaXN0cy5cbiAgICAjXG4gICAgZXhlY3V0ZTogKCktPlxuICAgICAgaWYgQGlzX2V4ZWN1dGVkP1xuICAgICAgICByZXR1cm4gQFxuICAgICAgaWYgbm90IEB2YWxpZGF0ZVNhdmVkT3BlcmF0aW9ucygpXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgZWxzZVxuICAgICAgICBpZiBAcHJldl9jbD8udmFsaWRhdGVTYXZlZE9wZXJhdGlvbnMoKSBhbmQgQG5leHRfY2w/LnZhbGlkYXRlU2F2ZWRPcGVyYXRpb25zKCkgYW5kIEBwcmV2X2NsLm5leHRfY2wgaXNudCBAXG4gICAgICAgICAgZGlzdGFuY2VfdG9fb3JpZ2luID0gMFxuICAgICAgICAgIG8gPSBAcHJldl9jbC5uZXh0X2NsXG4gICAgICAgICAgaSA9IDBcbiAgICAgICAgICAjICR0aGlzIGhhcyB0byBmaW5kIGEgdW5pcXVlIHBvc2l0aW9uIGJldHdlZW4gb3JpZ2luIGFuZCB0aGUgbmV4dCBrbm93biBjaGFyYWN0ZXJcbiAgICAgICAgICAjIGNhc2UgMTogJG9yaWdpbiBlcXVhbHMgJG8ub3JpZ2luOiB0aGUgJGNyZWF0b3IgcGFyYW1ldGVyIGRlY2lkZXMgaWYgbGVmdCBvciByaWdodFxuICAgICAgICAgICMgICAgICAgICBsZXQgJE9MPSBbbzEsbzIsbzMsbzRdLCB3aGVyZWJ5ICR0aGlzIGlzIHRvIGJlIGluc2VydGVkIGJldHdlZW4gbzEgYW5kIG80XG4gICAgICAgICAgIyAgICAgICAgIG8yLG8zIGFuZCBvNCBvcmlnaW4gaXMgMSAodGhlIHBvc2l0aW9uIG9mIG8yKVxuICAgICAgICAgICMgICAgICAgICB0aGVyZSBpcyB0aGUgY2FzZSB0aGF0ICR0aGlzLmNyZWF0b3IgPCBvMi5jcmVhdG9yLCBidXQgbzMuY3JlYXRvciA8ICR0aGlzLmNyZWF0b3JcbiAgICAgICAgICAjICAgICAgICAgdGhlbiBvMiBrbm93cyBvMy4gU2luY2Ugb24gYW5vdGhlciBjbGllbnQgJE9MIGNvdWxkIGJlIFtvMSxvMyxvNF0gdGhlIHByb2JsZW0gaXMgY29tcGxleFxuICAgICAgICAgICMgICAgICAgICB0aGVyZWZvcmUgJHRoaXMgd291bGQgYmUgYWx3YXlzIHRvIHRoZSByaWdodCBvZiBvM1xuICAgICAgICAgICMgY2FzZSAyOiAkb3JpZ2luIDwgJG8ub3JpZ2luXG4gICAgICAgICAgIyAgICAgICAgIGlmIGN1cnJlbnQgJHRoaXMgaW5zZXJ0X3Bvc2l0aW9uID4gJG8gb3JpZ2luOiAkdGhpcyBpbnNcbiAgICAgICAgICAjICAgICAgICAgZWxzZSAkaW5zZXJ0X3Bvc2l0aW9uIHdpbGwgbm90IGNoYW5nZSAobWF5YmUgd2UgZW5jb3VudGVyIGNhc2UgMSBsYXRlciwgdGhlbiB0aGlzIHdpbGwgYmUgdG8gdGhlIHJpZ2h0IG9mICRvKVxuICAgICAgICAgICMgY2FzZSAzOiAkb3JpZ2luID4gJG8ub3JpZ2luXG4gICAgICAgICAgIyAgICAgICAgICR0aGlzIGluc2VydF9wb3NpdGlvbiBpcyB0byB0aGUgbGVmdCBvZiAkbyAoZm9yZXZlciEpXG4gICAgICAgICAgd2hpbGUgdHJ1ZVxuICAgICAgICAgICAgaWYgbm90IG8/XG4gICAgICAgICAgICAgICMgVE9ETzogRGVidWdnaW5nXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nIEpTT04uc3RyaW5naWZ5IEBwcmV2X2NsLmdldFVpZCgpXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nIEpTT04uc3RyaW5naWZ5IEBuZXh0X2NsLmdldFVpZCgpXG4gICAgICAgICAgICBpZiBvIGlzbnQgQG5leHRfY2xcbiAgICAgICAgICAgICAgIyAkbyBoYXBwZW5lZCBjb25jdXJyZW50bHlcbiAgICAgICAgICAgICAgaWYgby5nZXREaXN0YW5jZVRvT3JpZ2luKCkgaXMgaVxuICAgICAgICAgICAgICAgICMgY2FzZSAxXG4gICAgICAgICAgICAgICAgaWYgby5jcmVhdG9yIDwgQGNyZWF0b3JcbiAgICAgICAgICAgICAgICAgIEBwcmV2X2NsID0gb1xuICAgICAgICAgICAgICAgICAgZGlzdGFuY2VfdG9fb3JpZ2luID0gaSArIDFcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAjIG5vcFxuICAgICAgICAgICAgICBlbHNlIGlmIG8uZ2V0RGlzdGFuY2VUb09yaWdpbigpIDwgaVxuICAgICAgICAgICAgICAgICMgY2FzZSAyXG4gICAgICAgICAgICAgICAgaWYgaSAtIGRpc3RhbmNlX3RvX29yaWdpbiA8PSBvLmdldERpc3RhbmNlVG9PcmlnaW4oKVxuICAgICAgICAgICAgICAgICAgQHByZXZfY2wgPSBvXG4gICAgICAgICAgICAgICAgICBkaXN0YW5jZV90b19vcmlnaW4gPSBpICsgMVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICNub3BcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICMgY2FzZSAzXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgaSsrXG4gICAgICAgICAgICAgIG8gPSBvLm5leHRfY2xcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIyAkdGhpcyBrbm93cyB0aGF0ICRvIGV4aXN0cyxcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAjIG5vdyByZWNvbm5lY3QgZXZlcnl0aGluZ1xuICAgICAgICAgIEBuZXh0X2NsID0gQHByZXZfY2wubmV4dF9jbFxuICAgICAgICAgIEBwcmV2X2NsLm5leHRfY2wgPSBAXG4gICAgICAgICAgQG5leHRfY2wucHJldl9jbCA9IEBcbiAgICAgICAgcGFyZW50ID0gQHByZXZfY2w/LmdldFBhcmVudCgpXG4gICAgICAgIGlmIHBhcmVudD9cbiAgICAgICAgICBAc2V0UGFyZW50IHBhcmVudFxuICAgICAgICAgIEBwYXJlbnQuY2FsbEV2ZW50IFwiaW5zZXJ0XCIsIEBcbiAgICAgICAgc3VwZXIgIyBub3RpZnkgdGhlIGV4ZWN1dGlvbl9saXN0ZW5lcnNcblxuICAgICNcbiAgICAjIENvbXB1dGUgdGhlIHBvc2l0aW9uIG9mIHRoaXMgb3BlcmF0aW9uLlxuICAgICNcbiAgICBnZXRQb3NpdGlvbjogKCktPlxuICAgICAgcG9zaXRpb24gPSAwXG4gICAgICBwcmV2ID0gQHByZXZfY2xcbiAgICAgIHdoaWxlIHRydWVcbiAgICAgICAgaWYgcHJldiBpbnN0YW5jZW9mIERlbGltaXRlclxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGlmIHByZXYuaXNEZWxldGVkPyBhbmQgbm90IHByZXYuaXNEZWxldGVkKClcbiAgICAgICAgICBwb3NpdGlvbisrXG4gICAgICAgIHByZXYgPSBwcmV2LnByZXZfY2xcbiAgICAgIHBvc2l0aW9uXG4gICNcbiAgIyBEZWZpbmVzIGFuIG9iamVjdCB0aGF0IGlzIGNhbm5vdCBiZSBjaGFuZ2VkLiBZb3UgY2FuIHVzZSB0aGlzIHRvIHNldCBhbiBpbW11dGFibGUgc3RyaW5nLCBvciBhIG51bWJlci5cbiAgI1xuICBjbGFzcyBJbW11dGFibGVPYmplY3QgZXh0ZW5kcyBJbnNlcnRcblxuICAgICNcbiAgICAjIEBwYXJhbSB7T2JqZWN0fSB1aWQgQSB1bmlxdWUgaWRlbnRpZmllci4gSWYgdWlkIGlzIHVuZGVmaW5lZCwgYSBuZXcgdWlkIHdpbGwgYmUgY3JlYXRlZC5cbiAgICAjIEBwYXJhbSB7T2JqZWN0fSBjb250ZW50XG4gICAgI1xuICAgIGNvbnN0cnVjdG9yOiAodWlkLCBAY29udGVudCwgcHJldiwgbmV4dCwgb3JpZ2luKS0+XG4gICAgICBzdXBlciB1aWQsIHByZXYsIG5leHQsIG9yaWdpblxuXG4gICAgI1xuICAgICMgQHJldHVybiBbU3RyaW5nXSBUaGUgY29udGVudCBvZiB0aGlzIG9wZXJhdGlvbi5cbiAgICAjXG4gICAgdmFsIDogKCktPlxuICAgICAgQGNvbnRlbnRcblxuICAgICNcbiAgICAjIEVuY29kZSB0aGlzIG9wZXJhdGlvbiBpbiBzdWNoIGEgd2F5IHRoYXQgaXQgY2FuIGJlIHBhcnNlZCBieSByZW1vdGUgcGVlcnMuXG4gICAgI1xuICAgIF9lbmNvZGU6ICgpLT5cbiAgICAgIGpzb24gPSB7XG4gICAgICAgICd0eXBlJzogXCJJbW11dGFibGVPYmplY3RcIlxuICAgICAgICAndWlkJyA6IEBnZXRVaWQoKVxuICAgICAgICAnY29udGVudCcgOiBAY29udGVudFxuICAgICAgfVxuICAgICAgaWYgQHByZXZfY2w/XG4gICAgICAgIGpzb25bJ3ByZXYnXSA9IEBwcmV2X2NsLmdldFVpZCgpXG4gICAgICBpZiBAbmV4dF9jbD9cbiAgICAgICAganNvblsnbmV4dCddID0gQG5leHRfY2wuZ2V0VWlkKClcbiAgICAgIGlmIEBvcmlnaW4/IGFuZCBAb3JpZ2luIGlzbnQgQHByZXZfY2xcbiAgICAgICAganNvbltcIm9yaWdpblwiXSA9IEBvcmlnaW4uZ2V0VWlkKClcbiAgICAgIGpzb25cblxuICBwYXJzZXJbJ0ltbXV0YWJsZU9iamVjdCddID0gKGpzb24pLT5cbiAgICB7XG4gICAgICAndWlkJyA6IHVpZFxuICAgICAgJ2NvbnRlbnQnIDogY29udGVudFxuICAgICAgJ3ByZXYnOiBwcmV2XG4gICAgICAnbmV4dCc6IG5leHRcbiAgICAgICdvcmlnaW4nIDogb3JpZ2luXG4gICAgfSA9IGpzb25cbiAgICBuZXcgSW1tdXRhYmxlT2JqZWN0IHVpZCwgY29udGVudCwgcHJldiwgbmV4dCwgb3JpZ2luXG5cbiAgI1xuICAjIEEgZGVsaW1pdGVyIGlzIHBsYWNlZCBhdCB0aGUgZW5kIGFuZCBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhc3NvY2lhdGl2ZSBsaXN0cy5cbiAgIyBUaGlzIGlzIG5lY2Vzc2FyeSBpbiBvcmRlciB0byBoYXZlIGEgYmVnaW5uaW5nIGFuZCBhbiBlbmQgZXZlbiBpZiB0aGUgY29udGVudFxuICAjIG9mIHRoZSBFbmdpbmUgaXMgZW1wdHkuXG4gICNcbiAgY2xhc3MgRGVsaW1pdGVyIGV4dGVuZHMgT3BlcmF0aW9uXG4gICAgI1xuICAgICMgQHBhcmFtIHtPYmplY3R9IHVpZCBBIHVuaXF1ZSBpZGVudGlmaWVyLiBJZiB1aWQgaXMgdW5kZWZpbmVkLCBhIG5ldyB1aWQgd2lsbCBiZSBjcmVhdGVkLlxuICAgICMgQHBhcmFtIHtPcGVyYXRpb259IHByZXZfY2wgVGhlIHByZWRlY2Vzc29yIG9mIHRoaXMgb3BlcmF0aW9uIGluIHRoZSBjb21wbGV0ZS1saXN0IChjbClcbiAgICAjIEBwYXJhbSB7T3BlcmF0aW9ufSBuZXh0X2NsIFRoZSBzdWNjZXNzb3Igb2YgdGhpcyBvcGVyYXRpb24gaW4gdGhlIGNvbXBsZXRlLWxpc3QgKGNsKVxuICAgICNcbiAgICAjIEBzZWUgSGlzdG9yeUJ1ZmZlci5nZXROZXh0T3BlcmF0aW9uSWRlbnRpZmllclxuICAgICNcbiAgICBjb25zdHJ1Y3RvcjogKHVpZCwgcHJldl9jbCwgbmV4dF9jbCwgb3JpZ2luKS0+XG4gICAgICBAc2F2ZU9wZXJhdGlvbiAncHJldl9jbCcsIHByZXZfY2xcbiAgICAgIEBzYXZlT3BlcmF0aW9uICduZXh0X2NsJywgbmV4dF9jbFxuICAgICAgQHNhdmVPcGVyYXRpb24gJ29yaWdpbicsIHByZXZfY2xcbiAgICAgIHN1cGVyIHVpZFxuXG4gICAgI1xuICAgICMgSWYgaXNEZWxldGVkKCkgaXMgdHJ1ZSB0aGlzIG9wZXJhdGlvbiB3b24ndCBiZSBtYWludGFpbmVkIGluIHRoZSBzbFxuICAgICNcbiAgICBpc0RlbGV0ZWQ6ICgpLT5cbiAgICAgIGZhbHNlXG5cbiAgICAjXG4gICAgIyBAcHJpdmF0ZVxuICAgICNcbiAgICBleGVjdXRlOiAoKS0+XG4gICAgICBpZiBAdW5jaGVja2VkP1snbmV4dF9jbCddP1xuICAgICAgICBzdXBlclxuICAgICAgZWxzZSBpZiBAdW5jaGVja2VkP1sncHJldl9jbCddXG4gICAgICAgIGlmIEB2YWxpZGF0ZVNhdmVkT3BlcmF0aW9ucygpXG4gICAgICAgICAgaWYgQHByZXZfY2wubmV4dF9jbD9cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIlByb2JhYmx5IGR1cGxpY2F0ZWQgb3BlcmF0aW9uc1wiXG4gICAgICAgICAgQHByZXZfY2wubmV4dF9jbCA9IEBcbiAgICAgICAgICBkZWxldGUgQHByZXZfY2wudW5jaGVja2VkLm5leHRfY2xcbiAgICAgICAgICBzdXBlclxuICAgICAgICBlbHNlXG4gICAgICAgICAgZmFsc2VcbiAgICAgIGVsc2UgaWYgQHByZXZfY2w/IGFuZCBub3QgQHByZXZfY2wubmV4dF9jbD9cbiAgICAgICAgZGVsZXRlIEBwcmV2X2NsLnVuY2hlY2tlZC5uZXh0X2NsXG4gICAgICAgIEBwcmV2X2NsLm5leHRfY2wgPSBAXG4gICAgICBlbHNlIGlmIEBwcmV2X2NsPyBvciBAbmV4dF9jbD9cbiAgICAgICAgc3VwZXJcbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiRGVsaW1pdGVyIGlzIHVuc3VmZmljaWVudCBkZWZpbmVkIVwiXG5cbiAgICAjXG4gICAgIyBAcHJpdmF0ZVxuICAgICNcbiAgICBfZW5jb2RlOiAoKS0+XG4gICAgICB7XG4gICAgICAgICd0eXBlJyA6IFwiRGVsaW1pdGVyXCJcbiAgICAgICAgJ3VpZCcgOiBAZ2V0VWlkKClcbiAgICAgICAgJ3ByZXYnIDogQHByZXZfY2w/LmdldFVpZCgpXG4gICAgICAgICduZXh0JyA6IEBuZXh0X2NsPy5nZXRVaWQoKVxuICAgICAgfVxuXG4gIHBhcnNlclsnRGVsaW1pdGVyJ10gPSAoanNvbiktPlxuICAgIHtcbiAgICAndWlkJyA6IHVpZFxuICAgICdwcmV2JyA6IHByZXZcbiAgICAnbmV4dCcgOiBuZXh0XG4gICAgfSA9IGpzb25cbiAgICBuZXcgRGVsaW1pdGVyIHVpZCwgcHJldiwgbmV4dFxuXG4gICMgVGhpcyBpcyB3aGF0IHRoaXMgbW9kdWxlIGV4cG9ydHMgYWZ0ZXIgaW5pdGlhbGl6aW5nIGl0IHdpdGggdGhlIEhpc3RvcnlCdWZmZXJcbiAge1xuICAgICd0eXBlcycgOlxuICAgICAgJ0RlbGV0ZScgOiBEZWxldGVcbiAgICAgICdJbnNlcnQnIDogSW5zZXJ0XG4gICAgICAnRGVsaW1pdGVyJzogRGVsaW1pdGVyXG4gICAgICAnT3BlcmF0aW9uJzogT3BlcmF0aW9uXG4gICAgICAnSW1tdXRhYmxlT2JqZWN0JyA6IEltbXV0YWJsZU9iamVjdFxuICAgICdwYXJzZXInIDogcGFyc2VyXG4gICAgJ2V4ZWN1dGlvbl9saXN0ZW5lcicgOiBleGVjdXRpb25fbGlzdGVuZXJcbiAgfVxuXG5cblxuXG4iLCJiYXNpY190eXBlc191bmluaXRpYWxpemVkID0gcmVxdWlyZSBcIi4vQmFzaWNUeXBlc1wiXG5cbm1vZHVsZS5leHBvcnRzID0gKEhCKS0+XG4gIGJhc2ljX3R5cGVzID0gYmFzaWNfdHlwZXNfdW5pbml0aWFsaXplZCBIQlxuICB0eXBlcyA9IGJhc2ljX3R5cGVzLnR5cGVzXG4gIHBhcnNlciA9IGJhc2ljX3R5cGVzLnBhcnNlclxuXG4gICNcbiAgIyBNYW5hZ2VzIG1hcCBsaWtlIG9iamVjdHMuIEUuZy4gSnNvbi1UeXBlIGFuZCBYTUwgYXR0cmlidXRlcy5cbiAgI1xuICBjbGFzcyBNYXBNYW5hZ2VyIGV4dGVuZHMgdHlwZXMuT3BlcmF0aW9uXG5cbiAgICAjXG4gICAgIyBAcGFyYW0ge09iamVjdH0gdWlkIEEgdW5pcXVlIGlkZW50aWZpZXIuIElmIHVpZCBpcyB1bmRlZmluZWQsIGEgbmV3IHVpZCB3aWxsIGJlIGNyZWF0ZWQuXG4gICAgI1xuICAgIGNvbnN0cnVjdG9yOiAodWlkKS0+XG4gICAgICBAbWFwID0ge31cbiAgICAgIHN1cGVyIHVpZFxuXG4gICAgI1xuICAgICMgQHNlZSBKc29uVHlwZXMudmFsXG4gICAgI1xuICAgIHZhbDogKG5hbWUsIGNvbnRlbnQpLT5cbiAgICAgIGlmIGNvbnRlbnQ/XG4gICAgICAgIGlmIG5vdCBAbWFwW25hbWVdP1xuICAgICAgICAgIEhCLmFkZE9wZXJhdGlvbihuZXcgQWRkTmFtZSB1bmRlZmluZWQsIEAsIG5hbWUpLmV4ZWN1dGUoKVxuICAgICAgICBAbWFwW25hbWVdLnJlcGxhY2UgY29udGVudFxuICAgICAgICBAXG4gICAgICBlbHNlIGlmIG5hbWU/XG4gICAgICAgIG9iaiA9IEBtYXBbbmFtZV0/LnZhbCgpXG4gICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIHR5cGVzLkltbXV0YWJsZU9iamVjdFxuICAgICAgICAgIG9iai52YWwoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgb2JqXG4gICAgICBlbHNlXG4gICAgICAgIHJlc3VsdCA9IHt9XG4gICAgICAgIGZvciBuYW1lLG8gb2YgQG1hcFxuICAgICAgICAgIG9iaiA9IG8udmFsKClcbiAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiB0eXBlcy5JbW11dGFibGVPYmplY3Qgb3Igb2JqIGluc3RhbmNlb2YgTWFwTWFuYWdlclxuICAgICAgICAgICAgb2JqID0gb2JqLnZhbCgpXG4gICAgICAgICAgcmVzdWx0W25hbWVdID0gb2JqXG4gICAgICAgIHJlc3VsdFxuXG4gICNcbiAgIyBXaGVuIGEgbmV3IHByb3BlcnR5IGluIGEgbWFwIG1hbmFnZXIgaXMgY3JlYXRlZCwgdGhlbiB0aGUgdWlkcyBvZiB0aGUgaW5zZXJ0ZWQgT3BlcmF0aW9uc1xuICAjIG11c3QgYmUgdW5pcXVlICh0aGluayBhYm91dCBjb25jdXJyZW50IG9wZXJhdGlvbnMpLiBUaGVyZWZvcmUgb25seSBhbiBBZGROYW1lIG9wZXJhdGlvbiBpcyBhbGxvd2VkIHRvXG4gICMgYWRkIGEgcHJvcGVydHkgaW4gYSBNYXBNYW5hZ2VyLiBJZiB0d28gQWRkTmFtZSBvcGVyYXRpb25zIG9uIHRoZSBzYW1lIE1hcE1hbmFnZXIgbmFtZSBoYXBwZW4gY29uY3VycmVudGx5XG4gICMgb25seSBvbmUgd2lsbCBBZGROYW1lIG9wZXJhdGlvbiB3aWxsIGJlIGV4ZWN1dGVkLlxuICAjXG4gIGNsYXNzIEFkZE5hbWUgZXh0ZW5kcyB0eXBlcy5PcGVyYXRpb25cblxuICAgICNcbiAgICAjIEBwYXJhbSB7T2JqZWN0fSB1aWQgQSB1bmlxdWUgaWRlbnRpZmllci4gSWYgdWlkIGlzIHVuZGVmaW5lZCwgYSBuZXcgdWlkIHdpbGwgYmUgY3JlYXRlZC5cbiAgICAjIEBwYXJhbSB7T2JqZWN0fSBtYXBfbWFuYWdlciBVaWQgb3IgcmVmZXJlbmNlIHRvIHRoZSBNYXBNYW5hZ2VyLlxuICAgICMgQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgcHJvcGVydHkgdGhhdCB3aWxsIGJlIGFkZGVkLlxuICAgICNcbiAgICBjb25zdHJ1Y3RvcjogKHVpZCwgbWFwX21hbmFnZXIsIEBuYW1lKS0+XG4gICAgICBAc2F2ZU9wZXJhdGlvbiAnbWFwX21hbmFnZXInLCBtYXBfbWFuYWdlclxuICAgICAgc3VwZXIgdWlkXG5cbiAgICAjXG4gICAgIyBJZiBtYXBfbWFuYWdlciBkb2Vzbid0IGhhdmUgdGhlIHByb3BlcnR5IG5hbWUsIHRoZW4gYWRkIGl0LlxuICAgICMgVGhlIFJlcGxhY2VNYW5hZ2VyIHRoYXQgaXMgYmVpbmcgd3JpdHRlbiBvbiB0aGUgcHJvcGVydHkgaXMgdW5pcXVlXG4gICAgIyBpbiBzdWNoIGEgd2F5IHRoYXQgaWYgQWRkTmFtZSBpcyBleGVjdXRlZCAoZnJvbSBhbm90aGVyIHBlZXIpIGl0IHdpbGxcbiAgICAjIGFsd2F5cyBoYXZlIHRoZSBzYW1lIHJlc3VsdCAoUmVwbGFjZU1hbmFnZXIsIGFuZCBpdHMgYmVnaW5uaW5nIGFuZCBlbmQgYXJlIHRoZSBzYW1lKVxuICAgICNcbiAgICBleGVjdXRlOiAoKS0+XG4gICAgICBpZiBub3QgQHZhbGlkYXRlU2F2ZWRPcGVyYXRpb25zKClcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICBlbHNlXG4gICAgICAgIHVpZF9yID0gQG1hcF9tYW5hZ2VyLmdldFVpZCgpXG4gICAgICAgIHVpZF9yLm9wX251bWJlciA9IFwiXyN7dWlkX3Iub3BfbnVtYmVyfV9STV8je0BuYW1lfVwiXG4gICAgICAgIGlmIG5vdCBIQi5nZXRPcGVyYXRpb24odWlkX3IpP1xuICAgICAgICAgIHVpZF9iZWcgPSBAbWFwX21hbmFnZXIuZ2V0VWlkKClcbiAgICAgICAgICB1aWRfYmVnLm9wX251bWJlciA9IFwiXyN7dWlkX2JlZy5vcF9udW1iZXJ9X1JNXyN7QG5hbWV9X2JlZ2lubmluZ1wiXG4gICAgICAgICAgdWlkX2VuZCA9IEBtYXBfbWFuYWdlci5nZXRVaWQoKVxuICAgICAgICAgIHVpZF9lbmQub3BfbnVtYmVyID0gXCJfI3t1aWRfZW5kLm9wX251bWJlcn1fUk1fI3tAbmFtZX1fZW5kXCJcbiAgICAgICAgICBiZWcgPSBIQi5hZGRPcGVyYXRpb24obmV3IHR5cGVzLkRlbGltaXRlciB1aWRfYmVnLCB1bmRlZmluZWQsIHVpZF9lbmQpLmV4ZWN1dGUoKVxuICAgICAgICAgIGVuZCA9IEhCLmFkZE9wZXJhdGlvbihuZXcgdHlwZXMuRGVsaW1pdGVyIHVpZF9lbmQsIGJlZywgdW5kZWZpbmVkKS5leGVjdXRlKClcbiAgICAgICAgICBAbWFwX21hbmFnZXIubWFwW0BuYW1lXSA9IEhCLmFkZE9wZXJhdGlvbihuZXcgUmVwbGFjZU1hbmFnZXIgdW5kZWZpbmVkLCB1aWRfciwgYmVnLCBlbmQpXG4gICAgICAgICAgQG1hcF9tYW5hZ2VyLm1hcFtAbmFtZV0uc2V0UGFyZW50IEBtYXBfbWFuYWdlciwgQG5hbWVcbiAgICAgICAgICBAbWFwX21hbmFnZXIubWFwW0BuYW1lXS5leGVjdXRlKClcbiAgICAgICAgc3VwZXJcblxuICAgICNcbiAgICAjIEVuY29kZSB0aGlzIG9wZXJhdGlvbiBpbiBzdWNoIGEgd2F5IHRoYXQgaXQgY2FuIGJlIHBhcnNlZCBieSByZW1vdGUgcGVlcnMuXG4gICAgI1xuICAgIF9lbmNvZGU6ICgpLT5cbiAgICAgIHtcbiAgICAgICAgJ3R5cGUnIDogXCJBZGROYW1lXCJcbiAgICAgICAgJ3VpZCcgOiBAZ2V0VWlkKClcbiAgICAgICAgJ21hcF9tYW5hZ2VyJyA6IEBtYXBfbWFuYWdlci5nZXRVaWQoKVxuICAgICAgICAnbmFtZScgOiBAbmFtZVxuICAgICAgfVxuXG4gIHBhcnNlclsnQWRkTmFtZSddID0gKGpzb24pLT5cbiAgICB7XG4gICAgICAnbWFwX21hbmFnZXInIDogbWFwX21hbmFnZXJcbiAgICAgICd1aWQnIDogdWlkXG4gICAgICAnbmFtZScgOiBuYW1lXG4gICAgfSA9IGpzb25cbiAgICBuZXcgQWRkTmFtZSB1aWQsIG1hcF9tYW5hZ2VyLCBuYW1lXG5cbiAgI1xuICAjIE1hbmFnZXMgYSBsaXN0IG9mIEluc2VydC10eXBlIG9wZXJhdGlvbnMuXG4gICNcbiAgY2xhc3MgTGlzdE1hbmFnZXIgZXh0ZW5kcyB0eXBlcy5JbnNlcnRcblxuICAgICNcbiAgICAjIEEgTGlzdE1hbmFnZXIgbWFpbnRhaW5zIGEgbm9uLWVtcHR5IGxpc3QgdGhhdCBoYXMgYSBiZWdpbm5pbmcgYW5kIGFuIGVuZCAoYm90aCBEZWxpbWl0ZXJzISlcbiAgICAjIEBwYXJhbSB7T2JqZWN0fSB1aWQgQSB1bmlxdWUgaWRlbnRpZmllci4gSWYgdWlkIGlzIHVuZGVmaW5lZCwgYSBuZXcgdWlkIHdpbGwgYmUgY3JlYXRlZC5cbiAgICAjIEBwYXJhbSB7RGVsaW1pdGVyfSBiZWdpbm5pbmcgUmVmZXJlbmNlIG9yIE9iamVjdC5cbiAgICAjIEBwYXJhbSB7RGVsaW1pdGVyfSBlbmQgUmVmZXJlbmNlIG9yIE9iamVjdC5cbiAgICBjb25zdHJ1Y3RvcjogKHVpZCwgYmVnaW5uaW5nLCBlbmQsIHByZXYsIG5leHQsIG9yaWdpbiktPlxuICAgICAgaWYgYmVnaW5uaW5nPyBhbmQgZW5kP1xuICAgICAgICBAc2F2ZU9wZXJhdGlvbiAnYmVnaW5uaW5nJywgYmVnaW5uaW5nXG4gICAgICAgIEBzYXZlT3BlcmF0aW9uICdlbmQnLCBlbmRcbiAgICAgIGVsc2VcbiAgICAgICAgQGJlZ2lubmluZyA9IEhCLmFkZE9wZXJhdGlvbiBuZXcgdHlwZXMuRGVsaW1pdGVyIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWRcbiAgICAgICAgQGVuZCA9ICAgICAgIEhCLmFkZE9wZXJhdGlvbiBuZXcgdHlwZXMuRGVsaW1pdGVyIHVuZGVmaW5lZCwgQGJlZ2lubmluZywgdW5kZWZpbmVkXG4gICAgICAgIEBiZWdpbm5pbmcubmV4dF9jbCA9IEBlbmRcbiAgICAgICAgQGJlZ2lubmluZy5leGVjdXRlKClcbiAgICAgICAgQGVuZC5leGVjdXRlKClcbiAgICAgIHN1cGVyIHVpZCwgcHJldiwgbmV4dCwgb3JpZ2luXG5cbiAgICBleGVjdXRlOiAoKS0+XG4gICAgICBpZiBAdmFsaWRhdGVTYXZlZE9wZXJhdGlvbnMoKVxuICAgICAgICBAYmVnaW5uaW5nLnNldFBhcmVudCBAXG4gICAgICAgIEBlbmQuc2V0UGFyZW50IEBcbiAgICAgICAgc3VwZXJcbiAgICAgIGVsc2VcbiAgICAgICAgZmFsc2VcblxuICAgICMgR2V0IHRoZSBlbGVtZW50IHByZXZpb3VzIHRvIHRoZSBkZWxlbWl0ZXIgYXQgdGhlIGVuZFxuICAgIGdldExhc3RPcGVyYXRpb246ICgpLT5cbiAgICAgIEBlbmQucHJldl9jbFxuXG4gICAgIyBzaW1pbGFyIHRvIHRoZSBhYm92ZVxuICAgIGdldEZpcnN0T3BlcmF0aW9uOiAoKS0+XG4gICAgICBAYmVnaW5uaW5nLm5leHRfY2xcblxuICAgICMgVHJhbnNmb3JtcyB0aGUgdGhlIGxpc3QgdG8gYW4gYXJyYXlcbiAgICAjIERvZXNuJ3QgcmV0dXJuIGxlZnQtcmlnaHQgZGVsaW1pdGVyLlxuICAgIHRvQXJyYXk6ICgpLT5cbiAgICAgIG8gPSBAYmVnaW5uaW5nLm5leHRfY2xcbiAgICAgIHJlc3VsdCA9IFtdXG4gICAgICB3aGlsZSBvIGlzbnQgQGVuZFxuICAgICAgICByZXN1bHQucHVzaCBvXG4gICAgICAgIG8gPSBvLm5leHRfY2xcbiAgICAgIHJlc3VsdFxuXG4gICAgI1xuICAgICMgUmV0cmlldmVzIHRoZSB4LXRoIG5vdCBkZWxldGVkIGVsZW1lbnQuXG4gICAgI1xuICAgIGdldE9wZXJhdGlvbkJ5UG9zaXRpb246IChwb3NpdGlvbiktPlxuICAgICAgbyA9IEBiZWdpbm5pbmcubmV4dF9jbFxuICAgICAgaWYgKHBvc2l0aW9uID4gMCBvciBvLmlzRGVsZXRlZCgpKSBhbmQgbm90IChvIGluc3RhbmNlb2YgdHlwZXMuRGVsaW1pdGVyKVxuICAgICAgICB3aGlsZSBvLmlzRGVsZXRlZCgpIGFuZCBub3QgKG8gaW5zdGFuY2VvZiB0eXBlcy5EZWxpbWl0ZXIpXG4gICAgICAgICAgIyBmaW5kIGZpcnN0IG5vbiBkZWxldGVkIG9wXG4gICAgICAgICAgbyA9IG8ubmV4dF9jbFxuICAgICAgICB3aGlsZSB0cnVlXG4gICAgICAgICAgIyBmaW5kIHRoZSBpLXRoIG9wXG4gICAgICAgICAgaWYgbyBpbnN0YW5jZW9mIHR5cGVzLkRlbGltaXRlclxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBpZiBwb3NpdGlvbiA8PSAwIGFuZCBub3Qgby5pc0RlbGV0ZWQoKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBvID0gby5uZXh0X2NsXG4gICAgICAgICAgaWYgbm90IG8uaXNEZWxldGVkKClcbiAgICAgICAgICAgIHBvc2l0aW9uIC09IDFcbiAgICAgIG9cblxuICAjXG4gICMgQWRkcyBzdXBwb3J0IGZvciByZXBsYWNlLiBUaGUgUmVwbGFjZU1hbmFnZXIgbWFuYWdlcyBSZXBsYWNlYWJsZSBvcGVyYXRpb25zLlxuICAjIEVhY2ggUmVwbGFjZWFibGUgaG9sZHMgYSB2YWx1ZSB0aGF0IGlzIG5vdyByZXBsYWNlYWJsZS5cbiAgI1xuICAjIFRoZSBXb3JkLXR5cGUgaGFzIGltcGxlbWVudGVkIHN1cHBvcnQgZm9yIHJlcGxhY2VcbiAgIyBAc2VlIFdvcmRcbiAgI1xuICBjbGFzcyBSZXBsYWNlTWFuYWdlciBleHRlbmRzIExpc3RNYW5hZ2VyXG4gICAgI1xuICAgICMgQHBhcmFtIHtPcGVyYXRpb259IGluaXRpYWxfY29udGVudCBJbml0aWFsaXplIHRoaXMgd2l0aCBhIFJlcGxhY2VhYmxlIHRoYXQgaG9sZHMgdGhlIGluaXRpYWxfY29udGVudC5cbiAgICAjIEBwYXJhbSB7T2JqZWN0fSB1aWQgQSB1bmlxdWUgaWRlbnRpZmllci4gSWYgdWlkIGlzIHVuZGVmaW5lZCwgYSBuZXcgdWlkIHdpbGwgYmUgY3JlYXRlZC5cbiAgICAjIEBwYXJhbSB7RGVsaW1pdGVyfSBiZWdpbm5pbmcgUmVmZXJlbmNlIG9yIE9iamVjdC5cbiAgICAjIEBwYXJhbSB7RGVsaW1pdGVyfSBlbmQgUmVmZXJlbmNlIG9yIE9iamVjdC5cbiAgICBjb25zdHJ1Y3RvcjogKGluaXRpYWxfY29udGVudCwgdWlkLCBiZWdpbm5pbmcsIGVuZCwgcHJldiwgbmV4dCwgb3JpZ2luKS0+XG4gICAgICBzdXBlciB1aWQsIGJlZ2lubmluZywgZW5kLCBwcmV2LCBuZXh0LCBvcmlnaW5cbiAgICAgIGlmIGluaXRpYWxfY29udGVudD9cbiAgICAgICAgQHJlcGxhY2UgaW5pdGlhbF9jb250ZW50XG5cbiAgICAjXG4gICAgIyBSZXBsYWNlIHRoZSBleGlzdGluZyB3b3JkIHdpdGggYSBuZXcgd29yZC5cbiAgICAjXG4gICAgIyBAcGFyYW0gY29udGVudCB7T3BlcmF0aW9ufSBUaGUgbmV3IHZhbHVlIG9mIHRoaXMgUmVwbGFjZU1hbmFnZXIuXG4gICAgIyBAcGFyYW0gcmVwbGFjZWFibGVfdWlkIHtVSUR9IE9wdGlvbmFsOiBVbmlxdWUgaWQgb2YgdGhlIFJlcGxhY2VhYmxlIHRoYXQgaXMgY3JlYXRlZFxuICAgICNcbiAgICByZXBsYWNlOiAoY29udGVudCwgcmVwbGFjZWFibGVfdWlkKS0+XG4gICAgICBvID0gQGdldExhc3RPcGVyYXRpb24oKVxuICAgICAgb3AgPSBuZXcgUmVwbGFjZWFibGUgY29udGVudCwgQCwgcmVwbGFjZWFibGVfdWlkLCBvLCBvLm5leHRfY2xcbiAgICAgIEhCLmFkZE9wZXJhdGlvbihvcCkuZXhlY3V0ZSgpXG5cbiAgICAjXG4gICAgIyBBZGQgY2hhbmdlIGxpc3RlbmVycyBmb3IgcGFyZW50LlxuICAgICNcbiAgICBzZXRQYXJlbnQ6IChwYXJlbnQsIHByb3BlcnR5X25hbWUpLT5cbiAgICAgIEBvbiAnaW5zZXJ0JywgKGV2ZW50LCBvcCk9PlxuICAgICAgICBpZiBvcC5uZXh0X2NsIGluc3RhbmNlb2YgdHlwZXMuRGVsaW1pdGVyXG4gICAgICAgICAgQHBhcmVudC5jYWxsRXZlbnQgJ2NoYW5nZScsIHByb3BlcnR5X25hbWVcbiAgICAgIEBvbiAnY2hhbmdlJywgKGV2ZW50KT0+XG4gICAgICAgIEBwYXJlbnQuY2FsbEV2ZW50ICdjaGFuZ2UnLCBwcm9wZXJ0eV9uYW1lXG4gICAgICAjIENhbGwgdGhpcywgd2hlbiB0aGUgZmlyc3QgZWxlbWVudCBpcyBpbnNlcnRlZC4gVGhlbiBkZWxldGUgdGhlIGxpc3RlbmVyLlxuICAgICAgYWRkUHJvcGVydHlMaXN0ZW5lciA9IChldmVudCwgb3ApPT5cbiAgICAgICAgaWYgb3AubmV4dF9jbCBpbnN0YW5jZW9mIHR5cGVzLkRlbGltaXRlciBhbmQgb3AucHJldl9jbCBpbnN0YW5jZW9mIHR5cGVzLkRlbGltaXRlclxuICAgICAgICAgIEBwYXJlbnQuY2FsbEV2ZW50ICdhZGRQcm9wZXJ0eScsIHByb3BlcnR5X25hbWVcbiAgICAgICAgQGRlbGV0ZUxpc3RlbmVyICdhZGRQcm9wZXJ0eScsIGFkZFByb3BlcnR5TGlzdGVuZXJcbiAgICAgIEBvbiAnaW5zZXJ0JywgYWRkUHJvcGVydHlMaXN0ZW5lclxuICAgICAgc3VwZXIgcGFyZW50XG4gICAgI1xuICAgICMgR2V0IHRoZSB2YWx1ZSBvZiB0aGlzIFdvcmRcbiAgICAjIEByZXR1cm4ge1N0cmluZ31cbiAgICAjXG4gICAgdmFsOiAoKS0+XG4gICAgICBvID0gQGdldExhc3RPcGVyYXRpb24oKVxuICAgICAgI2lmIG8gaW5zdGFuY2VvZiB0eXBlcy5EZWxpbWl0ZXJcbiAgICAgICAgIyB0aHJvdyBuZXcgRXJyb3IgXCJSZXBsYWNlIE1hbmFnZXIgZG9lc24ndCBjb250YWluIGFueXRoaW5nLlwiXG4gICAgICBvLnZhbD8oKSAjID8gLSBmb3IgdGhlIGNhc2UgdGhhdCAoY3VycmVudGx5KSB0aGUgUk0gZG9lcyBub3QgY29udGFpbiBhbnl0aGluZyAodGhlbiBvIGlzIGEgRGVsaW1pdGVyKVxuXG4gICAgI1xuICAgICMgRW5jb2RlIHRoaXMgb3BlcmF0aW9uIGluIHN1Y2ggYSB3YXkgdGhhdCBpdCBjYW4gYmUgcGFyc2VkIGJ5IHJlbW90ZSBwZWVycy5cbiAgICAjXG4gICAgX2VuY29kZTogKCktPlxuICAgICAganNvbiA9XG4gICAgICAgIHtcbiAgICAgICAgICAndHlwZSc6IFwiUmVwbGFjZU1hbmFnZXJcIlxuICAgICAgICAgICd1aWQnIDogQGdldFVpZCgpXG4gICAgICAgICAgJ2JlZ2lubmluZycgOiBAYmVnaW5uaW5nLmdldFVpZCgpXG4gICAgICAgICAgJ2VuZCcgOiBAZW5kLmdldFVpZCgpXG4gICAgICAgIH1cbiAgICAgIGlmIEBwcmV2X2NsPyBhbmQgQG5leHRfY2w/XG4gICAgICAgIGpzb25bJ3ByZXYnXSA9IEBwcmV2X2NsLmdldFVpZCgpXG4gICAgICAgIGpzb25bJ25leHQnXSA9IEBuZXh0X2NsLmdldFVpZCgpXG4gICAgICBpZiBAb3JpZ2luPyBhbmQgQG9yaWdpbiBpc250IEBwcmV2X2NsXG4gICAgICAgIGpzb25bXCJvcmlnaW5cIl0gPSBAb3JpZ2luLmdldFVpZCgpXG4gICAgICBqc29uXG5cbiAgcGFyc2VyW1wiUmVwbGFjZU1hbmFnZXJcIl0gPSAoanNvbiktPlxuICAgIHtcbiAgICAgICdjb250ZW50JyA6IGNvbnRlbnRcbiAgICAgICd1aWQnIDogdWlkXG4gICAgICAncHJldic6IHByZXZcbiAgICAgICduZXh0JzogbmV4dFxuICAgICAgJ29yaWdpbicgOiBvcmlnaW5cbiAgICAgICdiZWdpbm5pbmcnIDogYmVnaW5uaW5nXG4gICAgICAnZW5kJyA6IGVuZFxuICAgIH0gPSBqc29uXG4gICAgbmV3IFJlcGxhY2VNYW5hZ2VyIGNvbnRlbnQsIHVpZCwgYmVnaW5uaW5nLCBlbmQsIHByZXYsIG5leHQsIG9yaWdpblxuXG5cbiAgI1xuICAjIFRoZSBSZXBsYWNlTWFuYWdlciBtYW5hZ2VzIFJlcGxhY2VhYmxlcy5cbiAgIyBAc2VlIFJlcGxhY2VNYW5hZ2VyXG4gICNcbiAgY2xhc3MgUmVwbGFjZWFibGUgZXh0ZW5kcyB0eXBlcy5JbnNlcnRcblxuICAgICNcbiAgICAjIEBwYXJhbSB7T3BlcmF0aW9ufSBjb250ZW50IFRoZSB2YWx1ZSB0aGF0IHRoaXMgUmVwbGFjZWFibGUgaG9sZHMuXG4gICAgIyBAcGFyYW0ge1JlcGxhY2VNYW5hZ2VyfSBwYXJlbnQgVXNlZCB0byByZXBsYWNlIHRoaXMgUmVwbGFjZWFibGUgd2l0aCBhbm90aGVyIG9uZS5cbiAgICAjIEBwYXJhbSB7T2JqZWN0fSB1aWQgQSB1bmlxdWUgaWRlbnRpZmllci4gSWYgdWlkIGlzIHVuZGVmaW5lZCwgYSBuZXcgdWlkIHdpbGwgYmUgY3JlYXRlZC5cbiAgICAjXG4gICAgY29uc3RydWN0b3I6IChjb250ZW50LCBwYXJlbnQsIHVpZCwgcHJldiwgbmV4dCwgb3JpZ2luKS0+XG4gICAgICBAc2F2ZU9wZXJhdGlvbiAnY29udGVudCcsIGNvbnRlbnRcbiAgICAgIEBzYXZlT3BlcmF0aW9uICdwYXJlbnQnLCBwYXJlbnRcbiAgICAgIGlmIG5vdCAocHJldj8gYW5kIG5leHQ/IGFuZCBjb250ZW50PylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiWW91IG11c3QgZGVmaW5lIGNvbnRlbnQsIHByZXYsIGFuZCBuZXh0IGZvciBSZXBsYWNlYWJsZS10eXBlcyFcIlxuICAgICAgc3VwZXIgdWlkLCBwcmV2LCBuZXh0LCBvcmlnaW5cblxuICAgICNcbiAgICAjIFJldHVybiB0aGUgY29udGVudCB0aGF0IHRoaXMgb3BlcmF0aW9uIGhvbGRzLlxuICAgICNcbiAgICB2YWw6ICgpLT5cbiAgICAgIEBjb250ZW50XG5cbiAgICAjXG4gICAgIyBSZXBsYWNlIHRoZSBjb250ZW50IG9mIHRoaXMgcmVwbGFjZWFibGUgd2l0aCBuZXcgY29udGVudC5cbiAgICAjXG4gICAgcmVwbGFjZTogKGNvbnRlbnQpLT5cbiAgICAgIEBwYXJlbnQucmVwbGFjZSBjb250ZW50XG5cbiAgICAjXG4gICAgIyBJZiBwb3NzaWJsZSBzZXQgdGhlIHJlcGxhY2UgbWFuYWdlciBpbiB0aGUgY29udGVudC5cbiAgICAjIEBzZWUgV29yZC5zZXRSZXBsYWNlTWFuYWdlclxuICAgICNcbiAgICBleGVjdXRlOiAoKS0+XG4gICAgICBpZiBub3QgQHZhbGlkYXRlU2F2ZWRPcGVyYXRpb25zKClcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICBlbHNlXG4gICAgICAgIEBjb250ZW50LnNldFJlcGxhY2VNYW5hZ2VyPyhAcGFyZW50KVxuICAgICAgICBzdXBlclxuXG4gICAgI1xuICAgICMgRW5jb2RlIHRoaXMgb3BlcmF0aW9uIGluIHN1Y2ggYSB3YXkgdGhhdCBpdCBjYW4gYmUgcGFyc2VkIGJ5IHJlbW90ZSBwZWVycy5cbiAgICAjXG4gICAgX2VuY29kZTogKCktPlxuICAgICAganNvbiA9XG4gICAgICAgIHtcbiAgICAgICAgICAndHlwZSc6IFwiUmVwbGFjZWFibGVcIlxuICAgICAgICAgICdjb250ZW50JzogQGNvbnRlbnQuZ2V0VWlkKClcbiAgICAgICAgICAnUmVwbGFjZU1hbmFnZXInIDogQHBhcmVudC5nZXRVaWQoKVxuICAgICAgICAgICdwcmV2JzogQHByZXZfY2wuZ2V0VWlkKClcbiAgICAgICAgICAnbmV4dCc6IEBuZXh0X2NsLmdldFVpZCgpXG4gICAgICAgICAgJ3VpZCcgOiBAZ2V0VWlkKClcbiAgICAgICAgfVxuICAgICAgaWYgQG9yaWdpbj8gYW5kIEBvcmlnaW4gaXNudCBAcHJldl9jbFxuICAgICAgICBqc29uW1wib3JpZ2luXCJdID0gQG9yaWdpbi5nZXRVaWQoKVxuICAgICAganNvblxuXG4gIHBhcnNlcltcIlJlcGxhY2VhYmxlXCJdID0gKGpzb24pLT5cbiAgICB7XG4gICAgICAnY29udGVudCcgOiBjb250ZW50XG4gICAgICAnUmVwbGFjZU1hbmFnZXInIDogcGFyZW50XG4gICAgICAndWlkJyA6IHVpZFxuICAgICAgJ3ByZXYnOiBwcmV2XG4gICAgICAnbmV4dCc6IG5leHRcbiAgICAgICdvcmlnaW4nIDogb3JpZ2luXG4gICAgfSA9IGpzb25cbiAgICBuZXcgUmVwbGFjZWFibGUgY29udGVudCwgcGFyZW50LCB1aWQsIHByZXYsIG5leHQsIG9yaWdpblxuXG5cblxuICB0eXBlc1snTGlzdE1hbmFnZXInXSA9IExpc3RNYW5hZ2VyXG4gIHR5cGVzWydNYXBNYW5hZ2VyJ10gPSBNYXBNYW5hZ2VyXG4gIHR5cGVzWydSZXBsYWNlTWFuYWdlciddID0gUmVwbGFjZU1hbmFnZXJcbiAgdHlwZXNbJ1JlcGxhY2VhYmxlJ10gPSBSZXBsYWNlYWJsZVxuXG4gIGJhc2ljX3R5cGVzXG5cblxuXG5cblxuXG4iLCJzdHJ1Y3R1cmVkX3R5cGVzX3VuaW5pdGlhbGl6ZWQgPSByZXF1aXJlIFwiLi9TdHJ1Y3R1cmVkVHlwZXNcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IChIQiktPlxuICBzdHJ1Y3R1cmVkX3R5cGVzID0gc3RydWN0dXJlZF90eXBlc191bmluaXRpYWxpemVkIEhCXG4gIHR5cGVzID0gc3RydWN0dXJlZF90eXBlcy50eXBlc1xuICBwYXJzZXIgPSBzdHJ1Y3R1cmVkX3R5cGVzLnBhcnNlclxuXG4gICNcbiAgIyBBdCB0aGUgbW9tZW50IFRleHREZWxldGUgdHlwZSBlcXVhbHMgdGhlIERlbGV0ZSB0eXBlIGluIEJhc2ljVHlwZXMuXG4gICMgQHNlZSBCYXNpY1R5cGVzLkRlbGV0ZVxuICAjXG4gIGNsYXNzIFRleHREZWxldGUgZXh0ZW5kcyB0eXBlcy5EZWxldGVcbiAgcGFyc2VyW1wiVGV4dERlbGV0ZVwiXSA9IHBhcnNlcltcIkRlbGV0ZVwiXVxuXG4gICNcbiAgIyAgRXh0ZW5kcyB0aGUgYmFzaWMgSW5zZXJ0IHR5cGUgdG8gYW4gb3BlcmF0aW9uIHRoYXQgaG9sZHMgYSB0ZXh0IHZhbHVlXG4gICNcbiAgY2xhc3MgVGV4dEluc2VydCBleHRlbmRzIHR5cGVzLkluc2VydFxuICAgICNcbiAgICAjIEBwYXJhbSB7U3RyaW5nfSBjb250ZW50IFRoZSBjb250ZW50IG9mIHRoaXMgSW5zZXJ0LXR5cGUgT3BlcmF0aW9uLiBVc3VhbGx5IHlvdSByZXN0cmljdCB0aGUgbGVuZ3RoIG9mIGNvbnRlbnQgdG8gc2l6ZSAxXG4gICAgIyBAcGFyYW0ge09iamVjdH0gdWlkIEEgdW5pcXVlIGlkZW50aWZpZXIuIElmIHVpZCBpcyB1bmRlZmluZWQsIGEgbmV3IHVpZCB3aWxsIGJlIGNyZWF0ZWQuXG4gICAgI1xuICAgIGNvbnN0cnVjdG9yOiAoQGNvbnRlbnQsIHVpZCwgcHJldiwgbmV4dCwgb3JpZ2luKS0+XG4gICAgICBpZiBub3QgKHByZXY/IGFuZCBuZXh0PylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiWW91IG11c3QgZGVmaW5lIHByZXYsIGFuZCBuZXh0IGZvciBUZXh0SW5zZXJ0LXR5cGVzIVwiXG4gICAgICBzdXBlciB1aWQsIHByZXYsIG5leHQsIG9yaWdpblxuICAgICNcbiAgICAjIFJldHJpZXZlIHRoZSBlZmZlY3RpdmUgbGVuZ3RoIG9mIHRoZSAkY29udGVudCBvZiB0aGlzIG9wZXJhdGlvbi5cbiAgICAjXG4gICAgZ2V0TGVuZ3RoOiAoKS0+XG4gICAgICBpZiBAaXNEZWxldGVkKClcbiAgICAgICAgMFxuICAgICAgZWxzZVxuICAgICAgICBAY29udGVudC5sZW5ndGhcblxuICAgICNcbiAgICAjIFRoZSByZXN1bHQgd2lsbCBiZSBjb25jYXRlbmF0ZWQgd2l0aCB0aGUgcmVzdWx0cyBmcm9tIHRoZSBvdGhlciBpbnNlcnQgb3BlcmF0aW9uc1xuICAgICMgaW4gb3JkZXIgdG8gcmV0cmlldmUgdGhlIGNvbnRlbnQgb2YgdGhlIGVuZ2luZS5cbiAgICAjIEBzZWUgSGlzdG9yeUJ1ZmZlci50b0V4ZWN1dGVkQXJyYXlcbiAgICAjXG4gICAgdmFsOiAoY3VycmVudF9wb3NpdGlvbiktPlxuICAgICAgaWYgQGlzRGVsZXRlZCgpXG4gICAgICAgIFwiXCJcbiAgICAgIGVsc2VcbiAgICAgICAgQGNvbnRlbnRcblxuICAgICNcbiAgICAjIENvbnZlcnQgYWxsIHJlbGV2YW50IGluZm9ybWF0aW9uIG9mIHRoaXMgb3BlcmF0aW9uIHRvIHRoZSBqc29uLWZvcm1hdC5cbiAgICAjIFRoaXMgcmVzdWx0IGNhbiBiZSBzZW5kIHRvIG90aGVyIGNsaWVudHMuXG4gICAgI1xuICAgIF9lbmNvZGU6ICgpLT5cbiAgICAgIGpzb24gPVxuICAgICAgICB7XG4gICAgICAgICAgJ3R5cGUnOiBcIlRleHRJbnNlcnRcIlxuICAgICAgICAgICdjb250ZW50JzogQGNvbnRlbnRcbiAgICAgICAgICAndWlkJyA6IEBnZXRVaWQoKVxuICAgICAgICAgICdwcmV2JzogQHByZXZfY2wuZ2V0VWlkKClcbiAgICAgICAgICAnbmV4dCc6IEBuZXh0X2NsLmdldFVpZCgpXG4gICAgICAgIH1cbiAgICAgIGlmIEBvcmlnaW4/IGFuZCBAb3JpZ2luIGlzbnQgQHByZXZfY2xcbiAgICAgICAganNvbltcIm9yaWdpblwiXSA9IEBvcmlnaW4uZ2V0VWlkKClcbiAgICAgIGpzb25cblxuICBwYXJzZXJbXCJUZXh0SW5zZXJ0XCJdID0gKGpzb24pLT5cbiAgICB7XG4gICAgICAnY29udGVudCcgOiBjb250ZW50XG4gICAgICAndWlkJyA6IHVpZFxuICAgICAgJ3ByZXYnOiBwcmV2XG4gICAgICAnbmV4dCc6IG5leHRcbiAgICAgICdvcmlnaW4nIDogb3JpZ2luXG4gICAgfSA9IGpzb25cbiAgICBuZXcgVGV4dEluc2VydCBjb250ZW50LCB1aWQsIHByZXYsIG5leHQsIG9yaWdpblxuXG4gICNcbiAgIyBIYW5kbGVzIGEgVGV4dC1saWtlIGRhdGEgc3RydWN0dXJlcyB3aXRoIHN1cHBvcnQgZm9yIGluc2VydFRleHQvZGVsZXRlVGV4dCBhdCBhIHdvcmQtcG9zaXRpb24uXG4gICNcbiAgY2xhc3MgV29yZCBleHRlbmRzIHR5cGVzLkxpc3RNYW5hZ2VyXG5cbiAgICAjXG4gICAgIyBAcGFyYW0ge09iamVjdH0gdWlkIEEgdW5pcXVlIGlkZW50aWZpZXIuIElmIHVpZCBpcyB1bmRlZmluZWQsIGEgbmV3IHVpZCB3aWxsIGJlIGNyZWF0ZWQuXG4gICAgI1xuICAgIGNvbnN0cnVjdG9yOiAodWlkLCBiZWdpbm5pbmcsIGVuZCwgcHJldiwgbmV4dCwgb3JpZ2luKS0+XG4gICAgICBzdXBlciB1aWQsIGJlZ2lubmluZywgZW5kLCBwcmV2LCBuZXh0LCBvcmlnaW5cblxuICAgICNcbiAgICAjIEluc2VydHMgYSBzdHJpbmcgaW50byB0aGUgd29yZFxuICAgICNcbiAgICBpbnNlcnRUZXh0OiAocG9zaXRpb24sIGNvbnRlbnQpLT5cbiAgICAgIG8gPSBAZ2V0T3BlcmF0aW9uQnlQb3NpdGlvbiBwb3NpdGlvblxuICAgICAgZm9yIGMgaW4gY29udGVudFxuICAgICAgICBvcCA9IG5ldyBUZXh0SW5zZXJ0IGMsIHVuZGVmaW5lZCwgby5wcmV2X2NsLCBvXG4gICAgICAgIEhCLmFkZE9wZXJhdGlvbihvcCkuZXhlY3V0ZSgpXG5cbiAgICAjXG4gICAgIyBEZWxldGVzIGEgcGFydCBvZiB0aGUgd29yZC5cbiAgICAjXG4gICAgZGVsZXRlVGV4dDogKHBvc2l0aW9uLCBsZW5ndGgpLT5cbiAgICAgIG8gPSBAZ2V0T3BlcmF0aW9uQnlQb3NpdGlvbiBwb3NpdGlvblxuXG4gICAgICBkZWxldGVfb3BzID0gW11cbiAgICAgIGZvciBpIGluIFswLi4ubGVuZ3RoXVxuICAgICAgICBpZiBvIGluc3RhbmNlb2YgdHlwZXMuRGVsaW1pdGVyXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgZCA9IEhCLmFkZE9wZXJhdGlvbihuZXcgVGV4dERlbGV0ZSB1bmRlZmluZWQsIG8pLmV4ZWN1dGUoKVxuICAgICAgICBvID0gby5uZXh0X2NsXG4gICAgICAgIHdoaWxlIG5vdCAobyBpbnN0YW5jZW9mIHR5cGVzLkRlbGltaXRlcikgYW5kIG8uaXNEZWxldGVkKClcbiAgICAgICAgICBvID0gby5uZXh0X2NsXG4gICAgICAgIGRlbGV0ZV9vcHMucHVzaCBkLl9lbmNvZGUoKVxuICAgICAgZGVsZXRlX29wc1xuXG4gICAgI1xuICAgICMgUmVwbGFjZSB0aGUgY29udGVudCBvZiB0aGlzIHdvcmQgd2l0aCBhbm90aGVyIG9uZS4gQ29uY3VycmVudCByZXBsYWNlbWVudHMgYXJlIG5vdCBtZXJnZWQhXG4gICAgIyBPbmx5IG9uZSBvZiB0aGUgcmVwbGFjZW1lbnRzIHdpbGwgYmUgdXNlZC5cbiAgICAjXG4gICAgIyBDYW4gb25seSBiZSB1c2VkIGlmIHRoZSBSZXBsYWNlTWFuYWdlciB3YXMgc2V0IVxuICAgICMgQHNlZSBXb3JkLnNldFJlcGxhY2VNYW5hZ2VyXG4gICAgI1xuICAgIHJlcGxhY2VUZXh0OiAodGV4dCktPlxuICAgICAgaWYgQHJlcGxhY2VfbWFuYWdlcj9cbiAgICAgICAgd29yZCA9IEhCLmFkZE9wZXJhdGlvbihuZXcgV29yZCB1bmRlZmluZWQpLmV4ZWN1dGUoKVxuICAgICAgICB3b3JkLmluc2VydFRleHQgMCwgdGV4dFxuICAgICAgICBAcmVwbGFjZV9tYW5hZ2VyLnJlcGxhY2Uod29yZClcbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVGhpcyB0eXBlIGlzIGN1cnJlbnRseSBub3QgbWFpbnRhaW5lZCBieSBhIFJlcGxhY2VNYW5hZ2VyIVwiXG5cbiAgICAjXG4gICAgIyBAcmV0dXJucyBbSnNvbl0gQSBKc29uIG9iamVjdC5cbiAgICAjXG4gICAgdmFsOiAoKS0+XG4gICAgICBjID0gZm9yIG8gaW4gQHRvQXJyYXkoKVxuICAgICAgICBpZiBvLnZhbD9cbiAgICAgICAgICBvLnZhbCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBcIlwiXG4gICAgICBjLmpvaW4oJycpXG5cbiAgICAjXG4gICAgIyBJbiBtb3N0IGNhc2VzIHlvdSB3b3VsZCBlbWJlZCBhIFdvcmQgaW4gYSBSZXBsYWNlYWJsZSwgd2ljaCBpcyBoYW5kbGVkIGJ5IHRoZSBSZXBsYWNlTWFuYWdlciBpbiBvcmRlclxuICAgICMgdG8gcHJvdmlkZSByZXBsYWNlIGZ1bmN0aW9uYWxpdHkuXG4gICAgI1xuICAgIHNldFJlcGxhY2VNYW5hZ2VyOiAob3ApLT5cbiAgICAgIEBzYXZlT3BlcmF0aW9uICdyZXBsYWNlX21hbmFnZXInLCBvcFxuICAgICAgQHZhbGlkYXRlU2F2ZWRPcGVyYXRpb25zKClcbiAgICAgIEBvbiBbJ2luc2VydCcsICdkZWxldGUnXSwgKCk9PlxuICAgICAgICBAcmVwbGFjZV9tYW5hZ2VyPy5jYWxsRXZlbnQgJ2NoYW5nZSdcblxuICAgICNcbiAgICAjIEJpbmQgdGhpcyBXb3JkIHRvIGEgdGV4dGZpZWxkLlxuICAgICNcbiAgICBiaW5kOiAodGV4dGZpZWxkKS0+XG4gICAgICB3b3JkID0gQFxuICAgICAgdGV4dGZpZWxkLnZhbHVlID0gQHZhbCgpXG5cbiAgICAgIEBvbiBcImluc2VydFwiLCAoZXZlbnQsIG9wKS0+XG4gICAgICAgIG9fcG9zID0gb3AuZ2V0UG9zaXRpb24oKVxuICAgICAgICBmaXggPSAoY3Vyc29yKS0+XG4gICAgICAgICAgaWYgY3Vyc29yIDw9IG9fcG9zXG4gICAgICAgICAgICBjdXJzb3JcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBjdXJzb3IgKz0gMVxuICAgICAgICAgICAgY3Vyc29yXG4gICAgICAgIGxlZnQgPSBmaXggdGV4dGZpZWxkLnNlbGVjdGlvblN0YXJ0XG4gICAgICAgIHJpZ2h0ID0gZml4IHRleHRmaWVsZC5zZWxlY3Rpb25FbmRcblxuICAgICAgICB0ZXh0ZmllbGQudmFsdWUgPSB3b3JkLnZhbCgpXG4gICAgICAgIHRleHRmaWVsZC5zZXRTZWxlY3Rpb25SYW5nZSBsZWZ0LCByaWdodFxuXG5cbiAgICAgIEBvbiBcImRlbGV0ZVwiLCAoZXZlbnQsIG9wKS0+XG4gICAgICAgIG9fcG9zID0gb3AuZ2V0UG9zaXRpb24oKVxuICAgICAgICBmaXggPSAoY3Vyc29yKS0+XG4gICAgICAgICAgaWYgY3Vyc29yIDwgb19wb3NcbiAgICAgICAgICAgIGN1cnNvclxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGN1cnNvciAtPSAxXG4gICAgICAgICAgICBjdXJzb3JcbiAgICAgICAgbGVmdCA9IGZpeCB0ZXh0ZmllbGQuc2VsZWN0aW9uU3RhcnRcbiAgICAgICAgcmlnaHQgPSBmaXggdGV4dGZpZWxkLnNlbGVjdGlvbkVuZFxuXG4gICAgICAgIHRleHRmaWVsZC52YWx1ZSA9IHdvcmQudmFsKClcbiAgICAgICAgdGV4dGZpZWxkLnNldFNlbGVjdGlvblJhbmdlIGxlZnQsIHJpZ2h0XG5cbiAgICAgICMgY29uc3VtZSBhbGwgdGV4dC1pbnNlcnQgY2hhbmdlcy5cbiAgICAgIHRleHRmaWVsZC5vbmtleXByZXNzID0gKGV2ZW50KS0+XG4gICAgICAgIGNoYXIgPSBudWxsXG4gICAgICAgIGlmIGV2ZW50LmtleT9cbiAgICAgICAgICBpZiBldmVudC5jaGFyQ29kZSBpcyAzMlxuICAgICAgICAgICAgY2hhciA9IFwiIFwiXG4gICAgICAgICAgZWxzZSBpZiBldmVudC5rZXlDb2RlIGlzIDEzXG4gICAgICAgICAgICBjaGFyID0gJ1xcbidcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBjaGFyID0gZXZlbnQua2V5XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBjaGFyID0gU3RyaW5nLmZyb21DaGFyQ29kZSBldmVudC5rZXlDb2RlXG4gICAgICAgIGlmIGNoYXIubGVuZ3RoID4gMFxuICAgICAgICAgIHBvcyA9IE1hdGgubWluIHRleHRmaWVsZC5zZWxlY3Rpb25TdGFydCwgdGV4dGZpZWxkLnNlbGVjdGlvbkVuZFxuICAgICAgICAgIGRpZmYgPSBNYXRoLmFicyh0ZXh0ZmllbGQuc2VsZWN0aW9uRW5kIC0gdGV4dGZpZWxkLnNlbGVjdGlvblN0YXJ0KVxuICAgICAgICAgIHdvcmQuZGVsZXRlVGV4dCAocG9zKSwgZGlmZlxuICAgICAgICAgIHdvcmQuaW5zZXJ0VGV4dCBwb3MsIGNoYXJcbiAgICAgICAgICBuZXdfcG9zID0gcG9zICsgY2hhci5sZW5ndGhcbiAgICAgICAgICB0ZXh0ZmllbGQuc2V0U2VsZWN0aW9uUmFuZ2UgbmV3X3BvcywgbmV3X3Bvc1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuICAgICAgdGV4dGZpZWxkLm9ucGFzdGUgPSAoZXZlbnQpLT5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgdGV4dGZpZWxkLm9uY3V0ID0gKGV2ZW50KS0+XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuICAgICAgI1xuICAgICAgIyBjb25zdW1lIGRlbGV0ZXMuIE5vdGUgdGhhdFxuICAgICAgIyAgIGNocm9tZTogd29uJ3QgY29uc3VtZSBkZWxldGlvbnMgb24ga2V5cHJlc3MgZXZlbnQuXG4gICAgICAjICAga2V5Q29kZSBpcyBkZXByZWNhdGVkLiBCVVQ6IEkgZG9uJ3Qgc2VlIGFub3RoZXIgd2F5LlxuICAgICAgIyAgICAgc2luY2UgZXZlbnQua2V5IGlzIG5vdCBpbXBsZW1lbnRlZCBpbiB0aGUgY3VycmVudCB2ZXJzaW9uIG9mIGNocm9tZS5cbiAgICAgICMgICAgIEV2ZXJ5IGJyb3dzZXIgc3VwcG9ydHMga2V5Q29kZS4gTGV0J3Mgc3RpY2sgd2l0aCBpdCBmb3Igbm93Li5cbiAgICAgICNcbiAgICAgIHRleHRmaWVsZC5vbmtleWRvd24gPSAoZXZlbnQpLT5cbiAgICAgICAgcG9zID0gTWF0aC5taW4gdGV4dGZpZWxkLnNlbGVjdGlvblN0YXJ0LCB0ZXh0ZmllbGQuc2VsZWN0aW9uRW5kXG4gICAgICAgIGRpZmYgPSBNYXRoLmFicyh0ZXh0ZmllbGQuc2VsZWN0aW9uRW5kIC0gdGV4dGZpZWxkLnNlbGVjdGlvblN0YXJ0KVxuICAgICAgICBpZiBldmVudC5rZXlDb2RlPyBhbmQgZXZlbnQua2V5Q29kZSBpcyA4ICMgQmFja3NwYWNlXG4gICAgICAgICAgaWYgZGlmZiA+IDBcbiAgICAgICAgICAgIHdvcmQuZGVsZXRlVGV4dCBwb3MsIGRpZmZcbiAgICAgICAgICAgIHRleHRmaWVsZC5zZXRTZWxlY3Rpb25SYW5nZSBwb3MsIHBvc1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIGV2ZW50LmN0cmxLZXk/IGFuZCBldmVudC5jdHJsS2V5XG4gICAgICAgICAgICAgIHZhbCA9IHRleHRmaWVsZC52YWx1ZVxuICAgICAgICAgICAgICBuZXdfcG9zID0gcG9zXG4gICAgICAgICAgICAgIGRlbF9sZW5ndGggPSAwXG4gICAgICAgICAgICAgIGlmIHBvcyA+IDBcbiAgICAgICAgICAgICAgICBuZXdfcG9zLS1cbiAgICAgICAgICAgICAgICBkZWxfbGVuZ3RoKytcbiAgICAgICAgICAgICAgd2hpbGUgbmV3X3BvcyA+IDAgYW5kIHZhbFtuZXdfcG9zXSBpc250IFwiIFwiIGFuZCB2YWxbbmV3X3Bvc10gaXNudCAnXFxuJ1xuICAgICAgICAgICAgICAgIG5ld19wb3MtLVxuICAgICAgICAgICAgICAgIGRlbF9sZW5ndGgrK1xuICAgICAgICAgICAgICB3b3JkLmRlbGV0ZVRleHQgbmV3X3BvcywgKHBvcy1uZXdfcG9zKVxuICAgICAgICAgICAgICB0ZXh0ZmllbGQuc2V0U2VsZWN0aW9uUmFuZ2UgbmV3X3BvcywgbmV3X3Bvc1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICB3b3JkLmRlbGV0ZVRleHQgKHBvcy0xKSwgMVxuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgZWxzZSBpZiBldmVudC5rZXlDb2RlPyBhbmQgZXZlbnQua2V5Q29kZSBpcyA0NiAjIERlbGV0ZVxuICAgICAgICAgIGlmIGRpZmYgPiAwXG4gICAgICAgICAgICB3b3JkLmRlbGV0ZVRleHQgcG9zLCBkaWZmXG4gICAgICAgICAgICB0ZXh0ZmllbGQuc2V0U2VsZWN0aW9uUmFuZ2UgcG9zLCBwb3NcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB3b3JkLmRlbGV0ZVRleHQgcG9zLCAxXG4gICAgICAgICAgICB0ZXh0ZmllbGQuc2V0U2VsZWN0aW9uUmFuZ2UgcG9zLCBwb3NcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cblxuXG4gICAgI1xuICAgICMgRW5jb2RlIHRoaXMgb3BlcmF0aW9uIGluIHN1Y2ggYSB3YXkgdGhhdCBpdCBjYW4gYmUgcGFyc2VkIGJ5IHJlbW90ZSBwZWVycy5cbiAgICAjXG4gICAgX2VuY29kZTogKCktPlxuICAgICAganNvbiA9IHtcbiAgICAgICAgJ3R5cGUnOiBcIldvcmRcIlxuICAgICAgICAndWlkJyA6IEBnZXRVaWQoKVxuICAgICAgICAnYmVnaW5uaW5nJyA6IEBiZWdpbm5pbmcuZ2V0VWlkKClcbiAgICAgICAgJ2VuZCcgOiBAZW5kLmdldFVpZCgpXG4gICAgICB9XG4gICAgICBpZiBAcHJldl9jbD9cbiAgICAgICAganNvblsncHJldiddID0gQHByZXZfY2wuZ2V0VWlkKClcbiAgICAgIGlmIEBuZXh0X2NsP1xuICAgICAgICBqc29uWyduZXh0J10gPSBAbmV4dF9jbC5nZXRVaWQoKVxuICAgICAgaWYgQG9yaWdpbj8gYW5kIEBvcmlnaW4gaXNudCBAcHJldl9jbFxuICAgICAgICBqc29uW1wib3JpZ2luXCJdID0gQG9yaWdpbi5nZXRVaWQoKVxuICAgICAganNvblxuXG4gIHBhcnNlclsnV29yZCddID0gKGpzb24pLT5cbiAgICB7XG4gICAgICAndWlkJyA6IHVpZFxuICAgICAgJ2JlZ2lubmluZycgOiBiZWdpbm5pbmdcbiAgICAgICdlbmQnIDogZW5kXG4gICAgICAncHJldic6IHByZXZcbiAgICAgICduZXh0JzogbmV4dFxuICAgICAgJ29yaWdpbicgOiBvcmlnaW5cbiAgICB9ID0ganNvblxuICAgIG5ldyBXb3JkIHVpZCwgYmVnaW5uaW5nLCBlbmQsIHByZXYsIG5leHQsIG9yaWdpblxuXG4gIHR5cGVzWydUZXh0SW5zZXJ0J10gPSBUZXh0SW5zZXJ0XG4gIHR5cGVzWydUZXh0RGVsZXRlJ10gPSBUZXh0RGVsZXRlXG4gIHR5cGVzWydXb3JkJ10gPSBXb3JkXG4gIHN0cnVjdHVyZWRfdHlwZXNcblxuXG4iXX0=
