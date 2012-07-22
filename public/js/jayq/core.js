goog.provide('jayq.core');
goog.require('cljs.core');
goog.require('jayq.util');
goog.require('jayq.util');
goog.require('clojure.string');
jayq.core.crate_meta = (function crate_meta(func){
return func.prototype._crateGroup;
});
jayq.core.__GT_selector = (function __GT_selector(sel){
if(cljs.core.string_QMARK_.call(null,sel))
{return sel;
} else
{if(cljs.core.fn_QMARK_.call(null,sel))
{var temp__3971__auto____4692 = jayq.core.crate_meta.call(null,sel);
if(cljs.core.truth_(temp__3971__auto____4692))
{var cm__4693 = temp__3971__auto____4692;
return [cljs.core.str("[crateGroup="),cljs.core.str(cm__4693),cljs.core.str("]")].join('');
} else
{return sel;
}
} else
{if(cljs.core.keyword_QMARK_.call(null,sel))
{return cljs.core.name.call(null,sel);
} else
{if("\uFDD0'else")
{return sel;
} else
{return null;
}
}
}
}
});
/**
* @param {...*} var_args
*/
jayq.core.$ = (function() { 
var $__delegate = function (sel,p__4694){
var vec__4698__4699 = p__4694;
var context__4700 = cljs.core.nth.call(null,vec__4698__4699,0,null);
if(cljs.core.not.call(null,context__4700))
{return jQuery(jayq.core.__GT_selector.call(null,sel));
} else
{return jQuery(jayq.core.__GT_selector.call(null,sel),context__4700);
}
};
var $ = function (sel,var_args){
var p__4694 = null;
if (goog.isDef(var_args)) {
  p__4694 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1),0);
} 
return $__delegate.call(this, sel, p__4694);
};
$.cljs$lang$maxFixedArity = 1;
$.cljs$lang$applyTo = (function (arglist__4701){
var sel = cljs.core.first(arglist__4701);
var p__4694 = cljs.core.rest(arglist__4701);
return $__delegate(sel, p__4694);
});
$.cljs$lang$arity$variadic = $__delegate;
return $;
})()
;
jQuery.prototype.cljs$core$IReduce$ = true;
jQuery.prototype.cljs$core$IReduce$_reduce$arity$2 = (function (this$,f){
return cljs.core.ci_reduce.call(null,jayq.core.coll,f,cljs.core.first.call(null,this$),cljs.core.count.call(null,this$));
});
jQuery.prototype.cljs$core$IReduce$_reduce$arity$3 = (function (this$,f,start){
return cljs.core.ci_reduce.call(null,jayq.core.coll,f,start,jayq.core.i);
});
jQuery.prototype.cljs$core$ILookup$ = true;
jQuery.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this$,k){
var or__3824__auto____4702 = this$.slice(k,(k + 1));
if(cljs.core.truth_(or__3824__auto____4702))
{return or__3824__auto____4702;
} else
{return null;
}
});
jQuery.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this$,k,not_found){
return cljs.core._nth.call(null,this$,k,not_found);
});
jQuery.prototype.cljs$core$ISequential$ = true;
jQuery.prototype.cljs$core$IIndexed$ = true;
jQuery.prototype.cljs$core$IIndexed$_nth$arity$2 = (function (this$,n){
if((n < cljs.core.count.call(null,this$)))
{return this$.slice(n,(n + 1));
} else
{return null;
}
});
jQuery.prototype.cljs$core$IIndexed$_nth$arity$3 = (function (this$,n,not_found){
if((n < cljs.core.count.call(null,this$)))
{return this$.slice(n,(n + 1));
} else
{if((void 0 === not_found))
{return null;
} else
{return not_found;
}
}
});
jQuery.prototype.cljs$core$ICounted$ = true;
jQuery.prototype.cljs$core$ICounted$_count$arity$1 = (function (this$){
return this$.size();
});
jQuery.prototype.cljs$core$ISeq$ = true;
jQuery.prototype.cljs$core$ISeq$_first$arity$1 = (function (this$){
return this$.get(0);
});
jQuery.prototype.cljs$core$ISeq$_rest$arity$1 = (function (this$){
if((cljs.core.count.call(null,this$) > 1))
{return this$.slice(1);
} else
{return cljs.core.list.call(null);
}
});
jQuery.prototype.cljs$core$ISeqable$ = true;
jQuery.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this$){
if(cljs.core.truth_(this$.get(0)))
{return this$;
} else
{return null;
}
});
jQuery.prototype.call = (function() {
var G__4703 = null;
var G__4703__2 = (function (_,k){
return cljs.core._lookup.call(null,this,k);
});
var G__4703__3 = (function (_,k,not_found){
return cljs.core._lookup.call(null,this,k,not_found);
});
G__4703 = function(_,k,not_found){
switch(arguments.length){
case 2:
return G__4703__2.call(this,_,k);
case 3:
return G__4703__3.call(this,_,k,not_found);
}
throw('Invalid arity: ' + arguments.length);
};
return G__4703;
})()
;
jayq.core.anim = (function anim(elem,props,dur){
return elem.animate(jayq.util.clj__GT_js.call(null,props),dur);
});
jayq.core.text = (function text($elem,txt){
return $elem.text(txt);
});
jayq.core.css = (function css($elem,opts){
if(cljs.core.keyword_QMARK_.call(null,opts))
{return $elem.css(cljs.core.name.call(null,opts));
} else
{return $elem.css(jayq.util.clj__GT_js.call(null,opts));
}
});
/**
* @param {...*} var_args
*/
jayq.core.attr = (function() { 
var attr__delegate = function ($elem,a,p__4704){
var vec__4709__4710 = p__4704;
var v__4711 = cljs.core.nth.call(null,vec__4709__4710,0,null);
var a__4712 = cljs.core.name.call(null,a);
if(cljs.core.not.call(null,v__4711))
{return $elem.attr(a__4712);
} else
{return $elem.attr(a__4712,v__4711);
}
};
var attr = function ($elem,a,var_args){
var p__4704 = null;
if (goog.isDef(var_args)) {
  p__4704 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2),0);
} 
return attr__delegate.call(this, $elem, a, p__4704);
};
attr.cljs$lang$maxFixedArity = 2;
attr.cljs$lang$applyTo = (function (arglist__4713){
var $elem = cljs.core.first(arglist__4713);
var a = cljs.core.first(cljs.core.next(arglist__4713));
var p__4704 = cljs.core.rest(cljs.core.next(arglist__4713));
return attr__delegate($elem, a, p__4704);
});
attr.cljs$lang$arity$variadic = attr__delegate;
return attr;
})()
;
/**
* @param {...*} var_args
*/
jayq.core.data = (function() { 
var data__delegate = function ($elem,k,p__4714){
var vec__4719__4720 = p__4714;
var v__4721 = cljs.core.nth.call(null,vec__4719__4720,0,null);
var k__4722 = cljs.core.name.call(null,k);
if(cljs.core.not.call(null,v__4721))
{return $elem.data(k__4722);
} else
{return $elem.data(k__4722,v__4721);
}
};
var data = function ($elem,k,var_args){
var p__4714 = null;
if (goog.isDef(var_args)) {
  p__4714 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2),0);
} 
return data__delegate.call(this, $elem, k, p__4714);
};
data.cljs$lang$maxFixedArity = 2;
data.cljs$lang$applyTo = (function (arglist__4723){
var $elem = cljs.core.first(arglist__4723);
var k = cljs.core.first(cljs.core.next(arglist__4723));
var p__4714 = cljs.core.rest(cljs.core.next(arglist__4723));
return data__delegate($elem, k, p__4714);
});
data.cljs$lang$arity$variadic = data__delegate;
return data;
})()
;
jayq.core.add_class = (function add_class($elem,cl){
var cl__4725 = cljs.core.name.call(null,cl);
return $elem.addClass(cl__4725);
});
jayq.core.remove_class = (function remove_class($elem,cl){
var cl__4727 = cljs.core.name.call(null,cl);
return $elem.removeClass(cl__4727);
});
jayq.core.append = (function append($elem,content){
return $elem.append(content);
});
jayq.core.prepend = (function prepend($elem,content){
return $elem.prepend(content);
});
jayq.core.remove = (function remove($elem){
return $elem.remove();
});
/**
* @param {...*} var_args
*/
jayq.core.hide = (function() { 
var hide__delegate = function ($elem,p__4728){
var vec__4733__4734 = p__4728;
var speed__4735 = cljs.core.nth.call(null,vec__4733__4734,0,null);
var on_finish__4736 = cljs.core.nth.call(null,vec__4733__4734,1,null);
return $elem.hide(speed__4735,on_finish__4736);
};
var hide = function ($elem,var_args){
var p__4728 = null;
if (goog.isDef(var_args)) {
  p__4728 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1),0);
} 
return hide__delegate.call(this, $elem, p__4728);
};
hide.cljs$lang$maxFixedArity = 1;
hide.cljs$lang$applyTo = (function (arglist__4737){
var $elem = cljs.core.first(arglist__4737);
var p__4728 = cljs.core.rest(arglist__4737);
return hide__delegate($elem, p__4728);
});
hide.cljs$lang$arity$variadic = hide__delegate;
return hide;
})()
;
/**
* @param {...*} var_args
*/
jayq.core.show = (function() { 
var show__delegate = function ($elem,p__4738){
var vec__4743__4744 = p__4738;
var speed__4745 = cljs.core.nth.call(null,vec__4743__4744,0,null);
var on_finish__4746 = cljs.core.nth.call(null,vec__4743__4744,1,null);
return $elem.show(speed__4745,on_finish__4746);
};
var show = function ($elem,var_args){
var p__4738 = null;
if (goog.isDef(var_args)) {
  p__4738 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1),0);
} 
return show__delegate.call(this, $elem, p__4738);
};
show.cljs$lang$maxFixedArity = 1;
show.cljs$lang$applyTo = (function (arglist__4747){
var $elem = cljs.core.first(arglist__4747);
var p__4738 = cljs.core.rest(arglist__4747);
return show__delegate($elem, p__4738);
});
show.cljs$lang$arity$variadic = show__delegate;
return show;
})()
;
/**
* @param {...*} var_args
*/
jayq.core.toggle = (function() { 
var toggle__delegate = function ($elem,p__4748){
var vec__4753__4754 = p__4748;
var speed__4755 = cljs.core.nth.call(null,vec__4753__4754,0,null);
var on_finish__4756 = cljs.core.nth.call(null,vec__4753__4754,1,null);
return $elem.toggle(speed__4755,on_finish__4756);
};
var toggle = function ($elem,var_args){
var p__4748 = null;
if (goog.isDef(var_args)) {
  p__4748 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1),0);
} 
return toggle__delegate.call(this, $elem, p__4748);
};
toggle.cljs$lang$maxFixedArity = 1;
toggle.cljs$lang$applyTo = (function (arglist__4757){
var $elem = cljs.core.first(arglist__4757);
var p__4748 = cljs.core.rest(arglist__4757);
return toggle__delegate($elem, p__4748);
});
toggle.cljs$lang$arity$variadic = toggle__delegate;
return toggle;
})()
;
/**
* @param {...*} var_args
*/
jayq.core.fade_out = (function() { 
var fade_out__delegate = function ($elem,p__4758){
var vec__4763__4764 = p__4758;
var speed__4765 = cljs.core.nth.call(null,vec__4763__4764,0,null);
var on_finish__4766 = cljs.core.nth.call(null,vec__4763__4764,1,null);
return $elem.fadeOut(speed__4765,on_finish__4766);
};
var fade_out = function ($elem,var_args){
var p__4758 = null;
if (goog.isDef(var_args)) {
  p__4758 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1),0);
} 
return fade_out__delegate.call(this, $elem, p__4758);
};
fade_out.cljs$lang$maxFixedArity = 1;
fade_out.cljs$lang$applyTo = (function (arglist__4767){
var $elem = cljs.core.first(arglist__4767);
var p__4758 = cljs.core.rest(arglist__4767);
return fade_out__delegate($elem, p__4758);
});
fade_out.cljs$lang$arity$variadic = fade_out__delegate;
return fade_out;
})()
;
/**
* @param {...*} var_args
*/
jayq.core.fade_in = (function() { 
var fade_in__delegate = function ($elem,p__4768){
var vec__4773__4774 = p__4768;
var speed__4775 = cljs.core.nth.call(null,vec__4773__4774,0,null);
var on_finish__4776 = cljs.core.nth.call(null,vec__4773__4774,1,null);
return $elem.fadeIn(speed__4775,on_finish__4776);
};
var fade_in = function ($elem,var_args){
var p__4768 = null;
if (goog.isDef(var_args)) {
  p__4768 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1),0);
} 
return fade_in__delegate.call(this, $elem, p__4768);
};
fade_in.cljs$lang$maxFixedArity = 1;
fade_in.cljs$lang$applyTo = (function (arglist__4777){
var $elem = cljs.core.first(arglist__4777);
var p__4768 = cljs.core.rest(arglist__4777);
return fade_in__delegate($elem, p__4768);
});
fade_in.cljs$lang$arity$variadic = fade_in__delegate;
return fade_in;
})()
;
/**
* @param {...*} var_args
*/
jayq.core.slide_up = (function() { 
var slide_up__delegate = function ($elem,p__4778){
var vec__4783__4784 = p__4778;
var speed__4785 = cljs.core.nth.call(null,vec__4783__4784,0,null);
var on_finish__4786 = cljs.core.nth.call(null,vec__4783__4784,1,null);
return $elem.slideUp(speed__4785,on_finish__4786);
};
var slide_up = function ($elem,var_args){
var p__4778 = null;
if (goog.isDef(var_args)) {
  p__4778 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1),0);
} 
return slide_up__delegate.call(this, $elem, p__4778);
};
slide_up.cljs$lang$maxFixedArity = 1;
slide_up.cljs$lang$applyTo = (function (arglist__4787){
var $elem = cljs.core.first(arglist__4787);
var p__4778 = cljs.core.rest(arglist__4787);
return slide_up__delegate($elem, p__4778);
});
slide_up.cljs$lang$arity$variadic = slide_up__delegate;
return slide_up;
})()
;
/**
* @param {...*} var_args
*/
jayq.core.slide_down = (function() { 
var slide_down__delegate = function ($elem,p__4788){
var vec__4793__4794 = p__4788;
var speed__4795 = cljs.core.nth.call(null,vec__4793__4794,0,null);
var on_finish__4796 = cljs.core.nth.call(null,vec__4793__4794,1,null);
return $elem.slideDown(speed__4795,on_finish__4796);
};
var slide_down = function ($elem,var_args){
var p__4788 = null;
if (goog.isDef(var_args)) {
  p__4788 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1),0);
} 
return slide_down__delegate.call(this, $elem, p__4788);
};
slide_down.cljs$lang$maxFixedArity = 1;
slide_down.cljs$lang$applyTo = (function (arglist__4797){
var $elem = cljs.core.first(arglist__4797);
var p__4788 = cljs.core.rest(arglist__4797);
return slide_down__delegate($elem, p__4788);
});
slide_down.cljs$lang$arity$variadic = slide_down__delegate;
return slide_down;
})()
;
jayq.core.parent = (function parent($elem){
return $elem.parent();
});
jayq.core.find = (function find($elem,selector){
return $elem.find(cljs.core.name.call(null,selector));
});
jayq.core.inner = (function inner($elem,v){
return $elem.html(v);
});
jayq.core.empty = (function empty($elem){
return $elem.empty();
});
/**
* @param {...*} var_args
*/
jayq.core.val = (function() { 
var val__delegate = function ($elem,p__4798){
var vec__4802__4803 = p__4798;
var v__4804 = cljs.core.nth.call(null,vec__4802__4803,0,null);
if(cljs.core.truth_(v__4804))
{return $elem.val(v__4804);
} else
{return $elem.val();
}
};
var val = function ($elem,var_args){
var p__4798 = null;
if (goog.isDef(var_args)) {
  p__4798 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1),0);
} 
return val__delegate.call(this, $elem, p__4798);
};
val.cljs$lang$maxFixedArity = 1;
val.cljs$lang$applyTo = (function (arglist__4805){
var $elem = cljs.core.first(arglist__4805);
var p__4798 = cljs.core.rest(arglist__4805);
return val__delegate($elem, p__4798);
});
val.cljs$lang$arity$variadic = val__delegate;
return val;
})()
;
jayq.core.queue = (function queue($elem,callback){
return $elem.queue(callback);
});
jayq.core.dequeue = (function dequeue(elem){
return jayq.core.$.call(null,elem).dequeue();
});
jayq.core.document_ready = (function document_ready(func){
return jayq.core.$.call(null,document).ready(func);
});
jayq.core.xhr = (function xhr(p__4806,content,callback){
var vec__4812__4813 = p__4806;
var method__4814 = cljs.core.nth.call(null,vec__4812__4813,0,null);
var uri__4815 = cljs.core.nth.call(null,vec__4812__4813,1,null);
var params__4816 = jayq.util.clj__GT_js.call(null,cljs.core.ObjMap.fromObject(["\uFDD0'type","\uFDD0'data","\uFDD0'success"],{"\uFDD0'type":clojure.string.upper_case.call(null,cljs.core.name.call(null,method__4814)),"\uFDD0'data":jayq.util.clj__GT_js.call(null,content),"\uFDD0'success":callback}));
return jQuery.ajax(uri__4815,params__4816);
});
jayq.core.bind = (function bind($elem,ev,func){
return $elem.bind(cljs.core.name.call(null,ev),func);
});
jayq.core.trigger = (function trigger($elem,ev){
return $elem.trigger(cljs.core.name.call(null,ev));
});
jayq.core.delegate = (function delegate($elem,sel,ev,func){
return $elem.delegate(jayq.core.__GT_selector.call(null,sel),cljs.core.name.call(null,ev),func);
});
jayq.core.__GT_event = (function __GT_event(e){
if(cljs.core.keyword_QMARK_.call(null,e))
{return cljs.core.name.call(null,e);
} else
{if(cljs.core.map_QMARK_.call(null,e))
{return jayq.util.clj__GT_js.call(null,e);
} else
{if(cljs.core.coll_QMARK_.call(null,e))
{return clojure.string.join.call(null," ",cljs.core.map.call(null,cljs.core.name,e));
} else
{if("\uFDD0'else")
{throw (new Error([cljs.core.str("Unknown event type: "),cljs.core.str(e)].join('')));
} else
{return null;
}
}
}
}
});
/**
* @param {...*} var_args
*/
jayq.core.on = (function() { 
var on__delegate = function ($elem,events,p__4817){
var vec__4823__4824 = p__4817;
var sel__4825 = cljs.core.nth.call(null,vec__4823__4824,0,null);
var data__4826 = cljs.core.nth.call(null,vec__4823__4824,1,null);
var handler__4827 = cljs.core.nth.call(null,vec__4823__4824,2,null);
return $elem.on(jayq.core.__GT_event.call(null,events),jayq.core.__GT_selector.call(null,sel__4825),data__4826,handler__4827);
};
var on = function ($elem,events,var_args){
var p__4817 = null;
if (goog.isDef(var_args)) {
  p__4817 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2),0);
} 
return on__delegate.call(this, $elem, events, p__4817);
};
on.cljs$lang$maxFixedArity = 2;
on.cljs$lang$applyTo = (function (arglist__4828){
var $elem = cljs.core.first(arglist__4828);
var events = cljs.core.first(cljs.core.next(arglist__4828));
var p__4817 = cljs.core.rest(cljs.core.next(arglist__4828));
return on__delegate($elem, events, p__4817);
});
on.cljs$lang$arity$variadic = on__delegate;
return on;
})()
;
/**
* @param {...*} var_args
*/
jayq.core.one = (function() { 
var one__delegate = function ($elem,events,p__4829){
var vec__4835__4836 = p__4829;
var sel__4837 = cljs.core.nth.call(null,vec__4835__4836,0,null);
var data__4838 = cljs.core.nth.call(null,vec__4835__4836,1,null);
var handler__4839 = cljs.core.nth.call(null,vec__4835__4836,2,null);
return $elem.one(jayq.core.__GT_event.call(null,events),jayq.core.__GT_selector.call(null,sel__4837),data__4838,handler__4839);
};
var one = function ($elem,events,var_args){
var p__4829 = null;
if (goog.isDef(var_args)) {
  p__4829 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2),0);
} 
return one__delegate.call(this, $elem, events, p__4829);
};
one.cljs$lang$maxFixedArity = 2;
one.cljs$lang$applyTo = (function (arglist__4840){
var $elem = cljs.core.first(arglist__4840);
var events = cljs.core.first(cljs.core.next(arglist__4840));
var p__4829 = cljs.core.rest(cljs.core.next(arglist__4840));
return one__delegate($elem, events, p__4829);
});
one.cljs$lang$arity$variadic = one__delegate;
return one;
})()
;
/**
* @param {...*} var_args
*/
jayq.core.off = (function() { 
var off__delegate = function ($elem,events,p__4841){
var vec__4846__4847 = p__4841;
var sel__4848 = cljs.core.nth.call(null,vec__4846__4847,0,null);
var handler__4849 = cljs.core.nth.call(null,vec__4846__4847,1,null);
return $elem.off(jayq.core.__GT_event.call(null,events),jayq.core.__GT_selector.call(null,sel__4848),handler__4849);
};
var off = function ($elem,events,var_args){
var p__4841 = null;
if (goog.isDef(var_args)) {
  p__4841 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2),0);
} 
return off__delegate.call(this, $elem, events, p__4841);
};
off.cljs$lang$maxFixedArity = 2;
off.cljs$lang$applyTo = (function (arglist__4850){
var $elem = cljs.core.first(arglist__4850);
var events = cljs.core.first(cljs.core.next(arglist__4850));
var p__4841 = cljs.core.rest(cljs.core.next(arglist__4850));
return off__delegate($elem, events, p__4841);
});
off.cljs$lang$arity$variadic = off__delegate;
return off;
})()
;
