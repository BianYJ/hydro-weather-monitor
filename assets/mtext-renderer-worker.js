var st;
(function(n) {
  n[n.NONE = 0] = "NONE", n[n.WORD = 1] = "WORD", n[n.STACK = 2] = "STACK", n[n.SPACE = 3] = "SPACE", n[n.NBSP = 4] = "NBSP", n[n.TABULATOR = 5] = "TABULATOR", n[n.NEW_PARAGRAPH = 6] = "NEW_PARAGRAPH", n[n.NEW_COLUMN = 7] = "NEW_COLUMN", n[n.WRAP_AT_DIMLINE = 8] = "WRAP_AT_DIMLINE", n[n.PROPERTIES_CHANGED = 9] = "PROPERTIES_CHANGED", n[n.PERCENT_SYMBOL = 10] = "PERCENT_SYMBOL";
})(st || (st = {}));
var je;
(function(n) {
  n[n.BOTTOM = 0] = "BOTTOM", n[n.MIDDLE = 1] = "MIDDLE", n[n.TOP = 2] = "TOP";
})(je || (je = {}));
var ht;
(function(n) {
  n[n.DEFAULT = 0] = "DEFAULT", n[n.LEFT = 1] = "LEFT", n[n.RIGHT = 2] = "RIGHT", n[n.CENTER = 3] = "CENTER", n[n.JUSTIFIED = 4] = "JUSTIFIED", n[n.DISTRIBUTED = 5] = "DISTRIBUTED";
})(ht || (ht = {}));
var Ge;
(function(n) {
  n[n.NONE = 0] = "NONE", n[n.UNDERLINE = 1] = "UNDERLINE", n[n.OVERLINE = 2] = "OVERLINE", n[n.STRIKE_THROUGH = 4] = "STRIKE_THROUGH";
})(Ge || (Ge = {}));
const ql = {
  c: "Ø",
  d: "°",
  p: "±",
  "%": "%"
}, jl = {
  l: ht.LEFT,
  r: ht.RIGHT,
  c: ht.CENTER,
  j: ht.JUSTIFIED,
  d: ht.DISTRIBUTED
};
function Xl(n) {
  const [t, e, s] = n;
  return t << 16 | e << 8 | s;
}
function Pa(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}
function ih(n) {
  return Math.max(0, Math.min(16777215, Math.round(n)));
}
function Yl(n) {
  return n === null ? null : `#${ih(n).toString(16).padStart(6, "0")}`;
}
function $l(n) {
  if (!n)
    return null;
  const t = n.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(t))
    return t;
  if (/^[0-9a-f]{6}$/.test(t))
    return `#${t}`;
  if (/^#[0-9a-f]{3}$/.test(t)) {
    const e = t[1], s = t[2], i = t[3];
    return `#${e}${e}${s}${s}${i}${i}`;
  }
  if (/^[0-9a-f]{3}$/.test(t)) {
    const e = t[0], s = t[1], i = t[2];
    return `#${e}${e}${s}${s}${i}${i}`;
  }
  return null;
}
function Zl(n) {
  if (!n)
    return null;
  const t = n.trim().toLowerCase();
  if (t === "transparent")
    return null;
  const e = $l(t);
  if (e)
    return ih(Number.parseInt(e.slice(1), 16));
  const s = t.match(/^rgba?\((.*)\)$/);
  if (!s)
    return null;
  const i = s[1].replace(/\s*\/\s*/g, " ").split(/[,\s]+/).map((h) => h.trim()).filter(Boolean);
  if (i.length < 3)
    return null;
  const r = (h) => {
    if (h.endsWith("%")) {
      const u = Number.parseFloat(h.slice(0, -1));
      return Pa(u / 100 * 255);
    }
    const l = Number.parseFloat(h);
    return Pa(l);
  }, a = r(i[0]), o = r(i[1]), c = r(i[2]);
  return Xl([a, o, c]);
}
function Jl(n, t = !1) {
  const e = /* @__PURE__ */ new Set(), s = /\\[fF](.*?)[;|]/g;
  return [...n.matchAll(s)].forEach((i) => {
    let r = i[1].toLowerCase();
    t && (r = r.replace(/\.(ttf|otf|woff|shx)$/, "")), e.add(r);
  }), e;
}
class Kl {
  /**
   * Creates a new ContextStack with an initial context.
   * @param initial The initial MTextContext to use as the base of the stack.
   */
  constructor(t) {
    this.stack = [], this.stack.push(t);
  }
  /**
   * Pushes a copy of the given context onto the stack.
   * @param ctx The MTextContext to push (copied).
   */
  push(t) {
    this.stack.push(t);
  }
  /**
   * Pops the top context from the stack and merges its paragraph properties into the new top context.
   * If only one context remains, nothing is popped.
   * @returns The popped MTextContext, or undefined if the stack has only one context.
   */
  pop() {
    if (this.stack.length <= 1)
      return;
    const t = this.stack.pop(), e = this.stack[this.stack.length - 1];
    return JSON.stringify(e.paragraph) !== JSON.stringify(t.paragraph) && (e.paragraph = { ...t.paragraph }), t;
  }
  /**
   * Returns the current (top) context on the stack.
   */
  get current() {
    return this.stack[this.stack.length - 1];
  }
  /**
   * Returns the current stack depth (number of nested blocks), not counting the root context.
   */
  get depth() {
    return this.stack.length - 1;
  }
  /**
   * Returns the root (bottom) context, which represents the global formatting state.
   * Used for paragraph property application.
   */
  get root() {
    return this.stack[0];
  }
  /**
   * Replaces the current (top) context with the given context.
   * @param ctx The new context to set as the current context.
   */
  setCurrent(t) {
    this.stack[this.stack.length - 1] = t;
  }
}
class Ql {
  /**
   * Creates a new MTextParser instance
   * @param content - The MText content to parse
   * @param ctx - Optional initial MText context
   * @param options - Parser options
   */
  constructor(t, e, s = {}) {
    this.continueStroke = !1, this.inStackContext = !1, this.scanner = new Gi(t);
    const i = e ?? new bs();
    this.ctxStack = new Kl(i), this.yieldPropertyCommands = s.yieldPropertyCommands ?? !1, this.resetParagraphParameters = s.resetParagraphParameters ?? !1, this.yieldPercentSymbols = s.yieldPercentSymbols ?? !1, this.mifDecoder = s.mifDecoder ?? this.decodeMultiByteChar.bind(this), this.mifCodeLength = s.mifCodeLength ?? "auto";
  }
  /**
   * Decode multi-byte character from hex code
   * @param hex - Hex code string (e.g. "C4E3" or "1A2B3")
   * @returns Decoded character or empty square if invalid
   */
  decodeMultiByteChar(t) {
    try {
      if (t.length === 5) {
        const e = t[0];
        let s = "gbk";
        e === "1" ? s = "shift-jis" : e === "2" && (s = "big5");
        const i = new Uint8Array([
          parseInt(t.substr(1, 2), 16),
          parseInt(t.substr(3, 2), 16)
        ]);
        return new TextDecoder(s).decode(i);
      } else if (t.length === 4) {
        const e = new Uint8Array([
          parseInt(t.substr(0, 2), 16),
          parseInt(t.substr(2, 2), 16)
        ]), i = new TextDecoder("gbk").decode(e);
        if (i !== "▯")
          return i;
        const a = new TextDecoder("big5").decode(e);
        if (a !== "▯")
          return a;
      }
      return "▯";
    } catch {
      return "▯";
    }
  }
  /**
   * Extract MIF hex code from scanner
   * @param length - The length of the hex code to extract (4 or 5), or 'auto' to detect
   * @returns The extracted hex code, or null if not found
   */
  extractMifCode(t) {
    var e, s, i;
    if (t === "auto") {
      const r = (e = this.scanner.tail.match(/^[0-9A-Fa-f]{5}/)) == null ? void 0 : e[0];
      if (r)
        return r;
      const a = (s = this.scanner.tail.match(/^[0-9A-Fa-f]{4}/)) == null ? void 0 : s[0];
      return a || null;
    } else
      return ((i = this.scanner.tail.match(new RegExp(`^[0-9A-Fa-f]{${t}}`))) == null ? void 0 : i[0]) ?? null;
  }
  /**
   * Push current context onto the stack
   */
  pushCtx() {
    this.ctxStack.push(this.ctxStack.current);
  }
  /**
   * Pop context from the stack
   */
  popCtx() {
    this.ctxStack.pop();
  }
  /**
   * Parse stacking expression (numerator/denominator)
   * @returns Tuple of [TokenType.STACK, [numerator, denominator, type]]
   */
  parseStacking() {
    const t = new Gi(this.extractExpression(!0));
    let e = "", s = "", i = "";
    const r = () => {
      let c = t.peek(), h = !1;
      return c.charCodeAt(0) < 32 && (c = " "), c === "\\" && (h = !0, t.consume(1), c = t.peek()), t.consume(1), [c, h];
    }, a = () => {
      let c = "";
      for (; t.hasData; ) {
        const [h, l] = r();
        if (!l && (h === "/" || h === "#" || h === "^"))
          return [c, h];
        c += h;
      }
      return [c, ""];
    }, o = (c) => {
      let h = "", l = c;
      for (; t.hasData; ) {
        const [u, f] = r();
        if (!(l && u === " ")) {
          if (l = !1, !f && u === ";")
            break;
          h += u;
        }
      }
      return h;
    };
    return [e, i] = a(), i && (s = o(i === "^")), e === "" && s.includes("I/") ? [st.STACK, [" ", " ", "/"]] : i === "^" ? [st.STACK, [e, s, "^"]] : [st.STACK, [e, s, i]];
  }
  /**
   * Parse MText properties
   * @param cmd - The property command to parse
   * @returns Property changes if yieldPropertyCommands is true and changes occurred
   */
  parseProperties(t) {
    const e = this.ctxStack.current.copy(), s = this.ctxStack.current.copy();
    switch (t) {
      case "L":
        s.underline = !0, this.continueStroke = !0;
        break;
      case "l":
        s.underline = !1, s.hasAnyStroke || (this.continueStroke = !1);
        break;
      case "O":
        s.overline = !0, this.continueStroke = !0;
        break;
      case "o":
        s.overline = !1, s.hasAnyStroke || (this.continueStroke = !1);
        break;
      case "K":
        s.strikeThrough = !0, this.continueStroke = !0;
        break;
      case "k":
        s.strikeThrough = !1, s.hasAnyStroke || (this.continueStroke = !1);
        break;
      case "A":
        this.parseAlign(s);
        break;
      case "C":
        this.parseAciColor(s);
        break;
      case "c":
        this.parseRgbColor(s);
        break;
      case "H":
        this.parseHeight(s);
        break;
      case "W":
        this.parseWidth(s);
        break;
      case "Q":
        this.parseOblique(s);
        break;
      case "T":
        this.parseCharTracking(s);
        break;
      case "p":
        this.parseParagraphProperties(s);
        break;
      case "f":
      case "F":
        this.parseFontProperties(s);
        break;
      default:
        throw new Error(`Unknown command: ${t}`);
    }
    if (this.continueStroke = s.hasAnyStroke, s.continueStroke = this.continueStroke, this.ctxStack.setCurrent(s), this.yieldPropertyCommands) {
      const i = this.getPropertyChanges(e, s);
      if (Object.keys(i).length > 0)
        return {
          command: t,
          changes: i,
          depth: this.ctxStack.depth
        };
    }
  }
  /**
   * Get property changes between two contexts
   * @param oldCtx - The old context
   * @param newCtx - The new context
   * @returns Object containing changed properties
   */
  getPropertyChanges(t, e) {
    const s = {};
    if (t.underline !== e.underline && (s.underline = e.underline), t.overline !== e.overline && (s.overline = e.overline), t.strikeThrough !== e.strikeThrough && (s.strikeThrough = e.strikeThrough), t.color.aci !== e.color.aci && (s.aci = e.color.aci), t.color.rgbValue !== e.color.rgbValue && (s.rgb = e.color.rgb), t.align !== e.align && (s.align = e.align), JSON.stringify(t.fontFace) !== JSON.stringify(e.fontFace) && (s.fontFace = e.fontFace), (t.capHeight.value !== e.capHeight.value || t.capHeight.isRelative !== e.capHeight.isRelative) && (s.capHeight = e.capHeight), (t.widthFactor.value !== e.widthFactor.value || t.widthFactor.isRelative !== e.widthFactor.isRelative) && (s.widthFactor = e.widthFactor), (t.charTrackingFactor.value !== e.charTrackingFactor.value || t.charTrackingFactor.isRelative !== e.charTrackingFactor.isRelative) && (s.charTrackingFactor = e.charTrackingFactor), t.oblique !== e.oblique && (s.oblique = e.oblique), JSON.stringify(t.paragraph) !== JSON.stringify(e.paragraph)) {
      const i = {};
      t.paragraph.indent !== e.paragraph.indent && (i.indent = e.paragraph.indent), t.paragraph.align !== e.paragraph.align && (i.align = e.paragraph.align), t.paragraph.left !== e.paragraph.left && (i.left = e.paragraph.left), t.paragraph.right !== e.paragraph.right && (i.right = e.paragraph.right), JSON.stringify(t.paragraph.tabs) !== JSON.stringify(e.paragraph.tabs) && (i.tabs = e.paragraph.tabs), Object.keys(i).length > 0 && (s.paragraph = i);
    }
    return s;
  }
  /**
   * Parse alignment property
   * @param ctx - The context to update
   */
  parseAlign(t) {
    const e = this.scanner.get();
    "012".includes(e) ? t.align = parseInt(e) : t.align = je.BOTTOM, this.consumeOptionalTerminator();
  }
  /**
   * Parse height property
   * @param ctx - The context to update
   */
  parseHeight(t) {
    const e = this.extractFloatExpression(!0);
    if (e)
      try {
        e.endsWith("x") ? t.capHeight = {
          value: parseFloat(e.slice(0, -1)),
          isRelative: !0
        } : t.capHeight = {
          value: parseFloat(e),
          isRelative: !1
        };
      } catch {
        this.scanner.consume(-e.length);
        return;
      }
    this.consumeOptionalTerminator();
  }
  /**
   * Parse width property
   * @param ctx - The context to update
   */
  parseWidth(t) {
    const e = this.extractFloatExpression(!0);
    if (e)
      try {
        e.endsWith("x") ? t.widthFactor = {
          value: parseFloat(e.slice(0, -1)),
          isRelative: !0
        } : t.widthFactor = {
          value: parseFloat(e),
          isRelative: !1
        };
      } catch {
        this.scanner.consume(-e.length);
        return;
      }
    this.consumeOptionalTerminator();
  }
  /**
   * Parse character tracking property
   * @param ctx - The context to update
   */
  parseCharTracking(t) {
    const e = this.extractFloatExpression(!0);
    if (e)
      try {
        e.endsWith("x") ? t.charTrackingFactor = {
          value: Math.abs(parseFloat(e.slice(0, -1))),
          isRelative: !0
        } : t.charTrackingFactor = {
          value: Math.abs(parseFloat(e)),
          isRelative: !1
        };
      } catch {
        this.scanner.consume(-e.length);
        return;
      }
    this.consumeOptionalTerminator();
  }
  /**
   * Parse float value or factor
   * @param value - Current value to apply factor to
   * @returns New value
   */
  parseFloatValueOrFactor(t) {
    const e = this.extractFloatExpression(!0);
    if (e)
      if (e.endsWith("x")) {
        const s = parseFloat(e.slice(0, -1));
        t *= s;
      } else
        t = parseFloat(e);
    return t;
  }
  /**
   * Parse oblique angle property
   * @param ctx - The context to update
   */
  parseOblique(t) {
    const e = this.extractFloatExpression(!1);
    e && (t.oblique = parseFloat(e)), this.consumeOptionalTerminator();
  }
  /**
   * Parse ACI color property
   * @param ctx - The context to update
   */
  parseAciColor(t) {
    const e = this.extractIntExpression();
    if (e) {
      const s = parseInt(e);
      s < 257 && (t.color.aci = s);
    }
    this.consumeOptionalTerminator();
  }
  /**
   * Parse RGB color property
   * @param ctx - The context to update
   */
  parseRgbColor(t) {
    const e = this.extractIntExpression();
    if (e) {
      const s = parseInt(e) & 16777215;
      t.color.rgbValue = s;
    }
    this.consumeOptionalTerminator();
  }
  /**
   * Extract float expression from scanner
   * @param relative - Whether to allow relative values (ending in 'x')
   * @returns Extracted expression
   */
  extractFloatExpression(t = !1) {
    const e = t ? /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?x?/ : /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/, s = this.scanner.tail.match(e);
    if (s) {
      const i = s[0];
      return this.scanner.consume(i.length), i;
    }
    return "";
  }
  /**
   * Extract integer expression from scanner
   * @returns Extracted expression
   */
  extractIntExpression() {
    const t = this.scanner.tail.match(/^\d+/);
    if (t) {
      const e = t[0];
      return this.scanner.consume(e.length), e;
    }
    return "";
  }
  /**
   * Extract expression until semicolon or end
   * @param escape - Whether to handle escaped semicolons
   * @returns Extracted expression
   */
  extractExpression(t = !1) {
    const e = this.scanner.find(";", t);
    if (e < 0) {
      const a = this.scanner.tail;
      return this.scanner.consume(a.length), a;
    }
    const i = this.scanner.peek(e - this.scanner.currentIndex - 1) === "\\", r = this.scanner.tail.slice(0, e - this.scanner.currentIndex + (i ? 1 : 0));
    return this.scanner.consume(r.length + 1), r;
  }
  /**
   * Parse font properties
   * @param ctx - The context to update
   */
  parseFontProperties(t) {
    const e = this.extractExpression().split("|");
    if (e.length > 0 && e[0]) {
      const s = e[0];
      let i = "Regular", r = 400;
      for (const a of e.slice(1))
        a.startsWith("b1") ? r = 700 : a === "i" || a.startsWith("i1") ? i = "Italic" : (a === "i0" || a.startsWith("i0")) && (i = "Regular");
      t.fontFace = {
        family: s,
        style: i,
        weight: r
      };
    }
  }
  /**
   * Parse paragraph properties from the MText content
   * Handles properties like indentation, alignment, and tab stops
   * @param ctx - The context to update
   */
  parseParagraphProperties(t) {
    const e = new Gi(this.extractExpression());
    let s = t.paragraph.indent, i = t.paragraph.left, r = t.paragraph.right, a = t.paragraph.align, o = [];
    const c = () => {
      const h = e.tail.match(/^[+-]?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/);
      if (h) {
        const l = parseFloat(h[0]);
        for (e.consume(h[0].length); e.peek() === ","; )
          e.consume(1);
        return l;
      }
      return 0;
    };
    for (; e.hasData; )
      switch (e.get()) {
        case "i":
          s = c();
          break;
        case "l":
          i = c();
          break;
        case "r":
          r = c();
          break;
        case "x":
          break;
        case "q": {
          const l = e.get();
          for (a = jl[l] || ht.DEFAULT; e.peek() === ","; )
            e.consume(1);
          break;
        }
        case "t":
          for (o = []; e.hasData; ) {
            const l = e.peek();
            if (l === "r" || l === "c") {
              e.consume(1);
              const u = c();
              o.push(l + u.toString());
            } else {
              const u = c();
              isNaN(u) ? e.consume(1) : o.push(u);
            }
          }
          break;
      }
    t.paragraph = {
      indent: s,
      left: i,
      right: r,
      align: a,
      tabs: o
    };
  }
  /**
   * Consume optional terminator (semicolon)
   */
  consumeOptionalTerminator() {
    this.scanner.peek() === ";" && this.scanner.consume(1);
  }
  /**
   * Builds {@link PercentSymbolData} for a recognized `%%` code letter.
   */
  buildPercentSymbolData(t, e) {
    return t === "c" || t === "d" || t === "p" ? { kind: "named", code: t, char: e } : t === "%" ? { kind: "literal", char: "%" } : null;
  }
  /**
   * Parse MText content into tokens
   * @yields MTextToken objects
   */
  *parse() {
    const t = st.WORD, e = st.SPACE;
    let s = null, i;
    function r(o) {
      const c = { ...o.paragraph };
      o.paragraph = {
        indent: 0,
        left: 0,
        right: 0,
        align: ht.DEFAULT,
        tabs: []
      };
      const h = {};
      return c.indent !== 0 && (h.indent = 0), c.left !== 0 && (h.left = 0), c.right !== 0 && (h.right = 0), c.align !== ht.DEFAULT && (h.align = ht.DEFAULT), JSON.stringify(c.tabs) !== JSON.stringify([]) && (h.tabs = []), h;
    }
    const a = () => {
      let o = "";
      for (; this.scanner.hasData; ) {
        let c = !1, h = this.scanner.peek();
        const l = this.scanner.currentIndex;
        if (h.charCodeAt(0) < 32) {
          if (this.scanner.consume(1), h === "	")
            return [st.TABULATOR, null];
          if (h === `
`)
            return [st.NEW_PARAGRAPH, null];
          h = " ";
        }
        if (h === "\\")
          if ("\\{}".includes(this.scanner.peek(1)))
            c = !0, this.scanner.consume(1), h = this.scanner.peek();
          else {
            if (o)
              return [t, o];
            this.scanner.consume(1);
            const u = this.scanner.get();
            switch (u) {
              case "~":
                return [st.NBSP, null];
              case "P":
                return [st.NEW_PARAGRAPH, null];
              case "N":
                return [st.NEW_COLUMN, null];
              case "X":
                return [st.WRAP_AT_DIMLINE, null];
              case "S": {
                this.inStackContext = !0;
                const f = this.parseStacking();
                return this.inStackContext = !1, f;
              }
              case "m":
              case "M":
                if (this.scanner.peek() === "+") {
                  this.scanner.consume(1);
                  const f = this.extractMifCode(this.mifCodeLength);
                  if (f) {
                    this.scanner.consume(f.length);
                    const p = this.mifDecoder(f);
                    return o ? [t, o] : [t, p];
                  }
                  this.scanner.consume(-1);
                }
                o += "\\M";
                continue;
              case "U":
                if (this.scanner.peek() === "+") {
                  this.scanner.consume(1);
                  const f = this.scanner.tail.match(/^[0-9A-Fa-f]{4,8}/);
                  if (f) {
                    const p = f[0];
                    this.scanner.consume(p.length);
                    const d = parseInt(p, 16);
                    let g = "";
                    try {
                      g = String.fromCodePoint(d);
                    } catch {
                      g = "▯";
                    }
                    return o ? [t, o] : [t, g];
                  }
                  this.scanner.consume(-1);
                }
                o += "\\U";
                continue;
              default:
                if (u)
                  try {
                    const f = this.parseProperties(u);
                    if (this.yieldPropertyCommands && f)
                      return [st.PROPERTIES_CHANGED, f];
                    continue;
                  } catch {
                    const f = this.scanner.tail.slice(l, this.scanner.currentIndex);
                    o += f;
                  }
            }
            continue;
          }
        if (h === "%" && this.scanner.peek(1) === "%") {
          const u = this.scanner.peek(2).toLowerCase(), f = ql[u];
          if (f) {
            if (this.scanner.consume(3), this.yieldPercentSymbols) {
              const p = this.buildPercentSymbolData(u, f);
              if (p)
                return o ? (s = st.PERCENT_SYMBOL, i = p, [t, o]) : [st.PERCENT_SYMBOL, p];
            }
            o += f;
            continue;
          } else {
            const p = [u, this.scanner.peek(3), this.scanner.peek(4)];
            if (p.every((d) => d >= "0" && d <= "9")) {
              const d = Number.parseInt(p.join(""), 10);
              if (this.scanner.consume(5), this.yieldPercentSymbols) {
                const g = {
                  kind: "numeric",
                  charCode: d,
                  char: String.fromCharCode(d)
                };
                return o ? (s = st.PERCENT_SYMBOL, i = g, [t, o]) : [st.PERCENT_SYMBOL, g];
              }
              o += String.fromCharCode(d);
            } else
              this.scanner.consume(3);
            continue;
          }
        }
        if (h === " ")
          return o ? (this.scanner.consume(1), s = e, [t, o]) : (this.scanner.consume(1), [e, null]);
        if (!c) {
          if (h === "{") {
            if (o)
              return [t, o];
            this.scanner.consume(1), this.pushCtx();
            continue;
          } else if (h === "}") {
            if (o)
              return [t, o];
            if (this.scanner.consume(1), this.yieldPropertyCommands) {
              const u = this.ctxStack.current;
              this.popCtx();
              const f = this.getPropertyChanges(u, this.ctxStack.current);
              if (Object.keys(f).length > 0)
                return [
                  st.PROPERTIES_CHANGED,
                  { command: void 0, changes: f, depth: this.ctxStack.depth }
                ];
            } else
              this.popCtx();
            continue;
          }
        }
        if (!this.inStackContext && h === "^") {
          const u = this.scanner.peek(1);
          if (u) {
            const f = u.charCodeAt(0);
            if (this.scanner.consume(2), f === 32)
              o += "^";
            else {
              if (f === 73)
                return o ? [t, o] : [st.TABULATOR, null];
              if (f === 74)
                return o ? [t, o] : [st.NEW_PARAGRAPH, null];
              if (f === 77)
                continue;
              o += "▯";
            }
            continue;
          }
        }
        this.scanner.consume(1), h.charCodeAt(0) >= 32 && (o += h);
      }
      return o ? [t, o] : [st.NONE, null];
    };
    for (; ; ) {
      const [o, c] = a.call(this);
      if (o) {
        if (yield new Vi(o, this.ctxStack.current.copy(), c), o === st.NEW_PARAGRAPH && this.resetParagraphParameters) {
          const h = this.ctxStack.current, l = r(h);
          this.yieldPropertyCommands && Object.keys(l).length > 0 && (yield new Vi(st.PROPERTIES_CHANGED, h.copy(), {
            command: void 0,
            changes: { paragraph: l },
            depth: this.ctxStack.depth
          }));
        }
        s && (yield new Vi(s, this.ctxStack.current.copy(), i ?? null), s = null, i = void 0);
      } else
        break;
    }
  }
}
class Gi {
  /**
   * Create a new text scanner
   * @param text - The text to scan
   */
  constructor(t) {
    this.text = t, this.textLen = t.length, this._index = 0;
  }
  /**
   * Get the current index in the text
   */
  get currentIndex() {
    return this._index;
  }
  /**
   * Check if the scanner has reached the end of the text
   */
  get isEmpty() {
    return this._index >= this.textLen;
  }
  /**
   * Check if there is more text to scan
   */
  get hasData() {
    return this._index < this.textLen;
  }
  /**
   * Get the next character and advance the index
   * @returns The next character, or empty string if at end
   */
  get() {
    if (this.isEmpty)
      return "";
    const t = this.text[this._index];
    return this._index++, t;
  }
  /**
   * Advance the index by the specified count
   * @param count - Number of characters to advance
   */
  consume(t = 1) {
    this._index = Math.max(0, Math.min(this._index + t, this.textLen));
  }
  /**
   * Look at a character without advancing the index
   * @param offset - Offset from current position
   * @returns The character at the offset position, or empty string if out of bounds
   */
  peek(t = 0) {
    const e = this._index + t;
    return e >= this.textLen || e < 0 ? "" : this.text[e];
  }
  /**
   * Find the next occurrence of a character
   * @param char - The character to find
   * @param escape - Whether to handle escaped characters
   * @returns Index of the character, or -1 if not found
   */
  find(t, e = !1) {
    let s = this._index;
    for (; s < this.textLen; ) {
      if (e && this.text[s] === "\\") {
        if (s + 1 < this.textLen) {
          if (this.text[s + 1] === t)
            return s + 1;
          s += 2;
          continue;
        }
        s++;
        continue;
      }
      if (this.text[s] === t)
        return s;
      s++;
    }
    return -1;
  }
  /**
   * Get the remaining text from the current position
   */
  get tail() {
    return this.text.slice(this._index);
  }
  /**
   * Check if the next character is a space
   */
  isNextSpace() {
    return this.peek() === " ";
  }
  /**
   * Consume spaces until a non-space character is found
   * @returns Number of spaces consumed
   */
  consumeSpaces() {
    let t = 0;
    for (; this.isNextSpace(); )
      this.consume(), t++;
    return t;
  }
}
class Ye {
  /**
   * Create a new MTextColor instance.
   * @param color The initial color: number for ACI, [r,g,b] for RGB, or null/undefined for default (ACI=256).
   */
  constructor(t) {
    this._aci = 256, this._rgbValue = null, Array.isArray(t) ? this.rgb = t : typeof t == "number" ? this.aci = t : this.aci = 256;
  }
  /**
   * Get the current ACI color value.
   * @returns The ACI color (0-256), or null if using RGB.
   */
  get aci() {
    return this._aci;
  }
  /**
   * Set the ACI color value. Setting this disables any RGB color.
   * @param value The ACI color (0-256), or null to unset.
   * @throws Error if value is out of range.
   */
  set aci(t) {
    if (t === null)
      this._aci = null;
    else if (t >= 0 && t <= 256)
      this._aci = t, this._rgbValue = null;
    else
      throw new Error("ACI not in range [0, 256]");
  }
  /**
   * Get the current RGB color as a tuple [r, g, b], or null if not set.
   * @returns The RGB color tuple, or null if using ACI.
   */
  get rgb() {
    if (this._rgbValue === null)
      return null;
    const t = this._rgbValue >> 16 & 255, e = this._rgbValue >> 8 & 255, s = this._rgbValue & 255;
    return [t, e, s];
  }
  /**
   * Set the RGB color. Setting this disables ACI color.
   * @param value The RGB color tuple [r, g, b], or null to use ACI.
   */
  set rgb(t) {
    if (t) {
      const [e, s, i] = t;
      this._rgbValue = (e & 255) << 16 | (s & 255) << 8 | i & 255, this._aci = null;
    } else
      this._rgbValue = null;
  }
  /**
   * Returns true if the color is set by RGB, false if by ACI.
   */
  get isRgb() {
    return this._rgbValue !== null;
  }
  /**
   * Returns true if the color is set by ACI, false if by RGB.
   */
  get isAci() {
    return this._rgbValue === null && this._aci !== null;
  }
  /**
   * Get or set the internal RGB value as a number (0xRRGGBB), or null if not set.
   * Setting this will switch to RGB mode and set ACI to null.
   */
  get rgbValue() {
    return this._rgbValue;
  }
  set rgbValue(t) {
    t === null ? this._rgbValue = null : (this._rgbValue = t & 16777215, this._aci = null);
  }
  /**
   * Returns a deep copy of this color.
   * @returns A new MTextColor instance with the same color state.
   */
  copy() {
    const t = new Ye();
    return t._aci = this._aci, t._rgbValue = this._rgbValue, t;
  }
  /**
   * Returns a plain object for serialization.
   * @returns An object with aci, rgb (tuple), and rgbValue (number or null).
   */
  toObject() {
    return { aci: this._aci, rgb: this.rgb, rgbValue: this._rgbValue };
  }
  /**
   * Convert the current color to a CSS hex color string (#rrggbb).
   * Returns null if the color is ACI-based and has no RGB value.
   */
  toCssColor() {
    return this._rgbValue !== null ? Yl(this._rgbValue) : null;
  }
  /**
   * Create an MTextColor from a CSS color string.
   * Supports #rgb, #rrggbb, rgb(...), rgba(...). Returns null if invalid or transparent.
   */
  static fromCssColor(t) {
    const e = Zl(t);
    if (e === null)
      return null;
    const s = new Ye();
    return s.rgbValue = e, s;
  }
  /**
   * Equality check for color.
   * @param other The other MTextColor to compare.
   * @returns True if both ACI and RGB values are equal.
   */
  equals(t) {
    return this._aci === t._aci && this._rgbValue === t._rgbValue;
  }
}
class bs {
  constructor() {
    this._stroke = 0, this.continueStroke = !1, this.color = new Ye(), this.align = je.BOTTOM, this.fontFace = { family: "", style: "Regular", weight: 400 }, this._capHeight = { value: 1, isRelative: !1 }, this._widthFactor = { value: 1, isRelative: !1 }, this._charTrackingFactor = { value: 1, isRelative: !1 }, this.oblique = 0, this.paragraph = {
      indent: 0,
      left: 0,
      right: 0,
      align: ht.DEFAULT,
      tabs: []
    };
  }
  /**
   * Get the capital letter height
   */
  get capHeight() {
    return this._capHeight;
  }
  /**
   * Set the capital letter height
   * @param value - Height value
   */
  set capHeight(t) {
    this._capHeight = {
      value: Math.abs(t.value),
      isRelative: t.isRelative
    };
  }
  /**
   * Get the character width factor
   */
  get widthFactor() {
    return this._widthFactor;
  }
  /**
   * Set the character width factor
   * @param value - Width factor value
   */
  set widthFactor(t) {
    this._widthFactor = {
      value: Math.abs(t.value),
      isRelative: t.isRelative
    };
  }
  /**
   * Get the character tracking factor
   */
  get charTrackingFactor() {
    return this._charTrackingFactor;
  }
  /**
   * Set the character tracking factor
   * @param value - Tracking factor value
   */
  set charTrackingFactor(t) {
    this._charTrackingFactor = {
      value: Math.abs(t.value),
      isRelative: t.isRelative
    };
  }
  /**
   * Get the ACI color value
   */
  get aci() {
    return this.color.aci;
  }
  /**
   * Set the ACI color value
   * @param value - ACI color value (0-256)
   * @throws Error if value is out of range
   */
  set aci(t) {
    this.color.aci = t;
  }
  /**
   * Get the RGB color value
   */
  get rgb() {
    return this.color.rgb;
  }
  /**
   * Set the RGB color value
   */
  set rgb(t) {
    this.color.rgb = t;
  }
  /**
   * Gets whether the current text should be rendered in italic style.
   * @returns {boolean} True if the font style is 'Italic', otherwise false.
   */
  get italic() {
    return this.fontFace.style === "Italic";
  }
  /**
   * Sets whether the current text should be rendered in italic style.
   * @param value - If true, sets the font style to 'Italic'; if false, sets it to 'Regular'.
   */
  set italic(t) {
    this.fontFace.style = t ? "Italic" : "Regular";
  }
  /**
   * Gets whether the current text should be rendered in bold style.
   * This is primarily used for mesh fonts and affects font selection.
   * @returns {boolean} True if the font weight is 700 or higher, otherwise false.
   */
  get bold() {
    return (this.fontFace.weight || 400) >= 700;
  }
  /**
   * Sets whether the current text should be rendered in bold style.
   * This is primarily used for mesh fonts and affects font selection.
   * @param value - If true, sets the font weight to 700; if false, sets it to 400.
   */
  set bold(t) {
    this.fontFace.weight = t ? 700 : 400;
  }
  /**
   * Get whether text is underlined
   */
  get underline() {
    return !!(this._stroke & Ge.UNDERLINE);
  }
  /**
   * Set whether text is underlined
   * @param value - Whether to underline
   */
  set underline(t) {
    this._setStrokeState(Ge.UNDERLINE, t);
  }
  /**
   * Get whether text has strike-through
   */
  get strikeThrough() {
    return !!(this._stroke & Ge.STRIKE_THROUGH);
  }
  /**
   * Set whether text has strike-through
   * @param value - Whether to strike through
   */
  set strikeThrough(t) {
    this._setStrokeState(Ge.STRIKE_THROUGH, t);
  }
  /**
   * Get whether text has overline
   */
  get overline() {
    return !!(this._stroke & Ge.OVERLINE);
  }
  /**
   * Set whether text has overline
   * @param value - Whether to overline
   */
  set overline(t) {
    this._setStrokeState(Ge.OVERLINE, t);
  }
  /**
   * Check if any stroke formatting is active
   */
  get hasAnyStroke() {
    return !!this._stroke;
  }
  /**
   * Set the state of a stroke type
   * @param stroke - The stroke type to set
   * @param state - Whether to enable or disable the stroke
   */
  _setStrokeState(t, e = !0) {
    e ? this._stroke |= t : this._stroke &= ~t;
  }
  /**
   * Create a copy of this context
   * @returns A new context with the same properties
   */
  copy() {
    const t = new bs();
    return t._stroke = this._stroke, t.continueStroke = this.continueStroke, t.color = this.color.copy(), t.align = this.align, t.fontFace = { ...this.fontFace }, t._capHeight = { ...this._capHeight }, t._widthFactor = { ...this._widthFactor }, t._charTrackingFactor = { ...this._charTrackingFactor }, t.oblique = this.oblique, t.paragraph = { ...this.paragraph }, t;
  }
}
class Vi {
  /**
   * Create a new MText token
   * @param type - The token type
   * @param ctx - The text context at this token
   * @param data - Optional token data
   */
  constructor(t, e, s) {
    this.type = t, this.ctx = e, this.data = s;
  }
}
/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
const rh = "172", Gr = 0, tu = 1, Na = 1, za = 100, Ha = 204, Ga = 205, Va = 3, eu = 0, ah = 300, Wa = 1e3, Ms = 1001, qa = 1002, nu = 1006, su = 1008, iu = 1009, ru = 1015, au = 1023, oh = "", ie = "srgb", ja = "srgb-linear", Xa = "linear", Wi = "srgb", xn = 7680, Ya = 519, $a = 35044, Os = 2e3, Za = 2001;
class Li {
  addEventListener(t, e) {
    this._listeners === void 0 && (this._listeners = {});
    const s = this._listeners;
    s[t] === void 0 && (s[t] = []), s[t].indexOf(e) === -1 && s[t].push(e);
  }
  hasEventListener(t, e) {
    if (this._listeners === void 0) return !1;
    const s = this._listeners;
    return s[t] !== void 0 && s[t].indexOf(e) !== -1;
  }
  removeEventListener(t, e) {
    if (this._listeners === void 0) return;
    const i = this._listeners[t];
    if (i !== void 0) {
      const r = i.indexOf(e);
      r !== -1 && i.splice(r, 1);
    }
  }
  dispatchEvent(t) {
    if (this._listeners === void 0) return;
    const s = this._listeners[t.type];
    if (s !== void 0) {
      t.target = this;
      const i = s.slice(0);
      for (let r = 0, a = i.length; r < a; r++)
        i[r].call(this, t);
      t.target = null;
    }
  }
}
const Ot = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "0a", "0b", "0c", "0d", "0e", "0f", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "1a", "1b", "1c", "1d", "1e", "1f", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "2a", "2b", "2c", "2d", "2e", "2f", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "3a", "3b", "3c", "3d", "3e", "3f", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "4a", "4b", "4c", "4d", "4e", "4f", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "5a", "5b", "5c", "5d", "5e", "5f", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "6a", "6b", "6c", "6d", "6e", "6f", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "7a", "7b", "7c", "7d", "7e", "7f", "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "8a", "8b", "8c", "8d", "8e", "8f", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "9a", "9b", "9c", "9d", "9e", "9f", "a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "aa", "ab", "ac", "ad", "ae", "af", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "ba", "bb", "bc", "bd", "be", "bf", "c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "ca", "cb", "cc", "cd", "ce", "cf", "d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "da", "db", "dc", "dd", "de", "df", "e0", "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "ea", "eb", "ec", "ed", "ee", "ef", "f0", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "fa", "fb", "fc", "fd", "fe", "ff"];
function Xn() {
  const n = Math.random() * 4294967295 | 0, t = Math.random() * 4294967295 | 0, e = Math.random() * 4294967295 | 0, s = Math.random() * 4294967295 | 0;
  return (Ot[n & 255] + Ot[n >> 8 & 255] + Ot[n >> 16 & 255] + Ot[n >> 24 & 255] + "-" + Ot[t & 255] + Ot[t >> 8 & 255] + "-" + Ot[t >> 16 & 15 | 64] + Ot[t >> 24 & 255] + "-" + Ot[e & 63 | 128] + Ot[e >> 8 & 255] + "-" + Ot[e >> 16 & 255] + Ot[e >> 24 & 255] + Ot[s & 255] + Ot[s >> 8 & 255] + Ot[s >> 16 & 255] + Ot[s >> 24 & 255]).toLowerCase();
}
function Z(n, t, e) {
  return Math.max(t, Math.min(e, n));
}
function ou(n, t) {
  return (n % t + t) % t;
}
function qi(n, t, e) {
  return (1 - e) * n + e * t;
}
function Zn(n, t) {
  switch (t.constructor) {
    case Float32Array:
      return n;
    case Uint32Array:
      return n / 4294967295;
    case Uint16Array:
      return n / 65535;
    case Uint8Array:
      return n / 255;
    case Int32Array:
      return Math.max(n / 2147483647, -1);
    case Int16Array:
      return Math.max(n / 32767, -1);
    case Int8Array:
      return Math.max(n / 127, -1);
    default:
      throw new Error("Invalid component type.");
  }
}
function Ht(n, t) {
  switch (t.constructor) {
    case Float32Array:
      return n;
    case Uint32Array:
      return Math.round(n * 4294967295);
    case Uint16Array:
      return Math.round(n * 65535);
    case Uint8Array:
      return Math.round(n * 255);
    case Int32Array:
      return Math.round(n * 2147483647);
    case Int16Array:
      return Math.round(n * 32767);
    case Int8Array:
      return Math.round(n * 127);
    default:
      throw new Error("Invalid component type.");
  }
}
class X {
  constructor(t = 0, e = 0) {
    X.prototype.isVector2 = !0, this.x = t, this.y = e;
  }
  get width() {
    return this.x;
  }
  set width(t) {
    this.x = t;
  }
  get height() {
    return this.y;
  }
  set height(t) {
    this.y = t;
  }
  set(t, e) {
    return this.x = t, this.y = e, this;
  }
  setScalar(t) {
    return this.x = t, this.y = t, this;
  }
  setX(t) {
    return this.x = t, this;
  }
  setY(t) {
    return this.y = t, this;
  }
  setComponent(t, e) {
    switch (t) {
      case 0:
        this.x = e;
        break;
      case 1:
        this.y = e;
        break;
      default:
        throw new Error("index is out of range: " + t);
    }
    return this;
  }
  getComponent(t) {
    switch (t) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      default:
        throw new Error("index is out of range: " + t);
    }
  }
  clone() {
    return new this.constructor(this.x, this.y);
  }
  copy(t) {
    return this.x = t.x, this.y = t.y, this;
  }
  add(t) {
    return this.x += t.x, this.y += t.y, this;
  }
  addScalar(t) {
    return this.x += t, this.y += t, this;
  }
  addVectors(t, e) {
    return this.x = t.x + e.x, this.y = t.y + e.y, this;
  }
  addScaledVector(t, e) {
    return this.x += t.x * e, this.y += t.y * e, this;
  }
  sub(t) {
    return this.x -= t.x, this.y -= t.y, this;
  }
  subScalar(t) {
    return this.x -= t, this.y -= t, this;
  }
  subVectors(t, e) {
    return this.x = t.x - e.x, this.y = t.y - e.y, this;
  }
  multiply(t) {
    return this.x *= t.x, this.y *= t.y, this;
  }
  multiplyScalar(t) {
    return this.x *= t, this.y *= t, this;
  }
  divide(t) {
    return this.x /= t.x, this.y /= t.y, this;
  }
  divideScalar(t) {
    return this.multiplyScalar(1 / t);
  }
  applyMatrix3(t) {
    const e = this.x, s = this.y, i = t.elements;
    return this.x = i[0] * e + i[3] * s + i[6], this.y = i[1] * e + i[4] * s + i[7], this;
  }
  min(t) {
    return this.x = Math.min(this.x, t.x), this.y = Math.min(this.y, t.y), this;
  }
  max(t) {
    return this.x = Math.max(this.x, t.x), this.y = Math.max(this.y, t.y), this;
  }
  clamp(t, e) {
    return this.x = Z(this.x, t.x, e.x), this.y = Z(this.y, t.y, e.y), this;
  }
  clampScalar(t, e) {
    return this.x = Z(this.x, t, e), this.y = Z(this.y, t, e), this;
  }
  clampLength(t, e) {
    const s = this.length();
    return this.divideScalar(s || 1).multiplyScalar(Z(s, t, e));
  }
  floor() {
    return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this;
  }
  ceil() {
    return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this;
  }
  round() {
    return this.x = Math.round(this.x), this.y = Math.round(this.y), this;
  }
  roundToZero() {
    return this.x = Math.trunc(this.x), this.y = Math.trunc(this.y), this;
  }
  negate() {
    return this.x = -this.x, this.y = -this.y, this;
  }
  dot(t) {
    return this.x * t.x + this.y * t.y;
  }
  cross(t) {
    return this.x * t.y - this.y * t.x;
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y);
  }
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  angle() {
    return Math.atan2(-this.y, -this.x) + Math.PI;
  }
  angleTo(t) {
    const e = Math.sqrt(this.lengthSq() * t.lengthSq());
    if (e === 0) return Math.PI / 2;
    const s = this.dot(t) / e;
    return Math.acos(Z(s, -1, 1));
  }
  distanceTo(t) {
    return Math.sqrt(this.distanceToSquared(t));
  }
  distanceToSquared(t) {
    const e = this.x - t.x, s = this.y - t.y;
    return e * e + s * s;
  }
  manhattanDistanceTo(t) {
    return Math.abs(this.x - t.x) + Math.abs(this.y - t.y);
  }
  setLength(t) {
    return this.normalize().multiplyScalar(t);
  }
  lerp(t, e) {
    return this.x += (t.x - this.x) * e, this.y += (t.y - this.y) * e, this;
  }
  lerpVectors(t, e, s) {
    return this.x = t.x + (e.x - t.x) * s, this.y = t.y + (e.y - t.y) * s, this;
  }
  equals(t) {
    return t.x === this.x && t.y === this.y;
  }
  fromArray(t, e = 0) {
    return this.x = t[e], this.y = t[e + 1], this;
  }
  toArray(t = [], e = 0) {
    return t[e] = this.x, t[e + 1] = this.y, t;
  }
  fromBufferAttribute(t, e) {
    return this.x = t.getX(e), this.y = t.getY(e), this;
  }
  rotateAround(t, e) {
    const s = Math.cos(e), i = Math.sin(e), r = this.x - t.x, a = this.y - t.y;
    return this.x = r * s - a * i + t.x, this.y = r * i + a * s + t.y, this;
  }
  random() {
    return this.x = Math.random(), this.y = Math.random(), this;
  }
  *[Symbol.iterator]() {
    yield this.x, yield this.y;
  }
}
class Qe {
  constructor(t, e, s, i, r, a, o, c, h) {
    Qe.prototype.isMatrix3 = !0, this.elements = [
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1
    ], t !== void 0 && this.set(t, e, s, i, r, a, o, c, h);
  }
  set(t, e, s, i, r, a, o, c, h) {
    const l = this.elements;
    return l[0] = t, l[1] = i, l[2] = o, l[3] = e, l[4] = r, l[5] = c, l[6] = s, l[7] = a, l[8] = h, this;
  }
  identity() {
    return this.set(
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1
    ), this;
  }
  copy(t) {
    const e = this.elements, s = t.elements;
    return e[0] = s[0], e[1] = s[1], e[2] = s[2], e[3] = s[3], e[4] = s[4], e[5] = s[5], e[6] = s[6], e[7] = s[7], e[8] = s[8], this;
  }
  extractBasis(t, e, s) {
    return t.setFromMatrix3Column(this, 0), e.setFromMatrix3Column(this, 1), s.setFromMatrix3Column(this, 2), this;
  }
  setFromMatrix4(t) {
    const e = t.elements;
    return this.set(
      e[0],
      e[4],
      e[8],
      e[1],
      e[5],
      e[9],
      e[2],
      e[6],
      e[10]
    ), this;
  }
  multiply(t) {
    return this.multiplyMatrices(this, t);
  }
  premultiply(t) {
    return this.multiplyMatrices(t, this);
  }
  multiplyMatrices(t, e) {
    const s = t.elements, i = e.elements, r = this.elements, a = s[0], o = s[3], c = s[6], h = s[1], l = s[4], u = s[7], f = s[2], p = s[5], d = s[8], g = i[0], x = i[3], b = i[6], v = i[1], S = i[4], w = i[7], F = i[2], O = i[5], M = i[8];
    return r[0] = a * g + o * v + c * F, r[3] = a * x + o * S + c * O, r[6] = a * b + o * w + c * M, r[1] = h * g + l * v + u * F, r[4] = h * x + l * S + u * O, r[7] = h * b + l * w + u * M, r[2] = f * g + p * v + d * F, r[5] = f * x + p * S + d * O, r[8] = f * b + p * w + d * M, this;
  }
  multiplyScalar(t) {
    const e = this.elements;
    return e[0] *= t, e[3] *= t, e[6] *= t, e[1] *= t, e[4] *= t, e[7] *= t, e[2] *= t, e[5] *= t, e[8] *= t, this;
  }
  determinant() {
    const t = this.elements, e = t[0], s = t[1], i = t[2], r = t[3], a = t[4], o = t[5], c = t[6], h = t[7], l = t[8];
    return e * a * l - e * o * h - s * r * l + s * o * c + i * r * h - i * a * c;
  }
  invert() {
    const t = this.elements, e = t[0], s = t[1], i = t[2], r = t[3], a = t[4], o = t[5], c = t[6], h = t[7], l = t[8], u = l * a - o * h, f = o * c - l * r, p = h * r - a * c, d = e * u + s * f + i * p;
    if (d === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
    const g = 1 / d;
    return t[0] = u * g, t[1] = (i * h - l * s) * g, t[2] = (o * s - i * a) * g, t[3] = f * g, t[4] = (l * e - i * c) * g, t[5] = (i * r - o * e) * g, t[6] = p * g, t[7] = (s * c - h * e) * g, t[8] = (a * e - s * r) * g, this;
  }
  transpose() {
    let t;
    const e = this.elements;
    return t = e[1], e[1] = e[3], e[3] = t, t = e[2], e[2] = e[6], e[6] = t, t = e[5], e[5] = e[7], e[7] = t, this;
  }
  getNormalMatrix(t) {
    return this.setFromMatrix4(t).invert().transpose();
  }
  transposeIntoArray(t) {
    const e = this.elements;
    return t[0] = e[0], t[1] = e[3], t[2] = e[6], t[3] = e[1], t[4] = e[4], t[5] = e[7], t[6] = e[2], t[7] = e[5], t[8] = e[8], this;
  }
  setUvTransform(t, e, s, i, r, a, o) {
    const c = Math.cos(r), h = Math.sin(r);
    return this.set(
      s * c,
      s * h,
      -s * (c * a + h * o) + a + t,
      -i * h,
      i * c,
      -i * (-h * a + c * o) + o + e,
      0,
      0,
      1
    ), this;
  }
  //
  scale(t, e) {
    return this.premultiply(ji.makeScale(t, e)), this;
  }
  rotate(t) {
    return this.premultiply(ji.makeRotation(-t)), this;
  }
  translate(t, e) {
    return this.premultiply(ji.makeTranslation(t, e)), this;
  }
  // for 2D Transforms
  makeTranslation(t, e) {
    return t.isVector2 ? this.set(
      1,
      0,
      t.x,
      0,
      1,
      t.y,
      0,
      0,
      1
    ) : this.set(
      1,
      0,
      t,
      0,
      1,
      e,
      0,
      0,
      1
    ), this;
  }
  makeRotation(t) {
    const e = Math.cos(t), s = Math.sin(t);
    return this.set(
      e,
      -s,
      0,
      s,
      e,
      0,
      0,
      0,
      1
    ), this;
  }
  makeScale(t, e) {
    return this.set(
      t,
      0,
      0,
      0,
      e,
      0,
      0,
      0,
      1
    ), this;
  }
  //
  equals(t) {
    const e = this.elements, s = t.elements;
    for (let i = 0; i < 9; i++)
      if (e[i] !== s[i]) return !1;
    return !0;
  }
  fromArray(t, e = 0) {
    for (let s = 0; s < 9; s++)
      this.elements[s] = t[s + e];
    return this;
  }
  toArray(t = [], e = 0) {
    const s = this.elements;
    return t[e] = s[0], t[e + 1] = s[1], t[e + 2] = s[2], t[e + 3] = s[3], t[e + 4] = s[4], t[e + 5] = s[5], t[e + 6] = s[6], t[e + 7] = s[7], t[e + 8] = s[8], t;
  }
  clone() {
    return new this.constructor().fromArray(this.elements);
  }
}
const ji = /* @__PURE__ */ new Qe();
function cu(n) {
  for (let t = n.length - 1; t >= 0; --t)
    if (n[t] >= 65535) return !0;
  return !1;
}
function Ja(n) {
  return document.createElementNS("http://www.w3.org/1999/xhtml", n);
}
const Ka = /* @__PURE__ */ new Qe().set(
  0.4123908,
  0.3575843,
  0.1804808,
  0.212639,
  0.7151687,
  0.0721923,
  0.0193308,
  0.1191948,
  0.9505322
), Qa = /* @__PURE__ */ new Qe().set(
  3.2409699,
  -1.5373832,
  -0.4986108,
  -0.9692436,
  1.8759675,
  0.0415551,
  0.0556301,
  -0.203977,
  1.0569715
);
function hu() {
  const n = {
    enabled: !0,
    workingColorSpace: ja,
    /**
     * Implementations of supported color spaces.
     *
     * Required:
     *	- primaries: chromaticity coordinates [ rx ry gx gy bx by ]
     *	- whitePoint: reference white [ x y ]
     *	- transfer: transfer function (pre-defined)
     *	- toXYZ: Matrix3 RGB to XYZ transform
     *	- fromXYZ: Matrix3 XYZ to RGB transform
     *	- luminanceCoefficients: RGB luminance coefficients
     *
     * Optional:
     *  - outputColorSpaceConfig: { drawingBufferColorSpace: ColorSpace }
     *  - workingColorSpaceConfig: { unpackColorSpace: ColorSpace }
     *
     * Reference:
     * - https://www.russellcottrell.com/photo/matrixCalculator.htm
     */
    spaces: {},
    convert: function(i, r, a) {
      return this.enabled === !1 || r === a || !r || !a || (this.spaces[r].transfer === Wi && (i.r = Le(i.r), i.g = Le(i.g), i.b = Le(i.b)), this.spaces[r].primaries !== this.spaces[a].primaries && (i.applyMatrix3(this.spaces[r].toXYZ), i.applyMatrix3(this.spaces[a].fromXYZ)), this.spaces[a].transfer === Wi && (i.r = Bn(i.r), i.g = Bn(i.g), i.b = Bn(i.b))), i;
    },
    fromWorkingColorSpace: function(i, r) {
      return this.convert(i, this.workingColorSpace, r);
    },
    toWorkingColorSpace: function(i, r) {
      return this.convert(i, r, this.workingColorSpace);
    },
    getPrimaries: function(i) {
      return this.spaces[i].primaries;
    },
    getTransfer: function(i) {
      return i === oh ? Xa : this.spaces[i].transfer;
    },
    getLuminanceCoefficients: function(i, r = this.workingColorSpace) {
      return i.fromArray(this.spaces[r].luminanceCoefficients);
    },
    define: function(i) {
      Object.assign(this.spaces, i);
    },
    // Internal APIs
    _getMatrix: function(i, r, a) {
      return i.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ);
    },
    _getDrawingBufferColorSpace: function(i) {
      return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace;
    },
    _getUnpackColorSpace: function(i = this.workingColorSpace) {
      return this.spaces[i].workingColorSpaceConfig.unpackColorSpace;
    }
  }, t = [0.64, 0.33, 0.3, 0.6, 0.15, 0.06], e = [0.2126, 0.7152, 0.0722], s = [0.3127, 0.329];
  return n.define({
    [ja]: {
      primaries: t,
      whitePoint: s,
      transfer: Xa,
      toXYZ: Ka,
      fromXYZ: Qa,
      luminanceCoefficients: e,
      workingColorSpaceConfig: { unpackColorSpace: ie },
      outputColorSpaceConfig: { drawingBufferColorSpace: ie }
    },
    [ie]: {
      primaries: t,
      whitePoint: s,
      transfer: Wi,
      toXYZ: Ka,
      fromXYZ: Qa,
      luminanceCoefficients: e,
      outputColorSpaceConfig: { drawingBufferColorSpace: ie }
    }
  }), n;
}
const te = /* @__PURE__ */ hu();
function Le(n) {
  return n < 0.04045 ? n * 0.0773993808 : Math.pow(n * 0.9478672986 + 0.0521327014, 2.4);
}
function Bn(n) {
  return n < 31308e-7 ? n * 12.92 : 1.055 * Math.pow(n, 0.41666) - 0.055;
}
let bn;
class lu {
  static getDataURL(t) {
    if (/^data:/i.test(t.src) || typeof HTMLCanvasElement > "u")
      return t.src;
    let e;
    if (t instanceof HTMLCanvasElement)
      e = t;
    else {
      bn === void 0 && (bn = Ja("canvas")), bn.width = t.width, bn.height = t.height;
      const s = bn.getContext("2d");
      t instanceof ImageData ? s.putImageData(t, 0, 0) : s.drawImage(t, 0, 0, t.width, t.height), e = bn;
    }
    return e.width > 2048 || e.height > 2048 ? (console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons", t), e.toDataURL("image/jpeg", 0.6)) : e.toDataURL("image/png");
  }
  static sRGBToLinear(t) {
    if (typeof HTMLImageElement < "u" && t instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && t instanceof HTMLCanvasElement || typeof ImageBitmap < "u" && t instanceof ImageBitmap) {
      const e = Ja("canvas");
      e.width = t.width, e.height = t.height;
      const s = e.getContext("2d");
      s.drawImage(t, 0, 0, t.width, t.height);
      const i = s.getImageData(0, 0, t.width, t.height), r = i.data;
      for (let a = 0; a < r.length; a++)
        r[a] = Le(r[a] / 255) * 255;
      return s.putImageData(i, 0, 0), e;
    } else if (t.data) {
      const e = t.data.slice(0);
      for (let s = 0; s < e.length; s++)
        e instanceof Uint8Array || e instanceof Uint8ClampedArray ? e[s] = Math.floor(Le(e[s] / 255) * 255) : e[s] = Le(e[s]);
      return {
        data: e,
        width: t.width,
        height: t.height
      };
    } else
      return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."), t;
  }
}
let uu = 0;
class fu {
  constructor(t = null) {
    this.isSource = !0, Object.defineProperty(this, "id", { value: uu++ }), this.uuid = Xn(), this.data = t, this.dataReady = !0, this.version = 0;
  }
  set needsUpdate(t) {
    t === !0 && this.version++;
  }
  toJSON(t) {
    const e = t === void 0 || typeof t == "string";
    if (!e && t.images[this.uuid] !== void 0)
      return t.images[this.uuid];
    const s = {
      uuid: this.uuid,
      url: ""
    }, i = this.data;
    if (i !== null) {
      let r;
      if (Array.isArray(i)) {
        r = [];
        for (let a = 0, o = i.length; a < o; a++)
          i[a].isDataTexture ? r.push(Xi(i[a].image)) : r.push(Xi(i[a]));
      } else
        r = Xi(i);
      s.url = r;
    }
    return e || (t.images[this.uuid] = s), s;
  }
}
function Xi(n) {
  return typeof HTMLImageElement < "u" && n instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && n instanceof HTMLCanvasElement || typeof ImageBitmap < "u" && n instanceof ImageBitmap ? lu.getDataURL(n) : n.data ? {
    data: Array.from(n.data),
    width: n.width,
    height: n.height,
    type: n.data.constructor.name
  } : (console.warn("THREE.Texture: Unable to serialize Texture."), {});
}
let pu = 0;
class hn extends Li {
  constructor(t = hn.DEFAULT_IMAGE, e = hn.DEFAULT_MAPPING, s = Ms, i = Ms, r = nu, a = su, o = au, c = iu, h = hn.DEFAULT_ANISOTROPY, l = oh) {
    super(), this.isTexture = !0, Object.defineProperty(this, "id", { value: pu++ }), this.uuid = Xn(), this.name = "", this.source = new fu(t), this.mipmaps = [], this.mapping = e, this.channel = 0, this.wrapS = s, this.wrapT = i, this.magFilter = r, this.minFilter = a, this.anisotropy = h, this.format = o, this.internalFormat = null, this.type = c, this.offset = new X(0, 0), this.repeat = new X(1, 1), this.center = new X(0, 0), this.rotation = 0, this.matrixAutoUpdate = !0, this.matrix = new Qe(), this.generateMipmaps = !0, this.premultiplyAlpha = !1, this.flipY = !0, this.unpackAlignment = 4, this.colorSpace = l, this.userData = {}, this.version = 0, this.onUpdate = null, this.renderTarget = null, this.isRenderTargetTexture = !1, this.pmremVersion = 0;
  }
  get image() {
    return this.source.data;
  }
  set image(t = null) {
    this.source.data = t;
  }
  updateMatrix() {
    this.matrix.setUvTransform(this.offset.x, this.offset.y, this.repeat.x, this.repeat.y, this.rotation, this.center.x, this.center.y);
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(t) {
    return this.name = t.name, this.source = t.source, this.mipmaps = t.mipmaps.slice(0), this.mapping = t.mapping, this.channel = t.channel, this.wrapS = t.wrapS, this.wrapT = t.wrapT, this.magFilter = t.magFilter, this.minFilter = t.minFilter, this.anisotropy = t.anisotropy, this.format = t.format, this.internalFormat = t.internalFormat, this.type = t.type, this.offset.copy(t.offset), this.repeat.copy(t.repeat), this.center.copy(t.center), this.rotation = t.rotation, this.matrixAutoUpdate = t.matrixAutoUpdate, this.matrix.copy(t.matrix), this.generateMipmaps = t.generateMipmaps, this.premultiplyAlpha = t.premultiplyAlpha, this.flipY = t.flipY, this.unpackAlignment = t.unpackAlignment, this.colorSpace = t.colorSpace, this.renderTarget = t.renderTarget, this.isRenderTargetTexture = t.isRenderTargetTexture, this.userData = JSON.parse(JSON.stringify(t.userData)), this.needsUpdate = !0, this;
  }
  toJSON(t) {
    const e = t === void 0 || typeof t == "string";
    if (!e && t.textures[this.uuid] !== void 0)
      return t.textures[this.uuid];
    const s = {
      metadata: {
        version: 4.6,
        type: "Texture",
        generator: "Texture.toJSON"
      },
      uuid: this.uuid,
      name: this.name,
      image: this.source.toJSON(t).uuid,
      mapping: this.mapping,
      channel: this.channel,
      repeat: [this.repeat.x, this.repeat.y],
      offset: [this.offset.x, this.offset.y],
      center: [this.center.x, this.center.y],
      rotation: this.rotation,
      wrap: [this.wrapS, this.wrapT],
      format: this.format,
      internalFormat: this.internalFormat,
      type: this.type,
      colorSpace: this.colorSpace,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      anisotropy: this.anisotropy,
      flipY: this.flipY,
      generateMipmaps: this.generateMipmaps,
      premultiplyAlpha: this.premultiplyAlpha,
      unpackAlignment: this.unpackAlignment
    };
    return Object.keys(this.userData).length > 0 && (s.userData = this.userData), e || (t.textures[this.uuid] = s), s;
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
  transformUv(t) {
    if (this.mapping !== ah) return t;
    if (t.applyMatrix3(this.matrix), t.x < 0 || t.x > 1)
      switch (this.wrapS) {
        case Wa:
          t.x = t.x - Math.floor(t.x);
          break;
        case Ms:
          t.x = t.x < 0 ? 0 : 1;
          break;
        case qa:
          Math.abs(Math.floor(t.x) % 2) === 1 ? t.x = Math.ceil(t.x) - t.x : t.x = t.x - Math.floor(t.x);
          break;
      }
    if (t.y < 0 || t.y > 1)
      switch (this.wrapT) {
        case Wa:
          t.y = t.y - Math.floor(t.y);
          break;
        case Ms:
          t.y = t.y < 0 ? 0 : 1;
          break;
        case qa:
          Math.abs(Math.floor(t.y) % 2) === 1 ? t.y = Math.ceil(t.y) - t.y : t.y = t.y - Math.floor(t.y);
          break;
      }
    return this.flipY && (t.y = 1 - t.y), t;
  }
  set needsUpdate(t) {
    t === !0 && (this.version++, this.source.needsUpdate = !0);
  }
  set needsPMREMUpdate(t) {
    t === !0 && this.pmremVersion++;
  }
}
hn.DEFAULT_IMAGE = null;
hn.DEFAULT_MAPPING = ah;
hn.DEFAULT_ANISOTROPY = 1;
class vs {
  constructor(t = 0, e = 0, s = 0, i = 1) {
    vs.prototype.isVector4 = !0, this.x = t, this.y = e, this.z = s, this.w = i;
  }
  get width() {
    return this.z;
  }
  set width(t) {
    this.z = t;
  }
  get height() {
    return this.w;
  }
  set height(t) {
    this.w = t;
  }
  set(t, e, s, i) {
    return this.x = t, this.y = e, this.z = s, this.w = i, this;
  }
  setScalar(t) {
    return this.x = t, this.y = t, this.z = t, this.w = t, this;
  }
  setX(t) {
    return this.x = t, this;
  }
  setY(t) {
    return this.y = t, this;
  }
  setZ(t) {
    return this.z = t, this;
  }
  setW(t) {
    return this.w = t, this;
  }
  setComponent(t, e) {
    switch (t) {
      case 0:
        this.x = e;
        break;
      case 1:
        this.y = e;
        break;
      case 2:
        this.z = e;
        break;
      case 3:
        this.w = e;
        break;
      default:
        throw new Error("index is out of range: " + t);
    }
    return this;
  }
  getComponent(t) {
    switch (t) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      case 3:
        return this.w;
      default:
        throw new Error("index is out of range: " + t);
    }
  }
  clone() {
    return new this.constructor(this.x, this.y, this.z, this.w);
  }
  copy(t) {
    return this.x = t.x, this.y = t.y, this.z = t.z, this.w = t.w !== void 0 ? t.w : 1, this;
  }
  add(t) {
    return this.x += t.x, this.y += t.y, this.z += t.z, this.w += t.w, this;
  }
  addScalar(t) {
    return this.x += t, this.y += t, this.z += t, this.w += t, this;
  }
  addVectors(t, e) {
    return this.x = t.x + e.x, this.y = t.y + e.y, this.z = t.z + e.z, this.w = t.w + e.w, this;
  }
  addScaledVector(t, e) {
    return this.x += t.x * e, this.y += t.y * e, this.z += t.z * e, this.w += t.w * e, this;
  }
  sub(t) {
    return this.x -= t.x, this.y -= t.y, this.z -= t.z, this.w -= t.w, this;
  }
  subScalar(t) {
    return this.x -= t, this.y -= t, this.z -= t, this.w -= t, this;
  }
  subVectors(t, e) {
    return this.x = t.x - e.x, this.y = t.y - e.y, this.z = t.z - e.z, this.w = t.w - e.w, this;
  }
  multiply(t) {
    return this.x *= t.x, this.y *= t.y, this.z *= t.z, this.w *= t.w, this;
  }
  multiplyScalar(t) {
    return this.x *= t, this.y *= t, this.z *= t, this.w *= t, this;
  }
  applyMatrix4(t) {
    const e = this.x, s = this.y, i = this.z, r = this.w, a = t.elements;
    return this.x = a[0] * e + a[4] * s + a[8] * i + a[12] * r, this.y = a[1] * e + a[5] * s + a[9] * i + a[13] * r, this.z = a[2] * e + a[6] * s + a[10] * i + a[14] * r, this.w = a[3] * e + a[7] * s + a[11] * i + a[15] * r, this;
  }
  divide(t) {
    return this.x /= t.x, this.y /= t.y, this.z /= t.z, this.w /= t.w, this;
  }
  divideScalar(t) {
    return this.multiplyScalar(1 / t);
  }
  setAxisAngleFromQuaternion(t) {
    this.w = 2 * Math.acos(t.w);
    const e = Math.sqrt(1 - t.w * t.w);
    return e < 1e-4 ? (this.x = 1, this.y = 0, this.z = 0) : (this.x = t.x / e, this.y = t.y / e, this.z = t.z / e), this;
  }
  setAxisAngleFromRotationMatrix(t) {
    let e, s, i, r;
    const c = t.elements, h = c[0], l = c[4], u = c[8], f = c[1], p = c[5], d = c[9], g = c[2], x = c[6], b = c[10];
    if (Math.abs(l - f) < 0.01 && Math.abs(u - g) < 0.01 && Math.abs(d - x) < 0.01) {
      if (Math.abs(l + f) < 0.1 && Math.abs(u + g) < 0.1 && Math.abs(d + x) < 0.1 && Math.abs(h + p + b - 3) < 0.1)
        return this.set(1, 0, 0, 0), this;
      e = Math.PI;
      const S = (h + 1) / 2, w = (p + 1) / 2, F = (b + 1) / 2, O = (l + f) / 4, M = (u + g) / 4, I = (d + x) / 4;
      return S > w && S > F ? S < 0.01 ? (s = 0, i = 0.707106781, r = 0.707106781) : (s = Math.sqrt(S), i = O / s, r = M / s) : w > F ? w < 0.01 ? (s = 0.707106781, i = 0, r = 0.707106781) : (i = Math.sqrt(w), s = O / i, r = I / i) : F < 0.01 ? (s = 0.707106781, i = 0.707106781, r = 0) : (r = Math.sqrt(F), s = M / r, i = I / r), this.set(s, i, r, e), this;
    }
    let v = Math.sqrt((x - d) * (x - d) + (u - g) * (u - g) + (f - l) * (f - l));
    return Math.abs(v) < 1e-3 && (v = 1), this.x = (x - d) / v, this.y = (u - g) / v, this.z = (f - l) / v, this.w = Math.acos((h + p + b - 1) / 2), this;
  }
  setFromMatrixPosition(t) {
    const e = t.elements;
    return this.x = e[12], this.y = e[13], this.z = e[14], this.w = e[15], this;
  }
  min(t) {
    return this.x = Math.min(this.x, t.x), this.y = Math.min(this.y, t.y), this.z = Math.min(this.z, t.z), this.w = Math.min(this.w, t.w), this;
  }
  max(t) {
    return this.x = Math.max(this.x, t.x), this.y = Math.max(this.y, t.y), this.z = Math.max(this.z, t.z), this.w = Math.max(this.w, t.w), this;
  }
  clamp(t, e) {
    return this.x = Z(this.x, t.x, e.x), this.y = Z(this.y, t.y, e.y), this.z = Z(this.z, t.z, e.z), this.w = Z(this.w, t.w, e.w), this;
  }
  clampScalar(t, e) {
    return this.x = Z(this.x, t, e), this.y = Z(this.y, t, e), this.z = Z(this.z, t, e), this.w = Z(this.w, t, e), this;
  }
  clampLength(t, e) {
    const s = this.length();
    return this.divideScalar(s || 1).multiplyScalar(Z(s, t, e));
  }
  floor() {
    return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this.z = Math.floor(this.z), this.w = Math.floor(this.w), this;
  }
  ceil() {
    return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this.z = Math.ceil(this.z), this.w = Math.ceil(this.w), this;
  }
  round() {
    return this.x = Math.round(this.x), this.y = Math.round(this.y), this.z = Math.round(this.z), this.w = Math.round(this.w), this;
  }
  roundToZero() {
    return this.x = Math.trunc(this.x), this.y = Math.trunc(this.y), this.z = Math.trunc(this.z), this.w = Math.trunc(this.w), this;
  }
  negate() {
    return this.x = -this.x, this.y = -this.y, this.z = -this.z, this.w = -this.w, this;
  }
  dot(t) {
    return this.x * t.x + this.y * t.y + this.z * t.z + this.w * t.w;
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w);
  }
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  setLength(t) {
    return this.normalize().multiplyScalar(t);
  }
  lerp(t, e) {
    return this.x += (t.x - this.x) * e, this.y += (t.y - this.y) * e, this.z += (t.z - this.z) * e, this.w += (t.w - this.w) * e, this;
  }
  lerpVectors(t, e, s) {
    return this.x = t.x + (e.x - t.x) * s, this.y = t.y + (e.y - t.y) * s, this.z = t.z + (e.z - t.z) * s, this.w = t.w + (e.w - t.w) * s, this;
  }
  equals(t) {
    return t.x === this.x && t.y === this.y && t.z === this.z && t.w === this.w;
  }
  fromArray(t, e = 0) {
    return this.x = t[e], this.y = t[e + 1], this.z = t[e + 2], this.w = t[e + 3], this;
  }
  toArray(t = [], e = 0) {
    return t[e] = this.x, t[e + 1] = this.y, t[e + 2] = this.z, t[e + 3] = this.w, t;
  }
  fromBufferAttribute(t, e) {
    return this.x = t.getX(e), this.y = t.getY(e), this.z = t.getZ(e), this.w = t.getW(e), this;
  }
  random() {
    return this.x = Math.random(), this.y = Math.random(), this.z = Math.random(), this.w = Math.random(), this;
  }
  *[Symbol.iterator]() {
    yield this.x, yield this.y, yield this.z, yield this.w;
  }
}
class dn {
  constructor(t = 0, e = 0, s = 0, i = 1) {
    this.isQuaternion = !0, this._x = t, this._y = e, this._z = s, this._w = i;
  }
  static slerpFlat(t, e, s, i, r, a, o) {
    let c = s[i + 0], h = s[i + 1], l = s[i + 2], u = s[i + 3];
    const f = r[a + 0], p = r[a + 1], d = r[a + 2], g = r[a + 3];
    if (o === 0) {
      t[e + 0] = c, t[e + 1] = h, t[e + 2] = l, t[e + 3] = u;
      return;
    }
    if (o === 1) {
      t[e + 0] = f, t[e + 1] = p, t[e + 2] = d, t[e + 3] = g;
      return;
    }
    if (u !== g || c !== f || h !== p || l !== d) {
      let x = 1 - o;
      const b = c * f + h * p + l * d + u * g, v = b >= 0 ? 1 : -1, S = 1 - b * b;
      if (S > Number.EPSILON) {
        const F = Math.sqrt(S), O = Math.atan2(F, b * v);
        x = Math.sin(x * O) / F, o = Math.sin(o * O) / F;
      }
      const w = o * v;
      if (c = c * x + f * w, h = h * x + p * w, l = l * x + d * w, u = u * x + g * w, x === 1 - o) {
        const F = 1 / Math.sqrt(c * c + h * h + l * l + u * u);
        c *= F, h *= F, l *= F, u *= F;
      }
    }
    t[e] = c, t[e + 1] = h, t[e + 2] = l, t[e + 3] = u;
  }
  static multiplyQuaternionsFlat(t, e, s, i, r, a) {
    const o = s[i], c = s[i + 1], h = s[i + 2], l = s[i + 3], u = r[a], f = r[a + 1], p = r[a + 2], d = r[a + 3];
    return t[e] = o * d + l * u + c * p - h * f, t[e + 1] = c * d + l * f + h * u - o * p, t[e + 2] = h * d + l * p + o * f - c * u, t[e + 3] = l * d - o * u - c * f - h * p, t;
  }
  get x() {
    return this._x;
  }
  set x(t) {
    this._x = t, this._onChangeCallback();
  }
  get y() {
    return this._y;
  }
  set y(t) {
    this._y = t, this._onChangeCallback();
  }
  get z() {
    return this._z;
  }
  set z(t) {
    this._z = t, this._onChangeCallback();
  }
  get w() {
    return this._w;
  }
  set w(t) {
    this._w = t, this._onChangeCallback();
  }
  set(t, e, s, i) {
    return this._x = t, this._y = e, this._z = s, this._w = i, this._onChangeCallback(), this;
  }
  clone() {
    return new this.constructor(this._x, this._y, this._z, this._w);
  }
  copy(t) {
    return this._x = t.x, this._y = t.y, this._z = t.z, this._w = t.w, this._onChangeCallback(), this;
  }
  setFromEuler(t, e = !0) {
    const s = t._x, i = t._y, r = t._z, a = t._order, o = Math.cos, c = Math.sin, h = o(s / 2), l = o(i / 2), u = o(r / 2), f = c(s / 2), p = c(i / 2), d = c(r / 2);
    switch (a) {
      case "XYZ":
        this._x = f * l * u + h * p * d, this._y = h * p * u - f * l * d, this._z = h * l * d + f * p * u, this._w = h * l * u - f * p * d;
        break;
      case "YXZ":
        this._x = f * l * u + h * p * d, this._y = h * p * u - f * l * d, this._z = h * l * d - f * p * u, this._w = h * l * u + f * p * d;
        break;
      case "ZXY":
        this._x = f * l * u - h * p * d, this._y = h * p * u + f * l * d, this._z = h * l * d + f * p * u, this._w = h * l * u - f * p * d;
        break;
      case "ZYX":
        this._x = f * l * u - h * p * d, this._y = h * p * u + f * l * d, this._z = h * l * d - f * p * u, this._w = h * l * u + f * p * d;
        break;
      case "YZX":
        this._x = f * l * u + h * p * d, this._y = h * p * u + f * l * d, this._z = h * l * d - f * p * u, this._w = h * l * u - f * p * d;
        break;
      case "XZY":
        this._x = f * l * u - h * p * d, this._y = h * p * u - f * l * d, this._z = h * l * d + f * p * u, this._w = h * l * u + f * p * d;
        break;
      default:
        console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: " + a);
    }
    return e === !0 && this._onChangeCallback(), this;
  }
  setFromAxisAngle(t, e) {
    const s = e / 2, i = Math.sin(s);
    return this._x = t.x * i, this._y = t.y * i, this._z = t.z * i, this._w = Math.cos(s), this._onChangeCallback(), this;
  }
  setFromRotationMatrix(t) {
    const e = t.elements, s = e[0], i = e[4], r = e[8], a = e[1], o = e[5], c = e[9], h = e[2], l = e[6], u = e[10], f = s + o + u;
    if (f > 0) {
      const p = 0.5 / Math.sqrt(f + 1);
      this._w = 0.25 / p, this._x = (l - c) * p, this._y = (r - h) * p, this._z = (a - i) * p;
    } else if (s > o && s > u) {
      const p = 2 * Math.sqrt(1 + s - o - u);
      this._w = (l - c) / p, this._x = 0.25 * p, this._y = (i + a) / p, this._z = (r + h) / p;
    } else if (o > u) {
      const p = 2 * Math.sqrt(1 + o - s - u);
      this._w = (r - h) / p, this._x = (i + a) / p, this._y = 0.25 * p, this._z = (c + l) / p;
    } else {
      const p = 2 * Math.sqrt(1 + u - s - o);
      this._w = (a - i) / p, this._x = (r + h) / p, this._y = (c + l) / p, this._z = 0.25 * p;
    }
    return this._onChangeCallback(), this;
  }
  setFromUnitVectors(t, e) {
    let s = t.dot(e) + 1;
    return s < Number.EPSILON ? (s = 0, Math.abs(t.x) > Math.abs(t.z) ? (this._x = -t.y, this._y = t.x, this._z = 0, this._w = s) : (this._x = 0, this._y = -t.z, this._z = t.y, this._w = s)) : (this._x = t.y * e.z - t.z * e.y, this._y = t.z * e.x - t.x * e.z, this._z = t.x * e.y - t.y * e.x, this._w = s), this.normalize();
  }
  angleTo(t) {
    return 2 * Math.acos(Math.abs(Z(this.dot(t), -1, 1)));
  }
  rotateTowards(t, e) {
    const s = this.angleTo(t);
    if (s === 0) return this;
    const i = Math.min(1, e / s);
    return this.slerp(t, i), this;
  }
  identity() {
    return this.set(0, 0, 0, 1);
  }
  invert() {
    return this.conjugate();
  }
  conjugate() {
    return this._x *= -1, this._y *= -1, this._z *= -1, this._onChangeCallback(), this;
  }
  dot(t) {
    return this._x * t._x + this._y * t._y + this._z * t._z + this._w * t._w;
  }
  lengthSq() {
    return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;
  }
  length() {
    return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w);
  }
  normalize() {
    let t = this.length();
    return t === 0 ? (this._x = 0, this._y = 0, this._z = 0, this._w = 1) : (t = 1 / t, this._x = this._x * t, this._y = this._y * t, this._z = this._z * t, this._w = this._w * t), this._onChangeCallback(), this;
  }
  multiply(t) {
    return this.multiplyQuaternions(this, t);
  }
  premultiply(t) {
    return this.multiplyQuaternions(t, this);
  }
  multiplyQuaternions(t, e) {
    const s = t._x, i = t._y, r = t._z, a = t._w, o = e._x, c = e._y, h = e._z, l = e._w;
    return this._x = s * l + a * o + i * h - r * c, this._y = i * l + a * c + r * o - s * h, this._z = r * l + a * h + s * c - i * o, this._w = a * l - s * o - i * c - r * h, this._onChangeCallback(), this;
  }
  slerp(t, e) {
    if (e === 0) return this;
    if (e === 1) return this.copy(t);
    const s = this._x, i = this._y, r = this._z, a = this._w;
    let o = a * t._w + s * t._x + i * t._y + r * t._z;
    if (o < 0 ? (this._w = -t._w, this._x = -t._x, this._y = -t._y, this._z = -t._z, o = -o) : this.copy(t), o >= 1)
      return this._w = a, this._x = s, this._y = i, this._z = r, this;
    const c = 1 - o * o;
    if (c <= Number.EPSILON) {
      const p = 1 - e;
      return this._w = p * a + e * this._w, this._x = p * s + e * this._x, this._y = p * i + e * this._y, this._z = p * r + e * this._z, this.normalize(), this;
    }
    const h = Math.sqrt(c), l = Math.atan2(h, o), u = Math.sin((1 - e) * l) / h, f = Math.sin(e * l) / h;
    return this._w = a * u + this._w * f, this._x = s * u + this._x * f, this._y = i * u + this._y * f, this._z = r * u + this._z * f, this._onChangeCallback(), this;
  }
  slerpQuaternions(t, e, s) {
    return this.copy(t).slerp(e, s);
  }
  random() {
    const t = 2 * Math.PI * Math.random(), e = 2 * Math.PI * Math.random(), s = Math.random(), i = Math.sqrt(1 - s), r = Math.sqrt(s);
    return this.set(
      i * Math.sin(t),
      i * Math.cos(t),
      r * Math.sin(e),
      r * Math.cos(e)
    );
  }
  equals(t) {
    return t._x === this._x && t._y === this._y && t._z === this._z && t._w === this._w;
  }
  fromArray(t, e = 0) {
    return this._x = t[e], this._y = t[e + 1], this._z = t[e + 2], this._w = t[e + 3], this._onChangeCallback(), this;
  }
  toArray(t = [], e = 0) {
    return t[e] = this._x, t[e + 1] = this._y, t[e + 2] = this._z, t[e + 3] = this._w, t;
  }
  fromBufferAttribute(t, e) {
    return this._x = t.getX(e), this._y = t.getY(e), this._z = t.getZ(e), this._w = t.getW(e), this._onChangeCallback(), this;
  }
  toJSON() {
    return this.toArray();
  }
  _onChange(t) {
    return this._onChangeCallback = t, this;
  }
  _onChangeCallback() {
  }
  *[Symbol.iterator]() {
    yield this._x, yield this._y, yield this._z, yield this._w;
  }
}
class E {
  constructor(t = 0, e = 0, s = 0) {
    E.prototype.isVector3 = !0, this.x = t, this.y = e, this.z = s;
  }
  set(t, e, s) {
    return s === void 0 && (s = this.z), this.x = t, this.y = e, this.z = s, this;
  }
  setScalar(t) {
    return this.x = t, this.y = t, this.z = t, this;
  }
  setX(t) {
    return this.x = t, this;
  }
  setY(t) {
    return this.y = t, this;
  }
  setZ(t) {
    return this.z = t, this;
  }
  setComponent(t, e) {
    switch (t) {
      case 0:
        this.x = e;
        break;
      case 1:
        this.y = e;
        break;
      case 2:
        this.z = e;
        break;
      default:
        throw new Error("index is out of range: " + t);
    }
    return this;
  }
  getComponent(t) {
    switch (t) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      default:
        throw new Error("index is out of range: " + t);
    }
  }
  clone() {
    return new this.constructor(this.x, this.y, this.z);
  }
  copy(t) {
    return this.x = t.x, this.y = t.y, this.z = t.z, this;
  }
  add(t) {
    return this.x += t.x, this.y += t.y, this.z += t.z, this;
  }
  addScalar(t) {
    return this.x += t, this.y += t, this.z += t, this;
  }
  addVectors(t, e) {
    return this.x = t.x + e.x, this.y = t.y + e.y, this.z = t.z + e.z, this;
  }
  addScaledVector(t, e) {
    return this.x += t.x * e, this.y += t.y * e, this.z += t.z * e, this;
  }
  sub(t) {
    return this.x -= t.x, this.y -= t.y, this.z -= t.z, this;
  }
  subScalar(t) {
    return this.x -= t, this.y -= t, this.z -= t, this;
  }
  subVectors(t, e) {
    return this.x = t.x - e.x, this.y = t.y - e.y, this.z = t.z - e.z, this;
  }
  multiply(t) {
    return this.x *= t.x, this.y *= t.y, this.z *= t.z, this;
  }
  multiplyScalar(t) {
    return this.x *= t, this.y *= t, this.z *= t, this;
  }
  multiplyVectors(t, e) {
    return this.x = t.x * e.x, this.y = t.y * e.y, this.z = t.z * e.z, this;
  }
  applyEuler(t) {
    return this.applyQuaternion(to.setFromEuler(t));
  }
  applyAxisAngle(t, e) {
    return this.applyQuaternion(to.setFromAxisAngle(t, e));
  }
  applyMatrix3(t) {
    const e = this.x, s = this.y, i = this.z, r = t.elements;
    return this.x = r[0] * e + r[3] * s + r[6] * i, this.y = r[1] * e + r[4] * s + r[7] * i, this.z = r[2] * e + r[5] * s + r[8] * i, this;
  }
  applyNormalMatrix(t) {
    return this.applyMatrix3(t).normalize();
  }
  applyMatrix4(t) {
    const e = this.x, s = this.y, i = this.z, r = t.elements, a = 1 / (r[3] * e + r[7] * s + r[11] * i + r[15]);
    return this.x = (r[0] * e + r[4] * s + r[8] * i + r[12]) * a, this.y = (r[1] * e + r[5] * s + r[9] * i + r[13]) * a, this.z = (r[2] * e + r[6] * s + r[10] * i + r[14]) * a, this;
  }
  applyQuaternion(t) {
    const e = this.x, s = this.y, i = this.z, r = t.x, a = t.y, o = t.z, c = t.w, h = 2 * (a * i - o * s), l = 2 * (o * e - r * i), u = 2 * (r * s - a * e);
    return this.x = e + c * h + a * u - o * l, this.y = s + c * l + o * h - r * u, this.z = i + c * u + r * l - a * h, this;
  }
  project(t) {
    return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix);
  }
  unproject(t) {
    return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld);
  }
  transformDirection(t) {
    const e = this.x, s = this.y, i = this.z, r = t.elements;
    return this.x = r[0] * e + r[4] * s + r[8] * i, this.y = r[1] * e + r[5] * s + r[9] * i, this.z = r[2] * e + r[6] * s + r[10] * i, this.normalize();
  }
  divide(t) {
    return this.x /= t.x, this.y /= t.y, this.z /= t.z, this;
  }
  divideScalar(t) {
    return this.multiplyScalar(1 / t);
  }
  min(t) {
    return this.x = Math.min(this.x, t.x), this.y = Math.min(this.y, t.y), this.z = Math.min(this.z, t.z), this;
  }
  max(t) {
    return this.x = Math.max(this.x, t.x), this.y = Math.max(this.y, t.y), this.z = Math.max(this.z, t.z), this;
  }
  clamp(t, e) {
    return this.x = Z(this.x, t.x, e.x), this.y = Z(this.y, t.y, e.y), this.z = Z(this.z, t.z, e.z), this;
  }
  clampScalar(t, e) {
    return this.x = Z(this.x, t, e), this.y = Z(this.y, t, e), this.z = Z(this.z, t, e), this;
  }
  clampLength(t, e) {
    const s = this.length();
    return this.divideScalar(s || 1).multiplyScalar(Z(s, t, e));
  }
  floor() {
    return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this.z = Math.floor(this.z), this;
  }
  ceil() {
    return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this.z = Math.ceil(this.z), this;
  }
  round() {
    return this.x = Math.round(this.x), this.y = Math.round(this.y), this.z = Math.round(this.z), this;
  }
  roundToZero() {
    return this.x = Math.trunc(this.x), this.y = Math.trunc(this.y), this.z = Math.trunc(this.z), this;
  }
  negate() {
    return this.x = -this.x, this.y = -this.y, this.z = -this.z, this;
  }
  dot(t) {
    return this.x * t.x + this.y * t.y + this.z * t.z;
  }
  // TODO lengthSquared?
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  setLength(t) {
    return this.normalize().multiplyScalar(t);
  }
  lerp(t, e) {
    return this.x += (t.x - this.x) * e, this.y += (t.y - this.y) * e, this.z += (t.z - this.z) * e, this;
  }
  lerpVectors(t, e, s) {
    return this.x = t.x + (e.x - t.x) * s, this.y = t.y + (e.y - t.y) * s, this.z = t.z + (e.z - t.z) * s, this;
  }
  cross(t) {
    return this.crossVectors(this, t);
  }
  crossVectors(t, e) {
    const s = t.x, i = t.y, r = t.z, a = e.x, o = e.y, c = e.z;
    return this.x = i * c - r * o, this.y = r * a - s * c, this.z = s * o - i * a, this;
  }
  projectOnVector(t) {
    const e = t.lengthSq();
    if (e === 0) return this.set(0, 0, 0);
    const s = t.dot(this) / e;
    return this.copy(t).multiplyScalar(s);
  }
  projectOnPlane(t) {
    return Yi.copy(this).projectOnVector(t), this.sub(Yi);
  }
  reflect(t) {
    return this.sub(Yi.copy(t).multiplyScalar(2 * this.dot(t)));
  }
  angleTo(t) {
    const e = Math.sqrt(this.lengthSq() * t.lengthSq());
    if (e === 0) return Math.PI / 2;
    const s = this.dot(t) / e;
    return Math.acos(Z(s, -1, 1));
  }
  distanceTo(t) {
    return Math.sqrt(this.distanceToSquared(t));
  }
  distanceToSquared(t) {
    const e = this.x - t.x, s = this.y - t.y, i = this.z - t.z;
    return e * e + s * s + i * i;
  }
  manhattanDistanceTo(t) {
    return Math.abs(this.x - t.x) + Math.abs(this.y - t.y) + Math.abs(this.z - t.z);
  }
  setFromSpherical(t) {
    return this.setFromSphericalCoords(t.radius, t.phi, t.theta);
  }
  setFromSphericalCoords(t, e, s) {
    const i = Math.sin(e) * t;
    return this.x = i * Math.sin(s), this.y = Math.cos(e) * t, this.z = i * Math.cos(s), this;
  }
  setFromCylindrical(t) {
    return this.setFromCylindricalCoords(t.radius, t.theta, t.y);
  }
  setFromCylindricalCoords(t, e, s) {
    return this.x = t * Math.sin(e), this.y = s, this.z = t * Math.cos(e), this;
  }
  setFromMatrixPosition(t) {
    const e = t.elements;
    return this.x = e[12], this.y = e[13], this.z = e[14], this;
  }
  setFromMatrixScale(t) {
    const e = this.setFromMatrixColumn(t, 0).length(), s = this.setFromMatrixColumn(t, 1).length(), i = this.setFromMatrixColumn(t, 2).length();
    return this.x = e, this.y = s, this.z = i, this;
  }
  setFromMatrixColumn(t, e) {
    return this.fromArray(t.elements, e * 4);
  }
  setFromMatrix3Column(t, e) {
    return this.fromArray(t.elements, e * 3);
  }
  setFromEuler(t) {
    return this.x = t._x, this.y = t._y, this.z = t._z, this;
  }
  setFromColor(t) {
    return this.x = t.r, this.y = t.g, this.z = t.b, this;
  }
  equals(t) {
    return t.x === this.x && t.y === this.y && t.z === this.z;
  }
  fromArray(t, e = 0) {
    return this.x = t[e], this.y = t[e + 1], this.z = t[e + 2], this;
  }
  toArray(t = [], e = 0) {
    return t[e] = this.x, t[e + 1] = this.y, t[e + 2] = this.z, t;
  }
  fromBufferAttribute(t, e) {
    return this.x = t.getX(e), this.y = t.getY(e), this.z = t.getZ(e), this;
  }
  random() {
    return this.x = Math.random(), this.y = Math.random(), this.z = Math.random(), this;
  }
  randomDirection() {
    const t = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, s = Math.sqrt(1 - e * e);
    return this.x = s * Math.cos(t), this.y = e, this.z = s * Math.sin(t), this;
  }
  *[Symbol.iterator]() {
    yield this.x, yield this.y, yield this.z;
  }
}
const Yi = /* @__PURE__ */ new E(), to = /* @__PURE__ */ new dn();
class Ft {
  constructor(t = new E(1 / 0, 1 / 0, 1 / 0), e = new E(-1 / 0, -1 / 0, -1 / 0)) {
    this.isBox3 = !0, this.min = t, this.max = e;
  }
  set(t, e) {
    return this.min.copy(t), this.max.copy(e), this;
  }
  setFromArray(t) {
    this.makeEmpty();
    for (let e = 0, s = t.length; e < s; e += 3)
      this.expandByPoint(ee.fromArray(t, e));
    return this;
  }
  setFromBufferAttribute(t) {
    this.makeEmpty();
    for (let e = 0, s = t.count; e < s; e++)
      this.expandByPoint(ee.fromBufferAttribute(t, e));
    return this;
  }
  setFromPoints(t) {
    this.makeEmpty();
    for (let e = 0, s = t.length; e < s; e++)
      this.expandByPoint(t[e]);
    return this;
  }
  setFromCenterAndSize(t, e) {
    const s = ee.copy(e).multiplyScalar(0.5);
    return this.min.copy(t).sub(s), this.max.copy(t).add(s), this;
  }
  setFromObject(t, e = !1) {
    return this.makeEmpty(), this.expandByObject(t, e);
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(t) {
    return this.min.copy(t.min), this.max.copy(t.max), this;
  }
  makeEmpty() {
    return this.min.x = this.min.y = this.min.z = 1 / 0, this.max.x = this.max.y = this.max.z = -1 / 0, this;
  }
  isEmpty() {
    return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
  }
  getCenter(t) {
    return this.isEmpty() ? t.set(0, 0, 0) : t.addVectors(this.min, this.max).multiplyScalar(0.5);
  }
  getSize(t) {
    return this.isEmpty() ? t.set(0, 0, 0) : t.subVectors(this.max, this.min);
  }
  expandByPoint(t) {
    return this.min.min(t), this.max.max(t), this;
  }
  expandByVector(t) {
    return this.min.sub(t), this.max.add(t), this;
  }
  expandByScalar(t) {
    return this.min.addScalar(-t), this.max.addScalar(t), this;
  }
  expandByObject(t, e = !1) {
    t.updateWorldMatrix(!1, !1);
    const s = t.geometry;
    if (s !== void 0) {
      const r = s.getAttribute("position");
      if (e === !0 && r !== void 0 && t.isInstancedMesh !== !0)
        for (let a = 0, o = r.count; a < o; a++)
          t.isMesh === !0 ? t.getVertexPosition(a, ee) : ee.fromBufferAttribute(r, a), ee.applyMatrix4(t.matrixWorld), this.expandByPoint(ee);
      else
        t.boundingBox !== void 0 ? (t.boundingBox === null && t.computeBoundingBox(), _s.copy(t.boundingBox)) : (s.boundingBox === null && s.computeBoundingBox(), _s.copy(s.boundingBox)), _s.applyMatrix4(t.matrixWorld), this.union(_s);
    }
    const i = t.children;
    for (let r = 0, a = i.length; r < a; r++)
      this.expandByObject(i[r], e);
    return this;
  }
  containsPoint(t) {
    return t.x >= this.min.x && t.x <= this.max.x && t.y >= this.min.y && t.y <= this.max.y && t.z >= this.min.z && t.z <= this.max.z;
  }
  containsBox(t) {
    return this.min.x <= t.min.x && t.max.x <= this.max.x && this.min.y <= t.min.y && t.max.y <= this.max.y && this.min.z <= t.min.z && t.max.z <= this.max.z;
  }
  getParameter(t, e) {
    return e.set(
      (t.x - this.min.x) / (this.max.x - this.min.x),
      (t.y - this.min.y) / (this.max.y - this.min.y),
      (t.z - this.min.z) / (this.max.z - this.min.z)
    );
  }
  intersectsBox(t) {
    return t.max.x >= this.min.x && t.min.x <= this.max.x && t.max.y >= this.min.y && t.min.y <= this.max.y && t.max.z >= this.min.z && t.min.z <= this.max.z;
  }
  intersectsSphere(t) {
    return this.clampPoint(t.center, ee), ee.distanceToSquared(t.center) <= t.radius * t.radius;
  }
  intersectsPlane(t) {
    let e, s;
    return t.normal.x > 0 ? (e = t.normal.x * this.min.x, s = t.normal.x * this.max.x) : (e = t.normal.x * this.max.x, s = t.normal.x * this.min.x), t.normal.y > 0 ? (e += t.normal.y * this.min.y, s += t.normal.y * this.max.y) : (e += t.normal.y * this.max.y, s += t.normal.y * this.min.y), t.normal.z > 0 ? (e += t.normal.z * this.min.z, s += t.normal.z * this.max.z) : (e += t.normal.z * this.max.z, s += t.normal.z * this.min.z), e <= -t.constant && s >= -t.constant;
  }
  intersectsTriangle(t) {
    if (this.isEmpty())
      return !1;
    this.getCenter(Jn), Ls.subVectors(this.max, Jn), vn.subVectors(t.a, Jn), Sn.subVectors(t.b, Jn), wn.subVectors(t.c, Jn), Be.subVectors(Sn, vn), Re.subVectors(wn, Sn), en.subVectors(vn, wn);
    let e = [
      0,
      -Be.z,
      Be.y,
      0,
      -Re.z,
      Re.y,
      0,
      -en.z,
      en.y,
      Be.z,
      0,
      -Be.x,
      Re.z,
      0,
      -Re.x,
      en.z,
      0,
      -en.x,
      -Be.y,
      Be.x,
      0,
      -Re.y,
      Re.x,
      0,
      -en.y,
      en.x,
      0
    ];
    return !$i(e, vn, Sn, wn, Ls) || (e = [1, 0, 0, 0, 1, 0, 0, 0, 1], !$i(e, vn, Sn, wn, Ls)) ? !1 : (Is.crossVectors(Be, Re), e = [Is.x, Is.y, Is.z], $i(e, vn, Sn, wn, Ls));
  }
  clampPoint(t, e) {
    return e.copy(t).clamp(this.min, this.max);
  }
  distanceToPoint(t) {
    return this.clampPoint(t, ee).distanceTo(t);
  }
  getBoundingSphere(t) {
    return this.isEmpty() ? t.makeEmpty() : (this.getCenter(t.center), t.radius = this.getSize(ee).length() * 0.5), t;
  }
  intersect(t) {
    return this.min.max(t.min), this.max.min(t.max), this.isEmpty() && this.makeEmpty(), this;
  }
  union(t) {
    return this.min.min(t.min), this.max.max(t.max), this;
  }
  applyMatrix4(t) {
    return this.isEmpty() ? this : (we[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(t), we[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(t), we[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(t), we[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(t), we[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(t), we[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(t), we[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(t), we[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(t), this.setFromPoints(we), this);
  }
  translate(t) {
    return this.min.add(t), this.max.add(t), this;
  }
  equals(t) {
    return t.min.equals(this.min) && t.max.equals(this.max);
  }
}
const we = [
  /* @__PURE__ */ new E(),
  /* @__PURE__ */ new E(),
  /* @__PURE__ */ new E(),
  /* @__PURE__ */ new E(),
  /* @__PURE__ */ new E(),
  /* @__PURE__ */ new E(),
  /* @__PURE__ */ new E(),
  /* @__PURE__ */ new E()
], ee = /* @__PURE__ */ new E(), _s = /* @__PURE__ */ new Ft(), vn = /* @__PURE__ */ new E(), Sn = /* @__PURE__ */ new E(), wn = /* @__PURE__ */ new E(), Be = /* @__PURE__ */ new E(), Re = /* @__PURE__ */ new E(), en = /* @__PURE__ */ new E(), Jn = /* @__PURE__ */ new E(), Ls = /* @__PURE__ */ new E(), Is = /* @__PURE__ */ new E(), nn = /* @__PURE__ */ new E();
function $i(n, t, e, s, i) {
  for (let r = 0, a = n.length - 3; r <= a; r += 3) {
    nn.fromArray(n, r);
    const o = i.x * Math.abs(nn.x) + i.y * Math.abs(nn.y) + i.z * Math.abs(nn.z), c = t.dot(nn), h = e.dot(nn), l = s.dot(nn);
    if (Math.max(-Math.max(c, h, l), Math.min(c, h, l)) > o)
      return !1;
  }
  return !0;
}
const du = /* @__PURE__ */ new Ft(), Kn = /* @__PURE__ */ new E(), Zi = /* @__PURE__ */ new E();
class la {
  constructor(t = new E(), e = -1) {
    this.isSphere = !0, this.center = t, this.radius = e;
  }
  set(t, e) {
    return this.center.copy(t), this.radius = e, this;
  }
  setFromPoints(t, e) {
    const s = this.center;
    e !== void 0 ? s.copy(e) : du.setFromPoints(t).getCenter(s);
    let i = 0;
    for (let r = 0, a = t.length; r < a; r++)
      i = Math.max(i, s.distanceToSquared(t[r]));
    return this.radius = Math.sqrt(i), this;
  }
  copy(t) {
    return this.center.copy(t.center), this.radius = t.radius, this;
  }
  isEmpty() {
    return this.radius < 0;
  }
  makeEmpty() {
    return this.center.set(0, 0, 0), this.radius = -1, this;
  }
  containsPoint(t) {
    return t.distanceToSquared(this.center) <= this.radius * this.radius;
  }
  distanceToPoint(t) {
    return t.distanceTo(this.center) - this.radius;
  }
  intersectsSphere(t) {
    const e = this.radius + t.radius;
    return t.center.distanceToSquared(this.center) <= e * e;
  }
  intersectsBox(t) {
    return t.intersectsSphere(this);
  }
  intersectsPlane(t) {
    return Math.abs(t.distanceToPoint(this.center)) <= this.radius;
  }
  clampPoint(t, e) {
    const s = this.center.distanceToSquared(t);
    return e.copy(t), s > this.radius * this.radius && (e.sub(this.center).normalize(), e.multiplyScalar(this.radius).add(this.center)), e;
  }
  getBoundingBox(t) {
    return this.isEmpty() ? (t.makeEmpty(), t) : (t.set(this.center, this.center), t.expandByScalar(this.radius), t);
  }
  applyMatrix4(t) {
    return this.center.applyMatrix4(t), this.radius = this.radius * t.getMaxScaleOnAxis(), this;
  }
  translate(t) {
    return this.center.add(t), this;
  }
  expandByPoint(t) {
    if (this.isEmpty())
      return this.center.copy(t), this.radius = 0, this;
    Kn.subVectors(t, this.center);
    const e = Kn.lengthSq();
    if (e > this.radius * this.radius) {
      const s = Math.sqrt(e), i = (s - this.radius) * 0.5;
      this.center.addScaledVector(Kn, i / s), this.radius += i;
    }
    return this;
  }
  union(t) {
    return t.isEmpty() ? this : this.isEmpty() ? (this.copy(t), this) : (this.center.equals(t.center) === !0 ? this.radius = Math.max(this.radius, t.radius) : (Zi.subVectors(t.center, this.center).setLength(t.radius), this.expandByPoint(Kn.copy(t.center).add(Zi)), this.expandByPoint(Kn.copy(t.center).sub(Zi))), this);
  }
  equals(t) {
    return t.center.equals(this.center) && t.radius === this.radius;
  }
  clone() {
    return new this.constructor().copy(this);
  }
}
const Ce = /* @__PURE__ */ new E(), Ji = /* @__PURE__ */ new E(), Bs = /* @__PURE__ */ new E(), De = /* @__PURE__ */ new E(), Ki = /* @__PURE__ */ new E(), Rs = /* @__PURE__ */ new E(), Qi = /* @__PURE__ */ new E();
class ch {
  constructor(t = new E(), e = new E(0, 0, -1)) {
    this.origin = t, this.direction = e;
  }
  set(t, e) {
    return this.origin.copy(t), this.direction.copy(e), this;
  }
  copy(t) {
    return this.origin.copy(t.origin), this.direction.copy(t.direction), this;
  }
  at(t, e) {
    return e.copy(this.origin).addScaledVector(this.direction, t);
  }
  lookAt(t) {
    return this.direction.copy(t).sub(this.origin).normalize(), this;
  }
  recast(t) {
    return this.origin.copy(this.at(t, Ce)), this;
  }
  closestPointToPoint(t, e) {
    e.subVectors(t, this.origin);
    const s = e.dot(this.direction);
    return s < 0 ? e.copy(this.origin) : e.copy(this.origin).addScaledVector(this.direction, s);
  }
  distanceToPoint(t) {
    return Math.sqrt(this.distanceSqToPoint(t));
  }
  distanceSqToPoint(t) {
    const e = Ce.subVectors(t, this.origin).dot(this.direction);
    return e < 0 ? this.origin.distanceToSquared(t) : (Ce.copy(this.origin).addScaledVector(this.direction, e), Ce.distanceToSquared(t));
  }
  distanceSqToSegment(t, e, s, i) {
    Ji.copy(t).add(e).multiplyScalar(0.5), Bs.copy(e).sub(t).normalize(), De.copy(this.origin).sub(Ji);
    const r = t.distanceTo(e) * 0.5, a = -this.direction.dot(Bs), o = De.dot(this.direction), c = -De.dot(Bs), h = De.lengthSq(), l = Math.abs(1 - a * a);
    let u, f, p, d;
    if (l > 0)
      if (u = a * c - o, f = a * o - c, d = r * l, u >= 0)
        if (f >= -d)
          if (f <= d) {
            const g = 1 / l;
            u *= g, f *= g, p = u * (u + a * f + 2 * o) + f * (a * u + f + 2 * c) + h;
          } else
            f = r, u = Math.max(0, -(a * f + o)), p = -u * u + f * (f + 2 * c) + h;
        else
          f = -r, u = Math.max(0, -(a * f + o)), p = -u * u + f * (f + 2 * c) + h;
      else
        f <= -d ? (u = Math.max(0, -(-a * r + o)), f = u > 0 ? -r : Math.min(Math.max(-r, -c), r), p = -u * u + f * (f + 2 * c) + h) : f <= d ? (u = 0, f = Math.min(Math.max(-r, -c), r), p = f * (f + 2 * c) + h) : (u = Math.max(0, -(a * r + o)), f = u > 0 ? r : Math.min(Math.max(-r, -c), r), p = -u * u + f * (f + 2 * c) + h);
    else
      f = a > 0 ? -r : r, u = Math.max(0, -(a * f + o)), p = -u * u + f * (f + 2 * c) + h;
    return s && s.copy(this.origin).addScaledVector(this.direction, u), i && i.copy(Ji).addScaledVector(Bs, f), p;
  }
  intersectSphere(t, e) {
    Ce.subVectors(t.center, this.origin);
    const s = Ce.dot(this.direction), i = Ce.dot(Ce) - s * s, r = t.radius * t.radius;
    if (i > r) return null;
    const a = Math.sqrt(r - i), o = s - a, c = s + a;
    return c < 0 ? null : o < 0 ? this.at(c, e) : this.at(o, e);
  }
  intersectsSphere(t) {
    return this.distanceSqToPoint(t.center) <= t.radius * t.radius;
  }
  distanceToPlane(t) {
    const e = t.normal.dot(this.direction);
    if (e === 0)
      return t.distanceToPoint(this.origin) === 0 ? 0 : null;
    const s = -(this.origin.dot(t.normal) + t.constant) / e;
    return s >= 0 ? s : null;
  }
  intersectPlane(t, e) {
    const s = this.distanceToPlane(t);
    return s === null ? null : this.at(s, e);
  }
  intersectsPlane(t) {
    const e = t.distanceToPoint(this.origin);
    return e === 0 || t.normal.dot(this.direction) * e < 0;
  }
  intersectBox(t, e) {
    let s, i, r, a, o, c;
    const h = 1 / this.direction.x, l = 1 / this.direction.y, u = 1 / this.direction.z, f = this.origin;
    return h >= 0 ? (s = (t.min.x - f.x) * h, i = (t.max.x - f.x) * h) : (s = (t.max.x - f.x) * h, i = (t.min.x - f.x) * h), l >= 0 ? (r = (t.min.y - f.y) * l, a = (t.max.y - f.y) * l) : (r = (t.max.y - f.y) * l, a = (t.min.y - f.y) * l), s > a || r > i || ((r > s || isNaN(s)) && (s = r), (a < i || isNaN(i)) && (i = a), u >= 0 ? (o = (t.min.z - f.z) * u, c = (t.max.z - f.z) * u) : (o = (t.max.z - f.z) * u, c = (t.min.z - f.z) * u), s > c || o > i) || ((o > s || s !== s) && (s = o), (c < i || i !== i) && (i = c), i < 0) ? null : this.at(s >= 0 ? s : i, e);
  }
  intersectsBox(t) {
    return this.intersectBox(t, Ce) !== null;
  }
  intersectTriangle(t, e, s, i, r) {
    Ki.subVectors(e, t), Rs.subVectors(s, t), Qi.crossVectors(Ki, Rs);
    let a = this.direction.dot(Qi), o;
    if (a > 0) {
      if (i) return null;
      o = 1;
    } else if (a < 0)
      o = -1, a = -a;
    else
      return null;
    De.subVectors(this.origin, t);
    const c = o * this.direction.dot(Rs.crossVectors(De, Rs));
    if (c < 0)
      return null;
    const h = o * this.direction.dot(Ki.cross(De));
    if (h < 0 || c + h > a)
      return null;
    const l = -o * De.dot(Qi);
    return l < 0 ? null : this.at(l / a, r);
  }
  applyMatrix4(t) {
    return this.origin.applyMatrix4(t), this.direction.transformDirection(t), this;
  }
  equals(t) {
    return t.origin.equals(this.origin) && t.direction.equals(this.direction);
  }
  clone() {
    return new this.constructor().copy(this);
  }
}
class mt {
  constructor(t, e, s, i, r, a, o, c, h, l, u, f, p, d, g, x) {
    mt.prototype.isMatrix4 = !0, this.elements = [
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    ], t !== void 0 && this.set(t, e, s, i, r, a, o, c, h, l, u, f, p, d, g, x);
  }
  set(t, e, s, i, r, a, o, c, h, l, u, f, p, d, g, x) {
    const b = this.elements;
    return b[0] = t, b[4] = e, b[8] = s, b[12] = i, b[1] = r, b[5] = a, b[9] = o, b[13] = c, b[2] = h, b[6] = l, b[10] = u, b[14] = f, b[3] = p, b[7] = d, b[11] = g, b[15] = x, this;
  }
  identity() {
    return this.set(
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  clone() {
    return new mt().fromArray(this.elements);
  }
  copy(t) {
    const e = this.elements, s = t.elements;
    return e[0] = s[0], e[1] = s[1], e[2] = s[2], e[3] = s[3], e[4] = s[4], e[5] = s[5], e[6] = s[6], e[7] = s[7], e[8] = s[8], e[9] = s[9], e[10] = s[10], e[11] = s[11], e[12] = s[12], e[13] = s[13], e[14] = s[14], e[15] = s[15], this;
  }
  copyPosition(t) {
    const e = this.elements, s = t.elements;
    return e[12] = s[12], e[13] = s[13], e[14] = s[14], this;
  }
  setFromMatrix3(t) {
    const e = t.elements;
    return this.set(
      e[0],
      e[3],
      e[6],
      0,
      e[1],
      e[4],
      e[7],
      0,
      e[2],
      e[5],
      e[8],
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  extractBasis(t, e, s) {
    return t.setFromMatrixColumn(this, 0), e.setFromMatrixColumn(this, 1), s.setFromMatrixColumn(this, 2), this;
  }
  makeBasis(t, e, s) {
    return this.set(
      t.x,
      e.x,
      s.x,
      0,
      t.y,
      e.y,
      s.y,
      0,
      t.z,
      e.z,
      s.z,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  extractRotation(t) {
    const e = this.elements, s = t.elements, i = 1 / Cn.setFromMatrixColumn(t, 0).length(), r = 1 / Cn.setFromMatrixColumn(t, 1).length(), a = 1 / Cn.setFromMatrixColumn(t, 2).length();
    return e[0] = s[0] * i, e[1] = s[1] * i, e[2] = s[2] * i, e[3] = 0, e[4] = s[4] * r, e[5] = s[5] * r, e[6] = s[6] * r, e[7] = 0, e[8] = s[8] * a, e[9] = s[9] * a, e[10] = s[10] * a, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, this;
  }
  makeRotationFromEuler(t) {
    const e = this.elements, s = t.x, i = t.y, r = t.z, a = Math.cos(s), o = Math.sin(s), c = Math.cos(i), h = Math.sin(i), l = Math.cos(r), u = Math.sin(r);
    if (t.order === "XYZ") {
      const f = a * l, p = a * u, d = o * l, g = o * u;
      e[0] = c * l, e[4] = -c * u, e[8] = h, e[1] = p + d * h, e[5] = f - g * h, e[9] = -o * c, e[2] = g - f * h, e[6] = d + p * h, e[10] = a * c;
    } else if (t.order === "YXZ") {
      const f = c * l, p = c * u, d = h * l, g = h * u;
      e[0] = f + g * o, e[4] = d * o - p, e[8] = a * h, e[1] = a * u, e[5] = a * l, e[9] = -o, e[2] = p * o - d, e[6] = g + f * o, e[10] = a * c;
    } else if (t.order === "ZXY") {
      const f = c * l, p = c * u, d = h * l, g = h * u;
      e[0] = f - g * o, e[4] = -a * u, e[8] = d + p * o, e[1] = p + d * o, e[5] = a * l, e[9] = g - f * o, e[2] = -a * h, e[6] = o, e[10] = a * c;
    } else if (t.order === "ZYX") {
      const f = a * l, p = a * u, d = o * l, g = o * u;
      e[0] = c * l, e[4] = d * h - p, e[8] = f * h + g, e[1] = c * u, e[5] = g * h + f, e[9] = p * h - d, e[2] = -h, e[6] = o * c, e[10] = a * c;
    } else if (t.order === "YZX") {
      const f = a * c, p = a * h, d = o * c, g = o * h;
      e[0] = c * l, e[4] = g - f * u, e[8] = d * u + p, e[1] = u, e[5] = a * l, e[9] = -o * l, e[2] = -h * l, e[6] = p * u + d, e[10] = f - g * u;
    } else if (t.order === "XZY") {
      const f = a * c, p = a * h, d = o * c, g = o * h;
      e[0] = c * l, e[4] = -u, e[8] = h * l, e[1] = f * u + g, e[5] = a * l, e[9] = p * u - d, e[2] = d * u - p, e[6] = o * l, e[10] = g * u + f;
    }
    return e[3] = 0, e[7] = 0, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, this;
  }
  makeRotationFromQuaternion(t) {
    return this.compose(gu, t, mu);
  }
  lookAt(t, e, s) {
    const i = this.elements;
    return Vt.subVectors(t, e), Vt.lengthSq() === 0 && (Vt.z = 1), Vt.normalize(), Ue.crossVectors(s, Vt), Ue.lengthSq() === 0 && (Math.abs(s.z) === 1 ? Vt.x += 1e-4 : Vt.z += 1e-4, Vt.normalize(), Ue.crossVectors(s, Vt)), Ue.normalize(), Ds.crossVectors(Vt, Ue), i[0] = Ue.x, i[4] = Ds.x, i[8] = Vt.x, i[1] = Ue.y, i[5] = Ds.y, i[9] = Vt.y, i[2] = Ue.z, i[6] = Ds.z, i[10] = Vt.z, this;
  }
  multiply(t) {
    return this.multiplyMatrices(this, t);
  }
  premultiply(t) {
    return this.multiplyMatrices(t, this);
  }
  multiplyMatrices(t, e) {
    const s = t.elements, i = e.elements, r = this.elements, a = s[0], o = s[4], c = s[8], h = s[12], l = s[1], u = s[5], f = s[9], p = s[13], d = s[2], g = s[6], x = s[10], b = s[14], v = s[3], S = s[7], w = s[11], F = s[15], O = i[0], M = i[4], I = i[8], H = i[12], R = i[1], W = i[5], J = i[9], D = i[13], U = i[2], P = i[6], K = i[10], yt = i[14], Ut = i[3], Ct = i[7], at = i[11], j = i[15];
    return r[0] = a * O + o * R + c * U + h * Ut, r[4] = a * M + o * W + c * P + h * Ct, r[8] = a * I + o * J + c * K + h * at, r[12] = a * H + o * D + c * yt + h * j, r[1] = l * O + u * R + f * U + p * Ut, r[5] = l * M + u * W + f * P + p * Ct, r[9] = l * I + u * J + f * K + p * at, r[13] = l * H + u * D + f * yt + p * j, r[2] = d * O + g * R + x * U + b * Ut, r[6] = d * M + g * W + x * P + b * Ct, r[10] = d * I + g * J + x * K + b * at, r[14] = d * H + g * D + x * yt + b * j, r[3] = v * O + S * R + w * U + F * Ut, r[7] = v * M + S * W + w * P + F * Ct, r[11] = v * I + S * J + w * K + F * at, r[15] = v * H + S * D + w * yt + F * j, this;
  }
  multiplyScalar(t) {
    const e = this.elements;
    return e[0] *= t, e[4] *= t, e[8] *= t, e[12] *= t, e[1] *= t, e[5] *= t, e[9] *= t, e[13] *= t, e[2] *= t, e[6] *= t, e[10] *= t, e[14] *= t, e[3] *= t, e[7] *= t, e[11] *= t, e[15] *= t, this;
  }
  determinant() {
    const t = this.elements, e = t[0], s = t[4], i = t[8], r = t[12], a = t[1], o = t[5], c = t[9], h = t[13], l = t[2], u = t[6], f = t[10], p = t[14], d = t[3], g = t[7], x = t[11], b = t[15];
    return d * (+r * c * u - i * h * u - r * o * f + s * h * f + i * o * p - s * c * p) + g * (+e * c * p - e * h * f + r * a * f - i * a * p + i * h * l - r * c * l) + x * (+e * h * u - e * o * p - r * a * u + s * a * p + r * o * l - s * h * l) + b * (-i * o * l - e * c * u + e * o * f + i * a * u - s * a * f + s * c * l);
  }
  transpose() {
    const t = this.elements;
    let e;
    return e = t[1], t[1] = t[4], t[4] = e, e = t[2], t[2] = t[8], t[8] = e, e = t[6], t[6] = t[9], t[9] = e, e = t[3], t[3] = t[12], t[12] = e, e = t[7], t[7] = t[13], t[13] = e, e = t[11], t[11] = t[14], t[14] = e, this;
  }
  setPosition(t, e, s) {
    const i = this.elements;
    return t.isVector3 ? (i[12] = t.x, i[13] = t.y, i[14] = t.z) : (i[12] = t, i[13] = e, i[14] = s), this;
  }
  invert() {
    const t = this.elements, e = t[0], s = t[1], i = t[2], r = t[3], a = t[4], o = t[5], c = t[6], h = t[7], l = t[8], u = t[9], f = t[10], p = t[11], d = t[12], g = t[13], x = t[14], b = t[15], v = u * x * h - g * f * h + g * c * p - o * x * p - u * c * b + o * f * b, S = d * f * h - l * x * h - d * c * p + a * x * p + l * c * b - a * f * b, w = l * g * h - d * u * h + d * o * p - a * g * p - l * o * b + a * u * b, F = d * u * c - l * g * c - d * o * f + a * g * f + l * o * x - a * u * x, O = e * v + s * S + i * w + r * F;
    if (O === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    const M = 1 / O;
    return t[0] = v * M, t[1] = (g * f * r - u * x * r - g * i * p + s * x * p + u * i * b - s * f * b) * M, t[2] = (o * x * r - g * c * r + g * i * h - s * x * h - o * i * b + s * c * b) * M, t[3] = (u * c * r - o * f * r - u * i * h + s * f * h + o * i * p - s * c * p) * M, t[4] = S * M, t[5] = (l * x * r - d * f * r + d * i * p - e * x * p - l * i * b + e * f * b) * M, t[6] = (d * c * r - a * x * r - d * i * h + e * x * h + a * i * b - e * c * b) * M, t[7] = (a * f * r - l * c * r + l * i * h - e * f * h - a * i * p + e * c * p) * M, t[8] = w * M, t[9] = (d * u * r - l * g * r - d * s * p + e * g * p + l * s * b - e * u * b) * M, t[10] = (a * g * r - d * o * r + d * s * h - e * g * h - a * s * b + e * o * b) * M, t[11] = (l * o * r - a * u * r - l * s * h + e * u * h + a * s * p - e * o * p) * M, t[12] = F * M, t[13] = (l * g * i - d * u * i + d * s * f - e * g * f - l * s * x + e * u * x) * M, t[14] = (d * o * i - a * g * i - d * s * c + e * g * c + a * s * x - e * o * x) * M, t[15] = (a * u * i - l * o * i + l * s * c - e * u * c - a * s * f + e * o * f) * M, this;
  }
  scale(t) {
    const e = this.elements, s = t.x, i = t.y, r = t.z;
    return e[0] *= s, e[4] *= i, e[8] *= r, e[1] *= s, e[5] *= i, e[9] *= r, e[2] *= s, e[6] *= i, e[10] *= r, e[3] *= s, e[7] *= i, e[11] *= r, this;
  }
  getMaxScaleOnAxis() {
    const t = this.elements, e = t[0] * t[0] + t[1] * t[1] + t[2] * t[2], s = t[4] * t[4] + t[5] * t[5] + t[6] * t[6], i = t[8] * t[8] + t[9] * t[9] + t[10] * t[10];
    return Math.sqrt(Math.max(e, s, i));
  }
  makeTranslation(t, e, s) {
    return t.isVector3 ? this.set(
      1,
      0,
      0,
      t.x,
      0,
      1,
      0,
      t.y,
      0,
      0,
      1,
      t.z,
      0,
      0,
      0,
      1
    ) : this.set(
      1,
      0,
      0,
      t,
      0,
      1,
      0,
      e,
      0,
      0,
      1,
      s,
      0,
      0,
      0,
      1
    ), this;
  }
  makeRotationX(t) {
    const e = Math.cos(t), s = Math.sin(t);
    return this.set(
      1,
      0,
      0,
      0,
      0,
      e,
      -s,
      0,
      0,
      s,
      e,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  makeRotationY(t) {
    const e = Math.cos(t), s = Math.sin(t);
    return this.set(
      e,
      0,
      s,
      0,
      0,
      1,
      0,
      0,
      -s,
      0,
      e,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  makeRotationZ(t) {
    const e = Math.cos(t), s = Math.sin(t);
    return this.set(
      e,
      -s,
      0,
      0,
      s,
      e,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  makeRotationAxis(t, e) {
    const s = Math.cos(e), i = Math.sin(e), r = 1 - s, a = t.x, o = t.y, c = t.z, h = r * a, l = r * o;
    return this.set(
      h * a + s,
      h * o - i * c,
      h * c + i * o,
      0,
      h * o + i * c,
      l * o + s,
      l * c - i * a,
      0,
      h * c - i * o,
      l * c + i * a,
      r * c * c + s,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  makeScale(t, e, s) {
    return this.set(
      t,
      0,
      0,
      0,
      0,
      e,
      0,
      0,
      0,
      0,
      s,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  makeShear(t, e, s, i, r, a) {
    return this.set(
      1,
      s,
      r,
      0,
      t,
      1,
      a,
      0,
      e,
      i,
      1,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  compose(t, e, s) {
    const i = this.elements, r = e._x, a = e._y, o = e._z, c = e._w, h = r + r, l = a + a, u = o + o, f = r * h, p = r * l, d = r * u, g = a * l, x = a * u, b = o * u, v = c * h, S = c * l, w = c * u, F = s.x, O = s.y, M = s.z;
    return i[0] = (1 - (g + b)) * F, i[1] = (p + w) * F, i[2] = (d - S) * F, i[3] = 0, i[4] = (p - w) * O, i[5] = (1 - (f + b)) * O, i[6] = (x + v) * O, i[7] = 0, i[8] = (d + S) * M, i[9] = (x - v) * M, i[10] = (1 - (f + g)) * M, i[11] = 0, i[12] = t.x, i[13] = t.y, i[14] = t.z, i[15] = 1, this;
  }
  decompose(t, e, s) {
    const i = this.elements;
    let r = Cn.set(i[0], i[1], i[2]).length();
    const a = Cn.set(i[4], i[5], i[6]).length(), o = Cn.set(i[8], i[9], i[10]).length();
    this.determinant() < 0 && (r = -r), t.x = i[12], t.y = i[13], t.z = i[14], ne.copy(this);
    const h = 1 / r, l = 1 / a, u = 1 / o;
    return ne.elements[0] *= h, ne.elements[1] *= h, ne.elements[2] *= h, ne.elements[4] *= l, ne.elements[5] *= l, ne.elements[6] *= l, ne.elements[8] *= u, ne.elements[9] *= u, ne.elements[10] *= u, e.setFromRotationMatrix(ne), s.x = r, s.y = a, s.z = o, this;
  }
  makePerspective(t, e, s, i, r, a, o = Os) {
    const c = this.elements, h = 2 * r / (e - t), l = 2 * r / (s - i), u = (e + t) / (e - t), f = (s + i) / (s - i);
    let p, d;
    if (o === Os)
      p = -(a + r) / (a - r), d = -2 * a * r / (a - r);
    else if (o === Za)
      p = -a / (a - r), d = -a * r / (a - r);
    else
      throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: " + o);
    return c[0] = h, c[4] = 0, c[8] = u, c[12] = 0, c[1] = 0, c[5] = l, c[9] = f, c[13] = 0, c[2] = 0, c[6] = 0, c[10] = p, c[14] = d, c[3] = 0, c[7] = 0, c[11] = -1, c[15] = 0, this;
  }
  makeOrthographic(t, e, s, i, r, a, o = Os) {
    const c = this.elements, h = 1 / (e - t), l = 1 / (s - i), u = 1 / (a - r), f = (e + t) * h, p = (s + i) * l;
    let d, g;
    if (o === Os)
      d = (a + r) * u, g = -2 * u;
    else if (o === Za)
      d = r * u, g = -1 * u;
    else
      throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: " + o);
    return c[0] = 2 * h, c[4] = 0, c[8] = 0, c[12] = -f, c[1] = 0, c[5] = 2 * l, c[9] = 0, c[13] = -p, c[2] = 0, c[6] = 0, c[10] = g, c[14] = -d, c[3] = 0, c[7] = 0, c[11] = 0, c[15] = 1, this;
  }
  equals(t) {
    const e = this.elements, s = t.elements;
    for (let i = 0; i < 16; i++)
      if (e[i] !== s[i]) return !1;
    return !0;
  }
  fromArray(t, e = 0) {
    for (let s = 0; s < 16; s++)
      this.elements[s] = t[s + e];
    return this;
  }
  toArray(t = [], e = 0) {
    const s = this.elements;
    return t[e] = s[0], t[e + 1] = s[1], t[e + 2] = s[2], t[e + 3] = s[3], t[e + 4] = s[4], t[e + 5] = s[5], t[e + 6] = s[6], t[e + 7] = s[7], t[e + 8] = s[8], t[e + 9] = s[9], t[e + 10] = s[10], t[e + 11] = s[11], t[e + 12] = s[12], t[e + 13] = s[13], t[e + 14] = s[14], t[e + 15] = s[15], t;
  }
}
const Cn = /* @__PURE__ */ new E(), ne = /* @__PURE__ */ new mt(), gu = /* @__PURE__ */ new E(0, 0, 0), mu = /* @__PURE__ */ new E(1, 1, 1), Ue = /* @__PURE__ */ new E(), Ds = /* @__PURE__ */ new E(), Vt = /* @__PURE__ */ new E(), eo = /* @__PURE__ */ new mt(), no = /* @__PURE__ */ new dn();
class Ss {
  constructor(t = 0, e = 0, s = 0, i = Ss.DEFAULT_ORDER) {
    this.isEuler = !0, this._x = t, this._y = e, this._z = s, this._order = i;
  }
  get x() {
    return this._x;
  }
  set x(t) {
    this._x = t, this._onChangeCallback();
  }
  get y() {
    return this._y;
  }
  set y(t) {
    this._y = t, this._onChangeCallback();
  }
  get z() {
    return this._z;
  }
  set z(t) {
    this._z = t, this._onChangeCallback();
  }
  get order() {
    return this._order;
  }
  set order(t) {
    this._order = t, this._onChangeCallback();
  }
  set(t, e, s, i = this._order) {
    return this._x = t, this._y = e, this._z = s, this._order = i, this._onChangeCallback(), this;
  }
  clone() {
    return new this.constructor(this._x, this._y, this._z, this._order);
  }
  copy(t) {
    return this._x = t._x, this._y = t._y, this._z = t._z, this._order = t._order, this._onChangeCallback(), this;
  }
  setFromRotationMatrix(t, e = this._order, s = !0) {
    const i = t.elements, r = i[0], a = i[4], o = i[8], c = i[1], h = i[5], l = i[9], u = i[2], f = i[6], p = i[10];
    switch (e) {
      case "XYZ":
        this._y = Math.asin(Z(o, -1, 1)), Math.abs(o) < 0.9999999 ? (this._x = Math.atan2(-l, p), this._z = Math.atan2(-a, r)) : (this._x = Math.atan2(f, h), this._z = 0);
        break;
      case "YXZ":
        this._x = Math.asin(-Z(l, -1, 1)), Math.abs(l) < 0.9999999 ? (this._y = Math.atan2(o, p), this._z = Math.atan2(c, h)) : (this._y = Math.atan2(-u, r), this._z = 0);
        break;
      case "ZXY":
        this._x = Math.asin(Z(f, -1, 1)), Math.abs(f) < 0.9999999 ? (this._y = Math.atan2(-u, p), this._z = Math.atan2(-a, h)) : (this._y = 0, this._z = Math.atan2(c, r));
        break;
      case "ZYX":
        this._y = Math.asin(-Z(u, -1, 1)), Math.abs(u) < 0.9999999 ? (this._x = Math.atan2(f, p), this._z = Math.atan2(c, r)) : (this._x = 0, this._z = Math.atan2(-a, h));
        break;
      case "YZX":
        this._z = Math.asin(Z(c, -1, 1)), Math.abs(c) < 0.9999999 ? (this._x = Math.atan2(-l, h), this._y = Math.atan2(-u, r)) : (this._x = 0, this._y = Math.atan2(o, p));
        break;
      case "XZY":
        this._z = Math.asin(-Z(a, -1, 1)), Math.abs(a) < 0.9999999 ? (this._x = Math.atan2(f, h), this._y = Math.atan2(o, r)) : (this._x = Math.atan2(-l, p), this._y = 0);
        break;
      default:
        console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: " + e);
    }
    return this._order = e, s === !0 && this._onChangeCallback(), this;
  }
  setFromQuaternion(t, e, s) {
    return eo.makeRotationFromQuaternion(t), this.setFromRotationMatrix(eo, e, s);
  }
  setFromVector3(t, e = this._order) {
    return this.set(t.x, t.y, t.z, e);
  }
  reorder(t) {
    return no.setFromEuler(this), this.setFromQuaternion(no, t);
  }
  equals(t) {
    return t._x === this._x && t._y === this._y && t._z === this._z && t._order === this._order;
  }
  fromArray(t) {
    return this._x = t[0], this._y = t[1], this._z = t[2], t[3] !== void 0 && (this._order = t[3]), this._onChangeCallback(), this;
  }
  toArray(t = [], e = 0) {
    return t[e] = this._x, t[e + 1] = this._y, t[e + 2] = this._z, t[e + 3] = this._order, t;
  }
  _onChange(t) {
    return this._onChangeCallback = t, this;
  }
  _onChangeCallback() {
  }
  *[Symbol.iterator]() {
    yield this._x, yield this._y, yield this._z, yield this._order;
  }
}
Ss.DEFAULT_ORDER = "XYZ";
class yu {
  constructor() {
    this.mask = 1;
  }
  set(t) {
    this.mask = (1 << t | 0) >>> 0;
  }
  enable(t) {
    this.mask |= 1 << t | 0;
  }
  enableAll() {
    this.mask = -1;
  }
  toggle(t) {
    this.mask ^= 1 << t | 0;
  }
  disable(t) {
    this.mask &= ~(1 << t | 0);
  }
  disableAll() {
    this.mask = 0;
  }
  test(t) {
    return (this.mask & t.mask) !== 0;
  }
  isEnabled(t) {
    return (this.mask & (1 << t | 0)) !== 0;
  }
}
let xu = 0;
const so = /* @__PURE__ */ new E(), Tn = /* @__PURE__ */ new dn(), Te = /* @__PURE__ */ new mt(), Us = /* @__PURE__ */ new E(), Qn = /* @__PURE__ */ new E(), bu = /* @__PURE__ */ new E(), vu = /* @__PURE__ */ new dn(), io = /* @__PURE__ */ new E(1, 0, 0), ro = /* @__PURE__ */ new E(0, 1, 0), ao = /* @__PURE__ */ new E(0, 0, 1), oo = { type: "added" }, Su = { type: "removed" }, Fn = { type: "childadded", child: null }, tr = { type: "childremoved", child: null };
class jt extends Li {
  constructor() {
    super(), this.isObject3D = !0, Object.defineProperty(this, "id", { value: xu++ }), this.uuid = Xn(), this.name = "", this.type = "Object3D", this.parent = null, this.children = [], this.up = jt.DEFAULT_UP.clone();
    const t = new E(), e = new Ss(), s = new dn(), i = new E(1, 1, 1);
    function r() {
      s.setFromEuler(e, !1);
    }
    function a() {
      e.setFromQuaternion(s, void 0, !1);
    }
    e._onChange(r), s._onChange(a), Object.defineProperties(this, {
      position: {
        configurable: !0,
        enumerable: !0,
        value: t
      },
      rotation: {
        configurable: !0,
        enumerable: !0,
        value: e
      },
      quaternion: {
        configurable: !0,
        enumerable: !0,
        value: s
      },
      scale: {
        configurable: !0,
        enumerable: !0,
        value: i
      },
      modelViewMatrix: {
        value: new mt()
      },
      normalMatrix: {
        value: new Qe()
      }
    }), this.matrix = new mt(), this.matrixWorld = new mt(), this.matrixAutoUpdate = jt.DEFAULT_MATRIX_AUTO_UPDATE, this.matrixWorldAutoUpdate = jt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE, this.matrixWorldNeedsUpdate = !1, this.layers = new yu(), this.visible = !0, this.castShadow = !1, this.receiveShadow = !1, this.frustumCulled = !0, this.renderOrder = 0, this.animations = [], this.userData = {};
  }
  onBeforeShadow() {
  }
  onAfterShadow() {
  }
  onBeforeRender() {
  }
  onAfterRender() {
  }
  applyMatrix4(t) {
    this.matrixAutoUpdate && this.updateMatrix(), this.matrix.premultiply(t), this.matrix.decompose(this.position, this.quaternion, this.scale);
  }
  applyQuaternion(t) {
    return this.quaternion.premultiply(t), this;
  }
  setRotationFromAxisAngle(t, e) {
    this.quaternion.setFromAxisAngle(t, e);
  }
  setRotationFromEuler(t) {
    this.quaternion.setFromEuler(t, !0);
  }
  setRotationFromMatrix(t) {
    this.quaternion.setFromRotationMatrix(t);
  }
  setRotationFromQuaternion(t) {
    this.quaternion.copy(t);
  }
  rotateOnAxis(t, e) {
    return Tn.setFromAxisAngle(t, e), this.quaternion.multiply(Tn), this;
  }
  rotateOnWorldAxis(t, e) {
    return Tn.setFromAxisAngle(t, e), this.quaternion.premultiply(Tn), this;
  }
  rotateX(t) {
    return this.rotateOnAxis(io, t);
  }
  rotateY(t) {
    return this.rotateOnAxis(ro, t);
  }
  rotateZ(t) {
    return this.rotateOnAxis(ao, t);
  }
  translateOnAxis(t, e) {
    return so.copy(t).applyQuaternion(this.quaternion), this.position.add(so.multiplyScalar(e)), this;
  }
  translateX(t) {
    return this.translateOnAxis(io, t);
  }
  translateY(t) {
    return this.translateOnAxis(ro, t);
  }
  translateZ(t) {
    return this.translateOnAxis(ao, t);
  }
  localToWorld(t) {
    return this.updateWorldMatrix(!0, !1), t.applyMatrix4(this.matrixWorld);
  }
  worldToLocal(t) {
    return this.updateWorldMatrix(!0, !1), t.applyMatrix4(Te.copy(this.matrixWorld).invert());
  }
  lookAt(t, e, s) {
    t.isVector3 ? Us.copy(t) : Us.set(t, e, s);
    const i = this.parent;
    this.updateWorldMatrix(!0, !1), Qn.setFromMatrixPosition(this.matrixWorld), this.isCamera || this.isLight ? Te.lookAt(Qn, Us, this.up) : Te.lookAt(Us, Qn, this.up), this.quaternion.setFromRotationMatrix(Te), i && (Te.extractRotation(i.matrixWorld), Tn.setFromRotationMatrix(Te), this.quaternion.premultiply(Tn.invert()));
  }
  add(t) {
    if (arguments.length > 1) {
      for (let e = 0; e < arguments.length; e++)
        this.add(arguments[e]);
      return this;
    }
    return t === this ? (console.error("THREE.Object3D.add: object can't be added as a child of itself.", t), this) : (t && t.isObject3D ? (t.removeFromParent(), t.parent = this, this.children.push(t), t.dispatchEvent(oo), Fn.child = t, this.dispatchEvent(Fn), Fn.child = null) : console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.", t), this);
  }
  remove(t) {
    if (arguments.length > 1) {
      for (let s = 0; s < arguments.length; s++)
        this.remove(arguments[s]);
      return this;
    }
    const e = this.children.indexOf(t);
    return e !== -1 && (t.parent = null, this.children.splice(e, 1), t.dispatchEvent(Su), tr.child = t, this.dispatchEvent(tr), tr.child = null), this;
  }
  removeFromParent() {
    const t = this.parent;
    return t !== null && t.remove(this), this;
  }
  clear() {
    return this.remove(...this.children);
  }
  attach(t) {
    return this.updateWorldMatrix(!0, !1), Te.copy(this.matrixWorld).invert(), t.parent !== null && (t.parent.updateWorldMatrix(!0, !1), Te.multiply(t.parent.matrixWorld)), t.applyMatrix4(Te), t.removeFromParent(), t.parent = this, this.children.push(t), t.updateWorldMatrix(!1, !0), t.dispatchEvent(oo), Fn.child = t, this.dispatchEvent(Fn), Fn.child = null, this;
  }
  getObjectById(t) {
    return this.getObjectByProperty("id", t);
  }
  getObjectByName(t) {
    return this.getObjectByProperty("name", t);
  }
  getObjectByProperty(t, e) {
    if (this[t] === e) return this;
    for (let s = 0, i = this.children.length; s < i; s++) {
      const a = this.children[s].getObjectByProperty(t, e);
      if (a !== void 0)
        return a;
    }
  }
  getObjectsByProperty(t, e, s = []) {
    this[t] === e && s.push(this);
    const i = this.children;
    for (let r = 0, a = i.length; r < a; r++)
      i[r].getObjectsByProperty(t, e, s);
    return s;
  }
  getWorldPosition(t) {
    return this.updateWorldMatrix(!0, !1), t.setFromMatrixPosition(this.matrixWorld);
  }
  getWorldQuaternion(t) {
    return this.updateWorldMatrix(!0, !1), this.matrixWorld.decompose(Qn, t, bu), t;
  }
  getWorldScale(t) {
    return this.updateWorldMatrix(!0, !1), this.matrixWorld.decompose(Qn, vu, t), t;
  }
  getWorldDirection(t) {
    this.updateWorldMatrix(!0, !1);
    const e = this.matrixWorld.elements;
    return t.set(e[8], e[9], e[10]).normalize();
  }
  raycast() {
  }
  traverse(t) {
    t(this);
    const e = this.children;
    for (let s = 0, i = e.length; s < i; s++)
      e[s].traverse(t);
  }
  traverseVisible(t) {
    if (this.visible === !1) return;
    t(this);
    const e = this.children;
    for (let s = 0, i = e.length; s < i; s++)
      e[s].traverseVisible(t);
  }
  traverseAncestors(t) {
    const e = this.parent;
    e !== null && (t(e), e.traverseAncestors(t));
  }
  updateMatrix() {
    this.matrix.compose(this.position, this.quaternion, this.scale), this.matrixWorldNeedsUpdate = !0;
  }
  updateMatrixWorld(t) {
    this.matrixAutoUpdate && this.updateMatrix(), (this.matrixWorldNeedsUpdate || t) && (this.matrixWorldAutoUpdate === !0 && (this.parent === null ? this.matrixWorld.copy(this.matrix) : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)), this.matrixWorldNeedsUpdate = !1, t = !0);
    const e = this.children;
    for (let s = 0, i = e.length; s < i; s++)
      e[s].updateMatrixWorld(t);
  }
  updateWorldMatrix(t, e) {
    const s = this.parent;
    if (t === !0 && s !== null && s.updateWorldMatrix(!0, !1), this.matrixAutoUpdate && this.updateMatrix(), this.matrixWorldAutoUpdate === !0 && (this.parent === null ? this.matrixWorld.copy(this.matrix) : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)), e === !0) {
      const i = this.children;
      for (let r = 0, a = i.length; r < a; r++)
        i[r].updateWorldMatrix(!1, !0);
    }
  }
  toJSON(t) {
    const e = t === void 0 || typeof t == "string", s = {};
    e && (t = {
      geometries: {},
      materials: {},
      textures: {},
      images: {},
      shapes: {},
      skeletons: {},
      animations: {},
      nodes: {}
    }, s.metadata = {
      version: 4.6,
      type: "Object",
      generator: "Object3D.toJSON"
    });
    const i = {};
    i.uuid = this.uuid, i.type = this.type, this.name !== "" && (i.name = this.name), this.castShadow === !0 && (i.castShadow = !0), this.receiveShadow === !0 && (i.receiveShadow = !0), this.visible === !1 && (i.visible = !1), this.frustumCulled === !1 && (i.frustumCulled = !1), this.renderOrder !== 0 && (i.renderOrder = this.renderOrder), Object.keys(this.userData).length > 0 && (i.userData = this.userData), i.layers = this.layers.mask, i.matrix = this.matrix.toArray(), i.up = this.up.toArray(), this.matrixAutoUpdate === !1 && (i.matrixAutoUpdate = !1), this.isInstancedMesh && (i.type = "InstancedMesh", i.count = this.count, i.instanceMatrix = this.instanceMatrix.toJSON(), this.instanceColor !== null && (i.instanceColor = this.instanceColor.toJSON())), this.isBatchedMesh && (i.type = "BatchedMesh", i.perObjectFrustumCulled = this.perObjectFrustumCulled, i.sortObjects = this.sortObjects, i.drawRanges = this._drawRanges, i.reservedRanges = this._reservedRanges, i.visibility = this._visibility, i.active = this._active, i.bounds = this._bounds.map((o) => ({
      boxInitialized: o.boxInitialized,
      boxMin: o.box.min.toArray(),
      boxMax: o.box.max.toArray(),
      sphereInitialized: o.sphereInitialized,
      sphereRadius: o.sphere.radius,
      sphereCenter: o.sphere.center.toArray()
    })), i.maxInstanceCount = this._maxInstanceCount, i.maxVertexCount = this._maxVertexCount, i.maxIndexCount = this._maxIndexCount, i.geometryInitialized = this._geometryInitialized, i.geometryCount = this._geometryCount, i.matricesTexture = this._matricesTexture.toJSON(t), this._colorsTexture !== null && (i.colorsTexture = this._colorsTexture.toJSON(t)), this.boundingSphere !== null && (i.boundingSphere = {
      center: i.boundingSphere.center.toArray(),
      radius: i.boundingSphere.radius
    }), this.boundingBox !== null && (i.boundingBox = {
      min: i.boundingBox.min.toArray(),
      max: i.boundingBox.max.toArray()
    }));
    function r(o, c) {
      return o[c.uuid] === void 0 && (o[c.uuid] = c.toJSON(t)), c.uuid;
    }
    if (this.isScene)
      this.background && (this.background.isColor ? i.background = this.background.toJSON() : this.background.isTexture && (i.background = this.background.toJSON(t).uuid)), this.environment && this.environment.isTexture && this.environment.isRenderTargetTexture !== !0 && (i.environment = this.environment.toJSON(t).uuid);
    else if (this.isMesh || this.isLine || this.isPoints) {
      i.geometry = r(t.geometries, this.geometry);
      const o = this.geometry.parameters;
      if (o !== void 0 && o.shapes !== void 0) {
        const c = o.shapes;
        if (Array.isArray(c))
          for (let h = 0, l = c.length; h < l; h++) {
            const u = c[h];
            r(t.shapes, u);
          }
        else
          r(t.shapes, c);
      }
    }
    if (this.isSkinnedMesh && (i.bindMode = this.bindMode, i.bindMatrix = this.bindMatrix.toArray(), this.skeleton !== void 0 && (r(t.skeletons, this.skeleton), i.skeleton = this.skeleton.uuid)), this.material !== void 0)
      if (Array.isArray(this.material)) {
        const o = [];
        for (let c = 0, h = this.material.length; c < h; c++)
          o.push(r(t.materials, this.material[c]));
        i.material = o;
      } else
        i.material = r(t.materials, this.material);
    if (this.children.length > 0) {
      i.children = [];
      for (let o = 0; o < this.children.length; o++)
        i.children.push(this.children[o].toJSON(t).object);
    }
    if (this.animations.length > 0) {
      i.animations = [];
      for (let o = 0; o < this.animations.length; o++) {
        const c = this.animations[o];
        i.animations.push(r(t.animations, c));
      }
    }
    if (e) {
      const o = a(t.geometries), c = a(t.materials), h = a(t.textures), l = a(t.images), u = a(t.shapes), f = a(t.skeletons), p = a(t.animations), d = a(t.nodes);
      o.length > 0 && (s.geometries = o), c.length > 0 && (s.materials = c), h.length > 0 && (s.textures = h), l.length > 0 && (s.images = l), u.length > 0 && (s.shapes = u), f.length > 0 && (s.skeletons = f), p.length > 0 && (s.animations = p), d.length > 0 && (s.nodes = d);
    }
    return s.object = i, s;
    function a(o) {
      const c = [];
      for (const h in o) {
        const l = o[h];
        delete l.metadata, c.push(l);
      }
      return c;
    }
  }
  clone(t) {
    return new this.constructor().copy(this, t);
  }
  copy(t, e = !0) {
    if (this.name = t.name, this.up.copy(t.up), this.position.copy(t.position), this.rotation.order = t.rotation.order, this.quaternion.copy(t.quaternion), this.scale.copy(t.scale), this.matrix.copy(t.matrix), this.matrixWorld.copy(t.matrixWorld), this.matrixAutoUpdate = t.matrixAutoUpdate, this.matrixWorldAutoUpdate = t.matrixWorldAutoUpdate, this.matrixWorldNeedsUpdate = t.matrixWorldNeedsUpdate, this.layers.mask = t.layers.mask, this.visible = t.visible, this.castShadow = t.castShadow, this.receiveShadow = t.receiveShadow, this.frustumCulled = t.frustumCulled, this.renderOrder = t.renderOrder, this.animations = t.animations.slice(), this.userData = JSON.parse(JSON.stringify(t.userData)), e === !0)
      for (let s = 0; s < t.children.length; s++) {
        const i = t.children[s];
        this.add(i.clone());
      }
    return this;
  }
}
jt.DEFAULT_UP = /* @__PURE__ */ new E(0, 1, 0);
jt.DEFAULT_MATRIX_AUTO_UPDATE = !0;
jt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = !0;
const se = /* @__PURE__ */ new E(), Fe = /* @__PURE__ */ new E(), er = /* @__PURE__ */ new E(), Ae = /* @__PURE__ */ new E(), An = /* @__PURE__ */ new E(), kn = /* @__PURE__ */ new E(), co = /* @__PURE__ */ new E(), nr = /* @__PURE__ */ new E(), sr = /* @__PURE__ */ new E(), ir = /* @__PURE__ */ new E(), rr = /* @__PURE__ */ new vs(), ar = /* @__PURE__ */ new vs(), or = /* @__PURE__ */ new vs();
class oe {
  constructor(t = new E(), e = new E(), s = new E()) {
    this.a = t, this.b = e, this.c = s;
  }
  static getNormal(t, e, s, i) {
    i.subVectors(s, e), se.subVectors(t, e), i.cross(se);
    const r = i.lengthSq();
    return r > 0 ? i.multiplyScalar(1 / Math.sqrt(r)) : i.set(0, 0, 0);
  }
  // static/instance method to calculate barycentric coordinates
  // based on: http://www.blackpawn.com/texts/pointinpoly/default.html
  static getBarycoord(t, e, s, i, r) {
    se.subVectors(i, e), Fe.subVectors(s, e), er.subVectors(t, e);
    const a = se.dot(se), o = se.dot(Fe), c = se.dot(er), h = Fe.dot(Fe), l = Fe.dot(er), u = a * h - o * o;
    if (u === 0)
      return r.set(0, 0, 0), null;
    const f = 1 / u, p = (h * c - o * l) * f, d = (a * l - o * c) * f;
    return r.set(1 - p - d, d, p);
  }
  static containsPoint(t, e, s, i) {
    return this.getBarycoord(t, e, s, i, Ae) === null ? !1 : Ae.x >= 0 && Ae.y >= 0 && Ae.x + Ae.y <= 1;
  }
  static getInterpolation(t, e, s, i, r, a, o, c) {
    return this.getBarycoord(t, e, s, i, Ae) === null ? (c.x = 0, c.y = 0, "z" in c && (c.z = 0), "w" in c && (c.w = 0), null) : (c.setScalar(0), c.addScaledVector(r, Ae.x), c.addScaledVector(a, Ae.y), c.addScaledVector(o, Ae.z), c);
  }
  static getInterpolatedAttribute(t, e, s, i, r, a) {
    return rr.setScalar(0), ar.setScalar(0), or.setScalar(0), rr.fromBufferAttribute(t, e), ar.fromBufferAttribute(t, s), or.fromBufferAttribute(t, i), a.setScalar(0), a.addScaledVector(rr, r.x), a.addScaledVector(ar, r.y), a.addScaledVector(or, r.z), a;
  }
  static isFrontFacing(t, e, s, i) {
    return se.subVectors(s, e), Fe.subVectors(t, e), se.cross(Fe).dot(i) < 0;
  }
  set(t, e, s) {
    return this.a.copy(t), this.b.copy(e), this.c.copy(s), this;
  }
  setFromPointsAndIndices(t, e, s, i) {
    return this.a.copy(t[e]), this.b.copy(t[s]), this.c.copy(t[i]), this;
  }
  setFromAttributeAndIndices(t, e, s, i) {
    return this.a.fromBufferAttribute(t, e), this.b.fromBufferAttribute(t, s), this.c.fromBufferAttribute(t, i), this;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(t) {
    return this.a.copy(t.a), this.b.copy(t.b), this.c.copy(t.c), this;
  }
  getArea() {
    return se.subVectors(this.c, this.b), Fe.subVectors(this.a, this.b), se.cross(Fe).length() * 0.5;
  }
  getMidpoint(t) {
    return t.addVectors(this.a, this.b).add(this.c).multiplyScalar(1 / 3);
  }
  getNormal(t) {
    return oe.getNormal(this.a, this.b, this.c, t);
  }
  getPlane(t) {
    return t.setFromCoplanarPoints(this.a, this.b, this.c);
  }
  getBarycoord(t, e) {
    return oe.getBarycoord(t, this.a, this.b, this.c, e);
  }
  getInterpolation(t, e, s, i, r) {
    return oe.getInterpolation(t, this.a, this.b, this.c, e, s, i, r);
  }
  containsPoint(t) {
    return oe.containsPoint(t, this.a, this.b, this.c);
  }
  isFrontFacing(t) {
    return oe.isFrontFacing(this.a, this.b, this.c, t);
  }
  intersectsBox(t) {
    return t.intersectsTriangle(this);
  }
  closestPointToPoint(t, e) {
    const s = this.a, i = this.b, r = this.c;
    let a, o;
    An.subVectors(i, s), kn.subVectors(r, s), nr.subVectors(t, s);
    const c = An.dot(nr), h = kn.dot(nr);
    if (c <= 0 && h <= 0)
      return e.copy(s);
    sr.subVectors(t, i);
    const l = An.dot(sr), u = kn.dot(sr);
    if (l >= 0 && u <= l)
      return e.copy(i);
    const f = c * u - l * h;
    if (f <= 0 && c >= 0 && l <= 0)
      return a = c / (c - l), e.copy(s).addScaledVector(An, a);
    ir.subVectors(t, r);
    const p = An.dot(ir), d = kn.dot(ir);
    if (d >= 0 && p <= d)
      return e.copy(r);
    const g = p * h - c * d;
    if (g <= 0 && h >= 0 && d <= 0)
      return o = h / (h - d), e.copy(s).addScaledVector(kn, o);
    const x = l * d - p * u;
    if (x <= 0 && u - l >= 0 && p - d >= 0)
      return co.subVectors(r, i), o = (u - l) / (u - l + (p - d)), e.copy(i).addScaledVector(co, o);
    const b = 1 / (x + g + f);
    return a = g * b, o = f * b, e.copy(s).addScaledVector(An, a).addScaledVector(kn, o);
  }
  equals(t) {
    return t.a.equals(this.a) && t.b.equals(this.b) && t.c.equals(this.c);
  }
}
const hh = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
}, Pe = { h: 0, s: 0, l: 0 }, Ps = { h: 0, s: 0, l: 0 };
function cr(n, t, e) {
  return e < 0 && (e += 1), e > 1 && (e -= 1), e < 1 / 6 ? n + (t - n) * 6 * e : e < 1 / 2 ? t : e < 2 / 3 ? n + (t - n) * 6 * (2 / 3 - e) : n;
}
class Yn {
  constructor(t, e, s) {
    return this.isColor = !0, this.r = 1, this.g = 1, this.b = 1, this.set(t, e, s);
  }
  set(t, e, s) {
    if (e === void 0 && s === void 0) {
      const i = t;
      i && i.isColor ? this.copy(i) : typeof i == "number" ? this.setHex(i) : typeof i == "string" && this.setStyle(i);
    } else
      this.setRGB(t, e, s);
    return this;
  }
  setScalar(t) {
    return this.r = t, this.g = t, this.b = t, this;
  }
  setHex(t, e = ie) {
    return t = Math.floor(t), this.r = (t >> 16 & 255) / 255, this.g = (t >> 8 & 255) / 255, this.b = (t & 255) / 255, te.toWorkingColorSpace(this, e), this;
  }
  setRGB(t, e, s, i = te.workingColorSpace) {
    return this.r = t, this.g = e, this.b = s, te.toWorkingColorSpace(this, i), this;
  }
  setHSL(t, e, s, i = te.workingColorSpace) {
    if (t = ou(t, 1), e = Z(e, 0, 1), s = Z(s, 0, 1), e === 0)
      this.r = this.g = this.b = s;
    else {
      const r = s <= 0.5 ? s * (1 + e) : s + e - s * e, a = 2 * s - r;
      this.r = cr(a, r, t + 1 / 3), this.g = cr(a, r, t), this.b = cr(a, r, t - 1 / 3);
    }
    return te.toWorkingColorSpace(this, i), this;
  }
  setStyle(t, e = ie) {
    function s(r) {
      r !== void 0 && parseFloat(r) < 1 && console.warn("THREE.Color: Alpha component of " + t + " will be ignored.");
    }
    let i;
    if (i = /^(\w+)\(([^\)]*)\)/.exec(t)) {
      let r;
      const a = i[1], o = i[2];
      switch (a) {
        case "rgb":
        case "rgba":
          if (r = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))
            return s(r[4]), this.setRGB(
              Math.min(255, parseInt(r[1], 10)) / 255,
              Math.min(255, parseInt(r[2], 10)) / 255,
              Math.min(255, parseInt(r[3], 10)) / 255,
              e
            );
          if (r = /^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))
            return s(r[4]), this.setRGB(
              Math.min(100, parseInt(r[1], 10)) / 100,
              Math.min(100, parseInt(r[2], 10)) / 100,
              Math.min(100, parseInt(r[3], 10)) / 100,
              e
            );
          break;
        case "hsl":
        case "hsla":
          if (r = /^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))
            return s(r[4]), this.setHSL(
              parseFloat(r[1]) / 360,
              parseFloat(r[2]) / 100,
              parseFloat(r[3]) / 100,
              e
            );
          break;
        default:
          console.warn("THREE.Color: Unknown color model " + t);
      }
    } else if (i = /^\#([A-Fa-f\d]+)$/.exec(t)) {
      const r = i[1], a = r.length;
      if (a === 3)
        return this.setRGB(
          parseInt(r.charAt(0), 16) / 15,
          parseInt(r.charAt(1), 16) / 15,
          parseInt(r.charAt(2), 16) / 15,
          e
        );
      if (a === 6)
        return this.setHex(parseInt(r, 16), e);
      console.warn("THREE.Color: Invalid hex color " + t);
    } else if (t && t.length > 0)
      return this.setColorName(t, e);
    return this;
  }
  setColorName(t, e = ie) {
    const s = hh[t.toLowerCase()];
    return s !== void 0 ? this.setHex(s, e) : console.warn("THREE.Color: Unknown color " + t), this;
  }
  clone() {
    return new this.constructor(this.r, this.g, this.b);
  }
  copy(t) {
    return this.r = t.r, this.g = t.g, this.b = t.b, this;
  }
  copySRGBToLinear(t) {
    return this.r = Le(t.r), this.g = Le(t.g), this.b = Le(t.b), this;
  }
  copyLinearToSRGB(t) {
    return this.r = Bn(t.r), this.g = Bn(t.g), this.b = Bn(t.b), this;
  }
  convertSRGBToLinear() {
    return this.copySRGBToLinear(this), this;
  }
  convertLinearToSRGB() {
    return this.copyLinearToSRGB(this), this;
  }
  getHex(t = ie) {
    return te.fromWorkingColorSpace(_t.copy(this), t), Math.round(Z(_t.r * 255, 0, 255)) * 65536 + Math.round(Z(_t.g * 255, 0, 255)) * 256 + Math.round(Z(_t.b * 255, 0, 255));
  }
  getHexString(t = ie) {
    return ("000000" + this.getHex(t).toString(16)).slice(-6);
  }
  getHSL(t, e = te.workingColorSpace) {
    te.fromWorkingColorSpace(_t.copy(this), e);
    const s = _t.r, i = _t.g, r = _t.b, a = Math.max(s, i, r), o = Math.min(s, i, r);
    let c, h;
    const l = (o + a) / 2;
    if (o === a)
      c = 0, h = 0;
    else {
      const u = a - o;
      switch (h = l <= 0.5 ? u / (a + o) : u / (2 - a - o), a) {
        case s:
          c = (i - r) / u + (i < r ? 6 : 0);
          break;
        case i:
          c = (r - s) / u + 2;
          break;
        case r:
          c = (s - i) / u + 4;
          break;
      }
      c /= 6;
    }
    return t.h = c, t.s = h, t.l = l, t;
  }
  getRGB(t, e = te.workingColorSpace) {
    return te.fromWorkingColorSpace(_t.copy(this), e), t.r = _t.r, t.g = _t.g, t.b = _t.b, t;
  }
  getStyle(t = ie) {
    te.fromWorkingColorSpace(_t.copy(this), t);
    const e = _t.r, s = _t.g, i = _t.b;
    return t !== ie ? `color(${t} ${e.toFixed(3)} ${s.toFixed(3)} ${i.toFixed(3)})` : `rgb(${Math.round(e * 255)},${Math.round(s * 255)},${Math.round(i * 255)})`;
  }
  offsetHSL(t, e, s) {
    return this.getHSL(Pe), this.setHSL(Pe.h + t, Pe.s + e, Pe.l + s);
  }
  add(t) {
    return this.r += t.r, this.g += t.g, this.b += t.b, this;
  }
  addColors(t, e) {
    return this.r = t.r + e.r, this.g = t.g + e.g, this.b = t.b + e.b, this;
  }
  addScalar(t) {
    return this.r += t, this.g += t, this.b += t, this;
  }
  sub(t) {
    return this.r = Math.max(0, this.r - t.r), this.g = Math.max(0, this.g - t.g), this.b = Math.max(0, this.b - t.b), this;
  }
  multiply(t) {
    return this.r *= t.r, this.g *= t.g, this.b *= t.b, this;
  }
  multiplyScalar(t) {
    return this.r *= t, this.g *= t, this.b *= t, this;
  }
  lerp(t, e) {
    return this.r += (t.r - this.r) * e, this.g += (t.g - this.g) * e, this.b += (t.b - this.b) * e, this;
  }
  lerpColors(t, e, s) {
    return this.r = t.r + (e.r - t.r) * s, this.g = t.g + (e.g - t.g) * s, this.b = t.b + (e.b - t.b) * s, this;
  }
  lerpHSL(t, e) {
    this.getHSL(Pe), t.getHSL(Ps);
    const s = qi(Pe.h, Ps.h, e), i = qi(Pe.s, Ps.s, e), r = qi(Pe.l, Ps.l, e);
    return this.setHSL(s, i, r), this;
  }
  setFromVector3(t) {
    return this.r = t.x, this.g = t.y, this.b = t.z, this;
  }
  applyMatrix3(t) {
    const e = this.r, s = this.g, i = this.b, r = t.elements;
    return this.r = r[0] * e + r[3] * s + r[6] * i, this.g = r[1] * e + r[4] * s + r[7] * i, this.b = r[2] * e + r[5] * s + r[8] * i, this;
  }
  equals(t) {
    return t.r === this.r && t.g === this.g && t.b === this.b;
  }
  fromArray(t, e = 0) {
    return this.r = t[e], this.g = t[e + 1], this.b = t[e + 2], this;
  }
  toArray(t = [], e = 0) {
    return t[e] = this.r, t[e + 1] = this.g, t[e + 2] = this.b, t;
  }
  fromBufferAttribute(t, e) {
    return this.r = t.getX(e), this.g = t.getY(e), this.b = t.getZ(e), this;
  }
  toJSON() {
    return this.getHex();
  }
  *[Symbol.iterator]() {
    yield this.r, yield this.g, yield this.b;
  }
}
const _t = /* @__PURE__ */ new Yn();
Yn.NAMES = hh;
let wu = 0;
class lh extends Li {
  constructor() {
    super(), this.isMaterial = !0, Object.defineProperty(this, "id", { value: wu++ }), this.uuid = Xn(), this.name = "", this.type = "Material", this.blending = Na, this.side = Gr, this.vertexColors = !1, this.opacity = 1, this.transparent = !1, this.alphaHash = !1, this.blendSrc = Ha, this.blendDst = Ga, this.blendEquation = za, this.blendSrcAlpha = null, this.blendDstAlpha = null, this.blendEquationAlpha = null, this.blendColor = new Yn(0, 0, 0), this.blendAlpha = 0, this.depthFunc = Va, this.depthTest = !0, this.depthWrite = !0, this.stencilWriteMask = 255, this.stencilFunc = Ya, this.stencilRef = 0, this.stencilFuncMask = 255, this.stencilFail = xn, this.stencilZFail = xn, this.stencilZPass = xn, this.stencilWrite = !1, this.clippingPlanes = null, this.clipIntersection = !1, this.clipShadows = !1, this.shadowSide = null, this.colorWrite = !0, this.precision = null, this.polygonOffset = !1, this.polygonOffsetFactor = 0, this.polygonOffsetUnits = 0, this.dithering = !1, this.alphaToCoverage = !1, this.premultipliedAlpha = !1, this.forceSinglePass = !1, this.visible = !0, this.toneMapped = !0, this.userData = {}, this.version = 0, this._alphaTest = 0;
  }
  get alphaTest() {
    return this._alphaTest;
  }
  set alphaTest(t) {
    this._alphaTest > 0 != t > 0 && this.version++, this._alphaTest = t;
  }
  // onBeforeRender and onBeforeCompile only supported in WebGLRenderer
  onBeforeRender() {
  }
  onBeforeCompile() {
  }
  customProgramCacheKey() {
    return this.onBeforeCompile.toString();
  }
  setValues(t) {
    if (t !== void 0)
      for (const e in t) {
        const s = t[e];
        if (s === void 0) {
          console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);
          continue;
        }
        const i = this[e];
        if (i === void 0) {
          console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);
          continue;
        }
        i && i.isColor ? i.set(s) : i && i.isVector3 && s && s.isVector3 ? i.copy(s) : this[e] = s;
      }
  }
  toJSON(t) {
    const e = t === void 0 || typeof t == "string";
    e && (t = {
      textures: {},
      images: {}
    });
    const s = {
      metadata: {
        version: 4.6,
        type: "Material",
        generator: "Material.toJSON"
      }
    };
    s.uuid = this.uuid, s.type = this.type, this.name !== "" && (s.name = this.name), this.color && this.color.isColor && (s.color = this.color.getHex()), this.roughness !== void 0 && (s.roughness = this.roughness), this.metalness !== void 0 && (s.metalness = this.metalness), this.sheen !== void 0 && (s.sheen = this.sheen), this.sheenColor && this.sheenColor.isColor && (s.sheenColor = this.sheenColor.getHex()), this.sheenRoughness !== void 0 && (s.sheenRoughness = this.sheenRoughness), this.emissive && this.emissive.isColor && (s.emissive = this.emissive.getHex()), this.emissiveIntensity !== void 0 && this.emissiveIntensity !== 1 && (s.emissiveIntensity = this.emissiveIntensity), this.specular && this.specular.isColor && (s.specular = this.specular.getHex()), this.specularIntensity !== void 0 && (s.specularIntensity = this.specularIntensity), this.specularColor && this.specularColor.isColor && (s.specularColor = this.specularColor.getHex()), this.shininess !== void 0 && (s.shininess = this.shininess), this.clearcoat !== void 0 && (s.clearcoat = this.clearcoat), this.clearcoatRoughness !== void 0 && (s.clearcoatRoughness = this.clearcoatRoughness), this.clearcoatMap && this.clearcoatMap.isTexture && (s.clearcoatMap = this.clearcoatMap.toJSON(t).uuid), this.clearcoatRoughnessMap && this.clearcoatRoughnessMap.isTexture && (s.clearcoatRoughnessMap = this.clearcoatRoughnessMap.toJSON(t).uuid), this.clearcoatNormalMap && this.clearcoatNormalMap.isTexture && (s.clearcoatNormalMap = this.clearcoatNormalMap.toJSON(t).uuid, s.clearcoatNormalScale = this.clearcoatNormalScale.toArray()), this.dispersion !== void 0 && (s.dispersion = this.dispersion), this.iridescence !== void 0 && (s.iridescence = this.iridescence), this.iridescenceIOR !== void 0 && (s.iridescenceIOR = this.iridescenceIOR), this.iridescenceThicknessRange !== void 0 && (s.iridescenceThicknessRange = this.iridescenceThicknessRange), this.iridescenceMap && this.iridescenceMap.isTexture && (s.iridescenceMap = this.iridescenceMap.toJSON(t).uuid), this.iridescenceThicknessMap && this.iridescenceThicknessMap.isTexture && (s.iridescenceThicknessMap = this.iridescenceThicknessMap.toJSON(t).uuid), this.anisotropy !== void 0 && (s.anisotropy = this.anisotropy), this.anisotropyRotation !== void 0 && (s.anisotropyRotation = this.anisotropyRotation), this.anisotropyMap && this.anisotropyMap.isTexture && (s.anisotropyMap = this.anisotropyMap.toJSON(t).uuid), this.map && this.map.isTexture && (s.map = this.map.toJSON(t).uuid), this.matcap && this.matcap.isTexture && (s.matcap = this.matcap.toJSON(t).uuid), this.alphaMap && this.alphaMap.isTexture && (s.alphaMap = this.alphaMap.toJSON(t).uuid), this.lightMap && this.lightMap.isTexture && (s.lightMap = this.lightMap.toJSON(t).uuid, s.lightMapIntensity = this.lightMapIntensity), this.aoMap && this.aoMap.isTexture && (s.aoMap = this.aoMap.toJSON(t).uuid, s.aoMapIntensity = this.aoMapIntensity), this.bumpMap && this.bumpMap.isTexture && (s.bumpMap = this.bumpMap.toJSON(t).uuid, s.bumpScale = this.bumpScale), this.normalMap && this.normalMap.isTexture && (s.normalMap = this.normalMap.toJSON(t).uuid, s.normalMapType = this.normalMapType, s.normalScale = this.normalScale.toArray()), this.displacementMap && this.displacementMap.isTexture && (s.displacementMap = this.displacementMap.toJSON(t).uuid, s.displacementScale = this.displacementScale, s.displacementBias = this.displacementBias), this.roughnessMap && this.roughnessMap.isTexture && (s.roughnessMap = this.roughnessMap.toJSON(t).uuid), this.metalnessMap && this.metalnessMap.isTexture && (s.metalnessMap = this.metalnessMap.toJSON(t).uuid), this.emissiveMap && this.emissiveMap.isTexture && (s.emissiveMap = this.emissiveMap.toJSON(t).uuid), this.specularMap && this.specularMap.isTexture && (s.specularMap = this.specularMap.toJSON(t).uuid), this.specularIntensityMap && this.specularIntensityMap.isTexture && (s.specularIntensityMap = this.specularIntensityMap.toJSON(t).uuid), this.specularColorMap && this.specularColorMap.isTexture && (s.specularColorMap = this.specularColorMap.toJSON(t).uuid), this.envMap && this.envMap.isTexture && (s.envMap = this.envMap.toJSON(t).uuid, this.combine !== void 0 && (s.combine = this.combine)), this.envMapRotation !== void 0 && (s.envMapRotation = this.envMapRotation.toArray()), this.envMapIntensity !== void 0 && (s.envMapIntensity = this.envMapIntensity), this.reflectivity !== void 0 && (s.reflectivity = this.reflectivity), this.refractionRatio !== void 0 && (s.refractionRatio = this.refractionRatio), this.gradientMap && this.gradientMap.isTexture && (s.gradientMap = this.gradientMap.toJSON(t).uuid), this.transmission !== void 0 && (s.transmission = this.transmission), this.transmissionMap && this.transmissionMap.isTexture && (s.transmissionMap = this.transmissionMap.toJSON(t).uuid), this.thickness !== void 0 && (s.thickness = this.thickness), this.thicknessMap && this.thicknessMap.isTexture && (s.thicknessMap = this.thicknessMap.toJSON(t).uuid), this.attenuationDistance !== void 0 && this.attenuationDistance !== 1 / 0 && (s.attenuationDistance = this.attenuationDistance), this.attenuationColor !== void 0 && (s.attenuationColor = this.attenuationColor.getHex()), this.size !== void 0 && (s.size = this.size), this.shadowSide !== null && (s.shadowSide = this.shadowSide), this.sizeAttenuation !== void 0 && (s.sizeAttenuation = this.sizeAttenuation), this.blending !== Na && (s.blending = this.blending), this.side !== Gr && (s.side = this.side), this.vertexColors === !0 && (s.vertexColors = !0), this.opacity < 1 && (s.opacity = this.opacity), this.transparent === !0 && (s.transparent = !0), this.blendSrc !== Ha && (s.blendSrc = this.blendSrc), this.blendDst !== Ga && (s.blendDst = this.blendDst), this.blendEquation !== za && (s.blendEquation = this.blendEquation), this.blendSrcAlpha !== null && (s.blendSrcAlpha = this.blendSrcAlpha), this.blendDstAlpha !== null && (s.blendDstAlpha = this.blendDstAlpha), this.blendEquationAlpha !== null && (s.blendEquationAlpha = this.blendEquationAlpha), this.blendColor && this.blendColor.isColor && (s.blendColor = this.blendColor.getHex()), this.blendAlpha !== 0 && (s.blendAlpha = this.blendAlpha), this.depthFunc !== Va && (s.depthFunc = this.depthFunc), this.depthTest === !1 && (s.depthTest = this.depthTest), this.depthWrite === !1 && (s.depthWrite = this.depthWrite), this.colorWrite === !1 && (s.colorWrite = this.colorWrite), this.stencilWriteMask !== 255 && (s.stencilWriteMask = this.stencilWriteMask), this.stencilFunc !== Ya && (s.stencilFunc = this.stencilFunc), this.stencilRef !== 0 && (s.stencilRef = this.stencilRef), this.stencilFuncMask !== 255 && (s.stencilFuncMask = this.stencilFuncMask), this.stencilFail !== xn && (s.stencilFail = this.stencilFail), this.stencilZFail !== xn && (s.stencilZFail = this.stencilZFail), this.stencilZPass !== xn && (s.stencilZPass = this.stencilZPass), this.stencilWrite === !0 && (s.stencilWrite = this.stencilWrite), this.rotation !== void 0 && this.rotation !== 0 && (s.rotation = this.rotation), this.polygonOffset === !0 && (s.polygonOffset = !0), this.polygonOffsetFactor !== 0 && (s.polygonOffsetFactor = this.polygonOffsetFactor), this.polygonOffsetUnits !== 0 && (s.polygonOffsetUnits = this.polygonOffsetUnits), this.linewidth !== void 0 && this.linewidth !== 1 && (s.linewidth = this.linewidth), this.dashSize !== void 0 && (s.dashSize = this.dashSize), this.gapSize !== void 0 && (s.gapSize = this.gapSize), this.scale !== void 0 && (s.scale = this.scale), this.dithering === !0 && (s.dithering = !0), this.alphaTest > 0 && (s.alphaTest = this.alphaTest), this.alphaHash === !0 && (s.alphaHash = !0), this.alphaToCoverage === !0 && (s.alphaToCoverage = !0), this.premultipliedAlpha === !0 && (s.premultipliedAlpha = !0), this.forceSinglePass === !0 && (s.forceSinglePass = !0), this.wireframe === !0 && (s.wireframe = !0), this.wireframeLinewidth > 1 && (s.wireframeLinewidth = this.wireframeLinewidth), this.wireframeLinecap !== "round" && (s.wireframeLinecap = this.wireframeLinecap), this.wireframeLinejoin !== "round" && (s.wireframeLinejoin = this.wireframeLinejoin), this.flatShading === !0 && (s.flatShading = !0), this.visible === !1 && (s.visible = !1), this.toneMapped === !1 && (s.toneMapped = !1), this.fog === !1 && (s.fog = !1), Object.keys(this.userData).length > 0 && (s.userData = this.userData);
    function i(r) {
      const a = [];
      for (const o in r) {
        const c = r[o];
        delete c.metadata, a.push(c);
      }
      return a;
    }
    if (e) {
      const r = i(t.textures), a = i(t.images);
      r.length > 0 && (s.textures = r), a.length > 0 && (s.images = a);
    }
    return s;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(t) {
    this.name = t.name, this.blending = t.blending, this.side = t.side, this.vertexColors = t.vertexColors, this.opacity = t.opacity, this.transparent = t.transparent, this.blendSrc = t.blendSrc, this.blendDst = t.blendDst, this.blendEquation = t.blendEquation, this.blendSrcAlpha = t.blendSrcAlpha, this.blendDstAlpha = t.blendDstAlpha, this.blendEquationAlpha = t.blendEquationAlpha, this.blendColor.copy(t.blendColor), this.blendAlpha = t.blendAlpha, this.depthFunc = t.depthFunc, this.depthTest = t.depthTest, this.depthWrite = t.depthWrite, this.stencilWriteMask = t.stencilWriteMask, this.stencilFunc = t.stencilFunc, this.stencilRef = t.stencilRef, this.stencilFuncMask = t.stencilFuncMask, this.stencilFail = t.stencilFail, this.stencilZFail = t.stencilZFail, this.stencilZPass = t.stencilZPass, this.stencilWrite = t.stencilWrite;
    const e = t.clippingPlanes;
    let s = null;
    if (e !== null) {
      const i = e.length;
      s = new Array(i);
      for (let r = 0; r !== i; ++r)
        s[r] = e[r].clone();
    }
    return this.clippingPlanes = s, this.clipIntersection = t.clipIntersection, this.clipShadows = t.clipShadows, this.shadowSide = t.shadowSide, this.colorWrite = t.colorWrite, this.precision = t.precision, this.polygonOffset = t.polygonOffset, this.polygonOffsetFactor = t.polygonOffsetFactor, this.polygonOffsetUnits = t.polygonOffsetUnits, this.dithering = t.dithering, this.alphaTest = t.alphaTest, this.alphaHash = t.alphaHash, this.alphaToCoverage = t.alphaToCoverage, this.premultipliedAlpha = t.premultipliedAlpha, this.forceSinglePass = t.forceSinglePass, this.visible = t.visible, this.toneMapped = t.toneMapped, this.userData = JSON.parse(JSON.stringify(t.userData)), this;
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
  set needsUpdate(t) {
    t === !0 && this.version++;
  }
  onBuild() {
    console.warn("Material: onBuild() has been removed.");
  }
}
class uh extends lh {
  constructor(t) {
    super(), this.isMeshBasicMaterial = !0, this.type = "MeshBasicMaterial", this.color = new Yn(16777215), this.map = null, this.lightMap = null, this.lightMapIntensity = 1, this.aoMap = null, this.aoMapIntensity = 1, this.specularMap = null, this.alphaMap = null, this.envMap = null, this.envMapRotation = new Ss(), this.combine = eu, this.reflectivity = 1, this.refractionRatio = 0.98, this.wireframe = !1, this.wireframeLinewidth = 1, this.wireframeLinecap = "round", this.wireframeLinejoin = "round", this.fog = !0, this.setValues(t);
  }
  copy(t) {
    return super.copy(t), this.color.copy(t.color), this.map = t.map, this.lightMap = t.lightMap, this.lightMapIntensity = t.lightMapIntensity, this.aoMap = t.aoMap, this.aoMapIntensity = t.aoMapIntensity, this.specularMap = t.specularMap, this.alphaMap = t.alphaMap, this.envMap = t.envMap, this.envMapRotation.copy(t.envMapRotation), this.combine = t.combine, this.reflectivity = t.reflectivity, this.refractionRatio = t.refractionRatio, this.wireframe = t.wireframe, this.wireframeLinewidth = t.wireframeLinewidth, this.wireframeLinecap = t.wireframeLinecap, this.wireframeLinejoin = t.wireframeLinejoin, this.fog = t.fog, this;
  }
}
const xt = /* @__PURE__ */ new E(), Ns = /* @__PURE__ */ new X();
class he {
  constructor(t, e, s = !1) {
    if (Array.isArray(t))
      throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");
    this.isBufferAttribute = !0, this.name = "", this.array = t, this.itemSize = e, this.count = t !== void 0 ? t.length / e : 0, this.normalized = s, this.usage = $a, this.updateRanges = [], this.gpuType = ru, this.version = 0;
  }
  onUploadCallback() {
  }
  set needsUpdate(t) {
    t === !0 && this.version++;
  }
  setUsage(t) {
    return this.usage = t, this;
  }
  addUpdateRange(t, e) {
    this.updateRanges.push({ start: t, count: e });
  }
  clearUpdateRanges() {
    this.updateRanges.length = 0;
  }
  copy(t) {
    return this.name = t.name, this.array = new t.array.constructor(t.array), this.itemSize = t.itemSize, this.count = t.count, this.normalized = t.normalized, this.usage = t.usage, this.gpuType = t.gpuType, this;
  }
  copyAt(t, e, s) {
    t *= this.itemSize, s *= e.itemSize;
    for (let i = 0, r = this.itemSize; i < r; i++)
      this.array[t + i] = e.array[s + i];
    return this;
  }
  copyArray(t) {
    return this.array.set(t), this;
  }
  applyMatrix3(t) {
    if (this.itemSize === 2)
      for (let e = 0, s = this.count; e < s; e++)
        Ns.fromBufferAttribute(this, e), Ns.applyMatrix3(t), this.setXY(e, Ns.x, Ns.y);
    else if (this.itemSize === 3)
      for (let e = 0, s = this.count; e < s; e++)
        xt.fromBufferAttribute(this, e), xt.applyMatrix3(t), this.setXYZ(e, xt.x, xt.y, xt.z);
    return this;
  }
  applyMatrix4(t) {
    for (let e = 0, s = this.count; e < s; e++)
      xt.fromBufferAttribute(this, e), xt.applyMatrix4(t), this.setXYZ(e, xt.x, xt.y, xt.z);
    return this;
  }
  applyNormalMatrix(t) {
    for (let e = 0, s = this.count; e < s; e++)
      xt.fromBufferAttribute(this, e), xt.applyNormalMatrix(t), this.setXYZ(e, xt.x, xt.y, xt.z);
    return this;
  }
  transformDirection(t) {
    for (let e = 0, s = this.count; e < s; e++)
      xt.fromBufferAttribute(this, e), xt.transformDirection(t), this.setXYZ(e, xt.x, xt.y, xt.z);
    return this;
  }
  set(t, e = 0) {
    return this.array.set(t, e), this;
  }
  getComponent(t, e) {
    let s = this.array[t * this.itemSize + e];
    return this.normalized && (s = Zn(s, this.array)), s;
  }
  setComponent(t, e, s) {
    return this.normalized && (s = Ht(s, this.array)), this.array[t * this.itemSize + e] = s, this;
  }
  getX(t) {
    let e = this.array[t * this.itemSize];
    return this.normalized && (e = Zn(e, this.array)), e;
  }
  setX(t, e) {
    return this.normalized && (e = Ht(e, this.array)), this.array[t * this.itemSize] = e, this;
  }
  getY(t) {
    let e = this.array[t * this.itemSize + 1];
    return this.normalized && (e = Zn(e, this.array)), e;
  }
  setY(t, e) {
    return this.normalized && (e = Ht(e, this.array)), this.array[t * this.itemSize + 1] = e, this;
  }
  getZ(t) {
    let e = this.array[t * this.itemSize + 2];
    return this.normalized && (e = Zn(e, this.array)), e;
  }
  setZ(t, e) {
    return this.normalized && (e = Ht(e, this.array)), this.array[t * this.itemSize + 2] = e, this;
  }
  getW(t) {
    let e = this.array[t * this.itemSize + 3];
    return this.normalized && (e = Zn(e, this.array)), e;
  }
  setW(t, e) {
    return this.normalized && (e = Ht(e, this.array)), this.array[t * this.itemSize + 3] = e, this;
  }
  setXY(t, e, s) {
    return t *= this.itemSize, this.normalized && (e = Ht(e, this.array), s = Ht(s, this.array)), this.array[t + 0] = e, this.array[t + 1] = s, this;
  }
  setXYZ(t, e, s, i) {
    return t *= this.itemSize, this.normalized && (e = Ht(e, this.array), s = Ht(s, this.array), i = Ht(i, this.array)), this.array[t + 0] = e, this.array[t + 1] = s, this.array[t + 2] = i, this;
  }
  setXYZW(t, e, s, i, r) {
    return t *= this.itemSize, this.normalized && (e = Ht(e, this.array), s = Ht(s, this.array), i = Ht(i, this.array), r = Ht(r, this.array)), this.array[t + 0] = e, this.array[t + 1] = s, this.array[t + 2] = i, this.array[t + 3] = r, this;
  }
  onUpload(t) {
    return this.onUploadCallback = t, this;
  }
  clone() {
    return new this.constructor(this.array, this.itemSize).copy(this);
  }
  toJSON() {
    const t = {
      itemSize: this.itemSize,
      type: this.array.constructor.name,
      array: Array.from(this.array),
      normalized: this.normalized
    };
    return this.name !== "" && (t.name = this.name), this.usage !== $a && (t.usage = this.usage), t;
  }
}
class Cu extends he {
  constructor(t, e, s) {
    super(new Uint16Array(t), e, s);
  }
}
class Tu extends he {
  constructor(t, e, s) {
    super(new Uint32Array(t), e, s);
  }
}
class ln extends he {
  constructor(t, e, s) {
    super(new Float32Array(t), e, s);
  }
}
let Fu = 0;
const $t = /* @__PURE__ */ new mt(), hr = /* @__PURE__ */ new jt(), En = /* @__PURE__ */ new E(), Wt = /* @__PURE__ */ new Ft(), ts = /* @__PURE__ */ new Ft(), wt = /* @__PURE__ */ new E();
class Rt extends Li {
  constructor() {
    super(), this.isBufferGeometry = !0, Object.defineProperty(this, "id", { value: Fu++ }), this.uuid = Xn(), this.name = "", this.type = "BufferGeometry", this.index = null, this.indirect = null, this.attributes = {}, this.morphAttributes = {}, this.morphTargetsRelative = !1, this.groups = [], this.boundingBox = null, this.boundingSphere = null, this.drawRange = { start: 0, count: 1 / 0 }, this.userData = {};
  }
  getIndex() {
    return this.index;
  }
  setIndex(t) {
    return Array.isArray(t) ? this.index = new (cu(t) ? Tu : Cu)(t, 1) : this.index = t, this;
  }
  setIndirect(t) {
    return this.indirect = t, this;
  }
  getIndirect() {
    return this.indirect;
  }
  getAttribute(t) {
    return this.attributes[t];
  }
  setAttribute(t, e) {
    return this.attributes[t] = e, this;
  }
  deleteAttribute(t) {
    return delete this.attributes[t], this;
  }
  hasAttribute(t) {
    return this.attributes[t] !== void 0;
  }
  addGroup(t, e, s = 0) {
    this.groups.push({
      start: t,
      count: e,
      materialIndex: s
    });
  }
  clearGroups() {
    this.groups = [];
  }
  setDrawRange(t, e) {
    this.drawRange.start = t, this.drawRange.count = e;
  }
  applyMatrix4(t) {
    const e = this.attributes.position;
    e !== void 0 && (e.applyMatrix4(t), e.needsUpdate = !0);
    const s = this.attributes.normal;
    if (s !== void 0) {
      const r = new Qe().getNormalMatrix(t);
      s.applyNormalMatrix(r), s.needsUpdate = !0;
    }
    const i = this.attributes.tangent;
    return i !== void 0 && (i.transformDirection(t), i.needsUpdate = !0), this.boundingBox !== null && this.computeBoundingBox(), this.boundingSphere !== null && this.computeBoundingSphere(), this;
  }
  applyQuaternion(t) {
    return $t.makeRotationFromQuaternion(t), this.applyMatrix4($t), this;
  }
  rotateX(t) {
    return $t.makeRotationX(t), this.applyMatrix4($t), this;
  }
  rotateY(t) {
    return $t.makeRotationY(t), this.applyMatrix4($t), this;
  }
  rotateZ(t) {
    return $t.makeRotationZ(t), this.applyMatrix4($t), this;
  }
  translate(t, e, s) {
    return $t.makeTranslation(t, e, s), this.applyMatrix4($t), this;
  }
  scale(t, e, s) {
    return $t.makeScale(t, e, s), this.applyMatrix4($t), this;
  }
  lookAt(t) {
    return hr.lookAt(t), hr.updateMatrix(), this.applyMatrix4(hr.matrix), this;
  }
  center() {
    return this.computeBoundingBox(), this.boundingBox.getCenter(En).negate(), this.translate(En.x, En.y, En.z), this;
  }
  setFromPoints(t) {
    const e = this.getAttribute("position");
    if (e === void 0) {
      const s = [];
      for (let i = 0, r = t.length; i < r; i++) {
        const a = t[i];
        s.push(a.x, a.y, a.z || 0);
      }
      this.setAttribute("position", new ln(s, 3));
    } else {
      const s = Math.min(t.length, e.count);
      for (let i = 0; i < s; i++) {
        const r = t[i];
        e.setXYZ(i, r.x, r.y, r.z || 0);
      }
      t.length > e.count && console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."), e.needsUpdate = !0;
    }
    return this;
  }
  computeBoundingBox() {
    this.boundingBox === null && (this.boundingBox = new Ft());
    const t = this.attributes.position, e = this.morphAttributes.position;
    if (t && t.isGLBufferAttribute) {
      console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.", this), this.boundingBox.set(
        new E(-1 / 0, -1 / 0, -1 / 0),
        new E(1 / 0, 1 / 0, 1 / 0)
      );
      return;
    }
    if (t !== void 0) {
      if (this.boundingBox.setFromBufferAttribute(t), e)
        for (let s = 0, i = e.length; s < i; s++) {
          const r = e[s];
          Wt.setFromBufferAttribute(r), this.morphTargetsRelative ? (wt.addVectors(this.boundingBox.min, Wt.min), this.boundingBox.expandByPoint(wt), wt.addVectors(this.boundingBox.max, Wt.max), this.boundingBox.expandByPoint(wt)) : (this.boundingBox.expandByPoint(Wt.min), this.boundingBox.expandByPoint(Wt.max));
        }
    } else
      this.boundingBox.makeEmpty();
    (isNaN(this.boundingBox.min.x) || isNaN(this.boundingBox.min.y) || isNaN(this.boundingBox.min.z)) && console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.', this);
  }
  computeBoundingSphere() {
    this.boundingSphere === null && (this.boundingSphere = new la());
    const t = this.attributes.position, e = this.morphAttributes.position;
    if (t && t.isGLBufferAttribute) {
      console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.", this), this.boundingSphere.set(new E(), 1 / 0);
      return;
    }
    if (t) {
      const s = this.boundingSphere.center;
      if (Wt.setFromBufferAttribute(t), e)
        for (let r = 0, a = e.length; r < a; r++) {
          const o = e[r];
          ts.setFromBufferAttribute(o), this.morphTargetsRelative ? (wt.addVectors(Wt.min, ts.min), Wt.expandByPoint(wt), wt.addVectors(Wt.max, ts.max), Wt.expandByPoint(wt)) : (Wt.expandByPoint(ts.min), Wt.expandByPoint(ts.max));
        }
      Wt.getCenter(s);
      let i = 0;
      for (let r = 0, a = t.count; r < a; r++)
        wt.fromBufferAttribute(t, r), i = Math.max(i, s.distanceToSquared(wt));
      if (e)
        for (let r = 0, a = e.length; r < a; r++) {
          const o = e[r], c = this.morphTargetsRelative;
          for (let h = 0, l = o.count; h < l; h++)
            wt.fromBufferAttribute(o, h), c && (En.fromBufferAttribute(t, h), wt.add(En)), i = Math.max(i, s.distanceToSquared(wt));
        }
      this.boundingSphere.radius = Math.sqrt(i), isNaN(this.boundingSphere.radius) && console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.', this);
    }
  }
  computeTangents() {
    const t = this.index, e = this.attributes;
    if (t === null || e.position === void 0 || e.normal === void 0 || e.uv === void 0) {
      console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");
      return;
    }
    const s = e.position, i = e.normal, r = e.uv;
    this.hasAttribute("tangent") === !1 && this.setAttribute("tangent", new he(new Float32Array(4 * s.count), 4));
    const a = this.getAttribute("tangent"), o = [], c = [];
    for (let I = 0; I < s.count; I++)
      o[I] = new E(), c[I] = new E();
    const h = new E(), l = new E(), u = new E(), f = new X(), p = new X(), d = new X(), g = new E(), x = new E();
    function b(I, H, R) {
      h.fromBufferAttribute(s, I), l.fromBufferAttribute(s, H), u.fromBufferAttribute(s, R), f.fromBufferAttribute(r, I), p.fromBufferAttribute(r, H), d.fromBufferAttribute(r, R), l.sub(h), u.sub(h), p.sub(f), d.sub(f);
      const W = 1 / (p.x * d.y - d.x * p.y);
      isFinite(W) && (g.copy(l).multiplyScalar(d.y).addScaledVector(u, -p.y).multiplyScalar(W), x.copy(u).multiplyScalar(p.x).addScaledVector(l, -d.x).multiplyScalar(W), o[I].add(g), o[H].add(g), o[R].add(g), c[I].add(x), c[H].add(x), c[R].add(x));
    }
    let v = this.groups;
    v.length === 0 && (v = [{
      start: 0,
      count: t.count
    }]);
    for (let I = 0, H = v.length; I < H; ++I) {
      const R = v[I], W = R.start, J = R.count;
      for (let D = W, U = W + J; D < U; D += 3)
        b(
          t.getX(D + 0),
          t.getX(D + 1),
          t.getX(D + 2)
        );
    }
    const S = new E(), w = new E(), F = new E(), O = new E();
    function M(I) {
      F.fromBufferAttribute(i, I), O.copy(F);
      const H = o[I];
      S.copy(H), S.sub(F.multiplyScalar(F.dot(H))).normalize(), w.crossVectors(O, H);
      const W = w.dot(c[I]) < 0 ? -1 : 1;
      a.setXYZW(I, S.x, S.y, S.z, W);
    }
    for (let I = 0, H = v.length; I < H; ++I) {
      const R = v[I], W = R.start, J = R.count;
      for (let D = W, U = W + J; D < U; D += 3)
        M(t.getX(D + 0)), M(t.getX(D + 1)), M(t.getX(D + 2));
    }
  }
  computeVertexNormals() {
    const t = this.index, e = this.getAttribute("position");
    if (e !== void 0) {
      let s = this.getAttribute("normal");
      if (s === void 0)
        s = new he(new Float32Array(e.count * 3), 3), this.setAttribute("normal", s);
      else
        for (let f = 0, p = s.count; f < p; f++)
          s.setXYZ(f, 0, 0, 0);
      const i = new E(), r = new E(), a = new E(), o = new E(), c = new E(), h = new E(), l = new E(), u = new E();
      if (t)
        for (let f = 0, p = t.count; f < p; f += 3) {
          const d = t.getX(f + 0), g = t.getX(f + 1), x = t.getX(f + 2);
          i.fromBufferAttribute(e, d), r.fromBufferAttribute(e, g), a.fromBufferAttribute(e, x), l.subVectors(a, r), u.subVectors(i, r), l.cross(u), o.fromBufferAttribute(s, d), c.fromBufferAttribute(s, g), h.fromBufferAttribute(s, x), o.add(l), c.add(l), h.add(l), s.setXYZ(d, o.x, o.y, o.z), s.setXYZ(g, c.x, c.y, c.z), s.setXYZ(x, h.x, h.y, h.z);
        }
      else
        for (let f = 0, p = e.count; f < p; f += 3)
          i.fromBufferAttribute(e, f + 0), r.fromBufferAttribute(e, f + 1), a.fromBufferAttribute(e, f + 2), l.subVectors(a, r), u.subVectors(i, r), l.cross(u), s.setXYZ(f + 0, l.x, l.y, l.z), s.setXYZ(f + 1, l.x, l.y, l.z), s.setXYZ(f + 2, l.x, l.y, l.z);
      this.normalizeNormals(), s.needsUpdate = !0;
    }
  }
  normalizeNormals() {
    const t = this.attributes.normal;
    for (let e = 0, s = t.count; e < s; e++)
      wt.fromBufferAttribute(t, e), wt.normalize(), t.setXYZ(e, wt.x, wt.y, wt.z);
  }
  toNonIndexed() {
    function t(o, c) {
      const h = o.array, l = o.itemSize, u = o.normalized, f = new h.constructor(c.length * l);
      let p = 0, d = 0;
      for (let g = 0, x = c.length; g < x; g++) {
        o.isInterleavedBufferAttribute ? p = c[g] * o.data.stride + o.offset : p = c[g] * l;
        for (let b = 0; b < l; b++)
          f[d++] = h[p++];
      }
      return new he(f, l, u);
    }
    if (this.index === null)
      return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."), this;
    const e = new Rt(), s = this.index.array, i = this.attributes;
    for (const o in i) {
      const c = i[o], h = t(c, s);
      e.setAttribute(o, h);
    }
    const r = this.morphAttributes;
    for (const o in r) {
      const c = [], h = r[o];
      for (let l = 0, u = h.length; l < u; l++) {
        const f = h[l], p = t(f, s);
        c.push(p);
      }
      e.morphAttributes[o] = c;
    }
    e.morphTargetsRelative = this.morphTargetsRelative;
    const a = this.groups;
    for (let o = 0, c = a.length; o < c; o++) {
      const h = a[o];
      e.addGroup(h.start, h.count, h.materialIndex);
    }
    return e;
  }
  toJSON() {
    const t = {
      metadata: {
        version: 4.6,
        type: "BufferGeometry",
        generator: "BufferGeometry.toJSON"
      }
    };
    if (t.uuid = this.uuid, t.type = this.type, this.name !== "" && (t.name = this.name), Object.keys(this.userData).length > 0 && (t.userData = this.userData), this.parameters !== void 0) {
      const c = this.parameters;
      for (const h in c)
        c[h] !== void 0 && (t[h] = c[h]);
      return t;
    }
    t.data = { attributes: {} };
    const e = this.index;
    e !== null && (t.data.index = {
      type: e.array.constructor.name,
      array: Array.prototype.slice.call(e.array)
    });
    const s = this.attributes;
    for (const c in s) {
      const h = s[c];
      t.data.attributes[c] = h.toJSON(t.data);
    }
    const i = {};
    let r = !1;
    for (const c in this.morphAttributes) {
      const h = this.morphAttributes[c], l = [];
      for (let u = 0, f = h.length; u < f; u++) {
        const p = h[u];
        l.push(p.toJSON(t.data));
      }
      l.length > 0 && (i[c] = l, r = !0);
    }
    r && (t.data.morphAttributes = i, t.data.morphTargetsRelative = this.morphTargetsRelative);
    const a = this.groups;
    a.length > 0 && (t.data.groups = JSON.parse(JSON.stringify(a)));
    const o = this.boundingSphere;
    return o !== null && (t.data.boundingSphere = {
      center: o.center.toArray(),
      radius: o.radius
    }), t;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(t) {
    this.index = null, this.attributes = {}, this.morphAttributes = {}, this.groups = [], this.boundingBox = null, this.boundingSphere = null;
    const e = {};
    this.name = t.name;
    const s = t.index;
    s !== null && this.setIndex(s.clone(e));
    const i = t.attributes;
    for (const h in i) {
      const l = i[h];
      this.setAttribute(h, l.clone(e));
    }
    const r = t.morphAttributes;
    for (const h in r) {
      const l = [], u = r[h];
      for (let f = 0, p = u.length; f < p; f++)
        l.push(u[f].clone(e));
      this.morphAttributes[h] = l;
    }
    this.morphTargetsRelative = t.morphTargetsRelative;
    const a = t.groups;
    for (let h = 0, l = a.length; h < l; h++) {
      const u = a[h];
      this.addGroup(u.start, u.count, u.materialIndex);
    }
    const o = t.boundingBox;
    o !== null && (this.boundingBox = o.clone());
    const c = t.boundingSphere;
    return c !== null && (this.boundingSphere = c.clone()), this.drawRange.start = t.drawRange.start, this.drawRange.count = t.drawRange.count, this.userData = t.userData, this;
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
}
const ho = /* @__PURE__ */ new mt(), sn = /* @__PURE__ */ new ch(), zs = /* @__PURE__ */ new la(), lo = /* @__PURE__ */ new E(), Hs = /* @__PURE__ */ new E(), Gs = /* @__PURE__ */ new E(), Vs = /* @__PURE__ */ new E(), lr = /* @__PURE__ */ new E(), Ws = /* @__PURE__ */ new E(), uo = /* @__PURE__ */ new E(), qs = /* @__PURE__ */ new E();
class ls extends jt {
  constructor(t = new Rt(), e = new uh()) {
    super(), this.isMesh = !0, this.type = "Mesh", this.geometry = t, this.material = e, this.updateMorphTargets();
  }
  copy(t, e) {
    return super.copy(t, e), t.morphTargetInfluences !== void 0 && (this.morphTargetInfluences = t.morphTargetInfluences.slice()), t.morphTargetDictionary !== void 0 && (this.morphTargetDictionary = Object.assign({}, t.morphTargetDictionary)), this.material = Array.isArray(t.material) ? t.material.slice() : t.material, this.geometry = t.geometry, this;
  }
  updateMorphTargets() {
    const e = this.geometry.morphAttributes, s = Object.keys(e);
    if (s.length > 0) {
      const i = e[s[0]];
      if (i !== void 0) {
        this.morphTargetInfluences = [], this.morphTargetDictionary = {};
        for (let r = 0, a = i.length; r < a; r++) {
          const o = i[r].name || String(r);
          this.morphTargetInfluences.push(0), this.morphTargetDictionary[o] = r;
        }
      }
    }
  }
  getVertexPosition(t, e) {
    const s = this.geometry, i = s.attributes.position, r = s.morphAttributes.position, a = s.morphTargetsRelative;
    e.fromBufferAttribute(i, t);
    const o = this.morphTargetInfluences;
    if (r && o) {
      Ws.set(0, 0, 0);
      for (let c = 0, h = r.length; c < h; c++) {
        const l = o[c], u = r[c];
        l !== 0 && (lr.fromBufferAttribute(u, t), a ? Ws.addScaledVector(lr, l) : Ws.addScaledVector(lr.sub(e), l));
      }
      e.add(Ws);
    }
    return e;
  }
  raycast(t, e) {
    const s = this.geometry, i = this.material, r = this.matrixWorld;
    i !== void 0 && (s.boundingSphere === null && s.computeBoundingSphere(), zs.copy(s.boundingSphere), zs.applyMatrix4(r), sn.copy(t.ray).recast(t.near), !(zs.containsPoint(sn.origin) === !1 && (sn.intersectSphere(zs, lo) === null || sn.origin.distanceToSquared(lo) > (t.far - t.near) ** 2)) && (ho.copy(r).invert(), sn.copy(t.ray).applyMatrix4(ho), !(s.boundingBox !== null && sn.intersectsBox(s.boundingBox) === !1) && this._computeIntersections(t, e, sn)));
  }
  _computeIntersections(t, e, s) {
    let i;
    const r = this.geometry, a = this.material, o = r.index, c = r.attributes.position, h = r.attributes.uv, l = r.attributes.uv1, u = r.attributes.normal, f = r.groups, p = r.drawRange;
    if (o !== null)
      if (Array.isArray(a))
        for (let d = 0, g = f.length; d < g; d++) {
          const x = f[d], b = a[x.materialIndex], v = Math.max(x.start, p.start), S = Math.min(o.count, Math.min(x.start + x.count, p.start + p.count));
          for (let w = v, F = S; w < F; w += 3) {
            const O = o.getX(w), M = o.getX(w + 1), I = o.getX(w + 2);
            i = js(this, b, t, s, h, l, u, O, M, I), i && (i.faceIndex = Math.floor(w / 3), i.face.materialIndex = x.materialIndex, e.push(i));
          }
        }
      else {
        const d = Math.max(0, p.start), g = Math.min(o.count, p.start + p.count);
        for (let x = d, b = g; x < b; x += 3) {
          const v = o.getX(x), S = o.getX(x + 1), w = o.getX(x + 2);
          i = js(this, a, t, s, h, l, u, v, S, w), i && (i.faceIndex = Math.floor(x / 3), e.push(i));
        }
      }
    else if (c !== void 0)
      if (Array.isArray(a))
        for (let d = 0, g = f.length; d < g; d++) {
          const x = f[d], b = a[x.materialIndex], v = Math.max(x.start, p.start), S = Math.min(c.count, Math.min(x.start + x.count, p.start + p.count));
          for (let w = v, F = S; w < F; w += 3) {
            const O = w, M = w + 1, I = w + 2;
            i = js(this, b, t, s, h, l, u, O, M, I), i && (i.faceIndex = Math.floor(w / 3), i.face.materialIndex = x.materialIndex, e.push(i));
          }
        }
      else {
        const d = Math.max(0, p.start), g = Math.min(c.count, p.start + p.count);
        for (let x = d, b = g; x < b; x += 3) {
          const v = x, S = x + 1, w = x + 2;
          i = js(this, a, t, s, h, l, u, v, S, w), i && (i.faceIndex = Math.floor(x / 3), e.push(i));
        }
      }
  }
}
function Au(n, t, e, s, i, r, a, o) {
  let c;
  if (t.side === tu ? c = s.intersectTriangle(a, r, i, !0, o) : c = s.intersectTriangle(i, r, a, t.side === Gr, o), c === null) return null;
  qs.copy(o), qs.applyMatrix4(n.matrixWorld);
  const h = e.ray.origin.distanceTo(qs);
  return h < e.near || h > e.far ? null : {
    distance: h,
    point: qs.clone(),
    object: n
  };
}
function js(n, t, e, s, i, r, a, o, c, h) {
  n.getVertexPosition(o, Hs), n.getVertexPosition(c, Gs), n.getVertexPosition(h, Vs);
  const l = Au(n, t, e, s, Hs, Gs, Vs, uo);
  if (l) {
    const u = new E();
    oe.getBarycoord(uo, Hs, Gs, Vs, u), i && (l.uv = oe.getInterpolatedAttribute(i, o, c, h, u, new X())), r && (l.uv1 = oe.getInterpolatedAttribute(r, o, c, h, u, new X())), a && (l.normal = oe.getInterpolatedAttribute(a, o, c, h, u, new E()), l.normal.dot(s.direction) > 0 && l.normal.multiplyScalar(-1));
    const f = {
      a: o,
      b: c,
      c: h,
      normal: new E(),
      materialIndex: 0
    };
    oe.getNormal(Hs, Gs, Vs, f.normal), l.face = f, l.barycoord = u;
  }
  return l;
}
class fh extends lh {
  constructor(t) {
    super(), this.isLineBasicMaterial = !0, this.type = "LineBasicMaterial", this.color = new Yn(16777215), this.map = null, this.linewidth = 1, this.linecap = "round", this.linejoin = "round", this.fog = !0, this.setValues(t);
  }
  copy(t) {
    return super.copy(t), this.color.copy(t.color), this.map = t.map, this.linewidth = t.linewidth, this.linecap = t.linecap, this.linejoin = t.linejoin, this.fog = t.fog, this;
  }
}
const di = /* @__PURE__ */ new E(), gi = /* @__PURE__ */ new E(), fo = /* @__PURE__ */ new mt(), es = /* @__PURE__ */ new ch(), Xs = /* @__PURE__ */ new la(), ur = /* @__PURE__ */ new E(), po = /* @__PURE__ */ new E();
class Vr extends jt {
  constructor(t = new Rt(), e = new fh()) {
    super(), this.isLine = !0, this.type = "Line", this.geometry = t, this.material = e, this.updateMorphTargets();
  }
  copy(t, e) {
    return super.copy(t, e), this.material = Array.isArray(t.material) ? t.material.slice() : t.material, this.geometry = t.geometry, this;
  }
  computeLineDistances() {
    const t = this.geometry;
    if (t.index === null) {
      const e = t.attributes.position, s = [0];
      for (let i = 1, r = e.count; i < r; i++)
        di.fromBufferAttribute(e, i - 1), gi.fromBufferAttribute(e, i), s[i] = s[i - 1], s[i] += di.distanceTo(gi);
      t.setAttribute("lineDistance", new ln(s, 1));
    } else
      console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");
    return this;
  }
  raycast(t, e) {
    const s = this.geometry, i = this.matrixWorld, r = t.params.Line.threshold, a = s.drawRange;
    if (s.boundingSphere === null && s.computeBoundingSphere(), Xs.copy(s.boundingSphere), Xs.applyMatrix4(i), Xs.radius += r, t.ray.intersectsSphere(Xs) === !1) return;
    fo.copy(i).invert(), es.copy(t.ray).applyMatrix4(fo);
    const o = r / ((this.scale.x + this.scale.y + this.scale.z) / 3), c = o * o, h = this.isLineSegments ? 2 : 1, l = s.index, f = s.attributes.position;
    if (l !== null) {
      const p = Math.max(0, a.start), d = Math.min(l.count, a.start + a.count);
      for (let g = p, x = d - 1; g < x; g += h) {
        const b = l.getX(g), v = l.getX(g + 1), S = Ys(this, t, es, c, b, v);
        S && e.push(S);
      }
      if (this.isLineLoop) {
        const g = l.getX(d - 1), x = l.getX(p), b = Ys(this, t, es, c, g, x);
        b && e.push(b);
      }
    } else {
      const p = Math.max(0, a.start), d = Math.min(f.count, a.start + a.count);
      for (let g = p, x = d - 1; g < x; g += h) {
        const b = Ys(this, t, es, c, g, g + 1);
        b && e.push(b);
      }
      if (this.isLineLoop) {
        const g = Ys(this, t, es, c, d - 1, p);
        g && e.push(g);
      }
    }
  }
  updateMorphTargets() {
    const e = this.geometry.morphAttributes, s = Object.keys(e);
    if (s.length > 0) {
      const i = e[s[0]];
      if (i !== void 0) {
        this.morphTargetInfluences = [], this.morphTargetDictionary = {};
        for (let r = 0, a = i.length; r < a; r++) {
          const o = i[r].name || String(r);
          this.morphTargetInfluences.push(0), this.morphTargetDictionary[o] = r;
        }
      }
    }
  }
}
function Ys(n, t, e, s, i, r) {
  const a = n.geometry.attributes.position;
  if (di.fromBufferAttribute(a, i), gi.fromBufferAttribute(a, r), e.distanceSqToSegment(di, gi, ur, po) > s) return;
  ur.applyMatrix4(n.matrixWorld);
  const c = t.ray.origin.distanceTo(ur);
  if (!(c < t.near || c > t.far))
    return {
      distance: c,
      // What do we want? intersection point on the ray or on the segment??
      // point: raycaster.ray.at( distance ),
      point: po.clone().applyMatrix4(n.matrixWorld),
      index: i,
      face: null,
      faceIndex: null,
      barycoord: null,
      object: n
    };
}
const go = /* @__PURE__ */ new E(), mo = /* @__PURE__ */ new E();
class ph extends Vr {
  constructor(t, e) {
    super(t, e), this.isLineSegments = !0, this.type = "LineSegments";
  }
  computeLineDistances() {
    const t = this.geometry;
    if (t.index === null) {
      const e = t.attributes.position, s = [];
      for (let i = 0, r = e.count; i < r; i += 2)
        go.fromBufferAttribute(e, i), mo.fromBufferAttribute(e, i + 1), s[i] = i === 0 ? 0 : s[i - 1], s[i + 1] = s[i] + go.distanceTo(mo);
      t.setAttribute("lineDistance", new ln(s, 1));
    } else
      console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");
    return this;
  }
}
class yo extends jt {
  constructor() {
    super(), this.isGroup = !0, this.type = "Group";
  }
}
class ve {
  constructor() {
    this.type = "Curve", this.arcLengthDivisions = 200;
  }
  // Virtual base class method to overwrite and implement in subclasses
  //	- t [0 .. 1]
  getPoint() {
    return console.warn("THREE.Curve: .getPoint() not implemented."), null;
  }
  // Get point at relative position in curve according to arc length
  // - u [0 .. 1]
  getPointAt(t, e) {
    const s = this.getUtoTmapping(t);
    return this.getPoint(s, e);
  }
  // Get sequence of points using getPoint( t )
  getPoints(t = 5) {
    const e = [];
    for (let s = 0; s <= t; s++)
      e.push(this.getPoint(s / t));
    return e;
  }
  // Get sequence of points using getPointAt( u )
  getSpacedPoints(t = 5) {
    const e = [];
    for (let s = 0; s <= t; s++)
      e.push(this.getPointAt(s / t));
    return e;
  }
  // Get total curve arc length
  getLength() {
    const t = this.getLengths();
    return t[t.length - 1];
  }
  // Get list of cumulative segment lengths
  getLengths(t = this.arcLengthDivisions) {
    if (this.cacheArcLengths && this.cacheArcLengths.length === t + 1 && !this.needsUpdate)
      return this.cacheArcLengths;
    this.needsUpdate = !1;
    const e = [];
    let s, i = this.getPoint(0), r = 0;
    e.push(0);
    for (let a = 1; a <= t; a++)
      s = this.getPoint(a / t), r += s.distanceTo(i), e.push(r), i = s;
    return this.cacheArcLengths = e, e;
  }
  updateArcLengths() {
    this.needsUpdate = !0, this.getLengths();
  }
  // Given u ( 0 .. 1 ), get a t to find p. This gives you points which are equidistant
  getUtoTmapping(t, e) {
    const s = this.getLengths();
    let i = 0;
    const r = s.length;
    let a;
    e ? a = e : a = t * s[r - 1];
    let o = 0, c = r - 1, h;
    for (; o <= c; )
      if (i = Math.floor(o + (c - o) / 2), h = s[i] - a, h < 0)
        o = i + 1;
      else if (h > 0)
        c = i - 1;
      else {
        c = i;
        break;
      }
    if (i = c, s[i] === a)
      return i / (r - 1);
    const l = s[i], f = s[i + 1] - l, p = (a - l) / f;
    return (i + p) / (r - 1);
  }
  // Returns a unit vector tangent at t
  // In case any sub curve does not implement its tangent derivation,
  // 2 points a small delta apart will be used to find its gradient
  // which seems to give a reasonable approximation
  getTangent(t, e) {
    let i = t - 1e-4, r = t + 1e-4;
    i < 0 && (i = 0), r > 1 && (r = 1);
    const a = this.getPoint(i), o = this.getPoint(r), c = e || (a.isVector2 ? new X() : new E());
    return c.copy(o).sub(a).normalize(), c;
  }
  getTangentAt(t, e) {
    const s = this.getUtoTmapping(t);
    return this.getTangent(s, e);
  }
  computeFrenetFrames(t, e) {
    const s = new E(), i = [], r = [], a = [], o = new E(), c = new mt();
    for (let p = 0; p <= t; p++) {
      const d = p / t;
      i[p] = this.getTangentAt(d, new E());
    }
    r[0] = new E(), a[0] = new E();
    let h = Number.MAX_VALUE;
    const l = Math.abs(i[0].x), u = Math.abs(i[0].y), f = Math.abs(i[0].z);
    l <= h && (h = l, s.set(1, 0, 0)), u <= h && (h = u, s.set(0, 1, 0)), f <= h && s.set(0, 0, 1), o.crossVectors(i[0], s).normalize(), r[0].crossVectors(i[0], o), a[0].crossVectors(i[0], r[0]);
    for (let p = 1; p <= t; p++) {
      if (r[p] = r[p - 1].clone(), a[p] = a[p - 1].clone(), o.crossVectors(i[p - 1], i[p]), o.length() > Number.EPSILON) {
        o.normalize();
        const d = Math.acos(Z(i[p - 1].dot(i[p]), -1, 1));
        r[p].applyMatrix4(c.makeRotationAxis(o, d));
      }
      a[p].crossVectors(i[p], r[p]);
    }
    if (e === !0) {
      let p = Math.acos(Z(r[0].dot(r[t]), -1, 1));
      p /= t, i[0].dot(o.crossVectors(r[0], r[t])) > 0 && (p = -p);
      for (let d = 1; d <= t; d++)
        r[d].applyMatrix4(c.makeRotationAxis(i[d], p * d)), a[d].crossVectors(i[d], r[d]);
    }
    return {
      tangents: i,
      normals: r,
      binormals: a
    };
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(t) {
    return this.arcLengthDivisions = t.arcLengthDivisions, this;
  }
  toJSON() {
    const t = {
      metadata: {
        version: 4.6,
        type: "Curve",
        generator: "Curve.toJSON"
      }
    };
    return t.arcLengthDivisions = this.arcLengthDivisions, t.type = this.type, t;
  }
  fromJSON(t) {
    return this.arcLengthDivisions = t.arcLengthDivisions, this;
  }
}
class us extends ve {
  constructor(t = 0, e = 0, s = 1, i = 1, r = 0, a = Math.PI * 2, o = !1, c = 0) {
    super(), this.isEllipseCurve = !0, this.type = "EllipseCurve", this.aX = t, this.aY = e, this.xRadius = s, this.yRadius = i, this.aStartAngle = r, this.aEndAngle = a, this.aClockwise = o, this.aRotation = c;
  }
  getPoint(t, e = new X()) {
    const s = e, i = Math.PI * 2;
    let r = this.aEndAngle - this.aStartAngle;
    const a = Math.abs(r) < Number.EPSILON;
    for (; r < 0; ) r += i;
    for (; r > i; ) r -= i;
    r < Number.EPSILON && (a ? r = 0 : r = i), this.aClockwise === !0 && !a && (r === i ? r = -i : r = r - i);
    const o = this.aStartAngle + t * r;
    let c = this.aX + this.xRadius * Math.cos(o), h = this.aY + this.yRadius * Math.sin(o);
    if (this.aRotation !== 0) {
      const l = Math.cos(this.aRotation), u = Math.sin(this.aRotation), f = c - this.aX, p = h - this.aY;
      c = f * l - p * u + this.aX, h = f * u + p * l + this.aY;
    }
    return s.set(c, h);
  }
  copy(t) {
    return super.copy(t), this.aX = t.aX, this.aY = t.aY, this.xRadius = t.xRadius, this.yRadius = t.yRadius, this.aStartAngle = t.aStartAngle, this.aEndAngle = t.aEndAngle, this.aClockwise = t.aClockwise, this.aRotation = t.aRotation, this;
  }
  toJSON() {
    const t = super.toJSON();
    return t.aX = this.aX, t.aY = this.aY, t.xRadius = this.xRadius, t.yRadius = this.yRadius, t.aStartAngle = this.aStartAngle, t.aEndAngle = this.aEndAngle, t.aClockwise = this.aClockwise, t.aRotation = this.aRotation, t;
  }
  fromJSON(t) {
    return super.fromJSON(t), this.aX = t.aX, this.aY = t.aY, this.xRadius = t.xRadius, this.yRadius = t.yRadius, this.aStartAngle = t.aStartAngle, this.aEndAngle = t.aEndAngle, this.aClockwise = t.aClockwise, this.aRotation = t.aRotation, this;
  }
}
class ku extends us {
  constructor(t, e, s, i, r, a) {
    super(t, e, s, s, i, r, a), this.isArcCurve = !0, this.type = "ArcCurve";
  }
}
function ua() {
  let n = 0, t = 0, e = 0, s = 0;
  function i(r, a, o, c) {
    n = r, t = o, e = -3 * r + 3 * a - 2 * o - c, s = 2 * r - 2 * a + o + c;
  }
  return {
    initCatmullRom: function(r, a, o, c, h) {
      i(a, o, h * (o - r), h * (c - a));
    },
    initNonuniformCatmullRom: function(r, a, o, c, h, l, u) {
      let f = (a - r) / h - (o - r) / (h + l) + (o - a) / l, p = (o - a) / l - (c - a) / (l + u) + (c - o) / u;
      f *= l, p *= l, i(a, o, f, p);
    },
    calc: function(r) {
      const a = r * r, o = a * r;
      return n + t * r + e * a + s * o;
    }
  };
}
const $s = /* @__PURE__ */ new E(), fr = /* @__PURE__ */ new ua(), pr = /* @__PURE__ */ new ua(), dr = /* @__PURE__ */ new ua();
class Eu extends ve {
  constructor(t = [], e = !1, s = "centripetal", i = 0.5) {
    super(), this.isCatmullRomCurve3 = !0, this.type = "CatmullRomCurve3", this.points = t, this.closed = e, this.curveType = s, this.tension = i;
  }
  getPoint(t, e = new E()) {
    const s = e, i = this.points, r = i.length, a = (r - (this.closed ? 0 : 1)) * t;
    let o = Math.floor(a), c = a - o;
    this.closed ? o += o > 0 ? 0 : (Math.floor(Math.abs(o) / r) + 1) * r : c === 0 && o === r - 1 && (o = r - 2, c = 1);
    let h, l;
    this.closed || o > 0 ? h = i[(o - 1) % r] : ($s.subVectors(i[0], i[1]).add(i[0]), h = $s);
    const u = i[o % r], f = i[(o + 1) % r];
    if (this.closed || o + 2 < r ? l = i[(o + 2) % r] : ($s.subVectors(i[r - 1], i[r - 2]).add(i[r - 1]), l = $s), this.curveType === "centripetal" || this.curveType === "chordal") {
      const p = this.curveType === "chordal" ? 0.5 : 0.25;
      let d = Math.pow(h.distanceToSquared(u), p), g = Math.pow(u.distanceToSquared(f), p), x = Math.pow(f.distanceToSquared(l), p);
      g < 1e-4 && (g = 1), d < 1e-4 && (d = g), x < 1e-4 && (x = g), fr.initNonuniformCatmullRom(h.x, u.x, f.x, l.x, d, g, x), pr.initNonuniformCatmullRom(h.y, u.y, f.y, l.y, d, g, x), dr.initNonuniformCatmullRom(h.z, u.z, f.z, l.z, d, g, x);
    } else this.curveType === "catmullrom" && (fr.initCatmullRom(h.x, u.x, f.x, l.x, this.tension), pr.initCatmullRom(h.y, u.y, f.y, l.y, this.tension), dr.initCatmullRom(h.z, u.z, f.z, l.z, this.tension));
    return s.set(
      fr.calc(c),
      pr.calc(c),
      dr.calc(c)
    ), s;
  }
  copy(t) {
    super.copy(t), this.points = [];
    for (let e = 0, s = t.points.length; e < s; e++) {
      const i = t.points[e];
      this.points.push(i.clone());
    }
    return this.closed = t.closed, this.curveType = t.curveType, this.tension = t.tension, this;
  }
  toJSON() {
    const t = super.toJSON();
    t.points = [];
    for (let e = 0, s = this.points.length; e < s; e++) {
      const i = this.points[e];
      t.points.push(i.toArray());
    }
    return t.closed = this.closed, t.curveType = this.curveType, t.tension = this.tension, t;
  }
  fromJSON(t) {
    super.fromJSON(t), this.points = [];
    for (let e = 0, s = t.points.length; e < s; e++) {
      const i = t.points[e];
      this.points.push(new E().fromArray(i));
    }
    return this.closed = t.closed, this.curveType = t.curveType, this.tension = t.tension, this;
  }
}
function xo(n, t, e, s, i) {
  const r = (s - t) * 0.5, a = (i - e) * 0.5, o = n * n, c = n * o;
  return (2 * e - 2 * s + r + a) * c + (-3 * e + 3 * s - 2 * r - a) * o + r * n + e;
}
function Mu(n, t) {
  const e = 1 - n;
  return e * e * t;
}
function Ou(n, t) {
  return 2 * (1 - n) * n * t;
}
function _u(n, t) {
  return n * n * t;
}
function as(n, t, e, s) {
  return Mu(n, t) + Ou(n, e) + _u(n, s);
}
function Lu(n, t) {
  const e = 1 - n;
  return e * e * e * t;
}
function Iu(n, t) {
  const e = 1 - n;
  return 3 * e * e * n * t;
}
function Bu(n, t) {
  return 3 * (1 - n) * n * n * t;
}
function Ru(n, t) {
  return n * n * n * t;
}
function os(n, t, e, s, i) {
  return Lu(n, t) + Iu(n, e) + Bu(n, s) + Ru(n, i);
}
class mi extends ve {
  constructor(t = new X(), e = new X(), s = new X(), i = new X()) {
    super(), this.isCubicBezierCurve = !0, this.type = "CubicBezierCurve", this.v0 = t, this.v1 = e, this.v2 = s, this.v3 = i;
  }
  getPoint(t, e = new X()) {
    const s = e, i = this.v0, r = this.v1, a = this.v2, o = this.v3;
    return s.set(
      os(t, i.x, r.x, a.x, o.x),
      os(t, i.y, r.y, a.y, o.y)
    ), s;
  }
  copy(t) {
    return super.copy(t), this.v0.copy(t.v0), this.v1.copy(t.v1), this.v2.copy(t.v2), this.v3.copy(t.v3), this;
  }
  toJSON() {
    const t = super.toJSON();
    return t.v0 = this.v0.toArray(), t.v1 = this.v1.toArray(), t.v2 = this.v2.toArray(), t.v3 = this.v3.toArray(), t;
  }
  fromJSON(t) {
    return super.fromJSON(t), this.v0.fromArray(t.v0), this.v1.fromArray(t.v1), this.v2.fromArray(t.v2), this.v3.fromArray(t.v3), this;
  }
}
class Du extends ve {
  constructor(t = new E(), e = new E(), s = new E(), i = new E()) {
    super(), this.isCubicBezierCurve3 = !0, this.type = "CubicBezierCurve3", this.v0 = t, this.v1 = e, this.v2 = s, this.v3 = i;
  }
  getPoint(t, e = new E()) {
    const s = e, i = this.v0, r = this.v1, a = this.v2, o = this.v3;
    return s.set(
      os(t, i.x, r.x, a.x, o.x),
      os(t, i.y, r.y, a.y, o.y),
      os(t, i.z, r.z, a.z, o.z)
    ), s;
  }
  copy(t) {
    return super.copy(t), this.v0.copy(t.v0), this.v1.copy(t.v1), this.v2.copy(t.v2), this.v3.copy(t.v3), this;
  }
  toJSON() {
    const t = super.toJSON();
    return t.v0 = this.v0.toArray(), t.v1 = this.v1.toArray(), t.v2 = this.v2.toArray(), t.v3 = this.v3.toArray(), t;
  }
  fromJSON(t) {
    return super.fromJSON(t), this.v0.fromArray(t.v0), this.v1.fromArray(t.v1), this.v2.fromArray(t.v2), this.v3.fromArray(t.v3), this;
  }
}
class cs extends ve {
  constructor(t = new X(), e = new X()) {
    super(), this.isLineCurve = !0, this.type = "LineCurve", this.v1 = t, this.v2 = e;
  }
  getPoint(t, e = new X()) {
    const s = e;
    return t === 1 ? s.copy(this.v2) : (s.copy(this.v2).sub(this.v1), s.multiplyScalar(t).add(this.v1)), s;
  }
  // Line curve is linear, so we can overwrite default getPointAt
  getPointAt(t, e) {
    return this.getPoint(t, e);
  }
  getTangent(t, e = new X()) {
    return e.subVectors(this.v2, this.v1).normalize();
  }
  getTangentAt(t, e) {
    return this.getTangent(t, e);
  }
  copy(t) {
    return super.copy(t), this.v1.copy(t.v1), this.v2.copy(t.v2), this;
  }
  toJSON() {
    const t = super.toJSON();
    return t.v1 = this.v1.toArray(), t.v2 = this.v2.toArray(), t;
  }
  fromJSON(t) {
    return super.fromJSON(t), this.v1.fromArray(t.v1), this.v2.fromArray(t.v2), this;
  }
}
class Uu extends ve {
  constructor(t = new E(), e = new E()) {
    super(), this.isLineCurve3 = !0, this.type = "LineCurve3", this.v1 = t, this.v2 = e;
  }
  getPoint(t, e = new E()) {
    const s = e;
    return t === 1 ? s.copy(this.v2) : (s.copy(this.v2).sub(this.v1), s.multiplyScalar(t).add(this.v1)), s;
  }
  // Line curve is linear, so we can overwrite default getPointAt
  getPointAt(t, e) {
    return this.getPoint(t, e);
  }
  getTangent(t, e = new E()) {
    return e.subVectors(this.v2, this.v1).normalize();
  }
  getTangentAt(t, e) {
    return this.getTangent(t, e);
  }
  copy(t) {
    return super.copy(t), this.v1.copy(t.v1), this.v2.copy(t.v2), this;
  }
  toJSON() {
    const t = super.toJSON();
    return t.v1 = this.v1.toArray(), t.v2 = this.v2.toArray(), t;
  }
  fromJSON(t) {
    return super.fromJSON(t), this.v1.fromArray(t.v1), this.v2.fromArray(t.v2), this;
  }
}
class yi extends ve {
  constructor(t = new X(), e = new X(), s = new X()) {
    super(), this.isQuadraticBezierCurve = !0, this.type = "QuadraticBezierCurve", this.v0 = t, this.v1 = e, this.v2 = s;
  }
  getPoint(t, e = new X()) {
    const s = e, i = this.v0, r = this.v1, a = this.v2;
    return s.set(
      as(t, i.x, r.x, a.x),
      as(t, i.y, r.y, a.y)
    ), s;
  }
  copy(t) {
    return super.copy(t), this.v0.copy(t.v0), this.v1.copy(t.v1), this.v2.copy(t.v2), this;
  }
  toJSON() {
    const t = super.toJSON();
    return t.v0 = this.v0.toArray(), t.v1 = this.v1.toArray(), t.v2 = this.v2.toArray(), t;
  }
  fromJSON(t) {
    return super.fromJSON(t), this.v0.fromArray(t.v0), this.v1.fromArray(t.v1), this.v2.fromArray(t.v2), this;
  }
}
class Pu extends ve {
  constructor(t = new E(), e = new E(), s = new E()) {
    super(), this.isQuadraticBezierCurve3 = !0, this.type = "QuadraticBezierCurve3", this.v0 = t, this.v1 = e, this.v2 = s;
  }
  getPoint(t, e = new E()) {
    const s = e, i = this.v0, r = this.v1, a = this.v2;
    return s.set(
      as(t, i.x, r.x, a.x),
      as(t, i.y, r.y, a.y),
      as(t, i.z, r.z, a.z)
    ), s;
  }
  copy(t) {
    return super.copy(t), this.v0.copy(t.v0), this.v1.copy(t.v1), this.v2.copy(t.v2), this;
  }
  toJSON() {
    const t = super.toJSON();
    return t.v0 = this.v0.toArray(), t.v1 = this.v1.toArray(), t.v2 = this.v2.toArray(), t;
  }
  fromJSON(t) {
    return super.fromJSON(t), this.v0.fromArray(t.v0), this.v1.fromArray(t.v1), this.v2.fromArray(t.v2), this;
  }
}
class dh extends ve {
  constructor(t = []) {
    super(), this.isSplineCurve = !0, this.type = "SplineCurve", this.points = t;
  }
  getPoint(t, e = new X()) {
    const s = e, i = this.points, r = (i.length - 1) * t, a = Math.floor(r), o = r - a, c = i[a === 0 ? a : a - 1], h = i[a], l = i[a > i.length - 2 ? i.length - 1 : a + 1], u = i[a > i.length - 3 ? i.length - 1 : a + 2];
    return s.set(
      xo(o, c.x, h.x, l.x, u.x),
      xo(o, c.y, h.y, l.y, u.y)
    ), s;
  }
  copy(t) {
    super.copy(t), this.points = [];
    for (let e = 0, s = t.points.length; e < s; e++) {
      const i = t.points[e];
      this.points.push(i.clone());
    }
    return this;
  }
  toJSON() {
    const t = super.toJSON();
    t.points = [];
    for (let e = 0, s = this.points.length; e < s; e++) {
      const i = this.points[e];
      t.points.push(i.toArray());
    }
    return t;
  }
  fromJSON(t) {
    super.fromJSON(t), this.points = [];
    for (let e = 0, s = t.points.length; e < s; e++) {
      const i = t.points[e];
      this.points.push(new X().fromArray(i));
    }
    return this;
  }
}
var bo = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ArcCurve: ku,
  CatmullRomCurve3: Eu,
  CubicBezierCurve: mi,
  CubicBezierCurve3: Du,
  EllipseCurve: us,
  LineCurve: cs,
  LineCurve3: Uu,
  QuadraticBezierCurve: yi,
  QuadraticBezierCurve3: Pu,
  SplineCurve: dh
});
class Nu extends ve {
  constructor() {
    super(), this.type = "CurvePath", this.curves = [], this.autoClose = !1;
  }
  add(t) {
    this.curves.push(t);
  }
  closePath() {
    const t = this.curves[0].getPoint(0), e = this.curves[this.curves.length - 1].getPoint(1);
    if (!t.equals(e)) {
      const s = t.isVector2 === !0 ? "LineCurve" : "LineCurve3";
      this.curves.push(new bo[s](e, t));
    }
    return this;
  }
  // To get accurate point with reference to
  // entire path distance at time t,
  // following has to be done:
  // 1. Length of each sub path have to be known
  // 2. Locate and identify type of curve
  // 3. Get t for the curve
  // 4. Return curve.getPointAt(t')
  getPoint(t, e) {
    const s = t * this.getLength(), i = this.getCurveLengths();
    let r = 0;
    for (; r < i.length; ) {
      if (i[r] >= s) {
        const a = i[r] - s, o = this.curves[r], c = o.getLength(), h = c === 0 ? 0 : 1 - a / c;
        return o.getPointAt(h, e);
      }
      r++;
    }
    return null;
  }
  // We cannot use the default THREE.Curve getPoint() with getLength() because in
  // THREE.Curve, getLength() depends on getPoint() but in THREE.CurvePath
  // getPoint() depends on getLength
  getLength() {
    const t = this.getCurveLengths();
    return t[t.length - 1];
  }
  // cacheLengths must be recalculated.
  updateArcLengths() {
    this.needsUpdate = !0, this.cacheLengths = null, this.getCurveLengths();
  }
  // Compute lengths and cache them
  // We cannot overwrite getLengths() because UtoT mapping uses it.
  getCurveLengths() {
    if (this.cacheLengths && this.cacheLengths.length === this.curves.length)
      return this.cacheLengths;
    const t = [];
    let e = 0;
    for (let s = 0, i = this.curves.length; s < i; s++)
      e += this.curves[s].getLength(), t.push(e);
    return this.cacheLengths = t, t;
  }
  getSpacedPoints(t = 40) {
    const e = [];
    for (let s = 0; s <= t; s++)
      e.push(this.getPoint(s / t));
    return this.autoClose && e.push(e[0]), e;
  }
  getPoints(t = 12) {
    const e = [];
    let s;
    for (let i = 0, r = this.curves; i < r.length; i++) {
      const a = r[i], o = a.isEllipseCurve ? t * 2 : a.isLineCurve || a.isLineCurve3 ? 1 : a.isSplineCurve ? t * a.points.length : t, c = a.getPoints(o);
      for (let h = 0; h < c.length; h++) {
        const l = c[h];
        s && s.equals(l) || (e.push(l), s = l);
      }
    }
    return this.autoClose && e.length > 1 && !e[e.length - 1].equals(e[0]) && e.push(e[0]), e;
  }
  copy(t) {
    super.copy(t), this.curves = [];
    for (let e = 0, s = t.curves.length; e < s; e++) {
      const i = t.curves[e];
      this.curves.push(i.clone());
    }
    return this.autoClose = t.autoClose, this;
  }
  toJSON() {
    const t = super.toJSON();
    t.autoClose = this.autoClose, t.curves = [];
    for (let e = 0, s = this.curves.length; e < s; e++) {
      const i = this.curves[e];
      t.curves.push(i.toJSON());
    }
    return t;
  }
  fromJSON(t) {
    super.fromJSON(t), this.autoClose = t.autoClose, this.curves = [];
    for (let e = 0, s = t.curves.length; e < s; e++) {
      const i = t.curves[e];
      this.curves.push(new bo[i.type]().fromJSON(i));
    }
    return this;
  }
}
let Wr = class extends Nu {
  constructor(t) {
    super(), this.type = "Path", this.currentPoint = new X(), t && this.setFromPoints(t);
  }
  setFromPoints(t) {
    this.moveTo(t[0].x, t[0].y);
    for (let e = 1, s = t.length; e < s; e++)
      this.lineTo(t[e].x, t[e].y);
    return this;
  }
  moveTo(t, e) {
    return this.currentPoint.set(t, e), this;
  }
  lineTo(t, e) {
    const s = new cs(this.currentPoint.clone(), new X(t, e));
    return this.curves.push(s), this.currentPoint.set(t, e), this;
  }
  quadraticCurveTo(t, e, s, i) {
    const r = new yi(
      this.currentPoint.clone(),
      new X(t, e),
      new X(s, i)
    );
    return this.curves.push(r), this.currentPoint.set(s, i), this;
  }
  bezierCurveTo(t, e, s, i, r, a) {
    const o = new mi(
      this.currentPoint.clone(),
      new X(t, e),
      new X(s, i),
      new X(r, a)
    );
    return this.curves.push(o), this.currentPoint.set(r, a), this;
  }
  splineThru(t) {
    const e = [this.currentPoint.clone()].concat(t), s = new dh(e);
    return this.curves.push(s), this.currentPoint.copy(t[t.length - 1]), this;
  }
  arc(t, e, s, i, r, a) {
    const o = this.currentPoint.x, c = this.currentPoint.y;
    return this.absarc(
      t + o,
      e + c,
      s,
      i,
      r,
      a
    ), this;
  }
  absarc(t, e, s, i, r, a) {
    return this.absellipse(t, e, s, s, i, r, a), this;
  }
  ellipse(t, e, s, i, r, a, o, c) {
    const h = this.currentPoint.x, l = this.currentPoint.y;
    return this.absellipse(t + h, e + l, s, i, r, a, o, c), this;
  }
  absellipse(t, e, s, i, r, a, o, c) {
    const h = new us(t, e, s, i, r, a, o, c);
    if (this.curves.length > 0) {
      const u = h.getPoint(0);
      u.equals(this.currentPoint) || this.lineTo(u.x, u.y);
    }
    this.curves.push(h);
    const l = h.getPoint(1);
    return this.currentPoint.copy(l), this;
  }
  copy(t) {
    return super.copy(t), this.currentPoint.copy(t.currentPoint), this;
  }
  toJSON() {
    const t = super.toJSON();
    return t.currentPoint = this.currentPoint.toArray(), t;
  }
  fromJSON(t) {
    return super.fromJSON(t), this.currentPoint.fromArray(t.currentPoint), this;
  }
};
class Rn extends Wr {
  constructor(t) {
    super(t), this.uuid = Xn(), this.type = "Shape", this.holes = [];
  }
  getPointsHoles(t) {
    const e = [];
    for (let s = 0, i = this.holes.length; s < i; s++)
      e[s] = this.holes[s].getPoints(t);
    return e;
  }
  // get points of shape and holes (keypoints based on segments parameter)
  extractPoints(t) {
    return {
      shape: this.getPoints(t),
      holes: this.getPointsHoles(t)
    };
  }
  copy(t) {
    super.copy(t), this.holes = [];
    for (let e = 0, s = t.holes.length; e < s; e++) {
      const i = t.holes[e];
      this.holes.push(i.clone());
    }
    return this;
  }
  toJSON() {
    const t = super.toJSON();
    t.uuid = this.uuid, t.holes = [];
    for (let e = 0, s = this.holes.length; e < s; e++) {
      const i = this.holes[e];
      t.holes.push(i.toJSON());
    }
    return t;
  }
  fromJSON(t) {
    super.fromJSON(t), this.uuid = t.uuid, this.holes = [];
    for (let e = 0, s = t.holes.length; e < s; e++) {
      const i = t.holes[e];
      this.holes.push(new Wr().fromJSON(i));
    }
    return this;
  }
}
const zu = {
  triangulate: function(n, t, e = 2) {
    const s = t && t.length, i = s ? t[0] * e : n.length;
    let r = gh(n, 0, i, e, !0);
    const a = [];
    if (!r || r.next === r.prev) return a;
    let o, c, h, l, u, f, p;
    if (s && (r = qu(n, t, r, e)), n.length > 80 * e) {
      o = h = n[0], c = l = n[1];
      for (let d = e; d < i; d += e)
        u = n[d], f = n[d + 1], u < o && (o = u), f < c && (c = f), u > h && (h = u), f > l && (l = f);
      p = Math.max(h - o, l - c), p = p !== 0 ? 32767 / p : 0;
    }
    return fs(r, a, e, o, c, p, 0), a;
  }
};
function gh(n, t, e, s, i) {
  let r, a;
  if (i === nf(n, t, e, s) > 0)
    for (r = t; r < e; r += s) a = vo(r, n[r], n[r + 1], a);
  else
    for (r = e - s; r >= t; r -= s) a = vo(r, n[r], n[r + 1], a);
  return a && Ii(a, a.next) && (ds(a), a = a.next), a;
}
function fn(n, t) {
  if (!n) return n;
  t || (t = n);
  let e = n, s;
  do
    if (s = !1, !e.steiner && (Ii(e, e.next) || ut(e.prev, e, e.next) === 0)) {
      if (ds(e), e = t = e.prev, e === e.next) break;
      s = !0;
    } else
      e = e.next;
  while (s || e !== t);
  return t;
}
function fs(n, t, e, s, i, r, a) {
  if (!n) return;
  !a && r && Zu(n, s, i, r);
  let o = n, c, h;
  for (; n.prev !== n.next; ) {
    if (c = n.prev, h = n.next, r ? Gu(n, s, i, r) : Hu(n)) {
      t.push(c.i / e | 0), t.push(n.i / e | 0), t.push(h.i / e | 0), ds(n), n = h.next, o = h.next;
      continue;
    }
    if (n = h, n === o) {
      a ? a === 1 ? (n = Vu(fn(n), t, e), fs(n, t, e, s, i, r, 2)) : a === 2 && Wu(n, t, e, s, i, r) : fs(fn(n), t, e, s, i, r, 1);
      break;
    }
  }
}
function Hu(n) {
  const t = n.prev, e = n, s = n.next;
  if (ut(t, e, s) >= 0) return !1;
  const i = t.x, r = e.x, a = s.x, o = t.y, c = e.y, h = s.y, l = i < r ? i < a ? i : a : r < a ? r : a, u = o < c ? o < h ? o : h : c < h ? c : h, f = i > r ? i > a ? i : a : r > a ? r : a, p = o > c ? o > h ? o : h : c > h ? c : h;
  let d = s.next;
  for (; d !== t; ) {
    if (d.x >= l && d.x <= f && d.y >= u && d.y <= p && In(i, o, r, c, a, h, d.x, d.y) && ut(d.prev, d, d.next) >= 0) return !1;
    d = d.next;
  }
  return !0;
}
function Gu(n, t, e, s) {
  const i = n.prev, r = n, a = n.next;
  if (ut(i, r, a) >= 0) return !1;
  const o = i.x, c = r.x, h = a.x, l = i.y, u = r.y, f = a.y, p = o < c ? o < h ? o : h : c < h ? c : h, d = l < u ? l < f ? l : f : u < f ? u : f, g = o > c ? o > h ? o : h : c > h ? c : h, x = l > u ? l > f ? l : f : u > f ? u : f, b = qr(p, d, t, e, s), v = qr(g, x, t, e, s);
  let S = n.prevZ, w = n.nextZ;
  for (; S && S.z >= b && w && w.z <= v; ) {
    if (S.x >= p && S.x <= g && S.y >= d && S.y <= x && S !== i && S !== a && In(o, l, c, u, h, f, S.x, S.y) && ut(S.prev, S, S.next) >= 0 || (S = S.prevZ, w.x >= p && w.x <= g && w.y >= d && w.y <= x && w !== i && w !== a && In(o, l, c, u, h, f, w.x, w.y) && ut(w.prev, w, w.next) >= 0)) return !1;
    w = w.nextZ;
  }
  for (; S && S.z >= b; ) {
    if (S.x >= p && S.x <= g && S.y >= d && S.y <= x && S !== i && S !== a && In(o, l, c, u, h, f, S.x, S.y) && ut(S.prev, S, S.next) >= 0) return !1;
    S = S.prevZ;
  }
  for (; w && w.z <= v; ) {
    if (w.x >= p && w.x <= g && w.y >= d && w.y <= x && w !== i && w !== a && In(o, l, c, u, h, f, w.x, w.y) && ut(w.prev, w, w.next) >= 0) return !1;
    w = w.nextZ;
  }
  return !0;
}
function Vu(n, t, e) {
  let s = n;
  do {
    const i = s.prev, r = s.next.next;
    !Ii(i, r) && mh(i, s, s.next, r) && ps(i, r) && ps(r, i) && (t.push(i.i / e | 0), t.push(s.i / e | 0), t.push(r.i / e | 0), ds(s), ds(s.next), s = n = r), s = s.next;
  } while (s !== n);
  return fn(s);
}
function Wu(n, t, e, s, i, r) {
  let a = n;
  do {
    let o = a.next.next;
    for (; o !== a.prev; ) {
      if (a.i !== o.i && Qu(a, o)) {
        let c = yh(a, o);
        a = fn(a, a.next), c = fn(c, c.next), fs(a, t, e, s, i, r, 0), fs(c, t, e, s, i, r, 0);
        return;
      }
      o = o.next;
    }
    a = a.next;
  } while (a !== n);
}
function qu(n, t, e, s) {
  const i = [];
  let r, a, o, c, h;
  for (r = 0, a = t.length; r < a; r++)
    o = t[r] * s, c = r < a - 1 ? t[r + 1] * s : n.length, h = gh(n, o, c, s, !1), h === h.next && (h.steiner = !0), i.push(Ku(h));
  for (i.sort(ju), r = 0; r < i.length; r++)
    e = Xu(i[r], e);
  return e;
}
function ju(n, t) {
  return n.x - t.x;
}
function Xu(n, t) {
  const e = Yu(n, t);
  if (!e)
    return t;
  const s = yh(e, n);
  return fn(s, s.next), fn(e, e.next);
}
function Yu(n, t) {
  let e = t, s = -1 / 0, i;
  const r = n.x, a = n.y;
  do {
    if (a <= e.y && a >= e.next.y && e.next.y !== e.y) {
      const f = e.x + (a - e.y) * (e.next.x - e.x) / (e.next.y - e.y);
      if (f <= r && f > s && (s = f, i = e.x < e.next.x ? e : e.next, f === r))
        return i;
    }
    e = e.next;
  } while (e !== t);
  if (!i) return null;
  const o = i, c = i.x, h = i.y;
  let l = 1 / 0, u;
  e = i;
  do
    r >= e.x && e.x >= c && r !== e.x && In(a < h ? r : s, a, c, h, a < h ? s : r, a, e.x, e.y) && (u = Math.abs(a - e.y) / (r - e.x), ps(e, n) && (u < l || u === l && (e.x > i.x || e.x === i.x && $u(i, e))) && (i = e, l = u)), e = e.next;
  while (e !== o);
  return i;
}
function $u(n, t) {
  return ut(n.prev, n, t.prev) < 0 && ut(t.next, n, n.next) < 0;
}
function Zu(n, t, e, s) {
  let i = n;
  do
    i.z === 0 && (i.z = qr(i.x, i.y, t, e, s)), i.prevZ = i.prev, i.nextZ = i.next, i = i.next;
  while (i !== n);
  i.prevZ.nextZ = null, i.prevZ = null, Ju(i);
}
function Ju(n) {
  let t, e, s, i, r, a, o, c, h = 1;
  do {
    for (e = n, n = null, r = null, a = 0; e; ) {
      for (a++, s = e, o = 0, t = 0; t < h && (o++, s = s.nextZ, !!s); t++)
        ;
      for (c = h; o > 0 || c > 0 && s; )
        o !== 0 && (c === 0 || !s || e.z <= s.z) ? (i = e, e = e.nextZ, o--) : (i = s, s = s.nextZ, c--), r ? r.nextZ = i : n = i, i.prevZ = r, r = i;
      e = s;
    }
    r.nextZ = null, h *= 2;
  } while (a > 1);
  return n;
}
function qr(n, t, e, s, i) {
  return n = (n - e) * i | 0, t = (t - s) * i | 0, n = (n | n << 8) & 16711935, n = (n | n << 4) & 252645135, n = (n | n << 2) & 858993459, n = (n | n << 1) & 1431655765, t = (t | t << 8) & 16711935, t = (t | t << 4) & 252645135, t = (t | t << 2) & 858993459, t = (t | t << 1) & 1431655765, n | t << 1;
}
function Ku(n) {
  let t = n, e = n;
  do
    (t.x < e.x || t.x === e.x && t.y < e.y) && (e = t), t = t.next;
  while (t !== n);
  return e;
}
function In(n, t, e, s, i, r, a, o) {
  return (i - a) * (t - o) >= (n - a) * (r - o) && (n - a) * (s - o) >= (e - a) * (t - o) && (e - a) * (r - o) >= (i - a) * (s - o);
}
function Qu(n, t) {
  return n.next.i !== t.i && n.prev.i !== t.i && !tf(n, t) && // doesn't intersect other edges
  (ps(n, t) && ps(t, n) && ef(n, t) && // locally visible
  (ut(n.prev, n, t.prev) || ut(n, t.prev, t)) || // does not create opposite-facing sectors
  Ii(n, t) && ut(n.prev, n, n.next) > 0 && ut(t.prev, t, t.next) > 0);
}
function ut(n, t, e) {
  return (t.y - n.y) * (e.x - t.x) - (t.x - n.x) * (e.y - t.y);
}
function Ii(n, t) {
  return n.x === t.x && n.y === t.y;
}
function mh(n, t, e, s) {
  const i = Js(ut(n, t, e)), r = Js(ut(n, t, s)), a = Js(ut(e, s, n)), o = Js(ut(e, s, t));
  return !!(i !== r && a !== o || i === 0 && Zs(n, e, t) || r === 0 && Zs(n, s, t) || a === 0 && Zs(e, n, s) || o === 0 && Zs(e, t, s));
}
function Zs(n, t, e) {
  return t.x <= Math.max(n.x, e.x) && t.x >= Math.min(n.x, e.x) && t.y <= Math.max(n.y, e.y) && t.y >= Math.min(n.y, e.y);
}
function Js(n) {
  return n > 0 ? 1 : n < 0 ? -1 : 0;
}
function tf(n, t) {
  let e = n;
  do {
    if (e.i !== n.i && e.next.i !== n.i && e.i !== t.i && e.next.i !== t.i && mh(e, e.next, n, t)) return !0;
    e = e.next;
  } while (e !== n);
  return !1;
}
function ps(n, t) {
  return ut(n.prev, n, n.next) < 0 ? ut(n, t, n.next) >= 0 && ut(n, n.prev, t) >= 0 : ut(n, t, n.prev) < 0 || ut(n, n.next, t) < 0;
}
function ef(n, t) {
  let e = n, s = !1;
  const i = (n.x + t.x) / 2, r = (n.y + t.y) / 2;
  do
    e.y > r != e.next.y > r && e.next.y !== e.y && i < (e.next.x - e.x) * (r - e.y) / (e.next.y - e.y) + e.x && (s = !s), e = e.next;
  while (e !== n);
  return s;
}
function yh(n, t) {
  const e = new jr(n.i, n.x, n.y), s = new jr(t.i, t.x, t.y), i = n.next, r = t.prev;
  return n.next = t, t.prev = n, e.next = i, i.prev = e, s.next = e, e.prev = s, r.next = s, s.prev = r, s;
}
function vo(n, t, e, s) {
  const i = new jr(n, t, e);
  return s ? (i.next = s.next, i.prev = s, s.next.prev = i, s.next = i) : (i.prev = i, i.next = i), i;
}
function ds(n) {
  n.next.prev = n.prev, n.prev.next = n.next, n.prevZ && (n.prevZ.nextZ = n.nextZ), n.nextZ && (n.nextZ.prevZ = n.prevZ);
}
function jr(n, t, e) {
  this.i = n, this.x = t, this.y = e, this.prev = null, this.next = null, this.z = 0, this.prevZ = null, this.nextZ = null, this.steiner = !1;
}
function nf(n, t, e, s) {
  let i = 0;
  for (let r = t, a = e - s; r < e; r += s)
    i += (n[a] - n[r]) * (n[r + 1] + n[a + 1]), a = r;
  return i;
}
class $e {
  // calculate area of the contour polygon
  static area(t) {
    const e = t.length;
    let s = 0;
    for (let i = e - 1, r = 0; r < e; i = r++)
      s += t[i].x * t[r].y - t[r].x * t[i].y;
    return s * 0.5;
  }
  static isClockWise(t) {
    return $e.area(t) < 0;
  }
  static triangulateShape(t, e) {
    const s = [], i = [], r = [];
    So(t), wo(s, t);
    let a = t.length;
    e.forEach(So);
    for (let c = 0; c < e.length; c++)
      i.push(a), a += e[c].length, wo(s, e[c]);
    const o = zu.triangulate(s, i);
    for (let c = 0; c < o.length; c += 3)
      r.push(o.slice(c, c + 3));
    return r;
  }
}
function So(n) {
  const t = n.length;
  t > 2 && n[t - 1].equals(n[0]) && n.pop();
}
function wo(n, t) {
  for (let e = 0; e < t.length; e++)
    n.push(t[e].x), n.push(t[e].y);
}
class Dn extends Rt {
  constructor(t = new Rn([new X(0, 0.5), new X(-0.5, -0.5), new X(0.5, -0.5)]), e = 12) {
    super(), this.type = "ShapeGeometry", this.parameters = {
      shapes: t,
      curveSegments: e
    };
    const s = [], i = [], r = [], a = [];
    let o = 0, c = 0;
    if (Array.isArray(t) === !1)
      h(t);
    else
      for (let l = 0; l < t.length; l++)
        h(t[l]), this.addGroup(o, c, l), o += c, c = 0;
    this.setIndex(s), this.setAttribute("position", new ln(i, 3)), this.setAttribute("normal", new ln(r, 3)), this.setAttribute("uv", new ln(a, 2));
    function h(l) {
      const u = i.length / 3, f = l.extractPoints(e);
      let p = f.shape;
      const d = f.holes;
      $e.isClockWise(p) === !1 && (p = p.reverse());
      for (let x = 0, b = d.length; x < b; x++) {
        const v = d[x];
        $e.isClockWise(v) === !0 && (d[x] = v.reverse());
      }
      const g = $e.triangulateShape(p, d);
      for (let x = 0, b = d.length; x < b; x++) {
        const v = d[x];
        p = p.concat(v);
      }
      for (let x = 0, b = p.length; x < b; x++) {
        const v = p[x];
        i.push(v.x, v.y, 0), r.push(0, 0, 1), a.push(v.x, v.y);
      }
      for (let x = 0, b = g.length; x < b; x++) {
        const v = g[x], S = v[0] + u, w = v[1] + u, F = v[2] + u;
        s.push(S, w, F), c += 3;
      }
    }
  }
  copy(t) {
    return super.copy(t), this.parameters = Object.assign({}, t.parameters), this;
  }
  toJSON() {
    const t = super.toJSON(), e = this.parameters.shapes;
    return sf(e, t);
  }
  static fromJSON(t, e) {
    const s = [];
    for (let i = 0, r = t.shapes.length; i < r; i++) {
      const a = e[t.shapes[i]];
      s.push(a);
    }
    return new Dn(s, t.curveSegments);
  }
}
function sf(n, t) {
  if (t.shapes = [], Array.isArray(n))
    for (let e = 0, s = n.length; e < s; e++) {
      const i = n[e];
      t.shapes.push(i.uuid);
    }
  else
    t.shapes.push(n.uuid);
  return t;
}
const Co = {
  enabled: !1,
  files: {},
  add: function(n, t) {
    this.enabled !== !1 && (this.files[n] = t);
  },
  get: function(n) {
    if (this.enabled !== !1)
      return this.files[n];
  },
  remove: function(n) {
    delete this.files[n];
  },
  clear: function() {
    this.files = {};
  }
};
class rf {
  constructor(t, e, s) {
    const i = this;
    let r = !1, a = 0, o = 0, c;
    const h = [];
    this.onStart = void 0, this.onLoad = t, this.onProgress = e, this.onError = s, this.itemStart = function(l) {
      o++, r === !1 && i.onStart !== void 0 && i.onStart(l, a, o), r = !0;
    }, this.itemEnd = function(l) {
      a++, i.onProgress !== void 0 && i.onProgress(l, a, o), a === o && (r = !1, i.onLoad !== void 0 && i.onLoad());
    }, this.itemError = function(l) {
      i.onError !== void 0 && i.onError(l);
    }, this.resolveURL = function(l) {
      return c ? c(l) : l;
    }, this.setURLModifier = function(l) {
      return c = l, this;
    }, this.addHandler = function(l, u) {
      return h.push(l, u), this;
    }, this.removeHandler = function(l) {
      const u = h.indexOf(l);
      return u !== -1 && h.splice(u, 2), this;
    }, this.getHandler = function(l) {
      for (let u = 0, f = h.length; u < f; u += 2) {
        const p = h[u], d = h[u + 1];
        if (p.global && (p.lastIndex = 0), p.test(l))
          return d;
      }
      return null;
    };
  }
}
const af = /* @__PURE__ */ new rf();
class xh {
  constructor(t) {
    this.manager = t !== void 0 ? t : af, this.crossOrigin = "anonymous", this.withCredentials = !1, this.path = "", this.resourcePath = "", this.requestHeader = {};
  }
  load() {
  }
  loadAsync(t, e) {
    const s = this;
    return new Promise(function(i, r) {
      s.load(t, i, e, r);
    });
  }
  parse() {
  }
  setCrossOrigin(t) {
    return this.crossOrigin = t, this;
  }
  setWithCredentials(t) {
    return this.withCredentials = t, this;
  }
  setPath(t) {
    return this.path = t, this;
  }
  setResourcePath(t) {
    return this.resourcePath = t, this;
  }
  setRequestHeader(t) {
    return this.requestHeader = t, this;
  }
}
xh.DEFAULT_MATERIAL_NAME = "__DEFAULT";
const ke = {};
class of extends Error {
  constructor(t, e) {
    super(t), this.response = e;
  }
}
class cf extends xh {
  constructor(t) {
    super(t);
  }
  load(t, e, s, i) {
    t === void 0 && (t = ""), this.path !== void 0 && (t = this.path + t), t = this.manager.resolveURL(t);
    const r = Co.get(t);
    if (r !== void 0)
      return this.manager.itemStart(t), setTimeout(() => {
        e && e(r), this.manager.itemEnd(t);
      }, 0), r;
    if (ke[t] !== void 0) {
      ke[t].push({
        onLoad: e,
        onProgress: s,
        onError: i
      });
      return;
    }
    ke[t] = [], ke[t].push({
      onLoad: e,
      onProgress: s,
      onError: i
    });
    const a = new Request(t, {
      headers: new Headers(this.requestHeader),
      credentials: this.withCredentials ? "include" : "same-origin"
      // An abort controller could be added within a future PR
    }), o = this.mimeType, c = this.responseType;
    fetch(a).then((h) => {
      if (h.status === 200 || h.status === 0) {
        if (h.status === 0 && console.warn("THREE.FileLoader: HTTP Status 0 received."), typeof ReadableStream > "u" || h.body === void 0 || h.body.getReader === void 0)
          return h;
        const l = ke[t], u = h.body.getReader(), f = h.headers.get("X-File-Size") || h.headers.get("Content-Length"), p = f ? parseInt(f) : 0, d = p !== 0;
        let g = 0;
        const x = new ReadableStream({
          start(b) {
            v();
            function v() {
              u.read().then(({ done: S, value: w }) => {
                if (S)
                  b.close();
                else {
                  g += w.byteLength;
                  const F = new ProgressEvent("progress", { lengthComputable: d, loaded: g, total: p });
                  for (let O = 0, M = l.length; O < M; O++) {
                    const I = l[O];
                    I.onProgress && I.onProgress(F);
                  }
                  b.enqueue(w), v();
                }
              }, (S) => {
                b.error(S);
              });
            }
          }
        });
        return new Response(x);
      } else
        throw new of(`fetch for "${h.url}" responded with ${h.status}: ${h.statusText}`, h);
    }).then((h) => {
      switch (c) {
        case "arraybuffer":
          return h.arrayBuffer();
        case "blob":
          return h.blob();
        case "document":
          return h.text().then((l) => new DOMParser().parseFromString(l, o));
        case "json":
          return h.json();
        default:
          if (o === void 0)
            return h.text();
          {
            const u = /charset="?([^;"\s]*)"?/i.exec(o), f = u && u[1] ? u[1].toLowerCase() : void 0, p = new TextDecoder(f);
            return h.arrayBuffer().then((d) => p.decode(d));
          }
      }
    }).then((h) => {
      Co.add(t, h);
      const l = ke[t];
      delete ke[t];
      for (let u = 0, f = l.length; u < f; u++) {
        const p = l[u];
        p.onLoad && p.onLoad(h);
      }
    }).catch((h) => {
      const l = ke[t];
      if (l === void 0)
        throw this.manager.itemError(t), h;
      delete ke[t];
      for (let u = 0, f = l.length; u < f; u++) {
        const p = l[u];
        p.onError && p.onError(h);
      }
      this.manager.itemError(t);
    }).finally(() => {
      this.manager.itemEnd(t);
    }), this.manager.itemStart(t);
  }
  setResponseType(t) {
    return this.responseType = t, this;
  }
  setMimeType(t) {
    return this.mimeType = t, this;
  }
}
class bh {
  constructor() {
    this.type = "ShapePath", this.color = new Yn(), this.subPaths = [], this.currentPath = null;
  }
  moveTo(t, e) {
    return this.currentPath = new Wr(), this.subPaths.push(this.currentPath), this.currentPath.moveTo(t, e), this;
  }
  lineTo(t, e) {
    return this.currentPath.lineTo(t, e), this;
  }
  quadraticCurveTo(t, e, s, i) {
    return this.currentPath.quadraticCurveTo(t, e, s, i), this;
  }
  bezierCurveTo(t, e, s, i, r, a) {
    return this.currentPath.bezierCurveTo(t, e, s, i, r, a), this;
  }
  splineThru(t) {
    return this.currentPath.splineThru(t), this;
  }
  toShapes(t) {
    function e(b) {
      const v = [];
      for (let S = 0, w = b.length; S < w; S++) {
        const F = b[S], O = new Rn();
        O.curves = F.curves, v.push(O);
      }
      return v;
    }
    function s(b, v) {
      const S = v.length;
      let w = !1;
      for (let F = S - 1, O = 0; O < S; F = O++) {
        let M = v[F], I = v[O], H = I.x - M.x, R = I.y - M.y;
        if (Math.abs(R) > Number.EPSILON) {
          if (R < 0 && (M = v[O], H = -H, I = v[F], R = -R), b.y < M.y || b.y > I.y) continue;
          if (b.y === M.y) {
            if (b.x === M.x) return !0;
          } else {
            const W = R * (b.x - M.x) - H * (b.y - M.y);
            if (W === 0) return !0;
            if (W < 0) continue;
            w = !w;
          }
        } else {
          if (b.y !== M.y) continue;
          if (I.x <= b.x && b.x <= M.x || M.x <= b.x && b.x <= I.x) return !0;
        }
      }
      return w;
    }
    const i = $e.isClockWise, r = this.subPaths;
    if (r.length === 0) return [];
    let a, o, c;
    const h = [];
    if (r.length === 1)
      return o = r[0], c = new Rn(), c.curves = o.curves, h.push(c), h;
    let l = !i(r[0].getPoints());
    l = t ? !l : l;
    const u = [], f = [];
    let p = [], d = 0, g;
    f[d] = void 0, p[d] = [];
    for (let b = 0, v = r.length; b < v; b++)
      o = r[b], g = o.getPoints(), a = i(g), a = t ? !a : a, a ? (!l && f[d] && d++, f[d] = { s: new Rn(), p: g }, f[d].s.curves = o.curves, l && d++, p[d] = []) : p[d].push({ h: o, p: g[0] });
    if (!f[0]) return e(r);
    if (f.length > 1) {
      let b = !1, v = 0;
      for (let S = 0, w = f.length; S < w; S++)
        u[S] = [];
      for (let S = 0, w = f.length; S < w; S++) {
        const F = p[S];
        for (let O = 0; O < F.length; O++) {
          const M = F[O];
          let I = !0;
          for (let H = 0; H < f.length; H++)
            s(M.p, f[H].p) && (S !== H && v++, I ? (I = !1, u[H].push(M)) : b = !0);
          I && u[S].push(M);
        }
      }
      v > 0 && b === !1 && (p = u);
    }
    let x;
    for (let b = 0, v = f.length; b < v; b++) {
      c = f[b].s, h.push(c), x = p[b];
      for (let S = 0, w = x.length; S < w; S++)
        c.holes.push(x[S].h);
    }
    return h;
  }
}
typeof __THREE_DEVTOOLS__ < "u" && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register", { detail: {
  revision: rh
} }));
typeof window < "u" && (window.__THREE__ ? console.warn("WARNING: Multiple instances of Three.js being imported.") : window.__THREE__ = rh);
function vh(n) {
  var s, i, r;
  if (!n || hf(n))
    return 0;
  let t = 0;
  const { attributes: e } = n;
  for (const a of Object.keys(e)) {
    const o = e[a];
    ((s = o == null ? void 0 : o.array) == null ? void 0 : s.byteLength) != null && (t += o.array.byteLength);
  }
  return ((r = (i = n.index) == null ? void 0 : i.array) == null ? void 0 : r.byteLength) != null && (t += n.index.array.byteLength), t;
}
function hf(n) {
  return n.disposed === !0 ? !0 : Object.keys(n.attributes).length === 0 && n.index == null;
}
function lf(n) {
  return n ? n.length * 2 : 0;
}
function Sh(n) {
  return n instanceof ArrayBuffer || ArrayBuffer.isView(n) ? n.byteLength : 0;
}
class fa {
  /**
   * Creates an LRU cache with the given capacity and optional eviction handler.
   *
   * @param maxSize - Maximum number of entries to retain. Defaults to 4096.
   * @param onEvict - Optional callback invoked for each evicted or replaced value.
   */
  constructor(t = 4096, e) {
    this.map = /* @__PURE__ */ new Map(), this.maxSize = t, this.onEvict = e;
  }
  /**
   * Returns the value for `key` and marks it as most recently used.
   *
   * @param key - The cache key to look up.
   * @returns The cached value, or `undefined` if the key is not present.
   */
  get(t) {
    const e = this.map.get(t);
    return e !== void 0 && (this.map.delete(t), this.map.set(t, e)), e;
  }
  /**
   * Stores `value` under `key` and marks it as most recently used.
   *
   * If the key already exists, its previous value is passed to {@link onEvict}
   * when the new value differs. If the cache is at capacity, the least recently
   * used entry is evicted before the new entry is inserted.
   *
   * @param key - The cache key to set.
   * @param value - The value to store.
   */
  set(t, e) {
    var s, i;
    if (this.map.has(t)) {
      const r = this.map.get(t);
      this.map.delete(t), r !== e && ((s = this.onEvict) == null || s.call(this, t, r));
    } else if (this.map.size >= this.maxSize) {
      const r = this.map.keys().next().value;
      if (r !== void 0) {
        const a = this.map.get(r);
        this.map.delete(r), (i = this.onEvict) == null || i.call(this, r, a);
      }
    }
    this.map.set(t, e);
  }
  /**
   * Returns whether `key` exists in the cache without updating its recency.
   *
   * @param key - The cache key to test.
   * @returns True if the key is present; otherwise, false.
   */
  has(t) {
    return this.map.has(t);
  }
  /**
   * Number of entries currently stored in the cache.
   */
  get size() {
    return this.map.size;
  }
  /**
   * Maximum number of entries this cache may retain.
   */
  get capacity() {
    return this.maxSize;
  }
  /**
   * Iterates over cached values without updating recency order.
   */
  values() {
    return this.map.values();
  }
  /**
   * Removes all entries from the cache.
   *
   * If an {@link onEvict} handler was provided, it is invoked once per entry
   * before the internal map is cleared.
   */
  clear() {
    if (this.onEvict)
      for (const [t, e] of this.map)
        this.onEvict(t, e);
    this.map.clear();
  }
}
const uf = 4096;
class ff {
  constructor(t = uf) {
    this.maxSize = t, this.cache = new fa(t, (e, s) => {
      s.dispose();
    });
  }
  /**
   * Returns true if the geometry of the specified character code exists in the cache.
   * Otherwise, returns false.
   * @param code One character code.
   * @param size The font size.
   * @returns True if the geometry of the specified character code exists in the cache.
   * Otherwise, returns false.
   */
  hasGeometry(t, e) {
    const s = this.generateKey(t, e);
    return this.cache.has(s);
  }
  /**
   * Get the geometry for a single character from cache if available.
   * The cache key includes both character codeand size.
   * @param code The character code to get geometry from cache.
   * @param size The font size.
   * @returns The geometry for a single character from cache if avaiable.
   * Return undefined if the character not found in cache.
   */
  getGeometry(t, e) {
    const s = this.generateKey(t, e);
    return this.cache.get(s);
  }
  /**
   * Set the geometry to cache for a single character.
   * @param char The character to set geometry for.
   * @param size The font size.
   * @param geometry The geometry to set.
   */
  setGeometry(t, e, s) {
    const i = this.generateKey(t, e);
    this.cache.set(i, s);
  }
  /**
   * Estimates memory used by cached BufferGeometry attribute/index buffers.
   */
  getStats() {
    let t = 0;
    for (const e of this.cache.values())
      t += vh(e);
    return {
      entries: this.cache.size,
      maxEntries: this.maxSize,
      estimatedBytes: t
    };
  }
  /**
   * Dispose all cached geometries.
   */
  dispose() {
    this.cache.clear();
  }
  /**
   * Generates cache key by character and font size.
   * @param char One character code.
   * @param size The font size.
   */
  generateKey(t, e) {
    return `${t}_${e}`;
  }
}
class wh {
  constructor(t) {
    this.names = /* @__PURE__ */ new Set(), this.unsupportedChars = {}, this.encoding = t.encoding, t.alias.forEach((e) => this.names.add(e)), this.sourceByteLength = Sh(t.data), this.cache = new ff();
  }
  /**
   * Releases cache resources held by this font so they are eligible for GC
   * and no longer appear in {@link estimateMemoryUsage}.
   */
  dispose() {
    this.cache.dispose();
  }
  /**
   * Gets a named SHX shape glyph when supported by the font implementation.
   */
  getShapeByName(t, e) {
  }
  /**
   * Records an unsupported character in the font.
   * Increments the count for the given character in unsupportedChars.
   * @param char - The unsupported character to record
   */
  addUnsupportedChar(t) {
    this.unsupportedChars[t] || (this.unsupportedChars[t] = 0), this.unsupportedChars[t]++;
  }
}
class Ch extends Rn {
  constructor() {
    super(...arguments), this.width = 0;
  }
  /**
   * Whether the shape has drawable stroke or mesh geometry (not advance-only).
   */
  hasStrokeGeometry() {
    return this.width > 0;
  }
}
class To {
  constructor() {
    this.listeners = [];
  }
  /**
   * Add the event listener
   * @param listener Input listener to be added
   */
  addEventListener(t) {
    this.listeners.push(t);
  }
  /**
   * Remove the listener
   * @param listener Input listener to be removed
   */
  removeEventListener(t) {
    this.listeners = this.listeners.filter((e) => e !== t);
  }
  /**
   * Remove all listeners bound to the target and add one new listener
   * @param listener Input listener to be added
   */
  replaceEventListener(t) {
    this.removeEventListener(t), this.addEventListener(t);
  }
  /**
   * Notify all listeners
   * @param payload Input payload passed to listener
   */
  dispatch(t, ...e) {
    for (const s of this.listeners)
      s.call(null, t, ...e);
  }
}
const pf = (n) => n.substring(n.lastIndexOf(".") + 1), Th = (n) => n.split("/").pop(), Ve = (n) => {
  const t = Th(n);
  if (t) {
    const e = t.lastIndexOf(".");
    return e === -1 ? t : t.substring(0, e);
  }
  return n;
}, df = [
  0,
  16711680,
  16776960,
  65280,
  65535,
  255,
  16711935,
  16777215,
  8421504,
  12632256,
  16711680,
  16744319,
  13369344,
  13395558,
  10027008,
  10046540,
  8323072,
  8339263,
  4980736,
  4990502,
  16727808,
  16752511,
  13382400,
  13401958,
  10036736,
  10051404,
  8331008,
  8343359,
  4985600,
  4992806,
  16744192,
  16760703,
  13395456,
  13408614,
  10046464,
  10056268,
  8339200,
  8347455,
  4990464,
  4995366,
  16760576,
  16768895,
  13408512,
  13415014,
  10056192,
  10061132,
  8347392,
  8351551,
  4995328,
  4997670,
  16776960,
  16777087,
  13421568,
  13421670,
  10000384,
  10000460,
  8355584,
  8355647,
  5000192,
  5000230,
  12582656,
  14679935,
  10079232,
  11717734,
  7510016,
  8755276,
  6258432,
  7307071,
  3755008,
  4344870,
  8388352,
  12582783,
  6736896,
  10079334,
  5019648,
  7510092,
  4161280,
  6258495,
  2509824,
  3755046,
  4194048,
  10485631,
  3394560,
  8375398,
  2529280,
  6264908,
  2064128,
  5209919,
  1264640,
  3099686,
  65280,
  8388479,
  52224,
  6736998,
  38912,
  5019724,
  32512,
  4161343,
  19456,
  2509862,
  65343,
  8388511,
  52275,
  6737023,
  38950,
  5019743,
  32543,
  4161359,
  19475,
  2509871,
  65407,
  8388543,
  52326,
  6737049,
  38988,
  5019762,
  32575,
  4161375,
  19494,
  2509881,
  65471,
  8388575,
  52377,
  6737074,
  39026,
  5019781,
  32607,
  4161391,
  19513,
  2509890,
  65535,
  8388607,
  52428,
  6737100,
  39064,
  5019800,
  32639,
  4161407,
  19532,
  2509900,
  49151,
  8380415,
  39372,
  6730444,
  29336,
  5014936,
  24447,
  4157311,
  14668,
  2507340,
  32767,
  8372223,
  26316,
  6724044,
  19608,
  5010072,
  16255,
  4153215,
  9804,
  2505036,
  16383,
  8364031,
  13260,
  6717388,
  9880,
  5005208,
  8063,
  4149119,
  4940,
  2502476,
  255,
  8355839,
  204,
  6710988,
  152,
  5000344,
  127,
  4145023,
  76,
  2500172,
  4129023,
  10452991,
  3342540,
  8349388,
  2490520,
  6245528,
  2031743,
  5193599,
  1245260,
  3089996,
  8323327,
  12550143,
  6684876,
  10053324,
  4980888,
  7490712,
  4128895,
  6242175,
  2490444,
  3745356,
  12517631,
  14647295,
  10027212,
  11691724,
  7471256,
  8735896,
  6226047,
  7290751,
  3735628,
  4335180,
  16711935,
  16744447,
  13369548,
  13395660,
  9961624,
  9981080,
  8323199,
  8339327,
  4980812,
  4990540,
  16711871,
  16744415,
  13369497,
  13395634,
  9961586,
  9981061,
  8323167,
  8339311,
  4980793,
  4990530,
  16711807,
  16744383,
  13369446,
  13395609,
  9961548,
  9981042,
  8323135,
  8339295,
  4980774,
  4990521,
  16711743,
  16744351,
  13369395,
  13395583,
  9961510,
  9981023,
  8323103,
  8339279,
  4980755,
  4990511,
  3355443,
  5987163,
  8684676,
  11382189,
  14079702,
  16777215,
  0
], Fh = (n) => df[n], Xr = (n, t) => t.some((e) => n instanceof e);
let Fo, Ao;
function gf() {
  return Fo || (Fo = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function mf() {
  return Ao || (Ao = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
const Yr = /* @__PURE__ */ new WeakMap(), gr = /* @__PURE__ */ new WeakMap(), Bi = /* @__PURE__ */ new WeakMap();
function yf(n) {
  const t = new Promise((e, s) => {
    const i = () => {
      n.removeEventListener("success", r), n.removeEventListener("error", a);
    }, r = () => {
      e(un(n.result)), i();
    }, a = () => {
      s(n.error), i();
    };
    n.addEventListener("success", r), n.addEventListener("error", a);
  });
  return Bi.set(t, n), t;
}
function xf(n) {
  if (Yr.has(n))
    return;
  const t = new Promise((e, s) => {
    const i = () => {
      n.removeEventListener("complete", r), n.removeEventListener("error", a), n.removeEventListener("abort", a);
    }, r = () => {
      e(), i();
    }, a = () => {
      s(n.error || new DOMException("AbortError", "AbortError")), i();
    };
    n.addEventListener("complete", r), n.addEventListener("error", a), n.addEventListener("abort", a);
  });
  Yr.set(n, t);
}
let $r = {
  get(n, t, e) {
    if (n instanceof IDBTransaction) {
      if (t === "done")
        return Yr.get(n);
      if (t === "store")
        return e.objectStoreNames[1] ? void 0 : e.objectStore(e.objectStoreNames[0]);
    }
    return un(n[t]);
  },
  set(n, t, e) {
    return n[t] = e, !0;
  },
  has(n, t) {
    return n instanceof IDBTransaction && (t === "done" || t === "store") ? !0 : t in n;
  }
};
function Ah(n) {
  $r = n($r);
}
function bf(n) {
  return mf().includes(n) ? function(...t) {
    return n.apply(Zr(this), t), un(this.request);
  } : function(...t) {
    return un(n.apply(Zr(this), t));
  };
}
function vf(n) {
  return typeof n == "function" ? bf(n) : (n instanceof IDBTransaction && xf(n), Xr(n, gf()) ? new Proxy(n, $r) : n);
}
function un(n) {
  if (n instanceof IDBRequest)
    return yf(n);
  if (gr.has(n))
    return gr.get(n);
  const t = vf(n);
  return t !== n && (gr.set(n, t), Bi.set(t, n)), t;
}
const Zr = (n) => Bi.get(n);
function Sf(n, t, { blocked: e, upgrade: s, blocking: i, terminated: r } = {}) {
  const a = indexedDB.open(n, t), o = un(a);
  return s && a.addEventListener("upgradeneeded", (c) => {
    s(un(a.result), c.oldVersion, c.newVersion, un(a.transaction), c);
  }), e && a.addEventListener("blocked", (c) => e(
    // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
    c.oldVersion,
    c.newVersion,
    c
  )), o.then((c) => {
    r && c.addEventListener("close", () => r()), i && c.addEventListener("versionchange", (h) => i(h.oldVersion, h.newVersion, h));
  }).catch(() => {
  }), o;
}
const wf = ["get", "getKey", "getAll", "getAllKeys", "count"], Cf = ["put", "add", "delete", "clear"], mr = /* @__PURE__ */ new Map();
function ko(n, t) {
  if (!(n instanceof IDBDatabase && !(t in n) && typeof t == "string"))
    return;
  if (mr.get(t))
    return mr.get(t);
  const e = t.replace(/FromIndex$/, ""), s = t !== e, i = Cf.includes(e);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(e in (s ? IDBIndex : IDBObjectStore).prototype) || !(i || wf.includes(e))
  )
    return;
  const r = async function(a, ...o) {
    const c = this.transaction(a, i ? "readwrite" : "readonly");
    let h = c.store;
    return s && (h = h.index(o.shift())), (await Promise.all([
      h[e](...o),
      i && c.done
    ]))[0];
  };
  return mr.set(t, r), r;
}
Ah((n) => ({
  ...n,
  get: (t, e, s) => ko(t, e) || n.get(t, e, s),
  has: (t, e) => !!ko(t, e) || n.has(t, e)
}));
const Tf = ["continue", "continuePrimaryKey", "advance"], Eo = {}, Jr = /* @__PURE__ */ new WeakMap(), kh = /* @__PURE__ */ new WeakMap(), Ff = {
  get(n, t) {
    if (!Tf.includes(t))
      return n[t];
    let e = Eo[t];
    return e || (e = Eo[t] = function(...s) {
      Jr.set(this, kh.get(this)[t](...s));
    }), e;
  }
};
async function* Af(...n) {
  let t = this;
  if (t instanceof IDBCursor || (t = await t.openCursor(...n)), !t)
    return;
  t = t;
  const e = new Proxy(t, Ff);
  for (kh.set(e, t), Bi.set(e, Zr(t)); t; )
    yield e, t = await (Jr.get(e) || t.continue()), Jr.delete(e);
}
function Mo(n, t) {
  return t === Symbol.asyncIterator && Xr(n, [IDBIndex, IDBObjectStore, IDBCursor]) || t === "iterate" && Xr(n, [IDBIndex, IDBObjectStore]);
}
Ah((n) => ({
  ...n,
  get(t, e, s) {
    return Mo(t, e) ? Af : n.get(t, e, s);
  },
  has(t, e) {
    return Mo(t, e) || n.has(t, e);
  }
}));
const an = {
  fonts: "fonts"
}, yr = [
  {
    version: 1,
    stores: [
      {
        name: an.fonts,
        keyPath: "name"
      }
    ]
  },
  {
    version: 2,
    stores: [
      {
        name: an.fonts,
        keyPath: "name"
      }
    ]
  }
], qt = class qt {
  constructor() {
    this.isClosing = !1, typeof window < "u" && window.addEventListener("unload", () => {
      this.close();
    });
  }
  /**
   * Returns the singleton instance of the FontCacheManager
   */
  static get instance() {
    return qt._instance || (qt._instance = new qt()), qt._instance;
  }
  /**
   * Sets a font in the cache
   * @param fileName The font file name (key)
   * @param fontData The font data to store
   */
  async set(t, e) {
    await (await this.getDatabase()).put(an.fonts, { ...e, name: t });
  }
  /**
   * Gets a font from the cache
   * @param fileName The font file name (key)
   * @returns The font data if found, undefined otherwise
   */
  async get(t) {
    return await (await this.getDatabase()).get(an.fonts, t);
  }
  /**
   * Finds a font in the cache by primary name or alias.
   * Font names may include or omit a file extension (e.g. `romans` or `romans.shx`).
   * @param fontName The font name or alias to look up
   * @returns The font data if found, undefined otherwise
   */
  async find(t) {
    const e = Ve(t).toLowerCase(), s = await this.get(e);
    return s || (await this.getAll()).find(
      (r) => {
        var a;
        return r.name === e || ((a = r.alias) == null ? void 0 : a.some((o) => o.toLowerCase() === e));
      }
    );
  }
  /**
   * Deletes a font from the cache
   * @param fileName The font file name (key)
   */
  async delete(t) {
    await (await this.getDatabase()).delete(an.fonts, t);
  }
  /**
   * Gets all fonts from the cache
   * @returns An array of all font data in the cache
   */
  async getAll() {
    return await (await this.getDatabase()).getAll(an.fonts);
  }
  /**
   * Estimates IndexedDB font-blob storage size.
   *
   * @remarks
   * This loads all cached font payloads into the JS heap temporarily via
   * {@link getAll}, then measures each `data` ArrayBuffer.
   */
  async getStorageStats() {
    const e = (await this.getAll()).map((i) => ({
      name: i.name,
      type: i.type,
      bytes: Sh(i.data)
    })), s = e.reduce((i, r) => i + r.bytes, 0);
    return {
      fontCount: e.length,
      totalBytes: s,
      fonts: e
    };
  }
  /**
   * Clears all fonts from the cache
   */
  async clear() {
    await (await this.getDatabase()).clear(an.fonts);
  }
  /**
   * Checks if a font exists in the cache
   * @param fileName The font file name (key)
   */
  async has(t) {
    return await this.get(t) !== void 0;
  }
  /**
   * Closes the database connection and cleans up resources.
   * After calling this, any further operations will require reopening the database.
   */
  close() {
    if (!this.isClosing) {
      this.isClosing = !0;
      try {
        this.db && (this.db.close(), this.db = void 0);
      } finally {
        this.isClosing = !1;
      }
    }
  }
  /**
   * Destroys the database instance and deletes all data.
   * Use with caution as this operation cannot be undone.
   */
  async destroy() {
    this.close(), await indexedDB.deleteDatabase(qt.DATABASE_NAME), qt._instance = void 0;
  }
  // Private methods for database management
  async getDatabase() {
    if (this.isClosing)
      throw new Error("Cannot perform operation while database is closing");
    return this.db ? this.db : (this.db = await Sf(
      qt.DATABASE_NAME,
      qt.DATABASE_VERSION,
      {
        upgrade: (t, e, s) => this.handleUpgrade(t, e, s),
        blocked() {
          console.warn(
            "Database upgrade blocked - please close other tabs using the application"
          );
        },
        blocking() {
          console.warn("Database blocking newer version - closing connection"), qt.instance.close();
        }
      }
    ), this.db);
  }
  /**
   * Applies all schema versions that are greater than the old version and less than or equal to the new version
   * @param db The database instance
   * @param oldVersion The old version of the database
   * @param newVersion The new version of the database
   */
  handleUpgrade(t, e, s) {
    const i = yr.filter(
      (r) => r.version > e && (!s || r.version <= s)
    );
    for (const r of i)
      this.applySchemaVersion(t, r);
  }
  /**
   * Applies a single schema version's changes to the database
   * @param db The database instance
   * @param schema The schema version to apply
   */
  applySchemaVersion(t, e) {
    for (const s of e.stores)
      t.objectStoreNames.contains(s.name) || t.createObjectStore(s.name, { keyPath: s.keyPath });
  }
};
qt.DATABASE_NAME = "mlightcad", qt.DATABASE_VERSION = yr[yr.length - 1].version;
let We = qt;
const kf = 512;
function Ef(n, t) {
  return (n + t) * kf;
}
const Mf = 2.5, Of = 1.5;
function Eh() {
  return {
    meshCount: 0,
    lineCount: 0,
    estimatedBytes: 0
  };
}
const Kr = {
  minimal: ["txt", "simkai"],
  r12r14: ["txt", "simplex", "romans", "gbcbig", "simsun"],
  modern: ["hztxt", "simsun"],
  international: ["txt", "simplex", "romans", "simsun"],
  cjk: ["gbcbig", "hztxt", "simsun", "simkai"]
}, xr = {
  minimal: ["simplex", "amgdt"],
  r12r14: ["simplex", "amgdt"],
  modern: ["simplex", "amgdt"],
  international: ["simplex", "amgdt"],
  cjk: ["simplex", "amgdt"]
};
function Oo(n) {
  return Object.prototype.hasOwnProperty.call(Kr, n);
}
var pa = 0, Mh = -3;
function gs() {
  this.table = new Uint16Array(16), this.trans = new Uint16Array(288);
}
function _f(n, t) {
  this.source = n, this.sourceIndex = 0, this.tag = 0, this.bitcount = 0, this.dest = t, this.destLen = 0, this.ltree = new gs(), this.dtree = new gs();
}
var Oh = new gs(), _h = new gs(), da = new Uint8Array(30), ga = new Uint16Array(30), Lh = new Uint8Array(30), Ih = new Uint16Array(30), Lf = new Uint8Array([
  16,
  17,
  18,
  0,
  8,
  7,
  9,
  6,
  10,
  5,
  11,
  4,
  12,
  3,
  13,
  2,
  14,
  1,
  15
]), _o = new gs(), pe = new Uint8Array(320);
function Bh(n, t, e, s) {
  var i, r;
  for (i = 0; i < e; ++i) n[i] = 0;
  for (i = 0; i < 30 - e; ++i) n[i + e] = i / e | 0;
  for (r = s, i = 0; i < 30; ++i)
    t[i] = r, r += 1 << n[i];
}
function If(n, t) {
  var e;
  for (e = 0; e < 7; ++e) n.table[e] = 0;
  for (n.table[7] = 24, n.table[8] = 152, n.table[9] = 112, e = 0; e < 24; ++e) n.trans[e] = 256 + e;
  for (e = 0; e < 144; ++e) n.trans[24 + e] = e;
  for (e = 0; e < 8; ++e) n.trans[168 + e] = 280 + e;
  for (e = 0; e < 112; ++e) n.trans[176 + e] = 144 + e;
  for (e = 0; e < 5; ++e) t.table[e] = 0;
  for (t.table[5] = 32, e = 0; e < 32; ++e) t.trans[e] = e;
}
var Lo = new Uint16Array(16);
function br(n, t, e, s) {
  var i, r;
  for (i = 0; i < 16; ++i) n.table[i] = 0;
  for (i = 0; i < s; ++i) n.table[t[e + i]]++;
  for (n.table[0] = 0, r = 0, i = 0; i < 16; ++i)
    Lo[i] = r, r += n.table[i];
  for (i = 0; i < s; ++i)
    t[e + i] && (n.trans[Lo[t[e + i]]++] = i);
}
function Bf(n) {
  n.bitcount-- || (n.tag = n.source[n.sourceIndex++], n.bitcount = 7);
  var t = n.tag & 1;
  return n.tag >>>= 1, t;
}
function ge(n, t, e) {
  if (!t)
    return e;
  for (; n.bitcount < 24; )
    n.tag |= n.source[n.sourceIndex++] << n.bitcount, n.bitcount += 8;
  var s = n.tag & 65535 >>> 16 - t;
  return n.tag >>>= t, n.bitcount -= t, s + e;
}
function Qr(n, t) {
  for (; n.bitcount < 24; )
    n.tag |= n.source[n.sourceIndex++] << n.bitcount, n.bitcount += 8;
  var e = 0, s = 0, i = 0, r = n.tag;
  do
    s = 2 * s + (r & 1), r >>>= 1, ++i, e += t.table[i], s -= t.table[i];
  while (s >= 0);
  return n.tag = r, n.bitcount -= i, t.trans[e + s];
}
function Rf(n, t, e) {
  var s, i, r, a, o, c;
  for (s = ge(n, 5, 257), i = ge(n, 5, 1), r = ge(n, 4, 4), a = 0; a < 19; ++a) pe[a] = 0;
  for (a = 0; a < r; ++a) {
    var h = ge(n, 3, 0);
    pe[Lf[a]] = h;
  }
  for (br(_o, pe, 0, 19), o = 0; o < s + i; ) {
    var l = Qr(n, _o);
    switch (l) {
      case 16:
        var u = pe[o - 1];
        for (c = ge(n, 2, 3); c; --c)
          pe[o++] = u;
        break;
      case 17:
        for (c = ge(n, 3, 3); c; --c)
          pe[o++] = 0;
        break;
      case 18:
        for (c = ge(n, 7, 11); c; --c)
          pe[o++] = 0;
        break;
      default:
        pe[o++] = l;
        break;
    }
  }
  br(t, pe, 0, s), br(e, pe, s, i);
}
function Io(n, t, e) {
  for (; ; ) {
    var s = Qr(n, t);
    if (s === 256)
      return pa;
    if (s < 256)
      n.dest[n.destLen++] = s;
    else {
      var i, r, a, o;
      for (s -= 257, i = ge(n, da[s], ga[s]), r = Qr(n, e), a = n.destLen - ge(n, Lh[r], Ih[r]), o = a; o < a + i; ++o)
        n.dest[n.destLen++] = n.dest[o];
    }
  }
}
function Df(n) {
  for (var t, e, s; n.bitcount > 8; )
    n.sourceIndex--, n.bitcount -= 8;
  if (t = n.source[n.sourceIndex + 1], t = 256 * t + n.source[n.sourceIndex], e = n.source[n.sourceIndex + 3], e = 256 * e + n.source[n.sourceIndex + 2], t !== (~e & 65535))
    return Mh;
  for (n.sourceIndex += 4, s = t; s; --s)
    n.dest[n.destLen++] = n.source[n.sourceIndex++];
  return n.bitcount = 0, pa;
}
function Rh(n, t) {
  var e = new _f(n, t), s, i, r;
  do {
    switch (s = Bf(e), i = ge(e, 2, 0), i) {
      case 0:
        r = Df(e);
        break;
      case 1:
        r = Io(e, Oh, _h);
        break;
      case 2:
        Rf(e, e.ltree, e.dtree), r = Io(e, e.ltree, e.dtree);
        break;
      default:
        r = Mh;
    }
    if (r !== pa)
      throw new Error("Data error");
  } while (!s);
  return e.destLen < e.dest.length ? typeof e.dest.slice == "function" ? e.dest.slice(0, e.destLen) : e.dest.subarray(0, e.destLen) : e.dest;
}
If(Oh, _h);
Bh(da, ga, 4, 3);
Bh(Lh, Ih, 2, 1);
da[28] = 0;
ga[28] = 258;
function Mn(n, t, e, s, i) {
  return Math.pow(1 - i, 3) * n + 3 * Math.pow(1 - i, 2) * i * t + 3 * (1 - i) * Math.pow(i, 2) * e + Math.pow(i, 3) * s;
}
function gn() {
  this.x1 = Number.NaN, this.y1 = Number.NaN, this.x2 = Number.NaN, this.y2 = Number.NaN;
}
gn.prototype.isEmpty = function() {
  return isNaN(this.x1) || isNaN(this.y1) || isNaN(this.x2) || isNaN(this.y2);
};
gn.prototype.addPoint = function(n, t) {
  typeof n == "number" && ((isNaN(this.x1) || isNaN(this.x2)) && (this.x1 = n, this.x2 = n), n < this.x1 && (this.x1 = n), n > this.x2 && (this.x2 = n)), typeof t == "number" && ((isNaN(this.y1) || isNaN(this.y2)) && (this.y1 = t, this.y2 = t), t < this.y1 && (this.y1 = t), t > this.y2 && (this.y2 = t));
};
gn.prototype.addX = function(n) {
  this.addPoint(n, null);
};
gn.prototype.addY = function(n) {
  this.addPoint(null, n);
};
gn.prototype.addBezier = function(n, t, e, s, i, r, a, o) {
  const c = [n, t], h = [e, s], l = [i, r], u = [a, o];
  this.addPoint(n, t), this.addPoint(a, o);
  for (let f = 0; f <= 1; f++) {
    const p = 6 * c[f] - 12 * h[f] + 6 * l[f], d = -3 * c[f] + 9 * h[f] - 9 * l[f] + 3 * u[f], g = 3 * h[f] - 3 * c[f];
    if (d === 0) {
      if (p === 0) continue;
      const S = -g / p;
      0 < S && S < 1 && (f === 0 && this.addX(Mn(c[f], h[f], l[f], u[f], S)), f === 1 && this.addY(Mn(c[f], h[f], l[f], u[f], S)));
      continue;
    }
    const x = Math.pow(p, 2) - 4 * g * d;
    if (x < 0) continue;
    const b = (-p + Math.sqrt(x)) / (2 * d);
    0 < b && b < 1 && (f === 0 && this.addX(Mn(c[f], h[f], l[f], u[f], b)), f === 1 && this.addY(Mn(c[f], h[f], l[f], u[f], b)));
    const v = (-p - Math.sqrt(x)) / (2 * d);
    0 < v && v < 1 && (f === 0 && this.addX(Mn(c[f], h[f], l[f], u[f], v)), f === 1 && this.addY(Mn(c[f], h[f], l[f], u[f], v)));
  }
};
gn.prototype.addQuad = function(n, t, e, s, i, r) {
  const a = n + 0.6666666666666666 * (e - n), o = t + 2 / 3 * (s - t), c = a + 1 / 3 * (i - n), h = o + 1 / 3 * (r - t);
  this.addBezier(n, t, a, o, c, h, i, r);
};
var Dh = gn;
function vt() {
  this.commands = [], this.fill = "black", this.stroke = null, this.strokeWidth = 1;
}
var ns = {};
function Uh(n, t) {
  const e = Math.floor(n), s = n - e;
  if (ns[t] || (ns[t] = {}), ns[t][s] !== void 0) {
    const r = ns[t][s];
    return e + r;
  }
  const i = +(Math.round(s + "e+" + t) + "e-" + t);
  return ns[t][s] = i, e + i;
}
function Ph(n) {
  let t = [[]], e = 0, s = 0;
  for (let i = 0; i < n.length; i += 1) {
    const r = t[t.length - 1], a = n[i], o = r[0], c = r[1], h = r[r.length - 1], l = n[i + 1];
    r.push(a), a.type === "M" ? (e = a.x, s = a.y) : a.type === "L" && (!l || l.type === "Z") ? Math.abs(a.x - e) > 1 || Math.abs(a.y - s) > 1 || r.pop() : a.type === "L" && h && h.x === a.x && h.y === a.y ? r.pop() : a.type === "Z" && (o && c && h && o.type === "M" && c.type === "L" && h.type === "L" && h.x === o.x && h.y === o.y && (r.shift(), r[0].type = "M"), i + 1 < n.length && t.push([]));
  }
  return n = [].concat.apply([], t), n;
}
function Uf(n) {
  return Object.assign({}, {
    decimalPlaces: 2,
    optimize: !0,
    flipY: !0,
    flipYBase: void 0,
    scale: 1,
    x: 0,
    y: 0
  }, n);
}
function Pf(n) {
  return parseInt(n) === n && (n = { decimalPlaces: n, flipY: !1 }), Object.assign({}, {
    decimalPlaces: 2,
    optimize: !0,
    flipY: !0,
    flipYBase: void 0
  }, n);
}
vt.prototype.fromSVG = function(n, t = {}) {
  typeof SVGPathElement < "u" && n instanceof SVGPathElement && (n = n.getAttribute("d")), t = Uf(t), this.commands = [];
  const e = "0123456789", s = "MmLlQqCcZzHhVv", i = "SsTtAa", r = "-+";
  let a = {}, o = [""], c = !1;
  function h(d) {
    return d.filter((g) => g.length).map((g) => {
      let x = parseFloat(g);
      return (t.decimalPlaces || t.decimalPlaces === 0) && (x = Uh(x, t.decimalPlaces)), x;
    });
  }
  function l(d) {
    if (!this.commands.length)
      return d;
    const g = this.commands[this.commands.length - 1];
    for (let x = 0; x < d.length; x++)
      d[x] += g[x & 1 ? "y" : "x"];
    return d;
  }
  function u() {
    if (a.type === void 0)
      return;
    const d = a.type.toUpperCase(), g = d !== "Z" && a.type.toUpperCase() !== a.type;
    let x = h(o);
    if (o = [""], !x.length && d !== "Z")
      return;
    g && d !== "H" && d !== "V" && (x = l.apply(this, [x]));
    const b = this.commands.length && this.commands[this.commands.length - 1].x || 0, v = this.commands.length && this.commands[this.commands.length - 1].y || 0;
    switch (d) {
      case "M":
        this.moveTo(...x);
        break;
      case "L":
        this.lineTo(...x);
        break;
      case "V":
        for (let S = 0; S < x.length; S++) {
          let w = 0;
          g && (w = this.commands.length && this.commands[this.commands.length - 1].y || 0), this.lineTo(b, x[S] + w);
        }
        break;
      case "H":
        for (let S = 0; S < x.length; S++) {
          let w = 0;
          g && (w = this.commands.length && this.commands[this.commands.length - 1].x || 0), this.lineTo(x[S] + w, v);
        }
        break;
      case "C":
        this.bezierCurveTo(...x);
        break;
      case "Q":
        this.quadraticCurveTo(...x);
        break;
      case "Z":
        (this.commands.length < 1 || this.commands[this.commands.length - 1].type !== "Z") && this.close();
        break;
    }
    if (this.commands.length)
      for (const S in this.commands[this.commands.length - 1])
        this.commands[this.commands.length - 1][S] === void 0 && (this.commands[this.commands.length - 1][S] = 0);
  }
  for (let d = 0; d < n.length; d++) {
    const g = n.charAt(d), x = o[o.length - 1];
    if (e.indexOf(g) > -1)
      o[o.length - 1] += g;
    else if (r.indexOf(g) > -1)
      if (!a.type && !this.commands.length && (a.type = "L"), g === "-")
        !a.type || x.indexOf("-") > 0 ? c = !0 : x.length ? o.push("-") : o[o.length - 1] = g;
      else if (!a.type || x.length > 0)
        c = !0;
      else
        continue;
    else if (s.indexOf(g) > -1)
      a.type ? (u.apply(this), a = { type: g }) : a.type = g;
    else {
      if (i.indexOf(g) > -1)
        throw new Error("Unsupported path command: " + g + ". Currently supported commands are " + s.split("").join(", ") + ".");
      ` ,	
\r\f\v`.indexOf(g) > -1 ? o.push("") : g === "." ? !a.type || x.indexOf(g) > -1 ? c = !0 : o[o.length - 1] += g : c = !0;
    }
    if (c)
      throw new Error("Unexpected character: " + g + " at offset " + d);
  }
  u.apply(this), t.optimize && (this.commands = Ph(this.commands));
  const f = t.flipY;
  let p = t.flipYBase;
  if (f === !0 && t.flipYBase === void 0) {
    const d = this.getBoundingBox();
    p = d.y1 + d.y2;
  }
  for (const d in this.commands) {
    const g = this.commands[d];
    for (const x in g)
      ["x", "x1", "x2"].includes(x) ? this.commands[d][x] = t.x + g[x] * t.scale : ["y", "y1", "y2"].includes(x) && (this.commands[d][x] = t.y + (f ? p - g[x] : g[x]) * t.scale);
  }
  return this;
};
vt.fromSVG = function(n, t) {
  return new vt().fromSVG(n, t);
};
vt.prototype.moveTo = function(n, t) {
  this.commands.push({
    type: "M",
    x: n,
    y: t
  });
};
vt.prototype.lineTo = function(n, t) {
  this.commands.push({
    type: "L",
    x: n,
    y: t
  });
};
vt.prototype.curveTo = vt.prototype.bezierCurveTo = function(n, t, e, s, i, r) {
  this.commands.push({
    type: "C",
    x1: n,
    y1: t,
    x2: e,
    y2: s,
    x: i,
    y: r
  });
};
vt.prototype.quadTo = vt.prototype.quadraticCurveTo = function(n, t, e, s) {
  this.commands.push({
    type: "Q",
    x1: n,
    y1: t,
    x: e,
    y: s
  });
};
vt.prototype.close = vt.prototype.closePath = function() {
  this.commands.push({
    type: "Z"
  });
};
vt.prototype.extend = function(n) {
  if (n.commands)
    n = n.commands;
  else if (n instanceof Dh) {
    const t = n;
    this.moveTo(t.x1, t.y1), this.lineTo(t.x2, t.y1), this.lineTo(t.x2, t.y2), this.lineTo(t.x1, t.y2), this.close();
    return;
  }
  Array.prototype.push.apply(this.commands, n);
};
vt.prototype.getBoundingBox = function() {
  const n = new Dh();
  let t = 0, e = 0, s = 0, i = 0;
  for (let r = 0; r < this.commands.length; r++) {
    const a = this.commands[r];
    switch (a.type) {
      case "M":
        n.addPoint(a.x, a.y), t = s = a.x, e = i = a.y;
        break;
      case "L":
        n.addPoint(a.x, a.y), s = a.x, i = a.y;
        break;
      case "Q":
        n.addQuad(s, i, a.x1, a.y1, a.x, a.y), s = a.x, i = a.y;
        break;
      case "C":
        n.addBezier(s, i, a.x1, a.y1, a.x2, a.y2, a.x, a.y), s = a.x, i = a.y;
        break;
      case "Z":
        s = t, i = e;
        break;
      default:
        throw new Error("Unexpected path command " + a.type);
    }
  }
  return n.isEmpty() && n.addPoint(0, 0), n;
};
vt.prototype.draw = function(n) {
  const t = this._layers;
  if (t && t.length) {
    for (let s = 0; s < t.length; s++)
      this.draw.call(t[s], n);
    return;
  }
  const e = this._image;
  if (e) {
    n.drawImage(e.image, e.x, e.y, e.width, e.height);
    return;
  }
  n.beginPath();
  for (let s = 0; s < this.commands.length; s += 1) {
    const i = this.commands[s];
    i.type === "M" ? n.moveTo(i.x, i.y) : i.type === "L" ? n.lineTo(i.x, i.y) : i.type === "C" ? n.bezierCurveTo(i.x1, i.y1, i.x2, i.y2, i.x, i.y) : i.type === "Q" ? n.quadraticCurveTo(i.x1, i.y1, i.x, i.y) : i.type === "Z" && this.stroke && this.strokeWidth && n.closePath();
  }
  this.fill && (n.fillStyle = this.fill, n.fill()), this.stroke && (n.strokeStyle = this.stroke, n.lineWidth = this.strokeWidth, n.stroke());
};
vt.prototype.toPathData = function(n) {
  n = Pf(n);
  function t(o) {
    const c = Uh(o, n.decimalPlaces);
    return Math.round(o) === c ? "" + c : c.toFixed(n.decimalPlaces);
  }
  function e() {
    let o = "";
    for (let c = 0; c < arguments.length; c += 1) {
      const h = arguments[c];
      h >= 0 && c > 0 && (o += " "), o += t(h);
    }
    return o;
  }
  let s = this.commands;
  n.optimize && (s = JSON.parse(JSON.stringify(this.commands)), s = Ph(s));
  const i = n.flipY;
  let r = n.flipYBase;
  if (i === !0 && r === void 0) {
    const o = new vt();
    o.extend(s);
    const c = o.getBoundingBox();
    r = c.y1 + c.y2;
  }
  let a = "";
  for (let o = 0; o < s.length; o += 1) {
    const c = s[o];
    c.type === "M" ? a += "M" + e(
      c.x,
      i ? r - c.y : c.y
    ) : c.type === "L" ? a += "L" + e(
      c.x,
      i ? r - c.y : c.y
    ) : c.type === "C" ? a += "C" + e(
      c.x1,
      i ? r - c.y1 : c.y1,
      c.x2,
      i ? r - c.y2 : c.y2,
      c.x,
      i ? r - c.y : c.y
    ) : c.type === "Q" ? a += "Q" + e(
      c.x1,
      i ? r - c.y1 : c.y1,
      c.x,
      i ? r - c.y : c.y
    ) : c.type === "Z" && (a += "Z");
  }
  return a;
};
vt.prototype.toSVG = function(n, t) {
  this._layers && this._layers.length && console.warn("toSVG() does not support colr font layers yet"), this._image && console.warn("toSVG() does not support SVG glyphs yet"), t || (t = this.toPathData(n));
  let e = '<path d="';
  return e += t, e += '"', this.fill !== void 0 && this.fill !== "black" && (this.fill === null ? e += ' fill="none"' : e += ' fill="' + this.fill + '"'), this.stroke && (e += ' stroke="' + this.stroke + '" stroke-width="' + this.strokeWidth + '"'), e += "/>", e;
};
vt.prototype.toDOMElement = function(n, t) {
  this._layers && this._layers.length && console.warn("toDOMElement() does not support colr font layers yet"), t || (t = this.toPathData(n));
  const e = document.createElementNS("http://www.w3.org/2000/svg", "path");
  return e.setAttribute("d", t), this.fill !== void 0 && this.fill !== "black" && (this.fill === null ? e.setAttribute("fill", "none") : e.setAttribute("fill", this.fill)), this.stroke && (e.setAttribute("stroke", this.stroke), e.setAttribute("stroke-width", this.strokeWidth)), e;
};
var Hn = vt;
function Nh(n) {
  throw new Error(n);
}
function Bo(n, t) {
  n || Nh(t);
}
var V = { fail: Nh, argument: Bo, assert: Bo }, Ro = 32768, Do = 2147483648, Nf = -32768, zf = 32767 + 1 / 65536, Gn = {}, N = {}, q = {};
function fe(n) {
  return function() {
    return n;
  };
}
N.BYTE = function(n) {
  return V.argument(n >= 0 && n <= 255, "Byte value should be between 0 and 255."), [n];
};
q.BYTE = fe(1);
N.CHAR = function(n) {
  return [n.charCodeAt(0)];
};
q.CHAR = fe(1);
N.CHARARRAY = function(n) {
  (n === null || typeof n > "u") && (n = "", console.warn("CHARARRAY with undefined or null value encountered and treated as an empty string. This is probably caused by a missing glyph name."));
  const t = [];
  for (let e = 0; e < n.length; e += 1)
    t[e] = n.charCodeAt(e);
  return t;
};
q.CHARARRAY = function(n) {
  return typeof n > "u" ? 0 : n.length;
};
N.USHORT = function(n) {
  return [n >> 8 & 255, n & 255];
};
q.USHORT = fe(2);
N.SHORT = function(n) {
  return n >= Ro && (n = -(2 * Ro - n)), [n >> 8 & 255, n & 255];
};
q.SHORT = fe(2);
N.UINT24 = function(n) {
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
};
q.UINT24 = fe(3);
N.ULONG = function(n) {
  return [n >> 24 & 255, n >> 16 & 255, n >> 8 & 255, n & 255];
};
q.ULONG = fe(4);
N.LONG = function(n) {
  return n >= Do && (n = -(2 * Do - n)), [n >> 24 & 255, n >> 16 & 255, n >> 8 & 255, n & 255];
};
q.LONG = fe(4);
N.FLOAT = function(n) {
  if (n > zf || n < Nf)
    throw new Error(`Value ${n} is outside the range of representable values in 16.16 format`);
  const t = Math.round(n * 65536) << 0;
  return N.ULONG(t);
};
q.FLOAT = q.ULONG;
N.FIXED = N.ULONG;
q.FIXED = q.ULONG;
N.FWORD = N.SHORT;
q.FWORD = q.SHORT;
N.UFWORD = N.USHORT;
q.UFWORD = q.USHORT;
N.F2DOT14 = function(n) {
  return N.USHORT(n * 16384);
};
q.F2DOT14 = q.USHORT;
N.LONGDATETIME = function(n) {
  return [0, 0, 0, 0, n >> 24 & 255, n >> 16 & 255, n >> 8 & 255, n & 255];
};
q.LONGDATETIME = fe(8);
N.TAG = function(n) {
  return V.argument(n.length === 4, "Tag should be exactly 4 ASCII characters."), [
    n.charCodeAt(0),
    n.charCodeAt(1),
    n.charCodeAt(2),
    n.charCodeAt(3)
  ];
};
q.TAG = fe(4);
N.Card8 = N.BYTE;
q.Card8 = q.BYTE;
N.Card16 = N.USHORT;
q.Card16 = q.USHORT;
N.OffSize = N.BYTE;
q.OffSize = q.BYTE;
N.SID = N.USHORT;
q.SID = q.USHORT;
N.NUMBER = function(n) {
  return n >= -107 && n <= 107 ? [n + 139] : n >= 108 && n <= 1131 ? (n = n - 108, [(n >> 8) + 247, n & 255]) : n >= -1131 && n <= -108 ? (n = -n - 108, [(n >> 8) + 251, n & 255]) : n >= -32768 && n <= 32767 ? N.NUMBER16(n) : N.NUMBER32(n);
};
q.NUMBER = function(n) {
  return N.NUMBER(n).length;
};
N.NUMBER16 = function(n) {
  return [28, n >> 8 & 255, n & 255];
};
q.NUMBER16 = fe(3);
N.NUMBER32 = function(n) {
  return [29, n >> 24 & 255, n >> 16 & 255, n >> 8 & 255, n & 255];
};
q.NUMBER32 = fe(5);
N.REAL = function(n) {
  let t = n.toString();
  const e = /\.(\d*?)(?:9{5,20}|0{5,20})\d{0,2}(?:e(.+)|$)/.exec(t);
  if (e) {
    const r = parseFloat("1e" + ((e[2] ? +e[2] : 0) + e[1].length));
    t = (Math.round(n * r) / r).toString();
  }
  let s = "";
  for (let r = 0, a = t.length; r < a; r += 1) {
    const o = t[r];
    o === "e" ? s += t[++r] === "-" ? "c" : "b" : o === "." ? s += "a" : o === "-" ? s += "e" : s += o;
  }
  s += s.length & 1 ? "f" : "ff";
  const i = [30];
  for (let r = 0, a = s.length; r < a; r += 2)
    i.push(parseInt(s.substr(r, 2), 16));
  return i;
};
q.REAL = function(n) {
  return N.REAL(n).length;
};
N.NAME = N.CHARARRAY;
q.NAME = q.CHARARRAY;
N.STRING = N.CHARARRAY;
q.STRING = q.CHARARRAY;
Gn.UTF8 = function(n, t, e) {
  const s = [], i = e;
  for (let r = 0; r < i; r++, t += 1)
    s[r] = n.getUint8(t);
  return String.fromCharCode.apply(null, s);
};
Gn.UTF16 = function(n, t, e) {
  const s = [], i = e / 2;
  for (let r = 0; r < i; r++, t += 2)
    s[r] = n.getUint16(t);
  return String.fromCharCode.apply(null, s);
};
N.UTF16 = function(n) {
  const t = [];
  for (let e = 0; e < n.length; e += 1) {
    const s = n.charCodeAt(e);
    t[t.length] = s >> 8 & 255, t[t.length] = s & 255;
  }
  return t;
};
q.UTF16 = function(n) {
  return n.length * 2;
};
var xi = {
  "x-mac-croatian": (
    // Python: 'mac_croatian'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®Š™´¨≠ŽØ∞±≤≥∆µ∂∑∏š∫ªºΩžø¿¡¬√ƒ≈Ć«Č… ÀÃÕŒœĐ—“”‘’÷◊©⁄€‹›Æ»–·‚„‰ÂćÁčÈÍÎÏÌÓÔđÒÚÛÙıˆ˜¯πË˚¸Êæˇ"
  ),
  "x-mac-cyrillic": (
    // Python: 'mac_cyrillic'
    "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°Ґ£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµґЈЄєЇїЉљЊњјЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю"
  ),
  "x-mac-gaelic": (
    // http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/GAELIC.TXT
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØḂ±≤≥ḃĊċḊḋḞḟĠġṀæøṁṖṗɼƒſṠ«»… ÀÃÕŒœ–—“”‘’ṡẛÿŸṪ€‹›Ŷŷṫ·Ỳỳ⁊ÂÊÁËÈÍÎÏÌÓÔ♣ÒÚÛÙıÝýŴŵẄẅẀẁẂẃ"
  ),
  "x-mac-greek": (
    // Python: 'mac_greek'
    "Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦€ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩάΝ¬ΟΡ≈Τ«»… ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ­"
  ),
  "x-mac-icelandic": (
    // Python: 'mac_iceland'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  ),
  "x-mac-inuit": (
    // http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/INUIT.TXT
    "ᐃᐄᐅᐆᐊᐋᐱᐲᐳᐴᐸᐹᑉᑎᑏᑐᑑᑕᑖᑦᑭᑮᑯᑰᑲᑳᒃᒋᒌᒍᒎᒐᒑ°ᒡᒥᒦ•¶ᒧ®©™ᒨᒪᒫᒻᓂᓃᓄᓅᓇᓈᓐᓯᓰᓱᓲᓴᓵᔅᓕᓖᓗᓘᓚᓛᓪᔨᔩᔪᔫᔭ… ᔮᔾᕕᕖᕗ–—“”‘’ᕘᕙᕚᕝᕆᕇᕈᕉᕋᕌᕐᕿᖀᖁᖂᖃᖄᖅᖏᖐᖑᖒᖓᖔᖕᙱᙲᙳᙴᙵᙶᖖᖠᖡᖢᖣᖤᖥᖦᕼŁł"
  ),
  "x-mac-ce": (
    // Python: 'mac_latin2'
    "ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅņŃ¬√ńŇ∆«»… ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ"
  ),
  macintosh: (
    // Python: 'mac_roman'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  ),
  "x-mac-romanian": (
    // Python: 'mac_romanian'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ĂȘ∞±≤≥¥µ∂∑∏π∫ªºΩăș¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›Țț‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  ),
  "x-mac-turkish": (
    // Python: 'mac_turkish'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙˆ˜¯˘˙˚¸˝˛ˇ"
  )
};
Gn.MACSTRING = function(n, t, e, s) {
  const i = xi[s];
  if (i === void 0)
    return;
  let r = "";
  for (let a = 0; a < e; a++) {
    const o = n.getUint8(t + a);
    o <= 127 ? r += String.fromCharCode(o) : r += i[o & 127];
  }
  return r;
};
var Ks = typeof WeakMap == "function" && /* @__PURE__ */ new WeakMap(), Qs, Hf = function(n) {
  if (!Qs) {
    Qs = {};
    for (let i in xi)
      Qs[i] = new String(i);
  }
  const t = Qs[n];
  if (t === void 0)
    return;
  if (Ks) {
    const i = Ks.get(t);
    if (i !== void 0)
      return i;
  }
  const e = xi[n];
  if (e === void 0)
    return;
  const s = {};
  for (let i = 0; i < e.length; i++)
    s[e.charCodeAt(i)] = i + 128;
  return Ks && Ks.set(t, s), s;
};
N.MACSTRING = function(n, t) {
  const e = Hf(t);
  if (e === void 0)
    return;
  const s = [];
  for (let i = 0; i < n.length; i++) {
    let r = n.charCodeAt(i);
    if (r >= 128 && (r = e[r], r === void 0))
      return;
    s[i] = r;
  }
  return s;
};
q.MACSTRING = function(n, t) {
  const e = N.MACSTRING(n, t);
  return e !== void 0 ? e.length : 0;
};
function ta(n) {
  return n >= -128 && n <= 127;
}
function Gf(n, t, e) {
  let s = 0;
  const i = n.length;
  for (; t < i && s < 64 && n[t] === 0; )
    ++t, ++s;
  return e.push(128 | s - 1), t;
}
function Vf(n, t, e) {
  let s = 0;
  const i = n.length;
  let r = t;
  for (; r < i && s < 64; ) {
    const a = n[r];
    if (!ta(a) || a === 0 && r + 1 < i && n[r + 1] === 0)
      break;
    ++r, ++s;
  }
  e.push(s - 1);
  for (let a = t; a < r; ++a)
    e.push(n[a] + 256 & 255);
  return r;
}
function Wf(n, t, e) {
  let s = 0;
  const i = n.length;
  let r = t;
  for (; r < i && s < 64; ) {
    const a = n[r];
    if (a === 0 || ta(a) && r + 1 < i && ta(n[r + 1]))
      break;
    ++r, ++s;
  }
  e.push(64 | s - 1);
  for (let a = t; a < r; ++a) {
    const o = n[a];
    e.push(o + 65536 >> 8 & 255, o + 256 & 255);
  }
  return r;
}
N.VARDELTAS = function(n) {
  let t = 0;
  const e = [];
  for (; t < n.length; ) {
    const s = n[t];
    s === 0 ? t = Gf(n, t, e) : s >= -128 && s <= 127 ? t = Vf(n, t, e) : t = Wf(n, t, e);
  }
  return e;
};
N.INDEX = function(n) {
  let t = 1;
  const e = [t], s = [];
  for (let o = 0; o < n.length; o += 1) {
    const c = N.OBJECT(n[o]);
    Array.prototype.push.apply(s, c), t += c.length, e.push(t);
  }
  if (s.length === 0)
    return [0, 0];
  const i = [], r = 1 + Math.floor(Math.log(t) / Math.log(2)) / 8 | 0, a = [void 0, N.BYTE, N.USHORT, N.UINT24, N.ULONG][r];
  for (let o = 0; o < e.length; o += 1) {
    const c = a(e[o]);
    Array.prototype.push.apply(i, c);
  }
  return Array.prototype.concat(
    N.Card16(n.length),
    N.OffSize(r),
    i,
    s
  );
};
q.INDEX = function(n) {
  return N.INDEX(n).length;
};
N.DICT = function(n) {
  let t = [];
  const e = Object.keys(n), s = e.length;
  for (let i = 0; i < s; i += 1) {
    const r = parseInt(e[i], 0), a = n[r], o = N.OPERAND(a.value, a.type), c = N.OPERATOR(r);
    for (let h = 0; h < o.length; h++)
      t.push(o[h]);
    for (let h = 0; h < c.length; h++)
      t.push(c[h]);
  }
  return t;
};
q.DICT = function(n) {
  return N.DICT(n).length;
};
N.OPERATOR = function(n) {
  return n < 1200 ? [n] : [12, n - 1200];
};
N.OPERAND = function(n, t) {
  let e = [];
  if (Array.isArray(t))
    for (let s = 0; s < t.length; s += 1) {
      V.argument(n.length === t.length, "Not enough arguments given for type" + t);
      const i = N.OPERAND(n[s], t[s]);
      for (let r = 0; r < i.length; r++)
        e.push(i[r]);
    }
  else if (t === "SID") {
    const s = N.NUMBER(n);
    for (let i = 0; i < s.length; i++)
      e.push(s[i]);
  } else if (t === "offset") {
    const s = N.NUMBER32(n);
    for (let i = 0; i < s.length; i++)
      e.push(s[i]);
  } else if (t === "number") {
    const s = N.NUMBER(n);
    for (let i = 0; i < s.length; i++)
      e.push(s[i]);
  } else if (t === "real") {
    const s = N.REAL(n);
    for (let i = 0; i < s.length; i++)
      e.push(s[i]);
  } else
    throw new Error("Unknown operand type " + t);
  return e;
};
N.OP = N.BYTE;
q.OP = q.BYTE;
var ti = typeof WeakMap == "function" && /* @__PURE__ */ new WeakMap();
N.CHARSTRING = function(n) {
  if (ti) {
    const s = ti.get(n);
    if (s !== void 0)
      return s;
  }
  let t = [];
  const e = n.length;
  for (let s = 0; s < e; s += 1) {
    const i = n[s], r = N[i.type](i.value);
    for (let a = 0; a < r.length; a++)
      t.push(r[a]);
  }
  return ti && ti.set(n, t), t;
};
q.CHARSTRING = function(n) {
  return N.CHARSTRING(n).length;
};
N.OBJECT = function(n) {
  const t = N[n.type];
  return V.argument(t !== void 0, "No encoding function for type " + n.type), t(n.value);
};
q.OBJECT = function(n) {
  const t = q[n.type];
  return V.argument(t !== void 0, "No sizeOf function for type " + n.type), t(n.value);
};
N.TABLE = function(n) {
  let t = [];
  const e = (n.fields || []).length, s = [], i = [];
  for (let r = 0; r < e; r += 1) {
    const a = n.fields[r], o = N[a.type];
    V.argument(o !== void 0, "No encoding function for field type " + a.type + " (" + a.name + ")");
    let c = n[a.name];
    c === void 0 && (c = a.value);
    const h = o(c);
    if (a.type === "TABLE")
      c.fields !== null && (i.push(t.length), s.push(h)), t.push(0, 0);
    else
      for (let l = 0; l < h.length; l++)
        t.push(h[l]);
  }
  for (let r = 0; r < s.length; r += 1) {
    const a = i[r], o = t.length;
    V.argument(o < 65536, "Table " + n.tableName + " too big."), t[a] = o >> 8, t[a + 1] = o & 255;
    for (let c = 0; c < s[r].length; c++)
      t.push(s[r][c]);
  }
  return t;
};
q.TABLE = function(n) {
  let t = 0;
  const e = (n.fields || []).length;
  for (let s = 0; s < e; s += 1) {
    const i = n.fields[s], r = q[i.type];
    V.argument(r !== void 0, "No sizeOf function for field type " + i.type + " (" + i.name + ")");
    let a = n[i.name];
    a === void 0 && (a = i.value), t += r(a), i.type === "TABLE" && (t += 2);
  }
  return t;
};
N.RECORD = N.TABLE;
q.RECORD = q.TABLE;
N.LITERAL = function(n) {
  return n;
};
q.LITERAL = function(n) {
  return n.length;
};
function gt(n, t, e) {
  if (t && t.length)
    for (let s = 0; s < t.length; s += 1) {
      const i = t[s];
      this[i.name] = i.value;
    }
  if (this.tableName = n, this.fields = t, e) {
    const s = Object.keys(e);
    for (let i = 0; i < s.length; i += 1) {
      const r = s[i], a = e[r];
      this[r] !== void 0 && (this[r] = a);
    }
  }
}
gt.prototype.encode = function() {
  return N.TABLE(this);
};
gt.prototype.sizeOf = function() {
  return q.TABLE(this);
};
function Vn(n, t, e) {
  e === void 0 && (e = t.length);
  const s = new Array(t.length + 1);
  s[0] = { name: n + "Count", type: "USHORT", value: e };
  for (let i = 0; i < t.length; i++)
    s[i + 1] = { name: n + i, type: "USHORT", value: t[i] };
  return s;
}
function ea(n, t, e) {
  const s = t.length, i = new Array(s + 1);
  i[0] = { name: n + "Count", type: "USHORT", value: s };
  for (let r = 0; r < s; r++)
    i[r + 1] = { name: n + r, type: "TABLE", value: e(t[r], r) };
  return i;
}
function Wn(n, t, e) {
  const s = t.length;
  let i = [];
  i[0] = { name: n + "Count", type: "USHORT", value: s };
  for (let r = 0; r < s; r++)
    i = i.concat(e(t[r], r));
  return i;
}
function bi(n) {
  n.format === 1 ? gt.call(
    this,
    "coverageTable",
    [{ name: "coverageFormat", type: "USHORT", value: 1 }].concat(Vn("glyph", n.glyphs))
  ) : n.format === 2 ? gt.call(
    this,
    "coverageTable",
    [{ name: "coverageFormat", type: "USHORT", value: 2 }].concat(Wn("rangeRecord", n.ranges, function(t, e) {
      return [
        { name: "startGlyphID" + e, type: "USHORT", value: t.start },
        { name: "endGlyphID" + e, type: "USHORT", value: t.end },
        { name: "startCoverageIndex" + e, type: "USHORT", value: t.index }
      ];
    }))
  ) : V.assert(!1, "Coverage format must be 1 or 2.");
}
bi.prototype = Object.create(gt.prototype);
bi.prototype.constructor = bi;
function vi(n) {
  gt.call(
    this,
    "scriptListTable",
    Wn("scriptRecord", n, function(t, e) {
      const s = t.script;
      let i = s.defaultLangSys;
      return V.assert(!!i, "Unable to write GSUB: script " + t.tag + " has no default language system."), [
        { name: "scriptTag" + e, type: "TAG", value: t.tag },
        { name: "script" + e, type: "TABLE", value: new gt("scriptTable", [
          { name: "defaultLangSys", type: "TABLE", value: new gt("defaultLangSys", [
            { name: "lookupOrder", type: "USHORT", value: 0 },
            { name: "reqFeatureIndex", type: "USHORT", value: i.reqFeatureIndex }
          ].concat(Vn("featureIndex", i.featureIndexes))) }
        ].concat(Wn("langSys", s.langSysRecords, function(r, a) {
          const o = r.langSys;
          return [
            { name: "langSysTag" + a, type: "TAG", value: r.tag },
            { name: "langSys" + a, type: "TABLE", value: new gt("langSys", [
              { name: "lookupOrder", type: "USHORT", value: 0 },
              { name: "reqFeatureIndex", type: "USHORT", value: o.reqFeatureIndex }
            ].concat(Vn("featureIndex", o.featureIndexes))) }
          ];
        }))) }
      ];
    })
  );
}
vi.prototype = Object.create(gt.prototype);
vi.prototype.constructor = vi;
function Si(n) {
  gt.call(
    this,
    "featureListTable",
    Wn("featureRecord", n, function(t, e) {
      const s = t.feature;
      return [
        { name: "featureTag" + e, type: "TAG", value: t.tag },
        { name: "feature" + e, type: "TABLE", value: new gt("featureTable", [
          { name: "featureParams", type: "USHORT", value: s.featureParams }
        ].concat(Vn("lookupListIndex", s.lookupListIndexes))) }
      ];
    })
  );
}
Si.prototype = Object.create(gt.prototype);
Si.prototype.constructor = Si;
function wi(n, t) {
  gt.call(this, "lookupListTable", ea("lookup", n, function(e) {
    let s = t[e.lookupType];
    return V.assert(!!s, "Unable to write GSUB lookup type " + e.lookupType + " tables."), new gt("lookupTable", [
      { name: "lookupType", type: "USHORT", value: e.lookupType },
      { name: "lookupFlag", type: "USHORT", value: e.lookupFlag }
    ].concat(ea("subtable", e.subtables, s)));
  }));
}
wi.prototype = Object.create(gt.prototype);
wi.prototype.constructor = wi;
function Ci(n) {
  n.format === 1 ? gt.call(
    this,
    "classDefTable",
    [
      { name: "classFormat", type: "USHORT", value: 1 },
      { name: "startGlyphID", type: "USHORT", value: n.startGlyph }
    ].concat(Vn("glyph", n.classes))
  ) : n.format === 2 ? gt.call(
    this,
    "classDefTable",
    [{ name: "classFormat", type: "USHORT", value: 2 }].concat(Wn("rangeRecord", n.ranges, function(t, e) {
      return [
        { name: "startGlyphID" + e, type: "USHORT", value: t.start },
        { name: "endGlyphID" + e, type: "USHORT", value: t.end },
        { name: "class" + e, type: "USHORT", value: t.classId }
      ];
    }))
  ) : V.assert(!1, "Class format must be 1 or 2.");
}
Ci.prototype = Object.create(gt.prototype);
Ci.prototype.constructor = Ci;
var L = {
  Table: gt,
  Record: gt,
  Coverage: bi,
  ClassDef: Ci,
  ScriptList: vi,
  FeatureList: Si,
  LookupList: wi,
  ushortList: Vn,
  tableList: ea,
  recordList: Wn
};
function Uo(n, t) {
  return n.getUint8(t);
}
function Ti(n, t) {
  return n.getUint16(t, !1);
}
function qf(n, t) {
  return n.getInt16(t, !1);
}
function zh(n, t) {
  return (n.getUint16(t) << 8) + n.getUint8(t + 2);
}
function ma(n, t) {
  return n.getUint32(t, !1);
}
function jf(n, t) {
  return n.getInt32(t, !1);
}
function Hh(n, t) {
  const e = n.getInt16(t, !1), s = n.getUint16(t + 2, !1);
  return e + s / 65535;
}
function Xf(n, t) {
  let e = "";
  for (let s = t; s < t + 4; s += 1)
    e += String.fromCharCode(n.getInt8(s));
  return e;
}
function Yf(n, t, e) {
  let s = 0;
  for (let i = 0; i < e; i += 1)
    s <<= 8, s += n.getUint8(t + i);
  return s;
}
function $f(n, t, e) {
  const s = [];
  for (let i = t; i < e; i += 1)
    s.push(n.getUint8(i));
  return s;
}
function Zf(n) {
  let t = "";
  for (let e = 0; e < n.length; e += 1)
    t += String.fromCharCode(n[e]);
  return t;
}
var Jf = {
  byte: 1,
  uShort: 2,
  f2dot14: 2,
  short: 2,
  uInt24: 3,
  uLong: 4,
  fixed: 4,
  longDateTime: 8,
  tag: 4
}, Lt = {
  LONG_WORDS: 32768,
  WORD_DELTA_COUNT_MASK: 32767,
  SHARED_POINT_NUMBERS: 32768,
  COUNT_MASK: 4095,
  EMBEDDED_PEAK_TUPLE: 32768,
  INTERMEDIATE_REGION: 16384,
  PRIVATE_POINT_NUMBERS: 8192,
  TUPLE_INDEX_MASK: 4095,
  POINTS_ARE_WORDS: 128,
  POINT_RUN_COUNT_MASK: 127,
  DELTAS_ARE_ZERO: 128,
  DELTAS_ARE_WORDS: 64,
  DELTA_RUN_COUNT_MASK: 63,
  INNER_INDEX_BIT_COUNT_MASK: 15,
  MAP_ENTRY_SIZE_MASK: 48
};
function A(n, t) {
  this.data = n, this.offset = t, this.relativeOffset = 0;
}
A.prototype.parseByte = function() {
  const n = this.data.getUint8(this.offset + this.relativeOffset);
  return this.relativeOffset += 1, n;
};
A.prototype.parseChar = function() {
  const n = this.data.getInt8(this.offset + this.relativeOffset);
  return this.relativeOffset += 1, n;
};
A.prototype.parseCard8 = A.prototype.parseByte;
A.prototype.parseUShort = function() {
  const n = this.data.getUint16(this.offset + this.relativeOffset);
  return this.relativeOffset += 2, n;
};
A.prototype.parseCard16 = A.prototype.parseUShort;
A.prototype.parseSID = A.prototype.parseUShort;
A.prototype.parseOffset16 = A.prototype.parseUShort;
A.prototype.parseShort = function() {
  const n = this.data.getInt16(this.offset + this.relativeOffset);
  return this.relativeOffset += 2, n;
};
A.prototype.parseF2Dot14 = function() {
  const n = this.data.getInt16(this.offset + this.relativeOffset) / 16384;
  return this.relativeOffset += 2, n;
};
A.prototype.parseUInt24 = function() {
  const n = zh(this.data, this.offset + this.relativeOffset);
  return this.relativeOffset += 3, n;
};
A.prototype.parseULong = function() {
  const n = ma(this.data, this.offset + this.relativeOffset);
  return this.relativeOffset += 4, n;
};
A.prototype.parseLong = function() {
  const n = jf(this.data, this.offset + this.relativeOffset);
  return this.relativeOffset += 4, n;
};
A.prototype.parseOffset32 = A.prototype.parseULong;
A.prototype.parseFixed = function() {
  const n = Hh(this.data, this.offset + this.relativeOffset);
  return this.relativeOffset += 4, n;
};
A.prototype.parseString = function(n) {
  const t = this.data, e = this.offset + this.relativeOffset;
  let s = "";
  this.relativeOffset += n;
  for (let i = 0; i < n; i++)
    s += String.fromCharCode(t.getUint8(e + i));
  return s;
};
A.prototype.parseTag = function() {
  return this.parseString(4);
};
A.prototype.parseLongDateTime = function() {
  let n = ma(this.data, this.offset + this.relativeOffset + 4);
  return n -= 2082844800, this.relativeOffset += 8, n;
};
A.prototype.parseVersion = function(n) {
  const t = Ti(this.data, this.offset + this.relativeOffset), e = Ti(this.data, this.offset + this.relativeOffset + 2);
  return this.relativeOffset += 4, n === void 0 && (n = 4096), t + e / n / 10;
};
A.prototype.skip = function(n, t) {
  t === void 0 && (t = 1), this.relativeOffset += Jf[n] * t;
};
A.prototype.parseULongList = function(n) {
  n === void 0 && (n = this.parseULong());
  const t = new Array(n), e = this.data;
  let s = this.offset + this.relativeOffset;
  for (let i = 0; i < n; i++)
    t[i] = e.getUint32(s), s += 4;
  return this.relativeOffset += n * 4, t;
};
A.prototype.parseOffset16List = A.prototype.parseUShortList = function(n) {
  n === void 0 && (n = this.parseUShort());
  const t = new Array(n), e = this.data;
  let s = this.offset + this.relativeOffset;
  for (let i = 0; i < n; i++)
    t[i] = e.getUint16(s), s += 2;
  return this.relativeOffset += n * 2, t;
};
A.prototype.parseShortList = function(n) {
  const t = new Array(n), e = this.data;
  let s = this.offset + this.relativeOffset;
  for (let i = 0; i < n; i++)
    t[i] = e.getInt16(s), s += 2;
  return this.relativeOffset += n * 2, t;
};
A.prototype.parseByteList = function(n) {
  const t = new Array(n), e = this.data;
  let s = this.offset + this.relativeOffset;
  for (let i = 0; i < n; i++)
    t[i] = e.getUint8(s++);
  return this.relativeOffset += n, t;
};
A.prototype.parseList = function(n, t) {
  t || (t = n, n = this.parseUShort());
  const e = new Array(n);
  for (let s = 0; s < n; s++)
    e[s] = t.call(this);
  return e;
};
A.prototype.parseList32 = function(n, t) {
  t || (t = n, n = this.parseULong());
  const e = new Array(n);
  for (let s = 0; s < n; s++)
    e[s] = t.call(this);
  return e;
};
A.prototype.parseRecordList = function(n, t) {
  t || (t = n, n = this.parseUShort());
  const e = new Array(n), s = Object.keys(t);
  for (let i = 0; i < n; i++) {
    const r = {};
    for (let a = 0; a < s.length; a++) {
      const o = s[a], c = t[o];
      r[o] = c.call(this);
    }
    e[i] = r;
  }
  return e;
};
A.prototype.parseRecordList32 = function(n, t) {
  t || (t = n, n = this.parseULong());
  const e = new Array(n), s = Object.keys(t);
  for (let i = 0; i < n; i++) {
    const r = {};
    for (let a = 0; a < s.length; a++) {
      const o = s[a], c = t[o];
      r[o] = c.call(this);
    }
    e[i] = r;
  }
  return e;
};
A.prototype.parseTupleRecords = function(n, t) {
  let e = [];
  for (let s = 0; s < n; s++) {
    let i = [];
    for (let r = 0; r < t; r++)
      i.push(this.parseF2Dot14());
    e.push(i);
  }
  return e;
};
A.prototype.parseStruct = function(n) {
  if (typeof n == "function")
    return n.call(this);
  {
    const t = Object.keys(n), e = {};
    for (let s = 0; s < t.length; s++) {
      const i = t[s], r = n[i];
      e[i] = r.call(this);
    }
    return e;
  }
};
A.prototype.parseValueRecord = function(n) {
  if (n === void 0 && (n = this.parseUShort()), n === 0)
    return;
  const t = {};
  return n & 1 && (t.xPlacement = this.parseShort()), n & 2 && (t.yPlacement = this.parseShort()), n & 4 && (t.xAdvance = this.parseShort()), n & 8 && (t.yAdvance = this.parseShort()), n & 16 && (t.xPlaDevice = void 0, this.parseShort()), n & 32 && (t.yPlaDevice = void 0, this.parseShort()), n & 64 && (t.xAdvDevice = void 0, this.parseShort()), n & 128 && (t.yAdvDevice = void 0, this.parseShort()), t;
};
A.prototype.parseValueRecordList = function() {
  const n = this.parseUShort(), t = this.parseUShort(), e = new Array(t);
  for (let s = 0; s < t; s++)
    e[s] = this.parseValueRecord(n);
  return e;
};
A.prototype.parsePointer = function(n) {
  const t = this.parseOffset16();
  if (t > 0)
    return new A(this.data, this.offset + t).parseStruct(n);
};
A.prototype.parsePointer32 = function(n) {
  const t = this.parseOffset32();
  if (t > 0)
    return new A(this.data, this.offset + t).parseStruct(n);
};
A.prototype.parseListOfLists = function(n) {
  const t = this.parseOffset16List(), e = t.length, s = this.relativeOffset, i = new Array(e);
  for (let r = 0; r < e; r++) {
    const a = t[r];
    if (a === 0) {
      i[r] = void 0;
      continue;
    }
    if (this.relativeOffset = a, n) {
      const o = this.parseOffset16List(), c = new Array(o.length);
      for (let h = 0; h < o.length; h++)
        this.relativeOffset = a + o[h], c[h] = n.call(this);
      i[r] = c;
    } else
      i[r] = this.parseUShortList();
  }
  return this.relativeOffset = s, i;
};
A.prototype.parseCoverage = function() {
  const n = this.offset + this.relativeOffset, t = this.parseUShort(), e = this.parseUShort();
  if (t === 1)
    return {
      format: 1,
      glyphs: this.parseUShortList(e)
    };
  if (t === 2) {
    const s = new Array(e);
    for (let i = 0; i < e; i++)
      s[i] = {
        start: this.parseUShort(),
        end: this.parseUShort(),
        index: this.parseUShort()
      };
    return {
      format: 2,
      ranges: s
    };
  }
  throw new Error("0x" + n.toString(16) + ": Coverage format must be 1 or 2.");
};
A.prototype.parseClassDef = function() {
  const n = this.offset + this.relativeOffset, t = this.parseUShort();
  return t === 1 ? {
    format: 1,
    startGlyph: this.parseUShort(),
    classes: this.parseUShortList()
  } : t === 2 ? {
    format: 2,
    ranges: this.parseRecordList({
      start: A.uShort,
      end: A.uShort,
      classId: A.uShort
    })
  } : (console.warn(`0x${n.toString(16)}: This font file uses an invalid ClassDef format of ${t}. It might be corrupted and should be reacquired if it doesn't display as intended.`), {
    format: t
  });
};
A.list = function(n, t) {
  return function() {
    return this.parseList(n, t);
  };
};
A.list32 = function(n, t) {
  return function() {
    return this.parseList32(n, t);
  };
};
A.recordList = function(n, t) {
  return function() {
    return this.parseRecordList(n, t);
  };
};
A.recordList32 = function(n, t) {
  return function() {
    return this.parseRecordList32(n, t);
  };
};
A.pointer = function(n) {
  return function() {
    return this.parsePointer(n);
  };
};
A.pointer32 = function(n) {
  return function() {
    return this.parsePointer32(n);
  };
};
A.tag = A.prototype.parseTag;
A.byte = A.prototype.parseByte;
A.uShort = A.offset16 = A.prototype.parseUShort;
A.uShortList = A.prototype.parseUShortList;
A.uInt24 = A.prototype.parseUInt24;
A.uLong = A.offset32 = A.prototype.parseULong;
A.uLongList = A.prototype.parseULongList;
A.fixed = A.prototype.parseFixed;
A.f2Dot14 = A.prototype.parseF2Dot14;
A.struct = A.prototype.parseStruct;
A.coverage = A.prototype.parseCoverage;
A.classDef = A.prototype.parseClassDef;
var Po = {
  reserved: A.uShort,
  reqFeatureIndex: A.uShort,
  featureIndexes: A.uShortList
};
A.prototype.parseScriptList = function() {
  return this.parsePointer(A.recordList({
    tag: A.tag,
    script: A.pointer({
      defaultLangSys: A.pointer(Po),
      langSysRecords: A.recordList({
        tag: A.tag,
        langSys: A.pointer(Po)
      })
    })
  })) || [];
};
A.prototype.parseFeatureList = function() {
  return this.parsePointer(A.recordList({
    tag: A.tag,
    feature: A.pointer({
      featureParams: A.offset16,
      lookupListIndexes: A.uShortList
    })
  })) || [];
};
A.prototype.parseLookupList = function(n) {
  return this.parsePointer(A.list(A.pointer(function() {
    const t = this.parseUShort();
    V.argument(1 <= t && t <= 9, "GPOS/GSUB lookup type " + t + " unknown.");
    const e = this.parseUShort(), s = e & 16;
    return {
      lookupType: t,
      lookupFlag: e,
      subtables: this.parseList(A.pointer(n[t])),
      markFilteringSet: s ? this.parseUShort() : void 0
    };
  }))) || [];
};
A.prototype.parseFeatureVariationsList = function() {
  return this.parsePointer32(function() {
    const n = this.parseUShort(), t = this.parseUShort();
    return V.argument(n === 1 && t < 1, "GPOS/GSUB feature variations table unknown."), this.parseRecordList32({
      conditionSetOffset: A.offset32,
      featureTableSubstitutionOffset: A.offset32
    });
  }) || [];
};
A.prototype.parseVariationStore = function() {
  const n = this.relativeOffset, t = this.parseUShort(), e = {
    itemVariationStore: this.parseItemVariationStore()
  };
  return this.relativeOffset = n + t + 2, e;
};
A.prototype.parseItemVariationStore = function() {
  const n = this.relativeOffset, t = {
    format: this.parseUShort(),
    variationRegions: [],
    itemVariationSubtables: []
  }, e = this.parseOffset32(), s = this.parseUShort(), i = this.parseULongList(s);
  this.relativeOffset = n + e, t.variationRegions = this.parseVariationRegionList();
  for (let r = 0; r < s; r++) {
    const a = i[r];
    this.relativeOffset = n + a, t.itemVariationSubtables.push(this.parseItemVariationSubtable());
  }
  return t;
};
A.prototype.parseVariationRegionList = function() {
  const n = this.parseUShort(), t = this.parseUShort();
  return this.parseRecordList(t, {
    regionAxes: A.recordList(n, {
      startCoord: A.f2Dot14,
      peakCoord: A.f2Dot14,
      endCoord: A.f2Dot14
    })
  });
};
A.prototype.parseItemVariationSubtable = function() {
  const n = this.parseUShort(), t = this.parseUShort(), e = this.parseUShortList(), s = e.length;
  return {
    regionIndexes: e,
    deltaSets: n && s ? this.parseDeltaSets(n, t, s) : []
  };
};
A.prototype.parseDeltaSetIndexMap = function() {
  const n = this.parseByte(), t = this.parseByte(), e = [];
  let s = 0;
  switch (n) {
    case 0:
      s = this.parseUShort();
      break;
    case 1:
      s = this.parseULong();
      break;
    default:
      console.error(`unsupported DeltaSetIndexMap format ${n}`);
  }
  if (!s) return {
    format: n,
    entryFormat: t
  };
  const i = (t & Lt.INNER_INDEX_BIT_COUNT_MASK) + 1, r = ((t & Lt.MAP_ENTRY_SIZE_MASK) >> 4) + 1;
  for (let a = 0; a < s; a++) {
    let o;
    if (r === 1)
      o = this.parseByte();
    else if (r === 2)
      o = this.parseUShort();
    else if (r === 3)
      o = this.parseUInt24();
    else if (r === 4)
      o = this.parseULong();
    else
      throw new Error(`Invalid entry size of ${r}`);
    const c = o >> i, h = o & (1 << i) - 1;
    e.push({ outerIndex: c, innerIndex: h });
  }
  return {
    format: n,
    entryFormat: t,
    map: e
  };
};
A.prototype.parseDeltaSets = function(n, t, e) {
  const s = Array.from({ length: n }, () => []), i = t & Lt.LONG_WORDS, r = t & Lt.WORD_DELTA_COUNT_MASK;
  if (r > e)
    throw Error("wordCount must be less than or equal to regionIndexCount");
  const a = (i ? this.parseLong : this.parseShort).bind(this), o = (i ? this.parseShort : this.parseChar).bind(this);
  for (let c = 0; c < n; c++)
    for (let h = 0; h < e; h++)
      h < r ? s[c].push(a()) : s[c].push(o());
  return s;
};
A.prototype.parseTupleVariationStoreList = function(n, t, e) {
  const s = this.parseUShort(), r = this.parseUShort() & 1, a = this.parseOffset32(), o = (r ? this.parseULong : this.parseUShort).bind(this), c = {};
  let h = o();
  r || (h *= 2);
  let l;
  for (let u = 0; u < s; u++) {
    l = o(), r || (l *= 2);
    const f = l - h;
    c[u] = f ? this.parseTupleVariationStore(
      a + h,
      n,
      t,
      e,
      u
    ) : void 0, h = l;
  }
  return c;
};
A.prototype.parseTupleVariationStore = function(n, t, e, s, i) {
  const r = this.relativeOffset;
  this.relativeOffset = n, e === "cvar" && (this.relativeOffset += 4);
  const a = this.parseUShort(), o = !!(a & Lt.SHARED_POINT_NUMBERS), c = a & Lt.COUNT_MASK;
  let h = this.parseOffset16();
  const l = [];
  let u = [];
  for (let d = 0; d < c; d++) {
    const g = this.parseTupleVariationHeader(t, e);
    l.push(g);
  }
  this.relativeOffset !== n + h && (console.warn(`Unexpected offset after parsing tuple variation headers! Expected ${n + h}, actually ${this.relativeOffset}`), this.relativeOffset = n + h), o && (u = this.parsePackedPointNumbers());
  let f = this.relativeOffset;
  for (let d = 0; d < c; d++) {
    const g = l[d];
    g.privatePoints = [], this.relativeOffset = f, e === "cvar" && !g.peakTuple && console.warn("An embedded peak tuple is required in TupleVariationHeaders for the cvar table."), g.flags.privatePointNumbers && (g.privatePoints = this.parsePackedPointNumbers()), delete g.flags;
    const x = this.offset, b = this.relativeOffset, v = (S) => {
      let w, F;
      const O = () => {
        let M = 0;
        if (e === "gvar") {
          if (M = g.privatePoints.length || u.length, !M) {
            const I = s.get(i);
            I.path, M = I.points.length, M += 4;
          }
        } else e === "cvar" && (M = s.length);
        this.offset = x, this.relativeOffset = b, w = this.parsePackedDeltas(M), e === "gvar" && (F = this.parsePackedDeltas(M));
      };
      return {
        configurable: !0,
        get: function() {
          return w === void 0 && O(), S === "deltasY" ? F : w;
        },
        set: function(M) {
          w === void 0 && O(), S === "deltasY" ? F = M : w = M;
        }
      };
    };
    Object.defineProperty(g, "deltas", v.call(this, "deltas")), e === "gvar" && Object.defineProperty(g, "deltasY", v.call(this, "deltasY")), f += g.variationDataSize, delete g.variationDataSize;
  }
  this.relativeOffset = r;
  const p = {
    headers: l
  };
  return p.sharedPoints = u, p;
};
A.prototype.parseTupleVariationHeader = function(n, t) {
  const e = this.parseUShort(), s = this.parseUShort(), i = !!(s & Lt.EMBEDDED_PEAK_TUPLE), r = !!(s & Lt.INTERMEDIATE_REGION), a = !!(s & Lt.PRIVATE_POINT_NUMBERS), o = i ? void 0 : s & Lt.TUPLE_INDEX_MASK, c = i ? this.parseTupleRecords(1, n)[0] : void 0, h = r ? this.parseTupleRecords(1, n)[0] : void 0, l = r ? this.parseTupleRecords(1, n)[0] : void 0, u = {
    variationDataSize: e,
    peakTuple: c,
    intermediateStartTuple: h,
    intermediateEndTuple: l,
    flags: {
      embeddedPeakTuple: i,
      intermediateRegion: r,
      privatePointNumbers: a
    }
  };
  return t === "gvar" && (u.sharedTupleRecordsIndex = o), u;
};
A.prototype.parsePackedPointNumbers = function() {
  const n = this.parseByte(), t = [];
  let e = n;
  if (n >= 128) {
    const i = this.parseByte();
    e = (n & Lt.POINT_RUN_COUNT_MASK) << 8 | i;
  }
  let s = 0;
  for (; t.length < e; ) {
    const i = this.parseByte(), r = !!(i & Lt.POINTS_ARE_WORDS);
    let a = (i & Lt.POINT_RUN_COUNT_MASK) + 1;
    for (let o = 0; o < a && t.length < e; o++) {
      let c;
      r ? c = this.parseUShort() : c = this.parseByte(), s = s + c, t.push(s);
    }
  }
  return t;
};
A.prototype.parsePackedDeltas = function(n) {
  const t = [];
  for (; t.length < n; ) {
    const e = this.parseByte(), s = !!(e & Lt.DELTAS_ARE_ZERO), i = !!(e & Lt.DELTAS_ARE_WORDS), r = (e & Lt.DELTA_RUN_COUNT_MASK) + 1;
    for (let a = 0; a < r && t.length < n; a++)
      s ? t.push(0) : i ? t.push(this.parseShort()) : t.push(this.parseChar());
  }
  return t;
};
var z = {
  getByte: Uo,
  getCard8: Uo,
  getUShort: Ti,
  getCard16: Ti,
  getShort: qf,
  getUInt24: zh,
  getULong: ma,
  getFixed: Hh,
  getTag: Xf,
  getOffset: Yf,
  getBytes: $f,
  bytesToString: Zf,
  Parser: A
}, Fi = [
  "copyright",
  // 0
  "fontFamily",
  // 1
  "fontSubfamily",
  // 2
  "uniqueID",
  // 3
  "fullName",
  // 4
  "version",
  // 5
  "postScriptName",
  // 6
  "trademark",
  // 7
  "manufacturer",
  // 8
  "designer",
  // 9
  "description",
  // 10
  "manufacturerURL",
  // 11
  "designerURL",
  // 12
  "license",
  // 13
  "licenseURL",
  // 14
  "reserved",
  // 15
  "preferredFamily",
  // 16
  "preferredSubfamily",
  // 17
  "compatibleFullName",
  // 18
  "sampleText",
  // 19
  "postScriptFindFontName",
  // 20
  "wwsFamily",
  // 21
  "wwsSubfamily"
  // 22
], Gh = {
  0: "en",
  1: "fr",
  2: "de",
  3: "it",
  4: "nl",
  5: "sv",
  6: "es",
  7: "da",
  8: "pt",
  9: "no",
  10: "he",
  11: "ja",
  12: "ar",
  13: "fi",
  14: "el",
  15: "is",
  16: "mt",
  17: "tr",
  18: "hr",
  19: "zh-Hant",
  20: "ur",
  21: "hi",
  22: "th",
  23: "ko",
  24: "lt",
  25: "pl",
  26: "hu",
  27: "es",
  28: "lv",
  29: "se",
  30: "fo",
  31: "fa",
  32: "ru",
  33: "zh",
  34: "nl-BE",
  35: "ga",
  36: "sq",
  37: "ro",
  38: "cz",
  39: "sk",
  40: "si",
  41: "yi",
  42: "sr",
  43: "mk",
  44: "bg",
  45: "uk",
  46: "be",
  47: "uz",
  48: "kk",
  49: "az-Cyrl",
  50: "az-Arab",
  51: "hy",
  52: "ka",
  53: "mo",
  54: "ky",
  55: "tg",
  56: "tk",
  57: "mn-CN",
  58: "mn",
  59: "ps",
  60: "ks",
  61: "ku",
  62: "sd",
  63: "bo",
  64: "ne",
  65: "sa",
  66: "mr",
  67: "bn",
  68: "as",
  69: "gu",
  70: "pa",
  71: "or",
  72: "ml",
  73: "kn",
  74: "ta",
  75: "te",
  76: "si",
  77: "my",
  78: "km",
  79: "lo",
  80: "vi",
  81: "id",
  82: "tl",
  83: "ms",
  84: "ms-Arab",
  85: "am",
  86: "ti",
  87: "om",
  88: "so",
  89: "sw",
  90: "rw",
  91: "rn",
  92: "ny",
  93: "mg",
  94: "eo",
  128: "cy",
  129: "eu",
  130: "ca",
  131: "la",
  132: "qu",
  133: "gn",
  134: "ay",
  135: "tt",
  136: "ug",
  137: "dz",
  138: "jv",
  139: "su",
  140: "gl",
  141: "af",
  142: "br",
  143: "iu",
  144: "gd",
  145: "gv",
  146: "ga",
  147: "to",
  148: "el-polyton",
  149: "kl",
  150: "az",
  151: "nn"
}, Kf = {
  0: 0,
  // langEnglish → smRoman
  1: 0,
  // langFrench → smRoman
  2: 0,
  // langGerman → smRoman
  3: 0,
  // langItalian → smRoman
  4: 0,
  // langDutch → smRoman
  5: 0,
  // langSwedish → smRoman
  6: 0,
  // langSpanish → smRoman
  7: 0,
  // langDanish → smRoman
  8: 0,
  // langPortuguese → smRoman
  9: 0,
  // langNorwegian → smRoman
  10: 5,
  // langHebrew → smHebrew
  11: 1,
  // langJapanese → smJapanese
  12: 4,
  // langArabic → smArabic
  13: 0,
  // langFinnish → smRoman
  14: 6,
  // langGreek → smGreek
  15: 0,
  // langIcelandic → smRoman (modified)
  16: 0,
  // langMaltese → smRoman
  17: 0,
  // langTurkish → smRoman (modified)
  18: 0,
  // langCroatian → smRoman (modified)
  19: 2,
  // langTradChinese → smTradChinese
  20: 4,
  // langUrdu → smArabic
  21: 9,
  // langHindi → smDevanagari
  22: 21,
  // langThai → smThai
  23: 3,
  // langKorean → smKorean
  24: 29,
  // langLithuanian → smCentralEuroRoman
  25: 29,
  // langPolish → smCentralEuroRoman
  26: 29,
  // langHungarian → smCentralEuroRoman
  27: 29,
  // langEstonian → smCentralEuroRoman
  28: 29,
  // langLatvian → smCentralEuroRoman
  29: 0,
  // langSami → smRoman
  30: 0,
  // langFaroese → smRoman (modified)
  31: 4,
  // langFarsi → smArabic (modified)
  32: 7,
  // langRussian → smCyrillic
  33: 25,
  // langSimpChinese → smSimpChinese
  34: 0,
  // langFlemish → smRoman
  35: 0,
  // langIrishGaelic → smRoman (modified)
  36: 0,
  // langAlbanian → smRoman
  37: 0,
  // langRomanian → smRoman (modified)
  38: 29,
  // langCzech → smCentralEuroRoman
  39: 29,
  // langSlovak → smCentralEuroRoman
  40: 0,
  // langSlovenian → smRoman (modified)
  41: 5,
  // langYiddish → smHebrew
  42: 7,
  // langSerbian → smCyrillic
  43: 7,
  // langMacedonian → smCyrillic
  44: 7,
  // langBulgarian → smCyrillic
  45: 7,
  // langUkrainian → smCyrillic (modified)
  46: 7,
  // langByelorussian → smCyrillic
  47: 7,
  // langUzbek → smCyrillic
  48: 7,
  // langKazakh → smCyrillic
  49: 7,
  // langAzerbaijani → smCyrillic
  50: 4,
  // langAzerbaijanAr → smArabic
  51: 24,
  // langArmenian → smArmenian
  52: 23,
  // langGeorgian → smGeorgian
  53: 7,
  // langMoldavian → smCyrillic
  54: 7,
  // langKirghiz → smCyrillic
  55: 7,
  // langTajiki → smCyrillic
  56: 7,
  // langTurkmen → smCyrillic
  57: 27,
  // langMongolian → smMongolian
  58: 7,
  // langMongolianCyr → smCyrillic
  59: 4,
  // langPashto → smArabic
  60: 4,
  // langKurdish → smArabic
  61: 4,
  // langKashmiri → smArabic
  62: 4,
  // langSindhi → smArabic
  63: 26,
  // langTibetan → smTibetan
  64: 9,
  // langNepali → smDevanagari
  65: 9,
  // langSanskrit → smDevanagari
  66: 9,
  // langMarathi → smDevanagari
  67: 13,
  // langBengali → smBengali
  68: 13,
  // langAssamese → smBengali
  69: 11,
  // langGujarati → smGujarati
  70: 10,
  // langPunjabi → smGurmukhi
  71: 12,
  // langOriya → smOriya
  72: 17,
  // langMalayalam → smMalayalam
  73: 16,
  // langKannada → smKannada
  74: 14,
  // langTamil → smTamil
  75: 15,
  // langTelugu → smTelugu
  76: 18,
  // langSinhalese → smSinhalese
  77: 19,
  // langBurmese → smBurmese
  78: 20,
  // langKhmer → smKhmer
  79: 22,
  // langLao → smLao
  80: 30,
  // langVietnamese → smVietnamese
  81: 0,
  // langIndonesian → smRoman
  82: 0,
  // langTagalog → smRoman
  83: 0,
  // langMalayRoman → smRoman
  84: 4,
  // langMalayArabic → smArabic
  85: 28,
  // langAmharic → smEthiopic
  86: 28,
  // langTigrinya → smEthiopic
  87: 28,
  // langOromo → smEthiopic
  88: 0,
  // langSomali → smRoman
  89: 0,
  // langSwahili → smRoman
  90: 0,
  // langKinyarwanda → smRoman
  91: 0,
  // langRundi → smRoman
  92: 0,
  // langNyanja → smRoman
  93: 0,
  // langMalagasy → smRoman
  94: 0,
  // langEsperanto → smRoman
  128: 0,
  // langWelsh → smRoman (modified)
  129: 0,
  // langBasque → smRoman
  130: 0,
  // langCatalan → smRoman
  131: 0,
  // langLatin → smRoman
  132: 0,
  // langQuechua → smRoman
  133: 0,
  // langGuarani → smRoman
  134: 0,
  // langAymara → smRoman
  135: 7,
  // langTatar → smCyrillic
  136: 4,
  // langUighur → smArabic
  137: 26,
  // langDzongkha → smTibetan
  138: 0,
  // langJavaneseRom → smRoman
  139: 0,
  // langSundaneseRom → smRoman
  140: 0,
  // langGalician → smRoman
  141: 0,
  // langAfrikaans → smRoman
  142: 0,
  // langBreton → smRoman (modified)
  143: 28,
  // langInuktitut → smEthiopic (modified)
  144: 0,
  // langScottishGaelic → smRoman (modified)
  145: 0,
  // langManxGaelic → smRoman (modified)
  146: 0,
  // langIrishGaelicScript → smRoman (modified)
  147: 0,
  // langTongan → smRoman
  148: 6,
  // langGreekAncient → smRoman
  149: 0,
  // langGreenlandic → smRoman
  150: 0,
  // langAzerbaijanRoman → smRoman
  151: 0
  // langNynorsk → smRoman
}, Vh = {
  1078: "af",
  1052: "sq",
  1156: "gsw",
  1118: "am",
  5121: "ar-DZ",
  15361: "ar-BH",
  3073: "ar",
  2049: "ar-IQ",
  11265: "ar-JO",
  13313: "ar-KW",
  12289: "ar-LB",
  4097: "ar-LY",
  6145: "ary",
  8193: "ar-OM",
  16385: "ar-QA",
  1025: "ar-SA",
  10241: "ar-SY",
  7169: "aeb",
  14337: "ar-AE",
  9217: "ar-YE",
  1067: "hy",
  1101: "as",
  2092: "az-Cyrl",
  1068: "az",
  1133: "ba",
  1069: "eu",
  1059: "be",
  2117: "bn",
  1093: "bn-IN",
  8218: "bs-Cyrl",
  5146: "bs",
  1150: "br",
  1026: "bg",
  1027: "ca",
  3076: "zh-HK",
  5124: "zh-MO",
  2052: "zh",
  4100: "zh-SG",
  1028: "zh-TW",
  1155: "co",
  1050: "hr",
  4122: "hr-BA",
  1029: "cs",
  1030: "da",
  1164: "prs",
  1125: "dv",
  2067: "nl-BE",
  1043: "nl",
  3081: "en-AU",
  10249: "en-BZ",
  4105: "en-CA",
  9225: "en-029",
  16393: "en-IN",
  6153: "en-IE",
  8201: "en-JM",
  17417: "en-MY",
  5129: "en-NZ",
  13321: "en-PH",
  18441: "en-SG",
  7177: "en-ZA",
  11273: "en-TT",
  2057: "en-GB",
  1033: "en",
  12297: "en-ZW",
  1061: "et",
  1080: "fo",
  1124: "fil",
  1035: "fi",
  2060: "fr-BE",
  3084: "fr-CA",
  1036: "fr",
  5132: "fr-LU",
  6156: "fr-MC",
  4108: "fr-CH",
  1122: "fy",
  1110: "gl",
  1079: "ka",
  3079: "de-AT",
  1031: "de",
  5127: "de-LI",
  4103: "de-LU",
  2055: "de-CH",
  1032: "el",
  1135: "kl",
  1095: "gu",
  1128: "ha",
  1037: "he",
  1081: "hi",
  1038: "hu",
  1039: "is",
  1136: "ig",
  1057: "id",
  1117: "iu",
  2141: "iu-Latn",
  2108: "ga",
  1076: "xh",
  1077: "zu",
  1040: "it",
  2064: "it-CH",
  1041: "ja",
  1099: "kn",
  1087: "kk",
  1107: "km",
  1158: "quc",
  1159: "rw",
  1089: "sw",
  1111: "kok",
  1042: "ko",
  1088: "ky",
  1108: "lo",
  1062: "lv",
  1063: "lt",
  2094: "dsb",
  1134: "lb",
  1071: "mk",
  2110: "ms-BN",
  1086: "ms",
  1100: "ml",
  1082: "mt",
  1153: "mi",
  1146: "arn",
  1102: "mr",
  1148: "moh",
  1104: "mn",
  2128: "mn-CN",
  1121: "ne",
  1044: "nb",
  2068: "nn",
  1154: "oc",
  1096: "or",
  1123: "ps",
  1045: "pl",
  1046: "pt",
  2070: "pt-PT",
  1094: "pa",
  1131: "qu-BO",
  2155: "qu-EC",
  3179: "qu",
  1048: "ro",
  1047: "rm",
  1049: "ru",
  9275: "smn",
  4155: "smj-NO",
  5179: "smj",
  3131: "se-FI",
  1083: "se",
  2107: "se-SE",
  8251: "sms",
  6203: "sma-NO",
  7227: "sms",
  1103: "sa",
  7194: "sr-Cyrl-BA",
  3098: "sr",
  6170: "sr-Latn-BA",
  2074: "sr-Latn",
  1132: "nso",
  1074: "tn",
  1115: "si",
  1051: "sk",
  1060: "sl",
  11274: "es-AR",
  16394: "es-BO",
  13322: "es-CL",
  9226: "es-CO",
  5130: "es-CR",
  7178: "es-DO",
  12298: "es-EC",
  17418: "es-SV",
  4106: "es-GT",
  18442: "es-HN",
  2058: "es-MX",
  19466: "es-NI",
  6154: "es-PA",
  15370: "es-PY",
  10250: "es-PE",
  20490: "es-PR",
  // Microsoft has defined two different language codes for
  // “Spanish with modern sorting” and “Spanish with traditional
  // sorting”. This makes sense for collation APIs, and it would be
  // possible to express this in BCP 47 language tags via Unicode
  // extensions (eg., es-u-co-trad is Spanish with traditional
  // sorting). However, for storing names in fonts, the distinction
  // does not make sense, so we give “es” in both cases.
  3082: "es",
  1034: "es",
  21514: "es-US",
  14346: "es-UY",
  8202: "es-VE",
  2077: "sv-FI",
  1053: "sv",
  1114: "syr",
  1064: "tg",
  2143: "tzm",
  1097: "ta",
  1092: "tt",
  1098: "te",
  1054: "th",
  1105: "bo",
  1055: "tr",
  1090: "tk",
  1152: "ug",
  1058: "uk",
  1070: "hsb",
  1056: "ur",
  2115: "uz-Cyrl",
  1091: "uz",
  1066: "vi",
  1106: "cy",
  1160: "wo",
  1157: "sah",
  1144: "ii",
  1130: "yo"
};
function Qf(n, t, e) {
  switch (n) {
    case 0:
      if (t === 65535)
        return "und";
      if (e)
        return e[t];
      break;
    case 1:
      return Gh[t];
    case 3:
      return Vh[t];
  }
}
var na = "utf-16", tp = {
  0: "macintosh",
  // smRoman
  1: "x-mac-japanese",
  // smJapanese
  2: "x-mac-chinesetrad",
  // smTradChinese
  3: "x-mac-korean",
  // smKorean
  6: "x-mac-greek",
  // smGreek
  7: "x-mac-cyrillic",
  // smCyrillic
  9: "x-mac-devanagai",
  // smDevanagari
  10: "x-mac-gurmukhi",
  // smGurmukhi
  11: "x-mac-gujarati",
  // smGujarati
  12: "x-mac-oriya",
  // smOriya
  13: "x-mac-bengali",
  // smBengali
  14: "x-mac-tamil",
  // smTamil
  15: "x-mac-telugu",
  // smTelugu
  16: "x-mac-kannada",
  // smKannada
  17: "x-mac-malayalam",
  // smMalayalam
  18: "x-mac-sinhalese",
  // smSinhalese
  19: "x-mac-burmese",
  // smBurmese
  20: "x-mac-khmer",
  // smKhmer
  21: "x-mac-thai",
  // smThai
  22: "x-mac-lao",
  // smLao
  23: "x-mac-georgian",
  // smGeorgian
  24: "x-mac-armenian",
  // smArmenian
  25: "x-mac-chinesesimp",
  // smSimpChinese
  26: "x-mac-tibetan",
  // smTibetan
  27: "x-mac-mongolian",
  // smMongolian
  28: "x-mac-ethiopic",
  // smEthiopic
  29: "x-mac-ce",
  // smCentralEuroRoman
  30: "x-mac-vietnamese",
  // smVietnamese
  31: "x-mac-extarabic"
  // smExtArabic
}, ep = {
  15: "x-mac-icelandic",
  // langIcelandic
  17: "x-mac-turkish",
  // langTurkish
  18: "x-mac-croatian",
  // langCroatian
  24: "x-mac-ce",
  // langLithuanian
  25: "x-mac-ce",
  // langPolish
  26: "x-mac-ce",
  // langHungarian
  27: "x-mac-ce",
  // langEstonian
  28: "x-mac-ce",
  // langLatvian
  30: "x-mac-icelandic",
  // langFaroese
  37: "x-mac-romanian",
  // langRomanian
  38: "x-mac-ce",
  // langCzech
  39: "x-mac-ce",
  // langSlovak
  40: "x-mac-ce",
  // langSlovenian
  143: "x-mac-inuit",
  // langInuktitut
  146: "x-mac-gaelic"
  // langIrishGaelicScript
};
function ya(n, t, e) {
  switch (n) {
    case 0:
      return na;
    case 1:
      return ep[e] || tp[t];
    case 3:
      if (t === 1 || t === 10)
        return na;
      break;
  }
}
var Wh = {
  0: "unicode",
  1: "macintosh",
  2: "reserved",
  3: "windows"
};
function np(n) {
  return Wh[n];
}
function sp(n, t, e) {
  const s = {}, i = new z.Parser(n, t), r = i.parseUShort(), a = i.parseUShort(), o = i.offset + i.parseUShort();
  for (let c = 0; c < a; c++) {
    const h = i.parseUShort(), l = i.parseUShort(), u = i.parseUShort(), f = i.parseUShort(), p = Fi[f] || f, d = i.parseUShort(), g = i.parseUShort(), x = Qf(h, u, e), b = ya(h, l, u), v = np(h);
    if (b !== void 0 && x !== void 0 && v !== void 0) {
      let S;
      if (b === na ? S = Gn.UTF16(n, o + g, d) : S = Gn.MACSTRING(n, o + g, d, b), S) {
        let w = s[v];
        w === void 0 && (w = s[v] = {});
        let F = w[p];
        F === void 0 && (F = w[p] = {}), F[x] = S;
      }
    }
  }
  return r === 1 && i.parseUShort(), s;
}
function ei(n) {
  const t = {};
  for (let e in n)
    t[n[e]] = parseInt(e);
  return t;
}
function No(n, t, e, s, i, r) {
  return new L.Record("NameRecord", [
    { name: "platformID", type: "USHORT", value: n },
    { name: "encodingID", type: "USHORT", value: t },
    { name: "languageID", type: "USHORT", value: e },
    { name: "nameID", type: "USHORT", value: s },
    { name: "length", type: "USHORT", value: i },
    { name: "offset", type: "USHORT", value: r }
  ]);
}
function ip(n, t) {
  const e = n.length, s = t.length - e + 1;
  t:
    for (let i = 0; i < s; i++)
      for (; i < s; i++) {
        for (let r = 0; r < e; r++)
          if (t[i + r] !== n[r])
            continue t;
        return i;
      }
  return -1;
}
function zo(n, t) {
  let e = ip(n, t);
  if (e < 0) {
    e = t.length;
    let s = 0;
    const i = n.length;
    for (; s < i; ++s)
      t.push(n[s]);
  }
  return e;
}
function rp(n, t) {
  const e = ei(Wh), s = ei(Gh), i = ei(Vh), r = [], a = [];
  for (let c in n) {
    let h;
    const l = [], u = {}, f = ei(Fi), p = e[c];
    for (let d in n[c]) {
      let g = f[d];
      if (g === void 0 && (g = d), h = parseInt(g), isNaN(h))
        throw new Error('Name table entry "' + d + '" does not exist, see nameTableNames for complete list.');
      u[h] = n[c][d], l.push(h);
    }
    for (let d = 0; d < l.length; d++) {
      h = l[d];
      const g = u[h];
      for (let x in g) {
        const b = g[x];
        if (p === 1 || p === 0) {
          let v = s[x], S = Kf[v];
          const w = ya(p, S, v);
          let F = N.MACSTRING(b, w);
          if (p === 0 && (v = t.indexOf(x), v < 0 && (v = t.length, t.push(x)), S = 4, F = N.UTF16(b)), F !== void 0) {
            const O = zo(F, a);
            r.push(No(
              p,
              S,
              v,
              h,
              F.length,
              O
            ));
          }
        }
        if (p === 3) {
          const v = i[x];
          if (v !== void 0) {
            const S = N.UTF16(b), w = zo(S, a);
            r.push(No(
              3,
              1,
              v,
              h,
              S.length,
              w
            ));
          }
        }
      }
    }
  }
  r.sort(function(c, h) {
    return c.platformID - h.platformID || c.encodingID - h.encodingID || c.languageID - h.languageID || c.nameID - h.nameID;
  });
  const o = new L.Table("name", [
    { name: "format", type: "USHORT", value: 0 },
    { name: "count", type: "USHORT", value: r.length },
    { name: "stringOffset", type: "USHORT", value: 6 + r.length * 12 }
  ]);
  for (let c = 0; c < r.length; c++)
    o.fields.push({ name: "record_" + c, type: "RECORD", value: r[c] });
  return o.fields.push({ name: "strings", type: "LITERAL", value: a }), o;
}
function Ai(n, t, e = []) {
  if (t < 256 && t in Fi) {
    if (e.length && !e.includes(parseInt(t)))
      return;
    t = Fi[t];
  }
  for (let s in n)
    for (let i in n[s])
      if (i === t || parseInt(i) === t)
        return n[s][i];
}
var qh = { parse: sp, make: rp, getNameByID: Ai };
function ap(n, t, e, s) {
  n.length = t.parseUShort(), n.language = t.parseUShort() - 1;
  const i = t.parseByteList(n.length), r = Object.assign({}, i), a = ya(e, s, n.language), o = xi[a];
  for (let c = 0; c < o.length; c++)
    r[o.charCodeAt(c)] = i[128 + c];
  n.glyphIndexMap = r;
}
function op(n, t, e) {
  t.parseUShort(), n.length = t.parseULong(), n.language = t.parseULong();
  let s;
  n.groupCount = s = t.parseULong(), n.glyphIndexMap = {};
  for (let i = 0; i < s; i += 1) {
    const r = t.parseULong(), a = t.parseULong();
    let o = t.parseULong();
    for (let c = r; c <= a; c += 1)
      n.glyphIndexMap[c] = o, e === 12 && o++;
  }
}
function cp(n, t, e, s, i) {
  n.length = t.parseUShort(), n.language = t.parseUShort();
  let r;
  n.segCount = r = t.parseUShort() >> 1, t.skip("uShort", 3), n.glyphIndexMap = {};
  const a = new z.Parser(e, s + i + 14), o = new z.Parser(e, s + i + 16 + r * 2), c = new z.Parser(e, s + i + 16 + r * 4), h = new z.Parser(e, s + i + 16 + r * 6);
  let l = s + i + 16 + r * 8;
  for (let u = 0; u < r - 1; u += 1) {
    let f;
    const p = a.parseUShort(), d = o.parseUShort(), g = c.parseShort(), x = h.parseUShort();
    for (let b = d; b <= p; b += 1)
      x !== 0 ? (l = h.offset + h.relativeOffset - 2, l += x, l += (b - d) * 2, f = z.getUShort(e, l), f !== 0 && (f = f + g & 65535)) : f = b + g & 65535, n.glyphIndexMap[b] = f;
  }
}
function hp(n, t) {
  const e = {};
  t.skip("uLong");
  const s = t.parseULong();
  for (let i = 0; i < s; i += 1) {
    const r = t.parseUInt24(), a = {
      varSelector: r
    }, o = t.parseOffset32(), c = t.parseOffset32(), h = t.relativeOffset;
    o && (t.relativeOffset = o, a.defaultUVS = t.parseStruct({
      ranges: function() {
        return t.parseRecordList32({
          startUnicodeValue: t.parseUInt24,
          additionalCount: t.parseByte
        });
      }
    })), c && (t.relativeOffset = c, a.nonDefaultUVS = t.parseStruct({
      uvsMappings: function() {
        const l = {}, u = t.parseRecordList32({
          unicodeValue: t.parseUInt24,
          glyphID: t.parseUShort
        });
        for (let f = 0; f < u.length; f += 1)
          l[u[f].unicodeValue] = u[f];
        return l;
      }
    })), e[r] = a, t.relativeOffset = h;
  }
  n.varSelectorList = e;
}
function lp(n, t) {
  const e = {};
  e.version = z.getUShort(n, t), V.argument(e.version === 0, "cmap table version should be 0."), e.numTables = z.getUShort(n, t + 2);
  let s = null, i = -1, r = -1, a = null, o = null;
  const c = [0, 1, 2, 3, 4, 6], h = [0, 1, 10];
  for (let u = e.numTables - 1; u >= 0; u -= 1)
    if (a = z.getUShort(n, t + 4 + u * 8), o = z.getUShort(n, t + 4 + u * 8 + 2), a === 3 && h.includes(o) || a === 0 && c.includes(o) || a === 1 && o === 0) {
      if (r > 0) continue;
      if (r = z.getULong(n, t + 4 + u * 8 + 4), s)
        break;
    } else if (a === 0 && o === 5) {
      if (i = z.getULong(n, t + 4 + u * 8 + 4), s = new z.Parser(n, t + i), s.parseUShort() !== 14)
        i = -1, s = null;
      else if (r > 0)
        break;
    }
  if (r === -1)
    throw new Error("No valid cmap sub-tables found.");
  const l = new z.Parser(n, t + r);
  if (e.format = l.parseUShort(), e.format === 0)
    ap(e, l, a, o);
  else if (e.format === 12 || e.format === 13)
    op(e, l, e.format);
  else if (e.format === 4)
    cp(e, l, n, t, r);
  else
    throw new Error(
      "Only format 0 (platformId 1, encodingId 0), 4, 12 and 14 cmap tables are supported (found format " + e.format + ", platformId " + a + ", encodingId " + o + ")."
    );
  return s && hp(e, s), e;
}
function up(n, t, e) {
  n.segments.push({
    end: t,
    start: t,
    delta: -(t - e),
    offset: 0,
    glyphIndex: e
  });
}
function fp(n) {
  n.segments.push({
    end: 65535,
    start: 65535,
    delta: 1,
    offset: 0
  });
}
function pp(n) {
  if (n.length === 0) return n;
  const t = [n[0]];
  for (let e = 1; e < n.length; e++) {
    const s = t[t.length - 1], i = n[e];
    s.end + 1 === i.start && s.delta === i.delta && i.end !== 65535 ? s.end = i.end : t.push(i);
  }
  return t;
}
function dp(n) {
  let t = !0, e;
  for (e = n.length - 1; e > 0; e -= 1)
    if (n.get(e).unicode > 65535) {
      t = !1;
      break;
    }
  let s = [
    { name: "version", type: "USHORT", value: 0 },
    { name: "numTables", type: "USHORT", value: t ? 1 : 2 },
    // CMAP 4 header
    { name: "platformID", type: "USHORT", value: 3 },
    { name: "encodingID", type: "USHORT", value: 1 },
    { name: "offset", type: "ULONG", value: t ? 12 : 20 }
  ];
  t || s.push(
    // CMAP 12 header
    { name: "cmap12PlatformID", type: "USHORT", value: 3 },
    // We encode only for PlatformID = 3 (Windows) because it is supported everywhere
    { name: "cmap12EncodingID", type: "USHORT", value: 10 },
    { name: "cmap12Offset", type: "ULONG", value: 0 }
  ), s.push(
    // CMAP 4 Subtable
    { name: "format", type: "USHORT", value: 4 },
    { name: "cmap4Length", type: "USHORT", value: 0 },
    { name: "language", type: "USHORT", value: 0 },
    { name: "segCountX2", type: "USHORT", value: 0 },
    { name: "searchRange", type: "USHORT", value: 0 },
    { name: "entrySelector", type: "USHORT", value: 0 },
    { name: "rangeShift", type: "USHORT", value: 0 }
  );
  const i = new L.Table("cmap", s);
  for (i.segments = [], e = 0; e < n.length; e += 1) {
    const p = n.get(e);
    for (let d = 0; d < p.unicodes.length; d += 1)
      up(i, p.unicodes[d], e);
  }
  i.segments.sort(function(p, d) {
    return p.start - d.start;
  }), i.segments = pp(i.segments), fp(i);
  const r = i.segments.length;
  let a = 0, o = [], c = [], h = [], l = [], u = [], f = [];
  for (e = 0; e < r; e += 1) {
    const p = i.segments[e];
    p.end <= 65535 && p.start <= 65535 ? (o.push({ name: "end_" + e, type: "USHORT", value: p.end }), c.push({ name: "start_" + e, type: "USHORT", value: p.start }), h.push({ name: "idDelta_" + e, type: "SHORT", value: p.delta }), l.push({ name: "idRangeOffset_" + e, type: "USHORT", value: p.offset }), p.glyphId !== void 0 && u.push({ name: "glyph_" + e, type: "USHORT", value: p.glyphId })) : a += 1, !t && p.glyphIndex !== void 0 && (f.push({ name: "cmap12Start_" + e, type: "ULONG", value: p.start }), f.push({ name: "cmap12End_" + e, type: "ULONG", value: p.end }), f.push({ name: "cmap12Glyph_" + e, type: "ULONG", value: p.glyphIndex }));
  }
  i.segCountX2 = (r - a) * 2, i.searchRange = Math.pow(2, Math.floor(Math.log(r - a) / Math.log(2))) * 2, i.entrySelector = Math.log(i.searchRange / 2) / Math.log(2), i.rangeShift = i.segCountX2 - i.searchRange;
  for (let p = 0; p < o.length; p++)
    i.fields.push(o[p]);
  i.fields.push({ name: "reservedPad", type: "USHORT", value: 0 });
  for (let p = 0; p < c.length; p++)
    i.fields.push(c[p]);
  for (let p = 0; p < h.length; p++)
    i.fields.push(h[p]);
  for (let p = 0; p < l.length; p++)
    i.fields.push(l[p]);
  for (let p = 0; p < u.length; p++)
    i.fields.push(u[p]);
  if (i.cmap4Length = 14 + // Subtable header
  o.length * 2 + 2 + // reservedPad
  c.length * 2 + h.length * 2 + l.length * 2 + u.length * 2, !t) {
    const p = 16 + // Subtable header
    f.length * 4;
    i.cmap12Offset = 12 + 2 * 2 + 4 + i.cmap4Length, i.fields.push({ name: "cmap12Format", type: "USHORT", value: 12 }, { name: "cmap12Reserved", type: "USHORT", value: 0 }, { name: "cmap12Length", type: "ULONG", value: p }, { name: "cmap12Language", type: "ULONG", value: 0 }, { name: "cmap12nGroups", type: "ULONG", value: f.length / 3 });
    for (let d = 0; d < f.length; d++)
      i.fields.push(f[d]);
  }
  return i;
}
var jh = { parse: lp, make: dp }, oi = [
  ".notdef",
  "space",
  "exclam",
  "quotedbl",
  "numbersign",
  "dollar",
  "percent",
  "ampersand",
  "quoteright",
  "parenleft",
  "parenright",
  "asterisk",
  "plus",
  "comma",
  "hyphen",
  "period",
  "slash",
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "colon",
  "semicolon",
  "less",
  "equal",
  "greater",
  "question",
  "at",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "bracketleft",
  "backslash",
  "bracketright",
  "asciicircum",
  "underscore",
  "quoteleft",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "braceleft",
  "bar",
  "braceright",
  "asciitilde",
  "exclamdown",
  "cent",
  "sterling",
  "fraction",
  "yen",
  "florin",
  "section",
  "currency",
  "quotesingle",
  "quotedblleft",
  "guillemotleft",
  "guilsinglleft",
  "guilsinglright",
  "fi",
  "fl",
  "endash",
  "dagger",
  "daggerdbl",
  "periodcentered",
  "paragraph",
  "bullet",
  "quotesinglbase",
  "quotedblbase",
  "quotedblright",
  "guillemotright",
  "ellipsis",
  "perthousand",
  "questiondown",
  "grave",
  "acute",
  "circumflex",
  "tilde",
  "macron",
  "breve",
  "dotaccent",
  "dieresis",
  "ring",
  "cedilla",
  "hungarumlaut",
  "ogonek",
  "caron",
  "emdash",
  "AE",
  "ordfeminine",
  "Lslash",
  "Oslash",
  "OE",
  "ordmasculine",
  "ae",
  "dotlessi",
  "lslash",
  "oslash",
  "oe",
  "germandbls",
  "onesuperior",
  "logicalnot",
  "mu",
  "trademark",
  "Eth",
  "onehalf",
  "plusminus",
  "Thorn",
  "onequarter",
  "divide",
  "brokenbar",
  "degree",
  "thorn",
  "threequarters",
  "twosuperior",
  "registered",
  "minus",
  "eth",
  "multiply",
  "threesuperior",
  "copyright",
  "Aacute",
  "Acircumflex",
  "Adieresis",
  "Agrave",
  "Aring",
  "Atilde",
  "Ccedilla",
  "Eacute",
  "Ecircumflex",
  "Edieresis",
  "Egrave",
  "Iacute",
  "Icircumflex",
  "Idieresis",
  "Igrave",
  "Ntilde",
  "Oacute",
  "Ocircumflex",
  "Odieresis",
  "Ograve",
  "Otilde",
  "Scaron",
  "Uacute",
  "Ucircumflex",
  "Udieresis",
  "Ugrave",
  "Yacute",
  "Ydieresis",
  "Zcaron",
  "aacute",
  "acircumflex",
  "adieresis",
  "agrave",
  "aring",
  "atilde",
  "ccedilla",
  "eacute",
  "ecircumflex",
  "edieresis",
  "egrave",
  "iacute",
  "icircumflex",
  "idieresis",
  "igrave",
  "ntilde",
  "oacute",
  "ocircumflex",
  "odieresis",
  "ograve",
  "otilde",
  "scaron",
  "uacute",
  "ucircumflex",
  "udieresis",
  "ugrave",
  "yacute",
  "ydieresis",
  "zcaron",
  "exclamsmall",
  "Hungarumlautsmall",
  "dollaroldstyle",
  "dollarsuperior",
  "ampersandsmall",
  "Acutesmall",
  "parenleftsuperior",
  "parenrightsuperior",
  "266 ff",
  "onedotenleader",
  "zerooldstyle",
  "oneoldstyle",
  "twooldstyle",
  "threeoldstyle",
  "fouroldstyle",
  "fiveoldstyle",
  "sixoldstyle",
  "sevenoldstyle",
  "eightoldstyle",
  "nineoldstyle",
  "commasuperior",
  "threequartersemdash",
  "periodsuperior",
  "questionsmall",
  "asuperior",
  "bsuperior",
  "centsuperior",
  "dsuperior",
  "esuperior",
  "isuperior",
  "lsuperior",
  "msuperior",
  "nsuperior",
  "osuperior",
  "rsuperior",
  "ssuperior",
  "tsuperior",
  "ff",
  "ffi",
  "ffl",
  "parenleftinferior",
  "parenrightinferior",
  "Circumflexsmall",
  "hyphensuperior",
  "Gravesmall",
  "Asmall",
  "Bsmall",
  "Csmall",
  "Dsmall",
  "Esmall",
  "Fsmall",
  "Gsmall",
  "Hsmall",
  "Ismall",
  "Jsmall",
  "Ksmall",
  "Lsmall",
  "Msmall",
  "Nsmall",
  "Osmall",
  "Psmall",
  "Qsmall",
  "Rsmall",
  "Ssmall",
  "Tsmall",
  "Usmall",
  "Vsmall",
  "Wsmall",
  "Xsmall",
  "Ysmall",
  "Zsmall",
  "colonmonetary",
  "onefitted",
  "rupiah",
  "Tildesmall",
  "exclamdownsmall",
  "centoldstyle",
  "Lslashsmall",
  "Scaronsmall",
  "Zcaronsmall",
  "Dieresissmall",
  "Brevesmall",
  "Caronsmall",
  "Dotaccentsmall",
  "Macronsmall",
  "figuredash",
  "hypheninferior",
  "Ogoneksmall",
  "Ringsmall",
  "Cedillasmall",
  "questiondownsmall",
  "oneeighth",
  "threeeighths",
  "fiveeighths",
  "seveneighths",
  "onethird",
  "twothirds",
  "zerosuperior",
  "foursuperior",
  "fivesuperior",
  "sixsuperior",
  "sevensuperior",
  "eightsuperior",
  "ninesuperior",
  "zeroinferior",
  "oneinferior",
  "twoinferior",
  "threeinferior",
  "fourinferior",
  "fiveinferior",
  "sixinferior",
  "seveninferior",
  "eightinferior",
  "nineinferior",
  "centinferior",
  "dollarinferior",
  "periodinferior",
  "commainferior",
  "Agravesmall",
  "Aacutesmall",
  "Acircumflexsmall",
  "Atildesmall",
  "Adieresissmall",
  "Aringsmall",
  "AEsmall",
  "Ccedillasmall",
  "Egravesmall",
  "Eacutesmall",
  "Ecircumflexsmall",
  "Edieresissmall",
  "Igravesmall",
  "Iacutesmall",
  "Icircumflexsmall",
  "Idieresissmall",
  "Ethsmall",
  "Ntildesmall",
  "Ogravesmall",
  "Oacutesmall",
  "Ocircumflexsmall",
  "Otildesmall",
  "Odieresissmall",
  "OEsmall",
  "Oslashsmall",
  "Ugravesmall",
  "Uacutesmall",
  "Ucircumflexsmall",
  "Udieresissmall",
  "Yacutesmall",
  "Thornsmall",
  "Ydieresissmall",
  "001.000",
  "001.001",
  "001.002",
  "001.003",
  "Black",
  "Bold",
  "Book",
  "Light",
  "Medium",
  "Regular",
  "Roman",
  "Semibold"
], gp = [
  ".notdef",
  "space",
  "exclam",
  "quotedbl",
  "numbersign",
  "dollar",
  "percent",
  "ampersand",
  "quoteright",
  "parenleft",
  "parenright",
  "asterisk",
  "plus",
  "comma",
  "hyphen",
  "period",
  "slash",
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "colon",
  "semicolon",
  "less",
  "equal",
  "greater",
  "question",
  "at",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "bracketleft",
  "backslash",
  "bracketright",
  "asciicircum",
  "underscore",
  "quoteleft",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "braceleft",
  "bar",
  "braceright",
  "asciitilde",
  "exclamdown",
  "cent",
  "sterling",
  "fraction",
  "yen",
  "florin",
  "section",
  "currency",
  "quotesingle",
  "quotedblleft",
  "guillemotleft",
  "guilsinglleft",
  "guilsinglright",
  "fi",
  "fl",
  "endash",
  "dagger",
  "daggerdbl",
  "periodcentered",
  "paragraph",
  "bullet",
  "quotesinglbase",
  "quotedblbase",
  "quotedblright",
  "guillemotright",
  "ellipsis",
  "perthousand",
  "questiondown",
  "grave",
  "acute",
  "circumflex",
  "tilde",
  "macron",
  "breve",
  "dotaccent",
  "dieresis",
  "ring",
  "cedilla",
  "hungarumlaut",
  "ogonek",
  "caron",
  "emdash",
  "AE",
  "ordfeminine",
  "Lslash",
  "Oslash",
  "OE",
  "ordmasculine",
  "ae",
  "dotlessi",
  "lslash",
  "oslash",
  "oe",
  "germandbls",
  "onesuperior",
  "logicalnot",
  "mu",
  "trademark",
  "Eth",
  "onehalf",
  "plusminus",
  "Thorn",
  "onequarter",
  "divide",
  "brokenbar",
  "degree",
  "thorn",
  "threequarters",
  "twosuperior",
  "registered",
  "minus",
  "eth",
  "multiply",
  "threesuperior",
  "copyright",
  "Aacute",
  "Acircumflex",
  "Adieresis",
  "Agrave",
  "Aring",
  "Atilde",
  "Ccedilla",
  "Eacute",
  "Ecircumflex",
  "Edieresis",
  "Egrave",
  "Iacute",
  "Icircumflex",
  "Idieresis",
  "Igrave",
  "Ntilde",
  "Oacute",
  "Ocircumflex",
  "Odieresis",
  "Ograve",
  "Otilde",
  "Scaron",
  "Uacute",
  "Ucircumflex",
  "Udieresis",
  "Ugrave",
  "Yacute",
  "Ydieresis",
  "Zcaron",
  "aacute",
  "acircumflex",
  "adieresis",
  "agrave",
  "aring",
  "atilde",
  "ccedilla",
  "eacute",
  "ecircumflex",
  "edieresis",
  "egrave",
  "iacute",
  "icircumflex",
  "idieresis",
  "igrave",
  "ntilde",
  "oacute",
  "ocircumflex",
  "odieresis",
  "ograve",
  "otilde",
  "scaron",
  "uacute",
  "ucircumflex",
  "udieresis",
  "ugrave",
  "yacute",
  "ydieresis",
  "zcaron"
], mp = [
  ".notdef",
  "space",
  "exclamsmall",
  "Hungarumlautsmall",
  "dollaroldstyle",
  "dollarsuperior",
  "ampersandsmall",
  "Acutesmall",
  "parenleftsuperior",
  "parenrightsuperior",
  "twodotenleader",
  "onedotenleader",
  "comma",
  "hyphen",
  "period",
  "fraction",
  "zerooldstyle",
  "oneoldstyle",
  "twooldstyle",
  "threeoldstyle",
  "fouroldstyle",
  "fiveoldstyle",
  "sixoldstyle",
  "sevenoldstyle",
  "eightoldstyle",
  "nineoldstyle",
  "colon",
  "semicolon",
  "commasuperior",
  "threequartersemdash",
  "periodsuperior",
  "questionsmall",
  "asuperior",
  "bsuperior",
  "centsuperior",
  "dsuperior",
  "esuperior",
  "isuperior",
  "lsuperior",
  "msuperior",
  "nsuperior",
  "osuperior",
  "rsuperior",
  "ssuperior",
  "tsuperior",
  "ff",
  "fi",
  "fl",
  "ffi",
  "ffl",
  "parenleftinferior",
  "parenrightinferior",
  "Circumflexsmall",
  "hyphensuperior",
  "Gravesmall",
  "Asmall",
  "Bsmall",
  "Csmall",
  "Dsmall",
  "Esmall",
  "Fsmall",
  "Gsmall",
  "Hsmall",
  "Ismall",
  "Jsmall",
  "Ksmall",
  "Lsmall",
  "Msmall",
  "Nsmall",
  "Osmall",
  "Psmall",
  "Qsmall",
  "Rsmall",
  "Ssmall",
  "Tsmall",
  "Usmall",
  "Vsmall",
  "Wsmall",
  "Xsmall",
  "Ysmall",
  "Zsmall",
  "colonmonetary",
  "onefitted",
  "rupiah",
  "Tildesmall",
  "exclamdownsmall",
  "centoldstyle",
  "Lslashsmall",
  "Scaronsmall",
  "Zcaronsmall",
  "Dieresissmall",
  "Brevesmall",
  "Caronsmall",
  "Dotaccentsmall",
  "Macronsmall",
  "figuredash",
  "hypheninferior",
  "Ogoneksmall",
  "Ringsmall",
  "Cedillasmall",
  "onequarter",
  "onehalf",
  "threequarters",
  "questiondownsmall",
  "oneeighth",
  "threeeighths",
  "fiveeighths",
  "seveneighths",
  "onethird",
  "twothirds",
  "zerosuperior",
  "onesuperior",
  "twosuperior",
  "threesuperior",
  "foursuperior",
  "fivesuperior",
  "sixsuperior",
  "sevensuperior",
  "eightsuperior",
  "ninesuperior",
  "zeroinferior",
  "oneinferior",
  "twoinferior",
  "threeinferior",
  "fourinferior",
  "fiveinferior",
  "sixinferior",
  "seveninferior",
  "eightinferior",
  "nineinferior",
  "centinferior",
  "dollarinferior",
  "periodinferior",
  "commainferior",
  "Agravesmall",
  "Aacutesmall",
  "Acircumflexsmall",
  "Atildesmall",
  "Adieresissmall",
  "Aringsmall",
  "AEsmall",
  "Ccedillasmall",
  "Egravesmall",
  "Eacutesmall",
  "Ecircumflexsmall",
  "Edieresissmall",
  "Igravesmall",
  "Iacutesmall",
  "Icircumflexsmall",
  "Idieresissmall",
  "Ethsmall",
  "Ntildesmall",
  "Ogravesmall",
  "Oacutesmall",
  "Ocircumflexsmall",
  "Otildesmall",
  "Odieresissmall",
  "OEsmall",
  "Oslashsmall",
  "Ugravesmall",
  "Uacutesmall",
  "Ucircumflexsmall",
  "Udieresissmall",
  "Yacutesmall",
  "Thornsmall",
  "Ydieresissmall"
], yp = [
  ".notdef",
  "space",
  "dollaroldstyle",
  "dollarsuperior",
  "parenleftsuperior",
  "parenrightsuperior",
  "twodotenleader",
  "onedotenleader",
  "comma",
  "hyphen",
  "period",
  "fraction",
  "zerooldstyle",
  "oneoldstyle",
  "twooldstyle",
  "threeoldstyle",
  "fouroldstyle",
  "fiveoldstyle",
  "sixoldstyle",
  "sevenoldstyle",
  "eightoldstyle",
  "nineoldstyle",
  "colon",
  "semicolon",
  "commasuperior",
  "threequartersemdash",
  "periodsuperior",
  "asuperior",
  "bsuperior",
  "centsuperior",
  "dsuperior",
  "esuperior",
  "isuperior",
  "lsuperior",
  "msuperior",
  "nsuperior",
  "osuperior",
  "rsuperior",
  "ssuperior",
  "tsuperior",
  "ff",
  "fi",
  "fl",
  "ffi",
  "ffl",
  "parenleftinferior",
  "parenrightinferior",
  "hyphensuperior",
  "colonmonetary",
  "onefitted",
  "rupiah",
  "centoldstyle",
  "figuredash",
  "hypheninferior",
  "onequarter",
  "onehalf",
  "threequarters",
  "oneeighth",
  "threeeighths",
  "fiveeighths",
  "seveneighths",
  "onethird",
  "twothirds",
  "zerosuperior",
  "onesuperior",
  "twosuperior",
  "threesuperior",
  "foursuperior",
  "fivesuperior",
  "sixsuperior",
  "sevensuperior",
  "eightsuperior",
  "ninesuperior",
  "zeroinferior",
  "oneinferior",
  "twoinferior",
  "threeinferior",
  "fourinferior",
  "fiveinferior",
  "sixinferior",
  "seveninferior",
  "eightinferior",
  "nineinferior",
  "centinferior",
  "dollarinferior",
  "periodinferior",
  "commainferior"
], sa = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "space",
  "exclam",
  "quotedbl",
  "numbersign",
  "dollar",
  "percent",
  "ampersand",
  "quoteright",
  "parenleft",
  "parenright",
  "asterisk",
  "plus",
  "comma",
  "hyphen",
  "period",
  "slash",
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "colon",
  "semicolon",
  "less",
  "equal",
  "greater",
  "question",
  "at",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "bracketleft",
  "backslash",
  "bracketright",
  "asciicircum",
  "underscore",
  "quoteleft",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "braceleft",
  "bar",
  "braceright",
  "asciitilde",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "exclamdown",
  "cent",
  "sterling",
  "fraction",
  "yen",
  "florin",
  "section",
  "currency",
  "quotesingle",
  "quotedblleft",
  "guillemotleft",
  "guilsinglleft",
  "guilsinglright",
  "fi",
  "fl",
  "",
  "endash",
  "dagger",
  "daggerdbl",
  "periodcentered",
  "",
  "paragraph",
  "bullet",
  "quotesinglbase",
  "quotedblbase",
  "quotedblright",
  "guillemotright",
  "ellipsis",
  "perthousand",
  "",
  "questiondown",
  "",
  "grave",
  "acute",
  "circumflex",
  "tilde",
  "macron",
  "breve",
  "dotaccent",
  "dieresis",
  "",
  "ring",
  "cedilla",
  "",
  "hungarumlaut",
  "ogonek",
  "caron",
  "emdash",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "AE",
  "",
  "ordfeminine",
  "",
  "",
  "",
  "",
  "Lslash",
  "Oslash",
  "OE",
  "ordmasculine",
  "",
  "",
  "",
  "",
  "",
  "ae",
  "",
  "",
  "",
  "dotlessi",
  "",
  "",
  "lslash",
  "oslash",
  "oe",
  "germandbls"
], xp = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "space",
  "exclamsmall",
  "Hungarumlautsmall",
  "",
  "dollaroldstyle",
  "dollarsuperior",
  "ampersandsmall",
  "Acutesmall",
  "parenleftsuperior",
  "parenrightsuperior",
  "twodotenleader",
  "onedotenleader",
  "comma",
  "hyphen",
  "period",
  "fraction",
  "zerooldstyle",
  "oneoldstyle",
  "twooldstyle",
  "threeoldstyle",
  "fouroldstyle",
  "fiveoldstyle",
  "sixoldstyle",
  "sevenoldstyle",
  "eightoldstyle",
  "nineoldstyle",
  "colon",
  "semicolon",
  "commasuperior",
  "threequartersemdash",
  "periodsuperior",
  "questionsmall",
  "",
  "asuperior",
  "bsuperior",
  "centsuperior",
  "dsuperior",
  "esuperior",
  "",
  "",
  "isuperior",
  "",
  "",
  "lsuperior",
  "msuperior",
  "nsuperior",
  "osuperior",
  "",
  "",
  "rsuperior",
  "ssuperior",
  "tsuperior",
  "",
  "ff",
  "fi",
  "fl",
  "ffi",
  "ffl",
  "parenleftinferior",
  "",
  "parenrightinferior",
  "Circumflexsmall",
  "hyphensuperior",
  "Gravesmall",
  "Asmall",
  "Bsmall",
  "Csmall",
  "Dsmall",
  "Esmall",
  "Fsmall",
  "Gsmall",
  "Hsmall",
  "Ismall",
  "Jsmall",
  "Ksmall",
  "Lsmall",
  "Msmall",
  "Nsmall",
  "Osmall",
  "Psmall",
  "Qsmall",
  "Rsmall",
  "Ssmall",
  "Tsmall",
  "Usmall",
  "Vsmall",
  "Wsmall",
  "Xsmall",
  "Ysmall",
  "Zsmall",
  "colonmonetary",
  "onefitted",
  "rupiah",
  "Tildesmall",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "exclamdownsmall",
  "centoldstyle",
  "Lslashsmall",
  "",
  "",
  "Scaronsmall",
  "Zcaronsmall",
  "Dieresissmall",
  "Brevesmall",
  "Caronsmall",
  "",
  "Dotaccentsmall",
  "",
  "",
  "Macronsmall",
  "",
  "",
  "figuredash",
  "hypheninferior",
  "",
  "",
  "Ogoneksmall",
  "Ringsmall",
  "Cedillasmall",
  "",
  "",
  "",
  "onequarter",
  "onehalf",
  "threequarters",
  "questiondownsmall",
  "oneeighth",
  "threeeighths",
  "fiveeighths",
  "seveneighths",
  "onethird",
  "twothirds",
  "",
  "",
  "zerosuperior",
  "onesuperior",
  "twosuperior",
  "threesuperior",
  "foursuperior",
  "fivesuperior",
  "sixsuperior",
  "sevensuperior",
  "eightsuperior",
  "ninesuperior",
  "zeroinferior",
  "oneinferior",
  "twoinferior",
  "threeinferior",
  "fourinferior",
  "fiveinferior",
  "sixinferior",
  "seveninferior",
  "eightinferior",
  "nineinferior",
  "centinferior",
  "dollarinferior",
  "periodinferior",
  "commainferior",
  "Agravesmall",
  "Aacutesmall",
  "Acircumflexsmall",
  "Atildesmall",
  "Adieresissmall",
  "Aringsmall",
  "AEsmall",
  "Ccedillasmall",
  "Egravesmall",
  "Eacutesmall",
  "Ecircumflexsmall",
  "Edieresissmall",
  "Igravesmall",
  "Iacutesmall",
  "Icircumflexsmall",
  "Idieresissmall",
  "Ethsmall",
  "Ntildesmall",
  "Ogravesmall",
  "Oacutesmall",
  "Ocircumflexsmall",
  "Otildesmall",
  "Odieresissmall",
  "OEsmall",
  "Oslashsmall",
  "Ugravesmall",
  "Uacutesmall",
  "Ucircumflexsmall",
  "Udieresissmall",
  "Yacutesmall",
  "Thornsmall",
  "Ydieresissmall"
], on = [
  ".notdef",
  ".null",
  "nonmarkingreturn",
  "space",
  "exclam",
  "quotedbl",
  "numbersign",
  "dollar",
  "percent",
  "ampersand",
  "quotesingle",
  "parenleft",
  "parenright",
  "asterisk",
  "plus",
  "comma",
  "hyphen",
  "period",
  "slash",
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "colon",
  "semicolon",
  "less",
  "equal",
  "greater",
  "question",
  "at",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "bracketleft",
  "backslash",
  "bracketright",
  "asciicircum",
  "underscore",
  "grave",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "braceleft",
  "bar",
  "braceright",
  "asciitilde",
  "Adieresis",
  "Aring",
  "Ccedilla",
  "Eacute",
  "Ntilde",
  "Odieresis",
  "Udieresis",
  "aacute",
  "agrave",
  "acircumflex",
  "adieresis",
  "atilde",
  "aring",
  "ccedilla",
  "eacute",
  "egrave",
  "ecircumflex",
  "edieresis",
  "iacute",
  "igrave",
  "icircumflex",
  "idieresis",
  "ntilde",
  "oacute",
  "ograve",
  "ocircumflex",
  "odieresis",
  "otilde",
  "uacute",
  "ugrave",
  "ucircumflex",
  "udieresis",
  "dagger",
  "degree",
  "cent",
  "sterling",
  "section",
  "bullet",
  "paragraph",
  "germandbls",
  "registered",
  "copyright",
  "trademark",
  "acute",
  "dieresis",
  "notequal",
  "AE",
  "Oslash",
  "infinity",
  "plusminus",
  "lessequal",
  "greaterequal",
  "yen",
  "mu",
  "partialdiff",
  "summation",
  "product",
  "pi",
  "integral",
  "ordfeminine",
  "ordmasculine",
  "Omega",
  "ae",
  "oslash",
  "questiondown",
  "exclamdown",
  "logicalnot",
  "radical",
  "florin",
  "approxequal",
  "Delta",
  "guillemotleft",
  "guillemotright",
  "ellipsis",
  "nonbreakingspace",
  "Agrave",
  "Atilde",
  "Otilde",
  "OE",
  "oe",
  "endash",
  "emdash",
  "quotedblleft",
  "quotedblright",
  "quoteleft",
  "quoteright",
  "divide",
  "lozenge",
  "ydieresis",
  "Ydieresis",
  "fraction",
  "currency",
  "guilsinglleft",
  "guilsinglright",
  "fi",
  "fl",
  "daggerdbl",
  "periodcentered",
  "quotesinglbase",
  "quotedblbase",
  "perthousand",
  "Acircumflex",
  "Ecircumflex",
  "Aacute",
  "Edieresis",
  "Egrave",
  "Iacute",
  "Icircumflex",
  "Idieresis",
  "Igrave",
  "Oacute",
  "Ocircumflex",
  "apple",
  "Ograve",
  "Uacute",
  "Ucircumflex",
  "Ugrave",
  "dotlessi",
  "circumflex",
  "tilde",
  "macron",
  "breve",
  "dotaccent",
  "ring",
  "cedilla",
  "hungarumlaut",
  "ogonek",
  "caron",
  "Lslash",
  "lslash",
  "Scaron",
  "scaron",
  "Zcaron",
  "zcaron",
  "brokenbar",
  "Eth",
  "eth",
  "Yacute",
  "yacute",
  "Thorn",
  "thorn",
  "minus",
  "multiply",
  "onesuperior",
  "twosuperior",
  "threesuperior",
  "onehalf",
  "onequarter",
  "threequarters",
  "franc",
  "Gbreve",
  "gbreve",
  "Idotaccent",
  "Scedilla",
  "scedilla",
  "Cacute",
  "cacute",
  "Ccaron",
  "ccaron",
  "dcroat"
];
function Xh(n) {
  this.font = n;
}
Xh.prototype.charToGlyphIndex = function(n) {
  const t = n.codePointAt(0), e = this.font.glyphs;
  if (e)
    for (let s = 0; s < e.length; s += 1) {
      const i = e.get(s);
      for (let r = 0; r < i.unicodes.length; r += 1)
        if (i.unicodes[r] === t)
          return s;
    }
  return null;
};
function Yh(n) {
  this.cmap = n;
}
Yh.prototype.charToGlyphIndex = function(n) {
  return this.cmap.glyphIndexMap[n.codePointAt(0)] || 0;
};
function $h(n, t) {
  this.encoding = n, this.charset = t;
}
$h.prototype.charToGlyphIndex = function(n) {
  const t = n.codePointAt(0), e = this.encoding[t];
  return this.charset.indexOf(e);
};
function xa(n) {
  switch (n.version) {
    case 1:
      this.names = on.slice();
      break;
    case 2:
      this.names = new Array(n.numberOfGlyphs);
      for (let t = 0; t < n.numberOfGlyphs; t++)
        n.glyphNameIndex[t] < on.length ? this.names[t] = on[n.glyphNameIndex[t]] : this.names[t] = n.names[n.glyphNameIndex[t] - on.length];
      break;
    case 2.5:
      this.names = new Array(n.numberOfGlyphs);
      for (let t = 0; t < n.numberOfGlyphs; t++)
        this.names[t] = on[t + n.glyphNameIndex[t]];
      break;
    case 3:
      this.names = [];
      break;
    default:
      this.names = [];
      break;
  }
}
xa.prototype.nameToGlyphIndex = function(n) {
  return this.names.indexOf(n);
};
xa.prototype.glyphIndexToName = function(n) {
  return this.names[n];
};
function bp(n) {
  let t;
  const e = n.tables.cmap.glyphIndexMap, s = Object.keys(e);
  for (let i = 0; i < s.length; i += 1) {
    const r = s[i], a = e[r];
    t = n.glyphs.get(a), t.addUnicode(parseInt(r));
  }
  for (let i = 0; i < n.glyphs.length; i += 1)
    t = n.glyphs.get(i), n.cffEncoding ? t.name = n.cffEncoding.charset[i] : n.glyphNames.names && (t.name = n.glyphNames.glyphIndexToName(i));
}
function vp(n) {
  n._IndexToUnicodeMap = {};
  const t = n.tables.cmap.glyphIndexMap, e = Object.keys(t);
  for (let s = 0; s < e.length; s += 1) {
    const i = e[s];
    let r = t[i];
    n._IndexToUnicodeMap[r] === void 0 ? n._IndexToUnicodeMap[r] = {
      unicodes: [parseInt(i)]
    } : n._IndexToUnicodeMap[r].unicodes.push(parseInt(i));
  }
}
function Sp(n, t) {
  t.lowMemory ? vp(n) : bp(n);
}
function wp(n, t, e, s, i) {
  n.beginPath(), n.moveTo(t, e), n.lineTo(s, i), n.stroke();
}
var rn = { line: wp };
function Cp(n, t) {
  const e = new A(n, t), s = e.parseShort();
  s !== 0 && console.warn("Only CPALv0 is currently fully supported.");
  const i = e.parseShort(), r = e.parseShort(), a = e.parseShort(), o = e.parseOffset32(), c = e.parseUShortList(r);
  e.relativeOffset = o;
  const h = e.parseULongList(a);
  return e.relativeOffset = o, {
    version: s,
    numPaletteEntries: i,
    colorRecords: h,
    colorRecordIndices: c
  };
}
function Tp({ version: n = 0, numPaletteEntries: t = 0, colorRecords: e = [], colorRecordIndices: s = [0] }) {
  return V.argument(n === 0, "Only CPALv0 are supported."), V.argument(e.length, "No colorRecords given."), V.argument(s.length, "No colorRecordIndices given."), s.length > 1 && V.argument(t, "Can't infer numPaletteEntries on multiple colorRecordIndices"), new L.Table("CPAL", [
    { name: "version", type: "USHORT", value: n },
    { name: "numPaletteEntries", type: "USHORT", value: t || e.length },
    { name: "numPalettes", type: "USHORT", value: s.length },
    { name: "numColorRecords", type: "USHORT", value: e.length },
    { name: "colorRecordsArrayOffset", type: "ULONG", value: 12 + 2 * s.length },
    ...s.map((i, r) => ({ name: "colorRecordIndices_" + r, type: "USHORT", value: i })),
    ...e.map((i, r) => ({ name: "colorRecords_" + r, type: "ULONG", value: i }))
  ]);
}
function Zh(n) {
  var t = (n & 4278190080) >> 24, e = (n & 16711680) >> 16, s = (n & 65280) >> 8, i = n & 255;
  return t = t + 256 & 255, e = e + 256 & 255, s = s + 256 & 255, i = (i + 256 & 255) / 255, { b: t, g: e, r: s, a: i };
}
function ba(n, t, e = 0, s = "hexa") {
  if (t == 65535)
    return "currentColor";
  const i = n && n.tables && n.tables.cpal;
  if (!i) return "currentColor";
  if (e > i.colorRecordIndices.length - 1)
    throw new Error(`Palette index out of range (colorRecordIndices.length: ${i.colorRecordIndices.length}, index: ${t})`);
  if (t > i.numPaletteEntries)
    throw new Error(`Color index out of range (numPaletteEntries: ${i.numPaletteEntries}, index: ${t})`);
  const r = i.colorRecordIndices[e] + t;
  if (r > i.colorRecords)
    throw new Error(`Color index out of range (colorRecords.length: ${i.colorRecords.length}, lookupIndex: ${r})`);
  const a = Zh(i.colorRecords[r]);
  return s === "bgra" ? a : qn(a, s);
}
function re(n) {
  return ("0" + parseInt(n).toString(16)).slice(-2);
}
function Fp(n) {
  const t = n.r / 255, e = n.g / 255, s = n.b / 255, i = Math.max(t, e, s), r = Math.min(t, e, s);
  let a, o, c = (i + r) / 2;
  if (i === r)
    a = o = 0;
  else {
    const h = i - r;
    switch (o = c > 0.5 ? h / (2 - i - r) : h / (i + r), i) {
      case t:
        a = (e - s) / h + (e < s ? 6 : 0);
        break;
      case e:
        a = (s - t) / h + 2;
        break;
      case s:
        a = (t - e) / h + 4;
        break;
    }
    a /= 6;
  }
  return {
    h: a * 360,
    s: o * 100,
    l: c * 100
  };
}
function Ap(n) {
  let { h: t, s: e, l: s, a: i } = n;
  t = t % 360, e /= 100, s /= 100;
  const r = (1 - Math.abs(2 * s - 1)) * e, a = r * (1 - Math.abs(t / 60 % 2 - 1)), o = s - r / 2;
  let c = 0, h = 0, l = 0;
  return 0 <= t && t < 60 ? (c = r, h = a, l = 0) : 60 <= t && t < 120 ? (c = a, h = r, l = 0) : 120 <= t && t < 180 ? (c = 0, h = r, l = a) : 180 <= t && t < 240 ? (c = 0, h = a, l = r) : 240 <= t && t < 300 ? (c = a, h = 0, l = r) : 300 <= t && t <= 360 && (c = r, h = 0, l = a), {
    r: Math.round((c + o) * 255),
    g: Math.round((h + o) * 255),
    b: Math.round((l + o) * 255),
    a: i
  };
}
function Jh(n) {
  return parseInt(`0x${re(n.b)}${re(n.g)}${re(n.r)}${re(n.a * 255)}`, 16);
}
function ki(n, t = "hexa") {
  const e = t == "raw" || t == "cpal", s = Number.isInteger(n);
  let i = !0;
  if (s && e || n === "currentColor")
    return n;
  if (typeof n == "object") {
    if (t == "bgra")
      return n;
    if (e)
      return Jh(n);
  } else if (!s && /^#([a-f0-9]{3}|[a-f0-9]{4}|[a-f0-9]{6}|[a-f0-9]{8})$/i.test(n.trim())) {
    switch (n = n.trim().substring(1), n.length) {
      case 3:
        n = {
          r: parseInt(n[0].repeat(2), 16),
          g: parseInt(n[1].repeat(2), 16),
          b: parseInt(n[2].repeat(2), 16),
          a: 1
        };
        break;
      case 4:
        n = {
          r: parseInt(n[0].repeat(2), 16),
          g: parseInt(n[1].repeat(2), 16),
          b: parseInt(n[2].repeat(2), 16),
          a: parseInt(n[3].repeat(2), 16) / 255
        };
        break;
      case 6:
        n = {
          r: parseInt(n[0] + n[1], 16),
          g: parseInt(n[2] + n[3], 16),
          b: parseInt(n[4] + n[5], 16),
          a: 1
        };
        break;
      case 8:
        n = {
          r: parseInt(n[0] + n[1], 16),
          g: parseInt(n[2] + n[3], 16),
          b: parseInt(n[4] + n[5], 16),
          a: parseInt(n[6] + n[7], 16) / 255
        };
        break;
    }
    if (t == "bgra")
      return n;
  } else if (typeof document < "u" && /^[a-z]+$/i.test(n)) {
    const r = document.createElement("canvas").getContext("2d");
    r.fillStyle = n;
    const a = qn(r.fillStyle, "hexa");
    a === "#000000ff" && n.toLowerCase() !== "black" ? i = !1 : n = a;
  } else {
    n = n.trim();
    const r = /rgba?\(\s*(?:(\d*\.\d+)(%?)|(\d+)(%?))\s*(?:,|\s*)\s*(?:(\d*\.\d+)(%?)|(\d+)(%?))\s*(?:,|\s*)\s*(?:(\d*\.\d+)(%?)|(\d+)(%?))\s*(?:(?:,|\s|\/)\s*(?:(0*(?:\.\d+)?()|0*1(?:\.0+)?())|(?:\.\d+)|(\d+)(%)|(\d*\.\d+)(%)))?\s*\)/;
    if (r.test(n)) {
      const a = n.match(r).filter((o) => typeof o < "u");
      n = {
        r: Math.round(parseFloat(a[1]) / (a[2] ? 100 / 255 : 1)),
        g: Math.round(parseFloat(a[3]) / (a[4] ? 100 / 255 : 1)),
        b: Math.round(parseFloat(a[5]) / (a[6] ? 100 / 255 : 1)),
        a: a[7] ? parseFloat(a[7]) / (a[8] ? 100 : 1) : 1
      };
    } else {
      const a = /hsla?\(\s*(?:(\d*\.\d+|\d+)(deg|turn|))\s*(?:,|\s*)\s*(?:(\d*\.\d+)%?|(\d+)%?)\s*(?:,|\s*)\s*(?:(\d*\.\d+)%?|(\d+)%?)\s*(?:(?:,|\s|\/)\s*(?:(0*(?:\.\d+)?()|0*1(?:\.0+)?())|(?:\.\d+)|(\d+)(%)|(\d*\.\d+)(%)))?\s*\)/;
      if (a.test(n)) {
        const o = n.match(a).filter((c) => typeof c < "u");
        n = Ap({
          h: parseFloat(o[1]) * (o[2] === "turn" ? 360 : 1),
          s: parseFloat(o[3]),
          l: parseFloat(o[4]),
          a: o[5] ? parseFloat(o[5]) / (o[6] ? 100 : 1) : 1
        });
      } else
        i = !1;
    }
  }
  if (!i)
    throw new Error(`Invalid color format: ${n}`);
  return qn(n, t);
}
function qn(n, t = "hexa") {
  if (n === "currentColor") return n;
  if (Number.isInteger(n)) {
    if (t == "raw" || t == "cpal")
      return n;
    n = Zh(n);
  } else typeof n != "object" && (n = ki(n, "bgra"));
  let e = ["hsl", "hsla"].includes(t) ? Fp(n) : null;
  switch (t) {
    case "rgba":
      return `rgba(${n.r}, ${n.g}, ${n.b}, ${parseFloat(n.a.toFixed(3))})`;
    case "rgb":
      return `rgb(${n.r}, ${n.g}, ${n.b})`;
    case "hex":
    case "hex6":
    case "hex-6":
      return `#${re(n.r)}${re(n.g)}${re(n.b)}`;
    case "hexa":
    case "hex8":
    case "hex-8":
      return `#${re(n.r)}${re(n.g)}${re(n.b)}${re(n.a * 255)}`;
    case "hsl":
      return `hsl(${e.h.toFixed(2)}, ${e.s.toFixed(2)}%, ${e.l.toFixed(2)}%)`;
    case "hsla":
      return `hsla(${e.h.toFixed(2)}, ${e.s.toFixed(2)}%, ${e.l.toFixed(2)}%, ${parseFloat(n.a.toFixed(3))})`;
    case "bgra":
      return n;
    case "raw":
    case "cpal":
      return Jh(n);
    default:
      throw new Error("Unknown color format: " + t);
  }
}
var Kh = { parse: Cp, make: Tp, getPaletteColor: ba, parseColor: ki, formatColor: qn };
function kp(n, t) {
  let e = t || new Hn();
  return {
    configurable: !0,
    get: function() {
      return typeof e == "function" && (e = e()), e;
    },
    set: function(s) {
      e = s;
    }
  };
}
function It(n) {
  this.bindConstructorValues(n);
}
It.prototype.bindConstructorValues = function(n) {
  if (this.index = n.index || 0, n.name === ".notdef" ? n.unicode = void 0 : n.name === ".null" && (n.unicode = 0), n.unicode === 0 && n.name !== ".null")
    throw new Error('The unicode value "0" is reserved for the glyph name ".null" and cannot be used by any other glyph.');
  this.name = n.name || null, this.unicode = n.unicode, this.unicodes = n.unicodes || (n.unicode !== void 0 ? [n.unicode] : []), "xMin" in n && (this.xMin = n.xMin), "yMin" in n && (this.yMin = n.yMin), "xMax" in n && (this.xMax = n.xMax), "yMax" in n && (this.yMax = n.yMax), "advanceWidth" in n && (this.advanceWidth = n.advanceWidth), "leftSideBearing" in n && (this.leftSideBearing = n.leftSideBearing), "points" in n && (this.points = n.points), Object.defineProperty(this, "path", kp(this, n.path));
};
It.prototype.addUnicode = function(n) {
  this.unicodes.length === 0 && (this.unicode = n), this.unicodes.push(n);
};
It.prototype.getBoundingBox = function() {
  return this.path.getBoundingBox();
};
It.prototype.getPath = function(n, t, e, s, i) {
  n = n !== void 0 ? n : 0, t = t !== void 0 ? t : 0, e = e !== void 0 ? e : 72, s = Object.assign({}, i && i.defaultRenderOptions, s);
  let r, a, o = s.xScale, c = s.yScale;
  const h = 1 / (this.path.unitsPerEm || 1e3) * e;
  let l = this;
  i && i.variation && (l = i.variation.getTransform(this, s.variation), r = l.path.commands), s.hinting && i && i.hinting && (a = l.path && i.hinting.exec(l, e, s)), a ? (r = i.hinting.getCommands(a), n = Math.round(n), t = Math.round(t), o = c = 1) : (r = l.path.commands, o === void 0 && (o = h), c === void 0 && (c = h));
  const u = new Hn();
  if (s.drawSVG) {
    const f = this.getSvgImage(i);
    if (f) {
      const p = new Hn();
      return p._image = {
        image: f.image,
        x: n + f.leftSideBearing * h,
        y: t - f.baseline * h,
        width: f.image.width * h,
        height: f.image.height * h
      }, u._layers = [p], u;
    }
  }
  if (s.drawLayers) {
    const f = this.getLayers(i);
    if (f && f.length) {
      u._layers = [];
      for (let p = 0; p < f.length; p += 1) {
        const d = f[p];
        let g = ba(i, d.paletteIndex, s.usePalette);
        g === "currentColor" ? g = s.fill || "black" : g = qn(g, s.colorFormat || "rgba"), s = Object.assign({}, s, { fill: g }), u._layers.push(this.getPath.call(d.glyph, n, t, e, s, i));
      }
      return u;
    }
  }
  u.fill = s.fill || this.path.fill, u.stroke = this.path.stroke, u.strokeWidth = this.path.strokeWidth * h;
  for (let f = 0; f < r.length; f += 1) {
    const p = r[f];
    p.type === "M" ? u.moveTo(n + p.x * o, t + -p.y * c) : p.type === "L" ? u.lineTo(n + p.x * o, t + -p.y * c) : p.type === "Q" ? u.quadraticCurveTo(
      n + p.x1 * o,
      t + -p.y1 * c,
      n + p.x * o,
      t + -p.y * c
    ) : p.type === "C" ? u.curveTo(
      n + p.x1 * o,
      t + -p.y1 * c,
      n + p.x2 * o,
      t + -p.y2 * c,
      n + p.x * o,
      t + -p.y * c
    ) : p.type === "Z" && u.stroke && u.strokeWidth && u.closePath();
  }
  return u;
};
It.prototype.getLayers = function(n) {
  if (!n)
    throw new Error("The font object is required to read the colr/cpal tables in order to get the layers.");
  return n.layers.get(this.index);
};
It.prototype.getSvgImage = function(n) {
  if (!n)
    throw new Error("The font object is required to read the svg table in order to get the image.");
  return n.svgImages.get(this.index);
};
It.prototype.getContours = function(n = null) {
  if (this.points === void 0 && !n)
    return [];
  const t = [];
  let e = [], s = n || this.points;
  for (let i = 0; i < s.length; i += 1) {
    const r = s[i];
    e.push(r), r.lastPointOfContour && (t.push(e), e = []);
  }
  return V.argument(e.length === 0, "There are still points left in the current contour."), t;
};
It.prototype.getMetrics = function() {
  const n = this.path.commands, t = [], e = [];
  for (let i = 0; i < n.length; i += 1) {
    const r = n[i];
    r.type !== "Z" && (t.push(r.x), e.push(r.y)), (r.type === "Q" || r.type === "C") && (t.push(r.x1), e.push(r.y1)), r.type === "C" && (t.push(r.x2), e.push(r.y2));
  }
  const s = {
    xMin: Math.min.apply(null, t),
    yMin: Math.min.apply(null, e),
    xMax: Math.max.apply(null, t),
    yMax: Math.max.apply(null, e),
    leftSideBearing: this.leftSideBearing
  };
  return isFinite(s.xMin) || (s.xMin = 0), isFinite(s.xMax) || (s.xMax = this.advanceWidth), isFinite(s.yMin) || (s.yMin = 0), isFinite(s.yMax) || (s.yMax = 0), s.rightSideBearing = this.advanceWidth - s.leftSideBearing - (s.xMax - s.xMin), s;
};
It.prototype.draw = function(n, t, e, s, i, r) {
  i = Object.assign({}, r && r.defaultRenderOptions, i), this.getPath(t, e, s, i, r).draw(n);
};
It.prototype.drawPoints = function(n, t, e, s, i, r) {
  if (i = Object.assign({}, r && r.defaultRenderOptions, i), i.drawLayers) {
    const f = this.getLayers(r);
    if (f && f.length) {
      for (let p = 0; p < f.length; p += 1)
        f[p].glyph.index !== this.index && this.drawPoints.call(f[p].glyph, n, t, e, s);
      return;
    }
  }
  function a(f, p, d, g) {
    n.beginPath();
    for (let x = 0; x < f.length; x += 1)
      n.moveTo(p + f[x].x * g, d + f[x].y * g), n.arc(p + f[x].x * g, d + f[x].y * g, 2, 0, Math.PI * 2, !1);
    n.fill();
  }
  t = t !== void 0 ? t : 0, e = e !== void 0 ? e : 0, s = s !== void 0 ? s : 24;
  const o = 1 / this.path.unitsPerEm * s, c = [], h = [];
  let u = this.path.commands;
  r && r.variation && (u = r.variation.getTransform(this, i.variation).path.commands);
  for (let f = 0; f < u.length; f += 1) {
    const p = u[f];
    p.x !== void 0 && c.push({ x: p.x, y: -p.y }), p.x1 !== void 0 && h.push({ x: p.x1, y: -p.y1 }), p.x2 !== void 0 && h.push({ x: p.x2, y: -p.y2 });
  }
  n.fillStyle = "blue", a(c, t, e, o), n.fillStyle = "red", a(h, t, e, o);
};
It.prototype.drawMetrics = function(n, t, e, s) {
  let i;
  t = t !== void 0 ? t : 0, e = e !== void 0 ? e : 0, s = s !== void 0 ? s : 24, i = 1 / this.path.unitsPerEm * s, n.lineWidth = 1, n.strokeStyle = "black", rn.line(n, t, -1e4, t, 1e4), rn.line(n, -1e4, e, 1e4, e);
  const r = this.xMin || 0;
  let a = this.yMin || 0;
  const o = this.xMax || 0;
  let c = this.yMax || 0;
  const h = this.advanceWidth || 0;
  n.strokeStyle = "blue", rn.line(n, t + r * i, -1e4, t + r * i, 1e4), rn.line(n, t + o * i, -1e4, t + o * i, 1e4), rn.line(n, -1e4, e + -a * i, 1e4, e + -a * i), rn.line(n, -1e4, e + -c * i, 1e4, e + -c * i), n.strokeStyle = "green", rn.line(n, t + h * i, -1e4, t + h * i, 1e4);
};
It.prototype.toPathData = function(n, t) {
  n = Object.assign({}, { variation: t && t.defaultRenderOptions.variation }, n);
  let e = this;
  t && t.variation && (e = t.variation.getTransform(this, n.variation));
  let s = e.points && n.pointsTransform ? n.pointsTransform(e.points) : e.path;
  return n.pathTransform && (s = n.pathTransform(s)), s.toPathData(n);
};
It.prototype.fromSVG = function(n, t = {}) {
  return this.path.fromSVG(n, t);
};
It.prototype.toSVG = function(n, t) {
  const e = this.toPathData.apply(this, [n, t]);
  return this.path.toSVG(n, e);
};
It.prototype.toDOMElement = function(n, t) {
  n = Object.assign({}, { variation: t && t.defaultRenderOptions.variation }, n);
  let e = this.path;
  return t && t.variation && (e = t.variation.getTransform(this, n.variation).path), e.toDOMElement(n);
};
var ms = It;
function On(n, t, e) {
  Object.defineProperty(n, t, {
    get: function() {
      return typeof n[e] > "u" && n.path, n[e];
    },
    set: function(s) {
      n[e] = s;
    },
    enumerable: !0,
    configurable: !0
  });
}
function Ri(n, t) {
  if (this.font = n, this.glyphs = {}, Array.isArray(t))
    for (let e = 0; e < t.length; e++) {
      const s = t[e];
      s.path.unitsPerEm = n.unitsPerEm, this.glyphs[e] = s;
    }
  this.length = t && t.length || 0;
}
typeof Symbol < "u" && Symbol.iterator && (Ri.prototype[Symbol.iterator] = function() {
  let n = -1;
  return {
    next: (function() {
      n++;
      const t = n >= this.length - 1;
      return { value: this.get(n), done: t };
    }).bind(this)
  };
});
Ri.prototype.get = function(n) {
  if (this.font._push && this.glyphs[n] === void 0) {
    this.font._push(n), typeof this.glyphs[n] == "function" && (this.glyphs[n] = this.glyphs[n]());
    let t = this.glyphs[n], e = this.font._IndexToUnicodeMap[n];
    if (e)
      for (let s = 0; s < e.unicodes.length; s++)
        t.addUnicode(e.unicodes[s]);
    this.font.cffEncoding ? t.name = this.font.cffEncoding.charset[n] : this.font.glyphNames.names && (t.name = this.font.glyphNames.glyphIndexToName(n)), this.glyphs[n].advanceWidth = this.font._hmtxTableData[n].advanceWidth, this.glyphs[n].leftSideBearing = this.font._hmtxTableData[n].leftSideBearing;
  } else
    typeof this.glyphs[n] == "function" && (this.glyphs[n] = this.glyphs[n]());
  return this.glyphs[n];
};
Ri.prototype.push = function(n, t) {
  this.glyphs[n] = t, this.length++;
};
function Ep(n, t) {
  return new ms({ index: t, font: n });
}
function Mp(n, t, e, s, i, r) {
  return function() {
    const a = new ms({ index: t, font: n });
    return a.path = function() {
      e(a, s, i);
      const o = r(n.glyphs, a);
      return o.unitsPerEm = n.unitsPerEm, o;
    }, On(a, "numberOfContours", "_numberOfContours"), On(a, "xMin", "_xMin"), On(a, "xMax", "_xMax"), On(a, "yMin", "_yMin"), On(a, "yMax", "_yMax"), On(a, "points", "_points"), a;
  };
}
function Op(n, t, e, s, i) {
  return function() {
    const r = new ms({ index: t, font: n });
    return r.path = function() {
      const a = e(n, r, s, i);
      return a.unitsPerEm = n.unitsPerEm, a;
    }, r;
  };
}
var be = { GlyphSet: Ri, glyphLoader: Ep, ttfGlyphLoader: Mp, cffGlyphLoader: Op };
function Qh(n, t) {
  if (n === t)
    return !0;
  if (Array.isArray(n) && Array.isArray(t)) {
    if (n.length !== t.length)
      return !1;
    for (let e = 0; e < n.length; e += 1)
      if (!Qh(n[e], t[e]))
        return !1;
    return !0;
  } else
    return !1;
}
var Ho = 10;
function Ei(n) {
  let t;
  return n.length < 1240 ? t = 107 : n.length < 33900 ? t = 1131 : t = 32768, t;
}
function de(n, t, e, s) {
  const i = [], r = [], a = s > 1 ? z.getULong(n, t) : z.getCard16(n, t), o = s > 1 ? 4 : 2;
  let c, h;
  if (a !== 0) {
    const l = z.getByte(n, t + o);
    c = t + (a + 1) * l + o;
    let u = t + o + 1;
    for (let f = 0; f < a + 1; f += 1)
      i.push(z.getOffset(n, u, l)), u += l;
    h = c + i[a];
  } else
    h = t + o;
  for (let l = 0; l < i.length - 1; l += 1) {
    let u = z.getBytes(n, c + i[l], c + i[l + 1]);
    e && (u = e(u, n, t, s)), r.push(u);
  }
  return { objects: r, startOffset: t, endOffset: h };
}
function _p(n, t, e) {
  const s = [], i = e > 1 ? z.getULong(n, t) : z.getCard16(n, t), r = e > 1 ? 4 : 2;
  let a, o;
  if (i !== 0) {
    const c = z.getByte(n, t + r);
    a = t + (i + 1) * c + r;
    let h = t + r + 1;
    for (let l = 0; l < i + 1; l += 1)
      s.push(z.getOffset(n, h, c)), h += c;
    o = a + s[i];
  } else
    o = t + r;
  return { offsets: s, startOffset: t, endOffset: o };
}
function Lp(n, t, e, s, i, r) {
  const a = r > 1 ? z.getULong(e, s) : z.getCard16(e, s), o = r > 1 ? 4 : 2;
  let c = 0;
  if (a !== 0) {
    const l = z.getByte(e, s + o);
    c = s + (a + 1) * l + o;
  }
  return z.getBytes(e, c + t[n], c + t[n + 1]);
}
function Ip(n) {
  let t = "";
  const s = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "E", "E-", null, "-"];
  for (; ; ) {
    const i = n.parseByte(), r = i >> 4, a = i & 15;
    if (r === 15 || (t += s[r], a === 15))
      break;
    t += s[a];
  }
  return parseFloat(t);
}
function Bp(n, t) {
  let e, s, i, r;
  if (t === 28)
    return e = n.parseByte(), s = n.parseByte(), e << 8 | s;
  if (t === 29)
    return e = n.parseByte(), s = n.parseByte(), i = n.parseByte(), r = n.parseByte(), e << 24 | s << 16 | i << 8 | r;
  if (t === 30)
    return Ip(n);
  if (t >= 32 && t <= 246)
    return t - 139;
  if (t >= 247 && t <= 250)
    return e = n.parseByte(), (t - 247) * 256 + e + 108;
  if (t >= 251 && t <= 254)
    return e = n.parseByte(), -(t - 251) * 256 - e - 108;
  throw new Error("Invalid b0 " + t);
}
function Rp(n) {
  const t = {};
  for (let e = 0; e < n.length; e += 1) {
    const s = n[e][0], i = n[e][1];
    let r;
    if (i.length === 1 ? r = i[0] : r = i, Object.prototype.hasOwnProperty.call(t, s) && !isNaN(t[s]))
      throw new Error("Object " + t + " already has key " + s);
    t[s] = r;
  }
  return t;
}
function va(n, t, e, s) {
  t = t !== void 0 ? t : 0;
  const i = new z.Parser(n, t), r = [];
  let a = [];
  e = e !== void 0 ? e : n.byteLength;
  let o = s < 2 ? 22 : 28;
  for (; i.relativeOffset < e; ) {
    let c = i.parseByte();
    if (c < o) {
      if (c === 12 && (c = 1200 + i.parseByte()), s > 1 && c === 23) {
        qp(a);
        continue;
      }
      r.push([c, a]), a = [];
    } else
      a.push(Bp(i, c));
  }
  return Rp(r);
}
function hs(n, t) {
  return t <= 390 ? t = oi[t] : n ? t = n[t - 391] : t = void 0, t;
}
function Sa(n, t, e) {
  const s = {};
  let i;
  for (let r = 0; r < t.length; r += 1) {
    const a = t[r];
    if (Array.isArray(a.type)) {
      const o = [];
      o.length = a.type.length;
      for (let c = 0; c < a.type.length; c++)
        i = n[a.op] !== void 0 ? n[a.op][c] : void 0, i === void 0 && (i = a.value !== void 0 && a.value[c] !== void 0 ? a.value[c] : null), a.type[c] === "SID" && (i = hs(e, i)), o[c] = i;
      s[a.name] = o;
    } else
      i = n[a.op], i === void 0 && (i = a.value !== void 0 ? a.value : null), a.type === "SID" && (i = hs(e, i)), s[a.name] = i;
  }
  return s;
}
function Dp(n, t) {
  const e = {};
  if (e.formatMajor = z.getCard8(n, t), e.formatMinor = z.getCard8(n, t + 1), e.formatMajor > 2)
    throw new Error(`Unsupported CFF table version ${e.formatMajor}.${e.formatMinor}`);
  return e.size = z.getCard8(n, t + 2), e.formatMajor < 2 ? (e.offsetSize = z.getCard8(n, t + 3), e.startOffset = t, e.endOffset = t + 4) : (e.topDictLength = z.getCard16(n, t + 3), e.endOffset = t + 8), e;
}
var tl = [
  { name: "version", op: 0, type: "SID" },
  { name: "notice", op: 1, type: "SID" },
  { name: "copyright", op: 1200, type: "SID" },
  { name: "fullName", op: 2, type: "SID" },
  { name: "familyName", op: 3, type: "SID" },
  { name: "weight", op: 4, type: "SID" },
  { name: "isFixedPitch", op: 1201, type: "number", value: 0 },
  { name: "italicAngle", op: 1202, type: "number", value: 0 },
  { name: "underlinePosition", op: 1203, type: "number", value: -100 },
  { name: "underlineThickness", op: 1204, type: "number", value: 50 },
  { name: "paintType", op: 1205, type: "number", value: 0 },
  { name: "charstringType", op: 1206, type: "number", value: 2 },
  {
    name: "fontMatrix",
    op: 1207,
    type: ["real", "real", "real", "real", "real", "real"],
    value: [1e-3, 0, 0, 1e-3, 0, 0]
  },
  { name: "uniqueId", op: 13, type: "number" },
  { name: "fontBBox", op: 5, type: ["number", "number", "number", "number"], value: [0, 0, 0, 0] },
  { name: "strokeWidth", op: 1208, type: "number", value: 0 },
  { name: "xuid", op: 14, type: [], value: null },
  { name: "charset", op: 15, type: "offset", value: 0 },
  { name: "encoding", op: 16, type: "offset", value: 0 },
  { name: "charStrings", op: 17, type: "offset", value: 0 },
  { name: "private", op: 18, type: ["number", "offset"], value: [0, 0] },
  { name: "ros", op: 1230, type: ["SID", "SID", "number"] },
  { name: "cidFontVersion", op: 1231, type: "number", value: 0 },
  { name: "cidFontRevision", op: 1232, type: "number", value: 0 },
  { name: "cidFontType", op: 1233, type: "number", value: 0 },
  { name: "cidCount", op: 1234, type: "number", value: 8720 },
  { name: "uidBase", op: 1235, type: "number" },
  { name: "fdArray", op: 1236, type: "offset" },
  { name: "fdSelect", op: 1237, type: "offset" },
  { name: "fontName", op: 1238, type: "SID" }
], Up = [
  {
    name: "fontMatrix",
    op: 1207,
    type: ["real", "real", "real", "real", "real", "real"],
    value: [1e-3, 0, 0, 1e-3, 0, 0]
  },
  { name: "charStrings", op: 17, type: "offset" },
  { name: "fdArray", op: 1236, type: "offset" },
  { name: "fdSelect", op: 1237, type: "offset" },
  { name: "vstore", op: 24, type: "offset" }
], el = [
  { name: "subrs", op: 19, type: "offset", value: 0 },
  { name: "defaultWidthX", op: 20, type: "number", value: 0 },
  { name: "nominalWidthX", op: 21, type: "number", value: 0 }
], Pp = [
  { name: "blueValues", op: 6, type: "delta" },
  { name: "otherBlues", op: 7, type: "delta" },
  { name: "familyBlues", op: 7, type: "delta" },
  { name: "familyBlues", op: 8, type: "delta" },
  { name: "familyOtherBlues", op: 9, type: "delta" },
  { name: "blueScale", op: 1209, type: "number", value: 0.039625 },
  { name: "blueShift", op: 1210, type: "number", value: 7 },
  { name: "blueFuzz", op: 1211, type: "number", value: 1 },
  { name: "stdHW", op: 10, type: "number" },
  { name: "stdVW", op: 11, type: "number" },
  { name: "stemSnapH", op: 1212, type: "number" },
  { name: "stemSnapV", op: 1213, type: "number" },
  { name: "languageGroup", op: 1217, type: "number", value: 0 },
  { name: "expansionFactor", op: 1218, type: "number", value: 0.06 },
  { name: "vsindex", op: 22, type: "number", value: 0 },
  { name: "subrs", op: 19, type: "offset" }
], Np = [
  { name: "private", op: 18, type: ["number", "offset"], value: [0, 0] }
];
function zp(n, t, e, s) {
  const i = va(n, t, n.byteLength, s);
  return Sa(i, s > 1 ? Up : tl, e);
}
function wa(n, t, e, s, i) {
  const r = va(n, t, e, i);
  return Sa(r, i > 1 ? Pp : el, s);
}
function Hp(n, t, e) {
  const s = va(n, t, void 0, e);
  return Sa(s, Np);
}
function Gp(n, t, e) {
  const s = [];
  for (let i = 0; i < e.length; i++) {
    const r = new DataView(new Uint8Array(e[i]).buffer), a = Hp(r, 0, 2), o = a.private[0], c = a.private[1];
    if (o !== 0 && c !== 0) {
      const h = wa(n, c + t, o, [], 2);
      if (h.subrs) {
        const l = c + h.subrs, u = de(n, l + t, void 0, 2);
        a._subrs = u.objects, a._subrsBias = Ei(a._subrs);
      }
      a._privateDict = h;
    }
    s.push(a);
  }
  return s;
}
function vr(n, t, e, s, i) {
  const r = [];
  for (let a = 0; a < e.length; a += 1) {
    const o = new DataView(new Uint8Array(e[a]).buffer), c = zp(o, 0, s, i);
    c._subrs = [], c._subrsBias = 0, c._defaultWidthX = 0, c._nominalWidthX = 0;
    const h = i < 2 ? c.private[0] : 0, l = i < 2 ? c.private[1] : 0;
    if (h !== 0 && l !== 0) {
      const u = wa(n, l + t, h, s, i);
      if (c._defaultWidthX = u.defaultWidthX, c._nominalWidthX = u.nominalWidthX, u.subrs !== 0) {
        const f = l + u.subrs, p = de(n, f + t, void 0, i);
        c._subrs = p.objects, c._subrsBias = Ei(c._subrs);
      }
      c._privateDict = u;
    }
    r.push(c);
  }
  return r;
}
function Vp(n, t, e, s, i) {
  let r, a;
  const o = new z.Parser(n, t);
  e -= 1;
  const c = [".notdef"], h = o.parseCard8();
  if (h === 0)
    for (let l = 0; l < e; l += 1)
      r = o.parseSID(), i ? c.push(r) : c.push(hs(s, r) || r);
  else if (h === 1)
    for (; c.length <= e; ) {
      r = o.parseSID(), a = o.parseCard8();
      for (let l = 0; l <= a; l += 1)
        i ? c.push("cid" + ("00000" + r).slice(-5)) : c.push(hs(s, r) || r), r += 1;
    }
  else if (h === 2)
    for (; c.length <= e; ) {
      r = o.parseSID(), a = o.parseCard16();
      for (let l = 0; l <= a; l += 1)
        i ? c.push("cid" + ("00000" + r).slice(-5)) : c.push(hs(s, r) || r), r += 1;
    }
  else
    throw new Error("Unknown charset format " + h);
  return c;
}
function Wp(n, t) {
  let e;
  const s = {}, i = new z.Parser(n, t), r = i.parseCard8();
  if (r === 0) {
    const a = i.parseCard8();
    for (let o = 0; o < a; o += 1)
      e = i.parseCard8(), s[e] = o;
  } else if (r === 1) {
    const a = i.parseCard8();
    e = 1;
    for (let o = 0; o < a; o += 1) {
      const c = i.parseCard8(), h = i.parseCard8();
      for (let l = c; l <= c + h; l += 1)
        s[l] = e, e += 1;
    }
  } else
    throw new Error("Unknown encoding format " + r);
  return s;
}
function qp(n) {
  let t = n.pop();
  for (; n.length > t; )
    n.pop();
}
function nl(n, t) {
  const e = n.tables.cff && n.tables.cff.topDict && n.tables.cff.topDict.paintType || 0;
  return e === 2 && (t.fill = null, t.stroke = "black", t.strokeWidth = n.tables.cff.topDict.strokeWidth || 0), e;
}
function ia(n, t, e, s, i) {
  let r, a, o, c;
  const h = new Hn(), l = [];
  let u = 0, f = !1, p = !1, d = 0, g = 0, x, b, v, S, w = 0, F = [], O, M = 0;
  const I = n.tables.cff2 || n.tables.cff;
  if (v = I.topDict._defaultWidthX, S = I.topDict._nominalWidthX, i = i || n.variation && n.variation.get(), t.getBlendPath || (t.getBlendPath = function(U) {
    return ia(n, t, e, s, U);
  }), n.isCIDFont || s > 1) {
    const U = I.topDict._fdSelect ? I.topDict._fdSelect[t.index] : 0, P = I.topDict._fdArray[U];
    x = P._subrs, b = P._subrsBias, s > 1 ? (F = I.topDict._vstore.itemVariationStore, w = P._privateDict.vsindex) : (v = P._defaultWidthX, S = P._nominalWidthX);
  } else
    x = I.topDict._subrs, b = I.topDict._subrsBias;
  const H = nl(n, h);
  let R = v;
  function W(U, P) {
    p && H !== 2 && h.closePath(), h.moveTo(U, P), p = !0;
  }
  function J() {
    let U;
    U = (l.length & 1) !== 0, U && !f && (R = l.shift() + S), u += l.length >> 1, l.length = 0, f = !0;
  }
  function D(U) {
    let P, K, yt, Ut, Ct, at, j, rt, bt, At, St, Tt, lt = 0;
    for (; lt < U.length; ) {
      let Et = U[lt];
      switch (lt += 1, Et) {
        case 1:
          J();
          break;
        case 3:
          J();
          break;
        case 4:
          l.length > 1 && !f && (R = l.shift() + S, f = !0), g += l.pop(), W(d, g);
          break;
        case 5:
          for (; l.length > 0; )
            d += l.shift(), g += l.shift(), h.lineTo(d, g);
          break;
        case 6:
          for (; l.length > 0 && (d += l.shift(), h.lineTo(d, g), l.length !== 0); )
            g += l.shift(), h.lineTo(d, g);
          break;
        case 7:
          for (; l.length > 0 && (g += l.shift(), h.lineTo(d, g), l.length !== 0); )
            d += l.shift(), h.lineTo(d, g);
          break;
        case 8:
          for (; l.length > 0; )
            r = d + l.shift(), a = g + l.shift(), o = r + l.shift(), c = a + l.shift(), d = o + l.shift(), g = c + l.shift(), h.curveTo(r, a, o, c, d, g);
          break;
        case 10:
          if (Ct = l.pop() + b, at = x[Ct], at) {
            if (M >= Ho) {
              console.warn("CFF charstring subroutine call depth exceeded, skipping callsubr");
              break;
            }
            M++, D(at), M--;
          }
          break;
        case 11:
          if (s > 1) {
            console.error("CFF CharString operator return (11) is not supported in CFF2");
            break;
          }
          return;
        case 12:
          switch (Et = U[lt], lt += 1, Et) {
            case 35:
              r = d + l.shift(), a = g + l.shift(), o = r + l.shift(), c = a + l.shift(), j = o + l.shift(), rt = c + l.shift(), bt = j + l.shift(), At = rt + l.shift(), St = bt + l.shift(), Tt = At + l.shift(), d = St + l.shift(), g = Tt + l.shift(), l.shift(), h.curveTo(r, a, o, c, j, rt), h.curveTo(bt, At, St, Tt, d, g);
              break;
            case 34:
              r = d + l.shift(), a = g, o = r + l.shift(), c = a + l.shift(), j = o + l.shift(), rt = c, bt = j + l.shift(), At = c, St = bt + l.shift(), Tt = g, d = St + l.shift(), h.curveTo(r, a, o, c, j, rt), h.curveTo(bt, At, St, Tt, d, g);
              break;
            case 36:
              r = d + l.shift(), a = g + l.shift(), o = r + l.shift(), c = a + l.shift(), j = o + l.shift(), rt = c, bt = j + l.shift(), At = c, St = bt + l.shift(), Tt = At + l.shift(), d = St + l.shift(), h.curveTo(r, a, o, c, j, rt), h.curveTo(bt, At, St, Tt, d, g);
              break;
            case 37:
              r = d + l.shift(), a = g + l.shift(), o = r + l.shift(), c = a + l.shift(), j = o + l.shift(), rt = c + l.shift(), bt = j + l.shift(), At = rt + l.shift(), St = bt + l.shift(), Tt = At + l.shift(), Math.abs(St - d) > Math.abs(Tt - g) ? d = St + l.shift() : g = Tt + l.shift(), h.curveTo(r, a, o, c, j, rt), h.curveTo(bt, At, St, Tt, d, g);
              break;
            default:
              console.log("Glyph " + t.index + ": unknown operator 1200" + Et), l.length = 0;
          }
          break;
        case 14:
          if (s > 1) {
            console.error("CFF CharString operator endchar (14) is not supported in CFF2");
            break;
          }
          if (l.length >= 4) {
            const Se = sa[l.pop()], C = sa[l.pop()], m = l.pop(), y = l.pop();
            if (Se && C) {
              t.isComposite = !0, t.components = [];
              const T = n.cffEncoding.charset.indexOf(Se), k = n.cffEncoding.charset.indexOf(C);
              t.components.push({
                glyphIndex: k,
                dx: 0,
                dy: 0
              }), t.components.push({
                glyphIndex: T,
                dx: y,
                dy: m
              }), h.extend(n.glyphs.get(k).path);
              const _ = n.glyphs.get(T), B = JSON.parse(JSON.stringify(_.path.commands));
              for (let $ = 0; $ < B.length; $ += 1) {
                const Y = B[$];
                Y.type !== "Z" && (Y.x += y, Y.y += m), (Y.type === "Q" || Y.type === "C") && (Y.x1 += y, Y.y1 += m), Y.type === "C" && (Y.x2 += y, Y.y2 += m);
              }
              h.extend(B);
            }
          } else l.length > 0 && !f && (R = l.shift() + S, f = !0);
          p && H !== 2 && (h.closePath(), p = !1);
          break;
        case 15:
          if (s < 2) {
            console.error("CFF2 CharString operator vsindex (15) is not supported in CFF");
            break;
          }
          w = l.pop();
          break;
        case 16:
          if (s < 2) {
            console.error("CFF2 CharString operator blend (16) is not supported in CFF");
            break;
          }
          O || (O = n.variation && i && n.variation.process.getBlendVector(F, w, i));
          var Q = l.pop(), kt = O ? O.length : F.itemVariationSubtables[w].regionIndexes.length, Pt = Q * kt, Nt = l.length - Pt, zt = Nt - Q;
          if (O)
            for (let Se = 0; Se < Q; Se++) {
              var Gt = l[zt + Se];
              for (let C = 0; C < kt; C++)
                Gt += O[C] * l[Nt++];
              l[zt + Se] = Gt;
            }
          for (; Pt--; )
            l.pop();
          break;
        case 18:
          J();
          break;
        case 19:
        case 20:
          J(), lt += u + 7 >> 3;
          break;
        case 21:
          l.length > 2 && !f && (R = l.shift() + S, f = !0), g += l.pop(), d += l.pop(), W(d, g);
          break;
        case 22:
          l.length > 1 && !f && (R = l.shift() + S, f = !0), d += l.pop(), W(d, g);
          break;
        case 23:
          J();
          break;
        case 24:
          for (; l.length > 2; )
            r = d + l.shift(), a = g + l.shift(), o = r + l.shift(), c = a + l.shift(), d = o + l.shift(), g = c + l.shift(), h.curveTo(r, a, o, c, d, g);
          d += l.shift(), g += l.shift(), h.lineTo(d, g);
          break;
        case 25:
          for (; l.length > 6; )
            d += l.shift(), g += l.shift(), h.lineTo(d, g);
          r = d + l.shift(), a = g + l.shift(), o = r + l.shift(), c = a + l.shift(), d = o + l.shift(), g = c + l.shift(), h.curveTo(r, a, o, c, d, g);
          break;
        case 26:
          for (l.length & 1 && (d += l.shift()); l.length > 0; )
            r = d, a = g + l.shift(), o = r + l.shift(), c = a + l.shift(), d = o, g = c + l.shift(), h.curveTo(r, a, o, c, d, g);
          break;
        case 27:
          for (l.length & 1 && (g += l.shift()); l.length > 0; )
            r = d + l.shift(), a = g, o = r + l.shift(), c = a + l.shift(), d = o + l.shift(), g = c, h.curveTo(r, a, o, c, d, g);
          break;
        case 28:
          P = U[lt], K = U[lt + 1], l.push((P << 24 | K << 16) >> 16), lt += 2;
          break;
        case 29:
          if (Ct = l.pop() + n.gsubrsBias, at = n.gsubrs[Ct], at) {
            if (M >= Ho) {
              console.warn("CFF charstring subroutine call depth exceeded, skipping callgsubr");
              break;
            }
            M++, D(at), M--;
          }
          break;
        case 30:
          for (; l.length > 0 && (r = d, a = g + l.shift(), o = r + l.shift(), c = a + l.shift(), d = o + l.shift(), g = c + (l.length === 1 ? l.shift() : 0), h.curveTo(r, a, o, c, d, g), l.length !== 0); )
            r = d + l.shift(), a = g, o = r + l.shift(), c = a + l.shift(), g = c + l.shift(), d = o + (l.length === 1 ? l.shift() : 0), h.curveTo(r, a, o, c, d, g);
          break;
        case 31:
          for (; l.length > 0 && (r = d + l.shift(), a = g, o = r + l.shift(), c = a + l.shift(), g = c + l.shift(), d = o + (l.length === 1 ? l.shift() : 0), h.curveTo(r, a, o, c, d, g), l.length !== 0); )
            r = d, a = g + l.shift(), o = r + l.shift(), c = a + l.shift(), d = o + l.shift(), g = c + (l.length === 1 ? l.shift() : 0), h.curveTo(r, a, o, c, d, g);
          break;
        default:
          Et < 32 ? console.log("Glyph " + t.index + ": unknown operator " + Et) : Et < 247 ? l.push(Et - 139) : Et < 251 ? (P = U[lt], lt += 1, l.push((Et - 247) * 256 + P + 108)) : Et < 255 ? (P = U[lt], lt += 1, l.push(-(Et - 251) * 256 - P - 108)) : (P = U[lt], K = U[lt + 1], yt = U[lt + 2], Ut = U[lt + 3], lt += 4, l.push((P << 24 | K << 16 | yt << 8 | Ut) / 65536));
      }
    }
  }
  return D(e), n.variation && i && (h.commands = h.commands.map((U) => {
    const P = Object.keys(U);
    for (let K = 0; K < P.length; K++) {
      const yt = P[K];
      yt !== "type" && (U[yt] = Math.round(U[yt]));
    }
    return U;
  })), f && (t.advanceWidth = R), h;
}
function Go(n, t, e, s, i) {
  const r = [];
  let a;
  const o = new z.Parser(n, t), c = o.parseCard8();
  if (c === 0)
    for (let h = 0; h < e; h++) {
      if (a = o.parseCard8(), a >= s)
        throw new Error("CFF table CID Font FDSelect has bad FD index value " + a + " (FD count " + s + ")");
      r.push(a);
    }
  else if (c === 3 || i > 1 && c === 4) {
    const h = c === 4 ? o.parseULong() : o.parseCard16();
    let l = c === 4 ? o.parseULong() : o.parseCard16();
    if (l !== 0)
      throw new Error(`CFF Table CID Font FDSelect format ${c} range has bad initial GID ${l}`);
    let u;
    for (let f = 0; f < h; f++) {
      if (a = c === 4 ? o.parseUShort() : o.parseCard8(), u = c === 4 ? o.parseULong() : o.parseCard16(), a >= s)
        throw new Error("CFF table CID Font FDSelect has bad FD index value " + a + " (FD count " + s + ")");
      if (u > e)
        throw new Error(`CFF Table CID Font FDSelect format ${i} range has bad GID ${u}`);
      for (; l < u; l++)
        r.push(a);
      l = u;
    }
    if (u !== e)
      throw new Error("CFF Table CID Font FDSelect format 3 range has bad final (Sentinal) GID " + u);
  } else
    throw new Error("CFF Table CID Font FDSelect table has unsupported format " + c);
  return r;
}
function jp(n, t, e, s) {
  let i;
  const r = Dp(n, t);
  r.formatMajor === 2 ? i = e.tables.cff2 = {} : i = e.tables.cff = {};
  const a = r.formatMajor > 1 ? null : de(n, r.endOffset, z.bytesToString), o = r.formatMajor > 1 ? null : de(n, a.endOffset), c = r.formatMajor > 1 ? null : de(n, o.endOffset, z.bytesToString), h = de(n, r.formatMajor > 1 ? t + r.size + r.topDictLength : c.endOffset, void 0, r.formatMajor);
  e.gsubrs = h.objects, e.gsubrsBias = Ei(e.gsubrs);
  let l;
  if (r.formatMajor > 1) {
    const f = t + r.size, p = z.getBytes(n, f, f + r.topDictLength);
    l = vr(n, 0, [p], void 0, r.formatMajor)[0];
  } else {
    const f = vr(n, t, o.objects, c.objects, r.formatMajor);
    if (f.length !== 1)
      throw new Error("CFF table has too many fonts in 'FontSet' - count of fonts NameIndex.length = " + f.length);
    l = f[0];
  }
  if (i.topDict = l, l._privateDict && (e.defaultWidthX = l._privateDict.defaultWidthX, e.nominalWidthX = l._privateDict.nominalWidthX), r.formatMajor < 2 && l.ros[0] !== void 0 && l.ros[1] !== void 0 && (e.isCIDFont = !0), r.formatMajor > 1) {
    let f = l.fdArray, p = l.fdSelect;
    if (!f)
      throw new Error("This is a CFF2 font, but FDArray information is missing");
    const d = de(n, t + f, null, r.formatMajor), g = Gp(n, t, d.objects);
    l._fdArray = g, p && (l._fdSelect = Go(n, t + p, e.numGlyphs, g.length, r.formatMajor));
  } else if (e.isCIDFont) {
    let f = l.fdArray, p = l.fdSelect;
    if (f === 0 || p === 0)
      throw new Error("Font is marked as a CID font, but FDArray and/or FDSelect information is missing");
    f += t;
    const d = de(n, f), g = vr(n, t, d.objects, c.objects, r.formatMajor);
    l._fdArray = g, p += t, l._fdSelect = Go(n, p, e.numGlyphs, g.length, r.formatMajor);
  }
  if (r.formatMajor < 2) {
    const f = t + l.private[1], p = wa(n, f, l.private[0], c.objects, r.formatMajor);
    if (e.defaultWidthX = p.defaultWidthX, e.nominalWidthX = p.nominalWidthX, p.subrs !== 0) {
      const d = f + p.subrs, g = de(n, d);
      e.subrs = g.objects, e.subrsBias = Ei(e.subrs);
    } else
      e.subrs = [], e.subrsBias = 0;
  }
  let u;
  if (s.lowMemory ? (u = _p(n, t + l.charStrings, r.formatMajor), e.nGlyphs = u.offsets.length - (r.formatMajor > 1 ? 1 : 0)) : (u = de(n, t + l.charStrings, null, r.formatMajor), e.nGlyphs = u.objects.length), r.formatMajor > 1 && e.tables.maxp && e.nGlyphs !== e.tables.maxp.numGlyphs && console.error(`Glyph count in the CFF2 table (${e.nGlyphs}) must correspond to the glyph count in the maxp table (${e.tables.maxp.numGlyphs})`), r.formatMajor < 2) {
    let f = [], p = [];
    l.charset === 0 ? f = gp : l.charset === 1 ? f = mp : l.charset === 2 ? f = yp : f = Vp(n, t + l.charset, e.nGlyphs, c.objects, e.isCIDFont), l.encoding === 0 ? p = sa : l.encoding === 1 ? p = xp : p = Wp(n, t + l.encoding), e.cffEncoding = new $h(p, f), e.encoding = e.encoding || e.cffEncoding;
  }
  if (e.glyphs = new be.GlyphSet(e), s.lowMemory)
    e._push = function(f) {
      const p = Lp(f, u.offsets, n, t + l.charStrings, void 0, r.formatMajor);
      e.glyphs.push(f, be.cffGlyphLoader(e, f, ia, p, r.formatMajor));
    };
  else
    for (let f = 0; f < e.nGlyphs; f += 1) {
      const p = u.objects[f];
      e.glyphs.push(f, be.cffGlyphLoader(e, f, ia, p, r.formatMajor));
    }
  if (l.vstore) {
    const f = new z.Parser(n, t + l.vstore);
    l._vstore = f.parseVariationStore();
  }
}
function sl(n, t) {
  let e, s = oi.indexOf(n);
  return s >= 0 && (e = s), s = t.indexOf(n), s >= 0 ? e = s + oi.length : (e = oi.length + t.length, t.push(n)), e;
}
function Xp() {
  return new L.Record("Header", [
    { name: "major", type: "Card8", value: 1 },
    { name: "minor", type: "Card8", value: 0 },
    { name: "hdrSize", type: "Card8", value: 4 },
    { name: "major", type: "Card8", value: 1 }
  ]);
}
function Yp(n) {
  const t = new L.Record("Name INDEX", [
    { name: "names", type: "INDEX", value: [] }
  ]);
  t.names = [];
  for (let e = 0; e < n.length; e += 1)
    t.names.push({ name: "name_" + e, type: "NAME", value: n[e] });
  return t;
}
function il(n, t, e) {
  const s = {};
  for (let i = 0; i < n.length; i += 1) {
    const r = n[i];
    let a = t[r.name];
    a !== void 0 && !Qh(a, r.value) && (r.type === "SID" && (a = sl(a, e)), s[r.op] = { name: r.name, type: r.type, value: a });
  }
  return s;
}
function Vo(n, t, e) {
  const s = new L.Record("Top DICT", [
    { name: "dict", type: "DICT", value: {} }
  ]);
  return s.dict = il(tl, n, t), s;
}
function Wo(n) {
  const t = new L.Record("Top DICT INDEX", [
    { name: "topDicts", type: "INDEX", value: [] }
  ]);
  return t.topDicts = [{ name: "topDict_0", type: "TABLE", value: n }], t;
}
function $p(n) {
  const t = new L.Record("String INDEX", [
    { name: "strings", type: "INDEX", value: [] }
  ]);
  t.strings = [];
  for (let e = 0; e < n.length; e += 1)
    t.strings.push({ name: "string_" + e, type: "STRING", value: n[e] });
  return t;
}
function Zp() {
  return new L.Record("Global Subr INDEX", [
    { name: "subrs", type: "INDEX", value: [] }
  ]);
}
function Jp(n, t) {
  const e = new L.Record("Charsets", [
    { name: "format", type: "Card8", value: 0 }
  ]);
  for (let s = 0; s < n.length; s += 1) {
    const i = n[s], r = sl(i, t);
    e.fields.push({ name: "glyph_" + s, type: "SID", value: r });
  }
  return e;
}
function Kp(n, t) {
  const e = [], s = n.path;
  e.push({ name: "width", type: "NUMBER", value: n.advanceWidth });
  let i = 0, r = 0;
  for (let a = 0; a < s.commands.length; a += 1) {
    let o, c, h = s.commands[a];
    if (h.type === "Q") {
      const l = 0.3333333333333333, u = 2 / 3;
      h = {
        type: "C",
        x: h.x,
        y: h.y,
        x1: Math.round(l * i + u * h.x1),
        y1: Math.round(l * r + u * h.y1),
        x2: Math.round(l * h.x + u * h.x1),
        y2: Math.round(l * h.y + u * h.y1)
      };
    }
    if (h.type === "M")
      o = Math.round(h.x - i), c = Math.round(h.y - r), e.push({ name: "dx", type: "NUMBER", value: o }), e.push({ name: "dy", type: "NUMBER", value: c }), e.push({ name: "rmoveto", type: "OP", value: 21 }), i = Math.round(h.x), r = Math.round(h.y);
    else if (h.type === "L")
      o = Math.round(h.x - i), c = Math.round(h.y - r), e.push({ name: "dx", type: "NUMBER", value: o }), e.push({ name: "dy", type: "NUMBER", value: c }), e.push({ name: "rlineto", type: "OP", value: 5 }), i = Math.round(h.x), r = Math.round(h.y);
    else if (h.type === "C") {
      const l = Math.round(h.x1 - i), u = Math.round(h.y1 - r), f = Math.round(h.x2 - h.x1), p = Math.round(h.y2 - h.y1);
      o = Math.round(h.x - h.x2), c = Math.round(h.y - h.y2), e.push({ name: "dx1", type: "NUMBER", value: l }), e.push({ name: "dy1", type: "NUMBER", value: u }), e.push({ name: "dx2", type: "NUMBER", value: f }), e.push({ name: "dy2", type: "NUMBER", value: p }), e.push({ name: "dx", type: "NUMBER", value: o }), e.push({ name: "dy", type: "NUMBER", value: c }), e.push({ name: "rrcurveto", type: "OP", value: 8 }), i = Math.round(h.x), r = Math.round(h.y);
    }
  }
  return e.push({ name: "endchar", type: "OP", value: 14 }), e;
}
function Qp(n, t) {
  const e = new L.Record("CharStrings INDEX", [
    { name: "charStrings", type: "INDEX", value: [] }
  ]);
  for (let s = 0; s < n.length; s += 1) {
    const i = n.get(s), r = Kp(i);
    e.charStrings.push({ name: i.name, type: "CHARSTRING", value: r });
  }
  return e;
}
function td(n, t, e) {
  const s = new L.Record("Private DICT", [
    { name: "dict", type: "DICT", value: {} }
  ]);
  return s.dict = il(el, n, t), s;
}
function ed(n, t) {
  const e = new L.Table("CFF ", [
    { name: "header", type: "RECORD" },
    { name: "nameIndex", type: "RECORD" },
    { name: "topDictIndex", type: "RECORD" },
    { name: "stringIndex", type: "RECORD" },
    { name: "globalSubrIndex", type: "RECORD" },
    { name: "charsets", type: "RECORD" },
    { name: "charStringsIndex", type: "RECORD" },
    { name: "privateDict", type: "RECORD" }
  ]), s = 1 / t.unitsPerEm, i = {
    version: t.version,
    fullName: t.fullName,
    familyName: t.familyName,
    weight: t.weightName,
    fontBBox: t.fontBBox || [0, 0, 0, 0],
    fontMatrix: [s, 0, 0, s, 0, 0],
    charset: 999,
    encoding: 0,
    charStrings: 999,
    private: [0, 999]
  }, r = t && t.topDict || {};
  r.paintType && (i.paintType = r.paintType, i.strokeWidth = r.strokeWidth || 0);
  const a = {}, o = [];
  let c;
  for (let f = 1; f < n.length; f += 1)
    c = n.get(f), o.push(c.name);
  const h = [];
  e.header = Xp(), e.nameIndex = Yp([t.postScriptName]);
  let l = Vo(i, h);
  e.topDictIndex = Wo(l), e.globalSubrIndex = Zp(), e.charsets = Jp(o, h), e.charStringsIndex = Qp(n), e.privateDict = td(a, h), e.stringIndex = $p(h);
  const u = e.header.sizeOf() + e.nameIndex.sizeOf() + e.topDictIndex.sizeOf() + e.stringIndex.sizeOf() + e.globalSubrIndex.sizeOf();
  return i.charset = u, i.encoding = 0, i.charStrings = i.charset + e.charsets.sizeOf(), i.private[1] = i.charStrings + e.charStringsIndex.sizeOf(), l = Vo(i, h), e.topDictIndex = Wo(l), e;
}
var ra = { parse: jp, make: ed };
function nd(n, t) {
  const e = {}, s = new z.Parser(n, t);
  return e.version = s.parseVersion(), e.fontRevision = Math.round(s.parseFixed() * 1e3) / 1e3, e.checkSumAdjustment = s.parseULong(), e.magicNumber = s.parseULong(), V.argument(e.magicNumber === 1594834165, "Font header has wrong magic number."), e.flags = s.parseUShort(), e.unitsPerEm = s.parseUShort(), e.created = s.parseLongDateTime(), e.modified = s.parseLongDateTime(), e.xMin = s.parseShort(), e.yMin = s.parseShort(), e.xMax = s.parseShort(), e.yMax = s.parseShort(), e.macStyle = s.parseUShort(), e.lowestRecPPEM = s.parseUShort(), e.fontDirectionHint = s.parseShort(), e.indexToLocFormat = s.parseShort(), e.glyphDataFormat = s.parseShort(), e;
}
function sd(n) {
  const t = Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3) + 2082844800;
  let e = t, s = n.macStyle || 0;
  return n.createdTimestamp && (e = n.createdTimestamp + 2082844800), new L.Table("head", [
    { name: "version", type: "FIXED", value: 65536 },
    { name: "fontRevision", type: "FIXED", value: 65536 },
    { name: "checkSumAdjustment", type: "ULONG", value: 0 },
    { name: "magicNumber", type: "ULONG", value: 1594834165 },
    { name: "flags", type: "USHORT", value: 0 },
    { name: "unitsPerEm", type: "USHORT", value: 1e3 },
    { name: "created", type: "LONGDATETIME", value: e },
    { name: "modified", type: "LONGDATETIME", value: t },
    { name: "xMin", type: "SHORT", value: 0 },
    { name: "yMin", type: "SHORT", value: 0 },
    { name: "xMax", type: "SHORT", value: 0 },
    { name: "yMax", type: "SHORT", value: 0 },
    { name: "macStyle", type: "USHORT", value: s },
    { name: "lowestRecPPEM", type: "USHORT", value: 0 },
    { name: "fontDirectionHint", type: "SHORT", value: 2 },
    { name: "indexToLocFormat", type: "SHORT", value: 0 },
    { name: "glyphDataFormat", type: "SHORT", value: 0 }
  ], n);
}
var rl = { parse: nd, make: sd };
function id(n, t) {
  const e = {}, s = new z.Parser(n, t);
  return e.version = s.parseVersion(), e.ascender = s.parseShort(), e.descender = s.parseShort(), e.lineGap = s.parseShort(), e.advanceWidthMax = s.parseUShort(), e.minLeftSideBearing = s.parseShort(), e.minRightSideBearing = s.parseShort(), e.xMaxExtent = s.parseShort(), e.caretSlopeRise = s.parseShort(), e.caretSlopeRun = s.parseShort(), e.caretOffset = s.parseShort(), s.relativeOffset += 8, e.metricDataFormat = s.parseShort(), e.numberOfHMetrics = s.parseUShort(), e;
}
function rd(n) {
  return new L.Table("hhea", [
    { name: "version", type: "FIXED", value: 65536 },
    { name: "ascender", type: "FWORD", value: 0 },
    { name: "descender", type: "FWORD", value: 0 },
    { name: "lineGap", type: "FWORD", value: 0 },
    { name: "advanceWidthMax", type: "UFWORD", value: 0 },
    { name: "minLeftSideBearing", type: "FWORD", value: 0 },
    { name: "minRightSideBearing", type: "FWORD", value: 0 },
    { name: "xMaxExtent", type: "FWORD", value: 0 },
    { name: "caretSlopeRise", type: "SHORT", value: 1 },
    { name: "caretSlopeRun", type: "SHORT", value: 0 },
    { name: "caretOffset", type: "SHORT", value: 0 },
    { name: "reserved1", type: "SHORT", value: 0 },
    { name: "reserved2", type: "SHORT", value: 0 },
    { name: "reserved3", type: "SHORT", value: 0 },
    { name: "reserved4", type: "SHORT", value: 0 },
    { name: "metricDataFormat", type: "SHORT", value: 0 },
    { name: "numberOfHMetrics", type: "USHORT", value: 0 }
  ], n);
}
var al = { parse: id, make: rd };
function ad(n, t, e, s, i) {
  let r, a;
  const o = new z.Parser(n, t);
  for (let c = 0; c < s; c += 1) {
    c < e && (r = o.parseUShort(), a = o.parseShort());
    const h = i.get(c);
    h.advanceWidth = r, h.leftSideBearing = a;
  }
}
function od(n, t, e, s, i) {
  n._hmtxTableData = {};
  let r, a;
  const o = new z.Parser(t, e);
  for (let c = 0; c < i; c += 1)
    c < s && (r = o.parseUShort(), a = o.parseShort()), n._hmtxTableData[c] = {
      advanceWidth: r,
      leftSideBearing: a
    };
}
function cd(n, t, e, s, i, r, a) {
  a.lowMemory ? od(n, t, e, s, i) : ad(t, e, s, i, r);
}
function hd(n) {
  const t = new L.Table("hmtx", []);
  for (let e = 0; e < n.length; e += 1) {
    const s = n.get(e), i = s.advanceWidth || 0, r = s.leftSideBearing || 0;
    t.fields.push({ name: "advanceWidth_" + e, type: "USHORT", value: i }), t.fields.push({ name: "leftSideBearing_" + e, type: "SHORT", value: r });
  }
  return t;
}
var ol = { parse: cd, make: hd };
function ld(n) {
  const t = new L.Table("ltag", [
    { name: "version", type: "ULONG", value: 1 },
    { name: "flags", type: "ULONG", value: 0 },
    { name: "numTags", type: "ULONG", value: n.length }
  ]);
  let e = "";
  const s = 12 + n.length * 4;
  for (let i = 0; i < n.length; ++i) {
    let r = e.indexOf(n[i]);
    r < 0 && (r = e.length, e += n[i]), t.fields.push({ name: "offset " + i, type: "USHORT", value: s + r }), t.fields.push({ name: "length " + i, type: "USHORT", value: n[i].length });
  }
  return t.fields.push({ name: "stringPool", type: "CHARARRAY", value: e }), t;
}
function ud(n, t) {
  const e = new z.Parser(n, t), s = e.parseULong();
  V.argument(s === 1, "Unsupported ltag table version."), e.skip("uLong", 1);
  const i = e.parseULong(), r = [];
  for (let a = 0; a < i; a++) {
    let o = "";
    const c = t + e.parseUShort(), h = e.parseUShort();
    for (let l = c; l < c + h; ++l)
      o += String.fromCharCode(n.getInt8(l));
    r.push(o);
  }
  return r;
}
var cl = { make: ld, parse: ud };
function fd(n, t) {
  const e = {}, s = new z.Parser(n, t);
  return e.version = s.parseVersion(), e.numGlyphs = s.parseUShort(), e.version === 1 && (e.maxPoints = s.parseUShort(), e.maxContours = s.parseUShort(), e.maxCompositePoints = s.parseUShort(), e.maxCompositeContours = s.parseUShort(), e.maxZones = s.parseUShort(), e.maxTwilightPoints = s.parseUShort(), e.maxStorage = s.parseUShort(), e.maxFunctionDefs = s.parseUShort(), e.maxInstructionDefs = s.parseUShort(), e.maxStackElements = s.parseUShort(), e.maxSizeOfInstructions = s.parseUShort(), e.maxComponentElements = s.parseUShort(), e.maxComponentDepth = s.parseUShort()), e;
}
function pd(n) {
  return new L.Table("maxp", [
    { name: "version", type: "FIXED", value: 20480 },
    { name: "numGlyphs", type: "USHORT", value: n }
  ]);
}
var hl = { parse: fd, make: pd }, aa = [
  { begin: 0, end: 127 },
  // Basic Latin
  { begin: 128, end: 255 },
  // Latin-1 Supplement
  { begin: 256, end: 383 },
  // Latin Extended-A
  { begin: 384, end: 591 },
  // Latin Extended-B
  { begin: 592, end: 687 },
  // IPA Extensions
  { begin: 688, end: 767 },
  // Spacing Modifier Letters
  { begin: 768, end: 879 },
  // Combining Diacritical Marks
  { begin: 880, end: 1023 },
  // Greek and Coptic
  { begin: 11392, end: 11519 },
  // Coptic
  { begin: 1024, end: 1279 },
  // Cyrillic
  { begin: 1328, end: 1423 },
  // Armenian
  { begin: 1424, end: 1535 },
  // Hebrew
  { begin: 42240, end: 42559 },
  // Vai
  { begin: 1536, end: 1791 },
  // Arabic
  { begin: 1984, end: 2047 },
  // NKo
  { begin: 2304, end: 2431 },
  // Devanagari
  { begin: 2432, end: 2559 },
  // Bengali
  { begin: 2560, end: 2687 },
  // Gurmukhi
  { begin: 2688, end: 2815 },
  // Gujarati
  { begin: 2816, end: 2943 },
  // Oriya
  { begin: 2944, end: 3071 },
  // Tamil
  { begin: 3072, end: 3199 },
  // Telugu
  { begin: 3200, end: 3327 },
  // Kannada
  { begin: 3328, end: 3455 },
  // Malayalam
  { begin: 3584, end: 3711 },
  // Thai
  { begin: 3712, end: 3839 },
  // Lao
  { begin: 4256, end: 4351 },
  // Georgian
  { begin: 6912, end: 7039 },
  // Balinese
  { begin: 4352, end: 4607 },
  // Hangul Jamo
  { begin: 7680, end: 7935 },
  // Latin Extended Additional
  { begin: 7936, end: 8191 },
  // Greek Extended
  { begin: 8192, end: 8303 },
  // General Punctuation
  { begin: 8304, end: 8351 },
  // Superscripts And Subscripts
  { begin: 8352, end: 8399 },
  // Currency Symbol
  { begin: 8400, end: 8447 },
  // Combining Diacritical Marks For Symbols
  { begin: 8448, end: 8527 },
  // Letterlike Symbols
  { begin: 8528, end: 8591 },
  // Number Forms
  { begin: 8592, end: 8703 },
  // Arrows
  { begin: 8704, end: 8959 },
  // Mathematical Operators
  { begin: 8960, end: 9215 },
  // Miscellaneous Technical
  { begin: 9216, end: 9279 },
  // Control Pictures
  { begin: 9280, end: 9311 },
  // Optical Character Recognition
  { begin: 9312, end: 9471 },
  // Enclosed Alphanumerics
  { begin: 9472, end: 9599 },
  // Box Drawing
  { begin: 9600, end: 9631 },
  // Block Elements
  { begin: 9632, end: 9727 },
  // Geometric Shapes
  { begin: 9728, end: 9983 },
  // Miscellaneous Symbols
  { begin: 9984, end: 10175 },
  // Dingbats
  { begin: 12288, end: 12351 },
  // CJK Symbols And Punctuation
  { begin: 12352, end: 12447 },
  // Hiragana
  { begin: 12448, end: 12543 },
  // Katakana
  { begin: 12544, end: 12591 },
  // Bopomofo
  { begin: 12592, end: 12687 },
  // Hangul Compatibility Jamo
  { begin: 43072, end: 43135 },
  // Phags-pa
  { begin: 12800, end: 13055 },
  // Enclosed CJK Letters And Months
  { begin: 13056, end: 13311 },
  // CJK Compatibility
  { begin: 44032, end: 55215 },
  // Hangul Syllables
  { begin: 55296, end: 57343 },
  // Non-Plane 0 *
  { begin: 67840, end: 67871 },
  // Phoenicia
  { begin: 19968, end: 40959 },
  // CJK Unified Ideographs
  { begin: 57344, end: 63743 },
  // Private Use Area (plane 0)
  { begin: 12736, end: 12783 },
  // CJK Strokes
  { begin: 64256, end: 64335 },
  // Alphabetic Presentation Forms
  { begin: 64336, end: 65023 },
  // Arabic Presentation Forms-A
  { begin: 65056, end: 65071 },
  // Combining Half Marks
  { begin: 65040, end: 65055 },
  // Vertical Forms
  { begin: 65104, end: 65135 },
  // Small Form Variants
  { begin: 65136, end: 65279 },
  // Arabic Presentation Forms-B
  { begin: 65280, end: 65519 },
  // Halfwidth And Fullwidth Forms
  { begin: 65520, end: 65535 },
  // Specials
  { begin: 3840, end: 4095 },
  // Tibetan
  { begin: 1792, end: 1871 },
  // Syriac
  { begin: 1920, end: 1983 },
  // Thaana
  { begin: 3456, end: 3583 },
  // Sinhala
  { begin: 4096, end: 4255 },
  // Myanmar
  { begin: 4608, end: 4991 },
  // Ethiopic
  { begin: 5024, end: 5119 },
  // Cherokee
  { begin: 5120, end: 5759 },
  // Unified Canadian Aboriginal Syllabics
  { begin: 5760, end: 5791 },
  // Ogham
  { begin: 5792, end: 5887 },
  // Runic
  { begin: 6016, end: 6143 },
  // Khmer
  { begin: 6144, end: 6319 },
  // Mongolian
  { begin: 10240, end: 10495 },
  // Braille Patterns
  { begin: 40960, end: 42127 },
  // Yi Syllables
  { begin: 5888, end: 5919 },
  // Tagalog
  { begin: 66304, end: 66351 },
  // Old Italic
  { begin: 66352, end: 66383 },
  // Gothic
  { begin: 66560, end: 66639 },
  // Deseret
  { begin: 118784, end: 119039 },
  // Byzantine Musical Symbols
  { begin: 119808, end: 120831 },
  // Mathematical Alphanumeric Symbols
  { begin: 1044480, end: 1048573 },
  // Private Use (plane 15)
  { begin: 65024, end: 65039 },
  // Variation Selectors
  { begin: 917504, end: 917631 },
  // Tags
  { begin: 6400, end: 6479 },
  // Limbu
  { begin: 6480, end: 6527 },
  // Tai Le
  { begin: 6528, end: 6623 },
  // New Tai Lue
  { begin: 6656, end: 6687 },
  // Buginese
  { begin: 11264, end: 11359 },
  // Glagolitic
  { begin: 11568, end: 11647 },
  // Tifinagh
  { begin: 19904, end: 19967 },
  // Yijing Hexagram Symbols
  { begin: 43008, end: 43055 },
  // Syloti Nagri
  { begin: 65536, end: 65663 },
  // Linear B Syllabary
  { begin: 65856, end: 65935 },
  // Ancient Greek Numbers
  { begin: 66432, end: 66463 },
  // Ugaritic
  { begin: 66464, end: 66527 },
  // Old Persian
  { begin: 66640, end: 66687 },
  // Shavian
  { begin: 66688, end: 66735 },
  // Osmanya
  { begin: 67584, end: 67647 },
  // Cypriot Syllabary
  { begin: 68096, end: 68191 },
  // Kharoshthi
  { begin: 119552, end: 119647 },
  // Tai Xuan Jing Symbols
  { begin: 73728, end: 74751 },
  // Cuneiform
  { begin: 119648, end: 119679 },
  // Counting Rod Numerals
  { begin: 7040, end: 7103 },
  // Sundanese
  { begin: 7168, end: 7247 },
  // Lepcha
  { begin: 7248, end: 7295 },
  // Ol Chiki
  { begin: 43136, end: 43231 },
  // Saurashtra
  { begin: 43264, end: 43311 },
  // Kayah Li
  { begin: 43312, end: 43359 },
  // Rejang
  { begin: 43520, end: 43615 },
  // Cham
  { begin: 65936, end: 65999 },
  // Ancient Symbols
  { begin: 66e3, end: 66047 },
  // Phaistos Disc
  { begin: 66208, end: 66271 },
  // Carian
  { begin: 127024, end: 127135 }
  // Domino Tiles
];
function dd(n) {
  for (let t = 0; t < aa.length; t += 1) {
    const e = aa[t];
    if (n >= e.begin && n < e.end)
      return t;
  }
  return -1;
}
function gd(n, t) {
  const e = {}, s = new z.Parser(n, t);
  e.version = s.parseUShort(), e.xAvgCharWidth = s.parseShort(), e.usWeightClass = s.parseUShort(), e.usWidthClass = s.parseUShort(), e.fsType = s.parseUShort(), e.ySubscriptXSize = s.parseShort(), e.ySubscriptYSize = s.parseShort(), e.ySubscriptXOffset = s.parseShort(), e.ySubscriptYOffset = s.parseShort(), e.ySuperscriptXSize = s.parseShort(), e.ySuperscriptYSize = s.parseShort(), e.ySuperscriptXOffset = s.parseShort(), e.ySuperscriptYOffset = s.parseShort(), e.yStrikeoutSize = s.parseShort(), e.yStrikeoutPosition = s.parseShort(), e.sFamilyClass = s.parseShort(), e.panose = [];
  for (let i = 0; i < 10; i++)
    e.panose[i] = s.parseByte();
  return e.ulUnicodeRange1 = s.parseULong(), e.ulUnicodeRange2 = s.parseULong(), e.ulUnicodeRange3 = s.parseULong(), e.ulUnicodeRange4 = s.parseULong(), e.achVendID = String.fromCharCode(s.parseByte(), s.parseByte(), s.parseByte(), s.parseByte()), e.fsSelection = s.parseUShort(), e.usFirstCharIndex = s.parseUShort(), e.usLastCharIndex = s.parseUShort(), e.sTypoAscender = s.parseShort(), e.sTypoDescender = s.parseShort(), e.sTypoLineGap = s.parseShort(), e.usWinAscent = s.parseUShort(), e.usWinDescent = s.parseUShort(), e.version >= 1 && (e.ulCodePageRange1 = s.parseULong(), e.ulCodePageRange2 = s.parseULong()), e.version >= 2 && (e.sxHeight = s.parseShort(), e.sCapHeight = s.parseShort(), e.usDefaultChar = s.parseUShort(), e.usBreakChar = s.parseUShort(), e.usMaxContent = s.parseUShort()), e;
}
function md(n) {
  return new L.Table("OS/2", [
    { name: "version", type: "USHORT", value: 3 },
    { name: "xAvgCharWidth", type: "SHORT", value: 0 },
    { name: "usWeightClass", type: "USHORT", value: 0 },
    { name: "usWidthClass", type: "USHORT", value: 0 },
    { name: "fsType", type: "USHORT", value: 0 },
    { name: "ySubscriptXSize", type: "SHORT", value: 650 },
    { name: "ySubscriptYSize", type: "SHORT", value: 699 },
    { name: "ySubscriptXOffset", type: "SHORT", value: 0 },
    { name: "ySubscriptYOffset", type: "SHORT", value: 140 },
    { name: "ySuperscriptXSize", type: "SHORT", value: 650 },
    { name: "ySuperscriptYSize", type: "SHORT", value: 699 },
    { name: "ySuperscriptXOffset", type: "SHORT", value: 0 },
    { name: "ySuperscriptYOffset", type: "SHORT", value: 479 },
    { name: "yStrikeoutSize", type: "SHORT", value: 49 },
    { name: "yStrikeoutPosition", type: "SHORT", value: 258 },
    { name: "sFamilyClass", type: "SHORT", value: 0 },
    { name: "bFamilyType", type: "BYTE", value: 0 },
    { name: "bSerifStyle", type: "BYTE", value: 0 },
    { name: "bWeight", type: "BYTE", value: 0 },
    { name: "bProportion", type: "BYTE", value: 0 },
    { name: "bContrast", type: "BYTE", value: 0 },
    { name: "bStrokeVariation", type: "BYTE", value: 0 },
    { name: "bArmStyle", type: "BYTE", value: 0 },
    { name: "bLetterform", type: "BYTE", value: 0 },
    { name: "bMidline", type: "BYTE", value: 0 },
    { name: "bXHeight", type: "BYTE", value: 0 },
    { name: "ulUnicodeRange1", type: "ULONG", value: 0 },
    { name: "ulUnicodeRange2", type: "ULONG", value: 0 },
    { name: "ulUnicodeRange3", type: "ULONG", value: 0 },
    { name: "ulUnicodeRange4", type: "ULONG", value: 0 },
    { name: "achVendID", type: "CHARARRAY", value: "XXXX" },
    { name: "fsSelection", type: "USHORT", value: 0 },
    { name: "usFirstCharIndex", type: "USHORT", value: 0 },
    { name: "usLastCharIndex", type: "USHORT", value: 0 },
    { name: "sTypoAscender", type: "SHORT", value: 0 },
    { name: "sTypoDescender", type: "SHORT", value: 0 },
    { name: "sTypoLineGap", type: "SHORT", value: 0 },
    { name: "usWinAscent", type: "USHORT", value: 0 },
    { name: "usWinDescent", type: "USHORT", value: 0 },
    { name: "ulCodePageRange1", type: "ULONG", value: 0 },
    { name: "ulCodePageRange2", type: "ULONG", value: 0 },
    { name: "sxHeight", type: "SHORT", value: 0 },
    { name: "sCapHeight", type: "SHORT", value: 0 },
    { name: "usDefaultChar", type: "USHORT", value: 0 },
    { name: "usBreakChar", type: "USHORT", value: 0 },
    { name: "usMaxContext", type: "USHORT", value: 0 }
  ], n);
}
var oa = { parse: gd, make: md, unicodeRanges: aa, getUnicodeRange: dd };
function yd(n, t) {
  const e = {}, s = new z.Parser(n, t);
  switch (e.version = s.parseVersion(), e.italicAngle = s.parseFixed(), e.underlinePosition = s.parseShort(), e.underlineThickness = s.parseShort(), e.isFixedPitch = s.parseULong(), e.minMemType42 = s.parseULong(), e.maxMemType42 = s.parseULong(), e.minMemType1 = s.parseULong(), e.maxMemType1 = s.parseULong(), e.version) {
    case 1:
      e.names = on.slice();
      break;
    case 2:
      e.numberOfGlyphs = s.parseUShort(), e.glyphNameIndex = new Array(e.numberOfGlyphs);
      for (let i = 0; i < e.numberOfGlyphs; i++)
        e.glyphNameIndex[i] = s.parseUShort();
      e.names = [];
      for (let i = 0; i < e.numberOfGlyphs; i++)
        if (e.glyphNameIndex[i] >= on.length) {
          const r = s.parseChar();
          e.names.push(s.parseString(r));
        }
      break;
    case 2.5:
      e.numberOfGlyphs = s.parseUShort(), e.offset = new Array(e.numberOfGlyphs);
      for (let i = 0; i < e.numberOfGlyphs; i++)
        e.offset[i] = s.parseChar();
      break;
  }
  return e;
}
function xd(n) {
  const {
    italicAngle: t = Math.round((n.italicAngle || 0) * 65536),
    underlinePosition: e = 0,
    underlineThickness: s = 0,
    isFixedPitch: i = 0,
    minMemType42: r = 0,
    maxMemType42: a = 0,
    minMemType1: o = 0,
    maxMemType1: c = 0
  } = n.tables.post || {};
  return new L.Table("post", [
    { name: "version", type: "FIXED", value: 196608 },
    { name: "italicAngle", type: "FIXED", value: t },
    { name: "underlinePosition", type: "FWORD", value: e },
    { name: "underlineThickness", type: "FWORD", value: s },
    { name: "isFixedPitch", type: "ULONG", value: i },
    { name: "minMemType42", type: "ULONG", value: r },
    { name: "maxMemType42", type: "ULONG", value: a },
    { name: "minMemType1", type: "ULONG", value: o },
    { name: "maxMemType1", type: "ULONG", value: c }
  ]);
}
var ll = { parse: yd, make: xd }, le = new Array(9);
le[1] = function() {
  const t = this.offset + this.relativeOffset, e = this.parseUShort();
  if (e === 1)
    return {
      substFormat: 1,
      coverage: this.parsePointer(A.coverage),
      deltaGlyphId: this.parseShort()
    };
  if (e === 2)
    return {
      substFormat: 2,
      coverage: this.parsePointer(A.coverage),
      substitute: this.parseOffset16List()
    };
  V.assert(!1, "0x" + t.toString(16) + ": lookup type 1 format must be 1 or 2.");
};
le[2] = function() {
  const t = this.parseUShort();
  return V.argument(t === 1, "GSUB Multiple Substitution Subtable identifier-format must be 1"), {
    substFormat: t,
    coverage: this.parsePointer(A.coverage),
    sequences: this.parseListOfLists()
  };
};
le[3] = function() {
  const t = this.parseUShort();
  return V.argument(t === 1, "GSUB Alternate Substitution Subtable identifier-format must be 1"), {
    substFormat: t,
    coverage: this.parsePointer(A.coverage),
    alternateSets: this.parseListOfLists()
  };
};
le[4] = function() {
  const t = this.parseUShort();
  return V.argument(t === 1, "GSUB ligature table identifier-format must be 1"), {
    substFormat: t,
    coverage: this.parsePointer(A.coverage),
    ligatureSets: this.parseListOfLists(function() {
      return {
        ligGlyph: this.parseUShort(),
        components: this.parseUShortList(this.parseUShort() - 1)
      };
    })
  };
};
var Un = {
  sequenceIndex: A.uShort,
  lookupListIndex: A.uShort
};
le[5] = function() {
  const t = this.offset + this.relativeOffset, e = this.parseUShort();
  if (e === 1)
    return {
      substFormat: e,
      coverage: this.parsePointer(A.coverage),
      ruleSets: this.parseListOfLists(function() {
        const s = this.parseUShort(), i = this.parseUShort();
        return {
          input: this.parseUShortList(s - 1),
          lookupRecords: this.parseRecordList(i, Un)
        };
      })
    };
  if (e === 2)
    return {
      substFormat: e,
      coverage: this.parsePointer(A.coverage),
      classDef: this.parsePointer(A.classDef),
      classSets: this.parseListOfLists(function() {
        const s = this.parseUShort(), i = this.parseUShort();
        return {
          classes: this.parseUShortList(s - 1),
          lookupRecords: this.parseRecordList(i, Un)
        };
      })
    };
  if (e === 3) {
    const s = this.parseUShort(), i = this.parseUShort();
    return {
      substFormat: e,
      coverages: this.parseList(s, A.pointer(A.coverage)),
      lookupRecords: this.parseRecordList(i, Un)
    };
  }
  V.assert(!1, "0x" + t.toString(16) + ": lookup type 5 format must be 1, 2 or 3.");
};
le[6] = function() {
  const t = this.offset + this.relativeOffset, e = this.parseUShort();
  if (e === 1)
    return {
      substFormat: 1,
      coverage: this.parsePointer(A.coverage),
      chainRuleSets: this.parseListOfLists(function() {
        return {
          backtrack: this.parseUShortList(),
          input: this.parseUShortList(this.parseShort() - 1),
          lookahead: this.parseUShortList(),
          lookupRecords: this.parseRecordList(Un)
        };
      })
    };
  if (e === 2)
    return {
      substFormat: 2,
      coverage: this.parsePointer(A.coverage),
      backtrackClassDef: this.parsePointer(A.classDef),
      inputClassDef: this.parsePointer(A.classDef),
      lookaheadClassDef: this.parsePointer(A.classDef),
      chainClassSet: this.parseListOfLists(function() {
        return {
          backtrack: this.parseUShortList(),
          input: this.parseUShortList(this.parseShort() - 1),
          lookahead: this.parseUShortList(),
          lookupRecords: this.parseRecordList(Un)
        };
      })
    };
  if (e === 3)
    return {
      substFormat: 3,
      backtrackCoverage: this.parseList(A.pointer(A.coverage)),
      inputCoverage: this.parseList(A.pointer(A.coverage)),
      lookaheadCoverage: this.parseList(A.pointer(A.coverage)),
      lookupRecords: this.parseRecordList(Un)
    };
  V.assert(!1, "0x" + t.toString(16) + ": lookup type 6 format must be 1, 2 or 3.");
};
le[7] = function() {
  const t = this.parseUShort();
  V.argument(t === 1, "GSUB Extension Substitution subtable identifier-format must be 1");
  const e = this.parseUShort(), s = new A(this.data, this.offset + this.parseULong());
  return {
    substFormat: 1,
    lookupType: e,
    extension: le[e].call(s)
  };
};
le[8] = function() {
  const t = this.parseUShort();
  return V.argument(t === 1, "GSUB Reverse Chaining Contextual Single Substitution Subtable identifier-format must be 1"), {
    substFormat: t,
    coverage: this.parsePointer(A.coverage),
    backtrackCoverage: this.parseList(A.pointer(A.coverage)),
    lookaheadCoverage: this.parseList(A.pointer(A.coverage)),
    substitutes: this.parseUShortList()
  };
};
function bd(n, t) {
  t = t || 0;
  const e = new A(n, t), s = e.parseVersion(1);
  return V.argument(s === 1 || s === 1.1, "Unsupported GSUB table version."), s === 1 ? {
    version: s,
    scripts: e.parseScriptList(),
    features: e.parseFeatureList(),
    lookups: e.parseLookupList(le)
  } : {
    version: s,
    scripts: e.parseScriptList(),
    features: e.parseFeatureList(),
    lookups: e.parseLookupList(le),
    variations: e.parseFeatureVariationsList()
  };
}
var mn = new Array(9);
mn[1] = function(t) {
  if (t.substFormat === 1)
    return new L.Table("substitutionTable", [
      { name: "substFormat", type: "USHORT", value: 1 },
      { name: "coverage", type: "TABLE", value: new L.Coverage(t.coverage) },
      { name: "deltaGlyphID", type: "SHORT", value: t.deltaGlyphId }
    ]);
  if (t.substFormat === 2)
    return new L.Table("substitutionTable", [
      { name: "substFormat", type: "USHORT", value: 2 },
      { name: "coverage", type: "TABLE", value: new L.Coverage(t.coverage) }
    ].concat(L.ushortList("substitute", t.substitute)));
  V.fail("Lookup type 1 substFormat must be 1 or 2.");
};
mn[2] = function(t) {
  return V.assert(t.substFormat === 1, "Lookup type 2 substFormat must be 1."), new L.Table("substitutionTable", [
    { name: "substFormat", type: "USHORT", value: 1 },
    { name: "coverage", type: "TABLE", value: new L.Coverage(t.coverage) }
  ].concat(L.tableList("seqSet", t.sequences, function(e) {
    return new L.Table("sequenceSetTable", L.ushortList("sequence", e));
  })));
};
mn[3] = function(t) {
  return V.assert(t.substFormat === 1, "Lookup type 3 substFormat must be 1."), new L.Table("substitutionTable", [
    { name: "substFormat", type: "USHORT", value: 1 },
    { name: "coverage", type: "TABLE", value: new L.Coverage(t.coverage) }
  ].concat(L.tableList("altSet", t.alternateSets, function(e) {
    return new L.Table("alternateSetTable", L.ushortList("alternate", e));
  })));
};
mn[4] = function(t) {
  return V.assert(t.substFormat === 1, "Lookup type 4 substFormat must be 1."), new L.Table("substitutionTable", [
    { name: "substFormat", type: "USHORT", value: 1 },
    { name: "coverage", type: "TABLE", value: new L.Coverage(t.coverage) }
  ].concat(L.tableList("ligSet", t.ligatureSets, function(e) {
    return new L.Table("ligatureSetTable", L.tableList("ligature", e, function(s) {
      return new L.Table(
        "ligatureTable",
        [{ name: "ligGlyph", type: "USHORT", value: s.ligGlyph }].concat(L.ushortList("component", s.components, s.components.length + 1))
      );
    }));
  })));
};
mn[5] = function(t) {
  if (t.substFormat === 1)
    return new L.Table("contextualSubstitutionTable", [
      { name: "substFormat", type: "USHORT", value: t.substFormat },
      { name: "coverage", type: "TABLE", value: new L.Coverage(t.coverage) }
    ].concat(L.tableList("sequenceRuleSet", t.ruleSets, function(e) {
      return e ? new L.Table("sequenceRuleSetTable", L.tableList("sequenceRule", e, function(s) {
        let i = L.ushortList("seqLookup", [], s.lookupRecords.length).concat(L.ushortList("inputSequence", s.input, s.input.length + 1));
        [i[0], i[1]] = [i[1], i[0]];
        for (let r = 0; r < s.lookupRecords.length; r++) {
          const a = s.lookupRecords[r];
          i = i.concat({ name: "sequenceIndex" + r, type: "USHORT", value: a.sequenceIndex }).concat({ name: "lookupListIndex" + r, type: "USHORT", value: a.lookupListIndex });
        }
        return new L.Table("sequenceRuleTable", i);
      })) : new L.Table("NULL", null);
    })));
  if (t.substFormat === 2)
    return new L.Table("contextualSubstitutionTable", [
      { name: "substFormat", type: "USHORT", value: t.substFormat },
      { name: "coverage", type: "TABLE", value: new L.Coverage(t.coverage) },
      { name: "classDef", type: "TABLE", value: new L.ClassDef(t.classDef) }
    ].concat(L.tableList("classSeqRuleSet", t.classSets, function(e) {
      return e ? new L.Table("classSeqRuleSetTable", L.tableList("classSeqRule", e, function(s) {
        let i = L.ushortList("classes", s.classes, s.classes.length + 1).concat(L.ushortList("seqLookupCount", [], s.lookupRecords.length));
        for (let r = 0; r < s.lookupRecords.length; r++) {
          const a = s.lookupRecords[r];
          i = i.concat({ name: "sequenceIndex" + r, type: "USHORT", value: a.sequenceIndex }).concat({ name: "lookupListIndex" + r, type: "USHORT", value: a.lookupListIndex });
        }
        return new L.Table("classSeqRuleTable", i);
      })) : new L.Table("NULL", null);
    })));
  if (t.substFormat === 3) {
    let e = [
      { name: "substFormat", type: "USHORT", value: t.substFormat }
    ];
    e.push({ name: "inputGlyphCount", type: "USHORT", value: t.coverages.length }), e.push({ name: "substitutionCount", type: "USHORT", value: t.lookupRecords.length });
    for (let i = 0; i < t.coverages.length; i++) {
      const r = t.coverages[i];
      e.push({ name: "inputCoverage" + i, type: "TABLE", value: new L.Coverage(r) });
    }
    for (let i = 0; i < t.lookupRecords.length; i++) {
      const r = t.lookupRecords[i];
      e = e.concat({ name: "sequenceIndex" + i, type: "USHORT", value: r.sequenceIndex }).concat({ name: "lookupListIndex" + i, type: "USHORT", value: r.lookupListIndex });
    }
    return new L.Table("contextualSubstitutionTable", e);
  }
  V.assert(!1, "lookup type 5 format must be 1, 2 or 3.");
};
mn[6] = function(t) {
  if (t.substFormat === 1)
    return new L.Table("chainContextTable", [
      { name: "substFormat", type: "USHORT", value: t.substFormat },
      { name: "coverage", type: "TABLE", value: new L.Coverage(t.coverage) }
    ].concat(L.tableList("chainRuleSet", t.chainRuleSets, function(s) {
      return new L.Table("chainRuleSetTable", L.tableList("chainRule", s, function(i) {
        let r = L.ushortList("backtrackGlyph", i.backtrack, i.backtrack.length).concat(L.ushortList("inputGlyph", i.input, i.input.length + 1)).concat(L.ushortList("lookaheadGlyph", i.lookahead, i.lookahead.length)).concat(L.ushortList("substitution", [], i.lookupRecords.length));
        for (let a = 0; a < i.lookupRecords.length; a++) {
          const o = i.lookupRecords[a];
          r = r.concat({ name: "sequenceIndex" + a, type: "USHORT", value: o.sequenceIndex }).concat({ name: "lookupListIndex" + a, type: "USHORT", value: o.lookupListIndex });
        }
        return new L.Table("chainRuleTable", r);
      }));
    })));
  if (t.substFormat === 2)
    V.assert(!1, "lookup type 6 format 2 is not yet supported.");
  else if (t.substFormat === 3) {
    let e = [
      { name: "substFormat", type: "USHORT", value: t.substFormat }
    ];
    e.push({ name: "backtrackGlyphCount", type: "USHORT", value: t.backtrackCoverage.length });
    for (let i = 0; i < t.backtrackCoverage.length; i++) {
      const r = t.backtrackCoverage[i];
      e.push({ name: "backtrackCoverage" + i, type: "TABLE", value: new L.Coverage(r) });
    }
    e.push({ name: "inputGlyphCount", type: "USHORT", value: t.inputCoverage.length });
    for (let i = 0; i < t.inputCoverage.length; i++) {
      const r = t.inputCoverage[i];
      e.push({ name: "inputCoverage" + i, type: "TABLE", value: new L.Coverage(r) });
    }
    e.push({ name: "lookaheadGlyphCount", type: "USHORT", value: t.lookaheadCoverage.length });
    for (let i = 0; i < t.lookaheadCoverage.length; i++) {
      const r = t.lookaheadCoverage[i];
      e.push({ name: "lookaheadCoverage" + i, type: "TABLE", value: new L.Coverage(r) });
    }
    e.push({ name: "substitutionCount", type: "USHORT", value: t.lookupRecords.length });
    for (let i = 0; i < t.lookupRecords.length; i++) {
      const r = t.lookupRecords[i];
      e = e.concat({ name: "sequenceIndex" + i, type: "USHORT", value: r.sequenceIndex }).concat({ name: "lookupListIndex" + i, type: "USHORT", value: r.lookupListIndex });
    }
    return new L.Table("chainContextTable", e);
  }
  V.assert(!1, "lookup type 6 format must be 1, 2 or 3.");
};
function vd(n) {
  return new L.Table("GSUB", [
    { name: "version", type: "ULONG", value: 65536 },
    { name: "scripts", type: "TABLE", value: new L.ScriptList(n.scripts) },
    { name: "features", type: "TABLE", value: new L.FeatureList(n.features) },
    { name: "lookups", type: "TABLE", value: new L.LookupList(n.lookups, mn) }
  ]);
}
var ul = { parse: bd, make: vd };
function Sd(n, t) {
  const e = new z.Parser(n, t), s = e.parseULong();
  V.argument(s === 1, "Unsupported META table version."), e.parseULong(), e.parseULong();
  const i = e.parseULong(), r = {};
  for (let a = 0; a < i; a++) {
    const o = e.parseTag(), c = e.parseULong(), h = e.parseULong();
    if (o === "appl" || o === "bild")
      continue;
    const l = Gn.UTF8(n, t + c, h);
    r[o] = l;
  }
  return r;
}
function wd(n) {
  const t = Object.keys(n).length;
  let e = "";
  const s = 16 + t * 12, i = new L.Table("meta", [
    { name: "version", type: "ULONG", value: 1 },
    { name: "flags", type: "ULONG", value: 0 },
    { name: "offset", type: "ULONG", value: s },
    { name: "numTags", type: "ULONG", value: t }
  ]);
  for (let r in n) {
    const a = e.length;
    e += n[r], i.fields.push({ name: "tag " + r, type: "TAG", value: r }), i.fields.push({ name: "offset " + r, type: "ULONG", value: s + a }), i.fields.push({ name: "length " + r, type: "ULONG", value: n[r].length });
  }
  return i.fields.push({ name: "stringPool", type: "CHARARRAY", value: e }), i;
}
var fl = { parse: Sd, make: wd };
function Cd(n, t) {
  const e = new A(n, t), s = e.parseUShort();
  s !== 0 && console.warn("Only COLRv0 is currently fully supported. A subset of color glyphs might be available in this font if provided in the v0 format.");
  const i = e.parseUShort(), r = e.parseOffset32(), a = e.parseOffset32(), o = e.parseUShort();
  e.relativeOffset = r;
  const c = e.parseRecordList(i, {
    glyphID: A.uShort,
    firstLayerIndex: A.uShort,
    numLayers: A.uShort
  });
  e.relativeOffset = a;
  const h = e.parseRecordList(o, {
    glyphID: A.uShort,
    paletteIndex: A.uShort
  });
  return {
    version: s,
    baseGlyphRecords: c,
    layerRecords: h
  };
}
function Td({ version: n = 0, baseGlyphRecords: t = [], layerRecords: e = [] }) {
  V.argument(n === 0, "Only COLRv0 supported.");
  const s = 14, i = s + t.length * 6;
  return new L.Table("COLR", [
    { name: "version", type: "USHORT", value: n },
    { name: "numBaseGlyphRecords", type: "USHORT", value: t.length },
    { name: "baseGlyphRecordsOffset", type: "ULONG", value: s },
    { name: "layerRecordsOffset", type: "ULONG", value: i },
    { name: "numLayerRecords", type: "USHORT", value: e.length },
    ...t.map((r, a) => [
      { name: "glyphID_" + a, type: "USHORT", value: r.glyphID },
      { name: "firstLayerIndex_" + a, type: "USHORT", value: r.firstLayerIndex },
      { name: "numLayers_" + a, type: "USHORT", value: r.numLayers }
    ]).flat(),
    ...e.map((r, a) => [
      { name: "LayerGlyphID_" + a, type: "USHORT", value: r.glyphID },
      { name: "paletteIndex_" + a, type: "USHORT", value: r.paletteIndex }
    ]).flat()
  ]);
}
var pl = { parse: Cd, make: Td };
function Fd(n, t) {
  return [
    { name: "tag_" + n, type: "TAG", value: t.tag },
    { name: "minValue_" + n, type: "FIXED", value: t.minValue << 16 },
    { name: "defaultValue_" + n, type: "FIXED", value: t.defaultValue << 16 },
    { name: "maxValue_" + n, type: "FIXED", value: t.maxValue << 16 },
    { name: "flags_" + n, type: "USHORT", value: 0 },
    { name: "nameID_" + n, type: "USHORT", value: t.axisNameID }
  ];
}
function Ad(n, t, e) {
  const s = {}, i = new z.Parser(n, t);
  s.tag = i.parseTag(), s.minValue = i.parseFixed(), s.defaultValue = i.parseFixed(), s.maxValue = i.parseFixed(), i.skip("uShort", 1);
  const r = i.parseUShort();
  return s.axisNameID = r, s.name = Ai(e, r), s;
}
function kd(n, t, e, s = {}) {
  const i = [
    { name: "nameID_" + n, type: "USHORT", value: t.subfamilyNameID },
    { name: "flags_" + n, type: "USHORT", value: 0 }
  ];
  for (let r = 0; r < e.length; ++r) {
    const a = e[r].tag;
    i.push({
      name: "axis_" + n + " " + a,
      type: "FIXED",
      value: t.coordinates[a] << 16
    });
  }
  return s && s.postScriptNameID && i.push({
    name: "postScriptNameID_",
    type: "USHORT",
    value: t.postScriptNameID !== void 0 ? t.postScriptNameID : 65535
  }), i;
}
function Ed(n, t, e, s, i) {
  const r = {}, a = new z.Parser(n, t), o = a.parseUShort();
  r.subfamilyNameID = o, r.name = Ai(s, o, [2, 17]), a.skip("uShort", 1), r.coordinates = {};
  for (let h = 0; h < e.length; ++h)
    r.coordinates[e[h].tag] = a.parseFixed();
  if (a.relativeOffset === i)
    return r.postScriptNameID = void 0, r.postScriptName = void 0, r;
  const c = a.parseUShort();
  return r.postScriptNameID = c == 65535 ? void 0 : c, r.postScriptName = r.postScriptNameID !== void 0 ? Ai(s, c, [6]) : "", r;
}
function Md(n, t) {
  const e = new L.Table("fvar", [
    { name: "version", type: "ULONG", value: 65536 },
    { name: "offsetToData", type: "USHORT", value: 0 },
    { name: "countSizePairs", type: "USHORT", value: 2 },
    { name: "axisCount", type: "USHORT", value: n.axes.length },
    { name: "axisSize", type: "USHORT", value: 20 },
    { name: "instanceCount", type: "USHORT", value: n.instances.length },
    { name: "instanceSize", type: "USHORT", value: 4 + n.axes.length * 4 }
  ]);
  e.offsetToData = e.sizeOf();
  for (let i = 0; i < n.axes.length; i++)
    e.fields = e.fields.concat(Fd(i, n.axes[i]));
  const s = {};
  for (let i = 0; i < n.instances.length; i++)
    if (n.instances[i].postScriptNameID !== void 0) {
      e.instanceSize += 2, s.postScriptNameID = !0;
      break;
    }
  for (let i = 0; i < n.instances.length; i++)
    e.fields = e.fields.concat(kd(
      i,
      n.instances[i],
      n.axes,
      s
    ));
  return e;
}
function Od(n, t, e) {
  const s = new z.Parser(n, t), i = s.parseULong();
  V.argument(i === 65536, "Unsupported fvar table version.");
  const r = s.parseOffset16();
  s.skip("uShort", 1);
  const a = s.parseUShort(), o = s.parseUShort(), c = s.parseUShort(), h = s.parseUShort(), l = [];
  for (let p = 0; p < a; p++)
    l.push(Ad(n, t + r + p * o, e));
  const u = [], f = t + r + a * o;
  for (let p = 0; p < c; p++)
    u.push(Ed(n, f + p * h, l, e, h));
  return { axes: l, instances: u };
}
var dl = { make: Md, parse: Od }, _d = {
  tag: A.tag,
  nameID: A.uShort,
  ordering: A.uShort
}, ws = new Array(5);
ws[1] = function() {
  return {
    axisIndex: this.parseUShort(),
    flags: this.parseUShort(),
    valueNameID: this.parseUShort(),
    value: this.parseFixed()
  };
};
ws[2] = function() {
  return {
    axisIndex: this.parseUShort(),
    flags: this.parseUShort(),
    valueNameID: this.parseUShort(),
    nominalValue: this.parseFixed(),
    rangeMinValue: this.parseFixed(),
    rangeMaxValue: this.parseFixed()
  };
};
ws[3] = function() {
  return {
    axisIndex: this.parseUShort(),
    flags: this.parseUShort(),
    valueNameID: this.parseUShort(),
    value: this.parseFixed(),
    linkedValue: this.parseFixed()
  };
};
ws[4] = function() {
  const t = this.parseUShort();
  return {
    flags: this.parseUShort(),
    valueNameID: this.parseUShort(),
    axisValues: this.parseList(t, function() {
      return {
        axisIndex: this.parseUShort(),
        value: this.parseFixed()
      };
    })
  };
};
function Ld() {
  const n = this.parseUShort(), t = ws[n], e = {
    format: n
  };
  return t === void 0 ? (console.warn(`Unknown axis value table format ${n}`), e) : Object.assign(e, this.parseStruct(t.bind(this)));
}
function Id(n, t, e) {
  t || (t = 0);
  const s = new z.Parser(n, t), i = s.parseUShort(), r = s.parseUShort();
  i !== 1 && console.warn(`Unsupported STAT table version ${i}.${r}`);
  const a = [
    i,
    r
  ], o = s.parseUShort(), c = s.parseUShort(), h = s.parseOffset32(), l = s.parseUShort(), u = s.parseOffset32(), f = i > 1 || r > 0 ? s.parseUShort() : void 0;
  e !== void 0 && V.argument(c >= e.axes.length, "STAT axis count must be greater than or equal to fvar axis count"), l > 0 && V.argument(c >= 0, "STAT axis count must be greater than 0 if STAT axis value count is greater than 0");
  const p = [];
  for (let x = 0; x < c; x++)
    s.offset = t + h, s.relativeOffset = x * o, p.push(s.parseStruct(_d));
  s.offset = t, s.relativeOffset = u;
  const d = s.parseUShortList(l), g = [];
  for (let x = 0; x < l; x++)
    s.offset = t + u, s.relativeOffset = d[x], g.push(Ld.apply(s));
  return {
    version: a,
    axes: p,
    values: g,
    elidedFallbackNameID: f
  };
}
var Cs = new Array(5);
Cs[1] = function(t, e) {
  return [
    { name: `format${t}`, type: "USHORT", value: 1 },
    { name: `axisIndex${t}`, type: "USHORT", value: e.axisIndex },
    { name: `flags${t}`, type: "USHORT", value: e.flags },
    { name: `valueNameID${t}`, type: "USHORT", value: e.valueNameID },
    { name: `value${t}`, type: "FLOAT", value: e.value }
  ];
};
Cs[2] = function(t, e) {
  return [
    { name: `format${t}`, type: "USHORT", value: 2 },
    { name: `axisIndex${t}`, type: "USHORT", value: e.axisIndex },
    { name: `flags${t}`, type: "USHORT", value: e.flags },
    { name: `valueNameID${t}`, type: "USHORT", value: e.valueNameID },
    { name: `nominalValue${t}`, type: "FLOAT", value: e.nominalValue },
    { name: `rangeMinValue${t}`, type: "FLOAT", value: e.rangeMinValue },
    { name: `rangeMaxValue${t}`, type: "FLOAT", value: e.rangeMaxValue }
  ];
};
Cs[3] = function(t, e) {
  return [
    { name: `format${t}`, type: "USHORT", value: 3 },
    { name: `axisIndex${t}`, type: "USHORT", value: e.axisIndex },
    { name: `flags${t}`, type: "USHORT", value: e.flags },
    { name: `valueNameID${t}`, type: "USHORT", value: e.valueNameID },
    { name: `value${t}`, type: "FLOAT", value: e.value },
    { name: `linkedValue${t}`, type: "FLOAT", value: e.linkedValue }
  ];
};
Cs[4] = function(t, e) {
  let s = [
    { name: `format${t}`, type: "USHORT", value: 4 },
    { name: `axisCount${t}`, type: "USHORT", value: e.axisValues.length },
    { name: `flags${t}`, type: "USHORT", value: e.flags },
    { name: `valueNameID${t}`, type: "USHORT", value: e.valueNameID }
  ];
  for (let i = 0; i < e.axisValues.length; i++)
    s = s.concat([
      { name: `format${t}axisIndex${i}`, type: "USHORT", value: e.axisValues[i].axisIndex },
      { name: `format${t}value${i}`, type: "FLOAT", value: e.axisValues[i].value }
    ]);
  return s;
};
function Bd(n, t) {
  return new L.Record("axisRecord_" + n, [
    { name: "axisTag_" + n, type: "TAG", value: t.tag },
    { name: "axisNameID_" + n, type: "USHORT", value: t.nameID },
    { name: "axisOrdering_" + n, type: "USHORT", value: t.ordering }
  ]);
}
function Rd(n, t) {
  const e = t.format, s = Cs[e];
  V.argument(s !== void 0, `Unknown axis value table format ${e}`);
  const i = s(n, t);
  return new L.Table("axisValueTable_" + n, i);
}
function Dd(n) {
  const t = new L.Table("STAT", [
    { name: "majorVersion", type: "USHORT", value: 1 },
    { name: "minorVersion", type: "USHORT", value: 2 },
    { name: "designAxisSize", type: "USHORT", value: 8 },
    { name: "designAxisCount", type: "USHORT", value: n.axes.length },
    { name: "designAxesOffset", type: "ULONG", value: 0 },
    { name: "axisValueCount", type: "USHORT", value: n.values.length },
    { name: "offsetToAxisValueOffsets", type: "ULONG", value: 0 },
    { name: "elidedFallbackNameID", type: "USHORT", value: n.elidedFallbackNameID }
  ]);
  t.designAxesOffset = t.offsetToAxisValueOffsets = t.sizeOf();
  for (let r = 0; r < n.axes.length; r++) {
    const a = Bd(r, n.axes[r]);
    t.offsetToAxisValueOffsets += a.sizeOf(), t.fields = t.fields.concat(a.fields);
  }
  const e = [];
  let s = [], i = n.values.length * 2;
  for (let r = 0; r < n.values.length; r++) {
    const a = Rd(r, n.values[r]);
    e.push({
      name: "offset_" + r,
      type: "USHORT",
      value: i
    }), i += a.sizeOf(), s = s.concat(a.fields);
  }
  return t.fields = t.fields.concat(e), t.fields = t.fields.concat(s), t;
}
var gl = { make: Dd, parse: Id };
function Ud(n, t) {
  return new L.Record("axisValueMap_" + n, [
    { name: "fromCoordinate_" + n, type: "F2DOT14", value: t.fromCoordinate },
    { name: "toCoordinate_" + n, type: "F2DOT14", value: t.toCoordinate }
  ]);
}
function Pd(n, t) {
  const e = new L.Record("segmentMap_" + n, [
    { name: "positionMapCount_" + n, type: "USHORT", value: t.axisValueMaps.length }
  ]);
  let s = [];
  for (let i = 0; i < t.axisValueMaps.length; i++) {
    const r = Ud(`${n}_${i}`, t.axisValueMaps[i]);
    s = s.concat(r.fields);
  }
  return e.fields = e.fields.concat(s), e;
}
function Nd(n, t) {
  V.argument(n.axisSegmentMaps.length === t.axes.length, "avar axis count must correspond to fvar axis count");
  const e = new L.Table("avar", [
    { name: "majorVersion", type: "USHORT", value: 1 },
    { name: "minorVersion", type: "USHORT", value: 0 },
    { name: "reserved", type: "USHORT", value: 0 },
    { name: "axisCount", type: "USHORT", value: n.axisSegmentMaps.length }
  ]);
  for (let s = 0; s < n.axisSegmentMaps.length; s++) {
    const i = Pd(s, n.axisSegmentMaps[s]);
    e.fields = e.fields.concat(i.fields);
  }
  return e;
}
function zd(n, t, e) {
  t || (t = 0);
  const s = new A(n, t), i = s.parseUShort(), r = s.parseUShort();
  i !== 1 && console.warn(`Unsupported avar table version ${i}.${r}`), s.skip("uShort", 1);
  const a = s.parseUShort();
  V.argument(a === e.axes.length, "avar axis count must correspond to fvar axis count");
  const o = [];
  for (let c = 0; c < a; c++) {
    const h = [], l = s.parseUShort();
    for (let u = 0; u < l; u++) {
      const f = s.parseF2Dot14(), p = s.parseF2Dot14();
      h.push({
        fromCoordinate: f,
        toCoordinate: p
      });
    }
    o.push({
      axisValueMaps: h
    });
  }
  return {
    version: [i, r],
    axisSegmentMaps: o
  };
}
var ml = { make: Nd, parse: zd };
function Hd(n, t, e, s) {
  const i = new z.Parser(n, t), r = i.parseTupleVariationStore(
    i.relativeOffset,
    e.axes.length,
    "cvar",
    s
  ), a = i.parseUShort(), o = i.parseUShort();
  return a !== 1 && console.warn(`Unsupported cvar table version ${a}.${o}`), {
    version: [a, o],
    ...r
  };
}
function Gd() {
  console.warn("Writing of cvar tables is not yet supported.");
}
var yl = { make: Gd, parse: Hd };
function Vd(n, t, e, s) {
  const i = new z.Parser(n, t), r = i.parseUShort(), a = i.parseUShort();
  r !== 1 && console.warn(`Unsupported gvar table version ${r}.${a}`);
  const o = i.parseUShort();
  o !== e.axes.length && console.warn(`axisCount ${o} in gvar table does not match the number of axes ${e.axes.length} in the fvar table!`);
  const c = i.parseUShort(), h = i.parsePointer32(function() {
    return this.parseTupleRecords(c, o);
  }), l = i.parseTupleVariationStoreList(o, "gvar", s);
  return {
    version: [r, a],
    sharedTuples: h,
    glyphVariations: l
  };
}
function Wd() {
  console.warn("Writing of gvar tables is not yet supported.");
}
var xl = { make: Wd, parse: Vd };
function qd(n, t) {
  const e = {}, s = new z.Parser(n, t);
  e.version = s.parseUShort(), V.argument(e.version <= 1, "Unsupported gasp table version."), e.numRanges = s.parseUShort(), e.gaspRanges = [];
  for (let i = 0; i < e.numRanges; i++)
    e.gaspRanges[i] = {
      rangeMaxPPEM: s.parseUShort(),
      rangeGaspBehavior: s.parseUShort()
    };
  return e;
}
function jd(n) {
  const t = new L.Table("gasp", [
    { name: "version", type: "USHORT", value: 1 },
    { name: "numRanges", type: "USHORT", value: n.numRanges }
  ]);
  for (let e in n.gaspRanges)
    t.fields.push({ name: "rangeMaxPPEM", type: "USHORT", value: n.gaspRanges[e].rangeMaxPPEM }), t.fields.push({ name: "rangeGaspBehavior", type: "USHORT", value: n.gaspRanges[e].rangeGaspBehavior });
  return t;
}
var bl = { parse: qd, make: jd };
function Xd(n, t) {
  const e = /* @__PURE__ */ new Map(), s = n.buffer, i = new A(n, t);
  if (i.parseUShort() !== 0) return e;
  i.relativeOffset = i.parseOffset32();
  const a = n.byteOffset + t + i.relativeOffset, o = i.parseUShort(), c = /* @__PURE__ */ new Map();
  for (let h = 0; h < o; h++) {
    const l = i.parseUShort(), u = i.parseUShort(), f = a + i.parseOffset32(), p = i.parseULong();
    let d = c.get(f);
    d === void 0 && (d = new Uint8Array(s, f, p), c.set(f, d));
    for (let g = l; g <= u; g++)
      e.set(g, d);
  }
  return e;
}
function Yd(n) {
  const t = Array.from(n.keys()).sort(), e = [], s = [], i = /* @__PURE__ */ new Map();
  let r = 0, a = { endGlyphID: null };
  for (let f = 0, p = t.length; f < p; f++) {
    const d = t[f], g = n.get(d);
    let x = i.get(g);
    x === void 0 && (x = r, s.push(g), i.set(g, x), r += g.byteLength), d - 1 === a.endGlyphID && x === a.svgDocOffset ? a.endGlyphID = d : (a = {
      startGlyphID: d,
      endGlyphID: d,
      svgDocOffset: x,
      svgDocLength: g.byteLength
    }, e.push(a));
  }
  const o = e.length, c = s.length, h = 2 + o * 12, l = new Array(4 + o * 4 + c);
  let u = 0;
  l[u++] = { name: "version", type: "USHORT", value: 0 }, l[u++] = { name: "svgDocumentListOffset", type: "ULONG", value: 10 }, l[u++] = { name: "reserved", type: "ULONG", value: 0 }, l[u++] = { name: "numEntries", type: "USHORT", value: o };
  for (let f = 0; f < o; f++) {
    const p = "documentRecord_" + f, { startGlyphID: d, endGlyphID: g, svgDocOffset: x, svgDocLength: b } = e[f];
    l[u++] = { name: p + "_startGlyphID", type: "USHORT", value: d }, l[u++] = { name: p + "_endGlyphID", type: "USHORT", value: g }, l[u++] = { name: p + "_svgDocOffset", type: "ULONG", value: h + x }, l[u++] = { name: p + "_svgDocLength", type: "ULONG", value: b };
  }
  for (let f = 0; f < c; f++)
    l[u++] = { name: "svgDoc_" + f, type: "LITERAL", value: s[f] };
  return new L.Table("SVG ", l);
}
var vl = {
  make: Yd,
  parse: Xd
};
function qo(n) {
  return Math.log(n) / Math.log(2) | 0;
}
function Ca(n) {
  for (; n.length % 4 !== 0; )
    n.push(0);
  let t = 0;
  for (let e = 0; e < n.length; e += 4)
    t += (n[e] << 24) + (n[e + 1] << 16) + (n[e + 2] << 8) + n[e + 3];
  return t %= Math.pow(2, 32), t;
}
function jo(n, t, e, s) {
  return new L.Record("Table Record", [
    { name: "tag", type: "TAG", value: n !== void 0 ? n : "" },
    { name: "checkSum", type: "ULONG", value: t !== void 0 ? t : 0 },
    { name: "offset", type: "ULONG", value: e !== void 0 ? e : 0 },
    { name: "length", type: "ULONG", value: s !== void 0 ? s : 0 }
  ]);
}
function Sl(n) {
  const t = new L.Table("sfnt", [
    { name: "version", type: "TAG", value: "OTTO" },
    { name: "numTables", type: "USHORT", value: 0 },
    { name: "searchRange", type: "USHORT", value: 0 },
    { name: "entrySelector", type: "USHORT", value: 0 },
    { name: "rangeShift", type: "USHORT", value: 0 }
  ]);
  t.tables = n, t.numTables = n.length;
  const e = Math.pow(2, qo(t.numTables));
  t.searchRange = 16 * e, t.entrySelector = qo(e), t.rangeShift = t.numTables * 16 - t.searchRange;
  const s = [], i = [];
  let r = t.sizeOf() + jo().sizeOf() * t.numTables;
  for (; r % 4 !== 0; )
    r += 1, i.push({ name: "padding", type: "BYTE", value: 0 });
  for (let a = 0; a < n.length; a += 1) {
    const o = n[a];
    V.argument(o.tableName.length === 4, "Table name" + o.tableName + " is invalid.");
    const c = o.sizeOf(), h = jo(o.tableName, Ca(o.encode()), r, c);
    for (s.push({ name: h.tag + " Table Record", type: "RECORD", value: h }), i.push({ name: o.tableName + " table", type: "RECORD", value: o }), r += c, V.argument(!isNaN(r), "Something went wrong calculating the offset."); r % 4 !== 0; )
      r += 1, i.push({ name: "padding", type: "BYTE", value: 0 });
  }
  return s.sort(function(a, o) {
    return a.value.tag > o.value.tag ? 1 : -1;
  }), t.fields = t.fields.concat(s), t.fields = t.fields.concat(i), t;
}
function Xo(n, t, e) {
  for (let s = 0; s < t.length; s += 1) {
    const i = n.charToGlyphIndex(t[s]);
    if (i > 0)
      return n.glyphs.get(i).getMetrics();
  }
  return e;
}
function $d(n) {
  let t = 0;
  for (let e = 0; e < n.length; e += 1)
    t += n[e];
  return t / n.length;
}
function Zd(n) {
  const t = [], e = [], s = [], i = [], r = [], a = [], o = [];
  let c, h = 0, l = 0, u = 0, f = 0, p = 0;
  for (let Q = 0; Q < n.glyphs.length; Q += 1) {
    const kt = n.glyphs.get(Q), Pt = kt.unicode | 0;
    if (isNaN(kt.advanceWidth))
      throw new Error("Glyph " + kt.name + " (" + Q + "): advanceWidth is not a number.");
    (c > Pt || c === void 0) && Pt > 0 && (c = Pt), h < Pt && (h = Pt);
    const Nt = oa.getUnicodeRange(Pt);
    if (Nt < 32)
      l |= 1 << Nt;
    else if (Nt < 64)
      u |= 1 << Nt - 32;
    else if (Nt < 96)
      f |= 1 << Nt - 64;
    else if (Nt < 123)
      p |= 1 << Nt - 96;
    else
      throw new Error("Unicode ranges bits > 123 are reserved for internal usage");
    if (kt.name === ".notdef") continue;
    const zt = kt.getMetrics();
    t.push(zt.xMin), e.push(zt.yMin), s.push(zt.xMax), i.push(zt.yMax), a.push(zt.leftSideBearing), o.push(zt.rightSideBearing), r.push(kt.advanceWidth);
  }
  const d = {
    xMin: Math.min.apply(null, t),
    yMin: Math.min.apply(null, e),
    xMax: Math.max.apply(null, s),
    yMax: Math.max.apply(null, i),
    advanceWidthMax: Math.max.apply(null, r),
    advanceWidthAvg: $d(r),
    minLeftSideBearing: Math.min.apply(null, a),
    maxLeftSideBearing: Math.max.apply(null, a),
    minRightSideBearing: Math.min.apply(null, o)
  };
  d.ascender = n.ascender, d.descender = n.descender;
  let g = 0;
  n.weightClass >= 600 && (g |= n.macStyleValues.BOLD), n.italicAngle < 0 && (g |= n.macStyleValues.ITALIC);
  const x = rl.make({
    flags: 3,
    // 00000011 (baseline for font at y=0; left sidebearing point at x=0)
    unitsPerEm: n.unitsPerEm,
    xMin: d.xMin,
    yMin: d.yMin,
    xMax: d.xMax,
    yMax: d.yMax,
    lowestRecPPEM: 3,
    macStyle: g,
    createdTimestamp: n.createdTimestamp
  }), b = al.make({
    ascender: d.ascender,
    descender: d.descender,
    advanceWidthMax: d.advanceWidthMax,
    minLeftSideBearing: d.minLeftSideBearing,
    minRightSideBearing: d.minRightSideBearing,
    xMaxExtent: d.maxLeftSideBearing + (d.xMax - d.xMin),
    numberOfHMetrics: n.glyphs.length
  }), v = hl.make(n.glyphs.length), S = oa.make(Object.assign({
    xAvgCharWidth: Math.round(d.advanceWidthAvg),
    usFirstCharIndex: c,
    usLastCharIndex: h,
    ulUnicodeRange1: l,
    ulUnicodeRange2: u,
    ulUnicodeRange3: f,
    ulUnicodeRange4: p,
    // See http://typophile.com/node/13081 for more info on vertical metrics.
    // We get metrics for typical characters (such as "x" for xHeight).
    // We provide some fallback characters if characters are unavailable: their
    // ordering was chosen experimentally.
    sTypoAscender: d.ascender,
    sTypoDescender: d.descender,
    sTypoLineGap: 0,
    usWinAscent: d.yMax,
    usWinDescent: Math.abs(d.yMin),
    ulCodePageRange1: 1,
    // FIXME: hard-code Latin 1 support for now
    sxHeight: Xo(n, "xyvw", { yMax: Math.round(d.ascender / 2) }).yMax,
    sCapHeight: Xo(n, "HIKLEFJMNTZBDPRAGOQSUVWXY", d).yMax,
    usDefaultChar: n.hasChar(" ") ? 32 : 0,
    // Use space as the default character, if available.
    usBreakChar: n.hasChar(" ") ? 32 : 0
    // Use space as the break character, if available.
  }, n.tables.os2)), w = ol.make(n.glyphs), F = jh.make(n.glyphs), O = n.getEnglishName("fontFamily"), M = n.getEnglishName("fontSubfamily"), I = O + " " + M;
  let H = n.getEnglishName("postScriptName");
  H || (H = O.replace(/\s/g, "") + "-" + M);
  const R = {};
  for (let Q in n.names)
    R[Q] = n.names[Q];
  R.unicode = R.unicode || {}, R.macintosh = R.macintosh || {}, R.windows = R.windows || {};
  const W = n.names.unicode || {}, J = n.names.macintosh || {}, D = n.names.windows || {};
  for (const Q in R) {
    if (R[Q] = R[Q] || {}, !R[Q].uniqueID) {
      const kt = n.getEnglishName("manufacturer") || "";
      R[Q].uniqueID = { en: `${kt}: ${I}` };
    }
    R[Q].postScriptName || (R[Q].postScriptName = { en: H });
  }
  R.unicode.preferredFamily || (R.unicode.preferredFamily = W.fontFamily || J.fontFamily || D.fontFamily), R.macintosh.preferredFamily || (R.macintosh.preferredFamily = J.fontFamily || W.fontFamily || D.fontFamily), R.windows.preferredFamily || (R.windows.preferredFamily = D.fontFamily || W.fontFamily || J.fontFamily), R.unicode.preferredSubfamily || (R.unicode.preferredSubfamily = W.fontSubfamily || J.fontSubfamily || D.fontSubfamily), R.macintosh.preferredSubfamily || (R.macintosh.preferredSubfamily = J.fontSubfamily || W.fontSubfamily || D.fontSubfamily), R.windows.preferredSubfamily || (R.windows.preferredSubfamily = D.fontSubfamily || W.fontSubfamily || J.fontSubfamily);
  const U = [], P = qh.make(R, U), K = U.length > 0 ? cl.make(U) : void 0, yt = ll.make(n), Ut = ra.make(n.glyphs, {
    version: n.getEnglishName("version"),
    fullName: I,
    familyName: O,
    weightName: M,
    postScriptName: H,
    unitsPerEm: n.unitsPerEm,
    fontBBox: [0, d.yMin, d.ascender, d.advanceWidthMax],
    topDict: n.tables.cff && n.tables.cff.topDict || {}
  }), Ct = n.metas && Object.keys(n.metas).length > 0 ? fl.make(n.metas) : void 0, at = [x, b, v, S, P, F, yt, Ut, w];
  K && at.push(K);
  const j = {
    gsub: ul,
    cpal: Kh,
    colr: pl,
    stat: gl,
    avar: ml,
    cvar: yl,
    fvar: dl,
    gvar: xl,
    gasp: bl,
    svg: vl
  }, rt = {
    avar: [n.tables.fvar],
    fvar: [n.names]
  };
  for (let Q in j) {
    const kt = n.tables[Q];
    if (kt) {
      const Pt = j[Q].make.call(n, kt, ...rt[Q] || []);
      Pt && at.push(Pt);
    }
  }
  Ct && at.push(Ct);
  const bt = Sl(at), At = bt.encode(), St = Ca(At), Tt = bt.fields;
  let lt = !1;
  for (let Q = 0; Q < Tt.length; Q += 1)
    if (Tt[Q].name === "head table") {
      Tt[Q].value.checkSumAdjustment = 2981146554 - St, lt = !0;
      break;
    }
  if (!lt)
    throw new Error("Could not find head table with checkSum to adjust.");
  return bt;
}
var Jd = { make: Sl, fontToTable: Zd, computeCheckSum: Ca };
function Sr(n, t) {
  let e = 0, s = n.length - 1;
  for (; e <= s; ) {
    const i = e + s >>> 1, r = n[i].tag;
    if (r === t)
      return i;
    r < t ? e = i + 1 : s = i - 1;
  }
  return -e - 1;
}
function Yo(n, t) {
  let e = 0, s = n.length - 1;
  for (; e <= s; ) {
    const i = e + s >>> 1, r = n[i];
    if (r === t)
      return i;
    r < t ? e = i + 1 : s = i - 1;
  }
  return -e - 1;
}
function $o(n, t) {
  let e, s = 0, i = n.length - 1;
  for (; s <= i; ) {
    const r = s + i >>> 1;
    e = n[r];
    const a = e.start;
    if (a === t)
      return e;
    a < t ? s = r + 1 : i = r - 1;
  }
  if (s > 0)
    return e = n[s - 1], t > e.end ? 0 : e;
}
function wl(n, t) {
  this.font = n, this.tableName = t;
}
wl.prototype = {
  /**
   * Binary search an object by "tag" property
   * @instance
   * @function searchTag
   * @memberof opentype.Layout
   * @param  {Array} arr
   * @param  {string} tag
   * @return {number}
   */
  searchTag: Sr,
  /**
   * Binary search in a list of numbers
   * @instance
   * @function binSearch
   * @memberof opentype.Layout
   * @param  {Array} arr
   * @param  {number} value
   * @return {number}
   */
  binSearch: Yo,
  /**
   * Get or create the Layout table (GSUB, GPOS etc).
   * @param  {boolean} create - Whether to create a new one.
   * @return {Object} The GSUB or GPOS table.
   */
  getTable: function(n) {
    let t = this.font.tables[this.tableName];
    return !t && n && (t = this.font.tables[this.tableName] = this.createDefaultTable()), t;
  },
  /**
   * Returns all scripts in the substitution table.
   * @instance
   * @return {Array}
   */
  getScriptNames: function() {
    let n = this.getTable();
    return n ? n.scripts.map(function(t) {
      return t.tag;
    }) : [];
  },
  /**
   * Returns the best bet for a script name.
   * Returns 'DFLT' if it exists.
   * If not, returns 'latn' if it exists.
   * If neither exist, returns undefined.
   */
  getDefaultScriptName: function() {
    let n = this.getTable();
    if (!n)
      return;
    let t = !1;
    for (let e = 0; e < n.scripts.length; e++) {
      const s = n.scripts[e].tag;
      if (s === "DFLT") return s;
      s === "latn" && (t = !0);
    }
    if (t) return "latn";
  },
  /**
   * Returns all LangSysRecords in the given script.
   * @instance
   * @param {string} [script='DFLT']
   * @param {boolean} create - forces the creation of this script table if it doesn't exist.
   * @return {Object} An object with tag and script properties.
   */
  getScriptTable: function(n, t) {
    const e = this.getTable(t);
    if (e) {
      n = n || "DFLT";
      const s = e.scripts, i = Sr(e.scripts, n);
      if (i >= 0)
        return s[i].script;
      if (t) {
        const r = {
          tag: n,
          script: {
            defaultLangSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] },
            langSysRecords: []
          }
        };
        return s.splice(-1 - i, 0, r), r.script;
      }
    }
  },
  /**
   * Returns a language system table
   * @instance
   * @param {string} [script='DFLT']
   * @param {string} [language='dlft']
   * @param {boolean} create - forces the creation of this langSysTable if it doesn't exist.
   * @return {Object}
   */
  getLangSysTable: function(n, t, e) {
    const s = this.getScriptTable(n, e);
    if (s) {
      if (!t || t === "dflt" || t === "DFLT")
        return s.defaultLangSys;
      const i = Sr(s.langSysRecords, t);
      if (i >= 0)
        return s.langSysRecords[i].langSys;
      if (e) {
        const r = {
          tag: t,
          langSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] }
        };
        return s.langSysRecords.splice(-1 - i, 0, r), r.langSys;
      }
    }
  },
  /**
   * Get a specific feature table.
   * @instance
   * @param {string} [script='DFLT']
   * @param {string} [language='dlft']
   * @param {string} feature - One of the codes listed at https://www.microsoft.com/typography/OTSPEC/featurelist.htm
   * @param {boolean} create - forces the creation of the feature table if it doesn't exist.
   * @return {Object}
   */
  getFeatureTable: function(n, t, e, s) {
    const i = this.getLangSysTable(n, t, s);
    if (i) {
      let r;
      const a = i.featureIndexes, o = this.font.tables[this.tableName].features;
      for (let c = 0; c < a.length; c++)
        if (r = o[a[c]], r.tag === e)
          return r.feature;
      if (s) {
        const c = o.length;
        return V.assert(c === 0 || e >= o[c - 1].tag, "Features must be added in alphabetical order."), r = {
          tag: e,
          feature: { params: 0, lookupListIndexes: [] }
        }, o.push(r), a.push(c), r.feature;
      }
    }
  },
  /**
   * Get the lookup tables of a given type for a script/language/feature.
   * @instance
   * @param {string} [script='DFLT']
   * @param {string} [language='dlft']
   * @param {string} feature - 4-letter feature code
   * @param {number} lookupType - 1 to 9
   * @param {boolean} create - forces the creation of the lookup table if it doesn't exist, with no subtables.
   * @return {Object[]}
   */
  getLookupTables: function(n, t, e, s, i) {
    const r = this.getFeatureTable(n, t, e, i), a = [];
    if (r) {
      let o;
      const c = r.lookupListIndexes, h = this.font.tables[this.tableName].lookups;
      for (let l = 0; l < c.length; l++)
        o = h[c[l]], o.lookupType === s && a.push(o);
      if (a.length === 0 && i) {
        o = {
          lookupType: s,
          lookupFlag: 0,
          subtables: [],
          markFilteringSet: void 0
        };
        const l = h.length;
        return h.push(o), c.push(l), [o];
      }
    }
    return a;
  },
  /**
   * Find a glyph in a class definition table
   * https://docs.microsoft.com/en-us/typography/opentype/spec/chapter2#class-definition-table
   * @param {object} classDefTable - an OpenType Layout class definition table
   * @param {number} glyphIndex - the index of the glyph to find
   * @returns {number} -1 if not found
   */
  getGlyphClass: function(n, t) {
    switch (n.format) {
      case 1:
        return n.startGlyph <= t && t < n.startGlyph + n.classes.length ? n.classes[t - n.startGlyph] : 0;
      case 2: {
        const e = $o(n.ranges, t);
        return e ? e.classId : 0;
      }
    }
  },
  /**
   * Find a glyph in a coverage table
   * https://docs.microsoft.com/en-us/typography/opentype/spec/chapter2#coverage-table
   * @param {object} coverageTable - an OpenType Layout coverage table
   * @param {number} glyphIndex - the index of the glyph to find
   * @returns {number} -1 if not found
   */
  getCoverageIndex: function(n, t) {
    switch (n.format) {
      case 1: {
        const e = Yo(n.glyphs, t);
        return e >= 0 ? e : -1;
      }
      case 2: {
        const e = $o(n.ranges, t);
        return e ? e.index + t - e.start : -1;
      }
    }
  },
  /**
   * Returns the list of glyph indexes of a coverage table.
   * Format 1: the list is stored raw
   * Format 2: compact list as range records.
   * @instance
   * @param  {Object} coverageTable
   * @return {Array}
   */
  expandCoverage: function(n) {
    if (n.format === 1)
      return n.glyphs;
    {
      const t = [], e = n.ranges;
      for (let s = 0; s < e.length; s++) {
        const i = e[s], r = i.start, a = i.end;
        for (let o = r; o <= a; o++)
          t.push(o);
      }
      return t;
    }
  }
};
var Di = wl;
function Ts(n) {
  Di.call(this, n, "gpos");
}
Ts.prototype = Di.prototype;
Ts.prototype.init = function() {
  const n = this.getDefaultScriptName();
  this.defaultKerningTables = this.getKerningTables(n);
};
Ts.prototype.getKerningValue = function(n, t, e) {
  for (let s = 0; s < n.length; s++) {
    const i = n[s].subtables;
    for (let r = 0; r < i.length; r++) {
      const a = i[r], o = this.getCoverageIndex(a.coverage, t);
      if (!(o < 0))
        switch (a.posFormat) {
          case 1: {
            let c = a.pairSets[o];
            for (let h = 0; h < c.length; h++) {
              let l = c[h];
              if (l.secondGlyph === e)
                return l.value1 && l.value1.xAdvance || 0;
            }
            break;
          }
          case 2: {
            const c = this.getGlyphClass(a.classDef1, t), h = this.getGlyphClass(a.classDef2, e), l = a.classRecords[c][h];
            return l.value1 && l.value1.xAdvance || 0;
          }
        }
    }
  }
  return 0;
};
Ts.prototype.getKerningTables = function(n, t) {
  if (this.font.tables.gpos)
    return this.getLookupTables(n, t, "kern", 2);
};
var Kd = Ts;
function Qd(n, t) {
  const e = n.length;
  if (e !== t.length)
    return !1;
  for (let s = 0; s < e; s++)
    if (n[s] !== t[s])
      return !1;
  return !0;
}
function t0(n, t, e) {
  let s = 0, i = n.length - 1, r = null;
  for (; s <= i; ) {
    const a = Math.floor((s + i) / 2), o = n[a], c = o[t];
    if (c < e)
      s = a + 1;
    else if (c > e)
      i = a - 1;
    else {
      r = o;
      break;
    }
  }
  return r;
}
function e0(n, t, e) {
  let s = 0, i = n.length - 1;
  for (; s <= i; ) {
    const r = Math.floor((s + i) / 2), a = n[r];
    if (a[t] < e)
      s = r + 1;
    else if (a[t] > e)
      i = r - 1;
    else
      return r;
  }
  return -1;
}
function n0(n, t, e) {
  let s = 0, i = n.length;
  const r = (a, o) => a[t] - o[t];
  for (; s < i; ) {
    const a = s + i >>> 1;
    r(n[a], e) < 0 ? s = a + 1 : i = a;
  }
  return n.splice(s, 0, e), s;
}
function Cl(n) {
  return n[0] === 31 && n[1] === 139 && n[2] === 8;
}
function s0(n) {
  const t = new DataView(n.buffer, n.byteOffset, n.byteLength);
  let e = 10;
  const s = n.byteLength - 8, i = t.getInt8(3);
  if (i & 4 && (e += 2 + t.getUint16(e, !0)), i & 8)
    for (; e < s && n[e++] !== 0; ) ;
  if (i & 16)
    for (; e < s && n[e++] !== 0; ) ;
  if (i & 2 && (e += 2), e >= s) throw new Error("Can't find compressed blocks");
  const r = t.getUint32(t.byteLength - 4, !0);
  return Rh(n.subarray(e, s), new Uint8Array(r));
}
function Zo(n) {
  return {
    x: n.x,
    y: n.y,
    onCurve: n.onCurve,
    lastPointOfContour: n.lastPointOfContour
  };
}
function i0(n) {
  return {
    glyphIndex: n.glyphIndex,
    xScale: n.xScale,
    scale01: n.scale01,
    scale10: n.scale10,
    yScale: n.yScale,
    dx: n.dx,
    dy: n.dy
  };
}
function Xt(n) {
  Di.call(this, n, "gsub");
}
function Ta(n, t, e) {
  const s = n.subtables;
  for (let i = 0; i < s.length; i++) {
    const r = s[i];
    if (r.substFormat === t)
      return r;
  }
  if (e)
    return s.push(e), e;
}
Xt.prototype = Di.prototype;
Xt.prototype.createDefaultTable = function() {
  return {
    version: 1,
    scripts: [{
      tag: "DFLT",
      script: {
        defaultLangSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] },
        langSysRecords: []
      }
    }],
    features: [],
    lookups: []
  };
};
Xt.prototype.getSingle = function(n, t, e) {
  const s = [], i = this.getLookupTables(t, e, n, 1);
  for (let r = 0; r < i.length; r++) {
    const a = i[r].subtables;
    for (let o = 0; o < a.length; o++) {
      const c = a[o], h = this.expandCoverage(c.coverage);
      let l;
      if (c.substFormat === 1) {
        const u = c.deltaGlyphId;
        for (l = 0; l < h.length; l++) {
          const f = h[l];
          s.push({ sub: f, by: f + u });
        }
      } else {
        const u = c.substitute;
        for (l = 0; l < h.length; l++)
          s.push({ sub: h[l], by: u[l] });
      }
    }
  }
  return s;
};
Xt.prototype.getMultiple = function(n, t, e) {
  const s = [], i = this.getLookupTables(t, e, n, 2);
  for (let r = 0; r < i.length; r++) {
    const a = i[r].subtables;
    for (let o = 0; o < a.length; o++) {
      const c = a[o], h = this.expandCoverage(c.coverage);
      let l;
      for (l = 0; l < h.length; l++) {
        const u = h[l], f = c.sequences[l];
        s.push({ sub: u, by: f });
      }
    }
  }
  return s;
};
Xt.prototype.getAlternates = function(n, t, e) {
  const s = [], i = this.getLookupTables(t, e, n, 3);
  for (let r = 0; r < i.length; r++) {
    const a = i[r].subtables;
    for (let o = 0; o < a.length; o++) {
      const c = a[o], h = this.expandCoverage(c.coverage), l = c.alternateSets;
      for (let u = 0; u < h.length; u++)
        s.push({ sub: h[u], by: l[u] });
    }
  }
  return s;
};
Xt.prototype.getLigatures = function(n, t, e) {
  const s = [], i = this.getLookupTables(t, e, n, 4);
  for (let r = 0; r < i.length; r++) {
    const a = i[r].subtables;
    for (let o = 0; o < a.length; o++) {
      const c = a[o], h = this.expandCoverage(c.coverage), l = c.ligatureSets;
      for (let u = 0; u < h.length; u++) {
        const f = h[u], p = l[u];
        for (let d = 0; d < p.length; d++) {
          const g = p[d];
          s.push({
            sub: [f].concat(g.components),
            by: g.ligGlyph
          });
        }
      }
    }
  }
  return s;
};
Xt.prototype.addSingle = function(n, t, e, s) {
  const i = this.getLookupTables(e, s, n, 1, !0)[0], r = Ta(i, 2, {
    // lookup type 1 subtable, format 2, coverage format 1
    substFormat: 2,
    coverage: { format: 1, glyphs: [] },
    substitute: []
  });
  V.assert(r.coverage.format === 1, "Single: unable to modify coverage table format " + r.coverage.format);
  const a = t.sub;
  let o = this.binSearch(r.coverage.glyphs, a);
  o < 0 && (o = -1 - o, r.coverage.glyphs.splice(o, 0, a), r.substitute.splice(o, 0, 0)), r.substitute[o] = t.by;
};
Xt.prototype.addMultiple = function(n, t, e, s) {
  V.assert(t.by instanceof Array && t.by.length > 1, 'Multiple: "by" must be an array of two or more ids');
  const i = this.getLookupTables(e, s, n, 2, !0)[0], r = Ta(i, 1, {
    // lookup type 2 subtable, format 1, coverage format 1
    substFormat: 1,
    coverage: { format: 1, glyphs: [] },
    sequences: []
  });
  V.assert(r.coverage.format === 1, "Multiple: unable to modify coverage table format " + r.coverage.format);
  const a = t.sub;
  let o = this.binSearch(r.coverage.glyphs, a);
  o < 0 && (o = -1 - o, r.coverage.glyphs.splice(o, 0, a), r.sequences.splice(o, 0, 0)), r.sequences[o] = t.by;
};
Xt.prototype.addAlternate = function(n, t, e, s) {
  const i = this.getLookupTables(e, s, n, 3, !0)[0], r = Ta(i, 1, {
    // lookup type 3 subtable, format 1, coverage format 1
    substFormat: 1,
    coverage: { format: 1, glyphs: [] },
    alternateSets: []
  });
  V.assert(r.coverage.format === 1, "Alternate: unable to modify coverage table format " + r.coverage.format);
  const a = t.sub;
  let o = this.binSearch(r.coverage.glyphs, a);
  o < 0 && (o = -1 - o, r.coverage.glyphs.splice(o, 0, a), r.alternateSets.splice(o, 0, 0)), r.alternateSets[o] = t.by;
};
Xt.prototype.addLigature = function(n, t, e, s) {
  const i = this.getLookupTables(e, s, n, 4, !0)[0];
  let r = i.subtables[0];
  r || (r = {
    // lookup type 4 subtable, format 1, coverage format 1
    substFormat: 1,
    coverage: { format: 1, glyphs: [] },
    ligatureSets: []
  }, i.subtables[0] = r), V.assert(r.coverage.format === 1, "Ligature: unable to modify coverage table format " + r.coverage.format);
  const a = t.sub[0], o = t.sub.slice(1), c = {
    ligGlyph: t.by,
    components: o
  };
  let h = this.binSearch(r.coverage.glyphs, a);
  if (h >= 0) {
    const l = r.ligatureSets[h];
    for (let u = 0; u < l.length; u++)
      if (Qd(l[u].components, o))
        return;
    l.push(c);
  } else
    h = -1 - h, r.coverage.glyphs.splice(h, 0, a), r.ligatureSets.splice(h, 0, [c]);
};
Xt.prototype.getFeature = function(n, t, e) {
  if (/ss\d\d/.test(n))
    return this.getSingle(n, t, e);
  switch (n) {
    case "aalt":
    case "salt":
      return this.getSingle(n, t, e).concat(this.getAlternates(n, t, e));
    case "dlig":
    case "liga":
    case "rlig":
      return this.getLigatures(n, t, e);
    case "ccmp":
      return this.getMultiple(n, t, e).concat(this.getLigatures(n, t, e));
    case "stch":
      return this.getMultiple(n, t, e);
  }
};
Xt.prototype.add = function(n, t, e, s) {
  if (/ss\d\d/.test(n))
    return this.addSingle(n, t, e, s);
  switch (n) {
    case "aalt":
    case "salt":
      return typeof t.by == "number" ? this.addSingle(n, t, e, s) : this.addAlternate(n, t, e, s);
    case "dlig":
    case "liga":
    case "rlig":
      return this.addLigature(n, t, e, s);
    case "ccmp":
      return t.by instanceof Array ? this.addMultiple(n, t, e, s) : this.addLigature(n, t, e, s);
  }
};
var r0 = Xt, Tl = class {
  // private properties don't work with reify
  // @TODO: refactor once we migrated to ES6 modules, see https://github.com/opentypejs/opentype.js/pull/579
  // #font = null;
  /**
   * @type {integer} CPAL color used to (pre)fill unset colors in a palette.
   * Format 0xBBGGRRAA
   */
  // defaultValue = 0x000000FF;
  /**
   * 
   * @param {opentype.Font} font 
   */
  constructor(n) {
    this.defaultValue = 255, this.font = n;
  }
  /**
   * Returns the font's cpal table object if present
   * @returns {Object}
   */
  cpal() {
    return this.font.tables && this.font.tables.cpal ? this.font.tables.cpal : !1;
  }
  /**
   * Returns an array of arrays of color values for each palette, optionally in a specified color format
   * @param {string} colorFormat 
   * @returns {Array<Array>}
   */
  getAll(n) {
    const t = [], e = this.cpal();
    if (!e) return t;
    for (let s = 0; s < e.colorRecordIndices.length; s++) {
      const i = e.colorRecordIndices[s], r = [];
      for (let a = i; a < i + e.numPaletteEntries; a++)
        r.push(qn(e.colorRecords[a], n || "hexa"));
      t.push(r);
    }
    return t;
  }
  /**
   * Converts a color value string or array of color value strings to CPAL integer color value(s)
   * @param {string|Array<string></string>} color 
   * @returns {integer}
   */
  toCPALcolor(n) {
    return Array.isArray(n) ? n.map((t) => ki(t, "raw")) : ki(n, "raw");
  }
  /**
   * Fills a set of palette colors (from palette index, or a provided array of CPAL color values) with a set of colors, falling back to the default color value, until a given count
   * @param {Array<string>|integer} palette Palette index integer or Array of colors to be filled
   * @param {Array<string|integer>} colors Colors to fill the palette with
   * @param {integer} _colorCount Number of colors to fill the palette with, defaults to the value of the numPaletteEntries field. Used internally by extend() and shouldn't be set manually
   * @returns 
   */
  fillPalette(n, t = [], e = this.cpal().numPaletteEntries) {
    return n = Number.isInteger(n) ? this.get(n, "raw") : n, Object.assign(Array(e).fill(this.defaultValue), this.toCPALcolor(n).concat(this.toCPALcolor(t)));
  }
  /**
   * Extend existing palettes and numPaletteEntries by a number of color slots
   * @param {integer} num number of additional color slots to add to all palettes
   */
  extend(n) {
    if (this.ensureCPAL(Array(n).fill(this.defaultValue)))
      return;
    const t = this.cpal(), e = t.numPaletteEntries + n, s = this.getAll().map((i) => this.fillPalette(i, [], e));
    t.numPaletteEntries = e, t.colorRecords = this.toCPALcolor(s.flat()), this.updateIndices();
  }
  /**
   * Get a specific palette by its zero-based index
   * @param {integer} paletteIndex 
   * @param {string} [colorFormat='hexa']
   * @returns {Array}
   */
  get(n, t = "hexa") {
    return this.getAll(t)[n] || null;
  }
  /**
   * Get a color from a specific palette by its zero-based index
   * @param {integer} index 
   * @param {integer} paletteIndex
   * @param {string} [colorFormat ='hexa']
   * @returns 
   */
  getColor(n, t = 0, e = "hexa") {
    return ba(this.font, n, t, e);
  }
  /**
   * Set one or more colors on a specific palette by its zero-based index
   * @param {integer} index zero-based color index to start filling from
   * @param {string|integer|Array<string|integer>} color color value or array of color values
   * @param {integer} paletteIndex
   * @returns 
   */
  setColor(n, t, e = 0) {
    n = parseInt(n), e = parseInt(e);
    let s = this.getAll("raw"), i = s[e];
    if (!i)
      throw Error(`paletteIndex ${e} out of range`);
    const r = this.cpal(), a = r.numPaletteEntries;
    Array.isArray(t) || (t = [t]), t.length + n > a && (this.extend(t.length + n - a), s = this.getAll("raw"), i = s[e]);
    for (let o = 0; o < t.length; o++)
      i[o + n] = this.toCPALcolor(t[o]);
    r.colorRecords = s.flat(), this.updateIndices();
  }
  /**
   * Add a new palette. 
   * @param {Array} colors (optional) colors to add to the palette, differences to existing palettes will be filled with the defaultValue.
   * @returns 
   */
  add(n) {
    if (this.ensureCPAL(n))
      return;
    const t = this.cpal(), e = t.numPaletteEntries;
    n && n.length ? (n = this.toCPALcolor(n), n.length > e ? this.extend(n.length - e) : n.length < e && (n = this.fillPalette(n)), t.colorRecordIndices.push(t.colorRecords.length), t.colorRecords.push(...n)) : (t.colorRecordIndices.push(t.colorRecords.length), t.colorRecords.push(...Array(e).fill(this.defaultValue)));
  }
  /**
   * deletes a palette by its zero-based index
   * @param {integer} paletteIndex 
   */
  delete(n) {
    const t = this.getAll("raw");
    delete t[n];
    const e = this.cpal();
    e.colorRecordIndices.pop(), e.colorRecords = t.flat();
  }
  /**
   * Deletes a specific color index in all palettes and updates all layers using that color with the replacement index
   * @param {integer} colorIndex index of the color that should be deleted
   * @param {integer} replacementIndex index (according to the palette before deletion) of the color to replace in layers using the color to be to deleted
   */
  deleteColor(n, t) {
    if (n === t)
      throw Error("replacementIndex cannot be the same as colorIndex");
    const e = this.cpal(), s = this.getAll("raw"), i = [];
    if (t > e.numPaletteEntries - 1)
      throw Error(`Replacement index out of range: numPaletteEntries after deletion: ${e.numPaletteEntries - 1}, replacementIndex: ${t})`);
    for (let o = 0; o < s.length; o++) {
      const h = s[o].filter((l, u) => u !== n);
      i.push(h);
    }
    const r = this.font.tables.colr;
    if (r) {
      const o = r.layerRecords;
      for (let c = 0; c < o.length; c++) {
        const h = o[c].paletteIndex;
        if (h > n)
          o[c].paletteIndex -= 1;
        else if (h === n) {
          let l = 0;
          for (let u = 0; u < s.length; u++)
            if (t > n && t <= n + s[u].length) {
              l++;
              break;
            }
          o[c].paletteIndex = t - l;
        }
      }
      this.font.tables.colr = {
        ...r,
        layerRecords: o
      };
    }
    const a = i.flat();
    for (let o = 0; o < s.length; o++)
      e.colorRecordIndices[o] -= o;
    e.numPaletteEntries = Math.max(0, e.numPaletteEntries - 1), e.colorRecords = this.toCPALcolor(a);
  }
  /**
   * Makes sure that the CPAL table exists and is populated with default values.
   * @param {Array} colors (optional) colors to populate on creation
   * @returns {Boolean} true if it was created, false if it already existed.
   */
  ensureCPAL(n) {
    return this.cpal() ? !1 : (!n || !n.length ? n = [this.defaultValue] : n = this.toCPALcolor(n), this.font.tables.cpal = {
      version: 0,
      numPaletteEntries: n.length,
      colorRecords: n,
      colorRecordIndices: [0]
    }, !0);
  }
  /**
   * Mainly used internally. Recalculates the colorRecordIndices array based on the numPaletteEntries and number of palettes
   */
  updateIndices() {
    const n = this.cpal(), t = Math.ceil(n.colorRecords.length / n.numPaletteEntries);
    n.colorRecordIndices = [];
    for (let e = 0; e < t; e++)
      n.colorRecordIndices.push(e * n.numPaletteEntries);
  }
}, a0 = class {
  // private properties don't work with reify
  // @TODO: refactor once we migrated to ES6 modules, see https://github.com/opentypejs/opentype.js/pull/579
  // #font = null;
  constructor(n) {
    this.font = n;
  }
  /**
   * Mainly used internally. Ensures that the COLR table exists and is populated with default values
   * @returns the LayerManager's font instance for chaining
   */
  ensureCOLR() {
    return this.font.tables.colr || (this.font.tables.colr = {
      version: 0,
      baseGlyphRecords: [],
      layerRecords: []
    }), this.font;
  }
  /**
   * Gets the layers for a specific glyph
   * @param {integer} glyphIndex
   * @returns {Array<Object>} array of layer objects {glyph, paletteIndex}
   */
  get(n) {
    const t = this.font, e = [], s = t.tables.colr, i = t.tables.cpal;
    if (!s || !i)
      return e;
    const r = t0(s.baseGlyphRecords, "glyphID", n);
    if (!r)
      return e;
    const a = r.firstLayerIndex, o = r.numLayers;
    for (let c = 0; c < o; c++) {
      const h = s.layerRecords[a + c];
      e.push({
        glyph: t.glyphs.get(h.glyphID),
        paletteIndex: h.paletteIndex
      });
    }
    return e;
  }
  /**
   * Adds one or more layers to a glyph, at the end or at a specific position.
   * @param {integer} glyphIndex glyph index to add the layer(s) to.
   * @param {Array|Object} layers layer object {glyph, paletteIndex}/{glyphID, paletteIndex} or array of layer objects.
   * @param {integer?} position position to insert the layers at (will default to adding at the end).
   */
  add(n, t, e) {
    const s = this.get(n);
    t = Array.isArray(t) ? t : [t], e === void 0 || e === 1 / 0 || e > s.length ? e = s.length : e < 0 && (e = s.length + 1 + e % (s.length + 1), e >= s.length + 1 && (e -= s.length + 1));
    const i = [];
    for (let r = 0; r < e; r++) {
      const a = Number.isInteger(s[r].glyph) ? s[r].glyph : s[r].glyph.index;
      i.push({
        glyphID: a,
        paletteIndex: s[r].paletteIndex
      });
    }
    for (const r of t) {
      const a = Number.isInteger(r.glyph) ? r.glyph : r.glyph.index;
      i.push({
        glyphID: a,
        paletteIndex: r.paletteIndex
      });
    }
    for (let r = e; r < s.length; r++) {
      const a = Number.isInteger(s[r].glyph) ? s[r].glyph : s[r].glyph.index;
      i.push({
        glyphID: a,
        paletteIndex: s[r].paletteIndex
      });
    }
    this.updateColrTable(n, i);
  }
  /**
   * Sets a color glyph layer's paletteIndex property to a new index
   * @param {integer} glyphIndex glyph in the font by zero-based glyph index
   * @param {integer} layerIndex layer in the glyph by zero-based layer index
   * @param {integer} paletteIndex new color to set for the layer by zero-based index in any palette
   */
  setPaletteIndex(n, t, e) {
    let s = this.get(n);
    s[t] ? (s = s.map((i, r) => ({
      glyphID: i.glyph.index,
      paletteIndex: r === t ? e : i.paletteIndex
    })), this.updateColrTable(n, s)) : console.error("Invalid layer index");
  }
  /**
   * Removes one or more layers from a glyph.
   * @param {integer} glyphIndex glyph index to remove the layer(s) from
   * @param {integer} start index to remove the layer at
   * @param {integer?} end (optional) if provided, removes all layers from start index to (and including) end index
   */
  remove(n, t, e = t) {
    let s = this.get(n);
    s = s.map((i) => ({
      glyphID: i.glyph.index,
      paletteIndex: i.paletteIndex
    })), s.splice(t, e - t + 1), this.updateColrTable(n, s);
  }
  /**
   * Mainly used internally. Mainly used internally. Updates the colr table, adding a baseGlyphRecord if needed,
   * ensuring that it's inserted at the correct position, updating numLayers, and adjusting firstLayerIndex values
   * for all baseGlyphRecords according to any deletions or insertions.
   * @param {integer} glyphIndex 
   * @param {Array<Object>} layers array of layer objects {glyphID, paletteIndex}
   */
  updateColrTable(n, t) {
    this.ensureCOLR();
    const s = this.font.tables.colr;
    let i = e0(s.baseGlyphRecords, "glyphID", n);
    if (i === -1) {
      const l = { glyphID: n, firstLayerIndex: s.layerRecords.length, numLayers: 0 };
      i = n0(s.baseGlyphRecords, "glyphID", l);
    }
    const a = s.baseGlyphRecords[i], o = a.numLayers, c = t.length, h = c - o;
    if (h > 0) {
      const l = t.slice(o).map((u) => ({
        glyphID: u.glyphID,
        paletteIndex: u.paletteIndex
      }));
      s.layerRecords.splice(a.firstLayerIndex + o, 0, ...l);
    } else h < 0 && s.layerRecords.splice(a.firstLayerIndex + c, -h);
    for (let l = 0; l < Math.min(o, c); l++)
      s.layerRecords[a.firstLayerIndex + l] = {
        glyphID: t[l].glyphID,
        paletteIndex: t[l].paletteIndex
      };
    if (a.numLayers = c, h !== 0)
      for (let l = 0; l < s.baseGlyphRecords.length; l++) {
        const u = s.baseGlyphRecords[l];
        l === i || u.firstLayerIndex < a.firstLayerIndex || (s.baseGlyphRecords[l].firstLayerIndex += h);
      }
  }
}, o0 = class {
  /**
   * @param {opentype.Font} font
   */
  constructor(n) {
    this.font = n, this.cache = /* @__PURE__ */ new WeakMap();
  }
  /**
   * @param {number} glyphIndex
   * @returns {SvgImage | undefined}
   */
  get(n) {
    const t = this.getOrCreateSvgImageCacheEntry(n);
    return t && t.image;
  }
  /**
   * @param {number} glyphIndex
   * @returns {Promise<SvgImage> | undefined}
   */
  getAsync(n) {
    const t = this.getOrCreateSvgImageCacheEntry(n);
    return t && t.promise;
  }
  /**
   * @param {number} glyphIndex
   * @returns {SVGImageCacheEntry | undefined}
   */
  getOrCreateSvgImageCacheEntry(n) {
    const t = this.font.tables.svg;
    if (t === void 0) return;
    const e = t.get(n);
    if (e === void 0) return;
    let s = this.cache.get(e);
    s === void 0 && (s = c0(e), this.cache.set(e, s));
    let i = s.images.get(n);
    return i === void 0 && (i = h0(this.font, s.template, n), i.promise.then((r) => {
      if (i.image = r, typeof this.font.onGlyphUpdated == "function")
        try {
          this.font.onGlyphUpdated(n);
        } catch (a) {
          console.error("font.onGlyphUpdated", n, a);
        }
    }), s.images.set(n, i)), i;
  }
};
function c0(n) {
  return {
    template: l0(n).then(p0),
    images: /* @__PURE__ */ new Map()
  };
}
function h0(n, t, e) {
  return {
    promise: t.then((s) => {
      let i;
      typeof s == "string" ? i = s : (s[4] = e, i = s.join(""));
      const r = d0(i, n.unitsPerEm);
      return r.image.decode().then(() => r);
    }),
    image: void 0
  };
}
var l0 = typeof DecompressionStream == "function" ? f0 : u0;
function u0(n) {
  try {
    return Promise.resolve(new TextDecoder().decode(Cl(n) ? s0(n) : n));
  } catch (t) {
    return Promise.reject(t);
  }
}
function f0(n) {
  if (Cl(n))
    return new Response(new Response(n).body.pipeThrough(new DecompressionStream("gzip"))).text();
  try {
    return Promise.resolve(new TextDecoder().decode(n));
  } catch (t) {
    return Promise.reject(t);
  }
}
function p0(n) {
  const t = n.indexOf("<svg"), e = n.indexOf(">", t + 4) + 1;
  if (/ id=['"]glyph\d+['"]/.test(n.substring(t, e)))
    return n;
  const s = n.lastIndexOf("</svg>");
  return [
    n.substring(0, e),
    "<defs>",
    n.substring(e, s),
    '</defs><use href="#glyph',
    "",
    '"/>',
    n.substring(s)
  ];
}
function d0(n, t) {
  const s = new DOMParser().parseFromString(n, "image/svg+xml").documentElement, i = s.viewBox.baseVal, r = s.width.baseVal, a = s.height.baseVal;
  let o = 1, c = 1;
  i.width > 0 && i.height > 0 && (r.unitType === 1 ? (o = r.valueInSpecifiedUnits / i.width, c = a.unitType === 1 ? a.valueInSpecifiedUnits / i.height : o) : a.unitType === 1 ? (c = a.valueInSpecifiedUnits / i.height, o = c) : t && (o = t / i.width, c = t / i.height));
  const h = document.createElement("div");
  h.style.position = "fixed", h.style.visibility = "hidden", h.appendChild(s), document.body.appendChild(h);
  const l = s.getBBox();
  document.body.removeChild(h);
  const u = (l.x - i.x) * o, f = (i.y - l.y) * c, p = l.width * o, d = l.height * c;
  s.setAttribute("viewBox", [l.x, l.y, l.width, l.height].join(" ")), o !== 1 && s.setAttribute("width", p), c !== 1 && s.setAttribute("height", d);
  const g = new Image(p, d);
  return g.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s.outerHTML), { leftSideBearing: u, baseline: f, image: g };
}
var wr = /* @__PURE__ */ new WeakMap();
function Jo(n, t, e, s, i) {
  let r;
  return (t & s) > 0 ? (r = n.parseByte(), t & i || (r = -r), r = e + r) : (t & i) > 0 ? r = e : r = e + n.parseShort(), r;
}
function Fl(n, t, e) {
  const s = new z.Parser(t, e);
  n._numberOfContours = s.parseShort(), n._xMin = s.parseShort(), n._yMin = s.parseShort(), n._xMax = s.parseShort(), n._yMax = s.parseShort();
  let i, r;
  if (n._numberOfContours > 0) {
    const a = n.endPointIndices = [];
    for (let c = 0; c < n._numberOfContours; c += 1)
      a.push(s.parseUShort());
    n.instructionLength = s.parseUShort(), n.instructions = [];
    for (let c = 0; c < n.instructionLength; c += 1)
      n.instructions.push(s.parseByte());
    const o = a[a.length - 1] + 1;
    i = [];
    for (let c = 0; c < o; c += 1)
      if (r = s.parseByte(), i.push(r), (r & 8) > 0) {
        const h = s.parseByte();
        for (let l = 0; l < h; l += 1)
          i.push(r), c += 1;
      }
    if (V.argument(i.length === o, "Bad flags."), a.length > 0) {
      const c = [];
      let h;
      if (o > 0) {
        for (let f = 0; f < o; f += 1)
          r = i[f], h = {}, h.onCurve = !!(r & 1), h.lastPointOfContour = a.indexOf(f) >= 0, c.push(h);
        let l = 0;
        for (let f = 0; f < o; f += 1)
          r = i[f], h = c[f], h.x = Jo(s, r, l, 2, 16), l = h.x;
        let u = 0;
        for (let f = 0; f < o; f += 1)
          r = i[f], h = c[f], h.y = Jo(s, r, u, 4, 32), u = h.y;
      }
      n.points = c;
    } else
      n.points = [];
  } else if (n._numberOfContours === 0)
    n.points = [];
  else {
    n.isComposite = !0, n.points = [], n.components = [];
    let a = !0;
    for (; a; ) {
      i = s.parseUShort();
      const o = {
        glyphIndex: s.parseUShort(),
        xScale: 1,
        scale01: 0,
        scale10: 0,
        yScale: 1,
        dx: 0,
        dy: 0
      };
      (i & 1) > 0 ? (i & 2) > 0 ? (o.dx = s.parseShort(), o.dy = s.parseShort()) : o.matchedPoints = [s.parseUShort(), s.parseUShort()] : (i & 2) > 0 ? (o.dx = s.parseChar(), o.dy = s.parseChar()) : o.matchedPoints = [s.parseByte(), s.parseByte()], (i & 8) > 0 ? o.xScale = o.yScale = s.parseF2Dot14() : (i & 64) > 0 ? (o.xScale = s.parseF2Dot14(), o.yScale = s.parseF2Dot14()) : (i & 128) > 0 && (o.xScale = s.parseF2Dot14(), o.scale01 = s.parseF2Dot14(), o.scale10 = s.parseF2Dot14(), o.yScale = s.parseF2Dot14()), n.components.push(o), a = !!(i & 32);
    }
    if (i & 256) {
      n.instructionLength = s.parseUShort(), n.instructions = [];
      for (let o = 0; o < n.instructionLength; o += 1)
        n.instructions.push(s.parseByte());
    }
  }
}
function ci(n, t) {
  const e = [];
  for (let s = 0; s < n.length; s += 1) {
    const i = n[s], r = {
      x: t.xScale * i.x + t.scale10 * i.y + t.dx,
      y: t.scale01 * i.x + t.yScale * i.y + t.dy,
      onCurve: i.onCurve,
      lastPointOfContour: i.lastPointOfContour
    };
    e.push(r);
  }
  return e;
}
function g0(n) {
  const t = [];
  let e = [];
  for (let s = 0; s < n.length; s += 1) {
    const i = n[s];
    e.push(i), i.lastPointOfContour && (t.push(e), e = []);
  }
  return V.argument(e.length === 0, "There are still points left in the current contour."), t;
}
function Fa(n) {
  const t = new Hn();
  if (!n)
    return t;
  const e = g0(n);
  for (let s = 0; s < e.length; ++s) {
    const i = e[s];
    let r = i[i.length - 1], a = i[0];
    if (r.onCurve)
      t.moveTo(r.x, r.y);
    else if (a.onCurve)
      t.moveTo(a.x, a.y);
    else {
      const o = { x: (r.x + a.x) * 0.5, y: (r.y + a.y) * 0.5 };
      t.moveTo(o.x, o.y);
    }
    for (let o = 0; o < i.length; ++o)
      if (r = a, a = i[(o + 1) % i.length], r.onCurve)
        t.lineTo(r.x, r.y);
      else {
        let c = a;
        a.onCurve || (c = { x: (r.x + a.x) * 0.5, y: (r.y + a.y) * 0.5 }), t.quadraticCurveTo(r.x, r.y, c.x, c.y);
      }
    t.closePath();
  }
  return t;
}
function Al(n, t) {
  if (t.isComposite) {
    wr.has(n) || wr.set(n, /* @__PURE__ */ new Set());
    const e = wr.get(n);
    e.add(t.index);
    try {
      for (let s = 0; s < t.components.length; s += 1) {
        const i = t.components[s];
        if (e.has(i.glyphIndex))
          continue;
        const r = n.get(i.glyphIndex);
        if (r.getPath(), r.points) {
          let a;
          if (i.matchedPoints === void 0)
            a = ci(r.points, i);
          else {
            if (i.matchedPoints[0] > t.points.length - 1 || i.matchedPoints[1] > r.points.length - 1)
              throw Error("Matched points out of range in " + t.name);
            const o = t.points[i.matchedPoints[0]];
            let c = r.points[i.matchedPoints[1]];
            const h = {
              xScale: i.xScale,
              scale01: i.scale01,
              scale10: i.scale10,
              yScale: i.yScale,
              dx: 0,
              dy: 0
            };
            c = ci([c], h)[0], h.dx = o.x - c.x, h.dy = o.y - c.y, a = ci(r.points, h);
          }
          t.points = t.points.concat(a);
        }
      }
    } finally {
      e.delete(t.index);
    }
  }
  return Fa(t.points);
}
function m0(n, t, e, s) {
  const i = new be.GlyphSet(s);
  for (let r = 0; r < e.length - 1; r += 1) {
    const a = e[r], o = e[r + 1];
    a !== o ? i.push(r, be.ttfGlyphLoader(s, r, Fl, n, t + a, Al)) : i.push(r, be.glyphLoader(s, r));
  }
  return i;
}
function y0(n, t, e, s) {
  const i = new be.GlyphSet(s);
  return s._push = function(r) {
    const a = e[r], o = e[r + 1];
    a !== o ? i.push(r, be.ttfGlyphLoader(s, r, Fl, n, t + a, Al)) : i.push(r, be.glyphLoader(s, r));
  }, i;
}
function x0(n, t, e, s, i) {
  return i.lowMemory ? y0(n, t, e, s) : m0(n, t, e, s);
}
var kl = { getPath: Fa, parse: x0 }, b0 = class {
  constructor(n) {
    this.font = n;
  }
  /**
   * Modifies a coords object to make sure that tags have a length of 4
   * @param {Object} coords - variation coordinates
   */
  normalizeCoordTags(n) {
    for (const t in n)
      if (t.length < 4) {
        const e = t.padEnd(4, " ");
        n[e] === void 0 && (n[e] = n[t]), delete n[t];
      }
  }
  /**
   * Normalizes the coordinates from the axis ranges to a range of -1 to 1.
   * @param {Object} coords - The coordinates object to normalize.
   * @returns {Array<number>} The normalized coordinates as an array
   */
  getNormalizedCoords(n) {
    n || (n = this.font.variation.get());
    let t = [];
    this.normalizeCoordTags(n);
    for (let e = 0; e < this.fvar().axes.length; e++) {
      const s = this.fvar().axes[e];
      let i = n[s.tag];
      i === void 0 && (i = s.defaultValue), i < s.defaultValue ? t.push((i - s.defaultValue + Number.EPSILON) / (s.defaultValue - s.minValue + Number.EPSILON)) : t.push((i - s.defaultValue + Number.EPSILON) / (s.maxValue - s.defaultValue + Number.EPSILON));
    }
    if (this.avar())
      for (let e = 0; e < this.avar().axisSegmentMaps.length; e++) {
        let s = this.avar().axisSegmentMaps[e];
        for (let i = 0; i < s.axisValueMaps.length; i++) {
          let r = s.axisValueMaps[i];
          if (i >= 1 && t[e] < r.fromCoordinate) {
            let a = s.axisValueMaps[i - 1];
            t[e] = ((t[e] - a.fromCoordinate) * (r.toCoordinate - a.toCoordinate) + Number.EPSILON) / (r.fromCoordinate - a.fromCoordinate + Number.EPSILON) + a.toCoordinate;
            break;
          }
        }
      }
    return t;
  }
  /**
   * Interpolates points within a glyph if deltas are not provided for all points.
   * @param {Array<Object>} points - The points to be interpolated.
   * @param {Array<Object>} glyphPoints - Reference points from the glyph.
   * @param {Object} deltaMap - A map indicating which points have deltas.
   */
  interpolatePoints(n, t, e) {
    if (n.length === 0)
      return;
    let s = 0;
    for (; s < n.length; ) {
      let i = s, r = s, a = n[r];
      for (; !a.lastPointOfContour; )
        a = n[++r];
      for (; s <= r && !e[s]; )
        s++;
      if (s > r)
        continue;
      let o = s, c = s;
      for (s++; s <= r; )
        e[s] && (this.deltaInterpolate(c + 1, s - 1, c, s, t, n), c = s), s++;
      c === o ? this.deltaShift(i, r, c, t, n) : (this.deltaInterpolate(c + 1, r, c, o, t, n), o > 0 && this.deltaInterpolate(i, o - 1, c, o, t, n)), s = r + 1;
    }
  }
  /**
   * Interpolates delta values between two points.
   * @param {number} p1 - Start point index for interpolation.
   * @param {number} p2 - End point index for interpolation.
   * @param {number} ref1 - Reference point index for the start delta.
   * @param {number} ref2 - Reference point index for the end delta.
   * @param {Array<Object>} glyphPoints - Reference points from the glyph.
   * @param {Array<Object>} points - The points to be adjusted.
   */
  deltaInterpolate(n, t, e, s, i, r) {
    if (n > t)
      return;
    let a = ["x", "y"];
    for (let c = 0; c < a.length; c++) {
      let h = a[c];
      if (i[e][h] > i[s][h]) {
        var o = e;
        e = s, s = o;
      }
      let l = i[e][h], u = i[s][h], f = r[e][h], p = r[s][h];
      if (l !== u || f === p) {
        let d = l === u ? 0 : (p - f) / (u - l);
        for (let g = n; g <= t; g++) {
          let x = i[g][h];
          x <= l ? x += f - l : x >= u ? x += p - u : x = f + (x - l) * d, r[g][h] = x;
        }
      }
    }
  }
  /**
   * Applies a delta shift to a range of points based on a reference point.
   * @param {number} p1 - Start point index for shifting.
   * @param {number} p2 - End point index for shifting.
   * @param {number} ref - Reference point index.
   * @param {Array<Object>} glyphPoints - Reference points from the glyph.
   * @param {Array<Object>} points - The points to be shifted.
   */
  deltaShift(n, t, e, s, i) {
    let r = i[e].x - s[e].x, a = i[e].y - s[e].y;
    if (!(r === 0 && a === 0))
      for (let o = n; o <= t; o++)
        o !== e && (i[o].x += r, i[o].y += a);
  }
  /**
   * Transforms glyph components based on variation data.
   * @param {Glyph} glyph - The composite glyph to transform.
   * @param {Array<Object>} transformedPoints - Points that are already transformed.
   * @param {Object} coords - Variation coordinates.
   * @param {Array<number>} tuplePoints - Points that are part of the tuple.
   * @param {Object} header - Header information from the variation data.
   * @param {number} factor - The scaling factor for the transformation.
   */
  transformComponents(n, t, e, s, i, r) {
    let a = 0;
    for (let o = 0; o < n.components.length; o++) {
      const c = n.components[o], h = this.font.glyphs.get(c.glyphIndex), l = i0(c), u = s.indexOf(o);
      u > -1 && (l.dx += Math.round(i.deltas[u] * r), l.dy += Math.round(i.deltasY[u] * r));
      const f = ci(this.getTransform(h, e).points, l);
      t.splice(a, f.length, ...f), a += h.points.length;
    }
  }
  applyTupleVariationStore(n, t, e, s = "gvar", i = {}) {
    e || (e = this.font.variation.get());
    const r = this.getNormalizedCoords(e), { headers: a, sharedPoints: o } = n, c = this.fvar().axes.length;
    let h;
    s === "gvar" ? h = t.map(Zo) : s === "cvar" && (h = [...t]);
    for (let l = 0; l < a.length; l++) {
      const u = a[l];
      let f = 1;
      for (let d = 0; d < c; d++) {
        let g = [0];
        switch (s) {
          case "gvar":
            g = u.peakTuple ? u.peakTuple : this.gvar().sharedTuples[u.sharedTupleRecordsIndex];
            break;
          case "cvar":
            g = u.peakTuple;
            break;
        }
        if (g[d] !== 0) {
          if (r[d] === 0) {
            f = 0;
            break;
          }
          if (u.intermediateStartTuple)
            if (r[d] < u.intermediateStartTuple[d] || r[d] > u.intermediateEndTuple[d]) {
              f = 0;
              break;
            } else r[d] < g[d] ? f = f * (r[d] - u.intermediateStartTuple[d] + Number.EPSILON) / (g[d] - u.intermediateStartTuple[d] + Number.EPSILON) : f = f * (u.intermediateEndTuple[d] - r[d] + Number.EPSILON) / (u.intermediateEndTuple[d] - g[d] + Number.EPSILON);
          else {
            if (r[d] < Math.min(0, g[d]) || r[d] > Math.max(0, g[d])) {
              f = 0;
              break;
            }
            f = (f * r[d] + Number.EPSILON) / (g[d] + Number.EPSILON);
          }
        }
      }
      if (f === 0)
        continue;
      const p = u.privatePoints.length ? u.privatePoints : o;
      if (s === "gvar" && i.glyph && i.glyph.isComposite)
        this.transformComponents(i.glyph, h, e, p, u, f);
      else if (p.length === 0)
        for (let d = 0; d < h.length; d++) {
          const g = h[d];
          s === "gvar" ? h[d] = {
            x: Math.round(g.x + u.deltas[d] * f),
            y: Math.round(g.y + u.deltasY[d] * f),
            onCurve: g.onCurve,
            lastPointOfContour: g.lastPointOfContour
          } : s === "cvar" && (h[d] = Math.round(g + u.deltas[d] * f));
        }
      else {
        let d;
        s === "gvar" ? d = h.map(Zo) : s === "cvar" && (d = h);
        const g = Array(t.length).fill(!1);
        for (let x = 0; x < p.length; x++) {
          let b = p[x];
          if (b < t.length) {
            let v = d[b];
            s === "gvar" ? (g[b] = !0, v.x += u.deltas[x] * f, v.y += u.deltasY[x] * f) : s === "cvar" && (h[b] = Math.round(v + u.deltas[x] * f));
          }
        }
        if (s === "gvar") {
          this.interpolatePoints(d, h, g);
          for (let x = 0; x < t.length; x++) {
            let b = d[x].x - h[x].x, v = d[x].y - h[x].y;
            h[x].x = Math.round(h[x].x + b), h[x].y = Math.round(h[x].y + v);
          }
        }
      }
    }
    return h;
  }
  /**
   * Retrieves a transformed copy of a glyph based on the provided variation coordinates, or the glyph itself if no variation was applied
   * @param {opentype.Glyph|number} glyph - Glyph or index of glyph to transform.
   * @param {Object} coords - Variation coords object (will fall back to variation coords in the defaultRenderOptions)
   * @returns {opentype.Glyph} - The transformed glyph.
   */
  getTransform(n, t) {
    Number.isInteger(n) && (n = this.font.glyphs.get(n));
    const e = n.getBlendPath, s = !!(n.points && n.points.length);
    let i = n;
    if (e || s) {
      if (t || (t = this.font.variation.get()), s) {
        const r = this.gvar() && this.gvar().glyphVariations[n.index];
        if (r) {
          const a = n.points;
          let o = this.applyTupleVariationStore(r, a, t, "gvar", { glyph: n });
          i = new ms(Object.assign({}, n, { points: o, path: Fa(o) }));
        }
      } else if (e) {
        const r = n.getBlendPath(t);
        i = new ms(Object.assign({}, n, { path: r }));
      }
    }
    return this.font.tables.hvar && (n._advanceWidth = typeof n._advanceWidth < "u" ? n._advanceWidth : n.advanceWidth, n.advanceWidth = i.advanceWidth = Math.round(n._advanceWidth + this.getVariableAdjustment(i.index, "hvar", "advanceWidth", t)), n._leftSideBearing = typeof n._leftSideBearing < "u" ? n._leftSideBearing : n.leftSideBearing, n.leftSideBearing = i.leftSideBearing = Math.round(n._leftSideBearing + this.getVariableAdjustment(i.index, "hvar", "lsb", t))), i;
  }
  getCvarTransform(n) {
    const t = this.font.tables.cvt, e = this.cvar();
    return !t || !t.length || !e || !e.headers.length ? t : this.applyTupleVariationStore(e, t, n, "cvar");
  }
  /**
   * Calculates the variable adjustment for a glyph property from variation data.
   * @param {number} gid - Glyph ID.
   * @param {string} tableName - The name of the variation data table.
   * @param {string} parameter - The property to adjust.
   * @param {Object} coords - Variation coordinates.
   * @returns {number} - The calculated adjustment.
   */
  getVariableAdjustment(n, t, e, s) {
    s = s || this.font.variation.get();
    let i, r;
    const a = this.font.tables[t];
    if (!a)
      throw Error(`trying to get variation adjustment from non-existent table "${a}"`);
    if (!a.itemVariationStore)
      throw Error(`trying to get variation adjustment from table "${a}" which does not have an itemVariationStore`);
    const o = a[e] && a[e].map.length;
    if (o) {
      let c = n;
      c >= o && (c = o - 1), { outerIndex: i, innerIndex: r } = a[e].map[c];
    } else
      i = 0, r = n;
    return this.getDelta(a.itemVariationStore, i, r, s);
  }
  /**
   * Retrieves the delta value from a variation store.
   * @param {Object} itemStore - The item variation store.
   * @param {number} outerIndex - The outer index in the variation subtables.
   * @param {number} innerIndex - The inner index in the delta sets.
   * @param {Object} coords - Variation coordinates.
   * @returns {number} - The delta value.
   */
  getDelta(n, t, e, s) {
    if (t >= n.itemVariationSubtables.length)
      return 0;
    let i = n.itemVariationSubtables[t];
    if (e >= i.deltaSets.length)
      return 0;
    let r = i.deltaSets[e], a = this.getBlendVector(n, t, s), o = 0;
    for (let c = 0; c < i.regionIndexes.length; c++)
      o += r[c] * a[c];
    return o;
  }
  /**
   * Calculates the blend vector for a set of variation coordinates.
   * @param {Object} itemStore - The item variation store.
   * @param {number} itemIndex - Index of the current item in the variation subtables.
   * @param {Object} coords - Variation coordinates.
   * @returns {Array<number>} - The blend vector for the given coordinates.
   */
  getBlendVector(n, t, e) {
    e || (e = this.font.variation.get());
    let s = n.itemVariationSubtables[t];
    const i = this.getNormalizedCoords(e);
    let r = [];
    for (let a = 0; a < s.regionIndexes.length; a++) {
      let o = 1, c = s.regionIndexes[a], h = n.variationRegions[c].regionAxes;
      for (let l = 0; l < h.length; l++) {
        let u = h[l], f;
        u.startCoord > u.peakCoord || u.peakCoord > u.endCoord || u.startCoord < 0 && u.endCoord > 0 && u.peakCoord !== 0 || u.peakCoord === 0 ? f = 1 : i[l] < u.startCoord || i[l] > u.endCoord ? f = 0 : i[l] === u.peakCoord ? f = 1 : i[l] < u.peakCoord ? f = (i[l] - u.startCoord + Number.EPSILON) / (u.peakCoord - u.startCoord + Number.EPSILON) : f = (u.endCoord - i[l] + Number.EPSILON) / (u.endCoord - u.peakCoord + Number.EPSILON), o *= f;
      }
      r[a] = o;
    }
    return r;
  }
  /**
   * Helper method that returns the font's avar table if present
   * @returns {Object|undefined}
   */
  avar() {
    return this.font.tables.avar;
  }
  /**
   * Helper method that returns the font's cvar table if present
   * @returns {Object|undefined}
   */
  cvar() {
    return this.font.tables.cvar;
  }
  /**
   * Helper method that returns the font's fvar table if present
   * @returns {Object|undefined}
   */
  fvar() {
    return this.font.tables.fvar;
  }
  /**
   * Helper method that returns the font's gvar table if present
   * @returns {Object|undefined}
   */
  gvar() {
    return this.font.tables.gvar;
  }
  /**
   * Helper method that returns the font's hvar table if present
   * @returns {Object|undefined}
   */
  hvar() {
    return this.font.tables.hvar;
  }
}, v0 = class {
  constructor(n) {
    this.font = n, this.process = new b0(this.font), this.activateDefaultVariation(), this.getTransform = this.process.getTransform.bind(this.process);
  }
  /**
   * Tries to determine the default instance and sets its variation data as the font.defaultRenderOptions.
   * If not defaultInstance can be determined, the default coordinates of all axes are used.
   */
  activateDefaultVariation() {
    const n = this.getDefaultInstanceIndex();
    n > -1 ? this.set(n) : this.set(this.getDefaultCoordinates());
  }
  /**
   * Retrieves the default coordinates for the font's variation axes.
   * @returns {Object} An object mapping axis tags to their default values.
   */
  getDefaultCoordinates() {
    return this.fvar().axes.reduce((n, t) => (n[t.tag] = t.defaultValue, n), {});
  }
  /**
   * Gets the index of the default variation instance or -1 if not able to determine
   * @returns {integer} default index or -1
   */
  getDefaultInstanceIndex() {
    const n = this.getDefaultCoordinates();
    let t = this.getInstanceIndex(n);
    return t < 0 && (t = this.fvar().instances.findIndex((e) => e.name && e.name.en === "Regular")), t;
  }
  /**
   * Retrieves the index of the variation instance matching the coordinates object or -1 if not able to determine
   * @param {integer|Object} coordinates An object where keys are axis tags and values are the corresponding variation values.
   * @returns {integer} The index of the matching instance or -1 if no match is found.
   */
  getInstanceIndex(n) {
    return this.fvar().instances.findIndex(
      (t) => Object.keys(n).every(
        (e) => t.coordinates[e] === n[e]
      )
    );
  }
  /**
   * Retrieves a variation instance by its zero-based index
   * @param {integer} index - zero-based index of the variation instance
   * @returns {Object} - variation instance or null if the index is invalid.
   */
  getInstance(n) {
    return this.fvar().instances && this.fvar().instances[n];
  }
  /**
   * Set the variation coordinates to use by default for rendering in the font.defaultRenderOptions
   * @param {integer|Object} instanceIdOrObject Either the zero-based index of a variation instance or an object with axis tags as keys and variation values as values
   */
  set(n) {
    let t;
    if (Number.isInteger(n)) {
      const e = this.getInstance(n);
      if (!e)
        throw Error(`Invalid instance index ${n}`);
      t = { ...e.coordinates };
    } else
      t = n, this.process.normalizeCoordTags(t);
    t = Object.assign(
      {},
      this.font.defaultRenderOptions.variation,
      t
    ), this.font.defaultRenderOptions = Object.assign(
      {},
      this.font.defaultRenderOptions,
      { variation: t }
    );
  }
  /**
   * Returns the variation coordinates currently set in the font.defaultRenderOptions
   * @returns {Object}
   */
  get() {
    return Object.assign({}, this.font.defaultRenderOptions.variation);
  }
  /**
   * Helper method that returns the font's avar table if present
   * @returns {Object|undefined}
   */
  avar() {
    return this.font.tables.avar;
  }
  /**
   * Helper method that returns the font's cvar table if present
   * @returns {Object|undefined}
   */
  cvar() {
    return this.font.tables.cvar;
  }
  /**
   * Helper method that returns the font's fvar table if present
   * @returns {Object|undefined}
   */
  fvar() {
    return this.font.tables.fvar;
  }
  /**
   * Helper method that returns the font's gvar table if present
   * @returns {Object|undefined}
   */
  gvar() {
    return this.font.tables.gvar;
  }
  /**
   * Helper method that returns the font's hvar table if present
   * @returns {Object|undefined}
   */
  hvar() {
    return this.font.tables.hvar;
  }
}, Ko = 1e6, Mi = 64, Oi = 1e4, El, pn, Ml, ca;
function Ol(n) {
  this.font = n, this.getCommands = function(t) {
    return kl.getPath(t).commands;
  }, this._fpgmState = this._prepState = void 0, this._errorState = 0;
}
function S0(n) {
  return n;
}
function _l(n) {
  return Math.sign(n) * Math.round(Math.abs(n));
}
function w0(n) {
  return Math.sign(n) * Math.round(Math.abs(n * 2)) / 2;
}
function C0(n) {
  return Math.sign(n) * (Math.round(Math.abs(n) + 0.5) - 0.5);
}
function T0(n) {
  return Math.sign(n) * Math.ceil(Math.abs(n));
}
function F0(n) {
  return Math.sign(n) * Math.floor(Math.abs(n));
}
var Ll = function(n) {
  const t = this.srPeriod;
  let e = this.srPhase;
  const s = this.srThreshold;
  let i = 1;
  return n < 0 && (n = -n, i = -1), n += s - e, n = Math.trunc(n / t) * t, n += e, n < 0 ? e * i : n * i;
}, xe = {
  x: 1,
  y: 0,
  axis: "x",
  // Gets the projected distance between two points.
  // o1/o2 ... if true, respective original position is used.
  distance: function(n, t, e, s) {
    return (e ? n.xo : n.x) - (s ? t.xo : t.x);
  },
  // Moves point p so the moved position has the same relative
  // position to the moved positions of rp1 and rp2 than the
  // original positions had.
  //
  // See APPENDIX on INTERPOLATE at the bottom of this file.
  interpolate: function(n, t, e, s) {
    let i, r, a, o, c, h, l;
    if (!s || s === this) {
      if (i = n.xo - t.xo, r = n.xo - e.xo, c = t.x - t.xo, h = e.x - e.xo, a = Math.abs(i), o = Math.abs(r), l = a + o, l === 0) {
        n.x = n.xo + (c + h) / 2;
        return;
      }
      n.x = n.xo + (c * o + h * a) / l;
      return;
    }
    if (i = s.distance(n, t, !0, !0), r = s.distance(n, e, !0, !0), c = s.distance(t, t, !1, !0), h = s.distance(e, e, !1, !0), a = Math.abs(i), o = Math.abs(r), l = a + o, l === 0) {
      xe.setRelative(n, n, (c + h) / 2, s, !0);
      return;
    }
    xe.setRelative(n, n, (c * o + h * a) / l, s, !0);
  },
  // Slope of line normal to this
  normalSlope: Number.NEGATIVE_INFINITY,
  // Sets the point 'p' relative to point 'rp'
  // by the distance 'd'.
  //
  // See APPENDIX on SETRELATIVE at the bottom of this file.
  //
  // p   ... point to set
  // rp  ... reference point
  // d   ... distance on projection vector
  // pv  ... projection vector (undefined = this)
  // org ... if true, uses the original position of rp as reference.
  setRelative: function(n, t, e, s, i) {
    if (!s || s === this) {
      n.x = (i ? t.xo : t.x) + e;
      return;
    }
    const r = i ? t.xo : t.x, a = i ? t.yo : t.y, o = r + e * s.x, c = a + e * s.y;
    n.x = o + (n.y - c) / s.normalSlope;
  },
  // Slope of vector line.
  slope: 0,
  // Touches the point p.
  touch: function(n) {
    n.xTouched = !0;
  },
  // Tests if a point p is touched.
  touched: function(n) {
    return n.xTouched;
  },
  // Untouches the point p.
  untouch: function(n) {
    n.xTouched = !1;
  }
}, _e = {
  x: 0,
  y: 1,
  axis: "y",
  // Gets the projected distance between two points.
  // o1/o2 ... if true, respective original position is used.
  distance: function(n, t, e, s) {
    return (e ? n.yo : n.y) - (s ? t.yo : t.y);
  },
  // Moves point p so the moved position has the same relative
  // position to the moved positions of rp1 and rp2 than the
  // original positions had.
  //
  // See APPENDIX on INTERPOLATE at the bottom of this file.
  interpolate: function(n, t, e, s) {
    let i, r, a, o, c, h, l;
    if (!s || s === this) {
      if (i = n.yo - t.yo, r = n.yo - e.yo, c = t.y - t.yo, h = e.y - e.yo, a = Math.abs(i), o = Math.abs(r), l = a + o, l === 0) {
        n.y = n.yo + (c + h) / 2;
        return;
      }
      n.y = n.yo + (c * o + h * a) / l;
      return;
    }
    if (i = s.distance(n, t, !0, !0), r = s.distance(n, e, !0, !0), c = s.distance(t, t, !1, !0), h = s.distance(e, e, !1, !0), a = Math.abs(i), o = Math.abs(r), l = a + o, l === 0) {
      _e.setRelative(n, n, (c + h) / 2, s, !0);
      return;
    }
    _e.setRelative(n, n, (c * o + h * a) / l, s, !0);
  },
  // Slope of line normal to this.
  normalSlope: 0,
  // Sets the point 'p' relative to point 'rp'
  // by the distance 'd'
  //
  // See APPENDIX on SETRELATIVE at the bottom of this file.
  //
  // p   ... point to set
  // rp  ... reference point
  // d   ... distance on projection vector
  // pv  ... projection vector (undefined = this)
  // org ... if true, uses the original position of rp as reference.
  setRelative: function(n, t, e, s, i) {
    if (!s || s === this) {
      n.y = (i ? t.yo : t.y) + e;
      return;
    }
    const r = i ? t.xo : t.x, a = i ? t.yo : t.y, o = r + e * s.x, c = a + e * s.y;
    n.y = c + s.normalSlope * (n.x - o);
  },
  // Slope of vector line.
  slope: Number.POSITIVE_INFINITY,
  // Touches the point p.
  touch: function(n) {
    n.yTouched = !0;
  },
  // Tests if a point p is touched.
  touched: function(n) {
    return n.yTouched;
  },
  // Untouches the point p.
  untouch: function(n) {
    n.yTouched = !1;
  }
};
Object.freeze(xe);
Object.freeze(_e);
function Fs(n, t) {
  this.x = n, this.y = t, this.axis = void 0, this.slope = t / n, this.normalSlope = -n / t, Object.freeze(this);
}
Fs.prototype.distance = function(n, t, e, s) {
  return this.x * xe.distance(n, t, e, s) + this.y * _e.distance(n, t, e, s);
};
Fs.prototype.interpolate = function(n, t, e, s) {
  let i, r, a, o, c, h, l;
  if (a = s.distance(n, t, !0, !0), o = s.distance(n, e, !0, !0), i = s.distance(t, t, !1, !0), r = s.distance(e, e, !1, !0), c = Math.abs(a), h = Math.abs(o), l = c + h, l === 0) {
    this.setRelative(n, n, (i + r) / 2, s, !0);
    return;
  }
  this.setRelative(n, n, (i * h + r * c) / l, s, !0);
};
Fs.prototype.setRelative = function(n, t, e, s, i) {
  s = s || this;
  const r = i ? t.xo : t.x, a = i ? t.yo : t.y, o = r + e * s.x, c = a + e * s.y, h = s.normalSlope, l = this.slope, u = n.x, f = n.y;
  n.x = (l * u - h * o + c - f) / (l - h), n.y = l * (n.x - u) + f;
};
Fs.prototype.touch = function(n) {
  n.xTouched = !0, n.yTouched = !0;
};
function As(n, t) {
  const e = Math.sqrt(n * n + t * t);
  return n /= e, t /= e, n === 1 && t === 0 ? xe : n === 0 && t === 1 ? _e : new Fs(n, t);
}
function Ie(n, t, e, s) {
  this.x = this.xo = Math.round(n * 64) / 64, this.y = this.yo = Math.round(t * 64) / 64, this.lastPointOfContour = e, this.onCurve = s, this.prevPointOnContour = void 0, this.nextPointOnContour = void 0, this.xTouched = !1, this.yTouched = !1, Object.preventExtensions(this);
}
Ie.prototype.nextTouched = function(n) {
  let t = this.nextPointOnContour;
  for (; !n.touched(t) && t !== this; ) t = t.nextPointOnContour;
  return t;
};
Ie.prototype.prevTouched = function(n) {
  let t = this.prevPointOnContour;
  for (; !n.touched(t) && t !== this; ) t = t.prevPointOnContour;
  return t;
};
var ys = Object.freeze(new Ie(0, 0)), A0 = {
  cvCutIn: 17 / 16,
  // control value cut in
  deltaBase: 9,
  deltaShift: 0.125,
  loop: 1,
  // loops some instructions
  minDis: 1,
  // minimum distance
  autoFlip: !0
};
function Xe(n, t) {
  switch (this.env = n, this.stack = [], this.prog = t, n) {
    case "glyf":
      this.zp0 = this.zp1 = this.zp2 = 1, this.rp0 = this.rp1 = this.rp2 = 0;
    case "prep":
      this.fv = this.pv = this.dpv = xe, this.round = _l;
  }
}
Ol.prototype.exec = function(n, t) {
  if (typeof t != "number")
    throw new Error("Point size is not a number!");
  if (this._errorState > 2) return;
  const e = this.font;
  let s = this._prepState;
  if (!s || s.ppem !== t) {
    let i = this._fpgmState;
    if (!i) {
      Xe.prototype = A0, i = this._fpgmState = new Xe("fpgm", e.tables.fpgm), i.funcs = [], i.font = e, i.instructionCount = 0, i.callDepth = 0;
      try {
        pn(i);
      } catch (a) {
        console.log("Hinting error in FPGM:" + a), this._errorState = 3;
        return;
      }
    }
    Xe.prototype = i, s = this._prepState = new Xe("prep", e.tables.prep), s.ppem = t, s.instructionCount = 0, s.callDepth = 0;
    const r = e.variation && e.variation.process.getCvarTransform() || e.tables.cvt;
    if (r) {
      const a = s.cvt = new Array(r.length), o = t / e.unitsPerEm;
      for (let c = 0; c < r.length; c++)
        a[c] = r[c] * o;
    } else
      s.cvt = [];
    try {
      pn(s);
    } catch (a) {
      this._errorState < 2 && console.log("Hinting error in PREP:" + a), this._errorState = 2;
    }
  }
  if (!(this._errorState > 1))
    try {
      return Ml(n, s);
    } catch (i) {
      this._errorState < 1 && (console.log("Hinting error:" + i), console.log("Note: further hinting errors are silenced")), this._errorState = 1;
      return;
    }
};
Ml = function(n, t) {
  const e = t.ppem / t.font.unitsPerEm, s = e;
  let i = n.components, r, a, o;
  if (Xe.prototype = t, !i)
    o = new Xe("glyf", n.instructions), o.instructionCount = 0, o.callDepth = 0, ca(n, o, e, s), a = o.gZone;
  else {
    const c = t.font;
    a = [], r = [];
    for (let h = 0; h < i.length; h++) {
      const l = i[h], u = c.glyphs.get(l.glyphIndex);
      o = new Xe("glyf", u.instructions), o.instructionCount = 0, o.callDepth = 0, ca(u, o, e, s);
      const f = Math.round(l.dx * e), p = Math.round(l.dy * s), d = o.gZone, g = o.contours;
      for (let b = 0; b < d.length; b++) {
        const v = d[b];
        v.xTouched = v.yTouched = !1, v.xo = v.x = v.x + f, v.yo = v.y = v.y + p;
      }
      const x = a.length;
      a.push.apply(a, d);
      for (let b = 0; b < g.length; b++)
        r.push(g[b] + x);
    }
    n.instructions && !o.inhibitGridFit && (o = new Xe("glyf", n.instructions), o.gZone = o.z0 = o.z1 = o.z2 = a, o.contours = r, a.push(
      new Ie(0, 0),
      new Ie(Math.round(n.advanceWidth * e), 0)
    ), pn(o), a.length -= 2);
  }
  return a;
};
ca = function(n, t, e, s) {
  const i = n.points || [], r = i.length, a = t.gZone = t.z0 = t.z1 = t.z2 = [], o = t.contours = [];
  let c;
  for (let u = 0; u < r; u++)
    c = i[u], a[u] = new Ie(
      c.x * e,
      c.y * s,
      c.lastPointOfContour,
      c.onCurve
    );
  let h, l;
  for (let u = 0; u < r; u++)
    c = a[u], h || (h = c, o.push(u)), c.lastPointOfContour ? (c.nextPointOnContour = h, h.prevPointOnContour = c, h = void 0) : (l = a[u + 1], c.nextPointOnContour = l, l.prevPointOnContour = c);
  t.inhibitGridFit || (a.push(
    new Ie(0, 0),
    new Ie(Math.round(n.advanceWidth * e), 0)
  ), pn(t), a.length -= 2);
};
pn = function(n) {
  let t = n.prog;
  if (!t) return;
  const e = t.length;
  let s;
  for (n.ip = 0; n.ip < e; n.ip++) {
    if (++n.instructionCount > Ko)
      throw new Error(
        "Hinting instructions exceeded maximum of " + Ko
      );
    if (s = El[t[n.ip]], !s)
      throw new Error(
        "unknown instruction: 0x" + Number(t[n.ip]).toString(16)
      );
    s(n);
  }
};
function Ui(n) {
  const t = n.tZone = new Array(n.gZone.length);
  for (let e = 0; e < t.length; e++)
    t[e] = new Ie(0, 0);
}
function Il(n, t) {
  const e = n.prog;
  let s = n.ip, i = 1, r;
  do
    if (r = e[++s], r === 88)
      i++;
    else if (r === 89)
      i--;
    else if (r === 64)
      s += e[s + 1] + 1;
    else if (r === 65)
      s += 2 * e[s + 1] + 1;
    else if (r >= 176 && r <= 183)
      s += r - 176 + 1;
    else if (r >= 184 && r <= 191)
      s += (r - 184 + 1) * 2;
    else if (t && i === 1 && r === 27)
      break;
  while (i > 0);
  n.ip = s;
}
function Qo(n, t) {
  t.fv = t.pv = t.dpv = n;
}
function tc(n, t) {
  t.pv = t.dpv = n;
}
function ec(n, t) {
  t.fv = n;
}
function nc(n, t) {
  const e = t.stack, s = e.pop(), i = e.pop(), r = t.z2[s], a = t.z1[i];
  let o, c;
  n ? (o = r.y - a.y, c = a.x - r.x) : (o = a.x - r.x, c = a.y - r.y), t.pv = t.dpv = As(o, c);
}
function sc(n, t) {
  const e = t.stack, s = e.pop(), i = e.pop(), r = t.z2[s], a = t.z1[i];
  let o, c;
  n ? (o = r.y - a.y, c = a.x - r.x) : (o = a.x - r.x, c = a.y - r.y), t.fv = As(o, c);
}
function k0(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  n.pv = n.dpv = As(s, e);
}
function E0(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  n.fv = As(s, e);
}
function M0(n) {
  const t = n.stack, e = n.pv;
  t.push(e.x * 16384), t.push(e.y * 16384);
}
function O0(n) {
  const t = n.stack, e = n.fv;
  t.push(e.x * 16384), t.push(e.y * 16384);
}
function _0(n) {
  n.fv = n.pv;
}
function L0(n) {
  const t = n.stack, e = t.pop(), s = t.pop(), i = t.pop(), r = t.pop(), a = t.pop(), o = n.z0, c = n.z1, h = o[e], l = o[s], u = c[i], f = c[r], p = n.z2[a], d = h.x, g = h.y, x = l.x, b = l.y, v = u.x, S = u.y, w = f.x, F = f.y, O = (d - x) * (S - F) - (g - b) * (v - w), M = d * b - g * x, I = v * F - S * w;
  p.x = (M * (v - w) - I * (d - x)) / O, p.y = (M * (S - F) - I * (g - b)) / O;
}
function I0(n) {
  n.rp0 = n.stack.pop();
}
function B0(n) {
  n.rp1 = n.stack.pop();
}
function R0(n) {
  n.rp2 = n.stack.pop();
}
function D0(n) {
  const t = n.stack.pop();
  switch (n.zp0 = t, t) {
    case 0:
      n.tZone || Ui(n), n.z0 = n.tZone;
      break;
    case 1:
      n.z0 = n.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
function U0(n) {
  const t = n.stack.pop();
  switch (n.zp1 = t, t) {
    case 0:
      n.tZone || Ui(n), n.z1 = n.tZone;
      break;
    case 1:
      n.z1 = n.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
function P0(n) {
  const t = n.stack.pop();
  switch (n.zp2 = t, t) {
    case 0:
      n.tZone || Ui(n), n.z2 = n.tZone;
      break;
    case 1:
      n.z2 = n.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
function N0(n) {
  const t = n.stack.pop();
  switch (n.zp0 = n.zp1 = n.zp2 = t, t) {
    case 0:
      n.tZone || Ui(n), n.z0 = n.z1 = n.z2 = n.tZone;
      break;
    case 1:
      n.z0 = n.z1 = n.z2 = n.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
function z0(n) {
  n.loop = n.stack.pop(), n.loop > Oi && (n.loop = Oi);
}
function H0(n) {
  n.round = _l;
}
function G0(n) {
  n.round = C0;
}
function V0(n) {
  const t = n.stack.pop();
  n.minDis = t / 64;
}
function W0(n) {
  Il(n, !1);
}
function q0(n) {
  const t = n.stack.pop();
  n.ip += t - 1;
}
function j0(n) {
  const t = n.stack.pop();
  n.cvCutIn = t / 64;
}
function X0(n) {
  const t = n.stack;
  t.push(t[t.length - 1]);
}
function Cr(n) {
  n.stack.pop();
}
function Y0(n) {
  n.stack.length = 0;
}
function $0(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(e), t.push(s);
}
function Z0(n) {
  const t = n.stack;
  t.push(t.length);
}
function J0(n) {
  const t = n.stack, e = t.pop();
  let s = t.pop();
  if (s > Oi && (s = Oi), ++n.callDepth > Mi)
    throw new Error("Hinting call depth exceeded maximum of " + Mi);
  const i = n.ip, r = n.prog;
  n.prog = n.funcs[e];
  for (let a = 0; a < s; a++)
    pn(n);
  n.ip = i, n.prog = r, n.callDepth--;
}
function K0(n) {
  const t = n.stack.pop();
  if (++n.callDepth > Mi)
    throw new Error("Hinting call depth exceeded maximum of " + Mi);
  const e = n.ip, s = n.prog;
  n.prog = n.funcs[t], pn(n), n.ip = e, n.prog = s, n.callDepth--;
}
function Q0(n) {
  const t = n.stack, e = t.pop();
  t.push(t[t.length - e]);
}
function t1(n) {
  const t = n.stack, e = t.pop();
  t.push(t.splice(t.length - e, 1)[0]);
}
function e1(n) {
  if (n.env !== "fpgm") throw new Error("FDEF not allowed here");
  const t = n.stack, e = n.prog;
  let s = n.ip;
  const i = t.pop(), r = s;
  for (; e[++s] !== 45; ) ;
  n.ip = s, n.funcs[i] = e.slice(r + 1, s);
}
function ic(n, t) {
  const e = t.stack.pop(), s = t.z0[e], i = t.fv, r = t.pv;
  let a = r.distance(s, ys);
  n && (a = t.round(a)), i.setRelative(s, ys, a, r), i.touch(s), t.rp0 = t.rp1 = e;
}
function rc(n, t) {
  const e = t.z2, s = e.length - 2;
  let i, r, a;
  for (let o = 0; o < s; o++)
    i = e[o], !n.touched(i) && (r = i.prevTouched(n), r !== i && (a = i.nextTouched(n), r === a && n.setRelative(i, i, n.distance(r, r, !1, !0), n, !0), n.interpolate(i, r, a, n)));
}
function ac(n, t) {
  const e = t.stack, s = n ? t.rp1 : t.rp2, i = (n ? t.z0 : t.z1)[s], r = t.fv, a = t.pv;
  let o = t.loop;
  const c = t.z2;
  for (; o--; ) {
    const h = e.pop(), l = c[h], u = a.distance(i, i, !1, !0);
    r.setRelative(l, l, u, a), r.touch(l);
  }
  t.loop = 1;
}
function oc(n, t) {
  const e = t.stack, s = n ? t.rp1 : t.rp2, i = (n ? t.z0 : t.z1)[s], r = t.fv, a = t.pv, o = e.pop(), c = t.z2[t.contours[o]];
  let h = c;
  const l = a.distance(i, i, !1, !0);
  do
    h !== i && r.setRelative(h, h, l, a), h = h.nextPointOnContour;
  while (h !== c);
}
function cc(n, t) {
  const e = t.stack, s = n ? t.rp1 : t.rp2, i = (n ? t.z0 : t.z1)[s], r = t.fv, a = t.pv, o = e.pop();
  let c;
  switch (o) {
    case 0:
      c = t.tZone;
      break;
    case 1:
      c = t.gZone;
      break;
    default:
      throw new Error("Invalid zone");
  }
  let h;
  const l = a.distance(i, i, !1, !0), u = c.length - 2;
  for (let f = 0; f < u; f++)
    h = c[f], r.setRelative(h, h, l, a);
}
function n1(n) {
  const t = n.stack;
  let e = n.loop;
  const s = n.fv, i = t.pop() / 64, r = n.z2;
  for (; e--; ) {
    const a = t.pop(), o = r[a];
    s.setRelative(o, o, i), s.touch(o);
  }
  n.loop = 1;
}
function s1(n) {
  const t = n.stack, e = n.rp1, s = n.rp2;
  let i = n.loop;
  const r = n.z0[e], a = n.z1[s], o = n.fv, c = n.dpv, h = n.z2;
  for (; i--; ) {
    const l = t.pop(), u = h[l];
    o.interpolate(u, r, a, c), o.touch(u);
  }
  n.loop = 1;
}
function hc(n, t) {
  const e = t.stack, s = e.pop() / 64, i = e.pop(), r = t.z1[i], a = t.z0[t.rp0], o = t.fv, c = t.pv;
  o.setRelative(r, a, s, c), o.touch(r), t.rp1 = t.rp0, t.rp2 = i, n && (t.rp0 = i);
}
function i1(n) {
  const t = n.stack, e = n.rp0, s = n.z0[e];
  let i = n.loop;
  const r = n.fv, a = n.pv, o = n.z1;
  for (; i--; ) {
    const c = t.pop(), h = o[c];
    r.setRelative(h, s, 0, a), r.touch(h);
  }
  n.loop = 1;
}
function r1(n) {
  n.round = w0;
}
function lc(n, t) {
  const e = t.stack, s = e.pop(), i = e.pop(), r = t.z0[i], a = t.fv, o = t.pv;
  let c = t.cvt[s], h = o.distance(r, ys);
  n && (Math.abs(h - c) < t.cvCutIn && (h = c), h = t.round(h)), a.setRelative(r, ys, h, o), t.zp0 === 0 && (r.xo = r.x, r.yo = r.y), a.touch(r), t.rp0 = t.rp1 = i;
}
function a1(n) {
  const t = n.prog;
  let e = n.ip;
  const s = n.stack, i = t[++e];
  for (let r = 0; r < i; r++) s.push(t[++e]);
  n.ip = e;
}
function o1(n) {
  let t = n.ip;
  const e = n.prog, s = n.stack, i = e[++t];
  for (let r = 0; r < i; r++) {
    let a = e[++t] << 8 | e[++t];
    a & 32768 && (a = -((a ^ 65535) + 1)), s.push(a);
  }
  n.ip = t;
}
function c1(n) {
  const t = n.stack;
  let e = n.store;
  e || (e = n.store = []);
  const s = t.pop(), i = t.pop();
  e[i] = s;
}
function h1(n) {
  const t = n.stack, e = n.store, s = t.pop(), i = e && e[s] || 0;
  t.push(i);
}
function l1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  n.cvt[s] = e / 64;
}
function u1(n) {
  const t = n.stack, e = t.pop();
  t.push(n.cvt[e] * 64);
}
function uc(n, t) {
  const e = t.stack, s = e.pop(), i = t.z2[s];
  e.push(t.dpv.distance(i, ys, n, !1) * 64);
}
function fc(n, t) {
  const e = t.stack, s = e.pop(), i = e.pop(), r = t.z1[s], a = t.z0[i], o = t.dpv.distance(a, r, n, n);
  t.stack.push(Math.round(o * 64));
}
function f1(n) {
  n.stack.push(n.ppem);
}
function p1(n) {
  n.autoFlip = !0;
}
function d1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(s < e ? 1 : 0);
}
function g1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(s <= e ? 1 : 0);
}
function m1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(s > e ? 1 : 0);
}
function y1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(s >= e ? 1 : 0);
}
function x1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(e === s ? 1 : 0);
}
function b1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(e !== s ? 1 : 0);
}
function v1(n) {
  const t = n.stack, e = t.pop();
  t.push(Math.trunc(e) & 1 ? 1 : 0);
}
function S1(n) {
  const t = n.stack, e = t.pop();
  t.push(Math.trunc(e) & 1 ? 0 : 1);
}
function w1(n) {
  n.stack.pop() || Il(n, !0);
}
function C1(n) {
}
function T1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(e && s ? 1 : 0);
}
function F1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(e || s ? 1 : 0);
}
function A1(n) {
  const t = n.stack, e = t.pop();
  t.push(e ? 0 : 1);
}
function Tr(n, t) {
  const e = t.stack, s = e.pop(), i = t.fv, r = t.pv, a = t.ppem, o = t.deltaBase + (n - 1) * 16, c = t.deltaShift, h = t.z0;
  for (let l = 0; l < s; l++) {
    const u = e.pop(), f = e.pop();
    if (o + ((f & 240) >> 4) !== a) continue;
    let d = (f & 15) - 8;
    d >= 0 && d++;
    const g = h[u];
    i.setRelative(g, g, d * c, r);
  }
}
function k1(n) {
  const e = n.stack.pop();
  n.deltaBase = e;
}
function E1(n) {
  const e = n.stack.pop();
  n.deltaShift = Math.pow(0.5, e);
}
function M1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(s + e);
}
function O1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(s - e);
}
function _1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(s * 64 / e);
}
function L1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(s * e / 64);
}
function I1(n) {
  const t = n.stack, e = t.pop();
  t.push(Math.abs(e));
}
function B1(n) {
  const t = n.stack;
  let e = t.pop();
  t.push(-e);
}
function R1(n) {
  const t = n.stack, e = t.pop();
  t.push(Math.floor(e / 64) * 64);
}
function D1(n) {
  const t = n.stack, e = t.pop();
  t.push(Math.ceil(e / 64) * 64);
}
function ni(n, t) {
  const e = t.stack, s = e.pop();
  e.push(t.round(s / 64) * 64);
}
function U1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  n.cvt[s] = e * n.ppem / n.font.unitsPerEm;
}
function Fr(n, t) {
  const e = t.stack, s = e.pop(), i = t.ppem, r = t.deltaBase + (n - 1) * 16, a = t.deltaShift;
  for (let o = 0; o < s; o++) {
    const c = e.pop(), h = e.pop();
    if (r + ((h & 240) >> 4) !== i) continue;
    let u = (h & 15) - 8;
    u >= 0 && u++;
    const f = u * a;
    t.cvt[c] += f;
  }
}
function P1(n) {
  let t = n.stack.pop();
  n.round = Ll;
  let e;
  switch (t & 192) {
    case 0:
      e = 0.5;
      break;
    case 64:
      e = 1;
      break;
    case 128:
      e = 2;
      break;
    default:
      throw new Error("invalid SROUND value");
  }
  switch (n.srPeriod = e, t & 48) {
    case 0:
      n.srPhase = 0;
      break;
    case 16:
      n.srPhase = 0.25 * e;
      break;
    case 32:
      n.srPhase = 0.5 * e;
      break;
    case 48:
      n.srPhase = 0.75 * e;
      break;
    default:
      throw new Error("invalid SROUND value");
  }
  t &= 15, t === 0 ? n.srThreshold = 0 : n.srThreshold = (t / 8 - 0.5) * e;
}
function N1(n) {
  let t = n.stack.pop();
  n.round = Ll;
  let e;
  switch (t & 192) {
    case 0:
      e = Math.sqrt(2) / 2;
      break;
    case 64:
      e = Math.sqrt(2);
      break;
    case 128:
      e = 2 * Math.sqrt(2);
      break;
    default:
      throw new Error("invalid S45ROUND value");
  }
  switch (n.srPeriod = e, t & 48) {
    case 0:
      n.srPhase = 0;
      break;
    case 16:
      n.srPhase = 0.25 * e;
      break;
    case 32:
      n.srPhase = 0.5 * e;
      break;
    case 48:
      n.srPhase = 0.75 * e;
      break;
    default:
      throw new Error("invalid S45ROUND value");
  }
  t &= 15, t === 0 ? n.srThreshold = 0 : n.srThreshold = (t / 8 - 0.5) * e;
}
function z1(n) {
  n.round = S0;
}
function H1(n) {
  n.round = T0;
}
function G1(n) {
  n.round = F0;
}
function V1(n) {
  n.stack.pop();
}
function pc(n, t) {
  const e = t.stack, s = e.pop(), i = e.pop(), r = t.z2[s], a = t.z1[i];
  let o, c;
  n ? (o = r.y - a.y, c = a.x - r.x) : (o = a.x - r.x, c = a.y - r.y), t.dpv = As(o, c);
}
function W1(n) {
  const t = n.stack, e = t.pop();
  let s = 0;
  e & 1 && (s = 35), e & 32 && (s |= 4096), t.push(s);
}
function q1(n) {
  const t = n.stack, e = t.pop(), s = t.pop(), i = t.pop();
  t.push(s), t.push(e), t.push(i);
}
function j1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(Math.max(s, e));
}
function X1(n) {
  const t = n.stack, e = t.pop(), s = t.pop();
  t.push(Math.min(s, e));
}
function Y1(n) {
  n.stack.pop();
}
function $1(n) {
  const t = n.stack.pop();
  let e = n.stack.pop();
  switch (t) {
    case 1:
      n.inhibitGridFit = !!e;
      return;
    case 2:
      n.ignoreCvt = !!e;
      return;
    default:
      throw new Error("invalid INSTCTRL[] selector");
  }
}
function Ne(n, t) {
  const e = t.stack, s = t.prog;
  let i = t.ip;
  for (let r = 0; r < n; r++) e.push(s[++i]);
  t.ip = i;
}
function ze(n, t) {
  let e = t.ip;
  const s = t.prog, i = t.stack;
  for (let r = 0; r < n; r++) {
    let a = s[++e] << 8 | s[++e];
    a & 32768 && (a = -((a ^ 65535) + 1)), i.push(a);
  }
  t.ip = e;
}
function G(n, t, e, s, i, r) {
  const a = r.stack, o = n && a.pop(), c = a.pop(), h = r.rp0, l = r.z0[h], u = r.z1[c], f = r.minDis, p = r.fv, d = r.dpv;
  let g, x, b;
  g = d.distance(u, l, !0, !0), x = g >= 0 ? 1 : -1, g = Math.abs(g), n && (b = r.cvt[o], s && Math.abs(g - b) < r.cvCutIn && (g = b)), e && g < f && (g = f), s && (g = r.round(g)), p.setRelative(u, l, x * g, d), p.touch(u), r.rp1 = r.rp0, r.rp2 = c, t && (r.rp0 = c);
}
El = [
  /* 0x00 */
  Qo.bind(void 0, _e),
  /* 0x01 */
  Qo.bind(void 0, xe),
  /* 0x02 */
  tc.bind(void 0, _e),
  /* 0x03 */
  tc.bind(void 0, xe),
  /* 0x04 */
  ec.bind(void 0, _e),
  /* 0x05 */
  ec.bind(void 0, xe),
  /* 0x06 */
  nc.bind(void 0, 0),
  /* 0x07 */
  nc.bind(void 0, 1),
  /* 0x08 */
  sc.bind(void 0, 0),
  /* 0x09 */
  sc.bind(void 0, 1),
  /* 0x0A */
  k0,
  /* 0x0B */
  E0,
  /* 0x0C */
  M0,
  /* 0x0D */
  O0,
  /* 0x0E */
  _0,
  /* 0x0F */
  L0,
  /* 0x10 */
  I0,
  /* 0x11 */
  B0,
  /* 0x12 */
  R0,
  /* 0x13 */
  D0,
  /* 0x14 */
  U0,
  /* 0x15 */
  P0,
  /* 0x16 */
  N0,
  /* 0x17 */
  z0,
  /* 0x18 */
  H0,
  /* 0x19 */
  G0,
  /* 0x1A */
  V0,
  /* 0x1B */
  W0,
  /* 0x1C */
  q0,
  /* 0x1D */
  j0,
  /* 0x1E */
  void 0,
  // TODO SSWCI
  /* 0x1F */
  void 0,
  // TODO SSW
  /* 0x20 */
  X0,
  /* 0x21 */
  Cr,
  /* 0x22 */
  Y0,
  /* 0x23 */
  $0,
  /* 0x24 */
  Z0,
  /* 0x25 */
  Q0,
  /* 0x26 */
  t1,
  /* 0x27 */
  void 0,
  // TODO ALIGNPTS
  /* 0x28 */
  void 0,
  /* 0x29 */
  void 0,
  // TODO UTP
  /* 0x2A */
  J0,
  /* 0x2B */
  K0,
  /* 0x2C */
  e1,
  /* 0x2D */
  void 0,
  // ENDF (eaten by FDEF)
  /* 0x2E */
  ic.bind(void 0, 0),
  /* 0x2F */
  ic.bind(void 0, 1),
  /* 0x30 */
  rc.bind(void 0, _e),
  /* 0x31 */
  rc.bind(void 0, xe),
  /* 0x32 */
  ac.bind(void 0, 0),
  /* 0x33 */
  ac.bind(void 0, 1),
  /* 0x34 */
  oc.bind(void 0, 0),
  /* 0x35 */
  oc.bind(void 0, 1),
  /* 0x36 */
  cc.bind(void 0, 0),
  /* 0x37 */
  cc.bind(void 0, 1),
  /* 0x38 */
  n1,
  /* 0x39 */
  s1,
  /* 0x3A */
  hc.bind(void 0, 0),
  /* 0x3B */
  hc.bind(void 0, 1),
  /* 0x3C */
  i1,
  /* 0x3D */
  r1,
  /* 0x3E */
  lc.bind(void 0, 0),
  /* 0x3F */
  lc.bind(void 0, 1),
  /* 0x40 */
  a1,
  /* 0x41 */
  o1,
  /* 0x42 */
  c1,
  /* 0x43 */
  h1,
  /* 0x44 */
  l1,
  /* 0x45 */
  u1,
  /* 0x46 */
  uc.bind(void 0, 0),
  /* 0x47 */
  uc.bind(void 0, 1),
  /* 0x48 */
  void 0,
  // TODO SCFS
  /* 0x49 */
  fc.bind(void 0, 0),
  /* 0x4A */
  fc.bind(void 0, 1),
  /* 0x4B */
  f1,
  /* 0x4C */
  void 0,
  // TODO MPS
  /* 0x4D */
  p1,
  /* 0x4E */
  void 0,
  // TODO FLIPOFF
  /* 0x4F */
  void 0,
  // TODO DEBUG
  /* 0x50 */
  d1,
  /* 0x51 */
  g1,
  /* 0x52 */
  m1,
  /* 0x53 */
  y1,
  /* 0x54 */
  x1,
  /* 0x55 */
  b1,
  /* 0x56 */
  v1,
  /* 0x57 */
  S1,
  /* 0x58 */
  w1,
  /* 0x59 */
  C1,
  /* 0x5A */
  T1,
  /* 0x5B */
  F1,
  /* 0x5C */
  A1,
  /* 0x5D */
  Tr.bind(void 0, 1),
  /* 0x5E */
  k1,
  /* 0x5F */
  E1,
  /* 0x60 */
  M1,
  /* 0x61 */
  O1,
  /* 0x62 */
  _1,
  /* 0x63 */
  L1,
  /* 0x64 */
  I1,
  /* 0x65 */
  B1,
  /* 0x66 */
  R1,
  /* 0x67 */
  D1,
  /* 0x68 */
  ni.bind(void 0, 0),
  /* 0x69 */
  ni.bind(void 0, 1),
  /* 0x6A */
  ni.bind(void 0, 2),
  /* 0x6B */
  ni.bind(void 0, 3),
  /* 0x6C */
  void 0,
  // TODO NROUND[ab]
  /* 0x6D */
  void 0,
  // TODO NROUND[ab]
  /* 0x6E */
  void 0,
  // TODO NROUND[ab]
  /* 0x6F */
  void 0,
  // TODO NROUND[ab]
  /* 0x70 */
  U1,
  /* 0x71 */
  Tr.bind(void 0, 2),
  /* 0x72 */
  Tr.bind(void 0, 3),
  /* 0x73 */
  Fr.bind(void 0, 1),
  /* 0x74 */
  Fr.bind(void 0, 2),
  /* 0x75 */
  Fr.bind(void 0, 3),
  /* 0x76 */
  P1,
  /* 0x77 */
  N1,
  /* 0x78 */
  void 0,
  // TODO JROT[]
  /* 0x79 */
  void 0,
  // TODO JROF[]
  /* 0x7A */
  z1,
  /* 0x7B */
  void 0,
  /* 0x7C */
  H1,
  /* 0x7D */
  G1,
  /* 0x7E */
  Cr,
  // actually SANGW, supposed to do only a pop though
  /* 0x7F */
  Cr,
  // actually AA, supposed to do only a pop though
  /* 0x80 */
  void 0,
  // TODO FLIPPT
  /* 0x81 */
  void 0,
  // TODO FLIPRGON
  /* 0x82 */
  void 0,
  // TODO FLIPRGOFF
  /* 0x83 */
  void 0,
  /* 0x84 */
  void 0,
  /* 0x85 */
  V1,
  /* 0x86 */
  pc.bind(void 0, 0),
  /* 0x87 */
  pc.bind(void 0, 1),
  /* 0x88 */
  W1,
  /* 0x89 */
  void 0,
  // TODO IDEF
  /* 0x8A */
  q1,
  /* 0x8B */
  j1,
  /* 0x8C */
  X1,
  /* 0x8D */
  Y1,
  /* 0x8E */
  $1,
  /* 0x8F */
  void 0,
  /* 0x90 */
  void 0,
  /* 0x91 */
  void 0,
  /* 0x92 */
  void 0,
  /* 0x93 */
  void 0,
  /* 0x94 */
  void 0,
  /* 0x95 */
  void 0,
  /* 0x96 */
  void 0,
  /* 0x97 */
  void 0,
  /* 0x98 */
  void 0,
  /* 0x99 */
  void 0,
  /* 0x9A */
  void 0,
  /* 0x9B */
  void 0,
  /* 0x9C */
  void 0,
  /* 0x9D */
  void 0,
  /* 0x9E */
  void 0,
  /* 0x9F */
  void 0,
  /* 0xA0 */
  void 0,
  /* 0xA1 */
  void 0,
  /* 0xA2 */
  void 0,
  /* 0xA3 */
  void 0,
  /* 0xA4 */
  void 0,
  /* 0xA5 */
  void 0,
  /* 0xA6 */
  void 0,
  /* 0xA7 */
  void 0,
  /* 0xA8 */
  void 0,
  /* 0xA9 */
  void 0,
  /* 0xAA */
  void 0,
  /* 0xAB */
  void 0,
  /* 0xAC */
  void 0,
  /* 0xAD */
  void 0,
  /* 0xAE */
  void 0,
  /* 0xAF */
  void 0,
  /* 0xB0 */
  Ne.bind(void 0, 1),
  /* 0xB1 */
  Ne.bind(void 0, 2),
  /* 0xB2 */
  Ne.bind(void 0, 3),
  /* 0xB3 */
  Ne.bind(void 0, 4),
  /* 0xB4 */
  Ne.bind(void 0, 5),
  /* 0xB5 */
  Ne.bind(void 0, 6),
  /* 0xB6 */
  Ne.bind(void 0, 7),
  /* 0xB7 */
  Ne.bind(void 0, 8),
  /* 0xB8 */
  ze.bind(void 0, 1),
  /* 0xB9 */
  ze.bind(void 0, 2),
  /* 0xBA */
  ze.bind(void 0, 3),
  /* 0xBB */
  ze.bind(void 0, 4),
  /* 0xBC */
  ze.bind(void 0, 5),
  /* 0xBD */
  ze.bind(void 0, 6),
  /* 0xBE */
  ze.bind(void 0, 7),
  /* 0xBF */
  ze.bind(void 0, 8),
  /* 0xC0 */
  G.bind(void 0, 0, 0, 0, 0, 0),
  /* 0xC1 */
  G.bind(void 0, 0, 0, 0, 0, 1),
  /* 0xC2 */
  G.bind(void 0, 0, 0, 0, 0, 2),
  /* 0xC3 */
  G.bind(void 0, 0, 0, 0, 0, 3),
  /* 0xC4 */
  G.bind(void 0, 0, 0, 0, 1, 0),
  /* 0xC5 */
  G.bind(void 0, 0, 0, 0, 1, 1),
  /* 0xC6 */
  G.bind(void 0, 0, 0, 0, 1, 2),
  /* 0xC7 */
  G.bind(void 0, 0, 0, 0, 1, 3),
  /* 0xC8 */
  G.bind(void 0, 0, 0, 1, 0, 0),
  /* 0xC9 */
  G.bind(void 0, 0, 0, 1, 0, 1),
  /* 0xCA */
  G.bind(void 0, 0, 0, 1, 0, 2),
  /* 0xCB */
  G.bind(void 0, 0, 0, 1, 0, 3),
  /* 0xCC */
  G.bind(void 0, 0, 0, 1, 1, 0),
  /* 0xCD */
  G.bind(void 0, 0, 0, 1, 1, 1),
  /* 0xCE */
  G.bind(void 0, 0, 0, 1, 1, 2),
  /* 0xCF */
  G.bind(void 0, 0, 0, 1, 1, 3),
  /* 0xD0 */
  G.bind(void 0, 0, 1, 0, 0, 0),
  /* 0xD1 */
  G.bind(void 0, 0, 1, 0, 0, 1),
  /* 0xD2 */
  G.bind(void 0, 0, 1, 0, 0, 2),
  /* 0xD3 */
  G.bind(void 0, 0, 1, 0, 0, 3),
  /* 0xD4 */
  G.bind(void 0, 0, 1, 0, 1, 0),
  /* 0xD5 */
  G.bind(void 0, 0, 1, 0, 1, 1),
  /* 0xD6 */
  G.bind(void 0, 0, 1, 0, 1, 2),
  /* 0xD7 */
  G.bind(void 0, 0, 1, 0, 1, 3),
  /* 0xD8 */
  G.bind(void 0, 0, 1, 1, 0, 0),
  /* 0xD9 */
  G.bind(void 0, 0, 1, 1, 0, 1),
  /* 0xDA */
  G.bind(void 0, 0, 1, 1, 0, 2),
  /* 0xDB */
  G.bind(void 0, 0, 1, 1, 0, 3),
  /* 0xDC */
  G.bind(void 0, 0, 1, 1, 1, 0),
  /* 0xDD */
  G.bind(void 0, 0, 1, 1, 1, 1),
  /* 0xDE */
  G.bind(void 0, 0, 1, 1, 1, 2),
  /* 0xDF */
  G.bind(void 0, 0, 1, 1, 1, 3),
  /* 0xE0 */
  G.bind(void 0, 1, 0, 0, 0, 0),
  /* 0xE1 */
  G.bind(void 0, 1, 0, 0, 0, 1),
  /* 0xE2 */
  G.bind(void 0, 1, 0, 0, 0, 2),
  /* 0xE3 */
  G.bind(void 0, 1, 0, 0, 0, 3),
  /* 0xE4 */
  G.bind(void 0, 1, 0, 0, 1, 0),
  /* 0xE5 */
  G.bind(void 0, 1, 0, 0, 1, 1),
  /* 0xE6 */
  G.bind(void 0, 1, 0, 0, 1, 2),
  /* 0xE7 */
  G.bind(void 0, 1, 0, 0, 1, 3),
  /* 0xE8 */
  G.bind(void 0, 1, 0, 1, 0, 0),
  /* 0xE9 */
  G.bind(void 0, 1, 0, 1, 0, 1),
  /* 0xEA */
  G.bind(void 0, 1, 0, 1, 0, 2),
  /* 0xEB */
  G.bind(void 0, 1, 0, 1, 0, 3),
  /* 0xEC */
  G.bind(void 0, 1, 0, 1, 1, 0),
  /* 0xED */
  G.bind(void 0, 1, 0, 1, 1, 1),
  /* 0xEE */
  G.bind(void 0, 1, 0, 1, 1, 2),
  /* 0xEF */
  G.bind(void 0, 1, 0, 1, 1, 3),
  /* 0xF0 */
  G.bind(void 0, 1, 1, 0, 0, 0),
  /* 0xF1 */
  G.bind(void 0, 1, 1, 0, 0, 1),
  /* 0xF2 */
  G.bind(void 0, 1, 1, 0, 0, 2),
  /* 0xF3 */
  G.bind(void 0, 1, 1, 0, 0, 3),
  /* 0xF4 */
  G.bind(void 0, 1, 1, 0, 1, 0),
  /* 0xF5 */
  G.bind(void 0, 1, 1, 0, 1, 1),
  /* 0xF6 */
  G.bind(void 0, 1, 1, 0, 1, 2),
  /* 0xF7 */
  G.bind(void 0, 1, 1, 0, 1, 3),
  /* 0xF8 */
  G.bind(void 0, 1, 1, 1, 0, 0),
  /* 0xF9 */
  G.bind(void 0, 1, 1, 1, 0, 1),
  /* 0xFA */
  G.bind(void 0, 1, 1, 1, 0, 2),
  /* 0xFB */
  G.bind(void 0, 1, 1, 1, 0, 3),
  /* 0xFC */
  G.bind(void 0, 1, 1, 1, 1, 0),
  /* 0xFD */
  G.bind(void 0, 1, 1, 1, 1, 1),
  /* 0xFE */
  G.bind(void 0, 1, 1, 1, 1, 2),
  /* 0xFF */
  G.bind(void 0, 1, 1, 1, 1, 3)
];
var Z1 = Ol;
function $n(n) {
  this.char = n, this.state = {}, this.activeState = null;
}
function Aa(n, t, e) {
  this.contextName = e, this.startIndex = n, this.endOffset = t;
}
function J1(n, t, e) {
  this.contextName = n, this.openRange = null, this.ranges = [], this.checkStart = t, this.checkEnd = e;
}
function Dt(n, t) {
  this.context = n, this.index = t, this.length = n.length, this.current = n[t], this.backtrack = n.slice(0, t), this.lookahead = n.slice(t + 1);
}
function Pi(n) {
  this.eventId = n, this.subscribers = [];
}
function K1(n) {
  const t = [
    "start",
    "end",
    "next",
    "newToken",
    "contextStart",
    "contextEnd",
    "insertToken",
    "removeToken",
    "removeRange",
    "replaceToken",
    "replaceRange",
    "composeRUD",
    "updateContextsRanges"
  ];
  for (let s = 0; s < t.length; s++) {
    const i = t[s];
    Object.defineProperty(this.events, i, {
      value: new Pi(i)
    });
  }
  if (n)
    for (let s = 0; s < t.length; s++) {
      const i = t[s], r = n[i];
      typeof r == "function" && this.events[i].subscribe(r);
    }
  const e = [
    "insertToken",
    "removeToken",
    "removeRange",
    "replaceToken",
    "replaceRange",
    "composeRUD"
  ];
  for (let s = 0; s < e.length; s++) {
    const i = e[s];
    this.events[i].subscribe(
      this.updateContextsRanges
    );
  }
}
function pt(n) {
  this.tokens = [], this.registeredContexts = {}, this.contextCheckers = [], this.events = {}, this.registeredModifiers = [], K1.call(this, n);
}
$n.prototype.setState = function(n, t) {
  return this.state[n] = t, this.activeState = { key: n, value: this.state[n] }, this.activeState;
};
$n.prototype.getState = function(n) {
  return this.state[n] || null;
};
pt.prototype.inboundIndex = function(n) {
  return n >= 0 && n < this.tokens.length;
};
pt.prototype.composeRUD = function(n) {
  const e = n.map((i) => this[i[0]].apply(this, i.slice(1).concat(!0))), s = (i) => typeof i == "object" && Object.prototype.hasOwnProperty.call(i, "FAIL");
  if (e.every(s))
    return {
      FAIL: "composeRUD: one or more operations hasn't completed successfully",
      report: e.filter(s)
    };
  this.dispatch("composeRUD", [e.filter((i) => !s(i))]);
};
pt.prototype.replaceRange = function(n, t, e, s) {
  t = t !== null ? t : this.tokens.length;
  const i = e.every((r) => r instanceof $n);
  if (!isNaN(n) && this.inboundIndex(n) && i) {
    const r = this.tokens.splice.apply(
      this.tokens,
      [n, t].concat(e)
    );
    return s || this.dispatch("replaceToken", [n, t, e]), [r, e];
  } else
    return { FAIL: "replaceRange: invalid tokens or startIndex." };
};
pt.prototype.replaceToken = function(n, t, e) {
  if (!isNaN(n) && this.inboundIndex(n) && t instanceof $n) {
    const s = this.tokens.splice(n, 1, t);
    return e || this.dispatch("replaceToken", [n, t]), [s[0], t];
  } else
    return { FAIL: "replaceToken: invalid token or index." };
};
pt.prototype.removeRange = function(n, t, e) {
  t = isNaN(t) ? this.tokens.length : t;
  const s = this.tokens.splice(n, t);
  return e || this.dispatch("removeRange", [s, n, t]), s;
};
pt.prototype.removeToken = function(n, t) {
  if (!isNaN(n) && this.inboundIndex(n)) {
    const e = this.tokens.splice(n, 1);
    return t || this.dispatch("removeToken", [e, n]), e;
  } else
    return { FAIL: "removeToken: invalid token index." };
};
pt.prototype.insertToken = function(n, t, e) {
  return n.every(
    (i) => i instanceof $n
  ) ? (this.tokens.splice.apply(
    this.tokens,
    [t, 0].concat(n)
  ), e || this.dispatch("insertToken", [n, t]), n) : { FAIL: "insertToken: invalid token(s)." };
};
pt.prototype.registerModifier = function(n, t, e) {
  this.events.newToken.subscribe(function(s, i) {
    const r = [s, i], a = t === null || t.apply(this, r) === !0, o = [s, i];
    if (a) {
      let c = e.apply(this, o);
      s.setState(n, c);
    }
  }), this.registeredModifiers.push(n);
};
Pi.prototype.subscribe = function(n) {
  return typeof n == "function" ? this.subscribers.push(n) - 1 : { FAIL: `invalid '${this.eventId}' event handler` };
};
Pi.prototype.unsubscribe = function(n) {
  this.subscribers.splice(n, 1);
};
Dt.prototype.setCurrentIndex = function(n) {
  this.index = n, this.current = this.context[n], this.backtrack = this.context.slice(0, n), this.lookahead = this.context.slice(n + 1);
};
Dt.prototype.get = function(n) {
  switch (!0) {
    case n === 0:
      return this.current;
    case (n < 0 && Math.abs(n) <= this.backtrack.length):
      return this.backtrack.slice(n)[0];
    case (n > 0 && n <= this.lookahead.length):
      return this.lookahead[n - 1];
    default:
      return null;
  }
};
pt.prototype.rangeToText = function(n) {
  if (n instanceof Aa)
    return this.getRangeTokens(n).map((t) => t.char).join("");
};
pt.prototype.getText = function() {
  return this.tokens.map((n) => n.char).join("");
};
pt.prototype.getContext = function(n) {
  let t = this.registeredContexts[n];
  return t || null;
};
pt.prototype.on = function(n, t) {
  const e = this.events[n];
  return e ? e.subscribe(t) : null;
};
pt.prototype.dispatch = function(n, t) {
  const e = this.events[n];
  if (e instanceof Pi)
    for (let s = 0; s < e.subscribers.length; s++)
      e.subscribers[s].apply(this, t || []);
};
pt.prototype.registerContextChecker = function(n, t, e) {
  if (this.getContext(n)) return {
    FAIL: `context name '${n}' is already registered.`
  };
  if (typeof t != "function") return {
    FAIL: "missing context start check."
  };
  if (typeof e != "function") return {
    FAIL: "missing context end check."
  };
  const s = new J1(
    n,
    t,
    e
  );
  return this.registeredContexts[n] = s, this.contextCheckers.push(s), s;
};
pt.prototype.getRangeTokens = function(n) {
  const t = n.startIndex + n.endOffset;
  return [].concat(
    this.tokens.slice(n.startIndex, t)
  );
};
pt.prototype.getContextRanges = function(n) {
  const t = this.getContext(n);
  return t ? t.ranges : { FAIL: `context checker '${n}' is not registered.` };
};
pt.prototype.resetContextsRanges = function() {
  const n = this.registeredContexts;
  for (const t in n)
    if (Object.prototype.hasOwnProperty.call(n, t)) {
      const e = n[t];
      e.ranges = [];
    }
};
pt.prototype.updateContextsRanges = function() {
  this.resetContextsRanges();
  const n = this.tokens.map((t) => t.char);
  for (let t = 0; t < n.length; t++) {
    const e = new Dt(n, t);
    this.runContextCheck(e);
  }
  this.dispatch("updateContextsRanges", [this.registeredContexts]);
};
pt.prototype.setEndOffset = function(n, t) {
  const e = this.getContext(t).openRange.startIndex;
  let s = new Aa(e, n, t);
  const i = this.getContext(t).ranges;
  return s.rangeId = `${t}.${i.length}`, i.push(s), this.getContext(t).openRange = null, s;
};
pt.prototype.runContextCheck = function(n) {
  const t = n.index;
  for (let e = 0; e < this.contextCheckers.length; e++) {
    const s = this.contextCheckers[e];
    let i = s.contextName, r = this.getContext(i).openRange;
    if (!r && s.checkStart(n) && (r = new Aa(t, null, i), this.getContext(i).openRange = r, this.dispatch("contextStart", [i, t])), r && s.checkEnd(n)) {
      const a = t - r.startIndex + 1, o = this.setEndOffset(a, i);
      this.dispatch("contextEnd", [i, o]);
    }
  }
};
pt.prototype.tokenize = function(n) {
  this.tokens = [], this.resetContextsRanges();
  let t = Array.from(n);
  this.dispatch("start");
  for (let e = 0; e < t.length; e++) {
    const s = t[e], i = new Dt(t, e);
    this.dispatch("next", [i]), this.runContextCheck(i);
    let r = new $n(s);
    this.tokens.push(r), this.dispatch("newToken", [r, i]);
  }
  return this.dispatch("end", [this.tokens]), this.tokens;
};
var Q1 = pt;
function Ze(n) {
  return /[\u0600-\u065F\u066A-\u06D2\u06FA-\u06FF]/.test(n);
}
function Bl(n) {
  return /[\u0630\u0690\u0621\u0631\u0661\u0671\u0622\u0632\u0672\u0692\u06C2\u0623\u0673\u0693\u06C3\u0624\u0694\u06C4\u0625\u0675\u0695\u06C5\u06E5\u0676\u0696\u06C6\u0627\u0677\u0697\u06C7\u0648\u0688\u0698\u06C8\u0689\u0699\u06C9\u068A\u06CA\u066B\u068B\u06CB\u068C\u068D\u06CD\u06FD\u068E\u06EE\u06FE\u062F\u068F\u06CF\u06EF]/.test(n);
}
function Je(n) {
  return /[\u0600-\u0605\u060C-\u060E\u0610-\u061B\u061E\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/.test(n);
}
function hi(n) {
  return /[\u0E00-\u0E7F]/.test(n);
}
function li(n) {
  return /[A-z]/.test(n);
}
function tg(n) {
  return /\s/.test(n);
}
function Yt(n) {
  this.font = n, this.features = {};
}
function qe(n) {
  this.id = n.id, this.tag = n.tag, this.substitution = n.substitution;
}
function Ke(n, t) {
  if (!n) return -1;
  switch (t.format) {
    case 1:
      return t.glyphs.indexOf(n);
    case 2: {
      let e = t.ranges;
      for (let s = 0; s < e.length; s++) {
        const i = e[s];
        if (n >= i.start && n <= i.end) {
          let r = n - i.start;
          return i.index + r;
        }
      }
      break;
    }
    default:
      return -1;
  }
  return -1;
}
function eg(n, t) {
  return Ke(n, t.coverage) === -1 ? null : n + t.deltaGlyphId;
}
function ng(n, t) {
  let e = Ke(n, t.coverage);
  return e === -1 ? null : t.substitute[e];
}
function Ar(n, t) {
  let e = [];
  for (let s = 0; s < n.length; s++) {
    const i = n[s];
    let r = t.current;
    r = Array.isArray(r) ? r[0] : r;
    const a = Ke(r, i);
    a !== -1 && e.push(a);
  }
  return e.length !== n.length ? -1 : e;
}
function sg(n, t) {
  const e = t.inputCoverage.length + t.lookaheadCoverage.length + t.backtrackCoverage.length;
  if (n.context.length < e) return [];
  let s = Ar(
    t.inputCoverage,
    n
  );
  if (s === -1) return [];
  const i = t.inputCoverage.length - 1;
  if (n.lookahead.length < t.lookaheadCoverage.length) return [];
  let r = n.lookahead.slice(i);
  for (; r.length && Je(r[0].char); )
    r.shift();
  const a = new Dt(r, 0);
  let o = Ar(
    t.lookaheadCoverage,
    a
  ), c = [].concat(n.backtrack);
  for (c.reverse(); c.length && Je(c[0].char); )
    c.shift();
  if (c.length < t.backtrackCoverage.length) return [];
  const h = new Dt(c, 0);
  let l = Ar(
    t.backtrackCoverage,
    h
  );
  const u = s.length === t.inputCoverage.length && o.length === t.lookaheadCoverage.length && l.length === t.backtrackCoverage.length;
  let f = [];
  if (u)
    for (let p = 0; p < t.lookupRecords.length; p++) {
      const d = t.lookupRecords[p], g = d.lookupListIndex, x = this.getLookupByIndex(g);
      for (let b = 0; b < x.subtables.length; b++) {
        let v = x.subtables[b], S, w = this.getSubstitutionType(x, v);
        if (w === "71" ? (w = this.getSubstitutionType(v, v.extension), S = this.getLookupMethod(v, v.extension), v = v.extension) : S = this.getLookupMethod(x, v), w === "12") {
          const F = n.get(d.sequenceIndex), O = S(F);
          O && f.push(O);
        } else if (w === "21") {
          const F = n.get(d.sequenceIndex), O = S(F);
          O && f.push(O);
        } else
          throw new Error(`Substitution type ${w} is not supported in chaining substitution`);
      }
    }
  return f;
}
function ig(n, t) {
  let e = n.current, s = Ke(e, t.coverage);
  if (s === -1) return null;
  let i, r = t.ligatureSets[s];
  for (let a = 0; a < r.length; a++) {
    i = r[a];
    for (let o = 0; o < i.components.length; o++) {
      const c = n.lookahead[o], h = i.components[o];
      if (c !== h) break;
      if (o === i.components.length - 1) return i;
    }
  }
  return null;
}
function rg(n, t) {
  let e = n.current;
  if (Ke(e, t.coverage) === -1)
    return null;
  for (const i of t.ruleSets)
    for (const r of i) {
      let a = !0;
      for (let o = 0; o < r.input.length; o++)
        if (n.lookahead[o] !== r.input[o]) {
          a = !1;
          break;
        }
      if (a) {
        let o = [];
        o.push(e);
        for (let h = 0; h < r.input.length; h++)
          o.push(r.input[h]);
        const c = (h, l) => {
          const { lookupListIndex: u, sequenceIndex: f } = l, { subtables: p } = this.getLookupByIndex(u);
          for (const d of p)
            Ke(h[f], d.coverage) !== -1 && (h[f] = d.deltaGlyphId);
        };
        for (let h = 0; h < r.lookupRecords.length; h++) {
          const l = r.lookupRecords[h];
          c(o, l);
        }
        return o;
      }
    }
  return null;
}
function ag(n, t) {
  if (n.context.length < t.coverages.length)
    return [];
  for (let s = 0; s < t.coverages.length; s++) {
    let i = n.get(s);
    if (i = Array.isArray(i) ? i[0] : i, Ke(i, t.coverages[s]) === -1)
      return [];
  }
  let e = [];
  for (let s = 0; s < t.lookupRecords.length; s++) {
    const i = t.lookupRecords[s], r = i.lookupListIndex, a = this.getLookupByIndex(r);
    for (let o = 0; o < a.subtables.length; o++) {
      let c = a.subtables[o], h, l = this.getSubstitutionType(a, c);
      if (l === "71" ? (l = this.getSubstitutionType(c, c.extension), h = this.getLookupMethod(c, c.extension), c = c.extension) : h = this.getLookupMethod(a, c), l === "12") {
        const u = n.get(i.sequenceIndex), f = h(u);
        f && e.push(f);
      } else if (l === "21") {
        const u = n.get(i.sequenceIndex), f = h(u);
        f && e.push(f);
      }
    }
  }
  return e;
}
function og(n, t) {
  let e = Ke(n, t.coverage);
  return e === -1 ? null : t.sequences[e];
}
Yt.prototype.getDefaultScriptFeaturesIndexes = function() {
  const n = this.font.tables.gsub.scripts;
  for (let t = 0; t < n.length; t++) {
    const e = n[t];
    if (e.tag === "DFLT") return e.script.defaultLangSys.featureIndexes;
  }
  return [];
};
Yt.prototype.getScriptFeaturesIndexes = function(n) {
  if (!this.font.tables.gsub) return [];
  if (!n) return this.getDefaultScriptFeaturesIndexes();
  const e = this.font.tables.gsub.scripts;
  for (let s = 0; s < e.length; s++) {
    const i = e[s];
    if (i.tag === n && i.script.defaultLangSys)
      return i.script.defaultLangSys.featureIndexes;
    {
      let r = i.langSysRecords;
      if (r)
        for (let a = 0; a < r.length; a++) {
          const o = r[a];
          if (o.tag === n)
            return o.langSys.featureIndexes;
        }
    }
  }
  return this.getDefaultScriptFeaturesIndexes();
};
Yt.prototype.mapTagsToFeatures = function(n, t) {
  let e = {};
  for (let s = 0; s < n.length; s++) {
    const i = n[s].tag, r = n[s].feature;
    e[i] = r;
  }
  this.features[t].tags = e;
};
Yt.prototype.getScriptFeatures = function(n) {
  let t = this.features[n];
  if (Object.prototype.hasOwnProperty.call(this.features, n)) return t;
  const e = this.getScriptFeaturesIndexes(n);
  if (!e) return null;
  const s = this.font.tables.gsub;
  return t = e.map((i) => s.features[i]), this.features[n] = t, this.mapTagsToFeatures(t, n), t;
};
Yt.prototype.getSubstitutionType = function(n, t) {
  const e = n.lookupType.toString(), s = t.substFormat.toString();
  return e + s;
};
Yt.prototype.getLookupMethod = function(n, t) {
  let e = this.getSubstitutionType(n, t);
  switch (e) {
    case "11":
      return (s) => eg.apply(
        this,
        [s, t]
      );
    case "12":
      return (s) => ng.apply(
        this,
        [s, t]
      );
    case "63":
      return (s) => sg.apply(
        this,
        [s, t]
      );
    case "41":
      return (s) => ig.apply(
        this,
        [s, t]
      );
    case "21":
      return (s) => og.apply(
        this,
        [s, t]
      );
    case "51":
      return (s) => rg.apply(
        this,
        [s, t]
      );
    case "53":
      return (s) => ag.apply(
        this,
        [s, t]
      );
    default:
      throw new Error(
        `substitutionType : ${e} lookupType: ${n.lookupType} - substFormat: ${t.substFormat} is not yet supported`
      );
  }
};
Yt.prototype.lookupFeature = function(n) {
  let t = n.contextParams, e = t.index;
  const s = this.getFeature({
    tag: n.tag,
    script: n.script
  });
  if (!s) return new Error(
    `font '${(this.font.names.unicode || this.font.names.windows || this.font.names.macintosh).fullName.en}' doesn't support feature '${n.tag}' for script '${n.script}'.`
  );
  const i = this.getFeatureLookups(s), r = [].concat(t.context);
  for (let a = 0; a < i.length; a++) {
    const o = i[a], c = this.getLookupSubtables(o);
    for (let h = 0; h < c.length; h++) {
      let l = c[h], u = this.getSubstitutionType(o, l), f;
      u === "71" ? (u = this.getSubstitutionType(l, l.extension), f = this.getLookupMethod(l, l.extension), l = l.extension) : f = this.getLookupMethod(o, l);
      let p;
      switch (u) {
        case "11":
          p = f(t.current), p && r.splice(e, 1, new qe({
            id: 11,
            tag: n.tag,
            substitution: p
          }));
          break;
        case "12":
          p = f(t.current), p && r.splice(e, 1, new qe({
            id: 12,
            tag: n.tag,
            substitution: p
          }));
          break;
        case "63":
          p = f(t), Array.isArray(p) && p.length && r.splice(e, 1, new qe({
            id: 63,
            tag: n.tag,
            substitution: p
          }));
          break;
        case "41":
          p = f(t), p && r.splice(e, 1, new qe({
            id: 41,
            tag: n.tag,
            substitution: p
          }));
          break;
        case "21":
          p = f(t.current), p && r.splice(e, 1, new qe({
            id: 21,
            tag: n.tag,
            substitution: p
          }));
          break;
        case "51":
        case "53":
          p = f(t), Array.isArray(p) && p.length && r.splice(e, 1, new qe({
            id: parseInt(u),
            tag: n.tag,
            substitution: p
          }));
          break;
      }
      t = new Dt(r, e), !(Array.isArray(p) && !p.length) && (p = null);
    }
  }
  return r.length ? r : null;
};
Yt.prototype.supports = function(n) {
  if (!n.script) return !1;
  this.getScriptFeatures(n.script);
  const t = Object.prototype.hasOwnProperty.call(this.features, n.script);
  if (!n.tag) return t;
  const e = this.features[n.script].some((s) => s.tag === n.tag);
  return t && e;
};
Yt.prototype.getLookupSubtables = function(n) {
  return n.subtables || null;
};
Yt.prototype.getLookupByIndex = function(n) {
  return this.font.tables.gsub.lookups[n] || null;
};
Yt.prototype.getFeatureLookups = function(n) {
  return n.lookupListIndexes.map(this.getLookupByIndex.bind(this));
};
Yt.prototype.getFeature = function(t) {
  if (!this.font) return { FAIL: "No font was found" };
  Object.prototype.hasOwnProperty.call(this.features, t.script) || this.getScriptFeatures(t.script);
  const e = this.features[t.script];
  return e ? e.tags[t.tag] ? this.features[t.script].tags[t.tag] : null : { FAIL: `No feature for script ${t.script}` };
};
var cg = Yt;
function hg(n) {
  const t = n.current, e = n.get(-1);
  return (
    // ? arabic first char
    e === null && Ze(t) || // ? arabic char preceded with a non arabic char
    !Ze(e) && Ze(t)
  );
}
function lg(n) {
  const t = n.get(1);
  return (
    // ? last arabic char
    t === null || // ? next char is not arabic
    !Ze(t)
  );
}
var ug = {
  startCheck: hg,
  endCheck: lg
};
function fg(n) {
  const t = n.current, e = n.get(-1);
  return (
    // ? an arabic char preceded with a non arabic char
    (Ze(t) || Je(t)) && !Ze(e)
  );
}
function pg(n) {
  const t = n.get(1);
  switch (!0) {
    case t === null:
      return !0;
    case (!Ze(t) && !Je(t)): {
      const e = tg(t);
      if (!e) return !0;
      if (e) {
        let s = !1;
        if (s = n.lookahead.some(
          (i) => Ze(i) || Je(i)
        ), !s) return !0;
      }
      break;
    }
    default:
      return !1;
  }
}
var dg = {
  startCheck: fg,
  endCheck: pg
};
function gg(n, t, e) {
  t[e].setState(n.tag, n.substitution);
}
function mg(n, t, e) {
  t[e].setState(n.tag, n.substitution);
}
function kr(n, t, e) {
  for (let s = 0; s < n.substitution.length; s++) {
    const i = n.substitution[s], r = t[e + s];
    if (Array.isArray(i)) {
      i.length ? r.setState(n.tag, i[0]) : r.setState("deleted", !0);
      continue;
    }
    r.setState(n.tag, i);
  }
}
function yg(n, t, e) {
  let s = t[e];
  s.setState(n.tag, n.substitution.ligGlyph);
  const i = n.substitution.components.length;
  for (let r = 0; r < i; r++)
    s = t[e + r + 1], s.setState("deleted", !0);
}
var dc = {
  11: gg,
  12: mg,
  63: kr,
  41: yg,
  51: kr,
  53: kr
};
function xg(n, t, e) {
  n instanceof qe && dc[n.id] && dc[n.id](n, t, e);
}
var yn = xg;
function bg(n) {
  let t = [].concat(n.backtrack);
  for (let e = t.length - 1; e >= 0; e--) {
    const s = t[e], i = Bl(s), r = Je(s);
    if (!i && !r) return !0;
    if (i) return !1;
  }
  return !1;
}
function vg(n) {
  if (Bl(n.current)) return !1;
  for (let t = 0; t < n.lookahead.length; t++) {
    const e = n.lookahead[t];
    if (!Je(e)) return !0;
  }
  return !1;
}
function Sg(n) {
  const t = "arab", e = this.featuresTags[t], s = this.tokenizer.getRangeTokens(n);
  if (s.length === 1) return;
  let i = new Dt(
    s.map(
      (a) => a.getState("glyphIndex")
    ),
    0
  );
  const r = new Dt(
    s.map(
      (a) => a.char
    ),
    0
  );
  for (let a = 0; a < s.length; a++) {
    const o = s[a];
    if (Je(o.char)) continue;
    i.setCurrentIndex(a), r.setCurrentIndex(a);
    let c = 0;
    bg(r) && (c |= 1), vg(r) && (c |= 2);
    let h;
    switch (c) {
      case 1:
        h = "fina";
        break;
      case 2:
        h = "init";
        break;
      case 3:
        h = "medi";
        break;
    }
    if (e.indexOf(h) === -1) continue;
    let l = this.query.lookupFeature({
      tag: h,
      script: t,
      contextParams: i
    });
    if (l instanceof Error) {
      console.info(l.message);
      continue;
    }
    for (let u = 0; u < l.length; u++) {
      const f = l[u];
      f instanceof qe && (yn(f, s, u), i.context[u] = f.substitution);
    }
  }
}
var wg = Sg;
function gc(n, t) {
  const e = n.map((s) => s.activeState.value);
  return new Dt(e, 0);
}
function Cg(n) {
  const t = "arab";
  let e = this.tokenizer.getRangeTokens(n), s = gc(e);
  for (let i = 0; i < s.context.length; i++) {
    s.setCurrentIndex(i);
    let r = this.query.lookupFeature({
      tag: "rlig",
      script: t,
      contextParams: s
    });
    if (r.length) {
      for (let a = 0; a < r.length; a++) {
        const o = r[a];
        yn(o, e, i);
      }
      s = gc(e);
    }
  }
}
var Tg = Cg;
function Fg(n) {
  return n.index === 0 && n.context.length > 1;
}
function Ag(n) {
  return n.index === n.context.length - 1;
}
var kg = {
  startCheck: Fg,
  endCheck: Ag
};
function mc(n, t) {
  const e = n.map((s) => s.activeState.value);
  return new Dt(e, 0);
}
function Eg(n) {
  const t = "delf", e = "ccmp";
  let s = this.tokenizer.getRangeTokens(n), i = mc(s);
  for (let r = 0; r < i.context.length; r++) {
    if (!this.query.getFeature({ tag: e, script: t, contextParams: i }))
      continue;
    i.setCurrentIndex(r);
    let a = this.query.lookupFeature({
      tag: e,
      script: t,
      contextParams: i
    });
    if (a.length) {
      for (let o = 0; o < a.length; o++) {
        const c = a[o];
        yn(c, s, r);
      }
      i = mc(s);
    }
  }
}
var Mg = Eg;
function Og(n) {
  const t = n.current, e = n.get(-1);
  return (
    // ? latin first char
    e === null && li(t) || // ? latin char preceded with a non latin char
    !li(e) && li(t)
  );
}
function _g(n) {
  const t = n.get(1);
  return (
    // ? last latin char
    t === null || // ? next char is not latin
    !li(t)
  );
}
var Lg = {
  startCheck: Og,
  endCheck: _g
};
function yc(n, t) {
  const e = n.map((s) => s.activeState.value);
  return new Dt(e, 0);
}
function Ig(n) {
  const t = "latn";
  let e = this.tokenizer.getRangeTokens(n), s = yc(e);
  for (let i = 0; i < s.context.length; i++) {
    s.setCurrentIndex(i);
    let r = this.query.lookupFeature({
      tag: "liga",
      script: t,
      contextParams: s
    });
    if (r.length) {
      for (let a = 0; a < r.length; a++) {
        const o = r[a];
        yn(o, e, i);
      }
      s = yc(e);
    }
  }
}
var Bg = Ig;
function Rg(n) {
  const t = n.current, e = n.get(-1);
  return (
    // ? thai first char
    e === null && hi(t) || // ? thai char preceded with a non thai char
    !hi(e) && hi(t)
  );
}
function Dg(n) {
  const t = n.get(1);
  return (
    // ? last thai char
    t === null || // ? next char is not thai
    !hi(t)
  );
}
var Ug = {
  startCheck: Rg,
  endCheck: Dg
};
function xc(n, t) {
  const e = n.map((s) => s.activeState.value);
  return new Dt(e, t || 0);
}
function Pg(n) {
  const t = "thai";
  let e = this.tokenizer.getRangeTokens(n), s = xc(e, 0);
  for (let i = 0; i < s.context.length; i++) {
    s.setCurrentIndex(i);
    let r = this.query.lookupFeature({
      tag: "ccmp",
      script: t,
      contextParams: s
    });
    if (r.length) {
      for (let a = 0; a < r.length; a++) {
        const o = r[a];
        yn(o, e, i);
      }
      s = xc(e, i);
    }
  }
}
var Ng = Pg;
function bc(n, t) {
  const e = n.map((s) => s.activeState.value);
  return new Dt(e, t || 0);
}
function zg(n) {
  const t = "thai";
  let e = this.tokenizer.getRangeTokens(n), s = bc(e, 0);
  for (let i = 0; i < s.context.length; i++) {
    s.setCurrentIndex(i);
    let r = this.query.lookupFeature({
      tag: "liga",
      script: t,
      contextParams: s
    });
    if (r.length) {
      for (let a = 0; a < r.length; a++) {
        const o = r[a];
        yn(o, e, i);
      }
      s = bc(e, i);
    }
  }
}
var Hg = zg;
function vc(n, t) {
  const e = n.map((s) => s.activeState.value);
  return new Dt(e, t || 0);
}
function Gg(n) {
  const t = "thai";
  let e = this.tokenizer.getRangeTokens(n), s = vc(e, 0);
  for (let i = 0; i < s.context.length; i++) {
    s.setCurrentIndex(i);
    let r = this.query.lookupFeature({
      tag: "rlig",
      script: t,
      contextParams: s
    });
    if (r.length) {
      for (let a = 0; a < r.length; a++) {
        const o = r[a];
        yn(o, e, i);
      }
      s = vc(e, i);
    }
  }
}
var Vg = Gg;
function ha(n) {
  if (n === null) return !1;
  const t = n.codePointAt(0);
  return (
    // Mongolian Variation Selectors
    t >= 6155 && t <= 6157 || // Generic Variation Selectors
    t >= 65024 && t <= 65039 || // Ideographic Variation Sequences
    t >= 917760 && t <= 917999
  );
}
function Wg(n) {
  const t = n.current, e = n.get(1);
  return e === null && ha(t) || ha(e);
}
function qg(n) {
  const t = n.get(1);
  return t === null || !ha(t);
}
var jg = {
  startCheck: Wg,
  endCheck: qg
};
function Xg(n) {
  const t = this.query.font, e = this.tokenizer.getRangeTokens(n);
  if (e[1].setState("deleted", !0), t.tables.cmap && t.tables.cmap.varSelectorList) {
    const s = e[0].char.codePointAt(0), i = e[1].char.codePointAt(0), r = t.tables.cmap.varSelectorList[i];
    if (r !== void 0 && r.nonDefaultUVS) {
      const a = r.nonDefaultUVS.uvsMappings;
      if (a[s]) {
        const o = a[s].glyphID;
        t.glyphs.glyphs[o] !== void 0 && e[0].setState("glyphIndex", o);
      }
    }
  }
}
var Yg = Xg;
function Qt(n) {
  this.baseDir = n || "ltr", this.tokenizer = new Q1(), this.featuresTags = {};
}
Qt.prototype.setText = function(n) {
  this.text = n;
};
Qt.prototype.contextChecks = {
  ccmpReplacementCheck: kg,
  latinWordCheck: Lg,
  arabicWordCheck: ug,
  arabicSentenceCheck: dg,
  thaiWordCheck: Ug,
  unicodeVariationSequenceCheck: jg
};
function _n(n) {
  const t = this.contextChecks[`${n}Check`];
  return this.tokenizer.registerContextChecker(
    n,
    t.startCheck,
    t.endCheck
  );
}
function $g() {
  return _n.call(this, "ccmpReplacement"), _n.call(this, "latinWord"), _n.call(this, "arabicWord"), _n.call(this, "arabicSentence"), _n.call(this, "thaiWord"), _n.call(this, "unicodeVariationSequence"), this.tokenizer.tokenize(this.text);
}
function Zg() {
  const n = this.tokenizer.getContextRanges("arabicSentence");
  for (let t = 0; t < n.length; t++) {
    const e = n[t];
    let s = this.tokenizer.getRangeTokens(e);
    this.tokenizer.replaceRange(
      e.startIndex,
      e.endOffset,
      s.reverse()
    );
  }
}
Qt.prototype.registerFeatures = function(n, t) {
  const e = t.filter(
    (s) => this.query.supports({ script: n, tag: s })
  );
  Object.prototype.hasOwnProperty.call(this.featuresTags, n) ? this.featuresTags[n] = this.featuresTags[n].concat(e) : this.featuresTags[n] = e;
};
Qt.prototype.applyFeatures = function(n, t) {
  if (!n) throw new Error(
    "No valid font was provided to apply features"
  );
  this.query || (this.query = new cg(n));
  for (let e = 0; e < t.length; e++) {
    const s = t[e];
    this.query.supports({ script: s.script }) && this.registerFeatures(s.script, s.tags);
  }
};
Qt.prototype.registerModifier = function(n, t, e) {
  this.tokenizer.registerModifier(n, t, e);
};
function ks() {
  if (this.tokenizer.registeredModifiers.indexOf("glyphIndex") === -1)
    throw new Error(
      "glyphIndex modifier is required to apply arabic presentation features."
    );
}
function Jg() {
  if (!Object.prototype.hasOwnProperty.call(this.featuresTags, "arab")) return;
  ks.call(this);
  const t = this.tokenizer.getContextRanges("arabicWord");
  for (let e = 0; e < t.length; e++) {
    const s = t[e];
    wg.call(this, s);
  }
}
function Kg() {
  ks.call(this);
  const n = this.tokenizer.getContextRanges("ccmpReplacement");
  for (let t = 0; t < n.length; t++) {
    const e = n[t];
    Mg.call(this, e);
  }
}
function Qg() {
  if (!this.hasFeatureEnabled("arab", "rlig")) return;
  ks.call(this);
  const n = this.tokenizer.getContextRanges("arabicWord");
  for (let t = 0; t < n.length; t++) {
    const e = n[t];
    Tg.call(this, e);
  }
}
function tm() {
  if (!this.hasFeatureEnabled("latn", "liga")) return;
  ks.call(this);
  const n = this.tokenizer.getContextRanges("latinWord");
  for (let t = 0; t < n.length; t++) {
    const e = n[t];
    Bg.call(this, e);
  }
}
function em() {
  const n = this.tokenizer.getContextRanges("unicodeVariationSequence");
  for (let t = 0; t < n.length; t++) {
    const e = n[t];
    Yg.call(this, e);
  }
}
function nm() {
  ks.call(this);
  const n = this.tokenizer.getContextRanges("thaiWord");
  for (let t = 0; t < n.length; t++) {
    const e = n[t];
    this.hasFeatureEnabled("thai", "liga") && Hg.call(this, e), this.hasFeatureEnabled("thai", "rlig") && Vg.call(this, e), this.hasFeatureEnabled("thai", "ccmp") && Ng.call(this, e);
  }
}
Qt.prototype.checkContextReady = function(n) {
  return !!this.tokenizer.getContext(n);
};
Qt.prototype.applyFeaturesToContexts = function() {
  this.checkContextReady("ccmpReplacement") && Kg.call(this), this.checkContextReady("arabicWord") && (Jg.call(this), Qg.call(this)), this.checkContextReady("latinWord") && tm.call(this), this.checkContextReady("arabicSentence") && Zg.call(this), this.checkContextReady("thaiWord") && nm.call(this), this.checkContextReady("unicodeVariationSequence") && em.call(this);
};
Qt.prototype.hasFeatureEnabled = function(n, t) {
  return (this.featuresTags[n] || []).indexOf(t) !== -1;
};
Qt.prototype.processText = function(n) {
  (!this.text || this.text !== n) && (this.setText(n), $g.call(this), this.applyFeaturesToContexts());
};
Qt.prototype.getBidiText = function(n) {
  return this.processText(n), this.tokenizer.getText();
};
Qt.prototype.getTextGlyphs = function(n) {
  this.processText(n);
  let t = [];
  for (let e = 0; e < this.tokenizer.tokens.length; e++) {
    const s = this.tokenizer.tokens[e];
    if (s.state.deleted) continue;
    const i = s.activeState.value;
    t.push(Array.isArray(i) ? i[0] : i);
  }
  return t;
};
var sm = Qt;
function Er(n) {
  return {
    fontFamily: { en: n.familyName || " " },
    fontSubfamily: { en: n.styleName || " " },
    fullName: { en: n.fullName || n.familyName + " " + n.styleName },
    // postScriptName may not contain any whitespace
    postScriptName: { en: n.postScriptName || (n.familyName + n.styleName).replace(/\s/g, "") },
    designer: { en: n.designer || " " },
    designerURL: { en: n.designerURL || " " },
    manufacturer: { en: n.manufacturer || " " },
    manufacturerURL: { en: n.manufacturerURL || " " },
    license: { en: n.license || " " },
    licenseURL: { en: n.licenseURL || " " },
    version: { en: n.version || "Version 0.1" },
    description: { en: n.description || " " },
    copyright: { en: n.copyright || " " },
    trademark: { en: n.trademark || " " }
  };
}
function it(n) {
  if (n = n || {}, n.tables = n.tables || {}, !n.empty) {
    if (!n.familyName) throw new Error("When creating a new Font object, familyName is required.");
    if (!n.styleName) throw new Error("When creating a new Font object, styleName is required.");
    if (!n.unitsPerEm) throw new Error("When creating a new Font object, unitsPerEm is required.");
    if (!n.ascender) throw new Error("When creating a new Font object, ascender is required.");
    if (n.descender > 0) throw new Error("When creating a new Font object, negative descender value is required.");
    this.names = {}, this.names.unicode = Er(n), this.names.macintosh = Er(n), this.names.windows = Er(n), this.unitsPerEm = n.unitsPerEm || 1e3, this.ascender = n.ascender, this.descender = n.descender, this.createdTimestamp = n.createdTimestamp, this.italicAngle = n.italicAngle || 0, this.weightClass = n.weightClass || 0;
    let t = 0;
    n.fsSelection ? t = n.fsSelection : (this.italicAngle < 0 ? t |= this.fsSelectionValues.ITALIC : this.italicAngle > 0 && (t |= this.fsSelectionValues.OBLIQUE), this.weightClass >= 600 && (t |= this.fsSelectionValues.BOLD), t === 0 && (t = this.fsSelectionValues.REGULAR)), (!n.panose || !Array.isArray(n.panose)) && (n.panose = [0, 0, 0, 0, 0, 0, 0, 0, 0]), this.tables = Object.assign(n.tables, {
      os2: Object.assign({
        usWeightClass: n.weightClass || this.usWeightClasses.MEDIUM,
        usWidthClass: n.widthClass || this.usWidthClasses.MEDIUM,
        bFamilyType: n.panose[0] || 0,
        bSerifStyle: n.panose[1] || 0,
        bWeight: n.panose[2] || 0,
        bProportion: n.panose[3] || 0,
        bContrast: n.panose[4] || 0,
        bStrokeVariation: n.panose[5] || 0,
        bArmStyle: n.panose[6] || 0,
        bLetterform: n.panose[7] || 0,
        bMidline: n.panose[8] || 0,
        bXHeight: n.panose[9] || 0,
        fsSelection: t
      }, n.tables.os2)
    });
  }
  this.supported = !0, this.glyphs = new be.GlyphSet(this, n.glyphs || []), this.encoding = new Xh(this), this.position = new Kd(this), this.substitution = new r0(this), this.tables = this.tables || {}, this.tables = new Proxy(this.tables, {
    set: (t, e, s) => (t[e] = s, t.fvar && (t.gvar || t.cff2) && !this.variation && (this.variation = new v0(this)), !0)
  }), this.palettes = new Tl(this), this.layers = new a0(this), this.svgImages = new o0(this), this._push = null, this._hmtxTableData = {}, Object.defineProperty(this, "hinting", {
    get: function() {
      return this._hinting ? this._hinting : this.outlinesFormat === "truetype" ? this._hinting = new Z1(this) : null;
    }
  });
}
it.prototype.hasChar = function(n) {
  return this.encoding.charToGlyphIndex(n) > 0;
};
it.prototype.charToGlyphIndex = function(n) {
  return this.encoding.charToGlyphIndex(n);
};
it.prototype.charToGlyph = function(n) {
  const t = this.charToGlyphIndex(n);
  let e = this.glyphs.get(t);
  return e || (e = this.glyphs.get(0)), e;
};
it.prototype.updateFeatures = function(n) {
  return this.defaultRenderOptions.features.map((t) => t.script === "latn" ? {
    script: "latn",
    tags: t.tags.filter((e) => n[e])
  } : t);
};
it.prototype.stringToGlyphIndexes = function(n, t) {
  const e = new sm(), s = (r) => this.charToGlyphIndex(r.char);
  e.registerModifier("glyphIndex", null, s);
  let i = t ? this.updateFeatures(t.features) : this.defaultRenderOptions.features;
  return e.applyFeatures(this, i), e.getTextGlyphs(n);
};
it.prototype.stringToGlyphs = function(n, t) {
  const e = this.stringToGlyphIndexes(n, t);
  let s = e.length;
  const i = new Array(s), r = this.glyphs.get(0);
  for (let a = 0; a < s; a += 1)
    i[a] = this.glyphs.get(e[a]) || r;
  return i;
};
it.prototype.nameToGlyphIndex = function(n) {
  return this.glyphNames.nameToGlyphIndex(n);
};
it.prototype.nameToGlyph = function(n) {
  const t = this.nameToGlyphIndex(n);
  let e = this.glyphs.get(t);
  return e || (e = this.glyphs.get(0)), e;
};
it.prototype.glyphIndexToName = function(n) {
  return this.glyphNames.glyphIndexToName ? this.glyphNames.glyphIndexToName(n) : "";
};
it.prototype.getKerningValue = function(n, t) {
  n = n.index || n, t = t.index || t;
  const e = this.position.defaultKerningTables;
  return e ? this.position.getKerningValue(e, n, t) : this.kerningPairs[n + "," + t] || 0;
};
it.prototype.defaultRenderOptions = {
  kerning: !0,
  features: [
    /**
     * these 4 features are required to render Arabic text properly
     * and shouldn't be turned off when rendering arabic text.
     */
    { script: "arab", tags: ["init", "medi", "fina", "rlig"] },
    { script: "latn", tags: ["liga", "rlig"] },
    { script: "thai", tags: ["liga", "rlig", "ccmp"] }
  ],
  hinting: !1,
  usePalette: 0,
  drawLayers: !0,
  drawSVG: !0
};
it.prototype.forEachGlyph = function(n, t, e, s, i, r) {
  t = t !== void 0 ? t : 0, e = e !== void 0 ? e : 0, s = s !== void 0 ? s : 72, i = Object.assign({}, this.defaultRenderOptions, i);
  const a = 1 / this.unitsPerEm * s, o = this.stringToGlyphs(n, i);
  let c;
  if (i.kerning) {
    const h = i.script || this.position.getDefaultScriptName();
    c = this.position.getKerningTables(h, i.language);
  }
  for (let h = 0; h < o.length; h += 1) {
    const l = o[h];
    if (r.call(this, l, t, e, s, i), l.advanceWidth && (t += l.advanceWidth * a), i.kerning && h < o.length - 1) {
      const u = c ? this.position.getKerningValue(c, l.index, o[h + 1].index) : this.getKerningValue(l, o[h + 1]);
      t += u * a;
    }
    i.letterSpacing ? t += i.letterSpacing * s : i.tracking && (t += i.tracking / 1e3 * s);
  }
  return t;
};
it.prototype.getPath = function(n, t, e, s, i) {
  i = Object.assign({}, this.defaultRenderOptions, i);
  const r = new Hn();
  if (r._layers = [], nl(this, r), r.stroke) {
    const a = 1 / (r.unitsPerEm || 1e3) * s;
    r.strokeWidth *= a;
  }
  return this.forEachGlyph(n, t, e, s, i, (a, o, c, h) => {
    const l = a.getPath(o, c, h, i, this);
    if (i.drawSVG || i.drawLayers) {
      const u = l._layers;
      if (u && u.length) {
        for (let f = 0; f < u.length; f++) {
          const p = u[f];
          r._layers.push(p);
        }
        return;
      }
    }
    r.extend(l);
  }), r;
};
it.prototype.getPaths = function(n, t, e, s, i) {
  i = Object.assign({}, this.defaultRenderOptions, i);
  const r = [];
  return this.forEachGlyph(n, t, e, s, i, function(a, o, c, h) {
    const l = a.getPath(o, c, h, i, this);
    r.push(l);
  }), r;
};
it.prototype.getAdvanceWidth = function(n, t, e) {
  return e = Object.assign({}, this.defaultRenderOptions, e), this.forEachGlyph(n, 0, 0, t, e, function() {
  });
};
it.prototype.draw = function(n, t, e, s, i, r) {
  this.getPath(t, e, s, i, r).draw(n);
};
it.prototype.drawPoints = function(n, t, e, s, i, r) {
  r = Object.assign({}, this.defaultRenderOptions, r), this.forEachGlyph(t, e, s, i, r, function(a, o, c, h) {
    a.drawPoints(n, o, c, h, r, this);
  });
};
it.prototype.drawMetrics = function(n, t, e, s, i, r) {
  r = Object.assign({}, this.defaultRenderOptions, r), this.forEachGlyph(t, e, s, i, r, function(a, o, c, h) {
    a.drawMetrics(n, o, c, h);
  });
};
it.prototype.getEnglishName = function(n) {
  const t = (this.names.unicode || this.names.macintosh || this.names.windows)[n];
  if (t)
    return t.en;
};
it.prototype.validate = function() {
  const n = [], t = this;
  function e(i, r) {
    i || (console.warn(`[opentype.js] ${r}`), n.push(r));
  }
  function s(i) {
    const r = t.getEnglishName(i);
    e(
      r && r.trim().length > 0,
      "No English " + i + " specified."
    );
  }
  if (s("fontFamily"), s("weightName"), s("manufacturer"), s("copyright"), s("version"), e(this.unitsPerEm > 0, "No unitsPerEm specified."), this.tables.colr) {
    const i = this.tables.colr.baseGlyphRecords;
    let r = -1;
    for (let a = 0; a < i.length; a++) {
      const o = i[a].glyphID;
      if (e(r < i[a].glyphID, `baseGlyphs must be sorted by GlyphID in ascending order, but glyphID ${o} comes after ${r}`), r > i[a].glyphID)
        break;
      r = o;
    }
  }
  return n;
};
it.prototype.toTables = function() {
  return Jd.fontToTable(this);
};
it.prototype.toBuffer = function() {
  return console.warn("Font.toBuffer is deprecated. Use Font.toArrayBuffer instead."), this.toArrayBuffer();
};
it.prototype.toArrayBuffer = function() {
  const t = this.toTables().encode(), e = new ArrayBuffer(t.length), s = new Uint8Array(e);
  for (let i = 0; i < t.length; i++)
    s[i] = t[i];
  return e;
};
it.prototype.download = function() {
  console.error("DEPRECATED: platform-specific actions are to be implemented on user-side");
};
it.prototype.fsSelectionValues = {
  ITALIC: 1,
  //1
  UNDERSCORE: 2,
  //2
  NEGATIVE: 4,
  //4
  OUTLINED: 8,
  //8
  STRIKEOUT: 16,
  //16
  BOLD: 32,
  //32
  REGULAR: 64,
  //64
  USER_TYPO_METRICS: 128,
  //128
  WWS: 256,
  //256
  OBLIQUE: 512
  //512
};
it.prototype.macStyleValues = {
  BOLD: 1,
  //1
  ITALIC: 2,
  //2
  UNDERLINE: 4,
  //4
  OUTLINED: 8,
  //8
  SHADOW: 16,
  //16
  CONDENSED: 32,
  //32
  EXTENDED: 64
  //64
};
it.prototype.usWidthClasses = {
  ULTRA_CONDENSED: 1,
  EXTRA_CONDENSED: 2,
  CONDENSED: 3,
  SEMI_CONDENSED: 4,
  MEDIUM: 5,
  SEMI_EXPANDED: 6,
  EXPANDED: 7,
  EXTRA_EXPANDED: 8,
  ULTRA_EXPANDED: 9
};
it.prototype.usWeightClasses = {
  THIN: 100,
  EXTRA_LIGHT: 200,
  LIGHT: 300,
  NORMAL: 400,
  MEDIUM: 500,
  SEMI_BOLD: 600,
  BOLD: 700,
  EXTRA_BOLD: 800,
  BLACK: 900
};
var im = it;
function rm(n, t) {
  const e = new z.Parser(n, t), s = e.parseUShort(), i = e.parseUShort();
  s !== 1 && console.warn(`Unsupported hvar table version ${s}.${i}`);
  const r = [
    s,
    i
  ], a = e.parsePointer32(function() {
    return this.parseItemVariationStore();
  }), o = e.parsePointer32(function() {
    return this.parseDeltaSetIndexMap();
  }), c = e.parsePointer32(function() {
    return this.parseDeltaSetIndexMap();
  }), h = e.parsePointer32(function() {
    return this.parseDeltaSetIndexMap();
  });
  return {
    version: r,
    itemVariationStore: a,
    advanceWidth: o,
    lsb: c,
    rsb: h
  };
}
function am() {
  console.warn("Writing of hvar tables is not yet supported.");
}
var om = { make: am, parse: rm }, cm = function() {
  return {
    coverage: this.parsePointer(A.coverage),
    attachPoints: this.parseList(A.pointer(A.uShortList))
  };
}, hm = function() {
  var n = this.parseUShort();
  if (V.argument(
    n === 1 || n === 2 || n === 3,
    "Unsupported CaretValue table version."
  ), n === 1)
    return { coordinate: this.parseShort() };
  if (n === 2)
    return { pointindex: this.parseShort() };
  if (n === 3)
    return { coordinate: this.parseShort() };
}, lm = function() {
  return this.parseList(A.pointer(hm));
}, um = function() {
  return {
    coverage: this.parsePointer(A.coverage),
    ligGlyphs: this.parseList(A.pointer(lm))
  };
}, fm = function() {
  return this.parseUShort(), this.parseList(A.pointer(A.coverage));
};
function pm(n, t) {
  t = t || 0;
  const e = new A(n, t), s = e.parseVersion(1);
  V.argument(
    s === 1 || s === 1.2 || s === 1.3,
    "Unsupported GDEF table version."
  );
  var i = {
    version: s,
    classDef: e.parsePointer(A.classDef),
    attachList: e.parsePointer(cm),
    ligCaretList: e.parsePointer(um),
    markAttachClassDef: e.parsePointer(A.classDef)
  };
  return s >= 1.2 && (i.markGlyphSets = e.parsePointer(fm)), i;
}
var dm = { parse: pm }, ue = new Array(10);
ue[1] = function() {
  const t = this.offset + this.relativeOffset, e = this.parseUShort();
  if (e === 1)
    return {
      posFormat: 1,
      coverage: this.parsePointer(A.coverage),
      value: this.parseValueRecord()
    };
  if (e === 2)
    return {
      posFormat: 2,
      coverage: this.parsePointer(A.coverage),
      values: this.parseValueRecordList()
    };
  V.assert(!1, "0x" + t.toString(16) + ": GPOS lookup type 1 format must be 1 or 2.");
};
ue[2] = function() {
  const t = this.offset + this.relativeOffset, e = this.parseUShort();
  V.assert(e === 1 || e === 2, "0x" + t.toString(16) + ": GPOS lookup type 2 format must be 1 or 2.");
  const s = this.parsePointer(A.coverage), i = this.parseUShort(), r = this.parseUShort();
  if (e === 1)
    return {
      posFormat: e,
      coverage: s,
      valueFormat1: i,
      valueFormat2: r,
      pairSets: this.parseList(A.pointer(A.list(function() {
        return {
          // pairValueRecord
          secondGlyph: this.parseUShort(),
          value1: this.parseValueRecord(i),
          value2: this.parseValueRecord(r)
        };
      })))
    };
  if (e === 2) {
    const a = this.parsePointer(A.classDef), o = this.parsePointer(A.classDef), c = this.parseUShort(), h = this.parseUShort();
    return {
      // Class Pair Adjustment
      posFormat: e,
      coverage: s,
      valueFormat1: i,
      valueFormat2: r,
      classDef1: a,
      classDef2: o,
      class1Count: c,
      class2Count: h,
      classRecords: this.parseList(c, A.list(h, function() {
        return {
          value1: this.parseValueRecord(i),
          value2: this.parseValueRecord(r)
        };
      }))
    };
  }
};
ue[3] = function() {
  return { error: "GPOS Lookup 3 not supported" };
};
ue[4] = function() {
  return { error: "GPOS Lookup 4 not supported" };
};
ue[5] = function() {
  return { error: "GPOS Lookup 5 not supported" };
};
ue[6] = function() {
  return { error: "GPOS Lookup 6 not supported" };
};
ue[7] = function() {
  return { error: "GPOS Lookup 7 not supported" };
};
ue[8] = function() {
  return { error: "GPOS Lookup 8 not supported" };
};
ue[9] = function() {
  return { error: "GPOS Lookup 9 not supported" };
};
function gm(n, t) {
  t = t || 0;
  const e = new A(n, t), s = e.parseVersion(1);
  return V.argument(s === 1 || s === 1.1, "Unsupported GPOS table version " + s), s === 1 ? {
    version: s,
    scripts: e.parseScriptList(),
    features: e.parseFeatureList(),
    lookups: e.parseLookupList(ue)
  } : {
    version: s,
    scripts: e.parseScriptList(),
    features: e.parseFeatureList(),
    lookups: e.parseLookupList(ue),
    variations: e.parseFeatureVariationsList()
  };
}
var mm = new Array(10);
function ym(n) {
  return new L.Table("GPOS", [
    { name: "version", type: "ULONG", value: 65536 },
    { name: "scripts", type: "TABLE", value: new L.ScriptList(n.scripts) },
    { name: "features", type: "TABLE", value: new L.FeatureList(n.features) },
    { name: "lookups", type: "TABLE", value: new L.LookupList(n.lookups, mm) }
  ]);
}
var xm = { parse: gm, make: ym };
function bm(n) {
  const t = {};
  n.skip("uShort");
  const e = n.parseUShort();
  V.argument(e === 0, "Unsupported kern sub-table version."), n.skip("uShort", 2);
  const s = n.parseUShort();
  n.skip("uShort", 3);
  for (let i = 0; i < s; i += 1) {
    const r = n.parseUShort(), a = n.parseUShort(), o = n.parseShort();
    t[r + "," + a] = o;
  }
  return t;
}
function vm(n) {
  const t = {};
  n.skip("uShort"), n.parseULong() > 1 && console.warn("Only the first kern subtable is supported."), n.skip("uLong");
  const i = n.parseUShort() & 255;
  if (n.skip("uShort"), i === 0) {
    const r = n.parseUShort();
    n.skip("uShort", 3);
    for (let a = 0; a < r; a += 1) {
      const o = n.parseUShort(), c = n.parseUShort(), h = n.parseShort();
      t[o + "," + c] = h;
    }
  }
  return t;
}
function Sm(n, t) {
  const e = new z.Parser(n, t), s = e.parseUShort();
  if (s === 0)
    return bm(e);
  if (s === 1)
    return vm(e);
  throw new Error("Unsupported kern table version (" + s + ").");
}
var wm = { parse: Sm };
function Cm(n, t, e, s) {
  const i = new z.Parser(n, t), r = s ? i.parseUShort : i.parseULong, a = [];
  for (let o = 0; o < e + 1; o += 1) {
    let c = r.call(i);
    s && (c *= 2), a.push(c);
  }
  return a;
}
var Tm = { parse: Cm };
function Sc(n, t) {
  const e = [];
  let s = 12;
  for (let i = 0; i < t; i += 1) {
    const r = z.getTag(n, s), a = z.getULong(n, s + 4), o = z.getULong(n, s + 8), c = z.getULong(n, s + 12);
    e.push({ tag: r, checksum: a, offset: o, length: c, compression: !1 }), s += 16;
  }
  return e;
}
function Fm(n, t) {
  const e = [];
  let s = 44;
  for (let i = 0; i < t; i += 1) {
    const r = z.getTag(n, s), a = z.getULong(n, s + 4), o = z.getULong(n, s + 8), c = z.getULong(n, s + 12);
    let h;
    o < c ? h = "WOFF" : h = !1, e.push({
      tag: r,
      offset: a,
      compression: h,
      compressedLength: o,
      length: c
    }), s += 20;
  }
  return e;
}
function tt(n, t) {
  if (t.compression === "WOFF") {
    const e = new Uint8Array(n.buffer, t.offset + 2, t.compressedLength - 2), s = new Uint8Array(t.length);
    if (Rh(e, s), s.byteLength !== t.length)
      throw new Error("Decompression error: " + t.tag + " decompressed length doesn't match recorded length");
    return { data: new DataView(s.buffer, 0), offset: 0 };
  } else
    return { data: n, offset: t.offset };
}
function Am(n, t = {}) {
  let e, s;
  const i = new im({ empty: !0 });
  n.constructor !== ArrayBuffer && (n = new Uint8Array(n).buffer);
  const r = new DataView(n, 0);
  let a, o = [];
  const c = z.getTag(r, 0);
  if (c === "\0\0\0" || c === "true" || c === "typ1")
    i.outlinesFormat = "truetype", a = z.getUShort(r, 4), o = Sc(r, a);
  else if (c === "OTTO")
    i.outlinesFormat = "cff", a = z.getUShort(r, 4), o = Sc(r, a);
  else if (c === "wOFF") {
    const D = z.getTag(r, 4);
    if (D === "\0\0\0")
      i.outlinesFormat = "truetype";
    else if (D === "OTTO")
      i.outlinesFormat = "cff";
    else
      throw new Error("Unsupported OpenType flavor " + c);
    a = z.getUShort(r, 12), o = Fm(r, a);
  } else if (c === "wOF2") {
    const D = "https://github.com/opentypejs/opentype.js/issues/183#issuecomment-1147228025";
    throw new Error("WOFF2 require an external decompressor library, see examples at: " + D);
  } else
    throw new Error("Unsupported OpenType signature " + c);
  let h, l, u, f, p, d, g, x, b, v, S, w, F, O, M, I, H, R;
  for (let D = 0; D < a; D += 1) {
    const U = o[D];
    let P;
    switch (U.tag) {
      case "avar":
        g = U;
        break;
      case "cmap":
        P = tt(r, U), i.tables.cmap = jh.parse(P.data, P.offset), i.encoding = new Yh(i.tables.cmap);
        break;
      case "cvt ":
        P = tt(r, U), R = new z.Parser(P.data, P.offset), i.tables.cvt = R.parseShortList(U.length / 2);
        break;
      case "fvar":
        u = U;
        break;
      case "STAT":
        f = U;
        break;
      case "gvar":
        p = U;
        break;
      case "cvar":
        d = U;
        break;
      case "fpgm":
        P = tt(r, U), R = new z.Parser(P.data, P.offset), i.tables.fpgm = R.parseByteList(U.length);
        break;
      case "head":
        P = tt(r, U), i.tables.head = rl.parse(P.data, P.offset), i.unitsPerEm = i.tables.head.unitsPerEm, e = i.tables.head.indexToLocFormat;
        break;
      case "hhea":
        P = tt(r, U), i.tables.hhea = al.parse(P.data, P.offset), i.ascender = i.tables.hhea.ascender, i.descender = i.tables.hhea.descender, i.numberOfHMetrics = i.tables.hhea.numberOfHMetrics;
        break;
      case "HVAR":
        F = U;
        break;
      case "hmtx":
        w = U;
        break;
      case "ltag":
        P = tt(r, U), s = cl.parse(P.data, P.offset);
        break;
      case "COLR":
        P = tt(r, U), i.tables.colr = pl.parse(P.data, P.offset);
        break;
      case "CPAL":
        P = tt(r, U), i.tables.cpal = Kh.parse(P.data, P.offset);
        break;
      case "maxp":
        P = tt(r, U), i.tables.maxp = hl.parse(P.data, P.offset), i.numGlyphs = i.tables.maxp.numGlyphs;
        break;
      case "name":
        I = U;
        break;
      case "OS/2":
        P = tt(r, U), i.tables.os2 = oa.parse(P.data, P.offset);
        break;
      case "post":
        P = tt(r, U), i.tables.post = ll.parse(P.data, P.offset), i.glyphNames = new xa(i.tables.post);
        break;
      case "prep":
        P = tt(r, U), R = new z.Parser(P.data, P.offset), i.tables.prep = R.parseByteList(U.length);
        break;
      case "glyf":
        x = U;
        break;
      case "loca":
        M = U;
        break;
      case "CFF ":
        h = U;
        break;
      case "CFF2":
        l = U;
        break;
      case "kern":
        O = U;
        break;
      case "GDEF":
        b = U;
        break;
      case "GPOS":
        v = U;
        break;
      case "GSUB":
        S = U;
        break;
      case "meta":
        H = U;
        break;
      case "gasp":
        try {
          P = tt(r, U), i.tables.gasp = bl.parse(P.data, P.offset);
        } catch (K) {
          console.warn("Failed to parse gasp table, skipping."), console.warn(K);
        }
        break;
      case "SVG ":
        P = tt(r, U), i.tables.svg = vl.parse(P.data, P.offset);
        break;
    }
  }
  const W = tt(r, I);
  if (i.tables.name = qh.parse(W.data, W.offset, s), i.names = i.tables.name, x && M) {
    const D = e === 0, U = tt(r, M), P = Tm.parse(U.data, U.offset, i.numGlyphs, D), K = tt(r, x);
    i.glyphs = kl.parse(K.data, K.offset, P, i, t);
  } else if (h) {
    const D = tt(r, h);
    ra.parse(D.data, D.offset, i, t);
  } else if (l) {
    const D = tt(r, l);
    ra.parse(D.data, D.offset, i, t);
  } else
    throw new Error("Font doesn't contain TrueType, CFF or CFF2 outlines.");
  const J = tt(r, w);
  if (ol.parse(i, J.data, J.offset, i.numberOfHMetrics, i.numGlyphs, i.glyphs, t), Sp(i, t), O) {
    const D = tt(r, O);
    i.kerningPairs = wm.parse(D.data, D.offset);
  } else
    i.kerningPairs = {};
  if (b) {
    const D = tt(r, b);
    i.tables.gdef = dm.parse(D.data, D.offset);
  }
  if (v) {
    const D = tt(r, v);
    i.tables.gpos = xm.parse(D.data, D.offset), i.position.init();
  }
  if (S) {
    const D = tt(r, S);
    i.tables.gsub = ul.parse(D.data, D.offset);
  }
  if (u) {
    const D = tt(r, u);
    i.tables.fvar = dl.parse(D.data, D.offset, i.names);
  }
  if (f) {
    const D = tt(r, f);
    i.tables.stat = gl.parse(D.data, D.offset, i.tables.fvar);
  }
  if (p) {
    u || console.warn("This font provides a gvar table, but no fvar table, which is required for variable fonts."), x || console.warn("This font provides a gvar table, but no glyf table. Glyph variation only works with TrueType outlines.");
    const D = tt(r, p);
    i.tables.gvar = xl.parse(D.data, D.offset, i.tables.fvar, i.glyphs);
  }
  if (d) {
    u || console.warn("This font provides a cvar table, but no fvar table, which is required for variable fonts."), i.tables.cvt || console.warn("This font provides a cvar table, but no cvt table which could be made variable."), x || console.warn("This font provides a gvar table, but no glyf table. Glyph variation only works with TrueType outlines.");
    const D = tt(r, d);
    i.tables.cvar = yl.parse(D.data, D.offset, i.tables.fvar, i.tables.cvt || []);
  }
  if (g) {
    u || console.warn("This font provides an avar table, but no fvar table, which is required for variable fonts.");
    const D = tt(r, g);
    i.tables.avar = ml.parse(D.data, D.offset, i.tables.fvar);
  }
  if (F) {
    u || console.warn("This font provides an HVAR table, but no fvar table, which is required for variable fonts."), w || console.warn("This font provides an HVAR table, but no hmtx table to vary.");
    const D = tt(r, F);
    i.tables.hvar = om.parse(D.data, D.offset, i.tables.fvar);
  }
  if (H) {
    const D = tt(r, H);
    i.tables.meta = fl.parse(D.data, D.offset), i.metas = i.tables.meta;
  }
  return i.palettes = new Tl(i), i;
}
function km(n, t = !1) {
  const e = n[0].index !== null, s = new Set(Object.keys(n[0].attributes)), i = new Set(Object.keys(n[0].morphAttributes)), r = {}, a = {}, o = n[0].morphTargetsRelative, c = new Rt();
  let h = 0;
  for (let l = 0; l < n.length; ++l) {
    const u = n[l];
    let f = 0;
    if (e !== (u.index !== null))
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + l + ". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."), null;
    for (const p in u.attributes) {
      if (!s.has(p))
        return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + l + '. All geometries must have compatible attributes; make sure "' + p + '" attribute exists among all geometries, or in none of them.'), null;
      r[p] === void 0 && (r[p] = []), r[p].push(u.attributes[p]), f++;
    }
    if (f !== s.size)
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + l + ". Make sure all geometries have the same number of attributes."), null;
    if (o !== u.morphTargetsRelative)
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + l + ". .morphTargetsRelative must be consistent throughout all geometries."), null;
    for (const p in u.morphAttributes) {
      if (!i.has(p))
        return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + l + ".  .morphAttributes must be consistent throughout all geometries."), null;
      a[p] === void 0 && (a[p] = []), a[p].push(u.morphAttributes[p]);
    }
    if (t) {
      let p;
      if (e)
        p = u.index.count;
      else if (u.attributes.position !== void 0)
        p = u.attributes.position.count;
      else
        return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + l + ". The geometry must have either an index or a position attribute"), null;
      c.addGroup(h, p, l), h += p;
    }
  }
  if (e) {
    let l = 0;
    const u = [];
    for (let f = 0; f < n.length; ++f) {
      const p = n[f].index;
      for (let d = 0; d < p.count; ++d)
        u.push(p.getX(d) + l);
      l += n[f].attributes.position.count;
    }
    c.setIndex(u);
  }
  for (const l in r) {
    const u = wc(r[l]);
    if (!u)
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + l + " attribute."), null;
    c.setAttribute(l, u);
  }
  for (const l in a) {
    const u = a[l][0].length;
    if (u === 0) break;
    c.morphAttributes = c.morphAttributes || {}, c.morphAttributes[l] = [];
    for (let f = 0; f < u; ++f) {
      const p = [];
      for (let g = 0; g < a[l].length; ++g)
        p.push(a[l][g][f]);
      const d = wc(p);
      if (!d)
        return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + l + " morphAttribute."), null;
      c.morphAttributes[l].push(d);
    }
  }
  return c;
}
function wc(n) {
  let t, e, s, i = -1, r = 0;
  for (let h = 0; h < n.length; ++h) {
    const l = n[h];
    if (t === void 0 && (t = l.array.constructor), t !== l.array.constructor)
      return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."), null;
    if (e === void 0 && (e = l.itemSize), e !== l.itemSize)
      return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."), null;
    if (s === void 0 && (s = l.normalized), s !== l.normalized)
      return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."), null;
    if (i === -1 && (i = l.gpuType), i !== l.gpuType)
      return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."), null;
    r += l.count * e;
  }
  const a = new t(r), o = new he(a, e, s);
  let c = 0;
  for (let h = 0; h < n.length; ++h) {
    const l = n[h];
    if (l.isInterleavedBufferAttribute) {
      const u = c / e;
      for (let f = 0, p = l.count; f < p; f++)
        for (let d = 0; d < e; d++) {
          const g = l.getComponent(f, d);
          o.setComponent(f + u, d, g);
        }
    } else
      a.set(l.array, c);
    c += l.count * e;
  }
  return i !== void 0 && (o.gpuType = i), o;
}
function Em(n, t = 1e-4) {
  t = Math.max(t, Number.EPSILON);
  const e = {}, s = n.getIndex(), i = n.getAttribute("position"), r = s ? s.count : i.count;
  let a = 0;
  const o = Object.keys(n.attributes), c = {}, h = {}, l = [], u = ["getX", "getY", "getZ", "getW"], f = ["setX", "setY", "setZ", "setW"];
  for (let v = 0, S = o.length; v < S; v++) {
    const w = o[v], F = n.attributes[w];
    c[w] = new F.constructor(
      new F.array.constructor(F.count * F.itemSize),
      F.itemSize,
      F.normalized
    );
    const O = n.morphAttributes[w];
    O && (h[w] || (h[w] = []), O.forEach((M, I) => {
      const H = new M.array.constructor(M.count * M.itemSize);
      h[w][I] = new M.constructor(H, M.itemSize, M.normalized);
    }));
  }
  const p = t * 0.5, d = Math.log10(1 / t), g = Math.pow(10, d), x = p * g;
  for (let v = 0; v < r; v++) {
    const S = s ? s.getX(v) : v;
    let w = "";
    for (let F = 0, O = o.length; F < O; F++) {
      const M = o[F], I = n.getAttribute(M), H = I.itemSize;
      for (let R = 0; R < H; R++)
        w += `${~~(I[u[R]](S) * g + x)},`;
    }
    if (w in e)
      l.push(e[w]);
    else {
      for (let F = 0, O = o.length; F < O; F++) {
        const M = o[F], I = n.getAttribute(M), H = n.morphAttributes[M], R = I.itemSize, W = c[M], J = h[M];
        for (let D = 0; D < R; D++) {
          const U = u[D], P = f[D];
          if (W[P](a, I[U](S)), H)
            for (let K = 0, yt = H.length; K < yt; K++)
              J[K][P](a, H[K][U](S));
        }
      }
      e[w] = a, l.push(a), a++;
    }
  }
  const b = n.clone();
  for (const v in n.attributes) {
    const S = c[v];
    if (b.setAttribute(v, new S.constructor(
      S.array.slice(0, a * S.itemSize),
      S.itemSize,
      S.normalized
    )), v in h)
      for (let w = 0; w < h[v].length; w++) {
        const F = h[v][w];
        b.morphAttributes[v][w] = new F.constructor(
          F.array.slice(0, a * F.itemSize),
          F.itemSize,
          F.normalized
        );
      }
  }
  return b.setIndex(l), b;
}
new X();
function Cc(n) {
  const t = n.getAttribute("position");
  if (!t || t.count === 0)
    return !0;
  const e = t.array;
  for (let s = 0; s < e.length; s++)
    if (!Number.isFinite(e[s]))
      return !1;
  return !0;
}
class Tc extends Ch {
  constructor(t, e, s) {
    super(), this.isFound = !1, this.char = t, this.fontSize = e, this.font = s, this.width = this.getCharWidth(t, e, s);
  }
  /**
   * Converts the text shape to a THREE.js geometry.
   * This is used for 3D rendering of the text.
   * @returns A THREE.js BufferGeometry representing the text shape
   */
  toGeometry() {
    let t = this.font.cache.getGeometry(
      this.char.charCodeAt(0),
      this.fontSize
    );
    if (t == null) {
      const e = this.font.generateShapes(this.char, this.fontSize);
      if (t = new Dn(e, 4), !Cc(t))
        return t.dispose(), new Rt();
      t.hasAttribute("uv") && t.deleteAttribute("uv"), t.hasAttribute("normal") && t.deleteAttribute("normal"), t = Em(t, 1e-6), this.font.cache.setGeometry(this.char.charCodeAt(0), this.fontSize, t);
    }
    return Cc(t) ? t : new Rt();
  }
  /** @inheritdoc */
  hasStrokeGeometry() {
    return this.isFound && this.width > 0;
  }
  /**
   * Calculates the width of a character in the font.
   * @param char - The character to calculate width for
   * @param fontSize - The size of the font in pixels
   * @param font - The mesh font to use
   * @returns The width of the character in pixels
   */
  getCharWidth(t, e, s) {
    const i = s.data.glyphs[t];
    return i ? (this.isFound = !0, i.ha * e / s.data.resolution) : (this.isFound = !1, 0);
  }
}
class Mm {
  constructor(t) {
    this.isFont = !0, this.type = "Font", this.data = t;
  }
  generateShapes(t, e = 100) {
    const s = [], i = Om(t, e, this.data);
    for (let r = 0, a = i.length; r < a; r++)
      s.push(...i[r].toShapes());
    return s;
  }
}
function Om(n, t, e) {
  const s = Array.from(n), i = t / e.resolution, r = (e.boundingBox.yMax - e.boundingBox.yMin + e.underlineThickness) * i, a = [];
  let o = 0, c = 0;
  for (let h = 0; h < s.length; h++) {
    const l = s[h];
    if (l === `
`)
      o = 0, c -= r;
    else {
      const u = _m(l, i, o, c, e);
      o += u.offsetX, a.push(u.path);
    }
  }
  return a;
}
function _m(n, t, e, s, i) {
  const r = i.glyphs[n] || i.glyphs["?"];
  if (!r) {
    console.error('THREE.Font: character "' + n + '" does not exists in font family ' + i.familyName + ".");
    return;
  }
  const a = new bh();
  let o, c, h, l, u, f, p, d;
  if (r.o) {
    const g = r._cachedOutline || (r._cachedOutline = r.o.split(" "));
    for (let x = 0, b = g.length; x < b; )
      switch (g[x++]) {
        case "m":
          o = g[x++] * t + e, c = g[x++] * t + s, a.moveTo(o, c);
          break;
        case "l":
          o = g[x++] * t + e, c = g[x++] * t + s, a.lineTo(o, c);
          break;
        case "q":
          h = g[x++] * t + e, l = g[x++] * t + s, u = g[x++] * t + e, f = g[x++] * t + s, a.quadraticCurveTo(u, f, h, l);
          break;
        case "b":
          h = g[x++] * t + e, l = g[x++] * t + s, u = g[x++] * t + e, f = g[x++] * t + s, p = g[x++] * t + e, d = g[x++] * t + s, a.bezierCurveTo(u, f, p, d, h, l);
          break;
      }
  }
  return { offsetX: r.ha * t, path: a };
}
class Lm extends Mm {
  /**
   * Generates geometry shapes from the given text and size.
   *
   * Algorithm overview:
   * 1. Split the input text into individual characters.
   * 2. For each character:
   *    a. Retrieve the glyph data from the font.
   *    b. Convert the glyph outline commands into a ShapePath.
   *       - 'm' → moveTo
   *       - 'l' → lineTo
   *       - 'q' → quadraticCurveTo
   *       - 'b' → cubic bezierCurveTo
   *    c. Apply scaling to match the requested font size.
   *    d. Apply offsets for proper placement (supports multiple lines and directions).
   * 3. Handle text direction:
   *    - 'ltr': left-to-right
   *    - 'rtl': right-to-left (characters reversed)
   *    - 'tb': top-to-bottom (vertical layout)
   * 4. Collect all ShapePaths for the text.
   * 5. Convert each ShapePath into one or more Shape objects:
   *    a. Sample points along each subPath to approximate geometry.
   *    b. Determine which subPaths are outer contours and which are holes:
   *       - For each subPath, check if it is fully contained inside another polygon.
   *       - Assign the smallest containing polygon as its parent.
   *    c. Compute the relative depth of each subPath to handle nested holes.
   *    d. Reverse curves if necessary to maintain correct clockwise/counterclockwise winding:
   *       - Outer contours: CCW
   *       - Holes: CW
   *    e. Build Shape objects with holes properly assigned.
   * 6. Return the final array of Shape objects ready for geometry creation.
   *
   * This algorithm ensures that complex characters with multiple independent contours
   * (including intersecting subpaths or holes) are rendered correctly.
   *
   * @param text - input string to convert to shapes
   * @param size - font size in units (default 100)
   * @param direction - text direction ('ltr', 'rtl', 'tb')
   * @returns array of Shape objects with proper holes and contours
   */
  generateShapes(t, e = 100, s = "ltr") {
    const i = [];
    return Im(t, e, this.data, s).forEach((a) => {
      i.push(...zm(a));
    }), i;
  }
}
function Im(n, t, e, s = "ltr") {
  const i = Array.from(n), r = t / e.resolution, a = (e.boundingBox.yMax - e.boundingBox.yMin + e.underlineThickness) * r, o = [];
  let c = 0, h = 0;
  (s === "rtl" || s === "tb") && i.reverse();
  for (const l of i)
    if (l === `
`)
      c = 0, h -= a;
    else {
      const u = Bm(l, r, c, h, e);
      if (!u) continue;
      s === "tb" ? (c = 0, h += e.ascender * r) : c += u.offsetX, o.push(u.path);
    }
  return o;
}
function Bm(n, t, e, s, i) {
  const r = i.glyphs[n] || i.glyphs["?"];
  if (!r) {
    console.error(
      `THREE.Font: character "${n}" does not exist in font family ${i.familyName}.`
    );
    return;
  }
  const a = new bh();
  if (r.o) {
    const o = r.o.split(" ");
    let c = 0;
    for (; c < o.length; ) {
      const h = o[c++];
      let l, u, f, p, d, g, x, b;
      switch (h) {
        case "m":
          l = parseFloat(o[c++]) * t + e, u = parseFloat(o[c++]) * t + s, a.moveTo(l, u);
          break;
        case "l":
          l = parseFloat(o[c++]) * t + e, u = parseFloat(o[c++]) * t + s, a.lineTo(l, u);
          break;
        case "q":
          f = parseFloat(o[c++]) * t + e, p = parseFloat(o[c++]) * t + s, d = parseFloat(o[c++]) * t + e, g = parseFloat(o[c++]) * t + s, a.quadraticCurveTo(d, g, f, p);
          break;
        case "b":
          f = parseFloat(o[c++]) * t + e, p = parseFloat(o[c++]) * t + s, d = parseFloat(o[c++]) * t + e, g = parseFloat(o[c++]) * t + s, x = parseFloat(o[c++]) * t + e, b = parseFloat(o[c++]) * t + s, a.bezierCurveTo(d, g, x, b, f, p);
          break;
      }
    }
  }
  return { offsetX: r.ha * t, path: a };
}
function Rm(n, t) {
  let e = !1;
  const { x: s, y: i } = n, r = t.length;
  for (let a = 0, o = r - 1; a < r; o = a++) {
    const c = t[a].x, h = t[a].y, l = t[o].x, u = t[o].y;
    h > i != u > i && s < (l - c) * (i - h) / (u - h) + c && (e = !e);
  }
  return e;
}
function Dm(n) {
  const t = n.length, e = Array(t).fill(null);
  for (let s = 0; s < t; s++) {
    let i = null, r = 1 / 0;
    for (let a = 0; a < t; a++)
      if (s !== a && n[s].every((o) => Rm(o, n[a]))) {
        const o = Math.abs($e.area(n[a]));
        o < r && (r = o, i = a);
      }
    e[s] = i;
  }
  return e;
}
function Um(n) {
  const t = n.length, e = Array.from({ length: t }, () => []);
  for (let s = 0; s < t; s++) {
    const i = n[s];
    i !== null && e[i].push(s);
  }
  return e;
}
function Pm(n) {
  return n.map((t, e) => t === null ? e : -1).filter((t) => t >= 0);
}
function Nm(n) {
  const t = [];
  for (let e = n.length - 1; e >= 0; e--) {
    const s = n[e];
    if (s instanceof cs)
      t.push(new cs(s.v2.clone(), s.v1.clone()));
    else if (s instanceof yi)
      t.push(
        new yi(s.v2.clone(), s.v1.clone(), s.v0.clone())
      );
    else if (s instanceof mi)
      t.push(
        new mi(
          s.v3.clone(),
          s.v2.clone(),
          s.v1.clone(),
          s.v0.clone()
        )
      );
    else if (s instanceof us)
      t.push(
        new us(
          s.aX,
          s.aY,
          s.xRadius,
          s.yRadius,
          s.aEndAngle,
          s.aStartAngle,
          !s.aClockwise,
          s.aRotation
        )
      );
    else if (typeof s.getPoints == "function") {
      const i = s.getPoints(8);
      for (let r = i.length - 1; r > 0; r--)
        t.push(new cs(i[r].clone(), i[r - 1].clone()));
    }
  }
  return t;
}
function Fc(n, t) {
  const e = $e.area(n.getPoints(32)) > 0, s = t === e ? n.curves.slice() : Nm(n.curves), i = new Rn();
  return i.curves.push(...s), i;
}
function zm(n, t = 32) {
  const e = n.subPaths;
  if (!e || e.length === 0) return [];
  const s = e.map((p) => p.getPoints(t)), i = Dm(s), r = Um(i), a = Pm(i), o = e.length, c = Array(o).fill(-1), h = Array(o).fill(-1);
  for (const p of a) {
    const d = [{ idx: p, d: 0 }];
    for (; d.length; ) {
      const g = d.pop();
      c[g.idx] = g.d, h[g.idx] = p;
      for (const x of r[g.idx]) d.push({ idx: x, d: g.d + 1 });
    }
  }
  const l = [], u = /* @__PURE__ */ new Set();
  function f(p) {
    const d = Fc(e[p], !0);
    u.add(p);
    for (const g of r[p])
      if (!u.has(g) && c[g] === c[p] + 1) {
        const x = Fc(e[g], !1);
        d.holes.push(x), u.add(g);
      }
    l.push(d);
  }
  for (const p of a) f(p);
  for (let p = 0; p < o; p++)
    u.has(p) || f(p);
  return l;
}
const Hm = 61440;
class Gm extends wh {
  /**
   * Creates a new instance of MeshFont.
   * @param fontData - Either a MeshFontData object containing font information or an ArrayBuffer containing raw font data
   */
  constructor(t) {
    super(t), this.type = "mesh", this.glyphCache = new fa(512);
    const e = t.data;
    if (e instanceof ArrayBuffer) {
      const s = this.parseMeshFont(e);
      this.data = s.data, this.opentypeFont = s.font;
    } else
      throw new Error(
        "Invalid font cache data. Please remove font cache database named 'mlightcad' in IndexedDB and try again!"
      );
    this.font = new Lm(this.data);
  }
  /**
   * Parses a mesh font from raw binary data.
   * This function converts raw font data (e.g., TTF, OTF, WOFF) into a MeshFontData object
   * that can be used by the MeshFont class.
   *
   * @param data - The raw font data as an ArrayBuffer
   * @returns An object containing the opentype font and parsed metadata
   */
  parseMeshFont(t) {
    const e = Am(t), s = Math.round, i = e.charToGlyph("A"), r = i ? e.unitsPerEm / (i.yMax || e.unitsPerEm) : 1, a = {
      glyphs: {},
      // Lazy loaded later
      familyName: e.getEnglishName("fullName"),
      ascender: s(e.ascender),
      descender: s(e.descender),
      underlinePosition: e.tables.post.underlinePosition,
      underlineThickness: e.tables.post.underlineThickness,
      boundingBox: {
        xMin: e.tables.head.xMin,
        xMax: e.tables.head.xMax,
        yMin: e.tables.head.yMin,
        yMax: e.tables.head.yMax
      },
      resolution: e.unitsPerEm || 1e3,
      scaleFactor: r,
      original_font_information: e.tables.name
    };
    return { font: e, data: a };
  }
  /**
   * Resolves the opentype lookup character for a drawing character.
   * Tries Unicode first, then Symbol encoding (0xF000 + ASCII) for GDT fonts.
   */
  opentypeLookupChar(t) {
    if (!this.opentypeFont || t.length !== 1)
      return t;
    const e = t.charCodeAt(0), s = this.opentypeFont.charToGlyphIndex(t);
    if (s != null && s > 0)
      return t;
    if (e >= 32 && e <= 126) {
      const i = String.fromCharCode(Hm + e), r = this.opentypeFont.charToGlyphIndex(i);
      if (r != null && r > 0)
        return i;
    }
    return t;
  }
  /**
   * Whether opentype maps the character to a real glyph (not .notdef at index 0).
   *
   * opentype.js ≤1.3.4: {@link OpenTypeFont.hasChar} used `charToGlyphIndex(c) !== null`,
   * but CmapEncoding returns 0 for missing code points — see
   * https://github.com/opentypejs/opentype.js/issues/330 (fixed in 2.0.0).
   * We keep `index > 0` here so hasChar stays aligned with {@link _loadGlyphIfNeeded}.
   */
  opentypeHasGlyph(t) {
    if (!this.opentypeFont) return !1;
    const e = this.opentypeLookupChar(t), s = this.opentypeFont.charToGlyphIndex(e);
    return s != null && s > 0;
  }
  /**
   * Return true if this font contains glyph of the specified character. Otherwise, return false.
   * @param char - The character to check
   * @returns True if this font contains glyph of the specified character. Otherwise, return false.
   */
  hasChar(t) {
    return this.opentypeHasGlyph(t);
  }
  /**
   * Return true if this font contains glyph of the specified character code. Otherwise, return false.
   * @param code - The character code to check
   * @returns True if this font contains glyph of the specified character code. Otherwise, return false.
   */
  hasCode(t) {
    return this.hasChar(String.fromCodePoint(t));
  }
  /**
   * Loads glyph data lazily when requested.
   * Parsed glyphs are cached in an LRU cache to limit memory usage.
   * @param char - The character whose glyph should be loaded
   */
  _loadGlyphIfNeeded(t) {
    if (this.data.glyphs[t] || !this.opentypeFont) return;
    const e = this.glyphCache.get(t);
    if (e) {
      this.data.glyphs[t] = e;
      return;
    }
    if (this.opentypeHasGlyph(t)) {
      const s = this.opentypeLookupChar(t), i = this.opentypeFont.charToGlyph(s);
      if (!i || !i.path) return;
      const r = Math.round, a = {
        ha: r(i.advanceWidth ?? 0),
        x_min: r(i.xMin ?? 0),
        x_max: r(i.xMax ?? 0),
        o: ""
      };
      i.path.commands.forEach((o) => {
        let c = o.type.toLowerCase();
        c === "c" && (c = "b"), a.o += c + " ", o.x !== void 0 && o.y !== void 0 && (a.o += r(o.x) + " " + r(o.y) + " "), o.x1 !== void 0 && o.y1 !== void 0 && (a.o += r(o.x1) + " " + r(o.y1) + " "), o.x2 !== void 0 && o.y2 !== void 0 && (a.o += r(o.x2) + " " + r(o.y2) + " ");
      }), this.data.glyphs[t] = a, this.glyphCache.set(t, a);
    }
  }
  /**
   * Generates shapes for a text string
   * @param text - The text to generate shapes for
   * @param size - The size of the text
   * @returns Array of shapes representing the text
   */
  generateShapes(t, e) {
    for (const s of t)
      this._loadGlyphIfNeeded(s);
    return this.font.generateShapes(t, e);
  }
  /**
   * Gets the shape data for a specific character at a given size.
   * @param char - The character to get the shape for
   * @param size - The desired size of the character
   * @returns The shape data for the character, or undefined if not found
   */
  getCharShape(t, e) {
    if (this._loadGlyphIfNeeded(t), !this.data.glyphs[t]) {
      this.addUnsupportedChar(t);
      return;
    }
    return new Tc(t, e, this);
  }
  /**
   * Gets the shape data for a specific character unicode at a given size.
   * @param code - The character unicode to get the shape for
   * @param size - The desired size of the character
   * @returns The shape data for the character unicode, or undefined if not found
   */
  getCodeShape(t, e) {
    return this.getCharShape(String.fromCodePoint(t), e);
  }
  /**
   * Gets the scale factor for this font.
   * This is used to adjust the size of characters when rendering.
   * @returns The scale factor as a number
   */
  getScaleFactor() {
    return this.scaleFactor == null ? (this.scaleFactor = this.data.scaleFactor, this.scaleFactor) : this.scaleFactor;
  }
  /**
   * Gets the shape to display when a character is not found in the font.
   * Uses "?" as a replacement character.
   * @param size - The desired size of the not found shape
   * @returns The shape data for the not found indicator
   */
  getNotFoundTextShape(t) {
    return new Tc("?", t, this);
  }
  /**
   * Estimates memory used by this mesh font (parsed opentype + glyphs + geometry cache).
   */
  estimateMemoryUsage() {
    var a;
    const t = this.cache.getStats();
    let e = 0;
    const s = Object.keys(this.data.glyphs);
    for (const o of s)
      e += lf((a = this.data.glyphs[o]) == null ? void 0 : a.o);
    const i = Math.round(
      this.sourceByteLength * Mf
    ), r = i + e + t.estimatedBytes;
    return {
      names: Array.from(this.names),
      type: "mesh",
      sourceByteLength: this.sourceByteLength,
      parsedFontEstimatedBytes: i,
      charGeometryCache: t,
      meshGlyphs: {
        glyphCount: s.length,
        outlineStringBytes: e
      },
      estimatedBytes: r
    };
  }
  /**
   * Clears glyph and geometry caches. Does not unload the opentype parse until GC.
   */
  dispose() {
    this.glyphCache.clear(), this.data.glyphs = {}, super.dispose();
  }
}
class Bt {
  /**
   * Converts an unsigned byte to a signed byte as used in SHX format.
   * Values > 127 are converted to their signed equivalent (-128 to -1).
   * @param value - The unsigned byte value to convert
   * @returns The signed byte value
   */
  static byteToSByte(t) {
    return (t & 127) - (t & 128 ? 128 : 0);
  }
  /**
   * Creates a new ShxFileReader instance.
   * @param arraybuffer - The ArrayBuffer to read from
   */
  constructor(t) {
    this.position = 0, this.data = new DataView(t);
  }
  /**
   * Reads a specified number of bytes from the current position.
   * @param length - Number of bytes to read (optional)
   * @returns A Uint8Array containing the read bytes
   * @throws Error if reading beyond buffer bounds
   */
  readBytes(t = 1) {
    this.data.byteLength < this.position + t && this.throwOutOfRangeError(this.position + t);
    const e = new Uint8Array(this.data.buffer, this.position, t);
    return this.position += t, e;
  }
  /**
   * Skips a specified number of bytes from the current position.
   * @param length - Number of bytes to skip
   * @throws Error if skipping beyond buffer bounds
   */
  skip(t) {
    this.data.byteLength < this.position + t && this.throwOutOfRangeError(this.position + t), this.position += t;
  }
  /**
   * Reads an unsigned 8-bit integer.
   * @returns The read uint8 value
   * @throws Error if reading beyond buffer bounds
   */
  readUint8() {
    this.data.byteLength < this.position + 1 && this.throwOutOfRangeError(this.position + 1);
    const t = this.data.getUint8(this.position);
    return this.position += 1, t;
  }
  /**
   * Reads a signed 8-bit integer.
   * @returns The read int8 value
   * @throws Error if reading beyond buffer bounds
   */
  readInt8() {
    this.data.byteLength < this.position + 1 && this.throwOutOfRangeError(this.position + 1);
    const t = this.data.getInt8(this.position);
    return this.position += 1, t;
  }
  /**
   * Reads an unsigned 16-bit integer.
   * @param littleEndian If false, a big-endian value should be read.
   * @returns The read uint16 value
   * @throws Error if reading beyond buffer bounds
   */
  readUint16(t = !0) {
    this.data.byteLength < this.position + 2 && this.throwOutOfRangeError(this.position + 2);
    const e = this.data.getUint16(this.position, t);
    return this.position += 2, e;
  }
  /**
   * Reads a signed 16-bit integer.
   * @returns The read int16 value
   * @throws Error if reading beyond buffer bounds
   */
  readInt16() {
    this.data.byteLength < this.position + 2 && this.throwOutOfRangeError(this.position + 2);
    const t = this.data.getInt16(this.position, !0);
    return this.position += 2, t;
  }
  /**
   * Reads an unsigned 32-bit integer.
   * @returns The read uint32 value
   * @throws Error if reading beyond buffer bounds
   */
  readUint32() {
    this.data.byteLength < this.position + 4 && this.throwOutOfRangeError(this.position + 4);
    const t = this.data.getUint32(this.position, !0);
    return this.position += 4, t;
  }
  /**
   * Reads a signed 32-bit integer.
   * @returns The read int32 value
   * @throws Error if reading beyond buffer bounds
   */
  readInt32() {
    this.data.byteLength < this.position + 4 && this.throwOutOfRangeError(this.position + 4);
    const t = this.data.getInt32(this.position, !0);
    return this.position += 4, t;
  }
  /**
   * Reads a 32-bit floating point number.
   * @returns The read float32 value
   * @throws Error if reading beyond buffer bounds
   */
  readFloat32() {
    this.data.byteLength < this.position + 4 && this.throwOutOfRangeError(this.position + 4);
    const t = this.data.getFloat32(this.position, !0);
    return this.position += 4, t;
  }
  /**
   * Reads a 64-bit floating point number.
   * @returns The read float64 value
   * @throws Error if reading beyond buffer bounds
   */
  readFloat64() {
    this.data.byteLength < this.position + 8 && this.throwOutOfRangeError(this.position + 8);
    const t = this.data.getFloat64(this.position, !0);
    return this.position += 8, t;
  }
  /**
   * Sets the current read position in the buffer.
   * @param position - The new position to set
   */
  setPosition(t) {
    this.data.byteLength < t && this.throwOutOfRangeError(t), this.position = t;
  }
  /**
   * Checks if the current position is at the end of the buffer.
   * @returns True if at the end of the buffer, false otherwise
   */
  isEnd() {
    return this.position === this.data.byteLength - 1;
  }
  /**
   * Gets the current position in the buffer.
   * @returns The current position
   */
  get currentPosition() {
    return this.position;
  }
  /**
   * Gets the total length of the buffer.
   * @returns The buffer length in bytes
   */
  get length() {
    return this.data.byteLength;
  }
  /**
   * Throws an error when attempting to read beyond buffer bounds.
   * @param position - The position that caused the error
   * @throws Error with details about the out of range access
   */
  throwOutOfRangeError(t) {
    throw new Error(
      `Position ${t} is out of range for the data length ${this.data.byteLength}!`
    );
  }
}
var nt = /* @__PURE__ */ ((n) => (n.SHAPES = "shapes", n.BIGFONT = "bigfont", n.UNIFONT = "unifont", n))(nt || {});
class Vm {
  parse(t) {
    const e = this.parseHeader(t).split(" "), s = e[1].toLocaleLowerCase();
    if (!Object.values(nt).includes(s))
      throw new Error(`Invalid font type: ${s}`);
    return {
      fileHeader: e[0],
      fontType: s,
      fileVersion: e[2]
    };
  }
  parseHeader(t) {
    let e = "", s = 0;
    for (; t.currentPosition < t.length - 2 && s < 1024; ) {
      const i = t.readUint8();
      if (i === 13) {
        const r = t.currentPosition, a = t.readUint8(), o = t.readUint8();
        if (a === 10 && o === 26)
          break;
        t.setPosition(r), e += String.fromCharCode(i);
      } else
        e += String.fromCharCode(i);
      s++;
    }
    return e.trim();
  }
}
const jn = 10, Wm = [13, 10, 0];
function Rl(n, t) {
  if (t === 0) {
    n.orientation = "horizontal";
    return;
  }
  if (t === 2) {
    n.orientation = "horizontal", n.dualOrientation = !0;
    return;
  }
  n.orientation = "vertical";
}
function Dl(n) {
  const t = {};
  for (const [e, s] of Object.entries(n))
    t[s] = e;
  return t;
}
function Ul(n) {
  const t = n.indexOf(0);
  return t < 0 ? { name: null, bytecode: n } : { name: t > 0 ? new TextDecoder("ascii").decode(n.subarray(0, t)) : null, bytecode: n.subarray(t + 1) };
}
class qm {
  parse(t) {
    try {
      t.readBytes(4);
      const e = t.readInt16();
      if (e <= 0)
        throw new Error("Invalid shape count in font file");
      const s = [];
      for (let c = 0; c < e; c++)