var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__8127 = x == null ? null : x;
  if(p[goog.typeOf(x__8127)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__8128__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__8128 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8128__delegate.call(this, array, i, idxs)
    };
    G__8128.cljs$lang$maxFixedArity = 2;
    G__8128.cljs$lang$applyTo = function(arglist__8129) {
      var array = cljs.core.first(arglist__8129);
      var i = cljs.core.first(cljs.core.next(arglist__8129));
      var idxs = cljs.core.rest(cljs.core.next(arglist__8129));
      return G__8128__delegate(array, i, idxs)
    };
    G__8128.cljs$lang$arity$variadic = G__8128__delegate;
    return G__8128
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____8214 = this$;
      if(and__3822__auto____8214) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____8214
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__864__auto____8215 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8216 = cljs.core._invoke[goog.typeOf(x__864__auto____8215)];
        if(or__3824__auto____8216) {
          return or__3824__auto____8216
        }else {
          var or__3824__auto____8217 = cljs.core._invoke["_"];
          if(or__3824__auto____8217) {
            return or__3824__auto____8217
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____8218 = this$;
      if(and__3822__auto____8218) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____8218
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__864__auto____8219 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8220 = cljs.core._invoke[goog.typeOf(x__864__auto____8219)];
        if(or__3824__auto____8220) {
          return or__3824__auto____8220
        }else {
          var or__3824__auto____8221 = cljs.core._invoke["_"];
          if(or__3824__auto____8221) {
            return or__3824__auto____8221
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____8222 = this$;
      if(and__3822__auto____8222) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____8222
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__864__auto____8223 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8224 = cljs.core._invoke[goog.typeOf(x__864__auto____8223)];
        if(or__3824__auto____8224) {
          return or__3824__auto____8224
        }else {
          var or__3824__auto____8225 = cljs.core._invoke["_"];
          if(or__3824__auto____8225) {
            return or__3824__auto____8225
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____8226 = this$;
      if(and__3822__auto____8226) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____8226
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__864__auto____8227 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8228 = cljs.core._invoke[goog.typeOf(x__864__auto____8227)];
        if(or__3824__auto____8228) {
          return or__3824__auto____8228
        }else {
          var or__3824__auto____8229 = cljs.core._invoke["_"];
          if(or__3824__auto____8229) {
            return or__3824__auto____8229
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____8230 = this$;
      if(and__3822__auto____8230) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____8230
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__864__auto____8231 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8232 = cljs.core._invoke[goog.typeOf(x__864__auto____8231)];
        if(or__3824__auto____8232) {
          return or__3824__auto____8232
        }else {
          var or__3824__auto____8233 = cljs.core._invoke["_"];
          if(or__3824__auto____8233) {
            return or__3824__auto____8233
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____8234 = this$;
      if(and__3822__auto____8234) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____8234
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__864__auto____8235 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8236 = cljs.core._invoke[goog.typeOf(x__864__auto____8235)];
        if(or__3824__auto____8236) {
          return or__3824__auto____8236
        }else {
          var or__3824__auto____8237 = cljs.core._invoke["_"];
          if(or__3824__auto____8237) {
            return or__3824__auto____8237
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____8238 = this$;
      if(and__3822__auto____8238) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____8238
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__864__auto____8239 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8240 = cljs.core._invoke[goog.typeOf(x__864__auto____8239)];
        if(or__3824__auto____8240) {
          return or__3824__auto____8240
        }else {
          var or__3824__auto____8241 = cljs.core._invoke["_"];
          if(or__3824__auto____8241) {
            return or__3824__auto____8241
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____8242 = this$;
      if(and__3822__auto____8242) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____8242
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__864__auto____8243 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8244 = cljs.core._invoke[goog.typeOf(x__864__auto____8243)];
        if(or__3824__auto____8244) {
          return or__3824__auto____8244
        }else {
          var or__3824__auto____8245 = cljs.core._invoke["_"];
          if(or__3824__auto____8245) {
            return or__3824__auto____8245
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____8246 = this$;
      if(and__3822__auto____8246) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____8246
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__864__auto____8247 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8248 = cljs.core._invoke[goog.typeOf(x__864__auto____8247)];
        if(or__3824__auto____8248) {
          return or__3824__auto____8248
        }else {
          var or__3824__auto____8249 = cljs.core._invoke["_"];
          if(or__3824__auto____8249) {
            return or__3824__auto____8249
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____8250 = this$;
      if(and__3822__auto____8250) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____8250
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__864__auto____8251 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8252 = cljs.core._invoke[goog.typeOf(x__864__auto____8251)];
        if(or__3824__auto____8252) {
          return or__3824__auto____8252
        }else {
          var or__3824__auto____8253 = cljs.core._invoke["_"];
          if(or__3824__auto____8253) {
            return or__3824__auto____8253
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____8254 = this$;
      if(and__3822__auto____8254) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____8254
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__864__auto____8255 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8256 = cljs.core._invoke[goog.typeOf(x__864__auto____8255)];
        if(or__3824__auto____8256) {
          return or__3824__auto____8256
        }else {
          var or__3824__auto____8257 = cljs.core._invoke["_"];
          if(or__3824__auto____8257) {
            return or__3824__auto____8257
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____8258 = this$;
      if(and__3822__auto____8258) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____8258
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__864__auto____8259 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8260 = cljs.core._invoke[goog.typeOf(x__864__auto____8259)];
        if(or__3824__auto____8260) {
          return or__3824__auto____8260
        }else {
          var or__3824__auto____8261 = cljs.core._invoke["_"];
          if(or__3824__auto____8261) {
            return or__3824__auto____8261
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____8262 = this$;
      if(and__3822__auto____8262) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____8262
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__864__auto____8263 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8264 = cljs.core._invoke[goog.typeOf(x__864__auto____8263)];
        if(or__3824__auto____8264) {
          return or__3824__auto____8264
        }else {
          var or__3824__auto____8265 = cljs.core._invoke["_"];
          if(or__3824__auto____8265) {
            return or__3824__auto____8265
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____8266 = this$;
      if(and__3822__auto____8266) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____8266
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__864__auto____8267 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8268 = cljs.core._invoke[goog.typeOf(x__864__auto____8267)];
        if(or__3824__auto____8268) {
          return or__3824__auto____8268
        }else {
          var or__3824__auto____8269 = cljs.core._invoke["_"];
          if(or__3824__auto____8269) {
            return or__3824__auto____8269
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____8270 = this$;
      if(and__3822__auto____8270) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____8270
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__864__auto____8271 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8272 = cljs.core._invoke[goog.typeOf(x__864__auto____8271)];
        if(or__3824__auto____8272) {
          return or__3824__auto____8272
        }else {
          var or__3824__auto____8273 = cljs.core._invoke["_"];
          if(or__3824__auto____8273) {
            return or__3824__auto____8273
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____8274 = this$;
      if(and__3822__auto____8274) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____8274
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__864__auto____8275 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8276 = cljs.core._invoke[goog.typeOf(x__864__auto____8275)];
        if(or__3824__auto____8276) {
          return or__3824__auto____8276
        }else {
          var or__3824__auto____8277 = cljs.core._invoke["_"];
          if(or__3824__auto____8277) {
            return or__3824__auto____8277
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____8278 = this$;
      if(and__3822__auto____8278) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____8278
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__864__auto____8279 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8280 = cljs.core._invoke[goog.typeOf(x__864__auto____8279)];
        if(or__3824__auto____8280) {
          return or__3824__auto____8280
        }else {
          var or__3824__auto____8281 = cljs.core._invoke["_"];
          if(or__3824__auto____8281) {
            return or__3824__auto____8281
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____8282 = this$;
      if(and__3822__auto____8282) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____8282
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__864__auto____8283 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8284 = cljs.core._invoke[goog.typeOf(x__864__auto____8283)];
        if(or__3824__auto____8284) {
          return or__3824__auto____8284
        }else {
          var or__3824__auto____8285 = cljs.core._invoke["_"];
          if(or__3824__auto____8285) {
            return or__3824__auto____8285
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____8286 = this$;
      if(and__3822__auto____8286) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____8286
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__864__auto____8287 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8288 = cljs.core._invoke[goog.typeOf(x__864__auto____8287)];
        if(or__3824__auto____8288) {
          return or__3824__auto____8288
        }else {
          var or__3824__auto____8289 = cljs.core._invoke["_"];
          if(or__3824__auto____8289) {
            return or__3824__auto____8289
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____8290 = this$;
      if(and__3822__auto____8290) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____8290
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__864__auto____8291 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8292 = cljs.core._invoke[goog.typeOf(x__864__auto____8291)];
        if(or__3824__auto____8292) {
          return or__3824__auto____8292
        }else {
          var or__3824__auto____8293 = cljs.core._invoke["_"];
          if(or__3824__auto____8293) {
            return or__3824__auto____8293
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____8294 = this$;
      if(and__3822__auto____8294) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____8294
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__864__auto____8295 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____8296 = cljs.core._invoke[goog.typeOf(x__864__auto____8295)];
        if(or__3824__auto____8296) {
          return or__3824__auto____8296
        }else {
          var or__3824__auto____8297 = cljs.core._invoke["_"];
          if(or__3824__auto____8297) {
            return or__3824__auto____8297
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____8302 = coll;
    if(and__3822__auto____8302) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____8302
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__864__auto____8303 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8304 = cljs.core._count[goog.typeOf(x__864__auto____8303)];
      if(or__3824__auto____8304) {
        return or__3824__auto____8304
      }else {
        var or__3824__auto____8305 = cljs.core._count["_"];
        if(or__3824__auto____8305) {
          return or__3824__auto____8305
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____8310 = coll;
    if(and__3822__auto____8310) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____8310
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__864__auto____8311 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8312 = cljs.core._empty[goog.typeOf(x__864__auto____8311)];
      if(or__3824__auto____8312) {
        return or__3824__auto____8312
      }else {
        var or__3824__auto____8313 = cljs.core._empty["_"];
        if(or__3824__auto____8313) {
          return or__3824__auto____8313
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____8318 = coll;
    if(and__3822__auto____8318) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____8318
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__864__auto____8319 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8320 = cljs.core._conj[goog.typeOf(x__864__auto____8319)];
      if(or__3824__auto____8320) {
        return or__3824__auto____8320
      }else {
        var or__3824__auto____8321 = cljs.core._conj["_"];
        if(or__3824__auto____8321) {
          return or__3824__auto____8321
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____8330 = coll;
      if(and__3822__auto____8330) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____8330
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__864__auto____8331 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____8332 = cljs.core._nth[goog.typeOf(x__864__auto____8331)];
        if(or__3824__auto____8332) {
          return or__3824__auto____8332
        }else {
          var or__3824__auto____8333 = cljs.core._nth["_"];
          if(or__3824__auto____8333) {
            return or__3824__auto____8333
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____8334 = coll;
      if(and__3822__auto____8334) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____8334
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__864__auto____8335 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____8336 = cljs.core._nth[goog.typeOf(x__864__auto____8335)];
        if(or__3824__auto____8336) {
          return or__3824__auto____8336
        }else {
          var or__3824__auto____8337 = cljs.core._nth["_"];
          if(or__3824__auto____8337) {
            return or__3824__auto____8337
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____8342 = coll;
    if(and__3822__auto____8342) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____8342
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__864__auto____8343 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8344 = cljs.core._first[goog.typeOf(x__864__auto____8343)];
      if(or__3824__auto____8344) {
        return or__3824__auto____8344
      }else {
        var or__3824__auto____8345 = cljs.core._first["_"];
        if(or__3824__auto____8345) {
          return or__3824__auto____8345
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____8350 = coll;
    if(and__3822__auto____8350) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____8350
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__864__auto____8351 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8352 = cljs.core._rest[goog.typeOf(x__864__auto____8351)];
      if(or__3824__auto____8352) {
        return or__3824__auto____8352
      }else {
        var or__3824__auto____8353 = cljs.core._rest["_"];
        if(or__3824__auto____8353) {
          return or__3824__auto____8353
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____8358 = coll;
    if(and__3822__auto____8358) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____8358
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__864__auto____8359 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8360 = cljs.core._next[goog.typeOf(x__864__auto____8359)];
      if(or__3824__auto____8360) {
        return or__3824__auto____8360
      }else {
        var or__3824__auto____8361 = cljs.core._next["_"];
        if(or__3824__auto____8361) {
          return or__3824__auto____8361
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____8370 = o;
      if(and__3822__auto____8370) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____8370
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__864__auto____8371 = o == null ? null : o;
      return function() {
        var or__3824__auto____8372 = cljs.core._lookup[goog.typeOf(x__864__auto____8371)];
        if(or__3824__auto____8372) {
          return or__3824__auto____8372
        }else {
          var or__3824__auto____8373 = cljs.core._lookup["_"];
          if(or__3824__auto____8373) {
            return or__3824__auto____8373
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____8374 = o;
      if(and__3822__auto____8374) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____8374
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__864__auto____8375 = o == null ? null : o;
      return function() {
        var or__3824__auto____8376 = cljs.core._lookup[goog.typeOf(x__864__auto____8375)];
        if(or__3824__auto____8376) {
          return or__3824__auto____8376
        }else {
          var or__3824__auto____8377 = cljs.core._lookup["_"];
          if(or__3824__auto____8377) {
            return or__3824__auto____8377
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____8382 = coll;
    if(and__3822__auto____8382) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____8382
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__864__auto____8383 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8384 = cljs.core._contains_key_QMARK_[goog.typeOf(x__864__auto____8383)];
      if(or__3824__auto____8384) {
        return or__3824__auto____8384
      }else {
        var or__3824__auto____8385 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____8385) {
          return or__3824__auto____8385
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____8390 = coll;
    if(and__3822__auto____8390) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____8390
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__864__auto____8391 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8392 = cljs.core._assoc[goog.typeOf(x__864__auto____8391)];
      if(or__3824__auto____8392) {
        return or__3824__auto____8392
      }else {
        var or__3824__auto____8393 = cljs.core._assoc["_"];
        if(or__3824__auto____8393) {
          return or__3824__auto____8393
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____8398 = coll;
    if(and__3822__auto____8398) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____8398
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__864__auto____8399 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8400 = cljs.core._dissoc[goog.typeOf(x__864__auto____8399)];
      if(or__3824__auto____8400) {
        return or__3824__auto____8400
      }else {
        var or__3824__auto____8401 = cljs.core._dissoc["_"];
        if(or__3824__auto____8401) {
          return or__3824__auto____8401
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____8406 = coll;
    if(and__3822__auto____8406) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____8406
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__864__auto____8407 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8408 = cljs.core._key[goog.typeOf(x__864__auto____8407)];
      if(or__3824__auto____8408) {
        return or__3824__auto____8408
      }else {
        var or__3824__auto____8409 = cljs.core._key["_"];
        if(or__3824__auto____8409) {
          return or__3824__auto____8409
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____8414 = coll;
    if(and__3822__auto____8414) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____8414
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__864__auto____8415 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8416 = cljs.core._val[goog.typeOf(x__864__auto____8415)];
      if(or__3824__auto____8416) {
        return or__3824__auto____8416
      }else {
        var or__3824__auto____8417 = cljs.core._val["_"];
        if(or__3824__auto____8417) {
          return or__3824__auto____8417
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____8422 = coll;
    if(and__3822__auto____8422) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____8422
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__864__auto____8423 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8424 = cljs.core._disjoin[goog.typeOf(x__864__auto____8423)];
      if(or__3824__auto____8424) {
        return or__3824__auto____8424
      }else {
        var or__3824__auto____8425 = cljs.core._disjoin["_"];
        if(or__3824__auto____8425) {
          return or__3824__auto____8425
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____8430 = coll;
    if(and__3822__auto____8430) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____8430
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__864__auto____8431 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8432 = cljs.core._peek[goog.typeOf(x__864__auto____8431)];
      if(or__3824__auto____8432) {
        return or__3824__auto____8432
      }else {
        var or__3824__auto____8433 = cljs.core._peek["_"];
        if(or__3824__auto____8433) {
          return or__3824__auto____8433
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____8438 = coll;
    if(and__3822__auto____8438) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____8438
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__864__auto____8439 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8440 = cljs.core._pop[goog.typeOf(x__864__auto____8439)];
      if(or__3824__auto____8440) {
        return or__3824__auto____8440
      }else {
        var or__3824__auto____8441 = cljs.core._pop["_"];
        if(or__3824__auto____8441) {
          return or__3824__auto____8441
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____8446 = coll;
    if(and__3822__auto____8446) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____8446
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__864__auto____8447 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8448 = cljs.core._assoc_n[goog.typeOf(x__864__auto____8447)];
      if(or__3824__auto____8448) {
        return or__3824__auto____8448
      }else {
        var or__3824__auto____8449 = cljs.core._assoc_n["_"];
        if(or__3824__auto____8449) {
          return or__3824__auto____8449
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____8454 = o;
    if(and__3822__auto____8454) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____8454
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__864__auto____8455 = o == null ? null : o;
    return function() {
      var or__3824__auto____8456 = cljs.core._deref[goog.typeOf(x__864__auto____8455)];
      if(or__3824__auto____8456) {
        return or__3824__auto____8456
      }else {
        var or__3824__auto____8457 = cljs.core._deref["_"];
        if(or__3824__auto____8457) {
          return or__3824__auto____8457
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____8462 = o;
    if(and__3822__auto____8462) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____8462
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__864__auto____8463 = o == null ? null : o;
    return function() {
      var or__3824__auto____8464 = cljs.core._deref_with_timeout[goog.typeOf(x__864__auto____8463)];
      if(or__3824__auto____8464) {
        return or__3824__auto____8464
      }else {
        var or__3824__auto____8465 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____8465) {
          return or__3824__auto____8465
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____8470 = o;
    if(and__3822__auto____8470) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____8470
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__864__auto____8471 = o == null ? null : o;
    return function() {
      var or__3824__auto____8472 = cljs.core._meta[goog.typeOf(x__864__auto____8471)];
      if(or__3824__auto____8472) {
        return or__3824__auto____8472
      }else {
        var or__3824__auto____8473 = cljs.core._meta["_"];
        if(or__3824__auto____8473) {
          return or__3824__auto____8473
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____8478 = o;
    if(and__3822__auto____8478) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____8478
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__864__auto____8479 = o == null ? null : o;
    return function() {
      var or__3824__auto____8480 = cljs.core._with_meta[goog.typeOf(x__864__auto____8479)];
      if(or__3824__auto____8480) {
        return or__3824__auto____8480
      }else {
        var or__3824__auto____8481 = cljs.core._with_meta["_"];
        if(or__3824__auto____8481) {
          return or__3824__auto____8481
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____8490 = coll;
      if(and__3822__auto____8490) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____8490
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__864__auto____8491 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____8492 = cljs.core._reduce[goog.typeOf(x__864__auto____8491)];
        if(or__3824__auto____8492) {
          return or__3824__auto____8492
        }else {
          var or__3824__auto____8493 = cljs.core._reduce["_"];
          if(or__3824__auto____8493) {
            return or__3824__auto____8493
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____8494 = coll;
      if(and__3822__auto____8494) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____8494
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__864__auto____8495 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____8496 = cljs.core._reduce[goog.typeOf(x__864__auto____8495)];
        if(or__3824__auto____8496) {
          return or__3824__auto____8496
        }else {
          var or__3824__auto____8497 = cljs.core._reduce["_"];
          if(or__3824__auto____8497) {
            return or__3824__auto____8497
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____8502 = coll;
    if(and__3822__auto____8502) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____8502
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__864__auto____8503 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8504 = cljs.core._kv_reduce[goog.typeOf(x__864__auto____8503)];
      if(or__3824__auto____8504) {
        return or__3824__auto____8504
      }else {
        var or__3824__auto____8505 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____8505) {
          return or__3824__auto____8505
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____8510 = o;
    if(and__3822__auto____8510) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____8510
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__864__auto____8511 = o == null ? null : o;
    return function() {
      var or__3824__auto____8512 = cljs.core._equiv[goog.typeOf(x__864__auto____8511)];
      if(or__3824__auto____8512) {
        return or__3824__auto____8512
      }else {
        var or__3824__auto____8513 = cljs.core._equiv["_"];
        if(or__3824__auto____8513) {
          return or__3824__auto____8513
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____8518 = o;
    if(and__3822__auto____8518) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____8518
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__864__auto____8519 = o == null ? null : o;
    return function() {
      var or__3824__auto____8520 = cljs.core._hash[goog.typeOf(x__864__auto____8519)];
      if(or__3824__auto____8520) {
        return or__3824__auto____8520
      }else {
        var or__3824__auto____8521 = cljs.core._hash["_"];
        if(or__3824__auto____8521) {
          return or__3824__auto____8521
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____8526 = o;
    if(and__3822__auto____8526) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____8526
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__864__auto____8527 = o == null ? null : o;
    return function() {
      var or__3824__auto____8528 = cljs.core._seq[goog.typeOf(x__864__auto____8527)];
      if(or__3824__auto____8528) {
        return or__3824__auto____8528
      }else {
        var or__3824__auto____8529 = cljs.core._seq["_"];
        if(or__3824__auto____8529) {
          return or__3824__auto____8529
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____8534 = coll;
    if(and__3822__auto____8534) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____8534
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__864__auto____8535 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8536 = cljs.core._rseq[goog.typeOf(x__864__auto____8535)];
      if(or__3824__auto____8536) {
        return or__3824__auto____8536
      }else {
        var or__3824__auto____8537 = cljs.core._rseq["_"];
        if(or__3824__auto____8537) {
          return or__3824__auto____8537
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____8542 = coll;
    if(and__3822__auto____8542) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____8542
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__864__auto____8543 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8544 = cljs.core._sorted_seq[goog.typeOf(x__864__auto____8543)];
      if(or__3824__auto____8544) {
        return or__3824__auto____8544
      }else {
        var or__3824__auto____8545 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____8545) {
          return or__3824__auto____8545
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____8550 = coll;
    if(and__3822__auto____8550) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____8550
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__864__auto____8551 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8552 = cljs.core._sorted_seq_from[goog.typeOf(x__864__auto____8551)];
      if(or__3824__auto____8552) {
        return or__3824__auto____8552
      }else {
        var or__3824__auto____8553 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____8553) {
          return or__3824__auto____8553
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____8558 = coll;
    if(and__3822__auto____8558) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____8558
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__864__auto____8559 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8560 = cljs.core._entry_key[goog.typeOf(x__864__auto____8559)];
      if(or__3824__auto____8560) {
        return or__3824__auto____8560
      }else {
        var or__3824__auto____8561 = cljs.core._entry_key["_"];
        if(or__3824__auto____8561) {
          return or__3824__auto____8561
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____8566 = coll;
    if(and__3822__auto____8566) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____8566
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__864__auto____8567 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8568 = cljs.core._comparator[goog.typeOf(x__864__auto____8567)];
      if(or__3824__auto____8568) {
        return or__3824__auto____8568
      }else {
        var or__3824__auto____8569 = cljs.core._comparator["_"];
        if(or__3824__auto____8569) {
          return or__3824__auto____8569
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____8574 = o;
    if(and__3822__auto____8574) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____8574
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__864__auto____8575 = o == null ? null : o;
    return function() {
      var or__3824__auto____8576 = cljs.core._pr_seq[goog.typeOf(x__864__auto____8575)];
      if(or__3824__auto____8576) {
        return or__3824__auto____8576
      }else {
        var or__3824__auto____8577 = cljs.core._pr_seq["_"];
        if(or__3824__auto____8577) {
          return or__3824__auto____8577
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____8582 = d;
    if(and__3822__auto____8582) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____8582
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__864__auto____8583 = d == null ? null : d;
    return function() {
      var or__3824__auto____8584 = cljs.core._realized_QMARK_[goog.typeOf(x__864__auto____8583)];
      if(or__3824__auto____8584) {
        return or__3824__auto____8584
      }else {
        var or__3824__auto____8585 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____8585) {
          return or__3824__auto____8585
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____8590 = this$;
    if(and__3822__auto____8590) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____8590
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__864__auto____8591 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____8592 = cljs.core._notify_watches[goog.typeOf(x__864__auto____8591)];
      if(or__3824__auto____8592) {
        return or__3824__auto____8592
      }else {
        var or__3824__auto____8593 = cljs.core._notify_watches["_"];
        if(or__3824__auto____8593) {
          return or__3824__auto____8593
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____8598 = this$;
    if(and__3822__auto____8598) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____8598
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__864__auto____8599 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____8600 = cljs.core._add_watch[goog.typeOf(x__864__auto____8599)];
      if(or__3824__auto____8600) {
        return or__3824__auto____8600
      }else {
        var or__3824__auto____8601 = cljs.core._add_watch["_"];
        if(or__3824__auto____8601) {
          return or__3824__auto____8601
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____8606 = this$;
    if(and__3822__auto____8606) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____8606
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__864__auto____8607 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____8608 = cljs.core._remove_watch[goog.typeOf(x__864__auto____8607)];
      if(or__3824__auto____8608) {
        return or__3824__auto____8608
      }else {
        var or__3824__auto____8609 = cljs.core._remove_watch["_"];
        if(or__3824__auto____8609) {
          return or__3824__auto____8609
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____8614 = coll;
    if(and__3822__auto____8614) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____8614
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__864__auto____8615 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8616 = cljs.core._as_transient[goog.typeOf(x__864__auto____8615)];
      if(or__3824__auto____8616) {
        return or__3824__auto____8616
      }else {
        var or__3824__auto____8617 = cljs.core._as_transient["_"];
        if(or__3824__auto____8617) {
          return or__3824__auto____8617
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____8622 = tcoll;
    if(and__3822__auto____8622) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____8622
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__864__auto____8623 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8624 = cljs.core._conj_BANG_[goog.typeOf(x__864__auto____8623)];
      if(or__3824__auto____8624) {
        return or__3824__auto____8624
      }else {
        var or__3824__auto____8625 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____8625) {
          return or__3824__auto____8625
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____8630 = tcoll;
    if(and__3822__auto____8630) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____8630
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__864__auto____8631 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8632 = cljs.core._persistent_BANG_[goog.typeOf(x__864__auto____8631)];
      if(or__3824__auto____8632) {
        return or__3824__auto____8632
      }else {
        var or__3824__auto____8633 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____8633) {
          return or__3824__auto____8633
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____8638 = tcoll;
    if(and__3822__auto____8638) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____8638
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__864__auto____8639 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8640 = cljs.core._assoc_BANG_[goog.typeOf(x__864__auto____8639)];
      if(or__3824__auto____8640) {
        return or__3824__auto____8640
      }else {
        var or__3824__auto____8641 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____8641) {
          return or__3824__auto____8641
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____8646 = tcoll;
    if(and__3822__auto____8646) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____8646
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__864__auto____8647 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8648 = cljs.core._dissoc_BANG_[goog.typeOf(x__864__auto____8647)];
      if(or__3824__auto____8648) {
        return or__3824__auto____8648
      }else {
        var or__3824__auto____8649 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____8649) {
          return or__3824__auto____8649
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____8654 = tcoll;
    if(and__3822__auto____8654) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____8654
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__864__auto____8655 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8656 = cljs.core._assoc_n_BANG_[goog.typeOf(x__864__auto____8655)];
      if(or__3824__auto____8656) {
        return or__3824__auto____8656
      }else {
        var or__3824__auto____8657 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____8657) {
          return or__3824__auto____8657
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____8662 = tcoll;
    if(and__3822__auto____8662) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____8662
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__864__auto____8663 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8664 = cljs.core._pop_BANG_[goog.typeOf(x__864__auto____8663)];
      if(or__3824__auto____8664) {
        return or__3824__auto____8664
      }else {
        var or__3824__auto____8665 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____8665) {
          return or__3824__auto____8665
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____8670 = tcoll;
    if(and__3822__auto____8670) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____8670
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__864__auto____8671 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____8672 = cljs.core._disjoin_BANG_[goog.typeOf(x__864__auto____8671)];
      if(or__3824__auto____8672) {
        return or__3824__auto____8672
      }else {
        var or__3824__auto____8673 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____8673) {
          return or__3824__auto____8673
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____8678 = x;
    if(and__3822__auto____8678) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____8678
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__864__auto____8679 = x == null ? null : x;
    return function() {
      var or__3824__auto____8680 = cljs.core._compare[goog.typeOf(x__864__auto____8679)];
      if(or__3824__auto____8680) {
        return or__3824__auto____8680
      }else {
        var or__3824__auto____8681 = cljs.core._compare["_"];
        if(or__3824__auto____8681) {
          return or__3824__auto____8681
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____8686 = coll;
    if(and__3822__auto____8686) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____8686
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__864__auto____8687 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8688 = cljs.core._drop_first[goog.typeOf(x__864__auto____8687)];
      if(or__3824__auto____8688) {
        return or__3824__auto____8688
      }else {
        var or__3824__auto____8689 = cljs.core._drop_first["_"];
        if(or__3824__auto____8689) {
          return or__3824__auto____8689
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____8694 = coll;
    if(and__3822__auto____8694) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____8694
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__864__auto____8695 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8696 = cljs.core._chunked_first[goog.typeOf(x__864__auto____8695)];
      if(or__3824__auto____8696) {
        return or__3824__auto____8696
      }else {
        var or__3824__auto____8697 = cljs.core._chunked_first["_"];
        if(or__3824__auto____8697) {
          return or__3824__auto____8697
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____8702 = coll;
    if(and__3822__auto____8702) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____8702
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__864__auto____8703 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8704 = cljs.core._chunked_rest[goog.typeOf(x__864__auto____8703)];
      if(or__3824__auto____8704) {
        return or__3824__auto____8704
      }else {
        var or__3824__auto____8705 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____8705) {
          return or__3824__auto____8705
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____8710 = coll;
    if(and__3822__auto____8710) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____8710
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__864__auto____8711 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____8712 = cljs.core._chunked_next[goog.typeOf(x__864__auto____8711)];
      if(or__3824__auto____8712) {
        return or__3824__auto____8712
      }else {
        var or__3824__auto____8713 = cljs.core._chunked_next["_"];
        if(or__3824__auto____8713) {
          return or__3824__auto____8713
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____8715 = x === y;
    if(or__3824__auto____8715) {
      return or__3824__auto____8715
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__8716__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__8717 = y;
            var G__8718 = cljs.core.first.call(null, more);
            var G__8719 = cljs.core.next.call(null, more);
            x = G__8717;
            y = G__8718;
            more = G__8719;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__8716 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8716__delegate.call(this, x, y, more)
    };
    G__8716.cljs$lang$maxFixedArity = 2;
    G__8716.cljs$lang$applyTo = function(arglist__8720) {
      var x = cljs.core.first(arglist__8720);
      var y = cljs.core.first(cljs.core.next(arglist__8720));
      var more = cljs.core.rest(cljs.core.next(arglist__8720));
      return G__8716__delegate(x, y, more)
    };
    G__8716.cljs$lang$arity$variadic = G__8716__delegate;
    return G__8716
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__8721 = null;
  var G__8721__2 = function(o, k) {
    return null
  };
  var G__8721__3 = function(o, k, not_found) {
    return not_found
  };
  G__8721 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8721__2.call(this, o, k);
      case 3:
        return G__8721__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8721
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__8722 = null;
  var G__8722__2 = function(_, f) {
    return f.call(null)
  };
  var G__8722__3 = function(_, f, start) {
    return start
  };
  G__8722 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8722__2.call(this, _, f);
      case 3:
        return G__8722__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8722
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__8723 = null;
  var G__8723__2 = function(_, n) {
    return null
  };
  var G__8723__3 = function(_, n, not_found) {
    return not_found
  };
  G__8723 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8723__2.call(this, _, n);
      case 3:
        return G__8723__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8723
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____8724 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____8724) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____8724
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__8737 = cljs.core._count.call(null, cicoll);
    if(cnt__8737 === 0) {
      return f.call(null)
    }else {
      var val__8738 = cljs.core._nth.call(null, cicoll, 0);
      var n__8739 = 1;
      while(true) {
        if(n__8739 < cnt__8737) {
          var nval__8740 = f.call(null, val__8738, cljs.core._nth.call(null, cicoll, n__8739));
          if(cljs.core.reduced_QMARK_.call(null, nval__8740)) {
            return cljs.core.deref.call(null, nval__8740)
          }else {
            var G__8749 = nval__8740;
            var G__8750 = n__8739 + 1;
            val__8738 = G__8749;
            n__8739 = G__8750;
            continue
          }
        }else {
          return val__8738
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__8741 = cljs.core._count.call(null, cicoll);
    var val__8742 = val;
    var n__8743 = 0;
    while(true) {
      if(n__8743 < cnt__8741) {
        var nval__8744 = f.call(null, val__8742, cljs.core._nth.call(null, cicoll, n__8743));
        if(cljs.core.reduced_QMARK_.call(null, nval__8744)) {
          return cljs.core.deref.call(null, nval__8744)
        }else {
          var G__8751 = nval__8744;
          var G__8752 = n__8743 + 1;
          val__8742 = G__8751;
          n__8743 = G__8752;
          continue
        }
      }else {
        return val__8742
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__8745 = cljs.core._count.call(null, cicoll);
    var val__8746 = val;
    var n__8747 = idx;
    while(true) {
      if(n__8747 < cnt__8745) {
        var nval__8748 = f.call(null, val__8746, cljs.core._nth.call(null, cicoll, n__8747));
        if(cljs.core.reduced_QMARK_.call(null, nval__8748)) {
          return cljs.core.deref.call(null, nval__8748)
        }else {
          var G__8753 = nval__8748;
          var G__8754 = n__8747 + 1;
          val__8746 = G__8753;
          n__8747 = G__8754;
          continue
        }
      }else {
        return val__8746
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__8767 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__8768 = arr[0];
      var n__8769 = 1;
      while(true) {
        if(n__8769 < cnt__8767) {
          var nval__8770 = f.call(null, val__8768, arr[n__8769]);
          if(cljs.core.reduced_QMARK_.call(null, nval__8770)) {
            return cljs.core.deref.call(null, nval__8770)
          }else {
            var G__8779 = nval__8770;
            var G__8780 = n__8769 + 1;
            val__8768 = G__8779;
            n__8769 = G__8780;
            continue
          }
        }else {
          return val__8768
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__8771 = arr.length;
    var val__8772 = val;
    var n__8773 = 0;
    while(true) {
      if(n__8773 < cnt__8771) {
        var nval__8774 = f.call(null, val__8772, arr[n__8773]);
        if(cljs.core.reduced_QMARK_.call(null, nval__8774)) {
          return cljs.core.deref.call(null, nval__8774)
        }else {
          var G__8781 = nval__8774;
          var G__8782 = n__8773 + 1;
          val__8772 = G__8781;
          n__8773 = G__8782;
          continue
        }
      }else {
        return val__8772
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__8775 = arr.length;
    var val__8776 = val;
    var n__8777 = idx;
    while(true) {
      if(n__8777 < cnt__8775) {
        var nval__8778 = f.call(null, val__8776, arr[n__8777]);
        if(cljs.core.reduced_QMARK_.call(null, nval__8778)) {
          return cljs.core.deref.call(null, nval__8778)
        }else {
          var G__8783 = nval__8778;
          var G__8784 = n__8777 + 1;
          val__8776 = G__8783;
          n__8777 = G__8784;
          continue
        }
      }else {
        return val__8776
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8785 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__8786 = this;
  if(this__8786.i + 1 < this__8786.a.length) {
    return new cljs.core.IndexedSeq(this__8786.a, this__8786.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8787 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8788 = this;
  var c__8789 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__8789 > 0) {
    return new cljs.core.RSeq(coll, c__8789 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__8790 = this;
  var this__8791 = this;
  return cljs.core.pr_str.call(null, this__8791)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8792 = this;
  if(cljs.core.counted_QMARK_.call(null, this__8792.a)) {
    return cljs.core.ci_reduce.call(null, this__8792.a, f, this__8792.a[this__8792.i], this__8792.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__8792.a[this__8792.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8793 = this;
  if(cljs.core.counted_QMARK_.call(null, this__8793.a)) {
    return cljs.core.ci_reduce.call(null, this__8793.a, f, start, this__8793.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8794 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__8795 = this;
  return this__8795.a.length - this__8795.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__8796 = this;
  return this__8796.a[this__8796.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__8797 = this;
  if(this__8797.i + 1 < this__8797.a.length) {
    return new cljs.core.IndexedSeq(this__8797.a, this__8797.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8798 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8799 = this;
  var i__8800 = n + this__8799.i;
  if(i__8800 < this__8799.a.length) {
    return this__8799.a[i__8800]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8801 = this;
  var i__8802 = n + this__8801.i;
  if(i__8802 < this__8801.a.length) {
    return this__8801.a[i__8802]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__8803 = null;
  var G__8803__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__8803__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__8803 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8803__2.call(this, array, f);
      case 3:
        return G__8803__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8803
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__8804 = null;
  var G__8804__2 = function(array, k) {
    return array[k]
  };
  var G__8804__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__8804 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8804__2.call(this, array, k);
      case 3:
        return G__8804__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8804
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__8805 = null;
  var G__8805__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__8805__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__8805 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8805__2.call(this, array, n);
      case 3:
        return G__8805__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8805
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8806 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8807 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__8808 = this;
  var this__8809 = this;
  return cljs.core.pr_str.call(null, this__8809)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8810 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8811 = this;
  return this__8811.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8812 = this;
  return cljs.core._nth.call(null, this__8812.ci, this__8812.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8813 = this;
  if(this__8813.i > 0) {
    return new cljs.core.RSeq(this__8813.ci, this__8813.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8814 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__8815 = this;
  return new cljs.core.RSeq(this__8815.ci, this__8815.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8816 = this;
  return this__8816.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__8820__8821 = coll;
      if(G__8820__8821) {
        if(function() {
          var or__3824__auto____8822 = G__8820__8821.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____8822) {
            return or__3824__auto____8822
          }else {
            return G__8820__8821.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__8820__8821.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__8820__8821)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__8820__8821)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__8827__8828 = coll;
      if(G__8827__8828) {
        if(function() {
          var or__3824__auto____8829 = G__8827__8828.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____8829) {
            return or__3824__auto____8829
          }else {
            return G__8827__8828.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__8827__8828.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8827__8828)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8827__8828)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__8830 = cljs.core.seq.call(null, coll);
      if(s__8830 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__8830)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__8835__8836 = coll;
      if(G__8835__8836) {
        if(function() {
          var or__3824__auto____8837 = G__8835__8836.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____8837) {
            return or__3824__auto____8837
          }else {
            return G__8835__8836.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__8835__8836.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8835__8836)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8835__8836)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__8838 = cljs.core.seq.call(null, coll);
      if(!(s__8838 == null)) {
        return cljs.core._rest.call(null, s__8838)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__8842__8843 = coll;
      if(G__8842__8843) {
        if(function() {
          var or__3824__auto____8844 = G__8842__8843.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____8844) {
            return or__3824__auto____8844
          }else {
            return G__8842__8843.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__8842__8843.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__8842__8843)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__8842__8843)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__8846 = cljs.core.next.call(null, s);
    if(!(sn__8846 == null)) {
      var G__8847 = sn__8846;
      s = G__8847;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__8848__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__8849 = conj.call(null, coll, x);
          var G__8850 = cljs.core.first.call(null, xs);
          var G__8851 = cljs.core.next.call(null, xs);
          coll = G__8849;
          x = G__8850;
          xs = G__8851;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__8848 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8848__delegate.call(this, coll, x, xs)
    };
    G__8848.cljs$lang$maxFixedArity = 2;
    G__8848.cljs$lang$applyTo = function(arglist__8852) {
      var coll = cljs.core.first(arglist__8852);
      var x = cljs.core.first(cljs.core.next(arglist__8852));
      var xs = cljs.core.rest(cljs.core.next(arglist__8852));
      return G__8848__delegate(coll, x, xs)
    };
    G__8848.cljs$lang$arity$variadic = G__8848__delegate;
    return G__8848
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__8855 = cljs.core.seq.call(null, coll);
  var acc__8856 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__8855)) {
      return acc__8856 + cljs.core._count.call(null, s__8855)
    }else {
      var G__8857 = cljs.core.next.call(null, s__8855);
      var G__8858 = acc__8856 + 1;
      s__8855 = G__8857;
      acc__8856 = G__8858;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__8865__8866 = coll;
        if(G__8865__8866) {
          if(function() {
            var or__3824__auto____8867 = G__8865__8866.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____8867) {
              return or__3824__auto____8867
            }else {
              return G__8865__8866.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__8865__8866.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8865__8866)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8865__8866)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__8868__8869 = coll;
        if(G__8868__8869) {
          if(function() {
            var or__3824__auto____8870 = G__8868__8869.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____8870) {
              return or__3824__auto____8870
            }else {
              return G__8868__8869.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__8868__8869.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8868__8869)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8868__8869)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__8873__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__8872 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__8874 = ret__8872;
          var G__8875 = cljs.core.first.call(null, kvs);
          var G__8876 = cljs.core.second.call(null, kvs);
          var G__8877 = cljs.core.nnext.call(null, kvs);
          coll = G__8874;
          k = G__8875;
          v = G__8876;
          kvs = G__8877;
          continue
        }else {
          return ret__8872
        }
        break
      }
    };
    var G__8873 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8873__delegate.call(this, coll, k, v, kvs)
    };
    G__8873.cljs$lang$maxFixedArity = 3;
    G__8873.cljs$lang$applyTo = function(arglist__8878) {
      var coll = cljs.core.first(arglist__8878);
      var k = cljs.core.first(cljs.core.next(arglist__8878));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8878)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8878)));
      return G__8873__delegate(coll, k, v, kvs)
    };
    G__8873.cljs$lang$arity$variadic = G__8873__delegate;
    return G__8873
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__8881__delegate = function(coll, k, ks) {
      while(true) {
        var ret__8880 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__8882 = ret__8880;
          var G__8883 = cljs.core.first.call(null, ks);
          var G__8884 = cljs.core.next.call(null, ks);
          coll = G__8882;
          k = G__8883;
          ks = G__8884;
          continue
        }else {
          return ret__8880
        }
        break
      }
    };
    var G__8881 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8881__delegate.call(this, coll, k, ks)
    };
    G__8881.cljs$lang$maxFixedArity = 2;
    G__8881.cljs$lang$applyTo = function(arglist__8885) {
      var coll = cljs.core.first(arglist__8885);
      var k = cljs.core.first(cljs.core.next(arglist__8885));
      var ks = cljs.core.rest(cljs.core.next(arglist__8885));
      return G__8881__delegate(coll, k, ks)
    };
    G__8881.cljs$lang$arity$variadic = G__8881__delegate;
    return G__8881
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__8889__8890 = o;
    if(G__8889__8890) {
      if(function() {
        var or__3824__auto____8891 = G__8889__8890.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____8891) {
          return or__3824__auto____8891
        }else {
          return G__8889__8890.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__8889__8890.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__8889__8890)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__8889__8890)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__8894__delegate = function(coll, k, ks) {
      while(true) {
        var ret__8893 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__8895 = ret__8893;
          var G__8896 = cljs.core.first.call(null, ks);
          var G__8897 = cljs.core.next.call(null, ks);
          coll = G__8895;
          k = G__8896;
          ks = G__8897;
          continue
        }else {
          return ret__8893
        }
        break
      }
    };
    var G__8894 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8894__delegate.call(this, coll, k, ks)
    };
    G__8894.cljs$lang$maxFixedArity = 2;
    G__8894.cljs$lang$applyTo = function(arglist__8898) {
      var coll = cljs.core.first(arglist__8898);
      var k = cljs.core.first(cljs.core.next(arglist__8898));
      var ks = cljs.core.rest(cljs.core.next(arglist__8898));
      return G__8894__delegate(coll, k, ks)
    };
    G__8894.cljs$lang$arity$variadic = G__8894__delegate;
    return G__8894
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__8900 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__8900;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__8900
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__8902 = cljs.core.string_hash_cache[k];
  if(!(h__8902 == null)) {
    return h__8902
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____8904 = goog.isString(o);
      if(and__3822__auto____8904) {
        return check_cache
      }else {
        return and__3822__auto____8904
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__8908__8909 = x;
    if(G__8908__8909) {
      if(function() {
        var or__3824__auto____8910 = G__8908__8909.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____8910) {
          return or__3824__auto____8910
        }else {
          return G__8908__8909.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__8908__8909.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__8908__8909)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__8908__8909)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__8914__8915 = x;
    if(G__8914__8915) {
      if(function() {
        var or__3824__auto____8916 = G__8914__8915.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____8916) {
          return or__3824__auto____8916
        }else {
          return G__8914__8915.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__8914__8915.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__8914__8915)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__8914__8915)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__8920__8921 = x;
  if(G__8920__8921) {
    if(function() {
      var or__3824__auto____8922 = G__8920__8921.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____8922) {
        return or__3824__auto____8922
      }else {
        return G__8920__8921.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__8920__8921.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__8920__8921)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__8920__8921)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__8926__8927 = x;
  if(G__8926__8927) {
    if(function() {
      var or__3824__auto____8928 = G__8926__8927.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____8928) {
        return or__3824__auto____8928
      }else {
        return G__8926__8927.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__8926__8927.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__8926__8927)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__8926__8927)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__8932__8933 = x;
  if(G__8932__8933) {
    if(function() {
      var or__3824__auto____8934 = G__8932__8933.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____8934) {
        return or__3824__auto____8934
      }else {
        return G__8932__8933.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__8932__8933.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__8932__8933)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__8932__8933)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__8938__8939 = x;
  if(G__8938__8939) {
    if(function() {
      var or__3824__auto____8940 = G__8938__8939.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____8940) {
        return or__3824__auto____8940
      }else {
        return G__8938__8939.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__8938__8939.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8938__8939)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8938__8939)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__8944__8945 = x;
  if(G__8944__8945) {
    if(function() {
      var or__3824__auto____8946 = G__8944__8945.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____8946) {
        return or__3824__auto____8946
      }else {
        return G__8944__8945.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__8944__8945.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8944__8945)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8944__8945)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__8950__8951 = x;
    if(G__8950__8951) {
      if(function() {
        var or__3824__auto____8952 = G__8950__8951.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____8952) {
          return or__3824__auto____8952
        }else {
          return G__8950__8951.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__8950__8951.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__8950__8951)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__8950__8951)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__8956__8957 = x;
  if(G__8956__8957) {
    if(function() {
      var or__3824__auto____8958 = G__8956__8957.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____8958) {
        return or__3824__auto____8958
      }else {
        return G__8956__8957.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__8956__8957.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__8956__8957)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__8956__8957)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__8962__8963 = x;
  if(G__8962__8963) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____8964 = null;
      if(cljs.core.truth_(or__3824__auto____8964)) {
        return or__3824__auto____8964
      }else {
        return G__8962__8963.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__8962__8963.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__8962__8963)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__8962__8963)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__8965__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__8965 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8965__delegate.call(this, keyvals)
    };
    G__8965.cljs$lang$maxFixedArity = 0;
    G__8965.cljs$lang$applyTo = function(arglist__8966) {
      var keyvals = cljs.core.seq(arglist__8966);
      return G__8965__delegate(keyvals)
    };
    G__8965.cljs$lang$arity$variadic = G__8965__delegate;
    return G__8965
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__8968 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__8968.push(key)
  });
  return keys__8968
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__8972 = i;
  var j__8973 = j;
  var len__8974 = len;
  while(true) {
    if(len__8974 === 0) {
      return to
    }else {
      to[j__8973] = from[i__8972];
      var G__8975 = i__8972 + 1;
      var G__8976 = j__8973 + 1;
      var G__8977 = len__8974 - 1;
      i__8972 = G__8975;
      j__8973 = G__8976;
      len__8974 = G__8977;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__8981 = i + (len - 1);
  var j__8982 = j + (len - 1);
  var len__8983 = len;
  while(true) {
    if(len__8983 === 0) {
      return to
    }else {
      to[j__8982] = from[i__8981];
      var G__8984 = i__8981 - 1;
      var G__8985 = j__8982 - 1;
      var G__8986 = len__8983 - 1;
      i__8981 = G__8984;
      j__8982 = G__8985;
      len__8983 = G__8986;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__8990__8991 = s;
    if(G__8990__8991) {
      if(function() {
        var or__3824__auto____8992 = G__8990__8991.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____8992) {
          return or__3824__auto____8992
        }else {
          return G__8990__8991.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__8990__8991.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8990__8991)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8990__8991)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__8996__8997 = s;
  if(G__8996__8997) {
    if(function() {
      var or__3824__auto____8998 = G__8996__8997.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____8998) {
        return or__3824__auto____8998
      }else {
        return G__8996__8997.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__8996__8997.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__8996__8997)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__8996__8997)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____9001 = goog.isString(x);
  if(and__3822__auto____9001) {
    return!function() {
      var or__3824__auto____9002 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____9002) {
        return or__3824__auto____9002
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____9001
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____9004 = goog.isString(x);
  if(and__3822__auto____9004) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____9004
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____9006 = goog.isString(x);
  if(and__3822__auto____9006) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____9006
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____9011 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____9011) {
    return or__3824__auto____9011
  }else {
    var G__9012__9013 = f;
    if(G__9012__9013) {
      if(function() {
        var or__3824__auto____9014 = G__9012__9013.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____9014) {
          return or__3824__auto____9014
        }else {
          return G__9012__9013.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__9012__9013.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__9012__9013)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__9012__9013)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____9016 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____9016) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____9016
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____9019 = coll;
    if(cljs.core.truth_(and__3822__auto____9019)) {
      var and__3822__auto____9020 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____9020) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____9020
      }
    }else {
      return and__3822__auto____9019
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__9029__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__9025 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__9026 = more;
        while(true) {
          var x__9027 = cljs.core.first.call(null, xs__9026);
          var etc__9028 = cljs.core.next.call(null, xs__9026);
          if(cljs.core.truth_(xs__9026)) {
            if(cljs.core.contains_QMARK_.call(null, s__9025, x__9027)) {
              return false
            }else {
              var G__9030 = cljs.core.conj.call(null, s__9025, x__9027);
              var G__9031 = etc__9028;
              s__9025 = G__9030;
              xs__9026 = G__9031;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__9029 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9029__delegate.call(this, x, y, more)
    };
    G__9029.cljs$lang$maxFixedArity = 2;
    G__9029.cljs$lang$applyTo = function(arglist__9032) {
      var x = cljs.core.first(arglist__9032);
      var y = cljs.core.first(cljs.core.next(arglist__9032));
      var more = cljs.core.rest(cljs.core.next(arglist__9032));
      return G__9029__delegate(x, y, more)
    };
    G__9029.cljs$lang$arity$variadic = G__9029__delegate;
    return G__9029
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__9036__9037 = x;
            if(G__9036__9037) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____9038 = null;
                if(cljs.core.truth_(or__3824__auto____9038)) {
                  return or__3824__auto____9038
                }else {
                  return G__9036__9037.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__9036__9037.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__9036__9037)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__9036__9037)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__9043 = cljs.core.count.call(null, xs);
    var yl__9044 = cljs.core.count.call(null, ys);
    if(xl__9043 < yl__9044) {
      return-1
    }else {
      if(xl__9043 > yl__9044) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__9043, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__9045 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____9046 = d__9045 === 0;
        if(and__3822__auto____9046) {
          return n + 1 < len
        }else {
          return and__3822__auto____9046
        }
      }()) {
        var G__9047 = xs;
        var G__9048 = ys;
        var G__9049 = len;
        var G__9050 = n + 1;
        xs = G__9047;
        ys = G__9048;
        len = G__9049;
        n = G__9050;
        continue
      }else {
        return d__9045
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__9052 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__9052)) {
        return r__9052
      }else {
        if(cljs.core.truth_(r__9052)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__9054 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__9054, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__9054)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____9060 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____9060) {
      var s__9061 = temp__3971__auto____9060;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__9061), cljs.core.next.call(null, s__9061))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__9062 = val;
    var coll__9063 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__9063) {
        var nval__9064 = f.call(null, val__9062, cljs.core.first.call(null, coll__9063));
        if(cljs.core.reduced_QMARK_.call(null, nval__9064)) {
          return cljs.core.deref.call(null, nval__9064)
        }else {
          var G__9065 = nval__9064;
          var G__9066 = cljs.core.next.call(null, coll__9063);
          val__9062 = G__9065;
          coll__9063 = G__9066;
          continue
        }
      }else {
        return val__9062
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__9068 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__9068);
  return cljs.core.vec.call(null, a__9068)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__9075__9076 = coll;
      if(G__9075__9076) {
        if(function() {
          var or__3824__auto____9077 = G__9075__9076.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____9077) {
            return or__3824__auto____9077
          }else {
            return G__9075__9076.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__9075__9076.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9075__9076)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9075__9076)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__9078__9079 = coll;
      if(G__9078__9079) {
        if(function() {
          var or__3824__auto____9080 = G__9078__9079.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____9080) {
            return or__3824__auto____9080
          }else {
            return G__9078__9079.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__9078__9079.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9078__9079)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9078__9079)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__9081 = this;
  return this__9081.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__9082__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__9082 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9082__delegate.call(this, x, y, more)
    };
    G__9082.cljs$lang$maxFixedArity = 2;
    G__9082.cljs$lang$applyTo = function(arglist__9083) {
      var x = cljs.core.first(arglist__9083);
      var y = cljs.core.first(cljs.core.next(arglist__9083));
      var more = cljs.core.rest(cljs.core.next(arglist__9083));
      return G__9082__delegate(x, y, more)
    };
    G__9082.cljs$lang$arity$variadic = G__9082__delegate;
    return G__9082
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__9084__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__9084 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9084__delegate.call(this, x, y, more)
    };
    G__9084.cljs$lang$maxFixedArity = 2;
    G__9084.cljs$lang$applyTo = function(arglist__9085) {
      var x = cljs.core.first(arglist__9085);
      var y = cljs.core.first(cljs.core.next(arglist__9085));
      var more = cljs.core.rest(cljs.core.next(arglist__9085));
      return G__9084__delegate(x, y, more)
    };
    G__9084.cljs$lang$arity$variadic = G__9084__delegate;
    return G__9084
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__9086__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__9086 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9086__delegate.call(this, x, y, more)
    };
    G__9086.cljs$lang$maxFixedArity = 2;
    G__9086.cljs$lang$applyTo = function(arglist__9087) {
      var x = cljs.core.first(arglist__9087);
      var y = cljs.core.first(cljs.core.next(arglist__9087));
      var more = cljs.core.rest(cljs.core.next(arglist__9087));
      return G__9086__delegate(x, y, more)
    };
    G__9086.cljs$lang$arity$variadic = G__9086__delegate;
    return G__9086
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__9088__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__9088 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9088__delegate.call(this, x, y, more)
    };
    G__9088.cljs$lang$maxFixedArity = 2;
    G__9088.cljs$lang$applyTo = function(arglist__9089) {
      var x = cljs.core.first(arglist__9089);
      var y = cljs.core.first(cljs.core.next(arglist__9089));
      var more = cljs.core.rest(cljs.core.next(arglist__9089));
      return G__9088__delegate(x, y, more)
    };
    G__9088.cljs$lang$arity$variadic = G__9088__delegate;
    return G__9088
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__9090__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__9091 = y;
            var G__9092 = cljs.core.first.call(null, more);
            var G__9093 = cljs.core.next.call(null, more);
            x = G__9091;
            y = G__9092;
            more = G__9093;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__9090 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9090__delegate.call(this, x, y, more)
    };
    G__9090.cljs$lang$maxFixedArity = 2;
    G__9090.cljs$lang$applyTo = function(arglist__9094) {
      var x = cljs.core.first(arglist__9094);
      var y = cljs.core.first(cljs.core.next(arglist__9094));
      var more = cljs.core.rest(cljs.core.next(arglist__9094));
      return G__9090__delegate(x, y, more)
    };
    G__9090.cljs$lang$arity$variadic = G__9090__delegate;
    return G__9090
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__9095__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__9096 = y;
            var G__9097 = cljs.core.first.call(null, more);
            var G__9098 = cljs.core.next.call(null, more);
            x = G__9096;
            y = G__9097;
            more = G__9098;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__9095 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9095__delegate.call(this, x, y, more)
    };
    G__9095.cljs$lang$maxFixedArity = 2;
    G__9095.cljs$lang$applyTo = function(arglist__9099) {
      var x = cljs.core.first(arglist__9099);
      var y = cljs.core.first(cljs.core.next(arglist__9099));
      var more = cljs.core.rest(cljs.core.next(arglist__9099));
      return G__9095__delegate(x, y, more)
    };
    G__9095.cljs$lang$arity$variadic = G__9095__delegate;
    return G__9095
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__9100__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__9101 = y;
            var G__9102 = cljs.core.first.call(null, more);
            var G__9103 = cljs.core.next.call(null, more);
            x = G__9101;
            y = G__9102;
            more = G__9103;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__9100 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9100__delegate.call(this, x, y, more)
    };
    G__9100.cljs$lang$maxFixedArity = 2;
    G__9100.cljs$lang$applyTo = function(arglist__9104) {
      var x = cljs.core.first(arglist__9104);
      var y = cljs.core.first(cljs.core.next(arglist__9104));
      var more = cljs.core.rest(cljs.core.next(arglist__9104));
      return G__9100__delegate(x, y, more)
    };
    G__9100.cljs$lang$arity$variadic = G__9100__delegate;
    return G__9100
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__9105__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__9106 = y;
            var G__9107 = cljs.core.first.call(null, more);
            var G__9108 = cljs.core.next.call(null, more);
            x = G__9106;
            y = G__9107;
            more = G__9108;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__9105 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9105__delegate.call(this, x, y, more)
    };
    G__9105.cljs$lang$maxFixedArity = 2;
    G__9105.cljs$lang$applyTo = function(arglist__9109) {
      var x = cljs.core.first(arglist__9109);
      var y = cljs.core.first(cljs.core.next(arglist__9109));
      var more = cljs.core.rest(cljs.core.next(arglist__9109));
      return G__9105__delegate(x, y, more)
    };
    G__9105.cljs$lang$arity$variadic = G__9105__delegate;
    return G__9105
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__9110__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__9110 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9110__delegate.call(this, x, y, more)
    };
    G__9110.cljs$lang$maxFixedArity = 2;
    G__9110.cljs$lang$applyTo = function(arglist__9111) {
      var x = cljs.core.first(arglist__9111);
      var y = cljs.core.first(cljs.core.next(arglist__9111));
      var more = cljs.core.rest(cljs.core.next(arglist__9111));
      return G__9110__delegate(x, y, more)
    };
    G__9110.cljs$lang$arity$variadic = G__9110__delegate;
    return G__9110
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__9112__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__9112 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9112__delegate.call(this, x, y, more)
    };
    G__9112.cljs$lang$maxFixedArity = 2;
    G__9112.cljs$lang$applyTo = function(arglist__9113) {
      var x = cljs.core.first(arglist__9113);
      var y = cljs.core.first(cljs.core.next(arglist__9113));
      var more = cljs.core.rest(cljs.core.next(arglist__9113));
      return G__9112__delegate(x, y, more)
    };
    G__9112.cljs$lang$arity$variadic = G__9112__delegate;
    return G__9112
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__9115 = n % d;
  return cljs.core.fix.call(null, (n - rem__9115) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__9117 = cljs.core.quot.call(null, n, d);
  return n - d * q__9117
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__9120 = v - (v >> 1 & 1431655765);
  var v__9121 = (v__9120 & 858993459) + (v__9120 >> 2 & 858993459);
  return(v__9121 + (v__9121 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__9122__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__9123 = y;
            var G__9124 = cljs.core.first.call(null, more);
            var G__9125 = cljs.core.next.call(null, more);
            x = G__9123;
            y = G__9124;
            more = G__9125;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__9122 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9122__delegate.call(this, x, y, more)
    };
    G__9122.cljs$lang$maxFixedArity = 2;
    G__9122.cljs$lang$applyTo = function(arglist__9126) {
      var x = cljs.core.first(arglist__9126);
      var y = cljs.core.first(cljs.core.next(arglist__9126));
      var more = cljs.core.rest(cljs.core.next(arglist__9126));
      return G__9122__delegate(x, y, more)
    };
    G__9122.cljs$lang$arity$variadic = G__9122__delegate;
    return G__9122
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__9130 = n;
  var xs__9131 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____9132 = xs__9131;
      if(and__3822__auto____9132) {
        return n__9130 > 0
      }else {
        return and__3822__auto____9132
      }
    }())) {
      var G__9133 = n__9130 - 1;
      var G__9134 = cljs.core.next.call(null, xs__9131);
      n__9130 = G__9133;
      xs__9131 = G__9134;
      continue
    }else {
      return xs__9131
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__9135__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__9136 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__9137 = cljs.core.next.call(null, more);
            sb = G__9136;
            more = G__9137;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__9135 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9135__delegate.call(this, x, ys)
    };
    G__9135.cljs$lang$maxFixedArity = 1;
    G__9135.cljs$lang$applyTo = function(arglist__9138) {
      var x = cljs.core.first(arglist__9138);
      var ys = cljs.core.rest(arglist__9138);
      return G__9135__delegate(x, ys)
    };
    G__9135.cljs$lang$arity$variadic = G__9135__delegate;
    return G__9135
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__9139__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__9140 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__9141 = cljs.core.next.call(null, more);
            sb = G__9140;
            more = G__9141;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__9139 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9139__delegate.call(this, x, ys)
    };
    G__9139.cljs$lang$maxFixedArity = 1;
    G__9139.cljs$lang$applyTo = function(arglist__9142) {
      var x = cljs.core.first(arglist__9142);
      var ys = cljs.core.rest(arglist__9142);
      return G__9139__delegate(x, ys)
    };
    G__9139.cljs$lang$arity$variadic = G__9139__delegate;
    return G__9139
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__9143) {
    var fmt = cljs.core.first(arglist__9143);
    var args = cljs.core.rest(arglist__9143);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__9146 = cljs.core.seq.call(null, x);
    var ys__9147 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__9146 == null) {
        return ys__9147 == null
      }else {
        if(ys__9147 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__9146), cljs.core.first.call(null, ys__9147))) {
            var G__9148 = cljs.core.next.call(null, xs__9146);
            var G__9149 = cljs.core.next.call(null, ys__9147);
            xs__9146 = G__9148;
            ys__9147 = G__9149;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__9150_SHARP_, p2__9151_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__9150_SHARP_, cljs.core.hash.call(null, p2__9151_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__9155 = 0;
  var s__9156 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__9156) {
      var e__9157 = cljs.core.first.call(null, s__9156);
      var G__9158 = (h__9155 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__9157)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__9157)))) % 4503599627370496;
      var G__9159 = cljs.core.next.call(null, s__9156);
      h__9155 = G__9158;
      s__9156 = G__9159;
      continue
    }else {
      return h__9155
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__9163 = 0;
  var s__9164 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__9164) {
      var e__9165 = cljs.core.first.call(null, s__9164);
      var G__9166 = (h__9163 + cljs.core.hash.call(null, e__9165)) % 4503599627370496;
      var G__9167 = cljs.core.next.call(null, s__9164);
      h__9163 = G__9166;
      s__9164 = G__9167;
      continue
    }else {
      return h__9163
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__9188__9189 = cljs.core.seq.call(null, fn_map);
  if(G__9188__9189) {
    var G__9191__9193 = cljs.core.first.call(null, G__9188__9189);
    var vec__9192__9194 = G__9191__9193;
    var key_name__9195 = cljs.core.nth.call(null, vec__9192__9194, 0, null);
    var f__9196 = cljs.core.nth.call(null, vec__9192__9194, 1, null);
    var G__9188__9197 = G__9188__9189;
    var G__9191__9198 = G__9191__9193;
    var G__9188__9199 = G__9188__9197;
    while(true) {
      var vec__9200__9201 = G__9191__9198;
      var key_name__9202 = cljs.core.nth.call(null, vec__9200__9201, 0, null);
      var f__9203 = cljs.core.nth.call(null, vec__9200__9201, 1, null);
      var G__9188__9204 = G__9188__9199;
      var str_name__9205 = cljs.core.name.call(null, key_name__9202);
      obj[str_name__9205] = f__9203;
      var temp__3974__auto____9206 = cljs.core.next.call(null, G__9188__9204);
      if(temp__3974__auto____9206) {
        var G__9188__9207 = temp__3974__auto____9206;
        var G__9208 = cljs.core.first.call(null, G__9188__9207);
        var G__9209 = G__9188__9207;
        G__9191__9198 = G__9208;
        G__9188__9199 = G__9209;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9210 = this;
  var h__693__auto____9211 = this__9210.__hash;
  if(!(h__693__auto____9211 == null)) {
    return h__693__auto____9211
  }else {
    var h__693__auto____9212 = cljs.core.hash_coll.call(null, coll);
    this__9210.__hash = h__693__auto____9212;
    return h__693__auto____9212
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__9213 = this;
  if(this__9213.count === 1) {
    return null
  }else {
    return this__9213.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9214 = this;
  return new cljs.core.List(this__9214.meta, o, coll, this__9214.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__9215 = this;
  var this__9216 = this;
  return cljs.core.pr_str.call(null, this__9216)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9217 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9218 = this;
  return this__9218.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9219 = this;
  return this__9219.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9220 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9221 = this;
  return this__9221.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9222 = this;
  if(this__9222.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__9222.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9223 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9224 = this;
  return new cljs.core.List(meta, this__9224.first, this__9224.rest, this__9224.count, this__9224.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9225 = this;
  return this__9225.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9226 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9227 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__9228 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9229 = this;
  return new cljs.core.List(this__9229.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__9230 = this;
  var this__9231 = this;
  return cljs.core.pr_str.call(null, this__9231)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9232 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9233 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9234 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9235 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9236 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9237 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9238 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9239 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9240 = this;
  return this__9240.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9241 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__9245__9246 = coll;
  if(G__9245__9246) {
    if(function() {
      var or__3824__auto____9247 = G__9245__9246.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____9247) {
        return or__3824__auto____9247
      }else {
        return G__9245__9246.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__9245__9246.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__9245__9246)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__9245__9246)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__9248__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__9248 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9248__delegate.call(this, x, y, z, items)
    };
    G__9248.cljs$lang$maxFixedArity = 3;
    G__9248.cljs$lang$applyTo = function(arglist__9249) {
      var x = cljs.core.first(arglist__9249);
      var y = cljs.core.first(cljs.core.next(arglist__9249));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9249)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9249)));
      return G__9248__delegate(x, y, z, items)
    };
    G__9248.cljs$lang$arity$variadic = G__9248__delegate;
    return G__9248
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9250 = this;
  var h__693__auto____9251 = this__9250.__hash;
  if(!(h__693__auto____9251 == null)) {
    return h__693__auto____9251
  }else {
    var h__693__auto____9252 = cljs.core.hash_coll.call(null, coll);
    this__9250.__hash = h__693__auto____9252;
    return h__693__auto____9252
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__9253 = this;
  if(this__9253.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__9253.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9254 = this;
  return new cljs.core.Cons(null, o, coll, this__9254.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__9255 = this;
  var this__9256 = this;
  return cljs.core.pr_str.call(null, this__9256)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9257 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9258 = this;
  return this__9258.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9259 = this;
  if(this__9259.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__9259.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9260 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9261 = this;
  return new cljs.core.Cons(meta, this__9261.first, this__9261.rest, this__9261.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9262 = this;
  return this__9262.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9263 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9263.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____9268 = coll == null;
    if(or__3824__auto____9268) {
      return or__3824__auto____9268
    }else {
      var G__9269__9270 = coll;
      if(G__9269__9270) {
        if(function() {
          var or__3824__auto____9271 = G__9269__9270.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____9271) {
            return or__3824__auto____9271
          }else {
            return G__9269__9270.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__9269__9270.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9269__9270)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9269__9270)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__9275__9276 = x;
  if(G__9275__9276) {
    if(function() {
      var or__3824__auto____9277 = G__9275__9276.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____9277) {
        return or__3824__auto____9277
      }else {
        return G__9275__9276.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__9275__9276.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__9275__9276)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__9275__9276)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__9278 = null;
  var G__9278__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__9278__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__9278 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__9278__2.call(this, string, f);
      case 3:
        return G__9278__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9278
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__9279 = null;
  var G__9279__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__9279__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__9279 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9279__2.call(this, string, k);
      case 3:
        return G__9279__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9279
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__9280 = null;
  var G__9280__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__9280__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__9280 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9280__2.call(this, string, n);
      case 3:
        return G__9280__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9280
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__9292 = null;
  var G__9292__2 = function(this_sym9283, coll) {
    var this__9285 = this;
    var this_sym9283__9286 = this;
    var ___9287 = this_sym9283__9286;
    if(coll == null) {
      return null
    }else {
      var strobj__9288 = coll.strobj;
      if(strobj__9288 == null) {
        return cljs.core._lookup.call(null, coll, this__9285.k, null)
      }else {
        return strobj__9288[this__9285.k]
      }
    }
  };
  var G__9292__3 = function(this_sym9284, coll, not_found) {
    var this__9285 = this;
    var this_sym9284__9289 = this;
    var ___9290 = this_sym9284__9289;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__9285.k, not_found)
    }
  };
  G__9292 = function(this_sym9284, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9292__2.call(this, this_sym9284, coll);
      case 3:
        return G__9292__3.call(this, this_sym9284, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9292
}();
cljs.core.Keyword.prototype.apply = function(this_sym9281, args9282) {
  var this__9291 = this;
  return this_sym9281.call.apply(this_sym9281, [this_sym9281].concat(args9282.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__9301 = null;
  var G__9301__2 = function(this_sym9295, coll) {
    var this_sym9295__9297 = this;
    var this__9298 = this_sym9295__9297;
    return cljs.core._lookup.call(null, coll, this__9298.toString(), null)
  };
  var G__9301__3 = function(this_sym9296, coll, not_found) {
    var this_sym9296__9299 = this;
    var this__9300 = this_sym9296__9299;
    return cljs.core._lookup.call(null, coll, this__9300.toString(), not_found)
  };
  G__9301 = function(this_sym9296, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9301__2.call(this, this_sym9296, coll);
      case 3:
        return G__9301__3.call(this, this_sym9296, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9301
}();
String.prototype.apply = function(this_sym9293, args9294) {
  return this_sym9293.call.apply(this_sym9293, [this_sym9293].concat(args9294.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__9303 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__9303
  }else {
    lazy_seq.x = x__9303.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9304 = this;
  var h__693__auto____9305 = this__9304.__hash;
  if(!(h__693__auto____9305 == null)) {
    return h__693__auto____9305
  }else {
    var h__693__auto____9306 = cljs.core.hash_coll.call(null, coll);
    this__9304.__hash = h__693__auto____9306;
    return h__693__auto____9306
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__9307 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9308 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__9309 = this;
  var this__9310 = this;
  return cljs.core.pr_str.call(null, this__9310)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9311 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9312 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9313 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9314 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9315 = this;
  return new cljs.core.LazySeq(meta, this__9315.realized, this__9315.x, this__9315.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9316 = this;
  return this__9316.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9317 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9317.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__9318 = this;
  return this__9318.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__9319 = this;
  var ___9320 = this;
  this__9319.buf[this__9319.end] = o;
  return this__9319.end = this__9319.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__9321 = this;
  var ___9322 = this;
  var ret__9323 = new cljs.core.ArrayChunk(this__9321.buf, 0, this__9321.end);
  this__9321.buf = null;
  return ret__9323
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__9324 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__9324.arr[this__9324.off], this__9324.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__9325 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__9325.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__9326 = this;
  if(this__9326.off === this__9326.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__9326.arr, this__9326.off + 1, this__9326.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__9327 = this;
  return this__9327.arr[this__9327.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__9328 = this;
  if(function() {
    var and__3822__auto____9329 = i >= 0;
    if(and__3822__auto____9329) {
      return i < this__9328.end - this__9328.off
    }else {
      return and__3822__auto____9329
    }
  }()) {
    return this__9328.arr[this__9328.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__9330 = this;
  return this__9330.end - this__9330.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__9331 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9332 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9333 = this;
  return cljs.core._nth.call(null, this__9333.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9334 = this;
  if(cljs.core._count.call(null, this__9334.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__9334.chunk), this__9334.more, this__9334.meta)
  }else {
    if(this__9334.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__9334.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__9335 = this;
  if(this__9335.more == null) {
    return null
  }else {
    return this__9335.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9336 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__9337 = this;
  return new cljs.core.ChunkedCons(this__9337.chunk, this__9337.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9338 = this;
  return this__9338.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__9339 = this;
  return this__9339.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__9340 = this;
  if(this__9340.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__9340.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__9344__9345 = s;
    if(G__9344__9345) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____9346 = null;
        if(cljs.core.truth_(or__3824__auto____9346)) {
          return or__3824__auto____9346
        }else {
          return G__9344__9345.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__9344__9345.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__9344__9345)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__9344__9345)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__9349 = [];
  var s__9350 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__9350)) {
      ary__9349.push(cljs.core.first.call(null, s__9350));
      var G__9351 = cljs.core.next.call(null, s__9350);
      s__9350 = G__9351;
      continue
    }else {
      return ary__9349
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__9355 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__9356 = 0;
  var xs__9357 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__9357) {
      ret__9355[i__9356] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__9357));
      var G__9358 = i__9356 + 1;
      var G__9359 = cljs.core.next.call(null, xs__9357);
      i__9356 = G__9358;
      xs__9357 = G__9359;
      continue
    }else {
    }
    break
  }
  return ret__9355
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__9367 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9368 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9369 = 0;
      var s__9370 = s__9368;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____9371 = s__9370;
          if(and__3822__auto____9371) {
            return i__9369 < size
          }else {
            return and__3822__auto____9371
          }
        }())) {
          a__9367[i__9369] = cljs.core.first.call(null, s__9370);
          var G__9374 = i__9369 + 1;
          var G__9375 = cljs.core.next.call(null, s__9370);
          i__9369 = G__9374;
          s__9370 = G__9375;
          continue
        }else {
          return a__9367
        }
        break
      }
    }else {
      var n__1028__auto____9372 = size;
      var i__9373 = 0;
      while(true) {
        if(i__9373 < n__1028__auto____9372) {
          a__9367[i__9373] = init_val_or_seq;
          var G__9376 = i__9373 + 1;
          i__9373 = G__9376;
          continue
        }else {
        }
        break
      }
      return a__9367
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__9384 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9385 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9386 = 0;
      var s__9387 = s__9385;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____9388 = s__9387;
          if(and__3822__auto____9388) {
            return i__9386 < size
          }else {
            return and__3822__auto____9388
          }
        }())) {
          a__9384[i__9386] = cljs.core.first.call(null, s__9387);
          var G__9391 = i__9386 + 1;
          var G__9392 = cljs.core.next.call(null, s__9387);
          i__9386 = G__9391;
          s__9387 = G__9392;
          continue
        }else {
          return a__9384
        }
        break
      }
    }else {
      var n__1028__auto____9389 = size;
      var i__9390 = 0;
      while(true) {
        if(i__9390 < n__1028__auto____9389) {
          a__9384[i__9390] = init_val_or_seq;
          var G__9393 = i__9390 + 1;
          i__9390 = G__9393;
          continue
        }else {
        }
        break
      }
      return a__9384
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__9401 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9402 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9403 = 0;
      var s__9404 = s__9402;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____9405 = s__9404;
          if(and__3822__auto____9405) {
            return i__9403 < size
          }else {
            return and__3822__auto____9405
          }
        }())) {
          a__9401[i__9403] = cljs.core.first.call(null, s__9404);
          var G__9408 = i__9403 + 1;
          var G__9409 = cljs.core.next.call(null, s__9404);
          i__9403 = G__9408;
          s__9404 = G__9409;
          continue
        }else {
          return a__9401
        }
        break
      }
    }else {
      var n__1028__auto____9406 = size;
      var i__9407 = 0;
      while(true) {
        if(i__9407 < n__1028__auto____9406) {
          a__9401[i__9407] = init_val_or_seq;
          var G__9410 = i__9407 + 1;
          i__9407 = G__9410;
          continue
        }else {
        }
        break
      }
      return a__9401
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__9415 = s;
    var i__9416 = n;
    var sum__9417 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____9418 = i__9416 > 0;
        if(and__3822__auto____9418) {
          return cljs.core.seq.call(null, s__9415)
        }else {
          return and__3822__auto____9418
        }
      }())) {
        var G__9419 = cljs.core.next.call(null, s__9415);
        var G__9420 = i__9416 - 1;
        var G__9421 = sum__9417 + 1;
        s__9415 = G__9419;
        i__9416 = G__9420;
        sum__9417 = G__9421;
        continue
      }else {
        return sum__9417
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__9426 = cljs.core.seq.call(null, x);
      if(s__9426) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__9426)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__9426), concat.call(null, cljs.core.chunk_rest.call(null, s__9426), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__9426), concat.call(null, cljs.core.rest.call(null, s__9426), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__9430__delegate = function(x, y, zs) {
      var cat__9429 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__9428 = cljs.core.seq.call(null, xys);
          if(xys__9428) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__9428)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__9428), cat.call(null, cljs.core.chunk_rest.call(null, xys__9428), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__9428), cat.call(null, cljs.core.rest.call(null, xys__9428), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__9429.call(null, concat.call(null, x, y), zs)
    };
    var G__9430 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9430__delegate.call(this, x, y, zs)
    };
    G__9430.cljs$lang$maxFixedArity = 2;
    G__9430.cljs$lang$applyTo = function(arglist__9431) {
      var x = cljs.core.first(arglist__9431);
      var y = cljs.core.first(cljs.core.next(arglist__9431));
      var zs = cljs.core.rest(cljs.core.next(arglist__9431));
      return G__9430__delegate(x, y, zs)
    };
    G__9430.cljs$lang$arity$variadic = G__9430__delegate;
    return G__9430
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__9432__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__9432 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9432__delegate.call(this, a, b, c, d, more)
    };
    G__9432.cljs$lang$maxFixedArity = 4;
    G__9432.cljs$lang$applyTo = function(arglist__9433) {
      var a = cljs.core.first(arglist__9433);
      var b = cljs.core.first(cljs.core.next(arglist__9433));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9433)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9433))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9433))));
      return G__9432__delegate(a, b, c, d, more)
    };
    G__9432.cljs$lang$arity$variadic = G__9432__delegate;
    return G__9432
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__9475 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__9476 = cljs.core._first.call(null, args__9475);
    var args__9477 = cljs.core._rest.call(null, args__9475);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__9476)
      }else {
        return f.call(null, a__9476)
      }
    }else {
      var b__9478 = cljs.core._first.call(null, args__9477);
      var args__9479 = cljs.core._rest.call(null, args__9477);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__9476, b__9478)
        }else {
          return f.call(null, a__9476, b__9478)
        }
      }else {
        var c__9480 = cljs.core._first.call(null, args__9479);
        var args__9481 = cljs.core._rest.call(null, args__9479);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__9476, b__9478, c__9480)
          }else {
            return f.call(null, a__9476, b__9478, c__9480)
          }
        }else {
          var d__9482 = cljs.core._first.call(null, args__9481);
          var args__9483 = cljs.core._rest.call(null, args__9481);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__9476, b__9478, c__9480, d__9482)
            }else {
              return f.call(null, a__9476, b__9478, c__9480, d__9482)
            }
          }else {
            var e__9484 = cljs.core._first.call(null, args__9483);
            var args__9485 = cljs.core._rest.call(null, args__9483);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__9476, b__9478, c__9480, d__9482, e__9484)
              }else {
                return f.call(null, a__9476, b__9478, c__9480, d__9482, e__9484)
              }
            }else {
              var f__9486 = cljs.core._first.call(null, args__9485);
              var args__9487 = cljs.core._rest.call(null, args__9485);
              if(argc === 6) {
                if(f__9486.cljs$lang$arity$6) {
                  return f__9486.cljs$lang$arity$6(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486)
                }else {
                  return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486)
                }
              }else {
                var g__9488 = cljs.core._first.call(null, args__9487);
                var args__9489 = cljs.core._rest.call(null, args__9487);
                if(argc === 7) {
                  if(f__9486.cljs$lang$arity$7) {
                    return f__9486.cljs$lang$arity$7(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488)
                  }else {
                    return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488)
                  }
                }else {
                  var h__9490 = cljs.core._first.call(null, args__9489);
                  var args__9491 = cljs.core._rest.call(null, args__9489);
                  if(argc === 8) {
                    if(f__9486.cljs$lang$arity$8) {
                      return f__9486.cljs$lang$arity$8(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490)
                    }else {
                      return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490)
                    }
                  }else {
                    var i__9492 = cljs.core._first.call(null, args__9491);
                    var args__9493 = cljs.core._rest.call(null, args__9491);
                    if(argc === 9) {
                      if(f__9486.cljs$lang$arity$9) {
                        return f__9486.cljs$lang$arity$9(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492)
                      }else {
                        return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492)
                      }
                    }else {
                      var j__9494 = cljs.core._first.call(null, args__9493);
                      var args__9495 = cljs.core._rest.call(null, args__9493);
                      if(argc === 10) {
                        if(f__9486.cljs$lang$arity$10) {
                          return f__9486.cljs$lang$arity$10(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494)
                        }else {
                          return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494)
                        }
                      }else {
                        var k__9496 = cljs.core._first.call(null, args__9495);
                        var args__9497 = cljs.core._rest.call(null, args__9495);
                        if(argc === 11) {
                          if(f__9486.cljs$lang$arity$11) {
                            return f__9486.cljs$lang$arity$11(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496)
                          }else {
                            return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496)
                          }
                        }else {
                          var l__9498 = cljs.core._first.call(null, args__9497);
                          var args__9499 = cljs.core._rest.call(null, args__9497);
                          if(argc === 12) {
                            if(f__9486.cljs$lang$arity$12) {
                              return f__9486.cljs$lang$arity$12(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498)
                            }else {
                              return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498)
                            }
                          }else {
                            var m__9500 = cljs.core._first.call(null, args__9499);
                            var args__9501 = cljs.core._rest.call(null, args__9499);
                            if(argc === 13) {
                              if(f__9486.cljs$lang$arity$13) {
                                return f__9486.cljs$lang$arity$13(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500)
                              }else {
                                return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500)
                              }
                            }else {
                              var n__9502 = cljs.core._first.call(null, args__9501);
                              var args__9503 = cljs.core._rest.call(null, args__9501);
                              if(argc === 14) {
                                if(f__9486.cljs$lang$arity$14) {
                                  return f__9486.cljs$lang$arity$14(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502)
                                }else {
                                  return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502)
                                }
                              }else {
                                var o__9504 = cljs.core._first.call(null, args__9503);
                                var args__9505 = cljs.core._rest.call(null, args__9503);
                                if(argc === 15) {
                                  if(f__9486.cljs$lang$arity$15) {
                                    return f__9486.cljs$lang$arity$15(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502, o__9504)
                                  }else {
                                    return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502, o__9504)
                                  }
                                }else {
                                  var p__9506 = cljs.core._first.call(null, args__9505);
                                  var args__9507 = cljs.core._rest.call(null, args__9505);
                                  if(argc === 16) {
                                    if(f__9486.cljs$lang$arity$16) {
                                      return f__9486.cljs$lang$arity$16(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502, o__9504, p__9506)
                                    }else {
                                      return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502, o__9504, p__9506)
                                    }
                                  }else {
                                    var q__9508 = cljs.core._first.call(null, args__9507);
                                    var args__9509 = cljs.core._rest.call(null, args__9507);
                                    if(argc === 17) {
                                      if(f__9486.cljs$lang$arity$17) {
                                        return f__9486.cljs$lang$arity$17(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502, o__9504, p__9506, q__9508)
                                      }else {
                                        return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502, o__9504, p__9506, q__9508)
                                      }
                                    }else {
                                      var r__9510 = cljs.core._first.call(null, args__9509);
                                      var args__9511 = cljs.core._rest.call(null, args__9509);
                                      if(argc === 18) {
                                        if(f__9486.cljs$lang$arity$18) {
                                          return f__9486.cljs$lang$arity$18(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502, o__9504, p__9506, q__9508, r__9510)
                                        }else {
                                          return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502, o__9504, p__9506, q__9508, r__9510)
                                        }
                                      }else {
                                        var s__9512 = cljs.core._first.call(null, args__9511);
                                        var args__9513 = cljs.core._rest.call(null, args__9511);
                                        if(argc === 19) {
                                          if(f__9486.cljs$lang$arity$19) {
                                            return f__9486.cljs$lang$arity$19(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502, o__9504, p__9506, q__9508, r__9510, s__9512)
                                          }else {
                                            return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502, o__9504, p__9506, q__9508, r__9510, s__9512)
                                          }
                                        }else {
                                          var t__9514 = cljs.core._first.call(null, args__9513);
                                          var args__9515 = cljs.core._rest.call(null, args__9513);
                                          if(argc === 20) {
                                            if(f__9486.cljs$lang$arity$20) {
                                              return f__9486.cljs$lang$arity$20(a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502, o__9504, p__9506, q__9508, r__9510, s__9512, t__9514)
                                            }else {
                                              return f__9486.call(null, a__9476, b__9478, c__9480, d__9482, e__9484, f__9486, g__9488, h__9490, i__9492, j__9494, k__9496, l__9498, m__9500, n__9502, o__9504, p__9506, q__9508, r__9510, s__9512, t__9514)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__9530 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9531 = cljs.core.bounded_count.call(null, args, fixed_arity__9530 + 1);
      if(bc__9531 <= fixed_arity__9530) {
        return cljs.core.apply_to.call(null, f, bc__9531, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__9532 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__9533 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9534 = cljs.core.bounded_count.call(null, arglist__9532, fixed_arity__9533 + 1);
      if(bc__9534 <= fixed_arity__9533) {
        return cljs.core.apply_to.call(null, f, bc__9534, arglist__9532)
      }else {
        return f.cljs$lang$applyTo(arglist__9532)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9532))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__9535 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__9536 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9537 = cljs.core.bounded_count.call(null, arglist__9535, fixed_arity__9536 + 1);
      if(bc__9537 <= fixed_arity__9536) {
        return cljs.core.apply_to.call(null, f, bc__9537, arglist__9535)
      }else {
        return f.cljs$lang$applyTo(arglist__9535)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9535))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__9538 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__9539 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9540 = cljs.core.bounded_count.call(null, arglist__9538, fixed_arity__9539 + 1);
      if(bc__9540 <= fixed_arity__9539) {
        return cljs.core.apply_to.call(null, f, bc__9540, arglist__9538)
      }else {
        return f.cljs$lang$applyTo(arglist__9538)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9538))
    }
  };
  var apply__6 = function() {
    var G__9544__delegate = function(f, a, b, c, d, args) {
      var arglist__9541 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__9542 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__9543 = cljs.core.bounded_count.call(null, arglist__9541, fixed_arity__9542 + 1);
        if(bc__9543 <= fixed_arity__9542) {
          return cljs.core.apply_to.call(null, f, bc__9543, arglist__9541)
        }else {
          return f.cljs$lang$applyTo(arglist__9541)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__9541))
      }
    };
    var G__9544 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9544__delegate.call(this, f, a, b, c, d, args)
    };
    G__9544.cljs$lang$maxFixedArity = 5;
    G__9544.cljs$lang$applyTo = function(arglist__9545) {
      var f = cljs.core.first(arglist__9545);
      var a = cljs.core.first(cljs.core.next(arglist__9545));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9545)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9545))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9545)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9545)))));
      return G__9544__delegate(f, a, b, c, d, args)
    };
    G__9544.cljs$lang$arity$variadic = G__9544__delegate;
    return G__9544
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__9546) {
    var obj = cljs.core.first(arglist__9546);
    var f = cljs.core.first(cljs.core.next(arglist__9546));
    var args = cljs.core.rest(cljs.core.next(arglist__9546));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__9547__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__9547 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9547__delegate.call(this, x, y, more)
    };
    G__9547.cljs$lang$maxFixedArity = 2;
    G__9547.cljs$lang$applyTo = function(arglist__9548) {
      var x = cljs.core.first(arglist__9548);
      var y = cljs.core.first(cljs.core.next(arglist__9548));
      var more = cljs.core.rest(cljs.core.next(arglist__9548));
      return G__9547__delegate(x, y, more)
    };
    G__9547.cljs$lang$arity$variadic = G__9547__delegate;
    return G__9547
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__9549 = pred;
        var G__9550 = cljs.core.next.call(null, coll);
        pred = G__9549;
        coll = G__9550;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____9552 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____9552)) {
        return or__3824__auto____9552
      }else {
        var G__9553 = pred;
        var G__9554 = cljs.core.next.call(null, coll);
        pred = G__9553;
        coll = G__9554;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__9555 = null;
    var G__9555__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__9555__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__9555__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__9555__3 = function() {
      var G__9556__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__9556 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__9556__delegate.call(this, x, y, zs)
      };
      G__9556.cljs$lang$maxFixedArity = 2;
      G__9556.cljs$lang$applyTo = function(arglist__9557) {
        var x = cljs.core.first(arglist__9557);
        var y = cljs.core.first(cljs.core.next(arglist__9557));
        var zs = cljs.core.rest(cljs.core.next(arglist__9557));
        return G__9556__delegate(x, y, zs)
      };
      G__9556.cljs$lang$arity$variadic = G__9556__delegate;
      return G__9556
    }();
    G__9555 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__9555__0.call(this);
        case 1:
          return G__9555__1.call(this, x);
        case 2:
          return G__9555__2.call(this, x, y);
        default:
          return G__9555__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__9555.cljs$lang$maxFixedArity = 2;
    G__9555.cljs$lang$applyTo = G__9555__3.cljs$lang$applyTo;
    return G__9555
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__9558__delegate = function(args) {
      return x
    };
    var G__9558 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9558__delegate.call(this, args)
    };
    G__9558.cljs$lang$maxFixedArity = 0;
    G__9558.cljs$lang$applyTo = function(arglist__9559) {
      var args = cljs.core.seq(arglist__9559);
      return G__9558__delegate(args)
    };
    G__9558.cljs$lang$arity$variadic = G__9558__delegate;
    return G__9558
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__9566 = null;
      var G__9566__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__9566__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__9566__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__9566__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__9566__4 = function() {
        var G__9567__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9567 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9567__delegate.call(this, x, y, z, args)
        };
        G__9567.cljs$lang$maxFixedArity = 3;
        G__9567.cljs$lang$applyTo = function(arglist__9568) {
          var x = cljs.core.first(arglist__9568);
          var y = cljs.core.first(cljs.core.next(arglist__9568));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9568)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9568)));
          return G__9567__delegate(x, y, z, args)
        };
        G__9567.cljs$lang$arity$variadic = G__9567__delegate;
        return G__9567
      }();
      G__9566 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9566__0.call(this);
          case 1:
            return G__9566__1.call(this, x);
          case 2:
            return G__9566__2.call(this, x, y);
          case 3:
            return G__9566__3.call(this, x, y, z);
          default:
            return G__9566__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9566.cljs$lang$maxFixedArity = 3;
      G__9566.cljs$lang$applyTo = G__9566__4.cljs$lang$applyTo;
      return G__9566
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__9569 = null;
      var G__9569__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__9569__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__9569__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__9569__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__9569__4 = function() {
        var G__9570__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__9570 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9570__delegate.call(this, x, y, z, args)
        };
        G__9570.cljs$lang$maxFixedArity = 3;
        G__9570.cljs$lang$applyTo = function(arglist__9571) {
          var x = cljs.core.first(arglist__9571);
          var y = cljs.core.first(cljs.core.next(arglist__9571));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9571)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9571)));
          return G__9570__delegate(x, y, z, args)
        };
        G__9570.cljs$lang$arity$variadic = G__9570__delegate;
        return G__9570
      }();
      G__9569 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9569__0.call(this);
          case 1:
            return G__9569__1.call(this, x);
          case 2:
            return G__9569__2.call(this, x, y);
          case 3:
            return G__9569__3.call(this, x, y, z);
          default:
            return G__9569__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9569.cljs$lang$maxFixedArity = 3;
      G__9569.cljs$lang$applyTo = G__9569__4.cljs$lang$applyTo;
      return G__9569
    }()
  };
  var comp__4 = function() {
    var G__9572__delegate = function(f1, f2, f3, fs) {
      var fs__9563 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__9573__delegate = function(args) {
          var ret__9564 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__9563), args);
          var fs__9565 = cljs.core.next.call(null, fs__9563);
          while(true) {
            if(fs__9565) {
              var G__9574 = cljs.core.first.call(null, fs__9565).call(null, ret__9564);
              var G__9575 = cljs.core.next.call(null, fs__9565);
              ret__9564 = G__9574;
              fs__9565 = G__9575;
              continue
            }else {
              return ret__9564
            }
            break
          }
        };
        var G__9573 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__9573__delegate.call(this, args)
        };
        G__9573.cljs$lang$maxFixedArity = 0;
        G__9573.cljs$lang$applyTo = function(arglist__9576) {
          var args = cljs.core.seq(arglist__9576);
          return G__9573__delegate(args)
        };
        G__9573.cljs$lang$arity$variadic = G__9573__delegate;
        return G__9573
      }()
    };
    var G__9572 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9572__delegate.call(this, f1, f2, f3, fs)
    };
    G__9572.cljs$lang$maxFixedArity = 3;
    G__9572.cljs$lang$applyTo = function(arglist__9577) {
      var f1 = cljs.core.first(arglist__9577);
      var f2 = cljs.core.first(cljs.core.next(arglist__9577));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9577)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9577)));
      return G__9572__delegate(f1, f2, f3, fs)
    };
    G__9572.cljs$lang$arity$variadic = G__9572__delegate;
    return G__9572
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__9578__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__9578 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9578__delegate.call(this, args)
      };
      G__9578.cljs$lang$maxFixedArity = 0;
      G__9578.cljs$lang$applyTo = function(arglist__9579) {
        var args = cljs.core.seq(arglist__9579);
        return G__9578__delegate(args)
      };
      G__9578.cljs$lang$arity$variadic = G__9578__delegate;
      return G__9578
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__9580__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__9580 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9580__delegate.call(this, args)
      };
      G__9580.cljs$lang$maxFixedArity = 0;
      G__9580.cljs$lang$applyTo = function(arglist__9581) {
        var args = cljs.core.seq(arglist__9581);
        return G__9580__delegate(args)
      };
      G__9580.cljs$lang$arity$variadic = G__9580__delegate;
      return G__9580
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__9582__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__9582 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9582__delegate.call(this, args)
      };
      G__9582.cljs$lang$maxFixedArity = 0;
      G__9582.cljs$lang$applyTo = function(arglist__9583) {
        var args = cljs.core.seq(arglist__9583);
        return G__9582__delegate(args)
      };
      G__9582.cljs$lang$arity$variadic = G__9582__delegate;
      return G__9582
    }()
  };
  var partial__5 = function() {
    var G__9584__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__9585__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__9585 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__9585__delegate.call(this, args)
        };
        G__9585.cljs$lang$maxFixedArity = 0;
        G__9585.cljs$lang$applyTo = function(arglist__9586) {
          var args = cljs.core.seq(arglist__9586);
          return G__9585__delegate(args)
        };
        G__9585.cljs$lang$arity$variadic = G__9585__delegate;
        return G__9585
      }()
    };
    var G__9584 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9584__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__9584.cljs$lang$maxFixedArity = 4;
    G__9584.cljs$lang$applyTo = function(arglist__9587) {
      var f = cljs.core.first(arglist__9587);
      var arg1 = cljs.core.first(cljs.core.next(arglist__9587));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9587)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9587))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9587))));
      return G__9584__delegate(f, arg1, arg2, arg3, more)
    };
    G__9584.cljs$lang$arity$variadic = G__9584__delegate;
    return G__9584
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__9588 = null;
      var G__9588__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__9588__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__9588__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__9588__4 = function() {
        var G__9589__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__9589 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9589__delegate.call(this, a, b, c, ds)
        };
        G__9589.cljs$lang$maxFixedArity = 3;
        G__9589.cljs$lang$applyTo = function(arglist__9590) {
          var a = cljs.core.first(arglist__9590);
          var b = cljs.core.first(cljs.core.next(arglist__9590));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9590)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9590)));
          return G__9589__delegate(a, b, c, ds)
        };
        G__9589.cljs$lang$arity$variadic = G__9589__delegate;
        return G__9589
      }();
      G__9588 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__9588__1.call(this, a);
          case 2:
            return G__9588__2.call(this, a, b);
          case 3:
            return G__9588__3.call(this, a, b, c);
          default:
            return G__9588__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9588.cljs$lang$maxFixedArity = 3;
      G__9588.cljs$lang$applyTo = G__9588__4.cljs$lang$applyTo;
      return G__9588
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__9591 = null;
      var G__9591__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__9591__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__9591__4 = function() {
        var G__9592__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__9592 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9592__delegate.call(this, a, b, c, ds)
        };
        G__9592.cljs$lang$maxFixedArity = 3;
        G__9592.cljs$lang$applyTo = function(arglist__9593) {
          var a = cljs.core.first(arglist__9593);
          var b = cljs.core.first(cljs.core.next(arglist__9593));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9593)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9593)));
          return G__9592__delegate(a, b, c, ds)
        };
        G__9592.cljs$lang$arity$variadic = G__9592__delegate;
        return G__9592
      }();
      G__9591 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__9591__2.call(this, a, b);
          case 3:
            return G__9591__3.call(this, a, b, c);
          default:
            return G__9591__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9591.cljs$lang$maxFixedArity = 3;
      G__9591.cljs$lang$applyTo = G__9591__4.cljs$lang$applyTo;
      return G__9591
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__9594 = null;
      var G__9594__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__9594__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__9594__4 = function() {
        var G__9595__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__9595 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9595__delegate.call(this, a, b, c, ds)
        };
        G__9595.cljs$lang$maxFixedArity = 3;
        G__9595.cljs$lang$applyTo = function(arglist__9596) {
          var a = cljs.core.first(arglist__9596);
          var b = cljs.core.first(cljs.core.next(arglist__9596));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9596)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9596)));
          return G__9595__delegate(a, b, c, ds)
        };
        G__9595.cljs$lang$arity$variadic = G__9595__delegate;
        return G__9595
      }();
      G__9594 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__9594__2.call(this, a, b);
          case 3:
            return G__9594__3.call(this, a, b, c);
          default:
            return G__9594__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9594.cljs$lang$maxFixedArity = 3;
      G__9594.cljs$lang$applyTo = G__9594__4.cljs$lang$applyTo;
      return G__9594
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__9612 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9620 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9620) {
        var s__9621 = temp__3974__auto____9620;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__9621)) {
          var c__9622 = cljs.core.chunk_first.call(null, s__9621);
          var size__9623 = cljs.core.count.call(null, c__9622);
          var b__9624 = cljs.core.chunk_buffer.call(null, size__9623);
          var n__1028__auto____9625 = size__9623;
          var i__9626 = 0;
          while(true) {
            if(i__9626 < n__1028__auto____9625) {
              cljs.core.chunk_append.call(null, b__9624, f.call(null, idx + i__9626, cljs.core._nth.call(null, c__9622, i__9626)));
              var G__9627 = i__9626 + 1;
              i__9626 = G__9627;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__9624), mapi.call(null, idx + size__9623, cljs.core.chunk_rest.call(null, s__9621)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__9621)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__9621)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__9612.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9637 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9637) {
      var s__9638 = temp__3974__auto____9637;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__9638)) {
        var c__9639 = cljs.core.chunk_first.call(null, s__9638);
        var size__9640 = cljs.core.count.call(null, c__9639);
        var b__9641 = cljs.core.chunk_buffer.call(null, size__9640);
        var n__1028__auto____9642 = size__9640;
        var i__9643 = 0;
        while(true) {
          if(i__9643 < n__1028__auto____9642) {
            var x__9644 = f.call(null, cljs.core._nth.call(null, c__9639, i__9643));
            if(x__9644 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__9641, x__9644)
            }
            var G__9646 = i__9643 + 1;
            i__9643 = G__9646;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__9641), keep.call(null, f, cljs.core.chunk_rest.call(null, s__9638)))
      }else {
        var x__9645 = f.call(null, cljs.core.first.call(null, s__9638));
        if(x__9645 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__9638))
        }else {
          return cljs.core.cons.call(null, x__9645, keep.call(null, f, cljs.core.rest.call(null, s__9638)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__9672 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9682 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9682) {
        var s__9683 = temp__3974__auto____9682;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__9683)) {
          var c__9684 = cljs.core.chunk_first.call(null, s__9683);
          var size__9685 = cljs.core.count.call(null, c__9684);
          var b__9686 = cljs.core.chunk_buffer.call(null, size__9685);
          var n__1028__auto____9687 = size__9685;
          var i__9688 = 0;
          while(true) {
            if(i__9688 < n__1028__auto____9687) {
              var x__9689 = f.call(null, idx + i__9688, cljs.core._nth.call(null, c__9684, i__9688));
              if(x__9689 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__9686, x__9689)
              }
              var G__9691 = i__9688 + 1;
              i__9688 = G__9691;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__9686), keepi.call(null, idx + size__9685, cljs.core.chunk_rest.call(null, s__9683)))
        }else {
          var x__9690 = f.call(null, idx, cljs.core.first.call(null, s__9683));
          if(x__9690 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__9683))
          }else {
            return cljs.core.cons.call(null, x__9690, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__9683)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__9672.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9777 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9777)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____9777
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9778 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9778)) {
            var and__3822__auto____9779 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____9779)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____9779
            }
          }else {
            return and__3822__auto____9778
          }
        }())
      };
      var ep1__4 = function() {
        var G__9848__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____9780 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____9780)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____9780
            }
          }())
        };
        var G__9848 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9848__delegate.call(this, x, y, z, args)
        };
        G__9848.cljs$lang$maxFixedArity = 3;
        G__9848.cljs$lang$applyTo = function(arglist__9849) {
          var x = cljs.core.first(arglist__9849);
          var y = cljs.core.first(cljs.core.next(arglist__9849));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9849)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9849)));
          return G__9848__delegate(x, y, z, args)
        };
        G__9848.cljs$lang$arity$variadic = G__9848__delegate;
        return G__9848
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9792 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9792)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____9792
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9793 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9793)) {
            var and__3822__auto____9794 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____9794)) {
              var and__3822__auto____9795 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____9795)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____9795
              }
            }else {
              return and__3822__auto____9794
            }
          }else {
            return and__3822__auto____9793
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9796 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9796)) {
            var and__3822__auto____9797 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____9797)) {
              var and__3822__auto____9798 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____9798)) {
                var and__3822__auto____9799 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____9799)) {
                  var and__3822__auto____9800 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____9800)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____9800
                  }
                }else {
                  return and__3822__auto____9799
                }
              }else {
                return and__3822__auto____9798
              }
            }else {
              return and__3822__auto____9797
            }
          }else {
            return and__3822__auto____9796
          }
        }())
      };
      var ep2__4 = function() {
        var G__9850__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____9801 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____9801)) {
              return cljs.core.every_QMARK_.call(null, function(p1__9647_SHARP_) {
                var and__3822__auto____9802 = p1.call(null, p1__9647_SHARP_);
                if(cljs.core.truth_(and__3822__auto____9802)) {
                  return p2.call(null, p1__9647_SHARP_)
                }else {
                  return and__3822__auto____9802
                }
              }, args)
            }else {
              return and__3822__auto____9801
            }
          }())
        };
        var G__9850 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9850__delegate.call(this, x, y, z, args)
        };
        G__9850.cljs$lang$maxFixedArity = 3;
        G__9850.cljs$lang$applyTo = function(arglist__9851) {
          var x = cljs.core.first(arglist__9851);
          var y = cljs.core.first(cljs.core.next(arglist__9851));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9851)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9851)));
          return G__9850__delegate(x, y, z, args)
        };
        G__9850.cljs$lang$arity$variadic = G__9850__delegate;
        return G__9850
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9821 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9821)) {
            var and__3822__auto____9822 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9822)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____9822
            }
          }else {
            return and__3822__auto____9821
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9823 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9823)) {
            var and__3822__auto____9824 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9824)) {
              var and__3822__auto____9825 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____9825)) {
                var and__3822__auto____9826 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____9826)) {
                  var and__3822__auto____9827 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____9827)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____9827
                  }
                }else {
                  return and__3822__auto____9826
                }
              }else {
                return and__3822__auto____9825
              }
            }else {
              return and__3822__auto____9824
            }
          }else {
            return and__3822__auto____9823
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9828 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9828)) {
            var and__3822__auto____9829 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9829)) {
              var and__3822__auto____9830 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____9830)) {
                var and__3822__auto____9831 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____9831)) {
                  var and__3822__auto____9832 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____9832)) {
                    var and__3822__auto____9833 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____9833)) {
                      var and__3822__auto____9834 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____9834)) {
                        var and__3822__auto____9835 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____9835)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____9835
                        }
                      }else {
                        return and__3822__auto____9834
                      }
                    }else {
                      return and__3822__auto____9833
                    }
                  }else {
                    return and__3822__auto____9832
                  }
                }else {
                  return and__3822__auto____9831
                }
              }else {
                return and__3822__auto____9830
              }
            }else {
              return and__3822__auto____9829
            }
          }else {
            return and__3822__auto____9828
          }
        }())
      };
      var ep3__4 = function() {
        var G__9852__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____9836 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____9836)) {
              return cljs.core.every_QMARK_.call(null, function(p1__9648_SHARP_) {
                var and__3822__auto____9837 = p1.call(null, p1__9648_SHARP_);
                if(cljs.core.truth_(and__3822__auto____9837)) {
                  var and__3822__auto____9838 = p2.call(null, p1__9648_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____9838)) {
                    return p3.call(null, p1__9648_SHARP_)
                  }else {
                    return and__3822__auto____9838
                  }
                }else {
                  return and__3822__auto____9837
                }
              }, args)
            }else {
              return and__3822__auto____9836
            }
          }())
        };
        var G__9852 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9852__delegate.call(this, x, y, z, args)
        };
        G__9852.cljs$lang$maxFixedArity = 3;
        G__9852.cljs$lang$applyTo = function(arglist__9853) {
          var x = cljs.core.first(arglist__9853);
          var y = cljs.core.first(cljs.core.next(arglist__9853));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9853)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9853)));
          return G__9852__delegate(x, y, z, args)
        };
        G__9852.cljs$lang$arity$variadic = G__9852__delegate;
        return G__9852
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__9854__delegate = function(p1, p2, p3, ps) {
      var ps__9839 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__9649_SHARP_) {
            return p1__9649_SHARP_.call(null, x)
          }, ps__9839)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__9650_SHARP_) {
            var and__3822__auto____9844 = p1__9650_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9844)) {
              return p1__9650_SHARP_.call(null, y)
            }else {
              return and__3822__auto____9844
            }
          }, ps__9839)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__9651_SHARP_) {
            var and__3822__auto____9845 = p1__9651_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9845)) {
              var and__3822__auto____9846 = p1__9651_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____9846)) {
                return p1__9651_SHARP_.call(null, z)
              }else {
                return and__3822__auto____9846
              }
            }else {
              return and__3822__auto____9845
            }
          }, ps__9839)
        };
        var epn__4 = function() {
          var G__9855__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____9847 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____9847)) {
                return cljs.core.every_QMARK_.call(null, function(p1__9652_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__9652_SHARP_, args)
                }, ps__9839)
              }else {
                return and__3822__auto____9847
              }
            }())
          };
          var G__9855 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9855__delegate.call(this, x, y, z, args)
          };
          G__9855.cljs$lang$maxFixedArity = 3;
          G__9855.cljs$lang$applyTo = function(arglist__9856) {
            var x = cljs.core.first(arglist__9856);
            var y = cljs.core.first(cljs.core.next(arglist__9856));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9856)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9856)));
            return G__9855__delegate(x, y, z, args)
          };
          G__9855.cljs$lang$arity$variadic = G__9855__delegate;
          return G__9855
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__9854 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9854__delegate.call(this, p1, p2, p3, ps)
    };
    G__9854.cljs$lang$maxFixedArity = 3;
    G__9854.cljs$lang$applyTo = function(arglist__9857) {
      var p1 = cljs.core.first(arglist__9857);
      var p2 = cljs.core.first(cljs.core.next(arglist__9857));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9857)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9857)));
      return G__9854__delegate(p1, p2, p3, ps)
    };
    G__9854.cljs$lang$arity$variadic = G__9854__delegate;
    return G__9854
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____9938 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9938)) {
          return or__3824__auto____9938
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____9939 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9939)) {
          return or__3824__auto____9939
        }else {
          var or__3824__auto____9940 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9940)) {
            return or__3824__auto____9940
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__10009__delegate = function(x, y, z, args) {
          var or__3824__auto____9941 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9941)) {
            return or__3824__auto____9941
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__10009 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10009__delegate.call(this, x, y, z, args)
        };
        G__10009.cljs$lang$maxFixedArity = 3;
        G__10009.cljs$lang$applyTo = function(arglist__10010) {
          var x = cljs.core.first(arglist__10010);
          var y = cljs.core.first(cljs.core.next(arglist__10010));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10010)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10010)));
          return G__10009__delegate(x, y, z, args)
        };
        G__10009.cljs$lang$arity$variadic = G__10009__delegate;
        return G__10009
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____9953 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9953)) {
          return or__3824__auto____9953
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____9954 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9954)) {
          return or__3824__auto____9954
        }else {
          var or__3824__auto____9955 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9955)) {
            return or__3824__auto____9955
          }else {
            var or__3824__auto____9956 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9956)) {
              return or__3824__auto____9956
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____9957 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9957)) {
          return or__3824__auto____9957
        }else {
          var or__3824__auto____9958 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9958)) {
            return or__3824__auto____9958
          }else {
            var or__3824__auto____9959 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____9959)) {
              return or__3824__auto____9959
            }else {
              var or__3824__auto____9960 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____9960)) {
                return or__3824__auto____9960
              }else {
                var or__3824__auto____9961 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9961)) {
                  return or__3824__auto____9961
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__10011__delegate = function(x, y, z, args) {
          var or__3824__auto____9962 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9962)) {
            return or__3824__auto____9962
          }else {
            return cljs.core.some.call(null, function(p1__9692_SHARP_) {
              var or__3824__auto____9963 = p1.call(null, p1__9692_SHARP_);
              if(cljs.core.truth_(or__3824__auto____9963)) {
                return or__3824__auto____9963
              }else {
                return p2.call(null, p1__9692_SHARP_)
              }
            }, args)
          }
        };
        var G__10011 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10011__delegate.call(this, x, y, z, args)
        };
        G__10011.cljs$lang$maxFixedArity = 3;
        G__10011.cljs$lang$applyTo = function(arglist__10012) {
          var x = cljs.core.first(arglist__10012);
          var y = cljs.core.first(cljs.core.next(arglist__10012));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10012)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10012)));
          return G__10011__delegate(x, y, z, args)
        };
        G__10011.cljs$lang$arity$variadic = G__10011__delegate;
        return G__10011
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____9982 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9982)) {
          return or__3824__auto____9982
        }else {
          var or__3824__auto____9983 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9983)) {
            return or__3824__auto____9983
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____9984 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9984)) {
          return or__3824__auto____9984
        }else {
          var or__3824__auto____9985 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9985)) {
            return or__3824__auto____9985
          }else {
            var or__3824__auto____9986 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9986)) {
              return or__3824__auto____9986
            }else {
              var or__3824__auto____9987 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9987)) {
                return or__3824__auto____9987
              }else {
                var or__3824__auto____9988 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9988)) {
                  return or__3824__auto____9988
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____9989 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9989)) {
          return or__3824__auto____9989
        }else {
          var or__3824__auto____9990 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9990)) {
            return or__3824__auto____9990
          }else {
            var or__3824__auto____9991 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9991)) {
              return or__3824__auto____9991
            }else {
              var or__3824__auto____9992 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9992)) {
                return or__3824__auto____9992
              }else {
                var or__3824__auto____9993 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9993)) {
                  return or__3824__auto____9993
                }else {
                  var or__3824__auto____9994 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____9994)) {
                    return or__3824__auto____9994
                  }else {
                    var or__3824__auto____9995 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____9995)) {
                      return or__3824__auto____9995
                    }else {
                      var or__3824__auto____9996 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____9996)) {
                        return or__3824__auto____9996
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__10013__delegate = function(x, y, z, args) {
          var or__3824__auto____9997 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9997)) {
            return or__3824__auto____9997
          }else {
            return cljs.core.some.call(null, function(p1__9693_SHARP_) {
              var or__3824__auto____9998 = p1.call(null, p1__9693_SHARP_);
              if(cljs.core.truth_(or__3824__auto____9998)) {
                return or__3824__auto____9998
              }else {
                var or__3824__auto____9999 = p2.call(null, p1__9693_SHARP_);
                if(cljs.core.truth_(or__3824__auto____9999)) {
                  return or__3824__auto____9999
                }else {
                  return p3.call(null, p1__9693_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__10013 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10013__delegate.call(this, x, y, z, args)
        };
        G__10013.cljs$lang$maxFixedArity = 3;
        G__10013.cljs$lang$applyTo = function(arglist__10014) {
          var x = cljs.core.first(arglist__10014);
          var y = cljs.core.first(cljs.core.next(arglist__10014));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10014)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10014)));
          return G__10013__delegate(x, y, z, args)
        };
        G__10013.cljs$lang$arity$variadic = G__10013__delegate;
        return G__10013
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__10015__delegate = function(p1, p2, p3, ps) {
      var ps__10000 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__9694_SHARP_) {
            return p1__9694_SHARP_.call(null, x)
          }, ps__10000)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__9695_SHARP_) {
            var or__3824__auto____10005 = p1__9695_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____10005)) {
              return or__3824__auto____10005
            }else {
              return p1__9695_SHARP_.call(null, y)
            }
          }, ps__10000)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__9696_SHARP_) {
            var or__3824__auto____10006 = p1__9696_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____10006)) {
              return or__3824__auto____10006
            }else {
              var or__3824__auto____10007 = p1__9696_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____10007)) {
                return or__3824__auto____10007
              }else {
                return p1__9696_SHARP_.call(null, z)
              }
            }
          }, ps__10000)
        };
        var spn__4 = function() {
          var G__10016__delegate = function(x, y, z, args) {
            var or__3824__auto____10008 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____10008)) {
              return or__3824__auto____10008
            }else {
              return cljs.core.some.call(null, function(p1__9697_SHARP_) {
                return cljs.core.some.call(null, p1__9697_SHARP_, args)
              }, ps__10000)
            }
          };
          var G__10016 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10016__delegate.call(this, x, y, z, args)
          };
          G__10016.cljs$lang$maxFixedArity = 3;
          G__10016.cljs$lang$applyTo = function(arglist__10017) {
            var x = cljs.core.first(arglist__10017);
            var y = cljs.core.first(cljs.core.next(arglist__10017));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10017)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10017)));
            return G__10016__delegate(x, y, z, args)
          };
          G__10016.cljs$lang$arity$variadic = G__10016__delegate;
          return G__10016
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__10015 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10015__delegate.call(this, p1, p2, p3, ps)
    };
    G__10015.cljs$lang$maxFixedArity = 3;
    G__10015.cljs$lang$applyTo = function(arglist__10018) {
      var p1 = cljs.core.first(arglist__10018);
      var p2 = cljs.core.first(cljs.core.next(arglist__10018));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10018)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10018)));
      return G__10015__delegate(p1, p2, p3, ps)
    };
    G__10015.cljs$lang$arity$variadic = G__10015__delegate;
    return G__10015
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10037 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10037) {
        var s__10038 = temp__3974__auto____10037;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__10038)) {
          var c__10039 = cljs.core.chunk_first.call(null, s__10038);
          var size__10040 = cljs.core.count.call(null, c__10039);
          var b__10041 = cljs.core.chunk_buffer.call(null, size__10040);
          var n__1028__auto____10042 = size__10040;
          var i__10043 = 0;
          while(true) {
            if(i__10043 < n__1028__auto____10042) {
              cljs.core.chunk_append.call(null, b__10041, f.call(null, cljs.core._nth.call(null, c__10039, i__10043)));
              var G__10055 = i__10043 + 1;
              i__10043 = G__10055;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__10041), map.call(null, f, cljs.core.chunk_rest.call(null, s__10038)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__10038)), map.call(null, f, cljs.core.rest.call(null, s__10038)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__10044 = cljs.core.seq.call(null, c1);
      var s2__10045 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____10046 = s1__10044;
        if(and__3822__auto____10046) {
          return s2__10045
        }else {
          return and__3822__auto____10046
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__10044), cljs.core.first.call(null, s2__10045)), map.call(null, f, cljs.core.rest.call(null, s1__10044), cljs.core.rest.call(null, s2__10045)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__10047 = cljs.core.seq.call(null, c1);
      var s2__10048 = cljs.core.seq.call(null, c2);
      var s3__10049 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____10050 = s1__10047;
        if(and__3822__auto____10050) {
          var and__3822__auto____10051 = s2__10048;
          if(and__3822__auto____10051) {
            return s3__10049
          }else {
            return and__3822__auto____10051
          }
        }else {
          return and__3822__auto____10050
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__10047), cljs.core.first.call(null, s2__10048), cljs.core.first.call(null, s3__10049)), map.call(null, f, cljs.core.rest.call(null, s1__10047), cljs.core.rest.call(null, s2__10048), cljs.core.rest.call(null, s3__10049)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__10056__delegate = function(f, c1, c2, c3, colls) {
      var step__10054 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__10053 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__10053)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__10053), step.call(null, map.call(null, cljs.core.rest, ss__10053)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__9858_SHARP_) {
        return cljs.core.apply.call(null, f, p1__9858_SHARP_)
      }, step__10054.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__10056 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__10056__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__10056.cljs$lang$maxFixedArity = 4;
    G__10056.cljs$lang$applyTo = function(arglist__10057) {
      var f = cljs.core.first(arglist__10057);
      var c1 = cljs.core.first(cljs.core.next(arglist__10057));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10057)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10057))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10057))));
      return G__10056__delegate(f, c1, c2, c3, colls)
    };
    G__10056.cljs$lang$arity$variadic = G__10056__delegate;
    return G__10056
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____10060 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10060) {
        var s__10061 = temp__3974__auto____10060;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__10061), take.call(null, n - 1, cljs.core.rest.call(null, s__10061)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__10067 = function(n, coll) {
    while(true) {
      var s__10065 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____10066 = n > 0;
        if(and__3822__auto____10066) {
          return s__10065
        }else {
          return and__3822__auto____10066
        }
      }())) {
        var G__10068 = n - 1;
        var G__10069 = cljs.core.rest.call(null, s__10065);
        n = G__10068;
        coll = G__10069;
        continue
      }else {
        return s__10065
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__10067.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__10072 = cljs.core.seq.call(null, coll);
  var lead__10073 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__10073) {
      var G__10074 = cljs.core.next.call(null, s__10072);
      var G__10075 = cljs.core.next.call(null, lead__10073);
      s__10072 = G__10074;
      lead__10073 = G__10075;
      continue
    }else {
      return s__10072
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__10081 = function(pred, coll) {
    while(true) {
      var s__10079 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____10080 = s__10079;
        if(and__3822__auto____10080) {
          return pred.call(null, cljs.core.first.call(null, s__10079))
        }else {
          return and__3822__auto____10080
        }
      }())) {
        var G__10082 = pred;
        var G__10083 = cljs.core.rest.call(null, s__10079);
        pred = G__10082;
        coll = G__10083;
        continue
      }else {
        return s__10079
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__10081.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10086 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10086) {
      var s__10087 = temp__3974__auto____10086;
      return cljs.core.concat.call(null, s__10087, cycle.call(null, s__10087))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__10092 = cljs.core.seq.call(null, c1);
      var s2__10093 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____10094 = s1__10092;
        if(and__3822__auto____10094) {
          return s2__10093
        }else {
          return and__3822__auto____10094
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__10092), cljs.core.cons.call(null, cljs.core.first.call(null, s2__10093), interleave.call(null, cljs.core.rest.call(null, s1__10092), cljs.core.rest.call(null, s2__10093))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__10096__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__10095 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__10095)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__10095), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__10095)))
        }else {
          return null
        }
      }, null)
    };
    var G__10096 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10096__delegate.call(this, c1, c2, colls)
    };
    G__10096.cljs$lang$maxFixedArity = 2;
    G__10096.cljs$lang$applyTo = function(arglist__10097) {
      var c1 = cljs.core.first(arglist__10097);
      var c2 = cljs.core.first(cljs.core.next(arglist__10097));
      var colls = cljs.core.rest(cljs.core.next(arglist__10097));
      return G__10096__delegate(c1, c2, colls)
    };
    G__10096.cljs$lang$arity$variadic = G__10096__delegate;
    return G__10096
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__10107 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____10105 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____10105) {
        var coll__10106 = temp__3971__auto____10105;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__10106), cat.call(null, cljs.core.rest.call(null, coll__10106), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__10107.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__10108__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__10108 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10108__delegate.call(this, f, coll, colls)
    };
    G__10108.cljs$lang$maxFixedArity = 2;
    G__10108.cljs$lang$applyTo = function(arglist__10109) {
      var f = cljs.core.first(arglist__10109);
      var coll = cljs.core.first(cljs.core.next(arglist__10109));
      var colls = cljs.core.rest(cljs.core.next(arglist__10109));
      return G__10108__delegate(f, coll, colls)
    };
    G__10108.cljs$lang$arity$variadic = G__10108__delegate;
    return G__10108
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10119 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10119) {
      var s__10120 = temp__3974__auto____10119;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__10120)) {
        var c__10121 = cljs.core.chunk_first.call(null, s__10120);
        var size__10122 = cljs.core.count.call(null, c__10121);
        var b__10123 = cljs.core.chunk_buffer.call(null, size__10122);
        var n__1028__auto____10124 = size__10122;
        var i__10125 = 0;
        while(true) {
          if(i__10125 < n__1028__auto____10124) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__10121, i__10125)))) {
              cljs.core.chunk_append.call(null, b__10123, cljs.core._nth.call(null, c__10121, i__10125))
            }else {
            }
            var G__10128 = i__10125 + 1;
            i__10125 = G__10128;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__10123), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__10120)))
      }else {
        var f__10126 = cljs.core.first.call(null, s__10120);
        var r__10127 = cljs.core.rest.call(null, s__10120);
        if(cljs.core.truth_(pred.call(null, f__10126))) {
          return cljs.core.cons.call(null, f__10126, filter.call(null, pred, r__10127))
        }else {
          return filter.call(null, pred, r__10127)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__10131 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__10131.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__10129_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__10129_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__10135__10136 = to;
    if(G__10135__10136) {
      if(function() {
        var or__3824__auto____10137 = G__10135__10136.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____10137) {
          return or__3824__auto____10137
        }else {
          return G__10135__10136.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__10135__10136.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__10135__10136)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__10135__10136)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__10138__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__10138 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__10138__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__10138.cljs$lang$maxFixedArity = 4;
    G__10138.cljs$lang$applyTo = function(arglist__10139) {
      var f = cljs.core.first(arglist__10139);
      var c1 = cljs.core.first(cljs.core.next(arglist__10139));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10139)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10139))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10139))));
      return G__10138__delegate(f, c1, c2, c3, colls)
    };
    G__10138.cljs$lang$arity$variadic = G__10138__delegate;
    return G__10138
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10146 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10146) {
        var s__10147 = temp__3974__auto____10146;
        var p__10148 = cljs.core.take.call(null, n, s__10147);
        if(n === cljs.core.count.call(null, p__10148)) {
          return cljs.core.cons.call(null, p__10148, partition.call(null, n, step, cljs.core.drop.call(null, step, s__10147)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10149 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10149) {
        var s__10150 = temp__3974__auto____10149;
        var p__10151 = cljs.core.take.call(null, n, s__10150);
        if(n === cljs.core.count.call(null, p__10151)) {
          return cljs.core.cons.call(null, p__10151, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__10150)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__10151, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__10156 = cljs.core.lookup_sentinel;
    var m__10157 = m;
    var ks__10158 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__10158) {
        var m__10159 = cljs.core._lookup.call(null, m__10157, cljs.core.first.call(null, ks__10158), sentinel__10156);
        if(sentinel__10156 === m__10159) {
          return not_found
        }else {
          var G__10160 = sentinel__10156;
          var G__10161 = m__10159;
          var G__10162 = cljs.core.next.call(null, ks__10158);
          sentinel__10156 = G__10160;
          m__10157 = G__10161;
          ks__10158 = G__10162;
          continue
        }
      }else {
        return m__10157
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__10163, v) {
  var vec__10168__10169 = p__10163;
  var k__10170 = cljs.core.nth.call(null, vec__10168__10169, 0, null);
  var ks__10171 = cljs.core.nthnext.call(null, vec__10168__10169, 1);
  if(cljs.core.truth_(ks__10171)) {
    return cljs.core.assoc.call(null, m, k__10170, assoc_in.call(null, cljs.core._lookup.call(null, m, k__10170, null), ks__10171, v))
  }else {
    return cljs.core.assoc.call(null, m, k__10170, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__10172, f, args) {
    var vec__10177__10178 = p__10172;
    var k__10179 = cljs.core.nth.call(null, vec__10177__10178, 0, null);
    var ks__10180 = cljs.core.nthnext.call(null, vec__10177__10178, 1);
    if(cljs.core.truth_(ks__10180)) {
      return cljs.core.assoc.call(null, m, k__10179, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__10179, null), ks__10180, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__10179, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__10179, null), args))
    }
  };
  var update_in = function(m, p__10172, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__10172, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__10181) {
    var m = cljs.core.first(arglist__10181);
    var p__10172 = cljs.core.first(cljs.core.next(arglist__10181));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10181)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10181)));
    return update_in__delegate(m, p__10172, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10184 = this;
  var h__693__auto____10185 = this__10184.__hash;
  if(!(h__693__auto____10185 == null)) {
    return h__693__auto____10185
  }else {
    var h__693__auto____10186 = cljs.core.hash_coll.call(null, coll);
    this__10184.__hash = h__693__auto____10186;
    return h__693__auto____10186
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10187 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10188 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10189 = this;
  var new_array__10190 = this__10189.array.slice();
  new_array__10190[k] = v;
  return new cljs.core.Vector(this__10189.meta, new_array__10190, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__10221 = null;
  var G__10221__2 = function(this_sym10191, k) {
    var this__10193 = this;
    var this_sym10191__10194 = this;
    var coll__10195 = this_sym10191__10194;
    return coll__10195.cljs$core$ILookup$_lookup$arity$2(coll__10195, k)
  };
  var G__10221__3 = function(this_sym10192, k, not_found) {
    var this__10193 = this;
    var this_sym10192__10196 = this;
    var coll__10197 = this_sym10192__10196;
    return coll__10197.cljs$core$ILookup$_lookup$arity$3(coll__10197, k, not_found)
  };
  G__10221 = function(this_sym10192, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10221__2.call(this, this_sym10192, k);
      case 3:
        return G__10221__3.call(this, this_sym10192, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10221
}();
cljs.core.Vector.prototype.apply = function(this_sym10182, args10183) {
  var this__10198 = this;
  return this_sym10182.call.apply(this_sym10182, [this_sym10182].concat(args10183.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10199 = this;
  var new_array__10200 = this__10199.array.slice();
  new_array__10200.push(o);
  return new cljs.core.Vector(this__10199.meta, new_array__10200, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__10201 = this;
  var this__10202 = this;
  return cljs.core.pr_str.call(null, this__10202)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__10203 = this;
  return cljs.core.ci_reduce.call(null, this__10203.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__10204 = this;
  return cljs.core.ci_reduce.call(null, this__10204.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10205 = this;
  if(this__10205.array.length > 0) {
    var vector_seq__10206 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__10205.array.length) {
          return cljs.core.cons.call(null, this__10205.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__10206.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10207 = this;
  return this__10207.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10208 = this;
  var count__10209 = this__10208.array.length;
  if(count__10209 > 0) {
    return this__10208.array[count__10209 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10210 = this;
  if(this__10210.array.length > 0) {
    var new_array__10211 = this__10210.array.slice();
    new_array__10211.pop();
    return new cljs.core.Vector(this__10210.meta, new_array__10211, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__10212 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10213 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10214 = this;
  return new cljs.core.Vector(meta, this__10214.array, this__10214.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10215 = this;
  return this__10215.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10216 = this;
  if(function() {
    var and__3822__auto____10217 = 0 <= n;
    if(and__3822__auto____10217) {
      return n < this__10216.array.length
    }else {
      return and__3822__auto____10217
    }
  }()) {
    return this__10216.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10218 = this;
  if(function() {
    var and__3822__auto____10219 = 0 <= n;
    if(and__3822__auto____10219) {
      return n < this__10218.array.length
    }else {
      return and__3822__auto____10219
    }
  }()) {
    return this__10218.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10220 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__10220.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__811__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__10223 = pv.cnt;
  if(cnt__10223 < 32) {
    return 0
  }else {
    return cnt__10223 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__10229 = level;
  var ret__10230 = node;
  while(true) {
    if(ll__10229 === 0) {
      return ret__10230
    }else {
      var embed__10231 = ret__10230;
      var r__10232 = cljs.core.pv_fresh_node.call(null, edit);
      var ___10233 = cljs.core.pv_aset.call(null, r__10232, 0, embed__10231);
      var G__10234 = ll__10229 - 5;
      var G__10235 = r__10232;
      ll__10229 = G__10234;
      ret__10230 = G__10235;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__10241 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__10242 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__10241, subidx__10242, tailnode);
    return ret__10241
  }else {
    var child__10243 = cljs.core.pv_aget.call(null, parent, subidx__10242);
    if(!(child__10243 == null)) {
      var node_to_insert__10244 = push_tail.call(null, pv, level - 5, child__10243, tailnode);
      cljs.core.pv_aset.call(null, ret__10241, subidx__10242, node_to_insert__10244);
      return ret__10241
    }else {
      var node_to_insert__10245 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__10241, subidx__10242, node_to_insert__10245);
      return ret__10241
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____10249 = 0 <= i;
    if(and__3822__auto____10249) {
      return i < pv.cnt
    }else {
      return and__3822__auto____10249
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__10250 = pv.root;
      var level__10251 = pv.shift;
      while(true) {
        if(level__10251 > 0) {
          var G__10252 = cljs.core.pv_aget.call(null, node__10250, i >>> level__10251 & 31);
          var G__10253 = level__10251 - 5;
          node__10250 = G__10252;
          level__10251 = G__10253;
          continue
        }else {
          return node__10250.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__10256 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__10256, i & 31, val);
    return ret__10256
  }else {
    var subidx__10257 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__10256, subidx__10257, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__10257), i, val));
    return ret__10256
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__10263 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__10264 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__10263));
    if(function() {
      var and__3822__auto____10265 = new_child__10264 == null;
      if(and__3822__auto____10265) {
        return subidx__10263 === 0
      }else {
        return and__3822__auto____10265
      }
    }()) {
      return null
    }else {
      var ret__10266 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__10266, subidx__10263, new_child__10264);
      return ret__10266
    }
  }else {
    if(subidx__10263 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__10267 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__10267, subidx__10263, null);
        return ret__10267
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__10270 = this;
  return new cljs.core.TransientVector(this__10270.cnt, this__10270.shift, cljs.core.tv_editable_root.call(null, this__10270.root), cljs.core.tv_editable_tail.call(null, this__10270.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10271 = this;
  var h__693__auto____10272 = this__10271.__hash;
  if(!(h__693__auto____10272 == null)) {
    return h__693__auto____10272
  }else {
    var h__693__auto____10273 = cljs.core.hash_coll.call(null, coll);
    this__10271.__hash = h__693__auto____10273;
    return h__693__auto____10273
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10274 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10275 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10276 = this;
  if(function() {
    var and__3822__auto____10277 = 0 <= k;
    if(and__3822__auto____10277) {
      return k < this__10276.cnt
    }else {
      return and__3822__auto____10277
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__10278 = this__10276.tail.slice();
      new_tail__10278[k & 31] = v;
      return new cljs.core.PersistentVector(this__10276.meta, this__10276.cnt, this__10276.shift, this__10276.root, new_tail__10278, null)
    }else {
      return new cljs.core.PersistentVector(this__10276.meta, this__10276.cnt, this__10276.shift, cljs.core.do_assoc.call(null, coll, this__10276.shift, this__10276.root, k, v), this__10276.tail, null)
    }
  }else {
    if(k === this__10276.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__10276.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__10326 = null;
  var G__10326__2 = function(this_sym10279, k) {
    var this__10281 = this;
    var this_sym10279__10282 = this;
    var coll__10283 = this_sym10279__10282;
    return coll__10283.cljs$core$ILookup$_lookup$arity$2(coll__10283, k)
  };
  var G__10326__3 = function(this_sym10280, k, not_found) {
    var this__10281 = this;
    var this_sym10280__10284 = this;
    var coll__10285 = this_sym10280__10284;
    return coll__10285.cljs$core$ILookup$_lookup$arity$3(coll__10285, k, not_found)
  };
  G__10326 = function(this_sym10280, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10326__2.call(this, this_sym10280, k);
      case 3:
        return G__10326__3.call(this, this_sym10280, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10326
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym10268, args10269) {
  var this__10286 = this;
  return this_sym10268.call.apply(this_sym10268, [this_sym10268].concat(args10269.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__10287 = this;
  var step_init__10288 = [0, init];
  var i__10289 = 0;
  while(true) {
    if(i__10289 < this__10287.cnt) {
      var arr__10290 = cljs.core.array_for.call(null, v, i__10289);
      var len__10291 = arr__10290.length;
      var init__10295 = function() {
        var j__10292 = 0;
        var init__10293 = step_init__10288[1];
        while(true) {
          if(j__10292 < len__10291) {
            var init__10294 = f.call(null, init__10293, j__10292 + i__10289, arr__10290[j__10292]);
            if(cljs.core.reduced_QMARK_.call(null, init__10294)) {
              return init__10294
            }else {
              var G__10327 = j__10292 + 1;
              var G__10328 = init__10294;
              j__10292 = G__10327;
              init__10293 = G__10328;
              continue
            }
          }else {
            step_init__10288[0] = len__10291;
            step_init__10288[1] = init__10293;
            return init__10293
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__10295)) {
        return cljs.core.deref.call(null, init__10295)
      }else {
        var G__10329 = i__10289 + step_init__10288[0];
        i__10289 = G__10329;
        continue
      }
    }else {
      return step_init__10288[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10296 = this;
  if(this__10296.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__10297 = this__10296.tail.slice();
    new_tail__10297.push(o);
    return new cljs.core.PersistentVector(this__10296.meta, this__10296.cnt + 1, this__10296.shift, this__10296.root, new_tail__10297, null)
  }else {
    var root_overflow_QMARK___10298 = this__10296.cnt >>> 5 > 1 << this__10296.shift;
    var new_shift__10299 = root_overflow_QMARK___10298 ? this__10296.shift + 5 : this__10296.shift;
    var new_root__10301 = root_overflow_QMARK___10298 ? function() {
      var n_r__10300 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__10300, 0, this__10296.root);
      cljs.core.pv_aset.call(null, n_r__10300, 1, cljs.core.new_path.call(null, null, this__10296.shift, new cljs.core.VectorNode(null, this__10296.tail)));
      return n_r__10300
    }() : cljs.core.push_tail.call(null, coll, this__10296.shift, this__10296.root, new cljs.core.VectorNode(null, this__10296.tail));
    return new cljs.core.PersistentVector(this__10296.meta, this__10296.cnt + 1, new_shift__10299, new_root__10301, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10302 = this;
  if(this__10302.cnt > 0) {
    return new cljs.core.RSeq(coll, this__10302.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__10303 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__10304 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__10305 = this;
  var this__10306 = this;
  return cljs.core.pr_str.call(null, this__10306)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__10307 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__10308 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10309 = this;
  if(this__10309.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10310 = this;
  return this__10310.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10311 = this;
  if(this__10311.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__10311.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10312 = this;
  if(this__10312.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__10312.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__10312.meta)
    }else {
      if(1 < this__10312.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__10312.meta, this__10312.cnt - 1, this__10312.shift, this__10312.root, this__10312.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__10313 = cljs.core.array_for.call(null, coll, this__10312.cnt - 2);
          var nr__10314 = cljs.core.pop_tail.call(null, coll, this__10312.shift, this__10312.root);
          var new_root__10315 = nr__10314 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__10314;
          var cnt_1__10316 = this__10312.cnt - 1;
          if(function() {
            var and__3822__auto____10317 = 5 < this__10312.shift;
            if(and__3822__auto____10317) {
              return cljs.core.pv_aget.call(null, new_root__10315, 1) == null
            }else {
              return and__3822__auto____10317
            }
          }()) {
            return new cljs.core.PersistentVector(this__10312.meta, cnt_1__10316, this__10312.shift - 5, cljs.core.pv_aget.call(null, new_root__10315, 0), new_tail__10313, null)
          }else {
            return new cljs.core.PersistentVector(this__10312.meta, cnt_1__10316, this__10312.shift, new_root__10315, new_tail__10313, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__10318 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10319 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10320 = this;
  return new cljs.core.PersistentVector(meta, this__10320.cnt, this__10320.shift, this__10320.root, this__10320.tail, this__10320.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10321 = this;
  return this__10321.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10322 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10323 = this;
  if(function() {
    var and__3822__auto____10324 = 0 <= n;
    if(and__3822__auto____10324) {
      return n < this__10323.cnt
    }else {
      return and__3822__auto____10324
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10325 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__10325.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__10330 = xs.length;
  var xs__10331 = no_clone === true ? xs : xs.slice();
  if(l__10330 < 32) {
    return new cljs.core.PersistentVector(null, l__10330, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__10331, null)
  }else {
    var node__10332 = xs__10331.slice(0, 32);
    var v__10333 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__10332, null);
    var i__10334 = 32;
    var out__10335 = cljs.core._as_transient.call(null, v__10333);
    while(true) {
      if(i__10334 < l__10330) {
        var G__10336 = i__10334 + 1;
        var G__10337 = cljs.core.conj_BANG_.call(null, out__10335, xs__10331[i__10334]);
        i__10334 = G__10336;
        out__10335 = G__10337;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__10335)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__10338) {
    var args = cljs.core.seq(arglist__10338);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__10339 = this;
  if(this__10339.off + 1 < this__10339.node.length) {
    var s__10340 = cljs.core.chunked_seq.call(null, this__10339.vec, this__10339.node, this__10339.i, this__10339.off + 1);
    if(s__10340 == null) {
      return null
    }else {
      return s__10340
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10341 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10342 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10343 = this;
  return this__10343.node[this__10343.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10344 = this;
  if(this__10344.off + 1 < this__10344.node.length) {
    var s__10345 = cljs.core.chunked_seq.call(null, this__10344.vec, this__10344.node, this__10344.i, this__10344.off + 1);
    if(s__10345 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__10345
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__10346 = this;
  var l__10347 = this__10346.node.length;
  var s__10348 = this__10346.i + l__10347 < cljs.core._count.call(null, this__10346.vec) ? cljs.core.chunked_seq.call(null, this__10346.vec, this__10346.i + l__10347, 0) : null;
  if(s__10348 == null) {
    return null
  }else {
    return s__10348
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10349 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__10350 = this;
  return cljs.core.chunked_seq.call(null, this__10350.vec, this__10350.node, this__10350.i, this__10350.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__10351 = this;
  return this__10351.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10352 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__10352.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__10353 = this;
  return cljs.core.array_chunk.call(null, this__10353.node, this__10353.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__10354 = this;
  var l__10355 = this__10354.node.length;
  var s__10356 = this__10354.i + l__10355 < cljs.core._count.call(null, this__10354.vec) ? cljs.core.chunked_seq.call(null, this__10354.vec, this__10354.i + l__10355, 0) : null;
  if(s__10356 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__10356
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10359 = this;
  var h__693__auto____10360 = this__10359.__hash;
  if(!(h__693__auto____10360 == null)) {
    return h__693__auto____10360
  }else {
    var h__693__auto____10361 = cljs.core.hash_coll.call(null, coll);
    this__10359.__hash = h__693__auto____10361;
    return h__693__auto____10361
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10362 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10363 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__10364 = this;
  var v_pos__10365 = this__10364.start + key;
  return new cljs.core.Subvec(this__10364.meta, cljs.core._assoc.call(null, this__10364.v, v_pos__10365, val), this__10364.start, this__10364.end > v_pos__10365 + 1 ? this__10364.end : v_pos__10365 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__10391 = null;
  var G__10391__2 = function(this_sym10366, k) {
    var this__10368 = this;
    var this_sym10366__10369 = this;
    var coll__10370 = this_sym10366__10369;
    return coll__10370.cljs$core$ILookup$_lookup$arity$2(coll__10370, k)
  };
  var G__10391__3 = function(this_sym10367, k, not_found) {
    var this__10368 = this;
    var this_sym10367__10371 = this;
    var coll__10372 = this_sym10367__10371;
    return coll__10372.cljs$core$ILookup$_lookup$arity$3(coll__10372, k, not_found)
  };
  G__10391 = function(this_sym10367, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10391__2.call(this, this_sym10367, k);
      case 3:
        return G__10391__3.call(this, this_sym10367, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10391
}();
cljs.core.Subvec.prototype.apply = function(this_sym10357, args10358) {
  var this__10373 = this;
  return this_sym10357.call.apply(this_sym10357, [this_sym10357].concat(args10358.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10374 = this;
  return new cljs.core.Subvec(this__10374.meta, cljs.core._assoc_n.call(null, this__10374.v, this__10374.end, o), this__10374.start, this__10374.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__10375 = this;
  var this__10376 = this;
  return cljs.core.pr_str.call(null, this__10376)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__10377 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__10378 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10379 = this;
  var subvec_seq__10380 = function subvec_seq(i) {
    if(i === this__10379.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__10379.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__10380.call(null, this__10379.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10381 = this;
  return this__10381.end - this__10381.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10382 = this;
  return cljs.core._nth.call(null, this__10382.v, this__10382.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10383 = this;
  if(this__10383.start === this__10383.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__10383.meta, this__10383.v, this__10383.start, this__10383.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__10384 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10385 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10386 = this;
  return new cljs.core.Subvec(meta, this__10386.v, this__10386.start, this__10386.end, this__10386.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10387 = this;
  return this__10387.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10388 = this;
  return cljs.core._nth.call(null, this__10388.v, this__10388.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10389 = this;
  return cljs.core._nth.call(null, this__10389.v, this__10389.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10390 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__10390.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__10393 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__10393, 0, tl.length);
  return ret__10393
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__10397 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__10398 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__10397, subidx__10398, level === 5 ? tail_node : function() {
    var child__10399 = cljs.core.pv_aget.call(null, ret__10397, subidx__10398);
    if(!(child__10399 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__10399, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__10397
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__10404 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__10405 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__10406 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__10404, subidx__10405));
    if(function() {
      var and__3822__auto____10407 = new_child__10406 == null;
      if(and__3822__auto____10407) {
        return subidx__10405 === 0
      }else {
        return and__3822__auto____10407
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__10404, subidx__10405, new_child__10406);
      return node__10404
    }
  }else {
    if(subidx__10405 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__10404, subidx__10405, null);
        return node__10404
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____10412 = 0 <= i;
    if(and__3822__auto____10412) {
      return i < tv.cnt
    }else {
      return and__3822__auto____10412
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__10413 = tv.root;
      var node__10414 = root__10413;
      var level__10415 = tv.shift;
      while(true) {
        if(level__10415 > 0) {
          var G__10416 = cljs.core.tv_ensure_editable.call(null, root__10413.edit, cljs.core.pv_aget.call(null, node__10414, i >>> level__10415 & 31));
          var G__10417 = level__10415 - 5;
          node__10414 = G__10416;
          level__10415 = G__10417;
          continue
        }else {
          return node__10414.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__10457 = null;
  var G__10457__2 = function(this_sym10420, k) {
    var this__10422 = this;
    var this_sym10420__10423 = this;
    var coll__10424 = this_sym10420__10423;
    return coll__10424.cljs$core$ILookup$_lookup$arity$2(coll__10424, k)
  };
  var G__10457__3 = function(this_sym10421, k, not_found) {
    var this__10422 = this;
    var this_sym10421__10425 = this;
    var coll__10426 = this_sym10421__10425;
    return coll__10426.cljs$core$ILookup$_lookup$arity$3(coll__10426, k, not_found)
  };
  G__10457 = function(this_sym10421, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10457__2.call(this, this_sym10421, k);
      case 3:
        return G__10457__3.call(this, this_sym10421, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10457
}();
cljs.core.TransientVector.prototype.apply = function(this_sym10418, args10419) {
  var this__10427 = this;
  return this_sym10418.call.apply(this_sym10418, [this_sym10418].concat(args10419.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10428 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10429 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10430 = this;
  if(this__10430.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10431 = this;
  if(function() {
    var and__3822__auto____10432 = 0 <= n;
    if(and__3822__auto____10432) {
      return n < this__10431.cnt
    }else {
      return and__3822__auto____10432
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10433 = this;
  if(this__10433.root.edit) {
    return this__10433.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__10434 = this;
  if(this__10434.root.edit) {
    if(function() {
      var and__3822__auto____10435 = 0 <= n;
      if(and__3822__auto____10435) {
        return n < this__10434.cnt
      }else {
        return and__3822__auto____10435
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__10434.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__10440 = function go(level, node) {
          var node__10438 = cljs.core.tv_ensure_editable.call(null, this__10434.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__10438, n & 31, val);
            return node__10438
          }else {
            var subidx__10439 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__10438, subidx__10439, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__10438, subidx__10439)));
            return node__10438
          }
        }.call(null, this__10434.shift, this__10434.root);
        this__10434.root = new_root__10440;
        return tcoll
      }
    }else {
      if(n === this__10434.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__10434.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__10441 = this;
  if(this__10441.root.edit) {
    if(this__10441.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__10441.cnt) {
        this__10441.cnt = 0;
        return tcoll
      }else {
        if((this__10441.cnt - 1 & 31) > 0) {
          this__10441.cnt = this__10441.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__10442 = cljs.core.editable_array_for.call(null, tcoll, this__10441.cnt - 2);
            var new_root__10444 = function() {
              var nr__10443 = cljs.core.tv_pop_tail.call(null, tcoll, this__10441.shift, this__10441.root);
              if(!(nr__10443 == null)) {
                return nr__10443
              }else {
                return new cljs.core.VectorNode(this__10441.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____10445 = 5 < this__10441.shift;
              if(and__3822__auto____10445) {
                return cljs.core.pv_aget.call(null, new_root__10444, 1) == null
              }else {
                return and__3822__auto____10445
              }
            }()) {
              var new_root__10446 = cljs.core.tv_ensure_editable.call(null, this__10441.root.edit, cljs.core.pv_aget.call(null, new_root__10444, 0));
              this__10441.root = new_root__10446;
              this__10441.shift = this__10441.shift - 5;
              this__10441.cnt = this__10441.cnt - 1;
              this__10441.tail = new_tail__10442;
              return tcoll
            }else {
              this__10441.root = new_root__10444;
              this__10441.cnt = this__10441.cnt - 1;
              this__10441.tail = new_tail__10442;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__10447 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10448 = this;
  if(this__10448.root.edit) {
    if(this__10448.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__10448.tail[this__10448.cnt & 31] = o;
      this__10448.cnt = this__10448.cnt + 1;
      return tcoll
    }else {
      var tail_node__10449 = new cljs.core.VectorNode(this__10448.root.edit, this__10448.tail);
      var new_tail__10450 = cljs.core.make_array.call(null, 32);
      new_tail__10450[0] = o;
      this__10448.tail = new_tail__10450;
      if(this__10448.cnt >>> 5 > 1 << this__10448.shift) {
        var new_root_array__10451 = cljs.core.make_array.call(null, 32);
        var new_shift__10452 = this__10448.shift + 5;
        new_root_array__10451[0] = this__10448.root;
        new_root_array__10451[1] = cljs.core.new_path.call(null, this__10448.root.edit, this__10448.shift, tail_node__10449);
        this__10448.root = new cljs.core.VectorNode(this__10448.root.edit, new_root_array__10451);
        this__10448.shift = new_shift__10452;
        this__10448.cnt = this__10448.cnt + 1;
        return tcoll
      }else {
        var new_root__10453 = cljs.core.tv_push_tail.call(null, tcoll, this__10448.shift, this__10448.root, tail_node__10449);
        this__10448.root = new_root__10453;
        this__10448.cnt = this__10448.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10454 = this;
  if(this__10454.root.edit) {
    this__10454.root.edit = null;
    var len__10455 = this__10454.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__10456 = cljs.core.make_array.call(null, len__10455);
    cljs.core.array_copy.call(null, this__10454.tail, 0, trimmed_tail__10456, 0, len__10455);
    return new cljs.core.PersistentVector(null, this__10454.cnt, this__10454.shift, this__10454.root, trimmed_tail__10456, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10458 = this;
  var h__693__auto____10459 = this__10458.__hash;
  if(!(h__693__auto____10459 == null)) {
    return h__693__auto____10459
  }else {
    var h__693__auto____10460 = cljs.core.hash_coll.call(null, coll);
    this__10458.__hash = h__693__auto____10460;
    return h__693__auto____10460
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10461 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__10462 = this;
  var this__10463 = this;
  return cljs.core.pr_str.call(null, this__10463)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10464 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10465 = this;
  return cljs.core._first.call(null, this__10465.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10466 = this;
  var temp__3971__auto____10467 = cljs.core.next.call(null, this__10466.front);
  if(temp__3971__auto____10467) {
    var f1__10468 = temp__3971__auto____10467;
    return new cljs.core.PersistentQueueSeq(this__10466.meta, f1__10468, this__10466.rear, null)
  }else {
    if(this__10466.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__10466.meta, this__10466.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10469 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10470 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__10470.front, this__10470.rear, this__10470.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10471 = this;
  return this__10471.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10472 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10472.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10473 = this;
  var h__693__auto____10474 = this__10473.__hash;
  if(!(h__693__auto____10474 == null)) {
    return h__693__auto____10474
  }else {
    var h__693__auto____10475 = cljs.core.hash_coll.call(null, coll);
    this__10473.__hash = h__693__auto____10475;
    return h__693__auto____10475
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10476 = this;
  if(cljs.core.truth_(this__10476.front)) {
    return new cljs.core.PersistentQueue(this__10476.meta, this__10476.count + 1, this__10476.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____10477 = this__10476.rear;
      if(cljs.core.truth_(or__3824__auto____10477)) {
        return or__3824__auto____10477
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__10476.meta, this__10476.count + 1, cljs.core.conj.call(null, this__10476.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__10478 = this;
  var this__10479 = this;
  return cljs.core.pr_str.call(null, this__10479)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10480 = this;
  var rear__10481 = cljs.core.seq.call(null, this__10480.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____10482 = this__10480.front;
    if(cljs.core.truth_(or__3824__auto____10482)) {
      return or__3824__auto____10482
    }else {
      return rear__10481
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__10480.front, cljs.core.seq.call(null, rear__10481), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10483 = this;
  return this__10483.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10484 = this;
  return cljs.core._first.call(null, this__10484.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10485 = this;
  if(cljs.core.truth_(this__10485.front)) {
    var temp__3971__auto____10486 = cljs.core.next.call(null, this__10485.front);
    if(temp__3971__auto____10486) {
      var f1__10487 = temp__3971__auto____10486;
      return new cljs.core.PersistentQueue(this__10485.meta, this__10485.count - 1, f1__10487, this__10485.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__10485.meta, this__10485.count - 1, cljs.core.seq.call(null, this__10485.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10488 = this;
  return cljs.core.first.call(null, this__10488.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10489 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10490 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10491 = this;
  return new cljs.core.PersistentQueue(meta, this__10491.count, this__10491.front, this__10491.rear, this__10491.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10492 = this;
  return this__10492.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10493 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__10494 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__10497 = array.length;
  var i__10498 = 0;
  while(true) {
    if(i__10498 < len__10497) {
      if(k === array[i__10498]) {
        return i__10498
      }else {
        var G__10499 = i__10498 + incr;
        i__10498 = G__10499;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__10502 = cljs.core.hash.call(null, a);
  var b__10503 = cljs.core.hash.call(null, b);
  if(a__10502 < b__10503) {
    return-1
  }else {
    if(a__10502 > b__10503) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__10511 = m.keys;
  var len__10512 = ks__10511.length;
  var so__10513 = m.strobj;
  var out__10514 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__10515 = 0;
  var out__10516 = cljs.core.transient$.call(null, out__10514);
  while(true) {
    if(i__10515 < len__10512) {
      var k__10517 = ks__10511[i__10515];
      var G__10518 = i__10515 + 1;
      var G__10519 = cljs.core.assoc_BANG_.call(null, out__10516, k__10517, so__10513[k__10517]);
      i__10515 = G__10518;
      out__10516 = G__10519;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__10516, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__10525 = {};
  var l__10526 = ks.length;
  var i__10527 = 0;
  while(true) {
    if(i__10527 < l__10526) {
      var k__10528 = ks[i__10527];
      new_obj__10525[k__10528] = obj[k__10528];
      var G__10529 = i__10527 + 1;
      i__10527 = G__10529;
      continue
    }else {
    }
    break
  }
  return new_obj__10525
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__10532 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10533 = this;
  var h__693__auto____10534 = this__10533.__hash;
  if(!(h__693__auto____10534 == null)) {
    return h__693__auto____10534
  }else {
    var h__693__auto____10535 = cljs.core.hash_imap.call(null, coll);
    this__10533.__hash = h__693__auto____10535;
    return h__693__auto____10535
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10536 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10537 = this;
  if(function() {
    var and__3822__auto____10538 = goog.isString(k);
    if(and__3822__auto____10538) {
      return!(cljs.core.scan_array.call(null, 1, k, this__10537.keys) == null)
    }else {
      return and__3822__auto____10538
    }
  }()) {
    return this__10537.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10539 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____10540 = this__10539.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____10540) {
        return or__3824__auto____10540
      }else {
        return this__10539.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__10539.keys) == null)) {
        var new_strobj__10541 = cljs.core.obj_clone.call(null, this__10539.strobj, this__10539.keys);
        new_strobj__10541[k] = v;
        return new cljs.core.ObjMap(this__10539.meta, this__10539.keys, new_strobj__10541, this__10539.update_count + 1, null)
      }else {
        var new_strobj__10542 = cljs.core.obj_clone.call(null, this__10539.strobj, this__10539.keys);
        var new_keys__10543 = this__10539.keys.slice();
        new_strobj__10542[k] = v;
        new_keys__10543.push(k);
        return new cljs.core.ObjMap(this__10539.meta, new_keys__10543, new_strobj__10542, this__10539.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10544 = this;
  if(function() {
    var and__3822__auto____10545 = goog.isString(k);
    if(and__3822__auto____10545) {
      return!(cljs.core.scan_array.call(null, 1, k, this__10544.keys) == null)
    }else {
      return and__3822__auto____10545
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__10567 = null;
  var G__10567__2 = function(this_sym10546, k) {
    var this__10548 = this;
    var this_sym10546__10549 = this;
    var coll__10550 = this_sym10546__10549;
    return coll__10550.cljs$core$ILookup$_lookup$arity$2(coll__10550, k)
  };
  var G__10567__3 = function(this_sym10547, k, not_found) {
    var this__10548 = this;
    var this_sym10547__10551 = this;
    var coll__10552 = this_sym10547__10551;
    return coll__10552.cljs$core$ILookup$_lookup$arity$3(coll__10552, k, not_found)
  };
  G__10567 = function(this_sym10547, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10567__2.call(this, this_sym10547, k);
      case 3:
        return G__10567__3.call(this, this_sym10547, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10567
}();
cljs.core.ObjMap.prototype.apply = function(this_sym10530, args10531) {
  var this__10553 = this;
  return this_sym10530.call.apply(this_sym10530, [this_sym10530].concat(args10531.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10554 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__10555 = this;
  var this__10556 = this;
  return cljs.core.pr_str.call(null, this__10556)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10557 = this;
  if(this__10557.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__10520_SHARP_) {
      return cljs.core.vector.call(null, p1__10520_SHARP_, this__10557.strobj[p1__10520_SHARP_])
    }, this__10557.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10558 = this;
  return this__10558.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10559 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10560 = this;
  return new cljs.core.ObjMap(meta, this__10560.keys, this__10560.strobj, this__10560.update_count, this__10560.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10561 = this;
  return this__10561.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10562 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__10562.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10563 = this;
  if(function() {
    var and__3822__auto____10564 = goog.isString(k);
    if(and__3822__auto____10564) {
      return!(cljs.core.scan_array.call(null, 1, k, this__10563.keys) == null)
    }else {
      return and__3822__auto____10564
    }
  }()) {
    var new_keys__10565 = this__10563.keys.slice();
    var new_strobj__10566 = cljs.core.obj_clone.call(null, this__10563.strobj, this__10563.keys);
    new_keys__10565.splice(cljs.core.scan_array.call(null, 1, k, new_keys__10565), 1);
    cljs.core.js_delete.call(null, new_strobj__10566, k);
    return new cljs.core.ObjMap(this__10563.meta, new_keys__10565, new_strobj__10566, this__10563.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10571 = this;
  var h__693__auto____10572 = this__10571.__hash;
  if(!(h__693__auto____10572 == null)) {
    return h__693__auto____10572
  }else {
    var h__693__auto____10573 = cljs.core.hash_imap.call(null, coll);
    this__10571.__hash = h__693__auto____10573;
    return h__693__auto____10573
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10574 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10575 = this;
  var bucket__10576 = this__10575.hashobj[cljs.core.hash.call(null, k)];
  var i__10577 = cljs.core.truth_(bucket__10576) ? cljs.core.scan_array.call(null, 2, k, bucket__10576) : null;
  if(cljs.core.truth_(i__10577)) {
    return bucket__10576[i__10577 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10578 = this;
  var h__10579 = cljs.core.hash.call(null, k);
  var bucket__10580 = this__10578.hashobj[h__10579];
  if(cljs.core.truth_(bucket__10580)) {
    var new_bucket__10581 = bucket__10580.slice();
    var new_hashobj__10582 = goog.object.clone(this__10578.hashobj);
    new_hashobj__10582[h__10579] = new_bucket__10581;
    var temp__3971__auto____10583 = cljs.core.scan_array.call(null, 2, k, new_bucket__10581);
    if(cljs.core.truth_(temp__3971__auto____10583)) {
      var i__10584 = temp__3971__auto____10583;
      new_bucket__10581[i__10584 + 1] = v;
      return new cljs.core.HashMap(this__10578.meta, this__10578.count, new_hashobj__10582, null)
    }else {
      new_bucket__10581.push(k, v);
      return new cljs.core.HashMap(this__10578.meta, this__10578.count + 1, new_hashobj__10582, null)
    }
  }else {
    var new_hashobj__10585 = goog.object.clone(this__10578.hashobj);
    new_hashobj__10585[h__10579] = [k, v];
    return new cljs.core.HashMap(this__10578.meta, this__10578.count + 1, new_hashobj__10585, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10586 = this;
  var bucket__10587 = this__10586.hashobj[cljs.core.hash.call(null, k)];
  var i__10588 = cljs.core.truth_(bucket__10587) ? cljs.core.scan_array.call(null, 2, k, bucket__10587) : null;
  if(cljs.core.truth_(i__10588)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__10613 = null;
  var G__10613__2 = function(this_sym10589, k) {
    var this__10591 = this;
    var this_sym10589__10592 = this;
    var coll__10593 = this_sym10589__10592;
    return coll__10593.cljs$core$ILookup$_lookup$arity$2(coll__10593, k)
  };
  var G__10613__3 = function(this_sym10590, k, not_found) {
    var this__10591 = this;
    var this_sym10590__10594 = this;
    var coll__10595 = this_sym10590__10594;
    return coll__10595.cljs$core$ILookup$_lookup$arity$3(coll__10595, k, not_found)
  };
  G__10613 = function(this_sym10590, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10613__2.call(this, this_sym10590, k);
      case 3:
        return G__10613__3.call(this, this_sym10590, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10613
}();
cljs.core.HashMap.prototype.apply = function(this_sym10569, args10570) {
  var this__10596 = this;
  return this_sym10569.call.apply(this_sym10569, [this_sym10569].concat(args10570.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10597 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__10598 = this;
  var this__10599 = this;
  return cljs.core.pr_str.call(null, this__10599)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10600 = this;
  if(this__10600.count > 0) {
    var hashes__10601 = cljs.core.js_keys.call(null, this__10600.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__10568_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__10600.hashobj[p1__10568_SHARP_]))
    }, hashes__10601)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10602 = this;
  return this__10602.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10603 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10604 = this;
  return new cljs.core.HashMap(meta, this__10604.count, this__10604.hashobj, this__10604.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10605 = this;
  return this__10605.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10606 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__10606.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10607 = this;
  var h__10608 = cljs.core.hash.call(null, k);
  var bucket__10609 = this__10607.hashobj[h__10608];
  var i__10610 = cljs.core.truth_(bucket__10609) ? cljs.core.scan_array.call(null, 2, k, bucket__10609) : null;
  if(cljs.core.not.call(null, i__10610)) {
    return coll
  }else {
    var new_hashobj__10611 = goog.object.clone(this__10607.hashobj);
    if(3 > bucket__10609.length) {
      cljs.core.js_delete.call(null, new_hashobj__10611, h__10608)
    }else {
      var new_bucket__10612 = bucket__10609.slice();
      new_bucket__10612.splice(i__10610, 2);
      new_hashobj__10611[h__10608] = new_bucket__10612
    }
    return new cljs.core.HashMap(this__10607.meta, this__10607.count - 1, new_hashobj__10611, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__10614 = ks.length;
  var i__10615 = 0;
  var out__10616 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__10615 < len__10614) {
      var G__10617 = i__10615 + 1;
      var G__10618 = cljs.core.assoc.call(null, out__10616, ks[i__10615], vs[i__10615]);
      i__10615 = G__10617;
      out__10616 = G__10618;
      continue
    }else {
      return out__10616
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__10622 = m.arr;
  var len__10623 = arr__10622.length;
  var i__10624 = 0;
  while(true) {
    if(len__10623 <= i__10624) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__10622[i__10624], k)) {
        return i__10624
      }else {
        if("\ufdd0'else") {
          var G__10625 = i__10624 + 2;
          i__10624 = G__10625;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__10628 = this;
  return new cljs.core.TransientArrayMap({}, this__10628.arr.length, this__10628.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10629 = this;
  var h__693__auto____10630 = this__10629.__hash;
  if(!(h__693__auto____10630 == null)) {
    return h__693__auto____10630
  }else {
    var h__693__auto____10631 = cljs.core.hash_imap.call(null, coll);
    this__10629.__hash = h__693__auto____10631;
    return h__693__auto____10631
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10632 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10633 = this;
  var idx__10634 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10634 === -1) {
    return not_found
  }else {
    return this__10633.arr[idx__10634 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10635 = this;
  var idx__10636 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10636 === -1) {
    if(this__10635.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__10635.meta, this__10635.cnt + 1, function() {
        var G__10637__10638 = this__10635.arr.slice();
        G__10637__10638.push(k);
        G__10637__10638.push(v);
        return G__10637__10638
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__10635.arr[idx__10636 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__10635.meta, this__10635.cnt, function() {
          var G__10639__10640 = this__10635.arr.slice();
          G__10639__10640[idx__10636 + 1] = v;
          return G__10639__10640
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10641 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__10673 = null;
  var G__10673__2 = function(this_sym10642, k) {
    var this__10644 = this;
    var this_sym10642__10645 = this;
    var coll__10646 = this_sym10642__10645;
    return coll__10646.cljs$core$ILookup$_lookup$arity$2(coll__10646, k)
  };
  var G__10673__3 = function(this_sym10643, k, not_found) {
    var this__10644 = this;
    var this_sym10643__10647 = this;
    var coll__10648 = this_sym10643__10647;
    return coll__10648.cljs$core$ILookup$_lookup$arity$3(coll__10648, k, not_found)
  };
  G__10673 = function(this_sym10643, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10673__2.call(this, this_sym10643, k);
      case 3:
        return G__10673__3.call(this, this_sym10643, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10673
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym10626, args10627) {
  var this__10649 = this;
  return this_sym10626.call.apply(this_sym10626, [this_sym10626].concat(args10627.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10650 = this;
  var len__10651 = this__10650.arr.length;
  var i__10652 = 0;
  var init__10653 = init;
  while(true) {
    if(i__10652 < len__10651) {
      var init__10654 = f.call(null, init__10653, this__10650.arr[i__10652], this__10650.arr[i__10652 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__10654)) {
        return cljs.core.deref.call(null, init__10654)
      }else {
        var G__10674 = i__10652 + 2;
        var G__10675 = init__10654;
        i__10652 = G__10674;
        init__10653 = G__10675;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10655 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__10656 = this;
  var this__10657 = this;
  return cljs.core.pr_str.call(null, this__10657)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10658 = this;
  if(this__10658.cnt > 0) {
    var len__10659 = this__10658.arr.length;
    var array_map_seq__10660 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__10659) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__10658.arr[i], this__10658.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__10660.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10661 = this;
  return this__10661.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10662 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10663 = this;
  return new cljs.core.PersistentArrayMap(meta, this__10663.cnt, this__10663.arr, this__10663.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10664 = this;
  return this__10664.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10665 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__10665.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10666 = this;
  var idx__10667 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10667 >= 0) {
    var len__10668 = this__10666.arr.length;
    var new_len__10669 = len__10668 - 2;
    if(new_len__10669 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__10670 = cljs.core.make_array.call(null, new_len__10669);
      var s__10671 = 0;
      var d__10672 = 0;
      while(true) {
        if(s__10671 >= len__10668) {
          return new cljs.core.PersistentArrayMap(this__10666.meta, this__10666.cnt - 1, new_arr__10670, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__10666.arr[s__10671])) {
            var G__10676 = s__10671 + 2;
            var G__10677 = d__10672;
            s__10671 = G__10676;
            d__10672 = G__10677;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__10670[d__10672] = this__10666.arr[s__10671];
              new_arr__10670[d__10672 + 1] = this__10666.arr[s__10671 + 1];
              var G__10678 = s__10671 + 2;
              var G__10679 = d__10672 + 2;
              s__10671 = G__10678;
              d__10672 = G__10679;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__10680 = cljs.core.count.call(null, ks);
  var i__10681 = 0;
  var out__10682 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__10681 < len__10680) {
      var G__10683 = i__10681 + 1;
      var G__10684 = cljs.core.assoc_BANG_.call(null, out__10682, ks[i__10681], vs[i__10681]);
      i__10681 = G__10683;
      out__10682 = G__10684;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10682)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__10685 = this;
  if(cljs.core.truth_(this__10685.editable_QMARK_)) {
    var idx__10686 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__10686 >= 0) {
      this__10685.arr[idx__10686] = this__10685.arr[this__10685.len - 2];
      this__10685.arr[idx__10686 + 1] = this__10685.arr[this__10685.len - 1];
      var G__10687__10688 = this__10685.arr;
      G__10687__10688.pop();
      G__10687__10688.pop();
      G__10687__10688;
      this__10685.len = this__10685.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__10689 = this;
  if(cljs.core.truth_(this__10689.editable_QMARK_)) {
    var idx__10690 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__10690 === -1) {
      if(this__10689.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__10689.len = this__10689.len + 2;
        this__10689.arr.push(key);
        this__10689.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__10689.len, this__10689.arr), key, val)
      }
    }else {
      if(val === this__10689.arr[idx__10690 + 1]) {
        return tcoll
      }else {
        this__10689.arr[idx__10690 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10691 = this;
  if(cljs.core.truth_(this__10691.editable_QMARK_)) {
    if(function() {
      var G__10692__10693 = o;
      if(G__10692__10693) {
        if(function() {
          var or__3824__auto____10694 = G__10692__10693.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____10694) {
            return or__3824__auto____10694
          }else {
            return G__10692__10693.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__10692__10693.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10692__10693)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10692__10693)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__10695 = cljs.core.seq.call(null, o);
      var tcoll__10696 = tcoll;
      while(true) {
        var temp__3971__auto____10697 = cljs.core.first.call(null, es__10695);
        if(cljs.core.truth_(temp__3971__auto____10697)) {
          var e__10698 = temp__3971__auto____10697;
          var G__10704 = cljs.core.next.call(null, es__10695);
          var G__10705 = tcoll__10696.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__10696, cljs.core.key.call(null, e__10698), cljs.core.val.call(null, e__10698));
          es__10695 = G__10704;
          tcoll__10696 = G__10705;
          continue
        }else {
          return tcoll__10696
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10699 = this;
  if(cljs.core.truth_(this__10699.editable_QMARK_)) {
    this__10699.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__10699.len, 2), this__10699.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__10700 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__10701 = this;
  if(cljs.core.truth_(this__10701.editable_QMARK_)) {
    var idx__10702 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__10702 === -1) {
      return not_found
    }else {
      return this__10701.arr[idx__10702 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__10703 = this;
  if(cljs.core.truth_(this__10703.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__10703.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__10708 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__10709 = 0;
  while(true) {
    if(i__10709 < len) {
      var G__10710 = cljs.core.assoc_BANG_.call(null, out__10708, arr[i__10709], arr[i__10709 + 1]);
      var G__10711 = i__10709 + 2;
      out__10708 = G__10710;
      i__10709 = G__10711;
      continue
    }else {
      return out__10708
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__811__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__10716__10717 = arr.slice();
    G__10716__10717[i] = a;
    return G__10716__10717
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__10718__10719 = arr.slice();
    G__10718__10719[i] = a;
    G__10718__10719[j] = b;
    return G__10718__10719
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__10721 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__10721, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__10721, 2 * i, new_arr__10721.length - 2 * i);
  return new_arr__10721
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__10724 = inode.ensure_editable(edit);
    editable__10724.arr[i] = a;
    return editable__10724
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__10725 = inode.ensure_editable(edit);
    editable__10725.arr[i] = a;
    editable__10725.arr[j] = b;
    return editable__10725
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__10732 = arr.length;
  var i__10733 = 0;
  var init__10734 = init;
  while(true) {
    if(i__10733 < len__10732) {
      var init__10737 = function() {
        var k__10735 = arr[i__10733];
        if(!(k__10735 == null)) {
          return f.call(null, init__10734, k__10735, arr[i__10733 + 1])
        }else {
          var node__10736 = arr[i__10733 + 1];
          if(!(node__10736 == null)) {
            return node__10736.kv_reduce(f, init__10734)
          }else {
            return init__10734
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__10737)) {
        return cljs.core.deref.call(null, init__10737)
      }else {
        var G__10738 = i__10733 + 2;
        var G__10739 = init__10737;
        i__10733 = G__10738;
        init__10734 = G__10739;
        continue
      }
    }else {
      return init__10734
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__10740 = this;
  var inode__10741 = this;
  if(this__10740.bitmap === bit) {
    return null
  }else {
    var editable__10742 = inode__10741.ensure_editable(e);
    var earr__10743 = editable__10742.arr;
    var len__10744 = earr__10743.length;
    editable__10742.bitmap = bit ^ editable__10742.bitmap;
    cljs.core.array_copy.call(null, earr__10743, 2 * (i + 1), earr__10743, 2 * i, len__10744 - 2 * (i + 1));
    earr__10743[len__10744 - 2] = null;
    earr__10743[len__10744 - 1] = null;
    return editable__10742
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10745 = this;
  var inode__10746 = this;
  var bit__10747 = 1 << (hash >>> shift & 31);
  var idx__10748 = cljs.core.bitmap_indexed_node_index.call(null, this__10745.bitmap, bit__10747);
  if((this__10745.bitmap & bit__10747) === 0) {
    var n__10749 = cljs.core.bit_count.call(null, this__10745.bitmap);
    if(2 * n__10749 < this__10745.arr.length) {
      var editable__10750 = inode__10746.ensure_editable(edit);
      var earr__10751 = editable__10750.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__10751, 2 * idx__10748, earr__10751, 2 * (idx__10748 + 1), 2 * (n__10749 - idx__10748));
      earr__10751[2 * idx__10748] = key;
      earr__10751[2 * idx__10748 + 1] = val;
      editable__10750.bitmap = editable__10750.bitmap | bit__10747;
      return editable__10750
    }else {
      if(n__10749 >= 16) {
        var nodes__10752 = cljs.core.make_array.call(null, 32);
        var jdx__10753 = hash >>> shift & 31;
        nodes__10752[jdx__10753] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__10754 = 0;
        var j__10755 = 0;
        while(true) {
          if(i__10754 < 32) {
            if((this__10745.bitmap >>> i__10754 & 1) === 0) {
              var G__10808 = i__10754 + 1;
              var G__10809 = j__10755;
              i__10754 = G__10808;
              j__10755 = G__10809;
              continue
            }else {
              nodes__10752[i__10754] = !(this__10745.arr[j__10755] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__10745.arr[j__10755]), this__10745.arr[j__10755], this__10745.arr[j__10755 + 1], added_leaf_QMARK_) : this__10745.arr[j__10755 + 1];
              var G__10810 = i__10754 + 1;
              var G__10811 = j__10755 + 2;
              i__10754 = G__10810;
              j__10755 = G__10811;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__10749 + 1, nodes__10752)
      }else {
        if("\ufdd0'else") {
          var new_arr__10756 = cljs.core.make_array.call(null, 2 * (n__10749 + 4));
          cljs.core.array_copy.call(null, this__10745.arr, 0, new_arr__10756, 0, 2 * idx__10748);
          new_arr__10756[2 * idx__10748] = key;
          new_arr__10756[2 * idx__10748 + 1] = val;
          cljs.core.array_copy.call(null, this__10745.arr, 2 * idx__10748, new_arr__10756, 2 * (idx__10748 + 1), 2 * (n__10749 - idx__10748));
          added_leaf_QMARK_.val = true;
          var editable__10757 = inode__10746.ensure_editable(edit);
          editable__10757.arr = new_arr__10756;
          editable__10757.bitmap = editable__10757.bitmap | bit__10747;
          return editable__10757
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__10758 = this__10745.arr[2 * idx__10748];
    var val_or_node__10759 = this__10745.arr[2 * idx__10748 + 1];
    if(key_or_nil__10758 == null) {
      var n__10760 = val_or_node__10759.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__10760 === val_or_node__10759) {
        return inode__10746
      }else {
        return cljs.core.edit_and_set.call(null, inode__10746, edit, 2 * idx__10748 + 1, n__10760)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__10758)) {
        if(val === val_or_node__10759) {
          return inode__10746
        }else {
          return cljs.core.edit_and_set.call(null, inode__10746, edit, 2 * idx__10748 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__10746, edit, 2 * idx__10748, null, 2 * idx__10748 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__10758, val_or_node__10759, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__10761 = this;
  var inode__10762 = this;
  return cljs.core.create_inode_seq.call(null, this__10761.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10763 = this;
  var inode__10764 = this;
  var bit__10765 = 1 << (hash >>> shift & 31);
  if((this__10763.bitmap & bit__10765) === 0) {
    return inode__10764
  }else {
    var idx__10766 = cljs.core.bitmap_indexed_node_index.call(null, this__10763.bitmap, bit__10765);
    var key_or_nil__10767 = this__10763.arr[2 * idx__10766];
    var val_or_node__10768 = this__10763.arr[2 * idx__10766 + 1];
    if(key_or_nil__10767 == null) {
      var n__10769 = val_or_node__10768.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__10769 === val_or_node__10768) {
        return inode__10764
      }else {
        if(!(n__10769 == null)) {
          return cljs.core.edit_and_set.call(null, inode__10764, edit, 2 * idx__10766 + 1, n__10769)
        }else {
          if(this__10763.bitmap === bit__10765) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__10764.edit_and_remove_pair(edit, bit__10765, idx__10766)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__10767)) {
        removed_leaf_QMARK_[0] = true;
        return inode__10764.edit_and_remove_pair(edit, bit__10765, idx__10766)
      }else {
        if("\ufdd0'else") {
          return inode__10764
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__10770 = this;
  var inode__10771 = this;
  if(e === this__10770.edit) {
    return inode__10771
  }else {
    var n__10772 = cljs.core.bit_count.call(null, this__10770.bitmap);
    var new_arr__10773 = cljs.core.make_array.call(null, n__10772 < 0 ? 4 : 2 * (n__10772 + 1));
    cljs.core.array_copy.call(null, this__10770.arr, 0, new_arr__10773, 0, 2 * n__10772);
    return new cljs.core.BitmapIndexedNode(e, this__10770.bitmap, new_arr__10773)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__10774 = this;
  var inode__10775 = this;
  return cljs.core.inode_kv_reduce.call(null, this__10774.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__10776 = this;
  var inode__10777 = this;
  var bit__10778 = 1 << (hash >>> shift & 31);
  if((this__10776.bitmap & bit__10778) === 0) {
    return not_found
  }else {
    var idx__10779 = cljs.core.bitmap_indexed_node_index.call(null, this__10776.bitmap, bit__10778);
    var key_or_nil__10780 = this__10776.arr[2 * idx__10779];
    var val_or_node__10781 = this__10776.arr[2 * idx__10779 + 1];
    if(key_or_nil__10780 == null) {
      return val_or_node__10781.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__10780)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__10780, val_or_node__10781], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__10782 = this;
  var inode__10783 = this;
  var bit__10784 = 1 << (hash >>> shift & 31);
  if((this__10782.bitmap & bit__10784) === 0) {
    return inode__10783
  }else {
    var idx__10785 = cljs.core.bitmap_indexed_node_index.call(null, this__10782.bitmap, bit__10784);
    var key_or_nil__10786 = this__10782.arr[2 * idx__10785];
    var val_or_node__10787 = this__10782.arr[2 * idx__10785 + 1];
    if(key_or_nil__10786 == null) {
      var n__10788 = val_or_node__10787.inode_without(shift + 5, hash, key);
      if(n__10788 === val_or_node__10787) {
        return inode__10783
      }else {
        if(!(n__10788 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__10782.bitmap, cljs.core.clone_and_set.call(null, this__10782.arr, 2 * idx__10785 + 1, n__10788))
        }else {
          if(this__10782.bitmap === bit__10784) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__10782.bitmap ^ bit__10784, cljs.core.remove_pair.call(null, this__10782.arr, idx__10785))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__10786)) {
        return new cljs.core.BitmapIndexedNode(null, this__10782.bitmap ^ bit__10784, cljs.core.remove_pair.call(null, this__10782.arr, idx__10785))
      }else {
        if("\ufdd0'else") {
          return inode__10783
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__10789 = this;
  var inode__10790 = this;
  var bit__10791 = 1 << (hash >>> shift & 31);
  var idx__10792 = cljs.core.bitmap_indexed_node_index.call(null, this__10789.bitmap, bit__10791);
  if((this__10789.bitmap & bit__10791) === 0) {
    var n__10793 = cljs.core.bit_count.call(null, this__10789.bitmap);
    if(n__10793 >= 16) {
      var nodes__10794 = cljs.core.make_array.call(null, 32);
      var jdx__10795 = hash >>> shift & 31;
      nodes__10794[jdx__10795] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__10796 = 0;
      var j__10797 = 0;
      while(true) {
        if(i__10796 < 32) {
          if((this__10789.bitmap >>> i__10796 & 1) === 0) {
            var G__10812 = i__10796 + 1;
            var G__10813 = j__10797;
            i__10796 = G__10812;
            j__10797 = G__10813;
            continue
          }else {
            nodes__10794[i__10796] = !(this__10789.arr[j__10797] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__10789.arr[j__10797]), this__10789.arr[j__10797], this__10789.arr[j__10797 + 1], added_leaf_QMARK_) : this__10789.arr[j__10797 + 1];
            var G__10814 = i__10796 + 1;
            var G__10815 = j__10797 + 2;
            i__10796 = G__10814;
            j__10797 = G__10815;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__10793 + 1, nodes__10794)
    }else {
      var new_arr__10798 = cljs.core.make_array.call(null, 2 * (n__10793 + 1));
      cljs.core.array_copy.call(null, this__10789.arr, 0, new_arr__10798, 0, 2 * idx__10792);
      new_arr__10798[2 * idx__10792] = key;
      new_arr__10798[2 * idx__10792 + 1] = val;
      cljs.core.array_copy.call(null, this__10789.arr, 2 * idx__10792, new_arr__10798, 2 * (idx__10792 + 1), 2 * (n__10793 - idx__10792));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__10789.bitmap | bit__10791, new_arr__10798)
    }
  }else {
    var key_or_nil__10799 = this__10789.arr[2 * idx__10792];
    var val_or_node__10800 = this__10789.arr[2 * idx__10792 + 1];
    if(key_or_nil__10799 == null) {
      var n__10801 = val_or_node__10800.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__10801 === val_or_node__10800) {
        return inode__10790
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__10789.bitmap, cljs.core.clone_and_set.call(null, this__10789.arr, 2 * idx__10792 + 1, n__10801))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__10799)) {
        if(val === val_or_node__10800) {
          return inode__10790
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__10789.bitmap, cljs.core.clone_and_set.call(null, this__10789.arr, 2 * idx__10792 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__10789.bitmap, cljs.core.clone_and_set.call(null, this__10789.arr, 2 * idx__10792, null, 2 * idx__10792 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__10799, val_or_node__10800, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__10802 = this;
  var inode__10803 = this;
  var bit__10804 = 1 << (hash >>> shift & 31);
  if((this__10802.bitmap & bit__10804) === 0) {
    return not_found
  }else {
    var idx__10805 = cljs.core.bitmap_indexed_node_index.call(null, this__10802.bitmap, bit__10804);
    var key_or_nil__10806 = this__10802.arr[2 * idx__10805];
    var val_or_node__10807 = this__10802.arr[2 * idx__10805 + 1];
    if(key_or_nil__10806 == null) {
      return val_or_node__10807.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__10806)) {
        return val_or_node__10807
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__10823 = array_node.arr;
  var len__10824 = 2 * (array_node.cnt - 1);
  var new_arr__10825 = cljs.core.make_array.call(null, len__10824);
  var i__10826 = 0;
  var j__10827 = 1;
  var bitmap__10828 = 0;
  while(true) {
    if(i__10826 < len__10824) {
      if(function() {
        var and__3822__auto____10829 = !(i__10826 === idx);
        if(and__3822__auto____10829) {
          return!(arr__10823[i__10826] == null)
        }else {
          return and__3822__auto____10829
        }
      }()) {
        new_arr__10825[j__10827] = arr__10823[i__10826];
        var G__10830 = i__10826 + 1;
        var G__10831 = j__10827 + 2;
        var G__10832 = bitmap__10828 | 1 << i__10826;
        i__10826 = G__10830;
        j__10827 = G__10831;
        bitmap__10828 = G__10832;
        continue
      }else {
        var G__10833 = i__10826 + 1;
        var G__10834 = j__10827;
        var G__10835 = bitmap__10828;
        i__10826 = G__10833;
        j__10827 = G__10834;
        bitmap__10828 = G__10835;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__10828, new_arr__10825)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10836 = this;
  var inode__10837 = this;
  var idx__10838 = hash >>> shift & 31;
  var node__10839 = this__10836.arr[idx__10838];
  if(node__10839 == null) {
    var editable__10840 = cljs.core.edit_and_set.call(null, inode__10837, edit, idx__10838, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__10840.cnt = editable__10840.cnt + 1;
    return editable__10840
  }else {
    var n__10841 = node__10839.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__10841 === node__10839) {
      return inode__10837
    }else {
      return cljs.core.edit_and_set.call(null, inode__10837, edit, idx__10838, n__10841)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__10842 = this;
  var inode__10843 = this;
  return cljs.core.create_array_node_seq.call(null, this__10842.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10844 = this;
  var inode__10845 = this;
  var idx__10846 = hash >>> shift & 31;
  var node__10847 = this__10844.arr[idx__10846];
  if(node__10847 == null) {
    return inode__10845
  }else {
    var n__10848 = node__10847.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__10848 === node__10847) {
      return inode__10845
    }else {
      if(n__10848 == null) {
        if(this__10844.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__10845, edit, idx__10846)
        }else {
          var editable__10849 = cljs.core.edit_and_set.call(null, inode__10845, edit, idx__10846, n__10848);
          editable__10849.cnt = editable__10849.cnt - 1;
          return editable__10849
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__10845, edit, idx__10846, n__10848)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__10850 = this;
  var inode__10851 = this;
  if(e === this__10850.edit) {
    return inode__10851
  }else {
    return new cljs.core.ArrayNode(e, this__10850.cnt, this__10850.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__10852 = this;
  var inode__10853 = this;
  var len__10854 = this__10852.arr.length;
  var i__10855 = 0;
  var init__10856 = init;
  while(true) {
    if(i__10855 < len__10854) {
      var node__10857 = this__10852.arr[i__10855];
      if(!(node__10857 == null)) {
        var init__10858 = node__10857.kv_reduce(f, init__10856);
        if(cljs.core.reduced_QMARK_.call(null, init__10858)) {
          return cljs.core.deref.call(null, init__10858)
        }else {
          var G__10877 = i__10855 + 1;
          var G__10878 = init__10858;
          i__10855 = G__10877;
          init__10856 = G__10878;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__10856
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__10859 = this;
  var inode__10860 = this;
  var idx__10861 = hash >>> shift & 31;
  var node__10862 = this__10859.arr[idx__10861];
  if(!(node__10862 == null)) {
    return node__10862.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__10863 = this;
  var inode__10864 = this;
  var idx__10865 = hash >>> shift & 31;
  var node__10866 = this__10863.arr[idx__10865];
  if(!(node__10866 == null)) {
    var n__10867 = node__10866.inode_without(shift + 5, hash, key);
    if(n__10867 === node__10866) {
      return inode__10864
    }else {
      if(n__10867 == null) {
        if(this__10863.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__10864, null, idx__10865)
        }else {
          return new cljs.core.ArrayNode(null, this__10863.cnt - 1, cljs.core.clone_and_set.call(null, this__10863.arr, idx__10865, n__10867))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__10863.cnt, cljs.core.clone_and_set.call(null, this__10863.arr, idx__10865, n__10867))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__10864
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__10868 = this;
  var inode__10869 = this;
  var idx__10870 = hash >>> shift & 31;
  var node__10871 = this__10868.arr[idx__10870];
  if(node__10871 == null) {
    return new cljs.core.ArrayNode(null, this__10868.cnt + 1, cljs.core.clone_and_set.call(null, this__10868.arr, idx__10870, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__10872 = node__10871.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__10872 === node__10871) {
      return inode__10869
    }else {
      return new cljs.core.ArrayNode(null, this__10868.cnt, cljs.core.clone_and_set.call(null, this__10868.arr, idx__10870, n__10872))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__10873 = this;
  var inode__10874 = this;
  var idx__10875 = hash >>> shift & 31;
  var node__10876 = this__10873.arr[idx__10875];
  if(!(node__10876 == null)) {
    return node__10876.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__10881 = 2 * cnt;
  var i__10882 = 0;
  while(true) {
    if(i__10882 < lim__10881) {
      if(cljs.core.key_test.call(null, key, arr[i__10882])) {
        return i__10882
      }else {
        var G__10883 = i__10882 + 2;
        i__10882 = G__10883;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10884 = this;
  var inode__10885 = this;
  if(hash === this__10884.collision_hash) {
    var idx__10886 = cljs.core.hash_collision_node_find_index.call(null, this__10884.arr, this__10884.cnt, key);
    if(idx__10886 === -1) {
      if(this__10884.arr.length > 2 * this__10884.cnt) {
        var editable__10887 = cljs.core.edit_and_set.call(null, inode__10885, edit, 2 * this__10884.cnt, key, 2 * this__10884.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__10887.cnt = editable__10887.cnt + 1;
        return editable__10887
      }else {
        var len__10888 = this__10884.arr.length;
        var new_arr__10889 = cljs.core.make_array.call(null, len__10888 + 2);
        cljs.core.array_copy.call(null, this__10884.arr, 0, new_arr__10889, 0, len__10888);
        new_arr__10889[len__10888] = key;
        new_arr__10889[len__10888 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__10885.ensure_editable_array(edit, this__10884.cnt + 1, new_arr__10889)
      }
    }else {
      if(this__10884.arr[idx__10886 + 1] === val) {
        return inode__10885
      }else {
        return cljs.core.edit_and_set.call(null, inode__10885, edit, idx__10886 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__10884.collision_hash >>> shift & 31), [null, inode__10885, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__10890 = this;
  var inode__10891 = this;
  return cljs.core.create_inode_seq.call(null, this__10890.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10892 = this;
  var inode__10893 = this;
  var idx__10894 = cljs.core.hash_collision_node_find_index.call(null, this__10892.arr, this__10892.cnt, key);
  if(idx__10894 === -1) {
    return inode__10893
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__10892.cnt === 1) {
      return null
    }else {
      var editable__10895 = inode__10893.ensure_editable(edit);
      var earr__10896 = editable__10895.arr;
      earr__10896[idx__10894] = earr__10896[2 * this__10892.cnt - 2];
      earr__10896[idx__10894 + 1] = earr__10896[2 * this__10892.cnt - 1];
      earr__10896[2 * this__10892.cnt - 1] = null;
      earr__10896[2 * this__10892.cnt - 2] = null;
      editable__10895.cnt = editable__10895.cnt - 1;
      return editable__10895
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__10897 = this;
  var inode__10898 = this;
  if(e === this__10897.edit) {
    return inode__10898
  }else {
    var new_arr__10899 = cljs.core.make_array.call(null, 2 * (this__10897.cnt + 1));
    cljs.core.array_copy.call(null, this__10897.arr, 0, new_arr__10899, 0, 2 * this__10897.cnt);
    return new cljs.core.HashCollisionNode(e, this__10897.collision_hash, this__10897.cnt, new_arr__10899)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__10900 = this;
  var inode__10901 = this;
  return cljs.core.inode_kv_reduce.call(null, this__10900.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__10902 = this;
  var inode__10903 = this;
  var idx__10904 = cljs.core.hash_collision_node_find_index.call(null, this__10902.arr, this__10902.cnt, key);
  if(idx__10904 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__10902.arr[idx__10904])) {
      return cljs.core.PersistentVector.fromArray([this__10902.arr[idx__10904], this__10902.arr[idx__10904 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__10905 = this;
  var inode__10906 = this;
  var idx__10907 = cljs.core.hash_collision_node_find_index.call(null, this__10905.arr, this__10905.cnt, key);
  if(idx__10907 === -1) {
    return inode__10906
  }else {
    if(this__10905.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__10905.collision_hash, this__10905.cnt - 1, cljs.core.remove_pair.call(null, this__10905.arr, cljs.core.quot.call(null, idx__10907, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__10908 = this;
  var inode__10909 = this;
  if(hash === this__10908.collision_hash) {
    var idx__10910 = cljs.core.hash_collision_node_find_index.call(null, this__10908.arr, this__10908.cnt, key);
    if(idx__10910 === -1) {
      var len__10911 = this__10908.arr.length;
      var new_arr__10912 = cljs.core.make_array.call(null, len__10911 + 2);
      cljs.core.array_copy.call(null, this__10908.arr, 0, new_arr__10912, 0, len__10911);
      new_arr__10912[len__10911] = key;
      new_arr__10912[len__10911 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__10908.collision_hash, this__10908.cnt + 1, new_arr__10912)
    }else {
      if(cljs.core._EQ_.call(null, this__10908.arr[idx__10910], val)) {
        return inode__10909
      }else {
        return new cljs.core.HashCollisionNode(null, this__10908.collision_hash, this__10908.cnt, cljs.core.clone_and_set.call(null, this__10908.arr, idx__10910 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__10908.collision_hash >>> shift & 31), [null, inode__10909])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__10913 = this;
  var inode__10914 = this;
  var idx__10915 = cljs.core.hash_collision_node_find_index.call(null, this__10913.arr, this__10913.cnt, key);
  if(idx__10915 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__10913.arr[idx__10915])) {
      return this__10913.arr[idx__10915 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__10916 = this;
  var inode__10917 = this;
  if(e === this__10916.edit) {
    this__10916.arr = array;
    this__10916.cnt = count;
    return inode__10917
  }else {
    return new cljs.core.HashCollisionNode(this__10916.edit, this__10916.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__10922 = cljs.core.hash.call(null, key1);
    if(key1hash__10922 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__10922, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___10923 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__10922, key1, val1, added_leaf_QMARK___10923).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___10923)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__10924 = cljs.core.hash.call(null, key1);
    if(key1hash__10924 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__10924, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___10925 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__10924, key1, val1, added_leaf_QMARK___10925).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___10925)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10926 = this;
  var h__693__auto____10927 = this__10926.__hash;
  if(!(h__693__auto____10927 == null)) {
    return h__693__auto____10927
  }else {
    var h__693__auto____10928 = cljs.core.hash_coll.call(null, coll);
    this__10926.__hash = h__693__auto____10928;
    return h__693__auto____10928
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10929 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__10930 = this;
  var this__10931 = this;
  return cljs.core.pr_str.call(null, this__10931)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10932 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10933 = this;
  if(this__10933.s == null) {
    return cljs.core.PersistentVector.fromArray([this__10933.nodes[this__10933.i], this__10933.nodes[this__10933.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__10933.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10934 = this;
  if(this__10934.s == null) {
    return cljs.core.create_inode_seq.call(null, this__10934.nodes, this__10934.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__10934.nodes, this__10934.i, cljs.core.next.call(null, this__10934.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10935 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10936 = this;
  return new cljs.core.NodeSeq(meta, this__10936.nodes, this__10936.i, this__10936.s, this__10936.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10937 = this;
  return this__10937.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10938 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10938.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__10945 = nodes.length;
      var j__10946 = i;
      while(true) {
        if(j__10946 < len__10945) {
          if(!(nodes[j__10946] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__10946, null, null)
          }else {
            var temp__3971__auto____10947 = nodes[j__10946 + 1];
            if(cljs.core.truth_(temp__3971__auto____10947)) {
              var node__10948 = temp__3971__auto____10947;
              var temp__3971__auto____10949 = node__10948.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____10949)) {
                var node_seq__10950 = temp__3971__auto____10949;
                return new cljs.core.NodeSeq(null, nodes, j__10946 + 2, node_seq__10950, null)
              }else {
                var G__10951 = j__10946 + 2;
                j__10946 = G__10951;
                continue
              }
            }else {
              var G__10952 = j__10946 + 2;
              j__10946 = G__10952;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10953 = this;
  var h__693__auto____10954 = this__10953.__hash;
  if(!(h__693__auto____10954 == null)) {
    return h__693__auto____10954
  }else {
    var h__693__auto____10955 = cljs.core.hash_coll.call(null, coll);
    this__10953.__hash = h__693__auto____10955;
    return h__693__auto____10955
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10956 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__10957 = this;
  var this__10958 = this;
  return cljs.core.pr_str.call(null, this__10958)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10959 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10960 = this;
  return cljs.core.first.call(null, this__10960.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10961 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__10961.nodes, this__10961.i, cljs.core.next.call(null, this__10961.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10962 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10963 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__10963.nodes, this__10963.i, this__10963.s, this__10963.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10964 = this;
  return this__10964.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10965 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10965.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__10972 = nodes.length;
      var j__10973 = i;
      while(true) {
        if(j__10973 < len__10972) {
          var temp__3971__auto____10974 = nodes[j__10973];
          if(cljs.core.truth_(temp__3971__auto____10974)) {
            var nj__10975 = temp__3971__auto____10974;
            var temp__3971__auto____10976 = nj__10975.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____10976)) {
              var ns__10977 = temp__3971__auto____10976;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__10973 + 1, ns__10977, null)
            }else {
              var G__10978 = j__10973 + 1;
              j__10973 = G__10978;
              continue
            }
          }else {
            var G__10979 = j__10973 + 1;
            j__10973 = G__10979;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__10982 = this;
  return new cljs.core.TransientHashMap({}, this__10982.root, this__10982.cnt, this__10982.has_nil_QMARK_, this__10982.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10983 = this;
  var h__693__auto____10984 = this__10983.__hash;
  if(!(h__693__auto____10984 == null)) {
    return h__693__auto____10984
  }else {
    var h__693__auto____10985 = cljs.core.hash_imap.call(null, coll);
    this__10983.__hash = h__693__auto____10985;
    return h__693__auto____10985
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10986 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10987 = this;
  if(k == null) {
    if(this__10987.has_nil_QMARK_) {
      return this__10987.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__10987.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__10987.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10988 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____10989 = this__10988.has_nil_QMARK_;
      if(and__3822__auto____10989) {
        return v === this__10988.nil_val
      }else {
        return and__3822__auto____10989
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__10988.meta, this__10988.has_nil_QMARK_ ? this__10988.cnt : this__10988.cnt + 1, this__10988.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___10990 = new cljs.core.Box(false);
    var new_root__10991 = (this__10988.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__10988.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___10990);
    if(new_root__10991 === this__10988.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__10988.meta, added_leaf_QMARK___10990.val ? this__10988.cnt + 1 : this__10988.cnt, new_root__10991, this__10988.has_nil_QMARK_, this__10988.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10992 = this;
  if(k == null) {
    return this__10992.has_nil_QMARK_
  }else {
    if(this__10992.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__10992.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__11015 = null;
  var G__11015__2 = function(this_sym10993, k) {
    var this__10995 = this;
    var this_sym10993__10996 = this;
    var coll__10997 = this_sym10993__10996;
    return coll__10997.cljs$core$ILookup$_lookup$arity$2(coll__10997, k)
  };
  var G__11015__3 = function(this_sym10994, k, not_found) {
    var this__10995 = this;
    var this_sym10994__10998 = this;
    var coll__10999 = this_sym10994__10998;
    return coll__10999.cljs$core$ILookup$_lookup$arity$3(coll__10999, k, not_found)
  };
  G__11015 = function(this_sym10994, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11015__2.call(this, this_sym10994, k);
      case 3:
        return G__11015__3.call(this, this_sym10994, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11015
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym10980, args10981) {
  var this__11000 = this;
  return this_sym10980.call.apply(this_sym10980, [this_sym10980].concat(args10981.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__11001 = this;
  var init__11002 = this__11001.has_nil_QMARK_ ? f.call(null, init, null, this__11001.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__11002)) {
    return cljs.core.deref.call(null, init__11002)
  }else {
    if(!(this__11001.root == null)) {
      return this__11001.root.kv_reduce(f, init__11002)
    }else {
      if("\ufdd0'else") {
        return init__11002
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__11003 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__11004 = this;
  var this__11005 = this;
  return cljs.core.pr_str.call(null, this__11005)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11006 = this;
  if(this__11006.cnt > 0) {
    var s__11007 = !(this__11006.root == null) ? this__11006.root.inode_seq() : null;
    if(this__11006.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__11006.nil_val], true), s__11007)
    }else {
      return s__11007
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11008 = this;
  return this__11008.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11009 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11010 = this;
  return new cljs.core.PersistentHashMap(meta, this__11010.cnt, this__11010.root, this__11010.has_nil_QMARK_, this__11010.nil_val, this__11010.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11011 = this;
  return this__11011.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11012 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__11012.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__11013 = this;
  if(k == null) {
    if(this__11013.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__11013.meta, this__11013.cnt - 1, this__11013.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__11013.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__11014 = this__11013.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__11014 === this__11013.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__11013.meta, this__11013.cnt - 1, new_root__11014, this__11013.has_nil_QMARK_, this__11013.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__11016 = ks.length;
  var i__11017 = 0;
  var out__11018 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__11017 < len__11016) {
      var G__11019 = i__11017 + 1;
      var G__11020 = cljs.core.assoc_BANG_.call(null, out__11018, ks[i__11017], vs[i__11017]);
      i__11017 = G__11019;
      out__11018 = G__11020;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__11018)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__11021 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__11022 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__11023 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__11024 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__11025 = this;
  if(k == null) {
    if(this__11025.has_nil_QMARK_) {
      return this__11025.nil_val
    }else {
      return null
    }
  }else {
    if(this__11025.root == null) {
      return null
    }else {
      return this__11025.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__11026 = this;
  if(k == null) {
    if(this__11026.has_nil_QMARK_) {
      return this__11026.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__11026.root == null) {
      return not_found
    }else {
      return this__11026.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11027 = this;
  if(this__11027.edit) {
    return this__11027.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__11028 = this;
  var tcoll__11029 = this;
  if(this__11028.edit) {
    if(function() {
      var G__11030__11031 = o;
      if(G__11030__11031) {
        if(function() {
          var or__3824__auto____11032 = G__11030__11031.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____11032) {
            return or__3824__auto____11032
          }else {
            return G__11030__11031.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__11030__11031.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__11030__11031)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__11030__11031)
      }
    }()) {
      return tcoll__11029.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__11033 = cljs.core.seq.call(null, o);
      var tcoll__11034 = tcoll__11029;
      while(true) {
        var temp__3971__auto____11035 = cljs.core.first.call(null, es__11033);
        if(cljs.core.truth_(temp__3971__auto____11035)) {
          var e__11036 = temp__3971__auto____11035;
          var G__11047 = cljs.core.next.call(null, es__11033);
          var G__11048 = tcoll__11034.assoc_BANG_(cljs.core.key.call(null, e__11036), cljs.core.val.call(null, e__11036));
          es__11033 = G__11047;
          tcoll__11034 = G__11048;
          continue
        }else {
          return tcoll__11034
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__11037 = this;
  var tcoll__11038 = this;
  if(this__11037.edit) {
    if(k == null) {
      if(this__11037.nil_val === v) {
      }else {
        this__11037.nil_val = v
      }
      if(this__11037.has_nil_QMARK_) {
      }else {
        this__11037.count = this__11037.count + 1;
        this__11037.has_nil_QMARK_ = true
      }
      return tcoll__11038
    }else {
      var added_leaf_QMARK___11039 = new cljs.core.Box(false);
      var node__11040 = (this__11037.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__11037.root).inode_assoc_BANG_(this__11037.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___11039);
      if(node__11040 === this__11037.root) {
      }else {
        this__11037.root = node__11040
      }
      if(added_leaf_QMARK___11039.val) {
        this__11037.count = this__11037.count + 1
      }else {
      }
      return tcoll__11038
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__11041 = this;
  var tcoll__11042 = this;
  if(this__11041.edit) {
    if(k == null) {
      if(this__11041.has_nil_QMARK_) {
        this__11041.has_nil_QMARK_ = false;
        this__11041.nil_val = null;
        this__11041.count = this__11041.count - 1;
        return tcoll__11042
      }else {
        return tcoll__11042
      }
    }else {
      if(this__11041.root == null) {
        return tcoll__11042
      }else {
        var removed_leaf_QMARK___11043 = new cljs.core.Box(false);
        var node__11044 = this__11041.root.inode_without_BANG_(this__11041.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___11043);
        if(node__11044 === this__11041.root) {
        }else {
          this__11041.root = node__11044
        }
        if(cljs.core.truth_(removed_leaf_QMARK___11043[0])) {
          this__11041.count = this__11041.count - 1
        }else {
        }
        return tcoll__11042
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__11045 = this;
  var tcoll__11046 = this;
  if(this__11045.edit) {
    this__11045.edit = null;
    return new cljs.core.PersistentHashMap(null, this__11045.count, this__11045.root, this__11045.has_nil_QMARK_, this__11045.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__11051 = node;
  var stack__11052 = stack;
  while(true) {
    if(!(t__11051 == null)) {
      var G__11053 = ascending_QMARK_ ? t__11051.left : t__11051.right;
      var G__11054 = cljs.core.conj.call(null, stack__11052, t__11051);
      t__11051 = G__11053;
      stack__11052 = G__11054;
      continue
    }else {
      return stack__11052
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__11055 = this;
  var h__693__auto____11056 = this__11055.__hash;
  if(!(h__693__auto____11056 == null)) {
    return h__693__auto____11056
  }else {
    var h__693__auto____11057 = cljs.core.hash_coll.call(null, coll);
    this__11055.__hash = h__693__auto____11057;
    return h__693__auto____11057
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11058 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__11059 = this;
  var this__11060 = this;
  return cljs.core.pr_str.call(null, this__11060)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__11061 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11062 = this;
  if(this__11062.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__11062.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__11063 = this;
  return cljs.core.peek.call(null, this__11063.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__11064 = this;
  var t__11065 = cljs.core.first.call(null, this__11064.stack);
  var next_stack__11066 = cljs.core.tree_map_seq_push.call(null, this__11064.ascending_QMARK_ ? t__11065.right : t__11065.left, cljs.core.next.call(null, this__11064.stack), this__11064.ascending_QMARK_);
  if(!(next_stack__11066 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__11066, this__11064.ascending_QMARK_, this__11064.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11067 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11068 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__11068.stack, this__11068.ascending_QMARK_, this__11068.cnt, this__11068.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11069 = this;
  return this__11069.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____11071 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____11071) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____11071
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____11073 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____11073) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____11073
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__11077 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__11077)) {
    return cljs.core.deref.call(null, init__11077)
  }else {
    var init__11078 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__11077) : init__11077;
    if(cljs.core.reduced_QMARK_.call(null, init__11078)) {
      return cljs.core.deref.call(null, init__11078)
    }else {
      var init__11079 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__11078) : init__11078;
      if(cljs.core.reduced_QMARK_.call(null, init__11079)) {
        return cljs.core.deref.call(null, init__11079)
      }else {
        return init__11079
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__11082 = this;
  var h__693__auto____11083 = this__11082.__hash;
  if(!(h__693__auto____11083 == null)) {
    return h__693__auto____11083
  }else {
    var h__693__auto____11084 = cljs.core.hash_coll.call(null, coll);
    this__11082.__hash = h__693__auto____11084;
    return h__693__auto____11084
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__11085 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__11086 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__11087 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__11087.key, this__11087.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__11135 = null;
  var G__11135__2 = function(this_sym11088, k) {
    var this__11090 = this;
    var this_sym11088__11091 = this;
    var node__11092 = this_sym11088__11091;
    return node__11092.cljs$core$ILookup$_lookup$arity$2(node__11092, k)
  };
  var G__11135__3 = function(this_sym11089, k, not_found) {
    var this__11090 = this;
    var this_sym11089__11093 = this;
    var node__11094 = this_sym11089__11093;
    return node__11094.cljs$core$ILookup$_lookup$arity$3(node__11094, k, not_found)
  };
  G__11135 = function(this_sym11089, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11135__2.call(this, this_sym11089, k);
      case 3:
        return G__11135__3.call(this, this_sym11089, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11135
}();
cljs.core.BlackNode.prototype.apply = function(this_sym11080, args11081) {
  var this__11095 = this;
  return this_sym11080.call.apply(this_sym11080, [this_sym11080].concat(args11081.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__11096 = this;
  return cljs.core.PersistentVector.fromArray([this__11096.key, this__11096.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__11097 = this;
  return this__11097.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__11098 = this;
  return this__11098.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__11099 = this;
  var node__11100 = this;
  return ins.balance_right(node__11100)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__11101 = this;
  var node__11102 = this;
  return new cljs.core.RedNode(this__11101.key, this__11101.val, this__11101.left, this__11101.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__11103 = this;
  var node__11104 = this;
  return cljs.core.balance_right_del.call(null, this__11103.key, this__11103.val, this__11103.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__11105 = this;
  var node__11106 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__11107 = this;
  var node__11108 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__11108, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__11109 = this;
  var node__11110 = this;
  return cljs.core.balance_left_del.call(null, this__11109.key, this__11109.val, del, this__11109.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__11111 = this;
  var node__11112 = this;
  return ins.balance_left(node__11112)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__11113 = this;
  var node__11114 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__11114, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__11136 = null;
  var G__11136__0 = function() {
    var this__11115 = this;
    var this__11117 = this;
    return cljs.core.pr_str.call(null, this__11117)
  };
  G__11136 = function() {
    switch(arguments.length) {
      case 0:
        return G__11136__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11136
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__11118 = this;
  var node__11119 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__11119, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__11120 = this;
  var node__11121 = this;
  return node__11121
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__11122 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__11123 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__11124 = this;
  return cljs.core.list.call(null, this__11124.key, this__11124.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__11125 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__11126 = this;
  return this__11126.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__11127 = this;
  return cljs.core.PersistentVector.fromArray([this__11127.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__11128 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__11128.key, this__11128.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11129 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__11130 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__11130.key, this__11130.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__11131 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__11132 = this;
  if(n === 0) {
    return this__11132.key
  }else {
    if(n === 1) {
      return this__11132.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__11133 = this;
  if(n === 0) {
    return this__11133.key
  }else {
    if(n === 1) {
      return this__11133.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__11134 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__11139 = this;
  var h__693__auto____11140 = this__11139.__hash;
  if(!(h__693__auto____11140 == null)) {
    return h__693__auto____11140
  }else {
    var h__693__auto____11141 = cljs.core.hash_coll.call(null, coll);
    this__11139.__hash = h__693__auto____11141;
    return h__693__auto____11141
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__11142 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__11143 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__11144 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__11144.key, this__11144.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__11192 = null;
  var G__11192__2 = function(this_sym11145, k) {
    var this__11147 = this;
    var this_sym11145__11148 = this;
    var node__11149 = this_sym11145__11148;
    return node__11149.cljs$core$ILookup$_lookup$arity$2(node__11149, k)
  };
  var G__11192__3 = function(this_sym11146, k, not_found) {
    var this__11147 = this;
    var this_sym11146__11150 = this;
    var node__11151 = this_sym11146__11150;
    return node__11151.cljs$core$ILookup$_lookup$arity$3(node__11151, k, not_found)
  };
  G__11192 = function(this_sym11146, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11192__2.call(this, this_sym11146, k);
      case 3:
        return G__11192__3.call(this, this_sym11146, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11192
}();
cljs.core.RedNode.prototype.apply = function(this_sym11137, args11138) {
  var this__11152 = this;
  return this_sym11137.call.apply(this_sym11137, [this_sym11137].concat(args11138.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__11153 = this;
  return cljs.core.PersistentVector.fromArray([this__11153.key, this__11153.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__11154 = this;
  return this__11154.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__11155 = this;
  return this__11155.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__11156 = this;
  var node__11157 = this;
  return new cljs.core.RedNode(this__11156.key, this__11156.val, this__11156.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__11158 = this;
  var node__11159 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__11160 = this;
  var node__11161 = this;
  return new cljs.core.RedNode(this__11160.key, this__11160.val, this__11160.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__11162 = this;
  var node__11163 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__11164 = this;
  var node__11165 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__11165, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__11166 = this;
  var node__11167 = this;
  return new cljs.core.RedNode(this__11166.key, this__11166.val, del, this__11166.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__11168 = this;
  var node__11169 = this;
  return new cljs.core.RedNode(this__11168.key, this__11168.val, ins, this__11168.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__11170 = this;
  var node__11171 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__11170.left)) {
    return new cljs.core.RedNode(this__11170.key, this__11170.val, this__11170.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__11170.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__11170.right)) {
      return new cljs.core.RedNode(this__11170.right.key, this__11170.right.val, new cljs.core.BlackNode(this__11170.key, this__11170.val, this__11170.left, this__11170.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__11170.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__11171, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__11193 = null;
  var G__11193__0 = function() {
    var this__11172 = this;
    var this__11174 = this;
    return cljs.core.pr_str.call(null, this__11174)
  };
  G__11193 = function() {
    switch(arguments.length) {
      case 0:
        return G__11193__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11193
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__11175 = this;
  var node__11176 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__11175.right)) {
    return new cljs.core.RedNode(this__11175.key, this__11175.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__11175.left, null), this__11175.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__11175.left)) {
      return new cljs.core.RedNode(this__11175.left.key, this__11175.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__11175.left.left, null), new cljs.core.BlackNode(this__11175.key, this__11175.val, this__11175.left.right, this__11175.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__11176, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__11177 = this;
  var node__11178 = this;
  return new cljs.core.BlackNode(this__11177.key, this__11177.val, this__11177.left, this__11177.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__11179 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__11180 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__11181 = this;
  return cljs.core.list.call(null, this__11181.key, this__11181.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__11182 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__11183 = this;
  return this__11183.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__11184 = this;
  return cljs.core.PersistentVector.fromArray([this__11184.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__11185 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__11185.key, this__11185.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11186 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__11187 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__11187.key, this__11187.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__11188 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__11189 = this;
  if(n === 0) {
    return this__11189.key
  }else {
    if(n === 1) {
      return this__11189.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__11190 = this;
  if(n === 0) {
    return this__11190.key
  }else {
    if(n === 1) {
      return this__11190.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__11191 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__11197 = comp.call(null, k, tree.key);
    if(c__11197 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__11197 < 0) {
        var ins__11198 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__11198 == null)) {
          return tree.add_left(ins__11198)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__11199 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__11199 == null)) {
            return tree.add_right(ins__11199)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__11202 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__11202)) {
            return new cljs.core.RedNode(app__11202.key, app__11202.val, new cljs.core.RedNode(left.key, left.val, left.left, app__11202.left, null), new cljs.core.RedNode(right.key, right.val, app__11202.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__11202, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__11203 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__11203)) {
              return new cljs.core.RedNode(app__11203.key, app__11203.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__11203.left, null), new cljs.core.BlackNode(right.key, right.val, app__11203.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__11203, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__11209 = comp.call(null, k, tree.key);
    if(c__11209 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__11209 < 0) {
        var del__11210 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____11211 = !(del__11210 == null);
          if(or__3824__auto____11211) {
            return or__3824__auto____11211
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__11210, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__11210, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__11212 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____11213 = !(del__11212 == null);
            if(or__3824__auto____11213) {
              return or__3824__auto____11213
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__11212)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__11212, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__11216 = tree.key;
  var c__11217 = comp.call(null, k, tk__11216);
  if(c__11217 === 0) {
    return tree.replace(tk__11216, v, tree.left, tree.right)
  }else {
    if(c__11217 < 0) {
      return tree.replace(tk__11216, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__11216, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__11220 = this;
  var h__693__auto____11221 = this__11220.__hash;
  if(!(h__693__auto____11221 == null)) {
    return h__693__auto____11221
  }else {
    var h__693__auto____11222 = cljs.core.hash_imap.call(null, coll);
    this__11220.__hash = h__693__auto____11222;
    return h__693__auto____11222
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__11223 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__11224 = this;
  var n__11225 = coll.entry_at(k);
  if(!(n__11225 == null)) {
    return n__11225.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__11226 = this;
  var found__11227 = [null];
  var t__11228 = cljs.core.tree_map_add.call(null, this__11226.comp, this__11226.tree, k, v, found__11227);
  if(t__11228 == null) {
    var found_node__11229 = cljs.core.nth.call(null, found__11227, 0);
    if(cljs.core._EQ_.call(null, v, found_node__11229.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__11226.comp, cljs.core.tree_map_replace.call(null, this__11226.comp, this__11226.tree, k, v), this__11226.cnt, this__11226.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__11226.comp, t__11228.blacken(), this__11226.cnt + 1, this__11226.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__11230 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__11264 = null;
  var G__11264__2 = function(this_sym11231, k) {
    var this__11233 = this;
    var this_sym11231__11234 = this;
    var coll__11235 = this_sym11231__11234;
    return coll__11235.cljs$core$ILookup$_lookup$arity$2(coll__11235, k)
  };
  var G__11264__3 = function(this_sym11232, k, not_found) {
    var this__11233 = this;
    var this_sym11232__11236 = this;
    var coll__11237 = this_sym11232__11236;
    return coll__11237.cljs$core$ILookup$_lookup$arity$3(coll__11237, k, not_found)
  };
  G__11264 = function(this_sym11232, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11264__2.call(this, this_sym11232, k);
      case 3:
        return G__11264__3.call(this, this_sym11232, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11264
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym11218, args11219) {
  var this__11238 = this;
  return this_sym11218.call.apply(this_sym11218, [this_sym11218].concat(args11219.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__11239 = this;
  if(!(this__11239.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__11239.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__11240 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__11241 = this;
  if(this__11241.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__11241.tree, false, this__11241.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__11242 = this;
  var this__11243 = this;
  return cljs.core.pr_str.call(null, this__11243)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__11244 = this;
  var coll__11245 = this;
  var t__11246 = this__11244.tree;
  while(true) {
    if(!(t__11246 == null)) {
      var c__11247 = this__11244.comp.call(null, k, t__11246.key);
      if(c__11247 === 0) {
        return t__11246
      }else {
        if(c__11247 < 0) {
          var G__11265 = t__11246.left;
          t__11246 = G__11265;
          continue
        }else {
          if("\ufdd0'else") {
            var G__11266 = t__11246.right;
            t__11246 = G__11266;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__11248 = this;
  if(this__11248.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__11248.tree, ascending_QMARK_, this__11248.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__11249 = this;
  if(this__11249.cnt > 0) {
    var stack__11250 = null;
    var t__11251 = this__11249.tree;
    while(true) {
      if(!(t__11251 == null)) {
        var c__11252 = this__11249.comp.call(null, k, t__11251.key);
        if(c__11252 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__11250, t__11251), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__11252 < 0) {
              var G__11267 = cljs.core.conj.call(null, stack__11250, t__11251);
              var G__11268 = t__11251.left;
              stack__11250 = G__11267;
              t__11251 = G__11268;
              continue
            }else {
              var G__11269 = stack__11250;
              var G__11270 = t__11251.right;
              stack__11250 = G__11269;
              t__11251 = G__11270;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__11252 > 0) {
                var G__11271 = cljs.core.conj.call(null, stack__11250, t__11251);
                var G__11272 = t__11251.right;
                stack__11250 = G__11271;
                t__11251 = G__11272;
                continue
              }else {
                var G__11273 = stack__11250;
                var G__11274 = t__11251.left;
                stack__11250 = G__11273;
                t__11251 = G__11274;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__11250 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__11250, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__11253 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__11254 = this;
  return this__11254.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11255 = this;
  if(this__11255.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__11255.tree, true, this__11255.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11256 = this;
  return this__11256.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11257 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11258 = this;
  return new cljs.core.PersistentTreeMap(this__11258.comp, this__11258.tree, this__11258.cnt, meta, this__11258.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11259 = this;
  return this__11259.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11260 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__11260.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__11261 = this;
  var found__11262 = [null];
  var t__11263 = cljs.core.tree_map_remove.call(null, this__11261.comp, this__11261.tree, k, found__11262);
  if(t__11263 == null) {
    if(cljs.core.nth.call(null, found__11262, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__11261.comp, null, 0, this__11261.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__11261.comp, t__11263.blacken(), this__11261.cnt - 1, this__11261.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__11277 = cljs.core.seq.call(null, keyvals);
    var out__11278 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__11277) {
        var G__11279 = cljs.core.nnext.call(null, in__11277);
        var G__11280 = cljs.core.assoc_BANG_.call(null, out__11278, cljs.core.first.call(null, in__11277), cljs.core.second.call(null, in__11277));
        in__11277 = G__11279;
        out__11278 = G__11280;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__11278)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__11281) {
    var keyvals = cljs.core.seq(arglist__11281);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__11282) {
    var keyvals = cljs.core.seq(arglist__11282);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__11286 = [];
    var obj__11287 = {};
    var kvs__11288 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__11288) {
        ks__11286.push(cljs.core.first.call(null, kvs__11288));
        obj__11287[cljs.core.first.call(null, kvs__11288)] = cljs.core.second.call(null, kvs__11288);
        var G__11289 = cljs.core.nnext.call(null, kvs__11288);
        kvs__11288 = G__11289;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__11286, obj__11287)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__11290) {
    var keyvals = cljs.core.seq(arglist__11290);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__11293 = cljs.core.seq.call(null, keyvals);
    var out__11294 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__11293) {
        var G__11295 = cljs.core.nnext.call(null, in__11293);
        var G__11296 = cljs.core.assoc.call(null, out__11294, cljs.core.first.call(null, in__11293), cljs.core.second.call(null, in__11293));
        in__11293 = G__11295;
        out__11294 = G__11296;
        continue
      }else {
        return out__11294
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__11297) {
    var keyvals = cljs.core.seq(arglist__11297);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__11300 = cljs.core.seq.call(null, keyvals);
    var out__11301 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__11300) {
        var G__11302 = cljs.core.nnext.call(null, in__11300);
        var G__11303 = cljs.core.assoc.call(null, out__11301, cljs.core.first.call(null, in__11300), cljs.core.second.call(null, in__11300));
        in__11300 = G__11302;
        out__11301 = G__11303;
        continue
      }else {
        return out__11301
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__11304) {
    var comparator = cljs.core.first(arglist__11304);
    var keyvals = cljs.core.rest(arglist__11304);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__11305_SHARP_, p2__11306_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____11308 = p1__11305_SHARP_;
          if(cljs.core.truth_(or__3824__auto____11308)) {
            return or__3824__auto____11308
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__11306_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__11309) {
    var maps = cljs.core.seq(arglist__11309);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__11317 = function(m, e) {
        var k__11315 = cljs.core.first.call(null, e);
        var v__11316 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__11315)) {
          return cljs.core.assoc.call(null, m, k__11315, f.call(null, cljs.core._lookup.call(null, m, k__11315, null), v__11316))
        }else {
          return cljs.core.assoc.call(null, m, k__11315, v__11316)
        }
      };
      var merge2__11319 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__11317, function() {
          var or__3824__auto____11318 = m1;
          if(cljs.core.truth_(or__3824__auto____11318)) {
            return or__3824__auto____11318
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__11319, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__11320) {
    var f = cljs.core.first(arglist__11320);
    var maps = cljs.core.rest(arglist__11320);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__11325 = cljs.core.ObjMap.EMPTY;
  var keys__11326 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__11326) {
      var key__11327 = cljs.core.first.call(null, keys__11326);
      var entry__11328 = cljs.core._lookup.call(null, map, key__11327, "\ufdd0'user/not-found");
      var G__11329 = cljs.core.not_EQ_.call(null, entry__11328, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__11325, key__11327, entry__11328) : ret__11325;
      var G__11330 = cljs.core.next.call(null, keys__11326);
      ret__11325 = G__11329;
      keys__11326 = G__11330;
      continue
    }else {
      return ret__11325
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__11334 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__11334.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__11335 = this;
  var h__693__auto____11336 = this__11335.__hash;
  if(!(h__693__auto____11336 == null)) {
    return h__693__auto____11336
  }else {
    var h__693__auto____11337 = cljs.core.hash_iset.call(null, coll);
    this__11335.__hash = h__693__auto____11337;
    return h__693__auto____11337
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__11338 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__11339 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__11339.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__11360 = null;
  var G__11360__2 = function(this_sym11340, k) {
    var this__11342 = this;
    var this_sym11340__11343 = this;
    var coll__11344 = this_sym11340__11343;
    return coll__11344.cljs$core$ILookup$_lookup$arity$2(coll__11344, k)
  };
  var G__11360__3 = function(this_sym11341, k, not_found) {
    var this__11342 = this;
    var this_sym11341__11345 = this;
    var coll__11346 = this_sym11341__11345;
    return coll__11346.cljs$core$ILookup$_lookup$arity$3(coll__11346, k, not_found)
  };
  G__11360 = function(this_sym11341, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11360__2.call(this, this_sym11341, k);
      case 3:
        return G__11360__3.call(this, this_sym11341, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11360
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym11332, args11333) {
  var this__11347 = this;
  return this_sym11332.call.apply(this_sym11332, [this_sym11332].concat(args11333.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11348 = this;
  return new cljs.core.PersistentHashSet(this__11348.meta, cljs.core.assoc.call(null, this__11348.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__11349 = this;
  var this__11350 = this;
  return cljs.core.pr_str.call(null, this__11350)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11351 = this;
  return cljs.core.keys.call(null, this__11351.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__11352 = this;
  return new cljs.core.PersistentHashSet(this__11352.meta, cljs.core.dissoc.call(null, this__11352.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11353 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11354 = this;
  var and__3822__auto____11355 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____11355) {
    var and__3822__auto____11356 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____11356) {
      return cljs.core.every_QMARK_.call(null, function(p1__11331_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__11331_SHARP_)
      }, other)
    }else {
      return and__3822__auto____11356
    }
  }else {
    return and__3822__auto____11355
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11357 = this;
  return new cljs.core.PersistentHashSet(meta, this__11357.hash_map, this__11357.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11358 = this;
  return this__11358.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11359 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__11359.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__11361 = cljs.core.count.call(null, items);
  var i__11362 = 0;
  var out__11363 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__11362 < len__11361) {
      var G__11364 = i__11362 + 1;
      var G__11365 = cljs.core.conj_BANG_.call(null, out__11363, items[i__11362]);
      i__11362 = G__11364;
      out__11363 = G__11365;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__11363)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__11383 = null;
  var G__11383__2 = function(this_sym11369, k) {
    var this__11371 = this;
    var this_sym11369__11372 = this;
    var tcoll__11373 = this_sym11369__11372;
    if(cljs.core._lookup.call(null, this__11371.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__11383__3 = function(this_sym11370, k, not_found) {
    var this__11371 = this;
    var this_sym11370__11374 = this;
    var tcoll__11375 = this_sym11370__11374;
    if(cljs.core._lookup.call(null, this__11371.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__11383 = function(this_sym11370, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11383__2.call(this, this_sym11370, k);
      case 3:
        return G__11383__3.call(this, this_sym11370, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11383
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym11367, args11368) {
  var this__11376 = this;
  return this_sym11367.call.apply(this_sym11367, [this_sym11367].concat(args11368.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__11377 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__11378 = this;
  if(cljs.core._lookup.call(null, this__11378.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__11379 = this;
  return cljs.core.count.call(null, this__11379.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__11380 = this;
  this__11380.transient_map = cljs.core.dissoc_BANG_.call(null, this__11380.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__11381 = this;
  this__11381.transient_map = cljs.core.assoc_BANG_.call(null, this__11381.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__11382 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__11382.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__11386 = this;
  var h__693__auto____11387 = this__11386.__hash;
  if(!(h__693__auto____11387 == null)) {
    return h__693__auto____11387
  }else {
    var h__693__auto____11388 = cljs.core.hash_iset.call(null, coll);
    this__11386.__hash = h__693__auto____11388;
    return h__693__auto____11388
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__11389 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__11390 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__11390.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__11416 = null;
  var G__11416__2 = function(this_sym11391, k) {
    var this__11393 = this;
    var this_sym11391__11394 = this;
    var coll__11395 = this_sym11391__11394;
    return coll__11395.cljs$core$ILookup$_lookup$arity$2(coll__11395, k)
  };
  var G__11416__3 = function(this_sym11392, k, not_found) {
    var this__11393 = this;
    var this_sym11392__11396 = this;
    var coll__11397 = this_sym11392__11396;
    return coll__11397.cljs$core$ILookup$_lookup$arity$3(coll__11397, k, not_found)
  };
  G__11416 = function(this_sym11392, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11416__2.call(this, this_sym11392, k);
      case 3:
        return G__11416__3.call(this, this_sym11392, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11416
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym11384, args11385) {
  var this__11398 = this;
  return this_sym11384.call.apply(this_sym11384, [this_sym11384].concat(args11385.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11399 = this;
  return new cljs.core.PersistentTreeSet(this__11399.meta, cljs.core.assoc.call(null, this__11399.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__11400 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__11400.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__11401 = this;
  var this__11402 = this;
  return cljs.core.pr_str.call(null, this__11402)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__11403 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__11403.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__11404 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__11404.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__11405 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__11406 = this;
  return cljs.core._comparator.call(null, this__11406.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11407 = this;
  return cljs.core.keys.call(null, this__11407.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__11408 = this;
  return new cljs.core.PersistentTreeSet(this__11408.meta, cljs.core.dissoc.call(null, this__11408.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11409 = this;
  return cljs.core.count.call(null, this__11409.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11410 = this;
  var and__3822__auto____11411 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____11411) {
    var and__3822__auto____11412 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____11412) {
      return cljs.core.every_QMARK_.call(null, function(p1__11366_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__11366_SHARP_)
      }, other)
    }else {
      return and__3822__auto____11412
    }
  }else {
    return and__3822__auto____11411
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11413 = this;
  return new cljs.core.PersistentTreeSet(meta, this__11413.tree_map, this__11413.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11414 = this;
  return this__11414.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11415 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__11415.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__11421__delegate = function(keys) {
      var in__11419 = cljs.core.seq.call(null, keys);
      var out__11420 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__11419)) {
          var G__11422 = cljs.core.next.call(null, in__11419);
          var G__11423 = cljs.core.conj_BANG_.call(null, out__11420, cljs.core.first.call(null, in__11419));
          in__11419 = G__11422;
          out__11420 = G__11423;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__11420)
        }
        break
      }
    };
    var G__11421 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11421__delegate.call(this, keys)
    };
    G__11421.cljs$lang$maxFixedArity = 0;
    G__11421.cljs$lang$applyTo = function(arglist__11424) {
      var keys = cljs.core.seq(arglist__11424);
      return G__11421__delegate(keys)
    };
    G__11421.cljs$lang$arity$variadic = G__11421__delegate;
    return G__11421
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__11425) {
    var keys = cljs.core.seq(arglist__11425);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__11427) {
    var comparator = cljs.core.first(arglist__11427);
    var keys = cljs.core.rest(arglist__11427);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__11433 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____11434 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____11434)) {
        var e__11435 = temp__3971__auto____11434;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__11435))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__11433, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__11426_SHARP_) {
      var temp__3971__auto____11436 = cljs.core.find.call(null, smap, p1__11426_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____11436)) {
        var e__11437 = temp__3971__auto____11436;
        return cljs.core.second.call(null, e__11437)
      }else {
        return p1__11426_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__11467 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__11460, seen) {
        while(true) {
          var vec__11461__11462 = p__11460;
          var f__11463 = cljs.core.nth.call(null, vec__11461__11462, 0, null);
          var xs__11464 = vec__11461__11462;
          var temp__3974__auto____11465 = cljs.core.seq.call(null, xs__11464);
          if(temp__3974__auto____11465) {
            var s__11466 = temp__3974__auto____11465;
            if(cljs.core.contains_QMARK_.call(null, seen, f__11463)) {
              var G__11468 = cljs.core.rest.call(null, s__11466);
              var G__11469 = seen;
              p__11460 = G__11468;
              seen = G__11469;
              continue
            }else {
              return cljs.core.cons.call(null, f__11463, step.call(null, cljs.core.rest.call(null, s__11466), cljs.core.conj.call(null, seen, f__11463)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__11467.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__11472 = cljs.core.PersistentVector.EMPTY;
  var s__11473 = s;
  while(true) {
    if(cljs.core.next.call(null, s__11473)) {
      var G__11474 = cljs.core.conj.call(null, ret__11472, cljs.core.first.call(null, s__11473));
      var G__11475 = cljs.core.next.call(null, s__11473);
      ret__11472 = G__11474;
      s__11473 = G__11475;
      continue
    }else {
      return cljs.core.seq.call(null, ret__11472)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____11478 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____11478) {
        return or__3824__auto____11478
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__11479 = x.lastIndexOf("/");
      if(i__11479 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__11479 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____11482 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____11482) {
      return or__3824__auto____11482
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__11483 = x.lastIndexOf("/");
    if(i__11483 > -1) {
      return cljs.core.subs.call(null, x, 2, i__11483)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__11490 = cljs.core.ObjMap.EMPTY;
  var ks__11491 = cljs.core.seq.call(null, keys);
  var vs__11492 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____11493 = ks__11491;
      if(and__3822__auto____11493) {
        return vs__11492
      }else {
        return and__3822__auto____11493
      }
    }()) {
      var G__11494 = cljs.core.assoc.call(null, map__11490, cljs.core.first.call(null, ks__11491), cljs.core.first.call(null, vs__11492));
      var G__11495 = cljs.core.next.call(null, ks__11491);
      var G__11496 = cljs.core.next.call(null, vs__11492);
      map__11490 = G__11494;
      ks__11491 = G__11495;
      vs__11492 = G__11496;
      continue
    }else {
      return map__11490
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__11499__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__11484_SHARP_, p2__11485_SHARP_) {
        return max_key.call(null, k, p1__11484_SHARP_, p2__11485_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__11499 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11499__delegate.call(this, k, x, y, more)
    };
    G__11499.cljs$lang$maxFixedArity = 3;
    G__11499.cljs$lang$applyTo = function(arglist__11500) {
      var k = cljs.core.first(arglist__11500);
      var x = cljs.core.first(cljs.core.next(arglist__11500));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11500)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11500)));
      return G__11499__delegate(k, x, y, more)
    };
    G__11499.cljs$lang$arity$variadic = G__11499__delegate;
    return G__11499
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__11501__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__11497_SHARP_, p2__11498_SHARP_) {
        return min_key.call(null, k, p1__11497_SHARP_, p2__11498_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__11501 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11501__delegate.call(this, k, x, y, more)
    };
    G__11501.cljs$lang$maxFixedArity = 3;
    G__11501.cljs$lang$applyTo = function(arglist__11502) {
      var k = cljs.core.first(arglist__11502);
      var x = cljs.core.first(cljs.core.next(arglist__11502));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11502)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11502)));
      return G__11501__delegate(k, x, y, more)
    };
    G__11501.cljs$lang$arity$variadic = G__11501__delegate;
    return G__11501
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____11505 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____11505) {
        var s__11506 = temp__3974__auto____11505;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__11506), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__11506)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____11509 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____11509) {
      var s__11510 = temp__3974__auto____11509;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__11510)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__11510), take_while.call(null, pred, cljs.core.rest.call(null, s__11510)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__11512 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__11512.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__11524 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____11525 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____11525)) {
        var vec__11526__11527 = temp__3974__auto____11525;
        var e__11528 = cljs.core.nth.call(null, vec__11526__11527, 0, null);
        var s__11529 = vec__11526__11527;
        if(cljs.core.truth_(include__11524.call(null, e__11528))) {
          return s__11529
        }else {
          return cljs.core.next.call(null, s__11529)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__11524, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____11530 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____11530)) {
      var vec__11531__11532 = temp__3974__auto____11530;
      var e__11533 = cljs.core.nth.call(null, vec__11531__11532, 0, null);
      var s__11534 = vec__11531__11532;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__11533)) ? s__11534 : cljs.core.next.call(null, s__11534))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__11546 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____11547 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____11547)) {
        var vec__11548__11549 = temp__3974__auto____11547;
        var e__11550 = cljs.core.nth.call(null, vec__11548__11549, 0, null);
        var s__11551 = vec__11548__11549;
        if(cljs.core.truth_(include__11546.call(null, e__11550))) {
          return s__11551
        }else {
          return cljs.core.next.call(null, s__11551)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__11546, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____11552 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____11552)) {
      var vec__11553__11554 = temp__3974__auto____11552;
      var e__11555 = cljs.core.nth.call(null, vec__11553__11554, 0, null);
      var s__11556 = vec__11553__11554;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__11555)) ? s__11556 : cljs.core.next.call(null, s__11556))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__11557 = this;
  var h__693__auto____11558 = this__11557.__hash;
  if(!(h__693__auto____11558 == null)) {
    return h__693__auto____11558
  }else {
    var h__693__auto____11559 = cljs.core.hash_coll.call(null, rng);
    this__11557.__hash = h__693__auto____11559;
    return h__693__auto____11559
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__11560 = this;
  if(this__11560.step > 0) {
    if(this__11560.start + this__11560.step < this__11560.end) {
      return new cljs.core.Range(this__11560.meta, this__11560.start + this__11560.step, this__11560.end, this__11560.step, null)
    }else {
      return null
    }
  }else {
    if(this__11560.start + this__11560.step > this__11560.end) {
      return new cljs.core.Range(this__11560.meta, this__11560.start + this__11560.step, this__11560.end, this__11560.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__11561 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__11562 = this;
  var this__11563 = this;
  return cljs.core.pr_str.call(null, this__11563)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__11564 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__11565 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__11566 = this;
  if(this__11566.step > 0) {
    if(this__11566.start < this__11566.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__11566.start > this__11566.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__11567 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__11567.end - this__11567.start) / this__11567.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__11568 = this;
  return this__11568.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__11569 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__11569.meta, this__11569.start + this__11569.step, this__11569.end, this__11569.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__11570 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__11571 = this;
  return new cljs.core.Range(meta, this__11571.start, this__11571.end, this__11571.step, this__11571.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__11572 = this;
  return this__11572.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__11573 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__11573.start + n * this__11573.step
  }else {
    if(function() {
      var and__3822__auto____11574 = this__11573.start > this__11573.end;
      if(and__3822__auto____11574) {
        return this__11573.step === 0
      }else {
        return and__3822__auto____11574
      }
    }()) {
      return this__11573.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__11575 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__11575.start + n * this__11575.step
  }else {
    if(function() {
      var and__3822__auto____11576 = this__11575.start > this__11575.end;
      if(and__3822__auto____11576) {
        return this__11575.step === 0
      }else {
        return and__3822__auto____11576
      }
    }()) {
      return this__11575.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__11577 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__11577.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____11580 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____11580) {
      var s__11581 = temp__3974__auto____11580;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__11581), take_nth.call(null, n, cljs.core.drop.call(null, n, s__11581)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____11588 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____11588) {
      var s__11589 = temp__3974__auto____11588;
      var fst__11590 = cljs.core.first.call(null, s__11589);
      var fv__11591 = f.call(null, fst__11590);
      var run__11592 = cljs.core.cons.call(null, fst__11590, cljs.core.take_while.call(null, function(p1__11582_SHARP_) {
        return cljs.core._EQ_.call(null, fv__11591, f.call(null, p1__11582_SHARP_))
      }, cljs.core.next.call(null, s__11589)));
      return cljs.core.cons.call(null, run__11592, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__11592), s__11589))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____11607 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____11607) {
        var s__11608 = temp__3971__auto____11607;
        return reductions.call(null, f, cljs.core.first.call(null, s__11608), cljs.core.rest.call(null, s__11608))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____11609 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____11609) {
        var s__11610 = temp__3974__auto____11609;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__11610)), cljs.core.rest.call(null, s__11610))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__11613 = null;
      var G__11613__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__11613__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__11613__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__11613__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__11613__4 = function() {
        var G__11614__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__11614 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11614__delegate.call(this, x, y, z, args)
        };
        G__11614.cljs$lang$maxFixedArity = 3;
        G__11614.cljs$lang$applyTo = function(arglist__11615) {
          var x = cljs.core.first(arglist__11615);
          var y = cljs.core.first(cljs.core.next(arglist__11615));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11615)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11615)));
          return G__11614__delegate(x, y, z, args)
        };
        G__11614.cljs$lang$arity$variadic = G__11614__delegate;
        return G__11614
      }();
      G__11613 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11613__0.call(this);
          case 1:
            return G__11613__1.call(this, x);
          case 2:
            return G__11613__2.call(this, x, y);
          case 3:
            return G__11613__3.call(this, x, y, z);
          default:
            return G__11613__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11613.cljs$lang$maxFixedArity = 3;
      G__11613.cljs$lang$applyTo = G__11613__4.cljs$lang$applyTo;
      return G__11613
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__11616 = null;
      var G__11616__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__11616__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__11616__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__11616__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__11616__4 = function() {
        var G__11617__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__11617 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11617__delegate.call(this, x, y, z, args)
        };
        G__11617.cljs$lang$maxFixedArity = 3;
        G__11617.cljs$lang$applyTo = function(arglist__11618) {
          var x = cljs.core.first(arglist__11618);
          var y = cljs.core.first(cljs.core.next(arglist__11618));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11618)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11618)));
          return G__11617__delegate(x, y, z, args)
        };
        G__11617.cljs$lang$arity$variadic = G__11617__delegate;
        return G__11617
      }();
      G__11616 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11616__0.call(this);
          case 1:
            return G__11616__1.call(this, x);
          case 2:
            return G__11616__2.call(this, x, y);
          case 3:
            return G__11616__3.call(this, x, y, z);
          default:
            return G__11616__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11616.cljs$lang$maxFixedArity = 3;
      G__11616.cljs$lang$applyTo = G__11616__4.cljs$lang$applyTo;
      return G__11616
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__11619 = null;
      var G__11619__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__11619__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__11619__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__11619__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__11619__4 = function() {
        var G__11620__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__11620 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11620__delegate.call(this, x, y, z, args)
        };
        G__11620.cljs$lang$maxFixedArity = 3;
        G__11620.cljs$lang$applyTo = function(arglist__11621) {
          var x = cljs.core.first(arglist__11621);
          var y = cljs.core.first(cljs.core.next(arglist__11621));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11621)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11621)));
          return G__11620__delegate(x, y, z, args)
        };
        G__11620.cljs$lang$arity$variadic = G__11620__delegate;
        return G__11620
      }();
      G__11619 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11619__0.call(this);
          case 1:
            return G__11619__1.call(this, x);
          case 2:
            return G__11619__2.call(this, x, y);
          case 3:
            return G__11619__3.call(this, x, y, z);
          default:
            return G__11619__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11619.cljs$lang$maxFixedArity = 3;
      G__11619.cljs$lang$applyTo = G__11619__4.cljs$lang$applyTo;
      return G__11619
    }()
  };
  var juxt__4 = function() {
    var G__11622__delegate = function(f, g, h, fs) {
      var fs__11612 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__11623 = null;
        var G__11623__0 = function() {
          return cljs.core.reduce.call(null, function(p1__11593_SHARP_, p2__11594_SHARP_) {
            return cljs.core.conj.call(null, p1__11593_SHARP_, p2__11594_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__11612)
        };
        var G__11623__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__11595_SHARP_, p2__11596_SHARP_) {
            return cljs.core.conj.call(null, p1__11595_SHARP_, p2__11596_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__11612)
        };
        var G__11623__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__11597_SHARP_, p2__11598_SHARP_) {
            return cljs.core.conj.call(null, p1__11597_SHARP_, p2__11598_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__11612)
        };
        var G__11623__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__11599_SHARP_, p2__11600_SHARP_) {
            return cljs.core.conj.call(null, p1__11599_SHARP_, p2__11600_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__11612)
        };
        var G__11623__4 = function() {
          var G__11624__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__11601_SHARP_, p2__11602_SHARP_) {
              return cljs.core.conj.call(null, p1__11601_SHARP_, cljs.core.apply.call(null, p2__11602_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__11612)
          };
          var G__11624 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__11624__delegate.call(this, x, y, z, args)
          };
          G__11624.cljs$lang$maxFixedArity = 3;
          G__11624.cljs$lang$applyTo = function(arglist__11625) {
            var x = cljs.core.first(arglist__11625);
            var y = cljs.core.first(cljs.core.next(arglist__11625));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11625)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11625)));
            return G__11624__delegate(x, y, z, args)
          };
          G__11624.cljs$lang$arity$variadic = G__11624__delegate;
          return G__11624
        }();
        G__11623 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__11623__0.call(this);
            case 1:
              return G__11623__1.call(this, x);
            case 2:
              return G__11623__2.call(this, x, y);
            case 3:
              return G__11623__3.call(this, x, y, z);
            default:
              return G__11623__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__11623.cljs$lang$maxFixedArity = 3;
        G__11623.cljs$lang$applyTo = G__11623__4.cljs$lang$applyTo;
        return G__11623
      }()
    };
    var G__11622 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11622__delegate.call(this, f, g, h, fs)
    };
    G__11622.cljs$lang$maxFixedArity = 3;
    G__11622.cljs$lang$applyTo = function(arglist__11626) {
      var f = cljs.core.first(arglist__11626);
      var g = cljs.core.first(cljs.core.next(arglist__11626));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11626)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11626)));
      return G__11622__delegate(f, g, h, fs)
    };
    G__11622.cljs$lang$arity$variadic = G__11622__delegate;
    return G__11622
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__11629 = cljs.core.next.call(null, coll);
        coll = G__11629;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____11628 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____11628) {
          return n > 0
        }else {
          return and__3822__auto____11628
        }
      }())) {
        var G__11630 = n - 1;
        var G__11631 = cljs.core.next.call(null, coll);
        n = G__11630;
        coll = G__11631;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__11633 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__11633), s)) {
    if(cljs.core.count.call(null, matches__11633) === 1) {
      return cljs.core.first.call(null, matches__11633)
    }else {
      return cljs.core.vec.call(null, matches__11633)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__11635 = re.exec(s);
  if(matches__11635 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__11635) === 1) {
      return cljs.core.first.call(null, matches__11635)
    }else {
      return cljs.core.vec.call(null, matches__11635)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__11640 = cljs.core.re_find.call(null, re, s);
  var match_idx__11641 = s.search(re);
  var match_str__11642 = cljs.core.coll_QMARK_.call(null, match_data__11640) ? cljs.core.first.call(null, match_data__11640) : match_data__11640;
  var post_match__11643 = cljs.core.subs.call(null, s, match_idx__11641 + cljs.core.count.call(null, match_str__11642));
  if(cljs.core.truth_(match_data__11640)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__11640, re_seq.call(null, re, post_match__11643))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__11650__11651 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___11652 = cljs.core.nth.call(null, vec__11650__11651, 0, null);
  var flags__11653 = cljs.core.nth.call(null, vec__11650__11651, 1, null);
  var pattern__11654 = cljs.core.nth.call(null, vec__11650__11651, 2, null);
  return new RegExp(pattern__11654, flags__11653)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__11644_SHARP_) {
    return print_one.call(null, p1__11644_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____11664 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____11664)) {
            var and__3822__auto____11668 = function() {
              var G__11665__11666 = obj;
              if(G__11665__11666) {
                if(function() {
                  var or__3824__auto____11667 = G__11665__11666.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____11667) {
                    return or__3824__auto____11667
                  }else {
                    return G__11665__11666.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__11665__11666.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__11665__11666)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__11665__11666)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____11668)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____11668
            }
          }else {
            return and__3822__auto____11664
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____11669 = !(obj == null);
          if(and__3822__auto____11669) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____11669
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__11670__11671 = obj;
          if(G__11670__11671) {
            if(function() {
              var or__3824__auto____11672 = G__11670__11671.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____11672) {
                return or__3824__auto____11672
              }else {
                return G__11670__11671.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__11670__11671.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__11670__11671)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__11670__11671)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__11692 = new goog.string.StringBuffer;
  var G__11693__11694 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__11693__11694) {
    var string__11695 = cljs.core.first.call(null, G__11693__11694);
    var G__11693__11696 = G__11693__11694;
    while(true) {
      sb__11692.append(string__11695);
      var temp__3974__auto____11697 = cljs.core.next.call(null, G__11693__11696);
      if(temp__3974__auto____11697) {
        var G__11693__11698 = temp__3974__auto____11697;
        var G__11711 = cljs.core.first.call(null, G__11693__11698);
        var G__11712 = G__11693__11698;
        string__11695 = G__11711;
        G__11693__11696 = G__11712;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__11699__11700 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__11699__11700) {
    var obj__11701 = cljs.core.first.call(null, G__11699__11700);
    var G__11699__11702 = G__11699__11700;
    while(true) {
      sb__11692.append(" ");
      var G__11703__11704 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__11701, opts));
      if(G__11703__11704) {
        var string__11705 = cljs.core.first.call(null, G__11703__11704);
        var G__11703__11706 = G__11703__11704;
        while(true) {
          sb__11692.append(string__11705);
          var temp__3974__auto____11707 = cljs.core.next.call(null, G__11703__11706);
          if(temp__3974__auto____11707) {
            var G__11703__11708 = temp__3974__auto____11707;
            var G__11713 = cljs.core.first.call(null, G__11703__11708);
            var G__11714 = G__11703__11708;
            string__11705 = G__11713;
            G__11703__11706 = G__11714;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____11709 = cljs.core.next.call(null, G__11699__11702);
      if(temp__3974__auto____11709) {
        var G__11699__11710 = temp__3974__auto____11709;
        var G__11715 = cljs.core.first.call(null, G__11699__11710);
        var G__11716 = G__11699__11710;
        obj__11701 = G__11715;
        G__11699__11702 = G__11716;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__11692
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__11718 = cljs.core.pr_sb.call(null, objs, opts);
  sb__11718.append("\n");
  return[cljs.core.str(sb__11718)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__11737__11738 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__11737__11738) {
    var string__11739 = cljs.core.first.call(null, G__11737__11738);
    var G__11737__11740 = G__11737__11738;
    while(true) {
      cljs.core.string_print.call(null, string__11739);
      var temp__3974__auto____11741 = cljs.core.next.call(null, G__11737__11740);
      if(temp__3974__auto____11741) {
        var G__11737__11742 = temp__3974__auto____11741;
        var G__11755 = cljs.core.first.call(null, G__11737__11742);
        var G__11756 = G__11737__11742;
        string__11739 = G__11755;
        G__11737__11740 = G__11756;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__11743__11744 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__11743__11744) {
    var obj__11745 = cljs.core.first.call(null, G__11743__11744);
    var G__11743__11746 = G__11743__11744;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__11747__11748 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__11745, opts));
      if(G__11747__11748) {
        var string__11749 = cljs.core.first.call(null, G__11747__11748);
        var G__11747__11750 = G__11747__11748;
        while(true) {
          cljs.core.string_print.call(null, string__11749);
          var temp__3974__auto____11751 = cljs.core.next.call(null, G__11747__11750);
          if(temp__3974__auto____11751) {
            var G__11747__11752 = temp__3974__auto____11751;
            var G__11757 = cljs.core.first.call(null, G__11747__11752);
            var G__11758 = G__11747__11752;
            string__11749 = G__11757;
            G__11747__11750 = G__11758;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____11753 = cljs.core.next.call(null, G__11743__11746);
      if(temp__3974__auto____11753) {
        var G__11743__11754 = temp__3974__auto____11753;
        var G__11759 = cljs.core.first.call(null, G__11743__11754);
        var G__11760 = G__11743__11754;
        obj__11745 = G__11759;
        G__11743__11746 = G__11760;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__11761) {
    var objs = cljs.core.seq(arglist__11761);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__11762) {
    var objs = cljs.core.seq(arglist__11762);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__11763) {
    var objs = cljs.core.seq(arglist__11763);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__11764) {
    var objs = cljs.core.seq(arglist__11764);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__11765) {
    var objs = cljs.core.seq(arglist__11765);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__11766) {
    var objs = cljs.core.seq(arglist__11766);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__11767) {
    var objs = cljs.core.seq(arglist__11767);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__11768) {
    var objs = cljs.core.seq(arglist__11768);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__11769) {
    var fmt = cljs.core.first(arglist__11769);
    var args = cljs.core.rest(arglist__11769);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11770 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11770, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11771 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11771, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11772 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11772, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____11773 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____11773)) {
        var nspc__11774 = temp__3974__auto____11773;
        return[cljs.core.str(nspc__11774), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____11775 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____11775)) {
          var nspc__11776 = temp__3974__auto____11775;
          return[cljs.core.str(nspc__11776), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11777 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11777, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__11779 = function(n, len) {
    var ns__11778 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__11778) < len) {
        var G__11781 = [cljs.core.str("0"), cljs.core.str(ns__11778)].join("");
        ns__11778 = G__11781;
        continue
      }else {
        return ns__11778
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__11779.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__11779.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__11779.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__11779.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__11779.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__11779.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11780 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11780, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__11782 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__11783 = this;
  var G__11784__11785 = cljs.core.seq.call(null, this__11783.watches);
  if(G__11784__11785) {
    var G__11787__11789 = cljs.core.first.call(null, G__11784__11785);
    var vec__11788__11790 = G__11787__11789;
    var key__11791 = cljs.core.nth.call(null, vec__11788__11790, 0, null);
    var f__11792 = cljs.core.nth.call(null, vec__11788__11790, 1, null);
    var G__11784__11793 = G__11784__11785;
    var G__11787__11794 = G__11787__11789;
    var G__11784__11795 = G__11784__11793;
    while(true) {
      var vec__11796__11797 = G__11787__11794;
      var key__11798 = cljs.core.nth.call(null, vec__11796__11797, 0, null);
      var f__11799 = cljs.core.nth.call(null, vec__11796__11797, 1, null);
      var G__11784__11800 = G__11784__11795;
      f__11799.call(null, key__11798, this$, oldval, newval);
      var temp__3974__auto____11801 = cljs.core.next.call(null, G__11784__11800);
      if(temp__3974__auto____11801) {
        var G__11784__11802 = temp__3974__auto____11801;
        var G__11809 = cljs.core.first.call(null, G__11784__11802);
        var G__11810 = G__11784__11802;
        G__11787__11794 = G__11809;
        G__11784__11795 = G__11810;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__11803 = this;
  return this$.watches = cljs.core.assoc.call(null, this__11803.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__11804 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__11804.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__11805 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__11805.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__11806 = this;
  return this__11806.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__11807 = this;
  return this__11807.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__11808 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__11822__delegate = function(x, p__11811) {
      var map__11817__11818 = p__11811;
      var map__11817__11819 = cljs.core.seq_QMARK_.call(null, map__11817__11818) ? cljs.core.apply.call(null, cljs.core.hash_map, map__11817__11818) : map__11817__11818;
      var validator__11820 = cljs.core._lookup.call(null, map__11817__11819, "\ufdd0'validator", null);
      var meta__11821 = cljs.core._lookup.call(null, map__11817__11819, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__11821, validator__11820, null)
    };
    var G__11822 = function(x, var_args) {
      var p__11811 = null;
      if(goog.isDef(var_args)) {
        p__11811 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11822__delegate.call(this, x, p__11811)
    };
    G__11822.cljs$lang$maxFixedArity = 1;
    G__11822.cljs$lang$applyTo = function(arglist__11823) {
      var x = cljs.core.first(arglist__11823);
      var p__11811 = cljs.core.rest(arglist__11823);
      return G__11822__delegate(x, p__11811)
    };
    G__11822.cljs$lang$arity$variadic = G__11822__delegate;
    return G__11822
  }();
  atom = function(x, var_args) {
    var p__11811 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____11827 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____11827)) {
    var validate__11828 = temp__3974__auto____11827;
    if(cljs.core.truth_(validate__11828.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__11829 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__11829, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__11830__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__11830 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__11830__delegate.call(this, a, f, x, y, z, more)
    };
    G__11830.cljs$lang$maxFixedArity = 5;
    G__11830.cljs$lang$applyTo = function(arglist__11831) {
      var a = cljs.core.first(arglist__11831);
      var f = cljs.core.first(cljs.core.next(arglist__11831));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11831)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11831))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11831)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11831)))));
      return G__11830__delegate(a, f, x, y, z, more)
    };
    G__11830.cljs$lang$arity$variadic = G__11830__delegate;
    return G__11830
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__11832) {
    var iref = cljs.core.first(arglist__11832);
    var f = cljs.core.first(cljs.core.next(arglist__11832));
    var args = cljs.core.rest(cljs.core.next(arglist__11832));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__11833 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__11833.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__11834 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__11834.state, function(p__11835) {
    var map__11836__11837 = p__11835;
    var map__11836__11838 = cljs.core.seq_QMARK_.call(null, map__11836__11837) ? cljs.core.apply.call(null, cljs.core.hash_map, map__11836__11837) : map__11836__11837;
    var curr_state__11839 = map__11836__11838;
    var done__11840 = cljs.core._lookup.call(null, map__11836__11838, "\ufdd0'done", null);
    if(cljs.core.truth_(done__11840)) {
      return curr_state__11839
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__11834.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__11861__11862 = options;
    var map__11861__11863 = cljs.core.seq_QMARK_.call(null, map__11861__11862) ? cljs.core.apply.call(null, cljs.core.hash_map, map__11861__11862) : map__11861__11862;
    var keywordize_keys__11864 = cljs.core._lookup.call(null, map__11861__11863, "\ufdd0'keywordize-keys", null);
    var keyfn__11865 = cljs.core.truth_(keywordize_keys__11864) ? cljs.core.keyword : cljs.core.str;
    var f__11880 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__963__auto____11879 = function iter__11873(s__11874) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__11874__11877 = s__11874;
                    while(true) {
                      if(cljs.core.seq.call(null, s__11874__11877)) {
                        var k__11878 = cljs.core.first.call(null, s__11874__11877);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__11865.call(null, k__11878), thisfn.call(null, x[k__11878])], true), iter__11873.call(null, cljs.core.rest.call(null, s__11874__11877)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__963__auto____11879.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__11880.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__11881) {
    var x = cljs.core.first(arglist__11881);
    var options = cljs.core.rest(arglist__11881);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__11886 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__11890__delegate = function(args) {
      var temp__3971__auto____11887 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__11886), args, null);
      if(cljs.core.truth_(temp__3971__auto____11887)) {
        var v__11888 = temp__3971__auto____11887;
        return v__11888
      }else {
        var ret__11889 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__11886, cljs.core.assoc, args, ret__11889);
        return ret__11889
      }
    };
    var G__11890 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11890__delegate.call(this, args)
    };
    G__11890.cljs$lang$maxFixedArity = 0;
    G__11890.cljs$lang$applyTo = function(arglist__11891) {
      var args = cljs.core.seq(arglist__11891);
      return G__11890__delegate(args)
    };
    G__11890.cljs$lang$arity$variadic = G__11890__delegate;
    return G__11890
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__11893 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__11893)) {
        var G__11894 = ret__11893;
        f = G__11894;
        continue
      }else {
        return ret__11893
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__11895__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__11895 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11895__delegate.call(this, f, args)
    };
    G__11895.cljs$lang$maxFixedArity = 1;
    G__11895.cljs$lang$applyTo = function(arglist__11896) {
      var f = cljs.core.first(arglist__11896);
      var args = cljs.core.rest(arglist__11896);
      return G__11895__delegate(f, args)
    };
    G__11895.cljs$lang$arity$variadic = G__11895__delegate;
    return G__11895
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__11898 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__11898, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__11898, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____11907 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____11907) {
      return or__3824__auto____11907
    }else {
      var or__3824__auto____11908 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____11908) {
        return or__3824__auto____11908
      }else {
        var and__3822__auto____11909 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____11909) {
          var and__3822__auto____11910 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____11910) {
            var and__3822__auto____11911 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____11911) {
              var ret__11912 = true;
              var i__11913 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____11914 = cljs.core.not.call(null, ret__11912);
                  if(or__3824__auto____11914) {
                    return or__3824__auto____11914
                  }else {
                    return i__11913 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__11912
                }else {
                  var G__11915 = isa_QMARK_.call(null, h, child.call(null, i__11913), parent.call(null, i__11913));
                  var G__11916 = i__11913 + 1;
                  ret__11912 = G__11915;
                  i__11913 = G__11916;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____11911
            }
          }else {
            return and__3822__auto____11910
          }
        }else {
          return and__3822__auto____11909
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__11925 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__11926 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__11927 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__11928 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____11929 = cljs.core.contains_QMARK_.call(null, tp__11925.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__11927.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__11927.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__11925, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__11928.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__11926, parent, ta__11927), "\ufdd0'descendants":tf__11928.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__11927, tag, td__11926)})
    }();
    if(cljs.core.truth_(or__3824__auto____11929)) {
      return or__3824__auto____11929
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__11934 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__11935 = cljs.core.truth_(parentMap__11934.call(null, tag)) ? cljs.core.disj.call(null, parentMap__11934.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__11936 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__11935)) ? cljs.core.assoc.call(null, parentMap__11934, tag, childsParents__11935) : cljs.core.dissoc.call(null, parentMap__11934, tag);
    var deriv_seq__11937 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__11917_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__11917_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__11917_SHARP_), cljs.core.second.call(null, p1__11917_SHARP_)))
    }, cljs.core.seq.call(null, newParents__11936)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__11934.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__11918_SHARP_, p2__11919_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__11918_SHARP_, p2__11919_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__11937))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__11945 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____11947 = cljs.core.truth_(function() {
    var and__3822__auto____11946 = xprefs__11945;
    if(cljs.core.truth_(and__3822__auto____11946)) {
      return xprefs__11945.call(null, y)
    }else {
      return and__3822__auto____11946
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____11947)) {
    return or__3824__auto____11947
  }else {
    var or__3824__auto____11949 = function() {
      var ps__11948 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__11948) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__11948), prefer_table))) {
          }else {
          }
          var G__11952 = cljs.core.rest.call(null, ps__11948);
          ps__11948 = G__11952;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____11949)) {
      return or__3824__auto____11949
    }else {
      var or__3824__auto____11951 = function() {
        var ps__11950 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__11950) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__11950), y, prefer_table))) {
            }else {
            }
            var G__11953 = cljs.core.rest.call(null, ps__11950);
            ps__11950 = G__11953;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____11951)) {
        return or__3824__auto____11951
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____11955 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____11955)) {
    return or__3824__auto____11955
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__11973 = cljs.core.reduce.call(null, function(be, p__11965) {
    var vec__11966__11967 = p__11965;
    var k__11968 = cljs.core.nth.call(null, vec__11966__11967, 0, null);
    var ___11969 = cljs.core.nth.call(null, vec__11966__11967, 1, null);
    var e__11970 = vec__11966__11967;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__11968)) {
      var be2__11972 = cljs.core.truth_(function() {
        var or__3824__auto____11971 = be == null;
        if(or__3824__auto____11971) {
          return or__3824__auto____11971
        }else {
          return cljs.core.dominates.call(null, k__11968, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__11970 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__11972), k__11968, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__11968), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__11972)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__11972
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__11973)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__11973));
      return cljs.core.second.call(null, best_entry__11973)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____11978 = mf;
    if(and__3822__auto____11978) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____11978
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__864__auto____11979 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11980 = cljs.core._reset[goog.typeOf(x__864__auto____11979)];
      if(or__3824__auto____11980) {
        return or__3824__auto____11980
      }else {
        var or__3824__auto____11981 = cljs.core._reset["_"];
        if(or__3824__auto____11981) {
          return or__3824__auto____11981
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____11986 = mf;
    if(and__3822__auto____11986) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____11986
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__864__auto____11987 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11988 = cljs.core._add_method[goog.typeOf(x__864__auto____11987)];
      if(or__3824__auto____11988) {
        return or__3824__auto____11988
      }else {
        var or__3824__auto____11989 = cljs.core._add_method["_"];
        if(or__3824__auto____11989) {
          return or__3824__auto____11989
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____11994 = mf;
    if(and__3822__auto____11994) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____11994
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__864__auto____11995 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11996 = cljs.core._remove_method[goog.typeOf(x__864__auto____11995)];
      if(or__3824__auto____11996) {
        return or__3824__auto____11996
      }else {
        var or__3824__auto____11997 = cljs.core._remove_method["_"];
        if(or__3824__auto____11997) {
          return or__3824__auto____11997
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____12002 = mf;
    if(and__3822__auto____12002) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____12002
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__864__auto____12003 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____12004 = cljs.core._prefer_method[goog.typeOf(x__864__auto____12003)];
      if(or__3824__auto____12004) {
        return or__3824__auto____12004
      }else {
        var or__3824__auto____12005 = cljs.core._prefer_method["_"];
        if(or__3824__auto____12005) {
          return or__3824__auto____12005
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____12010 = mf;
    if(and__3822__auto____12010) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____12010
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__864__auto____12011 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____12012 = cljs.core._get_method[goog.typeOf(x__864__auto____12011)];
      if(or__3824__auto____12012) {
        return or__3824__auto____12012
      }else {
        var or__3824__auto____12013 = cljs.core._get_method["_"];
        if(or__3824__auto____12013) {
          return or__3824__auto____12013
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____12018 = mf;
    if(and__3822__auto____12018) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____12018
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__864__auto____12019 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____12020 = cljs.core._methods[goog.typeOf(x__864__auto____12019)];
      if(or__3824__auto____12020) {
        return or__3824__auto____12020
      }else {
        var or__3824__auto____12021 = cljs.core._methods["_"];
        if(or__3824__auto____12021) {
          return or__3824__auto____12021
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____12026 = mf;
    if(and__3822__auto____12026) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____12026
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__864__auto____12027 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____12028 = cljs.core._prefers[goog.typeOf(x__864__auto____12027)];
      if(or__3824__auto____12028) {
        return or__3824__auto____12028
      }else {
        var or__3824__auto____12029 = cljs.core._prefers["_"];
        if(or__3824__auto____12029) {
          return or__3824__auto____12029
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____12034 = mf;
    if(and__3822__auto____12034) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____12034
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__864__auto____12035 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____12036 = cljs.core._dispatch[goog.typeOf(x__864__auto____12035)];
      if(or__3824__auto____12036) {
        return or__3824__auto____12036
      }else {
        var or__3824__auto____12037 = cljs.core._dispatch["_"];
        if(or__3824__auto____12037) {
          return or__3824__auto____12037
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__12040 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__12041 = cljs.core._get_method.call(null, mf, dispatch_val__12040);
  if(cljs.core.truth_(target_fn__12041)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__12040)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__12041, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__12042 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__12043 = this;
  cljs.core.swap_BANG_.call(null, this__12043.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__12043.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__12043.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__12043.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__12044 = this;
  cljs.core.swap_BANG_.call(null, this__12044.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__12044.method_cache, this__12044.method_table, this__12044.cached_hierarchy, this__12044.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__12045 = this;
  cljs.core.swap_BANG_.call(null, this__12045.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__12045.method_cache, this__12045.method_table, this__12045.cached_hierarchy, this__12045.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__12046 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__12046.cached_hierarchy), cljs.core.deref.call(null, this__12046.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__12046.method_cache, this__12046.method_table, this__12046.cached_hierarchy, this__12046.hierarchy)
  }
  var temp__3971__auto____12047 = cljs.core.deref.call(null, this__12046.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____12047)) {
    var target_fn__12048 = temp__3971__auto____12047;
    return target_fn__12048
  }else {
    var temp__3971__auto____12049 = cljs.core.find_and_cache_best_method.call(null, this__12046.name, dispatch_val, this__12046.hierarchy, this__12046.method_table, this__12046.prefer_table, this__12046.method_cache, this__12046.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____12049)) {
      var target_fn__12050 = temp__3971__auto____12049;
      return target_fn__12050
    }else {
      return cljs.core.deref.call(null, this__12046.method_table).call(null, this__12046.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__12051 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__12051.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__12051.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__12051.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__12051.method_cache, this__12051.method_table, this__12051.cached_hierarchy, this__12051.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__12052 = this;
  return cljs.core.deref.call(null, this__12052.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__12053 = this;
  return cljs.core.deref.call(null, this__12053.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__12054 = this;
  return cljs.core.do_dispatch.call(null, mf, this__12054.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__12056__delegate = function(_, args) {
    var self__12055 = this;
    return cljs.core._dispatch.call(null, self__12055, args)
  };
  var G__12056 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__12056__delegate.call(this, _, args)
  };
  G__12056.cljs$lang$maxFixedArity = 1;
  G__12056.cljs$lang$applyTo = function(arglist__12057) {
    var _ = cljs.core.first(arglist__12057);
    var args = cljs.core.rest(arglist__12057);
    return G__12056__delegate(_, args)
  };
  G__12056.cljs$lang$arity$variadic = G__12056__delegate;
  return G__12056
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__12058 = this;
  return cljs.core._dispatch.call(null, self__12058, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__810__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__12059 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_12061, _) {
  var this__12060 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__12060.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__12062 = this;
  var and__3822__auto____12063 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____12063) {
    return this__12062.uuid === other.uuid
  }else {
    return and__3822__auto____12063
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__12064 = this;
  var this__12065 = this;
  return cljs.core.pr_str.call(null, this__12065)
};
cljs.core.UUID;
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__4912 = s;
      var limit__4913 = limit;
      var parts__4914 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__4913, 1)) {
          return cljs.core.conj.call(null, parts__4914, s__4912)
        }else {
          var temp__3971__auto____4915 = cljs.core.re_find.call(null, re, s__4912);
          if(cljs.core.truth_(temp__3971__auto____4915)) {
            var m__4916 = temp__3971__auto____4915;
            var index__4917 = s__4912.indexOf(m__4916);
            var G__4918 = s__4912.substring(index__4917 + cljs.core.count.call(null, m__4916));
            var G__4919 = limit__4913 - 1;
            var G__4920 = cljs.core.conj.call(null, parts__4914, s__4912.substring(0, index__4917));
            s__4912 = G__4918;
            limit__4913 = G__4919;
            parts__4914 = G__4920;
            continue
          }else {
            return cljs.core.conj.call(null, parts__4914, s__4912)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__4924 = s.length;
  while(true) {
    if(index__4924 === 0) {
      return""
    }else {
      var ch__4925 = cljs.core._lookup.call(null, s, index__4924 - 1, null);
      if(function() {
        var or__3824__auto____4926 = cljs.core._EQ_.call(null, ch__4925, "\n");
        if(or__3824__auto____4926) {
          return or__3824__auto____4926
        }else {
          return cljs.core._EQ_.call(null, ch__4925, "\r")
        }
      }()) {
        var G__4927 = index__4924 - 1;
        index__4924 = G__4927;
        continue
      }else {
        return s.substring(0, index__4924)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__4931 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____4932 = cljs.core.not.call(null, s__4931);
    if(or__3824__auto____4932) {
      return or__3824__auto____4932
    }else {
      var or__3824__auto____4933 = cljs.core._EQ_.call(null, "", s__4931);
      if(or__3824__auto____4933) {
        return or__3824__auto____4933
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__4931)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__4940 = new goog.string.StringBuffer;
  var length__4941 = s.length;
  var index__4942 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__4941, index__4942)) {
      return buffer__4940.toString()
    }else {
      var ch__4943 = s.charAt(index__4942);
      var temp__3971__auto____4944 = cljs.core._lookup.call(null, cmap, ch__4943, null);
      if(cljs.core.truth_(temp__3971__auto____4944)) {
        var replacement__4945 = temp__3971__auto____4944;
        buffer__4940.append([cljs.core.str(replacement__4945)].join(""))
      }else {
        buffer__4940.append(ch__4943)
      }
      var G__4946 = index__4942 + 1;
      index__4942 = G__4946;
      continue
    }
    break
  }
};
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__4871 = {};
  var G__4872__4873 = cljs.core.seq.call(null, m);
  if(G__4872__4873) {
    var G__4875__4877 = cljs.core.first.call(null, G__4872__4873);
    var vec__4876__4878 = G__4875__4877;
    var k__4879 = cljs.core.nth.call(null, vec__4876__4878, 0, null);
    var v__4880 = cljs.core.nth.call(null, vec__4876__4878, 1, null);
    var G__4872__4881 = G__4872__4873;
    var G__4875__4882 = G__4875__4877;
    var G__4872__4883 = G__4872__4881;
    while(true) {
      var vec__4884__4885 = G__4875__4882;
      var k__4886 = cljs.core.nth.call(null, vec__4884__4885, 0, null);
      var v__4887 = cljs.core.nth.call(null, vec__4884__4885, 1, null);
      var G__4872__4888 = G__4872__4883;
      out__4871[cljs.core.name.call(null, k__4886)] = v__4887;
      var temp__3974__auto____4889 = cljs.core.next.call(null, G__4872__4888);
      if(temp__3974__auto____4889) {
        var G__4872__4890 = temp__3974__auto____4889;
        var G__4891 = cljs.core.first.call(null, G__4872__4890);
        var G__4892 = G__4872__4890;
        G__4875__4882 = G__4891;
        G__4872__4883 = G__4892;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__4871
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__4894 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__4894)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__4895) {
    var v = cljs.core.first(arglist__4895);
    var text = cljs.core.rest(arglist__4895);
    return log__delegate(v, text)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
jayq.util.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        return cljs.core.reduce.call(null, function(m, p__4901) {
          var vec__4902__4903 = p__4901;
          var k__4904 = cljs.core.nth.call(null, vec__4902__4903, 0, null);
          var v__4905 = cljs.core.nth.call(null, vec__4902__4903, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__4904), clj__GT_js.call(null, v__4905))
        }, cljs.core.ObjMap.EMPTY, x).strobj
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
goog.provide("jayq.core");
goog.require("cljs.core");
goog.require("jayq.util");
goog.require("jayq.util");
goog.require("clojure.string");
jayq.core.crate_meta = function crate_meta(func) {
  return func.prototype._crateGroup
};
jayq.core.__GT_selector = function __GT_selector(sel) {
  if(cljs.core.string_QMARK_.call(null, sel)) {
    return sel
  }else {
    if(cljs.core.fn_QMARK_.call(null, sel)) {
      var temp__3971__auto____4692 = jayq.core.crate_meta.call(null, sel);
      if(cljs.core.truth_(temp__3971__auto____4692)) {
        var cm__4693 = temp__3971__auto____4692;
        return[cljs.core.str("[crateGroup="), cljs.core.str(cm__4693), cljs.core.str("]")].join("")
      }else {
        return sel
      }
    }else {
      if(cljs.core.keyword_QMARK_.call(null, sel)) {
        return cljs.core.name.call(null, sel)
      }else {
        if("\ufdd0'else") {
          return sel
        }else {
          return null
        }
      }
    }
  }
};
jayq.core.$ = function() {
  var $__delegate = function(sel, p__4694) {
    var vec__4698__4699 = p__4694;
    var context__4700 = cljs.core.nth.call(null, vec__4698__4699, 0, null);
    if(cljs.core.not.call(null, context__4700)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__4700)
    }
  };
  var $ = function(sel, var_args) {
    var p__4694 = null;
    if(goog.isDef(var_args)) {
      p__4694 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__4694)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__4701) {
    var sel = cljs.core.first(arglist__4701);
    var p__4694 = cljs.core.rest(arglist__4701);
    return $__delegate(sel, p__4694)
  };
  $.cljs$lang$arity$variadic = $__delegate;
  return $
}();
jQuery.prototype.cljs$core$IReduce$ = true;
jQuery.prototype.cljs$core$IReduce$_reduce$arity$2 = function(this$, f) {
  return cljs.core.ci_reduce.call(null, jayq.core.coll, f, cljs.core.first.call(null, this$), cljs.core.count.call(null, this$))
};
jQuery.prototype.cljs$core$IReduce$_reduce$arity$3 = function(this$, f, start) {
  return cljs.core.ci_reduce.call(null, jayq.core.coll, f, start, jayq.core.i)
};
jQuery.prototype.cljs$core$ILookup$ = true;
jQuery.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this$, k) {
  var or__3824__auto____4702 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3824__auto____4702)) {
    return or__3824__auto____4702
  }else {
    return null
  }
};
jQuery.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this$, k, not_found) {
  return cljs.core._nth.call(null, this$, k, not_found)
};
jQuery.prototype.cljs$core$ISequential$ = true;
jQuery.prototype.cljs$core$IIndexed$ = true;
jQuery.prototype.cljs$core$IIndexed$_nth$arity$2 = function(this$, n) {
  if(n < cljs.core.count.call(null, this$)) {
    return this$.slice(n, n + 1)
  }else {
    return null
  }
};
jQuery.prototype.cljs$core$IIndexed$_nth$arity$3 = function(this$, n, not_found) {
  if(n < cljs.core.count.call(null, this$)) {
    return this$.slice(n, n + 1)
  }else {
    if(void 0 === not_found) {
      return null
    }else {
      return not_found
    }
  }
};
jQuery.prototype.cljs$core$ICounted$ = true;
jQuery.prototype.cljs$core$ICounted$_count$arity$1 = function(this$) {
  return this$.size()
};
jQuery.prototype.cljs$core$ISeq$ = true;
jQuery.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  return this$.get(0)
};
jQuery.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  if(cljs.core.count.call(null, this$) > 1) {
    return this$.slice(1)
  }else {
    return cljs.core.list.call(null)
  }
};
jQuery.prototype.cljs$core$ISeqable$ = true;
jQuery.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  if(cljs.core.truth_(this$.get(0))) {
    return this$
  }else {
    return null
  }
};
jQuery.prototype.call = function() {
  var G__4703 = null;
  var G__4703__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__4703__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__4703 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4703__2.call(this, _, k);
      case 3:
        return G__4703__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4703
}();
jayq.core.anim = function anim(elem, props, dur) {
  return elem.animate(jayq.util.clj__GT_js.call(null, props), dur)
};
jayq.core.text = function text($elem, txt) {
  return $elem.text(txt)
};
jayq.core.css = function css($elem, opts) {
  if(cljs.core.keyword_QMARK_.call(null, opts)) {
    return $elem.css(cljs.core.name.call(null, opts))
  }else {
    return $elem.css(jayq.util.clj__GT_js.call(null, opts))
  }
};
jayq.core.attr = function() {
  var attr__delegate = function($elem, a, p__4704) {
    var vec__4709__4710 = p__4704;
    var v__4711 = cljs.core.nth.call(null, vec__4709__4710, 0, null);
    var a__4712 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__4711)) {
      return $elem.attr(a__4712)
    }else {
      return $elem.attr(a__4712, v__4711)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__4704 = null;
    if(goog.isDef(var_args)) {
      p__4704 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__4704)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__4713) {
    var $elem = cljs.core.first(arglist__4713);
    var a = cljs.core.first(cljs.core.next(arglist__4713));
    var p__4704 = cljs.core.rest(cljs.core.next(arglist__4713));
    return attr__delegate($elem, a, p__4704)
  };
  attr.cljs$lang$arity$variadic = attr__delegate;
  return attr
}();
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__4714) {
    var vec__4719__4720 = p__4714;
    var v__4721 = cljs.core.nth.call(null, vec__4719__4720, 0, null);
    var k__4722 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__4721)) {
      return $elem.data(k__4722)
    }else {
      return $elem.data(k__4722, v__4721)
    }
  };
  var data = function($elem, k, var_args) {
    var p__4714 = null;
    if(goog.isDef(var_args)) {
      p__4714 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__4714)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__4723) {
    var $elem = cljs.core.first(arglist__4723);
    var k = cljs.core.first(cljs.core.next(arglist__4723));
    var p__4714 = cljs.core.rest(cljs.core.next(arglist__4723));
    return data__delegate($elem, k, p__4714)
  };
  data.cljs$lang$arity$variadic = data__delegate;
  return data
}();
jayq.core.add_class = function add_class($elem, cl) {
  var cl__4725 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__4725)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__4727 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__4727)
};
jayq.core.append = function append($elem, content) {
  return $elem.append(content)
};
jayq.core.prepend = function prepend($elem, content) {
  return $elem.prepend(content)
};
jayq.core.remove = function remove($elem) {
  return $elem.remove()
};
jayq.core.hide = function() {
  var hide__delegate = function($elem, p__4728) {
    var vec__4733__4734 = p__4728;
    var speed__4735 = cljs.core.nth.call(null, vec__4733__4734, 0, null);
    var on_finish__4736 = cljs.core.nth.call(null, vec__4733__4734, 1, null);
    return $elem.hide(speed__4735, on_finish__4736)
  };
  var hide = function($elem, var_args) {
    var p__4728 = null;
    if(goog.isDef(var_args)) {
      p__4728 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__4728)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__4737) {
    var $elem = cljs.core.first(arglist__4737);
    var p__4728 = cljs.core.rest(arglist__4737);
    return hide__delegate($elem, p__4728)
  };
  hide.cljs$lang$arity$variadic = hide__delegate;
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__4738) {
    var vec__4743__4744 = p__4738;
    var speed__4745 = cljs.core.nth.call(null, vec__4743__4744, 0, null);
    var on_finish__4746 = cljs.core.nth.call(null, vec__4743__4744, 1, null);
    return $elem.show(speed__4745, on_finish__4746)
  };
  var show = function($elem, var_args) {
    var p__4738 = null;
    if(goog.isDef(var_args)) {
      p__4738 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__4738)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__4747) {
    var $elem = cljs.core.first(arglist__4747);
    var p__4738 = cljs.core.rest(arglist__4747);
    return show__delegate($elem, p__4738)
  };
  show.cljs$lang$arity$variadic = show__delegate;
  return show
}();
jayq.core.toggle = function() {
  var toggle__delegate = function($elem, p__4748) {
    var vec__4753__4754 = p__4748;
    var speed__4755 = cljs.core.nth.call(null, vec__4753__4754, 0, null);
    var on_finish__4756 = cljs.core.nth.call(null, vec__4753__4754, 1, null);
    return $elem.toggle(speed__4755, on_finish__4756)
  };
  var toggle = function($elem, var_args) {
    var p__4748 = null;
    if(goog.isDef(var_args)) {
      p__4748 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return toggle__delegate.call(this, $elem, p__4748)
  };
  toggle.cljs$lang$maxFixedArity = 1;
  toggle.cljs$lang$applyTo = function(arglist__4757) {
    var $elem = cljs.core.first(arglist__4757);
    var p__4748 = cljs.core.rest(arglist__4757);
    return toggle__delegate($elem, p__4748)
  };
  toggle.cljs$lang$arity$variadic = toggle__delegate;
  return toggle
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__4758) {
    var vec__4763__4764 = p__4758;
    var speed__4765 = cljs.core.nth.call(null, vec__4763__4764, 0, null);
    var on_finish__4766 = cljs.core.nth.call(null, vec__4763__4764, 1, null);
    return $elem.fadeOut(speed__4765, on_finish__4766)
  };
  var fade_out = function($elem, var_args) {
    var p__4758 = null;
    if(goog.isDef(var_args)) {
      p__4758 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__4758)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__4767) {
    var $elem = cljs.core.first(arglist__4767);
    var p__4758 = cljs.core.rest(arglist__4767);
    return fade_out__delegate($elem, p__4758)
  };
  fade_out.cljs$lang$arity$variadic = fade_out__delegate;
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__4768) {
    var vec__4773__4774 = p__4768;
    var speed__4775 = cljs.core.nth.call(null, vec__4773__4774, 0, null);
    var on_finish__4776 = cljs.core.nth.call(null, vec__4773__4774, 1, null);
    return $elem.fadeIn(speed__4775, on_finish__4776)
  };
  var fade_in = function($elem, var_args) {
    var p__4768 = null;
    if(goog.isDef(var_args)) {
      p__4768 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__4768)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__4777) {
    var $elem = cljs.core.first(arglist__4777);
    var p__4768 = cljs.core.rest(arglist__4777);
    return fade_in__delegate($elem, p__4768)
  };
  fade_in.cljs$lang$arity$variadic = fade_in__delegate;
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__4778) {
    var vec__4783__4784 = p__4778;
    var speed__4785 = cljs.core.nth.call(null, vec__4783__4784, 0, null);
    var on_finish__4786 = cljs.core.nth.call(null, vec__4783__4784, 1, null);
    return $elem.slideUp(speed__4785, on_finish__4786)
  };
  var slide_up = function($elem, var_args) {
    var p__4778 = null;
    if(goog.isDef(var_args)) {
      p__4778 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__4778)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__4787) {
    var $elem = cljs.core.first(arglist__4787);
    var p__4778 = cljs.core.rest(arglist__4787);
    return slide_up__delegate($elem, p__4778)
  };
  slide_up.cljs$lang$arity$variadic = slide_up__delegate;
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__4788) {
    var vec__4793__4794 = p__4788;
    var speed__4795 = cljs.core.nth.call(null, vec__4793__4794, 0, null);
    var on_finish__4796 = cljs.core.nth.call(null, vec__4793__4794, 1, null);
    return $elem.slideDown(speed__4795, on_finish__4796)
  };
  var slide_down = function($elem, var_args) {
    var p__4788 = null;
    if(goog.isDef(var_args)) {
      p__4788 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__4788)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__4797) {
    var $elem = cljs.core.first(arglist__4797);
    var p__4788 = cljs.core.rest(arglist__4797);
    return slide_down__delegate($elem, p__4788)
  };
  slide_down.cljs$lang$arity$variadic = slide_down__delegate;
  return slide_down
}();
jayq.core.parent = function parent($elem) {
  return $elem.parent()
};
jayq.core.find = function find($elem, selector) {
  return $elem.find(cljs.core.name.call(null, selector))
};
jayq.core.inner = function inner($elem, v) {
  return $elem.html(v)
};
jayq.core.empty = function empty($elem) {
  return $elem.empty()
};
jayq.core.val = function() {
  var val__delegate = function($elem, p__4798) {
    var vec__4802__4803 = p__4798;
    var v__4804 = cljs.core.nth.call(null, vec__4802__4803, 0, null);
    if(cljs.core.truth_(v__4804)) {
      return $elem.val(v__4804)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__4798 = null;
    if(goog.isDef(var_args)) {
      p__4798 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__4798)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__4805) {
    var $elem = cljs.core.first(arglist__4805);
    var p__4798 = cljs.core.rest(arglist__4805);
    return val__delegate($elem, p__4798)
  };
  val.cljs$lang$arity$variadic = val__delegate;
  return val
}();
jayq.core.queue = function queue($elem, callback) {
  return $elem.queue(callback)
};
jayq.core.dequeue = function dequeue(elem) {
  return jayq.core.$.call(null, elem).dequeue()
};
jayq.core.document_ready = function document_ready(func) {
  return jayq.core.$.call(null, document).ready(func)
};
jayq.core.xhr = function xhr(p__4806, content, callback) {
  var vec__4812__4813 = p__4806;
  var method__4814 = cljs.core.nth.call(null, vec__4812__4813, 0, null);
  var uri__4815 = cljs.core.nth.call(null, vec__4812__4813, 1, null);
  var params__4816 = jayq.util.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__4814)), "\ufdd0'data":jayq.util.clj__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__4815, params__4816)
};
jayq.core.bind = function bind($elem, ev, func) {
  return $elem.bind(cljs.core.name.call(null, ev), func)
};
jayq.core.trigger = function trigger($elem, ev) {
  return $elem.trigger(cljs.core.name.call(null, ev))
};
jayq.core.delegate = function delegate($elem, sel, ev, func) {
  return $elem.delegate(jayq.core.__GT_selector.call(null, sel), cljs.core.name.call(null, ev), func)
};
jayq.core.__GT_event = function __GT_event(e) {
  if(cljs.core.keyword_QMARK_.call(null, e)) {
    return cljs.core.name.call(null, e)
  }else {
    if(cljs.core.map_QMARK_.call(null, e)) {
      return jayq.util.clj__GT_js.call(null, e)
    }else {
      if(cljs.core.coll_QMARK_.call(null, e)) {
        return clojure.string.join.call(null, " ", cljs.core.map.call(null, cljs.core.name, e))
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Unknown event type: "), cljs.core.str(e)].join(""));
        }else {
          return null
        }
      }
    }
  }
};
jayq.core.on = function() {
  var on__delegate = function($elem, events, p__4817) {
    var vec__4823__4824 = p__4817;
    var sel__4825 = cljs.core.nth.call(null, vec__4823__4824, 0, null);
    var data__4826 = cljs.core.nth.call(null, vec__4823__4824, 1, null);
    var handler__4827 = cljs.core.nth.call(null, vec__4823__4824, 2, null);
    return $elem.on(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__4825), data__4826, handler__4827)
  };
  var on = function($elem, events, var_args) {
    var p__4817 = null;
    if(goog.isDef(var_args)) {
      p__4817 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return on__delegate.call(this, $elem, events, p__4817)
  };
  on.cljs$lang$maxFixedArity = 2;
  on.cljs$lang$applyTo = function(arglist__4828) {
    var $elem = cljs.core.first(arglist__4828);
    var events = cljs.core.first(cljs.core.next(arglist__4828));
    var p__4817 = cljs.core.rest(cljs.core.next(arglist__4828));
    return on__delegate($elem, events, p__4817)
  };
  on.cljs$lang$arity$variadic = on__delegate;
  return on
}();
jayq.core.one = function() {
  var one__delegate = function($elem, events, p__4829) {
    var vec__4835__4836 = p__4829;
    var sel__4837 = cljs.core.nth.call(null, vec__4835__4836, 0, null);
    var data__4838 = cljs.core.nth.call(null, vec__4835__4836, 1, null);
    var handler__4839 = cljs.core.nth.call(null, vec__4835__4836, 2, null);
    return $elem.one(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__4837), data__4838, handler__4839)
  };
  var one = function($elem, events, var_args) {
    var p__4829 = null;
    if(goog.isDef(var_args)) {
      p__4829 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return one__delegate.call(this, $elem, events, p__4829)
  };
  one.cljs$lang$maxFixedArity = 2;
  one.cljs$lang$applyTo = function(arglist__4840) {
    var $elem = cljs.core.first(arglist__4840);
    var events = cljs.core.first(cljs.core.next(arglist__4840));
    var p__4829 = cljs.core.rest(cljs.core.next(arglist__4840));
    return one__delegate($elem, events, p__4829)
  };
  one.cljs$lang$arity$variadic = one__delegate;
  return one
}();
jayq.core.off = function() {
  var off__delegate = function($elem, events, p__4841) {
    var vec__4846__4847 = p__4841;
    var sel__4848 = cljs.core.nth.call(null, vec__4846__4847, 0, null);
    var handler__4849 = cljs.core.nth.call(null, vec__4846__4847, 1, null);
    return $elem.off(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__4848), handler__4849)
  };
  var off = function($elem, events, var_args) {
    var p__4841 = null;
    if(goog.isDef(var_args)) {
      p__4841 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return off__delegate.call(this, $elem, events, p__4841)
  };
  off.cljs$lang$maxFixedArity = 2;
  off.cljs$lang$applyTo = function(arglist__4850) {
    var $elem = cljs.core.first(arglist__4850);
    var events = cljs.core.first(cljs.core.next(arglist__4850));
    var p__4841 = cljs.core.rest(cljs.core.next(arglist__4850));
    return off__delegate($elem, events, p__4841)
  };
  off.cljs$lang$arity$variadic = off__delegate;
  return off
}();
goog.provide("active");
goog.require("cljs.core");
goog.require("jayq.core");
goog.require("jayq.core");
active.activate = function activate(d) {
  return jayq.core.css.call(null, jayq.core.$.call(null, cljs.core.keyword.call(null, d)), cljs.core.ObjMap.fromObject(["\ufdd0'background"], {"\ufdd0'background":"blue"}))
};
goog.exportSymbol("active.activate", active.activate);
