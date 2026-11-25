/* DTPARTS · runtime liviano para ver las páginas fuera de Claude Design.
   Lee la plantilla <template id="dc-tpl"> y el componente <script type="text/x-dc">,
   resuelve {{valores}}, <sc-if> y <sc-for>, y actualiza la página con morphdom. */
(function () {
  'use strict';

  function DCLogic(props) { this.props = props || {}; }
  DCLogic.prototype.setState = function (patch) {
    this.state = Object.assign({}, this.state || {}, typeof patch === 'function' ? patch(this.state || {}) : patch);
    schedule();
  };

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var EVENTS = { onclick: 'click', onmouseenter: 'mouseenter', onmouseleave: 'mouseleave', onchange: 'change', oninput: 'input' };
  var comp, tpl, root, queued = false, mounted = false;

  function lookup(expr, scope) {
    expr = expr.trim();
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    var parts = expr.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  function single(str) { var m = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/.exec(str); return m ? m[1] : null; }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, e) { var v = lookup(e, scope); return v == null ? '' : String(v); });
  }

  function renderChildren(srcParent, outParent, scope) {
    for (var n = srcParent.firstChild; n; n = n.nextSibling) renderNode(n, outParent, scope);
  }

  function renderNode(n, out, scope) {
    if (n.nodeType === 3) { out.appendChild(document.createTextNode(interp(n.nodeValue, scope))); return; }
    if (n.nodeType !== 1) return;
    var tag = n.tagName.toLowerCase();
    if (tag === 'sc-if') {
      var e = single(n.getAttribute('value') || '');
      if (e && lookup(e, scope)) renderChildren(n, out, scope);
      return;
    }
    if (tag === 'sc-for') {
      var le = single(n.getAttribute('list') || ''), as = n.getAttribute('as') || 'item';
      var list = (le && lookup(le, scope)) || [];
      for (var i = 0; i < list.length; i++) {
        var s2 = Object.create(scope); s2[as] = list[i];
        renderChildren(n, out, s2);
      }
      return;
    }
    var el = n.namespaceURI === 'http://www.w3.org/2000/svg'
      ? document.createElementNS(n.namespaceURI, n.tagName)
      : document.createElement(n.tagName);
    var handlers = null, boundValue;
    for (var a = 0; a < n.attributes.length; a++) {
      var at = n.attributes[a], name = at.name, lname = name.toLowerCase(), val = at.value;
      if (lname.indexOf('hint-') === 0) continue;
      if (EVENTS[lname]) {
        var fe = single(val), fn = fe && lookup(fe, scope);
        if (typeof fn === 'function') { (handlers = handlers || {})[EVENTS[lname]] = fn; }
        continue;
      }
      if (val.indexOf('{{') !== -1) {
        var se = single(val);
        if (se) {
          var v = lookup(se, scope);
          if (v === false || v == null) continue;
          val = v === true ? '' : String(v);
        } else {
          val = interp(val, scope);
        }
      }
      if (lname === 'value' && tag === 'select') { boundValue = val; continue; }
      el.setAttribute(name, val);
    }
    if (handlers) el.__dc = handlers;
    var src = tag === 'template' ? n.content : n;
    renderChildren(src, el, scope);
    if (boundValue !== undefined) {
      for (var o = 0; o < el.options.length; o++) {
        if (el.options[o].value === boundValue) el.options[o].setAttribute('selected', '');
        else el.options[o].removeAttribute('selected');
      }
    }
    out.appendChild(el);
  }

  function dispatch(type) {
    return function (ev) {
      var t = ev.target;
      if (type === 'mouseenter' || type === 'mouseleave') {
        var h = t && t.__dc && t.__dc[type];
        if (h) h.call(t, wrap(ev, t));
        return;
      }
      while (t && t !== document) {
        var fn = t.__dc && t.__dc[type];
        if (fn) { fn.call(t, wrap(ev, t)); if (ev.__stop) break; }
        t = t.parentNode;
      }
    };
  }
  function wrap(ev, el) {
    return {
      nativeEvent: ev, target: ev.target, currentTarget: el, key: ev.key,
      preventDefault: function () { ev.preventDefault(); },
      stopPropagation: function () { ev.stopPropagation(); ev.__stop = true; }
    };
  }

  function build() {
    var vals = comp.renderVals ? comp.renderVals() : {};
    var frag = document.createElement('div');
    renderChildren(tpl.content, frag, vals);
    return frag;
  }

  function render() {
    queued = false;
    var next = build();
    next.id = root.id;
    window.morphdom(root, next, {
      childrenOnly: true,
      onBeforeElUpdated: function (from, to) {
        from.__dc = to.__dc;
        var tg = from.tagName;
        if ((tg === 'INPUT' || tg === 'TEXTAREA') && !to.hasAttribute('value') && from.type !== 'checkbox' && from.type !== 'radio') {
          to.value = from.value;
        }
        if (from === document.activeElement && (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT')) {
          if (tg !== 'SELECT') to.value = from.value;
        }
        return true;
      },
      onNodeAdded: function (node) { return node; }
    });
    if (!mounted) {
      mounted = true;
      if (comp.componentDidMount) comp.componentDidMount();
    }
  }
  function schedule() {
    if (!root || queued) return;
    queued = true;
    (window.requestAnimationFrame || setTimeout)(render);
  }

  function boot() {
    tpl = document.getElementById('dc-tpl');
    root = document.getElementById('dc-root');
    var code = document.querySelector('script[type="text/x-dc"]').textContent;
    var Component = new Function('DCLogic', code + '\n;return Component;')(DCLogic);
    comp = new Component({});
    if (!comp.state) comp.state = {};
    ['click', 'change', 'input'].forEach(function (t) { document.addEventListener(t, dispatch(t)); });
    ['mouseenter', 'mouseleave'].forEach(function (t) { document.addEventListener(t, dispatch(t), true); });
    render();
    window.addEventListener('pagehide', function () { if (comp.componentWillUnmount) comp.componentWillUnmount(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
