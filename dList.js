(function () {
    dList = { version: "0.0.1" };

    function dList_this() {
        return this;
    }

    dList.functor = function (val) {
        return typeof val === "function" ? val : function () { return val; };
    };

    var _curclid = 0;

    function dL_newid() { return (++_curclid) + "_"; };

    var _global_items_clid = {}, _global_items_name = {}, _global_lists_clid = {}, _global_lists_name = {}, _global_lists_ = [];

    function dL_item_proto(item) {
        item.prototype.addTo = function (list, values) {
            if (!list) return item;
            if (item._list_ids_[list.id]) return item;
            var l = { list: list, attrs: {} }, lid = { i: item._lists_.push(l) };
            item._list_ids_[list.id] = lid;
            var vchk = {};
            for (a = 0; a < list.attrs.length; a++) {
                var attr = list.attrs[a];
                if (values[attr.name]) {
                    if (vchk[attr.name] = attr.validate(dList.functor(values[attr.name])(item, list)))
                        l.attrs[attr.name] = vchk[attr.name].val;
                }
            }
            if (list.allowAttrAdd) {

            }
            list.add(item, values);
            return item;
        };
        item.prototype.clone = function () {
            var newItem = dList.item(item.name);
            for (var l = 0; l < item.lists.length; l++) {
                newItem.addTo(item.lists[l].list, item.lists[l].attrs);
            }
            return newItem;
        };
        return item;
    }

    function dL_add_global(item) {
        _global_items_clid[item.id] = item;
        if (_global_items_name[item.name])
            _global_items_name[item.name][item.id] = item;
        else
            _global_items_name[item.name] = ({}[item.id] = item);
    }

    dList.item = function (name, list, values) {
        var item = {};
        item.id = dL_newid();
        item.name = name || ("i_" + item.id);
        dL_add_global(item);
        item._lists_ = [];
        item._list_ids_ = {};
        item = dL_item_proto(item);
        if (list) item.addTo(list, values);
        return item;
    };

    function dL_param_inspect(func) {
        if (func !== "function") return [];
        var reg = /\(([\s\S]*?)\)/;
        var params = reg.exec(func);
        if (params)
            return params[1].split(",");
        return [];
    }

    // need to define syntax for locator: id=, name=, in=[lists], notin=[lists]
    // qualifier is an optional function which tests each item in the located set
    // callback is an optional function that can be used to prevent blocking
    // TODO: HOW TO: make both qualifier and callback optional on equal footing?
    dList.find = function (locator, qualifier, callback) {
        if (arguments.length < 3) {
            callback = qualifier;
            qualifier = null;
        }
        // Call this after matching some elements
        if (qualifier && (qualifier === "function"))
            qualifier = qualifier(locator);
        var loc = locator.split("="), ls;
        switch (loc[0]) {
            case "id":
                return ([_global_items_clid[loc[1]]] || []);
            case "name":
                return (_global_items_name[loc[1]] || []);
            case "in":
                if (loc[1][0] === '[' && loc[1][loc[1].length - 1] === ']')
                    loc[1] = loc[1].substr(1, loc[1].length - 2);
                ls = loc[1].split(',');
                return dL_find_in_lists(ls, qualifier);
            case "notin":
                if (loc[1][0] === '[' && loc[1][loc[1].length - 1] === ']')
                    loc[1] = loc[1].substr(1, loc[1].length - 2);
                ls = loc[1].split(',');
                return dL_find_notin_lists(ls, qualifier);
            default:
                throw ("locator '" + loc[0] + "' not supported. Try 'id', 'name', 'in', or 'notin'");
        }
    };

    function dL_find_in_lists(listset, qualifier) {
        var lists = [], t;
        for (var l = 0; l < listset.length; l++) {
            t = _global_lists_name[listset[l]];
            if (t) lists.push(t);
            t = null;
        }
        return dL_findall_in_lists(lists, qualifier);
    }

    function dL_find_notin_lists(listset, qualifier) {
        var lists = [], t;
        for (var l = 0; l < _global_lists_.length; l++) {
            t = _global_lists_[l];
            if (!listset.some(function (n) { return t.name === n; }))
                lists.push(t);
            t = null;
        }
        return dL_findall_in_lists(lists, qualifier);
    }

    function dL_findall_in_lists(lists, qualifier) {
        var all = [];
        if (qualifier) {
            var tl;
            for (var i = 0; i < lists.length; i++) {
                il = lists[i];
                for (var j = 0; j < il._items_.length; j++) {
                    if (qualifier(il._items_[j], il))
                        all.push(il._items_[j]);
                }
            }
        }
        else {
            for (var a = 0; a < lists.length; a++)
                if (all.length)
                    all.splice(all.length - 1, 0, lists[a]._items_);
                else
                    all.splice(0, 0, lists[a]._items_);
        }
        return all;
    }

    dList.isItem = function (item) {
        if ((item.name) && (item.id))
            if (_global_items_clid[item.id])
                return true;
        return false;
    };

    dList.isList = function (item) {
        if ((item._items_) && (item._attrs_))
            return true;
        return false;
    };

    dList.isAttr = function (attr) {
        if ((attr.name) && (attr._attr_type))
            return true;
        return false;
    };

    // Will take a string to name a List or base type OR a List to check if the item is a member of the list
    dList.isType = function (type, item) {
        var isname = (typeof type === "string");
        if (isname) {
            switch (type) {
                case "item": return this.isItem(item);
                case "list": return this.isList(item);
                case "attr": return this.isAttr(item);
            }
        }
        if (!(item._lists_)) return false;
        if (!isname && this.isList(type))
            return item._list_ids_[type.id] !== undefined;
        else if (isname)
            for (var l = 0; l < item._lists_.length; l++)
                if (item._lists_[l].name === type)
                    return true;
        return false;
    };

    function dL_attr(name, type, validator) { }

    function dL_default_attr_type(attrName) { }

    function dL_default_attr_validator(type) { }

    function dL_list_proto(list) {
        if (dList.isList(list)) {
            // add list prototype functions
            list.prototype.attr = function (name) {
                var q;
                // The thought here was that built-in attr types via dList.attrs.type would be functions, but instead
                // they have been implemented as objects returned by function calls to get the type
                // TODO: go back and implement as functions, I think it is somewhat cleaner in the long run
                if (name === "function") {
                    // determine if it is a dList._attr_type 
                    if (name._attr_type)
                        q = function (a) { return a._attr_type === name._attr_type; };
                    // OR an anon function to use to qualify the attr
                    else
                        q = name;
                }
                else
                    q = function (a) { a.name == name; };
                var results = [];
                list._attrs_.forEach(function (a) { if (q(a)) results.push(a); });
                return results;
            };
            // attr can be a string := name of the attr OR an attr definition which can be decorated with additional validator & default values but not modify type
            // type can be a dList.attrs.type definition function or a string from which to retrieve a dList.attrs.type definition
            // validator can only be a function used for additional validation of attribute values beyond the type validation
            // def is default value as a literal or function provided for attributes when a value is not explicitly assigned
            // - attrs w/o default values will not be set when items are added that do not provide a value for the attr
            // Cases
            // args.length == 1 => attr is a dList.attr or a string name
            // args.length == 2 => attr is a dList.attr + validator | def OR attr is a string name + type | validator | def
            // args.length == 3 => attr is a dList.attr + validator & def OR attr is a string name + {2 of}(type | validator | def)
            // args.length == 4 => attr is a string name + type & validator & def OR use the attr.name as attr string name
            list.prototype.addAttr = function (attr, type, validator, def) {
                // if only attr was passed in
                if (arguments.length === 1) {
                    // check to see if it's a full attr definition
                    if (dList.isAttr(attr)) {
                        list._attr_names[attr.name] = { i: list._attrs_.push(attr) };
                        return list;
                    }
                    else // otherwise assume attr is a name and get the default type for the name
                        type = dList_attr_type_from_name(attr);
                    //list._attr_names[attr] = { i: list._attrs_.push(dL_default_attr(attr)) };
                }
                // check if type is a valid type using dList.attrs.type functions
                if (!dList.isType(type)) {
                    // it could be the validator was passed in using the type parameter
                    // OR the type is a string
                    if (typeof type === "string")
                        type = dList.attrs.type(type);
                    else {
                        var v = type;
                        type = dList_attr_type_from_name(attr);
                        validator = validator || v;
                    }
                }
                if (typeof attr === "string")
                    list._attr_names[attr] = { i: list._attrs_.push(dL_attr(attr, type, validator || dL_default_attr_validator(type))) };
                else {
                    list._attr_names[attr.name] = { i: list._attrs_.push(dL_attr(attr, 
                }
                return list;
            };
            // values is a name/value pair dictionary using the attr name for each attr of the list to have an assigned value
            // value can be a literal or a function which gets passed the item itself and the list to which it is being assigned
            list.prototype.add = function (item, values) {
                if (!dList.isItem(item)) return list;
                if (list._list_ids_[item.id]) return list;
                var i = { item: item, attrs: {} }, iid = { i: list._items_.push(i) };
                list._item_ids_[item.id] = iid;
                var vchk = {};
                if (list.allowAttrAdd) {
                    for (var k in values) {
                        if (!(list._attrs_names[k])) {
                            list.addAttr(k, dList_attr_type_from_val(values[k]));
                        }
                    }
                }
                // a list attr is an object with a name & functions for type, set, and validate - validation can take
                // an additional function to validate beyond its single type validation
                list._attrs_.forEach(function (attr) {
                    if (values[attr.name])
                        i.attrs[attr.name] = attr.set(dList.functor(values[attr.name])(item, list));
                    else if (attr.def) // only set a default value if the attr has a default value to set
                        // attr defaulting needs to know how to set it and it'll be based on the list? 
                        //i.attrs[attr.name] = attr.set(list);
                        // OR no value passed = set to default
                        i.attrs[attr.name] = attr.set();
                });
                //for (var a = 0; a < list._attrs_.length; a++) {
                    //var attr = list._attrs_[a];
                    //if (values[attr.name]) {
                        //i.attrs[attr.name] = attr.set(dList.functor(values[attr.name])(item, list));
                        ////vchk[attr.name] = dList.functor(values[attr.name])(item, list);
                        ////if (attr.validate(vchk[attr.name]))
                        ////    i.attrs[attr.name] = vchk[attr.name].val;
                    //}
                    //else {
                        //i.attrs[attr.name] = attr.set();
                    //}
                //}
                item.addTo(list, values);
                return list;
            };
            list.prototype.clone = function (inclItems) {
                var newList = dList.list(list.name);
                if (!inclItems) return newList;
                for (var i = 0; i < list._items_.length; i++) {
                    var litem = list._items_[i];
                    newList.add(litem.item, litem.attrs);
                }
                return newList;
            };
            list.prototype.sort = function (s) {
                list._items_.sort(dList.functor(s));
                return list;
            };
            list.prototype.each = function (cb) {
                list._items_.forEach(dList.functor(cb));
                return list;
            };
            list.prototype.map = function (name, mapper) {
                if (arguments.length < 2) {
                    mapper = name;
                    name = null;
                }
                var l = dList.isList(name) ? name : list.clone(false);
                var items = list._items_.map(dList.functor(mapper));
                // TODO: MAP the values for each item into the attrs for the newly mapped list
                items.forEach(function (i) { l.add(i, v); });
                return l;
            };
            //            list.prototype.iterate = function (dir) {
            // return an object that maintains a location, and has next and previous operators
            // dir can be a dList function or can be a custom anon function acting as a sort on the items of the list
            //            };
        }
        return list;
    };

    function dL_add_global_list(list) {
        _global_lists_clid[list.id] = list;
        if (_global_lists_name[list.name])
            _global_lists_name[list.name][list.id] = list;
        else
            _global_lists_name[list.name] = ({}[list.id] = list);
        list._gi = _global_lists_.push(list) - 1;
    }

    dList.list = function (name, attrs, allowAttrAdd) {
        var list = dList.isItem(name) ? name : dList.item(name);
        list._attrs_ = [];
        list._attr_names = {};
        list.allowAttrAdd = allowAttrAdd;
        list._items_ = [];
        list._item_ids_ = {};
        dL_add_global_list(list);

        return dL_list_proto(list);
    };

    function dList_attr_type_from_val(v) {
    }

    function dList_attr_type_from_name(n) {
    }

    function dList_attr_proto(attr) {
        attr.prototype.validate = function () {
        };
    }

    
    // (attr.name) && (attr._attr_type)
    dList.attr = function (name, type, def) {
        if (arguments.length == 0)
            throw "Creating an Attribute requires at least a name";
        var a = { name: name };
        if (!(type.n))
            type = dList.attrs.type(type, def);
        a._attr_type = type;
        return a;
    };

    // Provides access to the Attribute Typing system used by dList
    dList.attrs = {};
    // TODO: Add qualifier/validator
    dList.attrs.type = function (t, def) {
        if (arguments.length < 2)
            def = t, t = "text";
        switch (t) {
            case "text": return dList.attrs.text(def);
            case "int": return dList.attrs.int(def);
            case "number": return dList.attrs.number(def);
            case "rank": return dList.attrs.rank(def);
            case "percent": return dList.attrs.percent(def);
            case "date": return dList.attrs.date(def);
            case "time": return dList.attrs.time(def);
            case "duration": return dList.attrs.duration(def);
            case "location": return dList.attrs.location(def);
            case "phone": return dList.attrs.phone(def);
            case "email": return dList.attrs.email(def);
            case "file": return dList.attrs.file(def);
            case "url": return dList.attrs.url(def);
            case "image": return dList.attrs.image(def);
            case "video": return dList.attrs.video(def);
            default: return dList.attrs.text(def);
        };
    };

    // types provide: validator, tostring, val holder, 

    dList.attrs.text = function (def) {
        return { n: "text", validate: function (v) { return true; }, set: function (v) { return (v || def) || ""; } };
    };

    dList.attrs.int = function (def) {
        return { n: "int", validate: function (v) { return dList_validate_integer(v); }, set: function (v) { return (+v || def) || 0; } };
    };

    dList.attrs.number = function (def) {
        return { n: "number", validate: function (v) { return dList_validate_numeric(v); }, set: function (v) { return (+v || def) || 0; } };
    };

    function dList_validate_numeric(v, adcheck) {
        if ((undefined === v) || (null === v))
            return false;
        var to = typeof v, vn = +v;
        adcheck = adcheck || function (v) { return true; };
        switch (to) {
            case "number": return adcheck(v);
            case "string": return (vn !== NaN) && (v === vn.toString()) && adcheck(vn);
            default: return false;
        }
    }

    function dList_validate_integer(v, adcheck) {
        adcheck = adcheck || function (v) { return true; };
        return dList_validate_numeric(v, function (i) { return (i === (i | 0)) && adcheck(i); });
    }

    dList.attrs.flag = function (def) {
        return { n: "flag", validate: function (v) { return dList_validate_flag(v); }, set: function (v) { return dList_valuate_flag(v); } };
    };

    function dList_validate_flag(v, adcheck) {
        return dList_valuate_flag(v) >= 0;
    }

    function dList_valuate_flag(v) {
        var isflagged = ["true", "yes", "ok", "check"];
        var notflagged = ["false", "no", ""];
        var f = Boolean(v);
        switch (typeof v) {
            case "boolean": return v ? 1 : 0;
            case "string":
                v = v.toLowerCase();
                return isflagged.some(function (e) { return e === v; }) ? 1 : notflagged.some(function (e) { return e === v; }) ? 0 : -1;
            case "number": return v > 0 ? 1 : 0;
            default: return !f ? 1 : -1;
        }
    }

    dList.attrs.rank = function (def) {
        return { n: "rank", validate: function (v) { return dList_validate_int(v, function (i) { return i >= 0; }); }, set: function (v) { return this.validate(v) ? v : def || 0; } };
    };

    dList.attrs.percent = function (def) {
        return { n: "percent", validate: function (v) { return dList_validate_numeric(v, function (n) { return (n >= 0) && (n <= 1); }); }, set: function (v) { return this.validate(v) ? v : def || 0; } };
    };

    dList.attrs.date = function (def) {
        throw "Not implemented yet.";
    };

    dList.attrs.time = function (def) {
        throw "Not implemented yet.";
    };

    dList.attrs.duration = function (def) {
        throw "Not implemented yet.";
    };

    dList.attrs.location = function (def) {
        throw "Not implemented yet.";
    };

    dList.attrs.phone = function (def) {
        throw "Not implemented yet.";
    };

    dList.attrs.email = function (def) {
        throw "Not implemented yet.";
    };

    dList.attrs.file = function (def) {
        throw "Not implemented yet.";
    };

    dList.attrs.url = function (def) {
        throw "Not implemented yet.";
    };

    dList.attrs.image = function (def) {
        throw "Not implemented yet.";
    };

    dList.attrs.video = function (def) {
        throw "Not implemented yet.";
    };

    // Attribute value is derived from the values of one or more attributes on the same item in this list
    // OR pulled from attribute values of this item from other lists
    // essentially, this is a function that provides the value for the attribute
    dList.attrs.derived = function (attrs) {
        throw "Not implemented yet.";
    };

    // Same as derived, except the value provided by the deriving function can be overridden to a set value
    // If the set value is ever "removed" then it defaults back to the value provided by the deriving function
    dList.attrs.overidable = function (attrs) {
        throw "Not implemented yet.";
    };

    // Value is the same for all items using this attribute in the list
    dList.attrs.fixed = function (t, val) {
        throw "Not implemented yet.";
    };

})();
