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

    var _global_items_clid = {}, _global_items_name = {};

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
                newItem.add(item.lists[l].list, item.lists[l].attrs);
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
        item.name = name || item.id;
        dL_add_global(item);
        item._lists_ = [];
        item._list_ids_ = {};
        if (!list) return dL_item_proto(item);
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
    // qualifier is an optional function which tests each item in the locator set
    // callback is an optional function that can be used to prevent blocking
    // HOW TO: make both qualifier and callback optional on equal footing?
    dList.find = function (locator, qualifier, callback) {
        if (arguments.length < 3) {
            callback = qualifier;
            qualifier = null;
        }
        if (qualifier && (qualifier === "function")) //do something
            qualifier = qualifier(locator);
        var loc = locator.split("=");
        if (loc[0] == "id")
            return (_global_items_clid[loc[1]] || []);
        else if (loc[0] == "name")
            return (_global_items_name[loc[1]] || []);
        else if (loc[0] == "in")
            return []; // figure this out
        else if (loc[0] == "notin")
            return []; // figure this out
        return [];
    };

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

    dList.isType = function (type) { };

    function dL_attr(name, type, validator) { }

    function dL_default_attr_type(attrName) { }

    function dL_default_attr_validator(type) { }

    function dL_list_proto(list) {
        if (dList.isList(list)) {
            // add list prototype functions
            list.prototype.add = function (item, values) {
                if (!item) return list;
                if (list._list_ids_[item.id]) return list;
                var i = { item: item, attrs: {} }, iid = { i: list._items_.push(i) };
                list._item_ids_[item.id] = iid;
                var vchk = {};
                for (a = 0; a < list.attrs.length; a++) {
                    var attr = list.attrs[a];
                    if (values[attr.name]) {
                        if (vchk[attr.name] = attr.validate(dList.functor(values[attr.name])(item, list)))
                            i.attrs[attr.name] = vchk[attr.name].val;
                    }
                }
                if (list.allowAttrAdd) {

                }
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
            list.prototype.addAttr = function (attr, type, validator) {
                // if only attr was passed in
                if (arguments.length == 1) {
                    // check to see if it's a full attr def
                    if (dList.isAttr(attr)) {
                        list._attr_names[attr.name] = { i: list._attrs_.push(attr) };
                        return list;
                    }
                    else // otherwise assume attr is a name and get the default type for the name
                        type = dL_default_attr_type(attr);
                    //list._attr_names[attr] = { i: list._attrs_.push(dL_default_attr(attr)) };
                }
                // check if type is a valid type using dList.attrs.type functions
                if (!dList.isType(type)) {
                    // it could be the validator was passed in using the type parameter
                    var v = type;
                    type = dL_default_attr_type(attr);
                    validator = validator || v;
                }
                list._attr_names[attr] = { i: list._attrs_.push(dL_attr(attr, type, validator || dL_default_attr_validator(type))) };
                return list;
            };
            list.prototype.iterate = function (dir) {
                // return an object that maintains a location, and has next and previous operators
                // dir can be a dList function or can be a custom anon function acting as a sort on the items of the list
            };
        }
        return list;
    };

    dList.list = function (name, attrs, allowAttrAdd) {
        var list = dList.isItem(name) ? name : dList.item(name);
        list._attrs_ = [];
        list._attr_names = {};
        list.allowAttrAdd = allowAttrAdd;
        list.attr = function (name) {
            var q;
            if (name === "function") {
                // determine if it is a dList._attr_type 
                if (name._attr_type)
                    q = function (a) { return a._attr_type == name._attr_type; };
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
        list._items_ = [];
        list._item_ids_ = {};
        return dL_list_proto(list);
    };
})();
