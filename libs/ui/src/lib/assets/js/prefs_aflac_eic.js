(function (H) {
    var t, I, u, E, z, J, K, L, B, M, N, O, P, Q, F, G;
    t = (function (w) {
        function b(a) {
            if (!d.test(a)) throw Error();
            a = a.split(".");
            for (var c = window, b = 0; b < a.length; b++) c = c[a[b]];
            return c;
        }
        function g(a, c) {
            return "string" === typeof a &&
                "string" === typeof c &&
                a.length >= c.length
                ? a.substr(0, c.length) === c
                : !1;
        }
        var e = /^\/\//,
            f = /^[^:]+:/,
            c = /^https?:\/\/[^\/]+/,
            a = / (?:MSIE |Trident\/7\.0;.* rv:)(\d+)/,
            d = /^[^.]+(?:\.[^.]+)*$/;
        return {
            na: w,
            startsWith: g,
            S: function (a) {
                for (var c = 0; c < a.length; c++)
                    try {
                        var d = b(a[c]);
                        if (d) return d;
                    } catch (f) {}
                return "";
            },
            a: b,
            ea: function (a) {
                e.test(a) && (a = document.URL.match(f)[0] + a);
                return (a = a.match(c)) && !g(document.URL, a[0]) ? !1 : !0;
            },
            U: function () {
                var c = navigator.userAgent.match(a);
                return c ? parseInt(c[1], 10) : null;
            },
            V: function () {
                return window.XMLHttpRequest
                    ? new XMLHttpRequest()
                    : new ActiveXObject("Microsoft.XMLHTTP");
            },
            fa: function (a, c, b) {
                function d() {
                    a.onreadystatechange = null;
                    null !== q && (clearTimeout(q), (q = null));
                    y = !0;
                }
                var f = !1,
                    e = !1,
                    g = !1,
                    q = null,
                    y = !1;
                try {
                    (a.onreadystatechange = function () {
                        y || 4 !== a.readyState || (d(), (a = null), b(e, g));
                    }),
                        0 !== c &&
                            (q = setTimeout(function () {
                                y ||
                                    ((e = !0),
                                    d(),
                                    a.abort(),
                                    (a = null),
                                    b(e, g));
                            }, c)),
                        a.send(),
                        (f = !0);
                } catch (C) {
                    (g = !0), d(), (a = null);
                } finally {
                    f || b(e, g);
                }
            },
            W: function (a, c, b, d) {
                "boolean" === typeof d && d
                    ? (c = a.split(c))
                    : ((d = a.indexOf(c)),
                      (c =
                          -1 === d
                              ? [a]
                              : [
                                    a.substring(0, d),
                                    a.substring(d + c.length),
                                ]));
                a = c[0];
                for (d = 1; d < c.length; d++) a += b + c[d];
                return a;
            },
            yb: function (a) {
                if (!a) return 0;
                if (Array.prototype.reduce)
                    return a.split("").reduce(function (a, c) {
                        a = (a << 5) - a + c.charCodeAt(0);
                        return a & a;
                    }, 0);
                for (var c = 0, b = 0, d = a.length; b < d; b++)
                    (c = (c << 5) - c + a.charCodeAt(b)), (c = c & c);
                return c;
            },
            Y: function (a) {
                return 0 <= window.navigator.userAgent.indexOf(a);
            },
        };
    })(function (w) {
        var b;
        try {
            if (
                ((b = document.getElementById(w)),
                null === b || "undefined" === typeof b)
            )
                b = document.getElementsByName(w)[0];
        } catch (a) {}
        if (null === b || "undefined" === typeof b)
            for (var g = 0; g < document.forms.length; g++)
                for (
                    var e = document.forms[g], f = 0;
                    f < e.elements.length;
                    f++
                ) {
                    var c = e[f];
                    if (c.name === w || c.id === w) return c;
                }
        return b;
    });
    I = (function () {
        return function (w) {
            w =
                ("0000000" + (((w / 1e3) | 0) >>> 0).toString(16)).slice(-8) +
                "-";
            for (var b = 9; 36 > b; b++) {
                var g;
                13 === b || 18 === b || 23 === b
                    ? (g = "-")
                    : 14 === b
                    ? (g = "4")
                    : ((g = (16 * Math.random()) | 0),
                      19 === b && (g = (g & 3) | 8),
                      (g = g.toString(16)));
                w += g;
            }
            return w;
        };
    })();
    u = {
        i: [],
        aa: [],
        l: 9e3,
        N: null,
        ga: [],
        M: null,
        Eb: "@_PAYLOADINPUTID_@",
    };
    E = function b() {
        function g(b, d, f) {
            if (0 === c) for (c = b, a = f; d.length; ) d.shift().call(m, f);
        }
        function e(c, b) {
            setTimeout(function () {
                try {
                    var d = b.call(null, a);
                    d instanceof Object && d.then && d.then instanceof Function
                        ? d.then(c.T, c.reject)
                        : c.T(d);
                } catch (f) {
                    c.reject(f);
                }
            }, 0);
        }
        function f(a, b, f) {
            c === f
                ? e(a, b)
                : (1 === f ? d : k).push(function () {
                      e(a, b);
                  });
        }
        var c = 0,
            a,
            d = [],
            k = [],
            m = this;
        this.T = function (a) {
            g(1, d, a);
        };
        this.reject = function (a) {
            g(-1, k, a);
        };
        this.then = function (a, c) {
            var d = new b();
            a instanceof Function && f(d, a, 1);
            c instanceof Function && f(d, c, -1);
            return d;
        };
    };
    z = (function (b) {
        return {
            Fb: b,
            Db: function (g) {
                var e = [];
                return {
                    start: function (f) {
                        for (var c = 0; c < g.length; c++) e.push(b(g[c]));
                        if (e.length)
                            for (
                                var a = e.length,
                                    d = function () {
                                        !f.g() &&
                                            0 < a &&
                                            (--a, 0 === a && f.b());
                                    },
                                    c = 0;
                                c < e.length;
                                c++
                            )
                                e[c].Ca(d);
                        else f.b();
                    },
                    finish: function (b) {
                        if (b.ha()) for (b = 0; b < e.length; b++) e[b].ta();
                    },
                };
            },
        };
    })(function (b) {
        function g() {
            null !== d && (clearTimeout(d), (d = null));
            try {
                "function" === typeof b.finish && b.finish(e);
            } catch (a) {}
            f = !0;
            c.T();
        }
        var e,
            f = !1,
            c = new E(),
            a = !1,
            d = null,
            k = !1;
        e = {
            g: function () {
                return f;
            },
            b: function () {
                f || g();
            },
            Ca: function (a) {
                c.then(function () {
                    a();
                });
            },
            ta: function () {
                f || ((a = !0), g());
            },
            ha: function () {
                return a;
            },
            Wb: function () {
                return k;
            },
        };
        0 < b.B &&
            (d = setTimeout(function () {
                d = null;
                f || ((k = !0), g());
            }, b.B));
        try {
            b.start(e);
        } catch (m) {
            e.b();
        }
        return e;
    });
    J = (function (b, g) {
        function e(a) {
            if (!a) return (f = 4), null;
            if ((a = !b.ea(a))) {
                var c = b.U();
                if (null !== c && 10 > c) return (f = 8), null;
            }
            return a;
        }
        var f, c, a;
        f = 3;
        a = null;
        c = "";
        return {
            u: function () {
                var d = g.i[5],
                    k = null;
                return {
                    start: function (m) {
                        f = 3;
                        a = null;
                        c = "";
                        var h = !1;
                        try {
                            var l = e(d);
                            if (null !== l) {
                                try {
                                    k = b.V();
                                } catch (n) {
                                    f = 9;
                                    return;
                                }
                                try {
                                    k.open("GET", d, !0);
                                } catch (n) {
                                    f = 1;
                                    return;
                                }
                                b.fa(k, g.l, function (b, d) {
                                    try {
                                        if (!m.g())
                                            if (b) f = 2;
                                            else if (d) f = 6;
                                            else {
                                                var e = k;
                                                f = e.status;
                                                200 === e.status &&
                                                    ((c =
                                                        e.getResponseHeader(
                                                            "ETag"
                                                        ) || "")
                                                        ? (c = c.replace(
                                                              /"/g,
                                                              ""
                                                          ))
                                                        : (f = 7));
                                                c && (a = l);
                                            }
                                    } catch (g) {
                                        f = 6;
                                    } finally {
                                        m.b();
                                    }
                                });
                                h = !0;
                            }
                        } catch (n) {
                            f = 6;
                        } finally {
                            h || m.b();
                        }
                    },
                    finish: function (a) {
                        a.ha() && (f = 5);
                        k = null;
                    },
                };
            },
            jb: function () {
                return c;
            },
            ca: function () {
                return a;
            },
            da: function () {
                return f;
            },
        };
    })(t, u, z);
    K = (function (b, g) {
        function e(a) {
            return b.ea(a) || ((a = b.U()), 8 !== a && 9 !== a) ? !1 : !0;
        }
        function f(a, c, b) {
            function f() {
                a &&
                    !g &&
                    ((a.onload = a.onerror = a.ontimeout = null), (g = !0));
                a = null;
                b(e);
            }
            var e = !1,
                g = !1,
                n = !1;
            try {
                (a.onload = function () {
                    e = !0;
                    f();
                }),
                    (a.onerror = a.ontimeout = f),
                    (a.timeout = c),
                    a.send(),
                    (n = !0);
            } catch (v) {
            } finally {
                n || f();
            }
        }
        var c = null;
        return {
            u: function () {
                return {
                    start: function (a) {
                        try {
                            var d = g.i[1],
                                k = g.i[2],
                                m = g.i[3];
                            if (!d || (!k && "function" !== typeof m)) a.b();
                            else {
                                var h,
                                    l = function (d, f) {
                                        var e = new Date();
                                        if (!a.g()) {
                                            try {
                                                if (d && f) {
                                                    var g = f.replace(
                                                        /[^ -~](?:.|\n)*/,
                                                        ""
                                                    );
                                                    c = e;
                                                    if (k) {
                                                        var y = b.na(k);
                                                        y && (y.value = g);
                                                    }
                                                    "function" === typeof m &&
                                                        m(g);
                                                }
                                            } catch (h) {}
                                            a.b();
                                        }
                                    };
                                (function (a) {
                                    e(a)
                                        ? ((h = new XDomainRequest()),
                                          h.open("POST", a),
                                          f(h, g.l, function (a) {
                                              l(a, h.responseText);
                                          }))
                                        : ((h = b.V()),
                                          h.open("POST", a, !0),
                                          b.fa(h, g.l, function () {
                                              l(
                                                  200 === h.status,
                                                  h.responseText
                                              );
                                          }));
                                })(d);
                            }
                        } catch (n) {
                            a.b();
                        }
                    },
                };
            },
            hb: function () {
                return c;
            },
        };
    })(t, u, z);
    G = (function () {
        return {
            h: [],
            X: [],
            Da: function (b) {
                return {
                    Ja: b,
                    $: [],
                    Hb: function (b, e) {
                        for (var f = 0; f < e.length; f++) this.$[b + f] = e[f];
                    },
                    ya: function (b) {
                        this.Hb(this.$.length, b);
                    },
                    P: function () {
                        for (
                            var b = this.$, e = this.Ja.toString(), f = 0;
                            f < b.length;
                            f++
                        )
                            try {
                                for (
                                    var c = (e += "&"),
                                        a = "" + b[f](),
                                        d = "",
                                        k = /[%&]+/g,
                                        m = void 0,
                                        h = 0,
                                        m = k.exec(a);
                                    null !== m;

                                )
                                    (d +=
                                        a.substring(h, m.index) +
                                        encodeURIComponent(m[0])),
                                        (h = k.lastIndex),
                                        (m = k.exec(a));
                                d += a.substring(h);
                                e = c + d;
                            } catch (l) {}
                        return e;
                    },
                };
            },
        };
    })();
    L = (function (b, g) {
        var e = !1,
            f = !1;
        return {
            Sa: function () {
                return {
                    start: function (c) {
                        e = !1;
                        try {
                            (
                                window.requestFileSystem ||
                                window.webkitRequestFileSystem
                            )(
                                0,
                                0,
                                function () {
                                    c.b();
                                },
                                function () {
                                    c.g() || ((e = !0), c.b());
                                }
                            );
                        } catch (a) {
                            c.b();
                        }
                    },
                    B: g.l,
                };
            },
            Qa: function () {
                var c =
                        window.indexedDB ||
                        window.mozIndexedDB ||
                        window.webkitIndexedDB ||
                        window.msIndexedDB,
                    a;
                return {
                    start: function (b) {
                        f = !1;
                        try {
                            (a = c.open("pbtest")),
                                (a.onsuccess = function () {
                                    if (!b.g())
                                        try {
                                            a.result.close();
                                        } finally {
                                            b.b();
                                        }
                                }),
                                (a.onerror = function () {
                                    b.g() || ((f = !0), b.b());
                                });
                        } catch (e) {
                            b.b();
                        }
                    },
                    finish: function () {
                        a && (a = a.onsuccess = a.onerror = null);
                        c && c.deleteDatabase("pbtest");
                    },
                    B: g.l,
                };
            },
            ba: function () {
                var c;
                if (!(c = e || f))
                    a: {
                        if ((c = window.localStorage))
                            try {
                                c.setItem("pbtest", 1), c.removeItem("pbtest");
                            } catch (a) {
                                c = !0;
                                break a;
                            }
                        c = !1;
                    }
                c ||
                    window.indexedDB ||
                    ((c = b.U()),
                    (c = (null !== c && 10 <= c) || b.Y("Edge/")));
                c || (c = b.Y("Focus/"));
                return c;
            },
        };
    })(t, u, z);
    B = (function (b) {
        var g = null;
        return {
            Ra: function () {
                var e,
                    f = null;
                return {
                    start: function (c) {
                        g = null;
                        try {
                            (e = document.createElement("div")),
                                e.setAttribute(
                                    "class",
                                    "pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links adsbox"
                                ),
                                e.setAttribute(
                                    "style",
                                    b.W(
                                        "width:1px;height:1px;position:absolute;left:-10000px;right:-1000px;",
                                        ";",
                                        "!important;",
                                        !0
                                    )
                                ),
                                document.body.appendChild(e),
                                (f = setTimeout(function () {
                                    f = null;
                                    if (!c.g())
                                        try {
                                            g = !(
                                                e &&
                                                e.parentNode &&
                                                !e.getAttribute("abp") &&
                                                e.offsetParent &&
                                                0 !== e.offsetWidth &&
                                                0 !== e.offsetHeight &&
                                                0 !== e.clientWidth &&
                                                0 !== e.clientHeight
                                            );
                                        } finally {
                                            c.b();
                                        }
                                }, 100));
                        } catch (a) {
                            c.b();
                        }
                    },
                    finish: function () {
                        e &&
                            (e.parentNode && e.parentNode.removeChild(e),
                            (e = null));
                        null !== f && (clearTimeout(f), (f = null));
                    },
                };
            },
            ba: function () {
                return g;
            },
        };
    })(t, u, z);
    M = (function () {
        function b(c) {
            var a;
            37 > c
                ? 11 > c
                    ? c
                        ? (a = c + 47)
                        : (a = 46)
                    : (a = c + 54)
                : 38 > c
                ? (a = 95)
                : (a = c + 59);
            return String.fromCharCode(a);
        }
        function g(c) {
            function a(a) {
                f = (f << a[0]) | a[1];
                for (g += a[0]; 6 <= g; )
                    (a = (f >> (g - 6)) & 63),
                        (d += b(a)),
                        (g -= 6),
                        (f ^= a << g);
            }
            var d = "",
                f = 0,
                g = 0;
            a([6, ((c.length & 7) << 3) | 0]);
            a([6, (c.length & 56) | 1]);
            for (var h = 0; h < c.length; h++) {
                if (void 0 === e[c.charCodeAt(h)]) return;
                a(e[c.charCodeAt(h)]);
            }
            a(e[0]);
            0 < g && a([6 - g, 0]);
            return d;
        }
        var e = {
                1: [4, 15],
                110: [8, 239],
                74: [8, 238],
                57: [7, 118],
                56: [7, 117],
                71: [8, 233],
                25: [8, 232],
                101: [5, 28],
                104: [7, 111],
                4: [7, 110],
                105: [6, 54],
                5: [7, 107],
                109: [7, 106],
                103: [9, 423],
                82: [9, 422],
                26: [8, 210],
                6: [7, 104],
                46: [6, 51],
                97: [6, 50],
                111: [6, 49],
                7: [7, 97],
                45: [7, 96],
                59: [5, 23],
                15: [7, 91],
                11: [8, 181],
                72: [8, 180],
                27: [8, 179],
                28: [8, 178],
                16: [7, 88],
                88: [10, 703],
                113: [11, 1405],
                89: [12, 2809],
                107: [13, 5617],
                90: [14, 11233],
                42: [15, 22465],
                64: [16, 44929],
                0: [16, 44928],
                81: [9, 350],
                29: [8, 174],
                118: [8, 173],
                30: [8, 172],
                98: [8, 171],
                12: [8, 170],
                99: [7, 84],
                117: [6, 41],
                112: [6, 40],
                102: [9, 319],
                68: [9, 318],
                31: [8, 158],
                100: [7, 78],
                84: [6, 38],
                55: [6, 37],
                17: [7, 73],
                8: [7, 72],
                9: [7, 71],
                77: [7, 70],
                18: [7, 69],
                65: [7, 68],
                48: [6, 33],
                116: [6, 32],
                10: [7, 63],
                121: [8, 125],
                78: [8, 124],
                80: [7, 61],
                69: [7, 60],
                119: [7, 59],
                13: [8, 117],
                79: [8, 116],
                19: [7, 57],
                67: [7, 56],
                114: [6, 27],
                83: [6, 26],
                115: [6, 25],
                14: [6, 24],
                122: [8, 95],
                95: [8, 94],
                76: [7, 46],
                24: [7, 45],
                37: [7, 44],
                50: [5, 10],
                51: [5, 9],
                108: [6, 17],
                22: [7, 33],
                120: [8, 65],
                66: [8, 64],
                21: [7, 31],
                106: [7, 30],
                47: [6, 14],
                53: [5, 6],
                49: [5, 5],
                86: [8, 39],
                85: [8, 38],
                23: [7, 18],
                75: [7, 17],
                20: [7, 16],
                2: [5, 3],
                73: [8, 23],
                43: [9, 45],
                87: [9, 44],
                70: [7, 10],
                3: [6, 4],
                52: [5, 1],
                54: [5, 0],
            },
            f =
                "%20 ;;; %3B %2C und fin ed; %28 %29 %3A /53 ike Web 0; .0 e; on il ck 01 in Mo fa 00 32 la .1 ri it %u le".split(
                    " "
                );
        return {
            ja: function (c) {
                for (var a = c, d = 0; f[d]; d++)
                    a = a.split(f[d]).join(String.fromCharCode(d + 1));
                a = g(a);
                if (void 0 === a) return c;
                for (var d = 65535, e = 0; e < c.length; e++)
                    (d = ((d >>> 8) | (d << 8)) & 65535),
                        (d ^= c.charCodeAt(e) & 255),
                        (d ^= (d & 255) >> 4),
                        (d ^= (d << 12) & 65535),
                        (d ^= ((d & 255) << 5) & 65535);
                d &= 65535;
                c = "" + b(d >>> 12);
                c += b((d >>> 6) & 63);
                c += b(d & 63);
                return a + c;
            },
        };
    })();
    N = (function (b) {
        function g() {
            q || (q = v);
            try {
                isNaN(screen.logicalXDPI) || isNaN(screen.systemXDPI)
                    ? window.navigator.msMaxTouchPoints
                        ? (q = l)
                        : !window.chrome || window.opera || b.Y(" Opera")
                        ? 0 <=
                          Object.prototype.toString
                              .call(window.HTMLElement)
                              .indexOf("Constructor")
                            ? (q = m)
                            : "orientation" in window &&
                              "webkitRequestAnimationFrame" in window
                            ? (q = k)
                            : "webkitRequestAnimationFrame" in window
                            ? (q = d)
                            : b.Y("Opera")
                            ? (q = e)
                            : window.devicePixelRatio
                            ? (q = f)
                            : 0.001 < c().zoom && (q = c)
                        : (q = h)
                    : (q = n);
            } catch (a) {}
            return q();
        }
        function e() {
            var a = window.top.outerWidth / window.top.innerWidth,
                a = Math.round(100 * a) / 100;
            return { zoom: a, j: a * r() };
        }
        function f() {
            return { zoom: c().zoom, j: r() };
        }
        function c() {
            var c = a(),
                c = Math.round(100 * c) / 100;
            return { zoom: c, j: c };
        }
        function a() {
            function a(b, d, f) {
                var e = (b + d) / 2;
                return 0 >= f || 1e-4 > d - b
                    ? e
                    : c("(min--moz-device-pixel-ratio:" + e + ")").matches
                    ? a(e, d, f - 1)
                    : a(b, e, f - 1);
            }
            var c, b, d, f;
            window.matchMedia
                ? (c = window.matchMedia)
                : ((b = document.getElementsByTagName("head")[0]),
                  (d = document.createElement("style")),
                  b.appendChild(d),
                  (f = document.createElement("div")),
                  (f.className = "mediaQueryBinarySearch"),
                  (f.style.display = "none"),
                  document.body.appendChild(f),
                  (c = function (a) {
                      d.sheet.insertRule(
                          "@media " +
                              a +
                              "{.mediaQueryBinarySearch {text-decoration: underline} }",
                          0
                      );
                      a =
                          "underline" ===
                          getComputedStyle(f, null).textDecoration;
                      d.sheet.deleteRule(0);
                      return { matches: a };
                  }));
            var e = a(0, 10, 20);
            f && (b.removeChild(d), document.body.removeChild(f));
            return e;
        }
        function d() {
            var a = document.createElement("div");
            a.innerHTML = "1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>0";
            a.setAttribute(
                "style",
                "font: 100px/1em sans-serif; -webkit-text-size-adjust: none; text-size-adjust: none; height: auto; width: 1em; padding: 0; overflow: visible;".replace(
                    /;/g,
                    " !important;"
                )
            );
            var c = document.createElement("div");
            c.setAttribute(
                "style",
                "width:0; height:0; overflow:hidden; visibility:hidden; position: absolute;".replace(
                    /;/g,
                    " !important;"
                )
            );
            c.appendChild(a);
            document.body.appendChild(c);
            a = 1e3 / a.clientHeight;
            a = Math.round(100 * a) / 100;
            document.body.removeChild(c);
            return { zoom: a, j: a * r() };
        }
        function k() {
            var a =
                (90 == Math.abs(window.orientation)
                    ? screen.height
                    : screen.width) / window.innerWidth;
            return { zoom: a, j: a * r() };
        }
        function m() {
            var a =
                Math.round(
                    (document.documentElement.clientWidth / window.innerWidth) *
                        100
                ) / 100;
            return { zoom: a, j: a * r() };
        }
        function h() {
            var a =
                Math.round((window.outerWidth / window.innerWidth) * 100) / 100;
            return { zoom: a, j: a * r() };
        }
        function l() {
            var a =
                Math.round(
                    (document.documentElement.offsetHeight /
                        window.innerHeight) *
                        100
                ) / 100;
            return { zoom: a, j: a * r() };
        }
        function n() {
            var a =
                Math.round((screen.deviceXDPI / screen.logicalXDPI) * 100) /
                100;
            return { zoom: a, j: a * r() };
        }
        function v() {
            return { zoom: 1, j: 1 };
        }
        function r() {
            return window.devicePixelRatio || 1;
        }
        var q;
        return {
            zoom: function () {
                return g().zoom;
            },
            R: function () {
                return g().j;
            },
        };
    })(t);
    O = (function () {
        var b = {
                Flash: [
                    "ShockwaveFlash.ShockwaveFlash",
                    function (b) {
                        return b.getVariable("$version");
                    },
                ],
                Director: [
                    "SWCtl.SWCtl",
                    function (b) {
                        return b.ShockwaveVersion("");
                    },
                ],
            },
            g;
        try {
            (g = document.createElement("span")),
                "undefined" !== typeof g.addBehavior &&
                    g.addBehavior("#default#clientCaps");
        } catch (f) {}
        var e = {};
        return {
            f: function (b) {
                var c = "";
                try {
                    "undefined" !== typeof g.getComponentVersion &&
                        (c = g.getComponentVersion(b, "ComponentID"));
                } catch (a) {
                    (b = a.message.length),
                        (c = escape(a.message.substr(0, 40 < b ? 40 : b)));
                }
                return c;
            },
            v: function (b) {
                return e[b];
            },
            Va: function () {
                for (
                    var f =
                            "Acrobat;Flash;QuickTime;Java Plug-in;Director;Office".split(
                                ";"
                            ),
                        c = 0;
                    c < f.length;
                    c++
                ) {
                    var a = f[c],
                        d = a,
                        g = a,
                        a = "";
                    try {
                        if (navigator.plugins && navigator.plugins.length)
                            for (
                                var m = new RegExp(g + ".* ([0-9._]+)"), g = 0;
                                g < navigator.plugins.length;
                                g++
                            ) {
                                var h = m.exec(navigator.plugins[g].name);
                                null === h &&
                                    (h = m.exec(
                                        navigator.plugins[g].description
                                    ));
                                h && (a = h[1]);
                            }
                        else if (window.ActiveXObject && b[g])
                            try {
                                var l = new ActiveXObject(b[g][0]),
                                    a = b[g][1](l);
                            } catch (n) {
                                a = "";
                            }
                    } catch (n) {
                        a = n.message;
                    }
                    e[d] = a;
                }
            },
            c: function (b) {
                try {
                    if (navigator.plugins && navigator.plugins.length)
                        for (var c = 0; c < navigator.plugins.length; c++) {
                            var a = navigator.plugins[c];
                            if (0 <= a.name.indexOf(b))
                                return (
                                    a.name +
                                    (a.description ? "|" + a.description : "")
                                );
                        }
                } catch (d) {}
                return "";
            },
            mb: function () {
                var b = "";
                if (navigator.plugins && navigator.plugins.length)
                    for (var c = 0; c < navigator.plugins.length; c++) {
                        var a = navigator.plugins[c];
                        a &&
                            (b +=
                                a.name +
                                a.filename +
                                a.description +
                                a.version);
                    }
                return b;
            },
        };
    })();
    P = (function (b, g) {
        function e(c) {
            a = c.status;
            var e = ["", "", ""];
            try {
                m = c.getResponseHeader("cache-control");
                for (
                    var f = c.getAllResponseHeaders().toLowerCase().split("\n"),
                        g = ["warning", "x-cache", "via"],
                        k = 0;
                    k < g.length;
                    k++
                )
                    for (var x = 0; x < f.length; x++)
                        if (b.startsWith(f[x], g[k] + ":")) {
                            e[k] = c.getResponseHeader(g[k]);
                            break;
                        }
            } catch (D) {}
            h = e[0];
            l = e[1];
            n = e[2];
            200 === c.status &&
                ((c = c.getResponseHeader("Last-Modified")) ||
                    ((c = (void 0).getResponseHeader("Expires"))
                        ? ((c = new Date(c)),
                          c.setTime(c.getTime() - 31536e6),
                          (c = c.toUTCString()))
                        : (c = void 0)),
                (d = c || "") || (a = 7));
        }
        function f(c) {
            if (!c) return (a = 4), null;
            if ((c = !b.ea(c))) {
                var d = b.U();
                if (null !== d && 10 > d) return (a = 8), null;
            }
            return c;
        }
        function c() {
            a = 3;
            k = null;
            d = m = h = l = n = "";
        }
        var a, d, k, m, h, l, n;
        c();
        return {
            u: function () {
                var h = g.i[0],
                    r = null;
                return {
                    start: function (m) {
                        c();
                        var n = !1;
                        try {
                            var l = f(h);
                            if (null !== l) {
                                try {
                                    r = b.V();
                                } catch (x) {
                                    a = 9;
                                    return;
                                }
                                try {
                                    r.open("GET", h, !0);
                                } catch (x) {
                                    a = 1;
                                    return;
                                }
                                b.fa(r, g.l, function (c, b) {
                                    try {
                                        m.g() ||
                                            (c
                                                ? (a = 2)
                                                : b
                                                ? (a = 6)
                                                : (e(r), d && (k = l)));
                                    } catch (f) {
                                        a = 6;
                                    } finally {
                                        m.b();
                                    }
                                });
                                n = !0;
                            }
                        } catch (x) {
                            a = 6;
                        } finally {
                            n || m.b();
                        }
                    },
                    finish: function (c) {
                        c.ha() && (a = 5);
                        r = null;
                    },
                };
            },
            Ib: function () {
                try {
                    var h = g.i[0];
                    c();
                    var r = f(h);
                    if (null !== r) {
                        var m;
                        try {
                            m = b.V();
                        } catch (n) {
                            a = 9;
                            return;
                        }
                        try {
                            m.open("GET", h, !1);
                        } catch (n) {
                            a = 1;
                            return;
                        }
                        m.send();
                        e(m);
                        d && (k = r);
                    }
                } catch (n) {
                    a = 6;
                }
            },
            kb: function () {
                return d;
            },
            ca: function () {
                return k;
            },
            da: function () {
                return a;
            },
            gb: function () {
                return m;
            },
            vb: function () {
                return h;
            },
            xb: function () {
                return l;
            },
            ub: function () {
                return n;
            },
        };
    })(t, u, z);
    Q = (function () {
        function b(a) {
            e = new Date(a.getTime());
            f = g(1);
            c = g(7);
        }
        function g(a) {
            a--;
            var c = e.getTime(),
                b = e.getFullYear(),
                f = new Date(b, a, 15),
                g = f,
                l = f;
            f.getTime() <= c
                ? (l = new Date(b + 1, a, 15))
                : (g = new Date(b - 1, a, 15));
            return (
                c - g.getTime() < l.getTime() - c ? g : l
            ).getTimezoneOffset();
        }
        var e, f, c;
        b(new Date());
        return {
            Gb: b,
            wb: function () {
                return f;
            },
            rb: function () {
                return c;
            },
            Bb: function () {
                return c !== f;
            },
            Ab: function () {
                return c !== f && e.getTimezoneOffset() === Math.min(f, c);
            },
            qb: function () {
                return Math.max(f, c);
            },
        };
    })();
    F = (function (b) {
        function g() {
            for (
                var c = navigator.userAgentData.brands, a = 0;
                a < c.length;
                a++
            )
                switch (c[a].brand) {
                    case b.F:
                        return b.F.replace("Google ", "");
                    case b.J:
                        return b.J;
                    case b.H:
                        return b.H.replace("Microsoft ", "");
                    case b.L:
                        return b.L;
                    case b.C:
                        return b.C;
                    case b.D:
                        return b.D;
                    case b.G:
                        return b.G;
                    case b.K:
                        return b.K;
                    case b.I:
                        return b.I;
                }
            return b.Z;
        }
        function e(c) {
            return void 0 !== navigator.userAgentData && "function" === typeof c
                ? c.apply(this)
                : "";
        }
        var f = {
            platform: "",
            platformVersion: "",
            architecture: "",
            model: "",
            uaFullVersion: "",
            bitness: "",
            fullVersionList: "",
        };
        return {
            Oa: void 0 !== navigator.userAgentData,
            Cb: function () {
                return e(function () {
                    try {
                        return navigator.userAgentData.mobile;
                    } catch (c) {
                        return "";
                    }
                });
            },
            eb: function () {
                return e(function () {
                    try {
                        return g();
                    } catch (c) {
                        return "";
                    }
                });
            },
            fb: function () {
                return e(function () {
                    try {
                        var c;
                        a: {
                            for (
                                var a = navigator.userAgentData.brands,
                                    d = 0,
                                    f = 0,
                                    e = 0;
                                e < a.length;
                                e++
                            ) {
                                switch (a[e].brand) {
                                    case b.F:
                                    case b.J:
                                    case b.H:
                                    case b.L:
                                    case b.C:
                                    case b.D:
                                    case b.G:
                                    case b.K:
                                    case b.I:
                                        d = a[e].version;
                                        break;
                                    case b.Z:
                                        f = a[e].version;
                                }
                                if (0 !== d) {
                                    c = d;
                                    break a;
                                }
                            }
                            c = 0 !== f ? f : a[0].version;
                        }
                        return c;
                    } catch (g) {
                        return "";
                    }
                });
            },
            Ua: function () {
                return {
                    start: function (c) {
                        try {
                            void 0 !== navigator.userAgentData
                                ? navigator.userAgentData
                                      .getHighEntropyValues(Object.keys(f))
                                      .then(function (a) {
                                          c.g() || ((f = a), c.b());
                                      })
                                : c.b();
                        } catch (a) {
                            c.b();
                        }
                    },
                };
            },
            ra: function () {
                return f.platform;
            },
            sa: function () {
                return f.platformVersion;
            },
            la: function () {
                return f.architecture;
            },
            qa: function () {
                return f.model;
            },
            oa: function () {
                var c;
                a: if (
                    ((c = f.fullVersionList),
                    void 0 === c || null === c || 0 === c.length)
                )
                    c = f.uaFullVersion;
                else {
                    for (var a = 0, d = 0, e = 0; e < c.length; e++) {
                        switch (c[e].brand) {
                            case b.F:
                            case b.J:
                            case b.H:
                            case b.L:
                            case b.C:
                            case b.D:
                            case b.G:
                            case b.K:
                            case b.I:
                                a = c[e].version;
                                break;
                            case b.Z:
                                d = c[e].version;
                        }
                        if (0 !== a) {
                            c = a;
                            break a;
                        }
                    }
                    c = 0 !== d ? d : c[0].version;
                }
                return c;
            },
            ma: function () {
                return f.bitness;
            },
            pa: function () {
                return "" === f.fullVersionList
                    ? f.fullVersionList
                    : JSON.stringify(f.fullVersionList);
            },
            bb: function () {
                return JSON.stringify(navigator.userAgentData.brands);
            },
        };
    })({
        F: "Google Chrome",
        Z: "Chromium",
        J: "Opera",
        H: "Microsoft Edge",
        L: "Vivaldi",
        C: "Blisk",
        D: "Brave",
        G: "Colibri",
        K: "SamsungBrowser",
        I: "HuaweiBrowser",
    });
    B = (function (b, g, e, f, c, a, d, k, m, h, l, n) {
        function v(a) {
            q();
            a = a || c.Eb;
            try {
                if (!a) return C();
                var b;
                b = e.na(a);
                if (null === b || void 0 === b) return C();
                try {
                    var d = C();
                    return (b.value = d);
                } catch (f) {
                    b.value = escape(f.message);
                }
            } catch (f) {}
        }
        function r(a, b) {
            q();
            var d = Math.random() + 1 && [
                "https://globalsiteanalytics.com/resource/resource.png",
                "https://globalsiteanalytics.com/service/hdim",
                "user_prefs2",
            ];
            b ? (c.i = b) : (c.i = "string" !== typeof d ? d : []);
            y(c.aa, a);
            for (d = 0; d < c.ga.length; d++) c.ga[d]();
        }
        function q() {
            c.N && (c.N.ta(), (c.N = null));
        }
        function y(a, b) {
            for (var d = [], e = 0; e < a.length; e++)
                try {
                    d.push(a[e]());
                } catch (f) {}
            d = m.Db(d);
            d = m.Fb(d);
            "function" === typeof b && d.Ca(b);
            c.N = d;
        }
        function C() {
            u = new Date();
            h.Gb(u);
            d.Va();
            for (var b = "", e = 0; e < a.h.length; e++) {
                var f;
                try {
                    f = a.h[e]();
                } catch (r) {
                    f = "";
                }
                b += escape(f);
                b += ";";
            }
            b += escape(c.M.P()) + ";";
            for (e = 0; e < a.X.length; e++) b = a.X[e](b);
            return D ? g.ja(b) : b;
        }
        function x(a) {
            return function () {
                return a;
            };
        }
        var D = !0,
            A = {},
            t = "",
            p = x("");
        c.M = new a.Da(3);
        c.M.ya([
            function () {
                return t;
            },
            function () {
                return k.gb();
            },
            function () {
                return k
                    .vb()
                    .replace(
                        / *(\d{3}) [^ ]*( "[^"\\]*(\\(.|\n)[^"\\]*)*"){1,2} */g,
                        function (a, c) {
                            return c;
                        }
                    );
            },
            function () {
                return k.xb();
            },
            function () {
                return k.ub();
            },
            function () {
                var a = b.ba();
                return "boolean" === typeof a ? 0 + a : "";
            },
            function () {
                return e.a("devicePixelRatio");
            },
            function () {
                return Math.round(window.screen.width * f.R());
            },
            function () {
                return Math.round(window.screen.height * f.R());
            },
            function () {
                return e.a("screen.left");
            },
            function () {
                return e.a("screen.top");
            },
            function () {
                return e.a("innerWidth");
            },
            function () {
                return e.a("outerWidth");
            },
            function () {
                return f.zoom().toFixed(2);
            },
            function () {
                return e.a("navigator.languages");
            },
        ]);
        var u;
        a.h = [
            x("TF1"),
            x("031"),
            function () {
                return ScriptEngineMajorVersion();
            },
            function () {
                return ScriptEngineMinorVersion();
            },
            function () {
                return ScriptEngineBuildVersion();
            },
            function () {
                return d.f("{7790769C-0471-11D2-AF11-00C04FA35D02}");
            },
            function () {
                return d.f("{89820200-ECBD-11CF-8B85-00AA005B4340}");
            },
            function () {
                return d.f("{283807B5-2C60-11D0-A31D-00AA00B92C03}");
            },
            function () {
                return d.f("{4F216970-C90C-11D1-B5C7-0000F8051515}");
            },
            function () {
                return d.f("{44BBA848-CC51-11CF-AAFA-00AA00B6015C}");
            },
            function () {
                return d.f("{9381D8F2-0288-11D0-9501-00AA00B911A5}");
            },
            function () {
                return d.f("{4F216970-C90C-11D1-B5C7-0000F8051515}");
            },
            function () {
                return d.f("{5A8D6EE0-3E18-11D0-821E-444553540000}");
            },
            function () {
                return d.f("{89820200-ECBD-11CF-8B85-00AA005B4383}");
            },
            function () {
                return d.f("{08B0E5C0-4FCB-11CF-AAA5-00401C608555}");
            },
            function () {
                return d.f("{45EA75A0-A269-11D1-B5BF-0000F8051515}");
            },
            function () {
                return d.f("{DE5AED00-A4BF-11D1-9948-00C04F98BBC9}");
            },
            function () {
                return d.f("{22D6F312-B0F6-11D0-94AB-0080C74C7E95}");
            },
            function () {
                return d.f("{44BBA842-CC51-11CF-AAFA-00AA00B6015B}");
            },
            function () {
                return d.f("{3AF36230-A269-11D1-B5BF-0000F8051515}");
            },
            function () {
                return d.f("{44BBA840-CC51-11CF-AAFA-00AA00B6015C}");
            },
            function () {
                return d.f("{CC2A9BA0-3BDD-11D0-821E-444553540000}");
            },
            function () {
                return d.f("{08B0E5C0-4FCB-11CF-AAA5-00401C608500}");
            },
            function () {
                return e.a("navigator.appCodeName");
            },
            function () {
                return e.a("navigator.appName");
            },
            function () {
                return e.a("navigator.appVersion");
            },
            function () {
                return e.S([
                    "navigator.productSub",
                    "navigator.appMinorVersion",
                ]);
            },
            function () {
                return e.a("navigator.browserLanguage");
            },
            function () {
                return e.a("navigator.cookieEnabled");
            },
            function () {
                return e.S(["navigator.oscpu", "navigator.cpuClass"]);
            },
            p,
            function () {
                return e.a("navigator.platform");
            },
            function () {
                return e.a("navigator.systemLanguage");
            },
            function () {
                return n.P();
            },
            function () {
                return e.S(["navigator.language", "navigator.userLanguage"]);
            },
            function () {
                return e.a("document.defaultCharset");
            },
            function () {
                return e.a("document.domain");
            },
            function () {
                return e.a("screen.deviceXDPI");
            },
            function () {
                return e.a("screen.deviceYDPI");
            },
            function () {
                return e.a("screen.fontSmoothingEnabled");
            },
            function () {
                return e.a("screen.updateInterval");
            },
            function () {
                return h.Bb();
            },
            function () {
                return h.Ab();
            },
            function () {
                return "@UTC@";
            },
            function () {
                return -h.qb() / 60;
            },
            function () {
                return new Date(2005, 5, 7, 21, 33, 44, 888)
                    .toLocaleString()
                    .replace(/\u200e/g, "");
            },
            function () {
                return e.a("screen.width");
            },
            function () {
                return e.a("screen.height");
            },
            function () {
                return d.v("Acrobat");
            },
            function () {
                return d.v("Flash");
            },
            function () {
                return d.v("QuickTime");
            },
            function () {
                return d.v("Java Plug-in");
            },
            function () {
                return d.v("Director");
            },
            function () {
                return d.v("Office");
            },
            function () {
                return "@CT@";
            },
            function () {
                return h.wb();
            },
            function () {
                return h.rb();
            },
            function () {
                return u.toLocaleString().replace(/\u200e/g, "");
            },
            function () {
                return e.a("screen.colorDepth");
            },
            function () {
                return e.a("screen.availWidth");
            },
            function () {
                return e.a("screen.availHeight");
            },
            function () {
                return e.a("screen.availLeft");
            },
            function () {
                return e.a("screen.availTop");
            },
            function () {
                return d.c("Acrobat");
            },
            function () {
                return d.c("Adobe SVG");
            },
            function () {
                return d.c("Authorware");
            },
            function () {
                return d.c("Citrix ICA");
            },
            function () {
                return d.c("Director");
            },
            function () {
                return d.c("Flash");
            },
            function () {
                return d.c("MapGuide");
            },
            function () {
                return d.c("MetaStream");
            },
            function () {
                return d.c("PDF Viewer");
            },
            function () {
                return d.c("QuickTime");
            },
            function () {
                return d.c("RealOne");
            },
            function () {
                return d.c("RealPlayer Enterprise");
            },
            function () {
                return d.c("RealPlayer Plugin");
            },
            function () {
                return d.c("Seagate Software Report");
            },
            function () {
                return d.c("Silverlight");
            },
            function () {
                return d.c("Windows Media");
            },
            function () {
                return d.c("iPIX");
            },
            function () {
                return d.c("nppdf.so");
            },
            function () {
                var a = document.createElement("span");
                a.innerHTML = "&nbsp;";
                a.style.position = "absolute";
                a.style.left = "-9999px";
                document.body.appendChild(a);
                var c = a.offsetHeight;
                document.body.removeChild(a);
                return c;
            },
            p,
            p,
            p,
            p,
            p,
            p,
            p,
            p,
            p,
            p,
            p,
            p,
            p,
            p,
            function () {
                return "7.3.2";
            },
            p,
            function () {
                return k.kb();
            },
            p,
            p,
            p,
            p,
            p,
            function () {
                var a = k.ca();
                return "boolean" === typeof a ? 0 + a : "";
            },
            function () {
                return k.da();
            },
            function () {
                return "0";
            },
            p,
            p,
            p,
            p,
            function () {
                return (e.yb(d.mb()) >>> 0).toString(16) + "";
            },
            function () {
                return e.S(["navigator.doNotTrack", "navigator.msDoNotTrack"]);
            },
            p,
            p,
            p,
            p,
            p,
            p,
            function () {
                return l.Cb();
            },
            function () {
                return l.bb();
            },
            function () {
                return l.fb();
            },
            function () {
                return l.ra();
            },
            function () {
                return l.sa();
            },
            function () {
                return l.la();
            },
            function () {
                return l.qa();
            },
            function () {
                return l.oa();
            },
            function () {
                return l.ma();
            },
            function () {
                return l.pa();
            },
        ];
        a.X = [
            function (a) {
                return e.W(a, escape("@UTC@"), new Date().getTime());
            },
            function (a) {
                return e.W(
                    a,
                    escape("@CT@"),
                    new Date().getTime() - u.getTime()
                );
            },
        ];
        c.aa.push(
            k.u,
            function () {
                return {
                    start: function (a) {
                        t = "";
                        try {
                            navigator.getBattery().then(function (c) {
                                a.g() ||
                                    ((t = [
                                        c.charging,
                                        c.chargingTime,
                                        c.dischargingTime,
                                        c.level,
                                    ].join()),
                                    a.b());
                            });
                        } catch (c) {
                            a.b();
                        }
                    },
                    B: c.l,
                };
            },
            b.Ra,
            l.Ua
        );
        A.aflac_eic_form = v;
        A.f1b5 = g.ja;
        A.initiate = r;
        A.generate = function (a, b, d) {
            q();
            c.i = [a];
            2 < arguments.length ? y([k.u], d) : k.Ib();
        };
        return function (a) {
            a = a || {};
            var c = a.ctx || window;
            D = a.hasOwnProperty("compress") ? a.compress : !0;
            c.aflac_eic = A;
            D &&
                ((a = navigator.userAgent.toLowerCase()),
                "Gecko" === navigator.product &&
                    2 >=
                        parseInt(
                            a
                                .substring(
                                    a.indexOf("rv:") + 3,
                                    a.indexOf(")", a.indexOf("rv:") + 3)
                                )
                                .split(".")[0],
                            10
                        ) &&
                    v());
            return { P: v, Vb: r };
        };
    })(
        B,
        M,
        t,
        N,
        u,
        G,
        O,
        P,
        z,
        Q,
        F,
        (function (b, g, e, f, c) {
            return {
                P: function () {
                    if (!b.Oa) return g.a("navigator.userAgent");
                    var a = {
                        Ka: b.la(),
                        platform: b.ra(),
                        xa: b.sa(),
                        Na: b.eb(),
                        ka: b.oa(),
                        ua: b.qa(),
                        La: b.ma(),
                        Ya: b.pa(),
                    };
                    if (!(a.xa || a.ka || a.Ya || a.ua))
                        return g.a("navigator.userAgent");
                    var d = new c();
                    d.Aa(g.a("navigator.userAgent"));
                    d = d.ob();
                    if (
                        null === d.va.version ||
                        null === d.za.version ||
                        null === d.ia.version
                    )
                        return g.a("navigator.userAgent");
                    a = f.Za(a, d);
                    d = a.CH_platform;
                    return -1 < d.toLowerCase().indexOf("macos") ||
                        -1 < d.toLowerCase().indexOf("mac os")
                        ? f.A(e.Fa, a)
                        : -1 < d.toLowerCase().indexOf("windows")
                        ? ((a.CH_platformVersion = f.Xa(a.CH_platformVersion)),
                          f.A(e.Ia, a))
                        : -1 < d.toLowerCase().indexOf("android")
                        ? ((a.CH_platformVersion = f.Wa(a.CH_platformVersion)),
                          f.A(e.Ga, a))
                        : -1 < d.toLowerCase().indexOf("iphone") ||
                          -1 < d.toLowerCase().indexOf("ipod") ||
                          -1 < d.toLowerCase().indexOf("ipad") ||
                          -1 < d.toLowerCase().indexOf("ios")
                        ? g.a("navigator.userAgent")
                        : -1 < d.toLowerCase().indexOf("linux")
                        ? f.A(e.Ea, a)
                        : f.A(e.Ha, a);
                },
            };
        })(
            F,
            t,
            {
                Fa: "Mozilla/{{Mozilla_version}} (Macintosh; {{CH_architecture}} Mac OS X {{CH_platformVersion}}) AppleWebKit/{{AppleWebKit_version}} (KHTML, like Gecko) {{CH_BrowserName}}/{{CH_UAFullVersion}} Safari/{{Safari_version}}",
                Ia: "Mozilla/{{Mozilla_version}} ({{CH_platform}} NT {{CH_platformVersion}}; {{CH_architecture}}) AppleWebKit/{{AppleWebKit_version}} (KHTML, like Gecko) {{CH_BrowserName}}/{{CH_UAFullVersion}} Safari/{{Safari_version}}",
                Ga: "Mozilla/{{Mozilla_version}} (Linux; {{CH_platform}} {{CH_platformVersion}}; {{CH_model}}) AppleWebKit/{{AppleWebKit_version}} (KHTML, like Gecko) {{CH_BrowserName}}/{{CH_UAFullVersion}} Mobile Safari/{{Safari_version}}",
                Jb: "Mozilla/{{Mozilla_version}} ({{CH_model}}; {{CH_architecture}} {{CH_platform}} {{CH_platformVersion}}) AppleWebKit/{{AppleWebKit_version}} (KHTML, like Gecko) {{CH_BrowserName}}/{{CH_UAFullVersion}} Mobile Safari/{{Safari_version}}",
                Ea: "Mozilla/{{Mozilla_version}} (X11; {{CH_platform}} {{CH_platformVersion}}; {{CH_architecture}}_{{CH_bitness}}) AppleWebKit/{{AppleWebKit_version}} (KHTML, like Gecko) {{CH_BrowserName}}/{{CH_UAFullVersion}} Safari/{{Safari_version}}",
                Ha: "Mozilla/{{Mozilla_version}} ({{CH_platform}} {{CH_platformVersion}}; {{CH_model}} {{CH_architecture}}) AppleWebKit/{{AppleWebKit_version}} (KHTML, like Gecko) {{CH_BrowserName}}/{{CH_UAFullVersion}} Safari/{{Safari_version}}",
            },
            {
                A: function (b, g) {
                    for (var e in g)
                        g.hasOwnProperty(e) &&
                            (b = b.replace("{{" + e + "}}", g[e]));
                    return b;
                },
                Za: function (b, g) {
                    var e = b.Ka,
                        f = b.platform,
                        c = b.xa,
                        a = b.Na,
                        d = b.ka,
                        k = b.ua,
                        m = b.La,
                        h = g.va.version,
                        l = g.ia.version,
                        n = g.za.version;
                    if (null === h || void 0 === h || "" === h) h = "5.0";
                    if (null === l || void 0 === l || "" === l) l = "537.36";
                    if (null === n || void 0 === n || "" === n) n = "537.36";
                    if (null === f || void 0 === f || "" === f) f = g.wa.name;
                    if (null === c || void 0 === c || "" === c)
                        c = g.wa.version;
                    if (null === d || void 0 === d || "" === d)
                        d = g.Ma.version;
                    if (null === k || void 0 === k || "" === k) k = g.R.model;
                    return {
                        CH_architecture: e,
                        CH_platform: f,
                        CH_platformVersion: c,
                        CH_BrowserName: a,
                        CH_UAFullVersion: d,
                        CH_model: k,
                        CH_bitness: m,
                        Mozilla_version: h,
                        AppleWebKit_version: l,
                        Safari_version: n,
                    };
                },
                Wa: function (b) {
                    var g = this.Ba(b);
                    return 8 >= g.m
                        ? b
                        : (b = (
                              g.O
                                  ? [g.m, g.s, g.w, g.O]
                                  : g.w
                                  ? [g.m, g.s, g.w]
                                  : g.s
                                  ? [g.m, g.s]
                                  : [g.m]
                          ).join("."));
                },
                Xa: function (b) {
                    if (/^[a-zA-Z]+$/.test(b)) return b;
                    b = b.match(/\d|\.|\-/g).join("");
                    b = this.Ba(b);
                    return (b = (
                        b.O
                            ? [b.m, b.s, b.w, b.O]
                            : b.w
                            ? [b.m, b.s, b.w]
                            : [b.m, b.s]
                    ).join("."));
                },
                Ba: function (b) {
                    b = b.match(/\d*\.|\d+/g) || [];
                    return {
                        m: +b[0] || 0,
                        s: +b[1] || 0,
                        w: +b[2] || 0,
                        O: +b[3] || 0,
                    };
                },
            },
            (function () {
                function b(c) {
                    var b =
                        c ||
                        ("undefined" !== typeof window &&
                        window.navigator &&
                        window.navigator.userAgent
                            ? window.navigator.userAgent
                            : "");
                    this.cb = function () {
                        var c = { name: null, version: null };
                        e.call(c, b, a);
                        return c;
                    };
                    this.ib = function () {
                        var a = { vendor: null, model: null, type: null };
                        e.call(a, b, d);
                        return a;
                    };
                    this.lb = function () {
                        var a = { name: null, version: null };
                        e.call(a, b, m);
                        return a;
                    };
                    this.ab = function () {
                        var a = { name: null, version: null };
                        e.call(a, b, k);
                        return a;
                    };
                    this.pb = function () {
                        var a = { name: null, version: null };
                        e.call(a, b, h);
                        return a;
                    };
                    this.nb = function () {
                        var a = { name: null, version: null };
                        e.call(a, b, l);
                        return a;
                    };
                    this.ob = function () {
                        return {
                            Xb: this.sb(),
                            Ma: this.cb(),
                            va: this.lb(),
                            ia: this.ab(),
                            za: this.pb(),
                            wa: this.nb(),
                            R: this.ib(),
                        };
                    };
                    this.sb = function () {
                        return b;
                    };
                    this.Aa = function (a) {
                        b =
                            "string" === typeof a && 255 < a.length
                                ? f(a, 255)
                                : a;
                    };
                    this.Aa(b);
                    return this;
                }
                function g(a, b) {
                    for (var d in b)
                        if ("object" === typeof b[d] && 0 < b[d].length)
                            for (var e = 0; e < b[d].length; e++) {
                                if (c(b[d][e], a))
                                    return "?" === d ? void 0 : d;
                            }
                        else if (c(b[d], a)) return "?" === d ? void 0 : d;
                    return a;
                }
                function e(a, c) {
                    for (var b = 0, d, e, f, g, k, h; b < c.length && !k; ) {
                        var m = c[b],
                            l = c[b + 1];
                        for (d = e = 0; d < m.length && !k; )
                            if (((k = m[d].exec(a)), d++, k))
                                for (f = 0; f < l.length; f++)
                                    ++e,
                                        (h = k[e]),
                                        (g = l[f]),
                                        "object" === typeof g && 0 < g.length
                                            ? 2 === g.length
                                                ? (this[g[0]] =
                                                      "function" === typeof g[1]
                                                          ? g[1].call(this, h)
                                                          : g[1])
                                                : 3 === g.length
                                                ? (this[g[0]] =
                                                      "function" !==
                                                          typeof g[1] ||
                                                      (g[1].exec && g[1].test)
                                                          ? h
                                                              ? h.replace(
                                                                    g[1],
                                                                    g[2]
                                                                )
                                                              : void 0
                                                          : h
                                                          ? g[1].call(
                                                                this,
                                                                h,
                                                                g[2]
                                                            )
                                                          : void 0)
                                                : 4 === g.length &&
                                                  (this[g[0]] = h
                                                      ? g[3].call(
                                                            this,
                                                            h.replace(
                                                                g[1],
                                                                g[2]
                                                            )
                                                        )
                                                      : void 0)
                                            : (this[g] = h ? h : void 0);
                        b += 2;
                    }
                }
                function f(a, c) {
                    return "string" === typeof a
                        ? ((a = a.replace(/^\s\s*/, "").replace(/\s\s*$/, "")),
                          "undefined" === typeof c ? a : a.substring(0, 255))
                        : "";
                }
                function c(a, c) {
                    return "string" === typeof a
                        ? -1 !== c.toLowerCase().indexOf(a.toLowerCase())
                        : !1;
                }
                var a = [
                        [/\b(?:crmo|crios)\/([\w\.]+)/i],
                        ["version", ["name", "Chrome"]],
                        [/edg(?:e|ios|a)?\/([\w\.]+)/i],
                        ["version", ["name", "Edge"]],
                        [
                            /(opera mini)\/([-\w\.]+)/i,
                            /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i,
                            /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i,
                        ],
                        ["name", "version"],
                        [/opios[\/ ]+([\w\.]+)/i],
                        ["version", ["name", "Opera Mini"]],
                        [/\bopr\/([\w\.]+)/i],
                        ["version", ["name", "Opera"]],
                        [
                            /(kindle)\/([\w\.]+)/i,
                            /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i,
                            /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i,
                            /(ba?idubrowser)[\/ ]?([\w\.]+)/i,
                            /(?:ms|\()(ie) ([\w\.]+)/i,
                            /(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale|qqbrowserlite|qq)\/([-\w\.]+)/i,
                            /(weibo)__([\d\.]+)/i,
                        ],
                        ["name", "version"],
                        [/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i],
                        ["version", ["name", "UCBrowser"]],
                        [/\bqbcore\/([\w\.]+)/i],
                        ["version", ["name", "WeChat(Win) Desktop"]],
                        [/micromessenger\/([\w\.]+)/i],
                        ["version", ["name", "WeChat"]],
                        [/konqueror\/([\w\.]+)/i],
                        ["version", ["name", "Konqueror"]],
                        [/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i],
                        ["version", ["name", "IE"]],
                        [/yabrowser\/([\w\.]+)/i],
                        ["version", ["name", "Yandex"]],
                        [/(avast|avg)\/([\w\.]+)/i],
                        [["name", /(.+)/, "$1 Secure Browser"], "version"],
                        [/\bfocus\/([\w\.]+)/i],
                        ["version", ["name", "Firefox Focus"]],
                        [/\bopt\/([\w\.]+)/i],
                        ["version", ["name", "Opera Touch"]],
                        [/coc_coc\w+\/([\w\.]+)/i],
                        ["version", ["name", "Coc Coc"]],
                        [/dolfin\/([\w\.]+)/i],
                        ["version", ["name", "Dolphin"]],
                        [/coast\/([\w\.]+)/i],
                        ["version", ["name", "Opera Coast"]],
                        [/miuibrowser\/([\w\.]+)/i],
                        ["version", ["name", "MIUI Browser"]],
                        [/fxios\/([-\w\.]+)/i],
                        ["version", ["name", "Firefox"]],
                        [/\bqihu|(qi?ho?o?|360)browser/i],
                        [["name", "360 Browser"]],
                        [/(oculus|samsung|sailfish)browser\/([\w\.]+)/i],
                        [["name", /(.+)/, "$1 Browser"], "version"],
                        [/(comodo_dragon)\/([\w\.]+)/i],
                        [["name", /_/g, " "], "version"],
                        [
                            /(electron)\/([\w\.]+) safari/i,
                            /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i,
                            /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i,
                        ],
                        ["name", "version"],
                        [/(metasr)[\/ ]?([\w\.]+)/i, /(lbbrowser)/i],
                        ["name"],
                        [
                            /((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i,
                        ],
                        [["name", "Facebook"], "version"],
                        [
                            /safari (line)\/([\w\.]+)/i,
                            /\b(line)\/([\w\.]+)\/iab/i,
                            /(chromium|instagram)[\/ ]([-\w\.]+)/i,
                        ],
                        ["name", "version"],
                        [/\bgsa\/([\w\.]+) .*safari\//i],
                        ["version", ["name", "GSA"]],
                        [/headlesschrome(?:\/([\w\.]+)| )/i],
                        ["version", ["name", "Chrome Headless"]],
                        [/ wv\).+(chrome)\/([\w\.]+)/i],
                        [["name", "Chrome WebView"], "version"],
                        [
                            /droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i,
                        ],
                        ["version", ["name", "Android Browser"]],
                        [
                            /(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i,
                        ],
                        ["name", "version"],
                        [/version\/([\w\.]+) .*mobile\/\w+ (safari)/i],
                        ["version", ["name", "Mobile Safari"]],
                        [/version\/([\w\.]+) .*(mobile ?safari|safari)/i],
                        ["version", "name"],
                        [/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i],
                        [
                            "name",
                            [
                                "version",
                                g,
                                {
                                    "1.0": "/8",
                                    1.2: "/1",
                                    1.3: "/3",
                                    "2.0": "/412",
                                    "2.0.2": "/416",
                                    "2.0.3": "/417",
                                    "2.0.4": "/419",
                                    "?": "/",
                                },
                            ],
                        ],
                        [/(webkit|khtml)\/([\w\.]+)/i],
                        ["name", "version"],
                        [/(navigator|netscape\d?)\/([-\w\.]+)/i],
                        [["name", "Netscape"], "version"],
                        [/mobile vr; rv:([\w\.]+)\).+firefox/i],
                        ["version", ["name", "Firefox Reality"]],
                        [
                            /ekiohf.+(flow)\/([\w\.]+)/i,
                            /(swiftfox)/i,
                            /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i,
                            /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i,
                            /(firefox)\/([\w\.]+)/i,
                            /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i,
                            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i,
                            /(links) \(([\w\.]+)/i,
                        ],
                        ["name", "version"],
                    ],
                    d = [
                        [
                            /\b(sch-i[89]0\d|shw-m380s|sm-[pt]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i,
                        ],
                        ["model", ["vendor", "Samsung"], ["type", "tablet"]],
                        [
                            /\b((?:s[cgp]h|gt|sm)-\w+|galaxy nexus)/i,
                            /samsung[- ]([-\w]+)/i,
                            /sec-(sgh\w+)/i,
                        ],
                        ["model", ["vendor", "Samsung"], ["type", "mobile"]],
                        [/\((ip(?:hone|od)[\w ]*);/i],
                        ["model", ["vendor", "Apple"], ["type", "mobile"]],
                        [
                            /\((ipad);[-\w\),; ]+apple/i,
                            /applecoremedia\/[\w\.]+ \((ipad)/i,
                            /\b(ipad)\d\d?,\d\d?[;\]].+ios/i,
                        ],
                        ["model", ["vendor", "Apple"], ["type", "tablet"]],
                        [
                            /\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i,
                        ],
                        ["model", ["vendor", "Huawei"], ["type", "tablet"]],
                        [
                            /(?:huawei|honor)([-\w ]+)[;\)]/i,
                            /\b(nexus 6p|\w{2,4}-[atu]?[ln][01259x][012359][an]?)\b(?!.+d\/s)/i,
                        ],
                        ["model", ["vendor", "Huawei"], ["type", "mobile"]],
                        [
                            /\b(poco[\w ]+)(?: bui|\))/i,
                            /\b; (\w+) build\/hm\1/i,
                            /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i,
                            /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i,
                            /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i,
                        ],
                        [
                            ["model", /_/g, " "],
                            ["vendor", "Xiaomi"],
                            ["type", "mobile"],
                        ],
                        [/\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i],
                        [
                            ["model", /_/g, " "],
                            ["vendor", "Xiaomi"],
                            ["type", "tablet"],
                        ],
                        [
                            /; (\w+) bui.+ oppo/i,
                            /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i,
                        ],
                        ["model", ["vendor", "OPPO"], ["type", "mobile"]],
                        [
                            /vivo (\w+)(?: bui|\))/i,
                            /\b(v[12]\d{3}\w?[at])(?: bui|;)/i,
                        ],
                        ["model", ["vendor", "Vivo"], ["type", "mobile"]],
                        [/\b(rmx[12]\d{3})(?: bui|;|\))/i],
                        ["model", ["vendor", "Realme"], ["type", "mobile"]],
                        [
                            /\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i,
                            /\bmot(?:orola)?[- ](\w*)/i,
                            /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i,
                        ],
                        ["model", ["vendor", "Motorola"], ["type", "mobile"]],
                        [/\b(mz60\d|xoom[2 ]{0,2}) build\//i],
                        ["model", ["vendor", "Motorola"], ["type", "tablet"]],
                        [
                            /((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i,
                        ],
                        ["model", ["vendor", "LG"], ["type", "tablet"]],
                        [
                            /(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i,
                            /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i,
                            /\blg-?([\d\w]+) bui/i,
                        ],
                        ["model", ["vendor", "LG"], ["type", "mobile"]],
                        [
                            /(ideatab[-\w ]+)/i,
                            /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i,
                        ],
                        ["model", ["vendor", "Lenovo"], ["type", "tablet"]],
                        [
                            /(?:maemo|nokia).*(n900|lumia \d+)/i,
                            /nokia[-_ ]?([-\w\.]*)/i,
                        ],
                        [
                            ["model", /_/g, " "],
                            ["vendor", "Nokia"],
                            ["type", "mobile"],
                        ],
                        [/(pixel c)\b/i],
                        ["model", ["vendor", "Google"], ["type", "tablet"]],
                        [/droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i],
                        ["model", ["vendor", "Google"], ["type", "mobile"]],
                        [
                            /droid.+ ([c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i,
                        ],
                        ["model", ["vendor", "Sony"], ["type", "mobile"]],
                        [/sony tablet [ps]/i, /\b(?:sony)?sgp\w+(?: bui|\))/i],
                        [
                            ["model", "Xperia Tablet"],
                            ["vendor", "Sony"],
                            ["type", "tablet"],
                        ],
                        [
                            / (kb2005|in20[12]5|be20[12][59])\b/i,
                            /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i,
                        ],
                        ["model", ["vendor", "OnePlus"], ["type", "mobile"]],
                        [
                            /(alexa)webm/i,
                            /(kf[a-z]{2}wi)( bui|\))/i,
                            /(kf[a-z]+)( bui|\)).+silk\//i,
                        ],
                        ["model", ["vendor", "Amazon"], ["type", "tablet"]],
                        [/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i],
                        [
                            ["model", /(.+)/g, "Fire Phone $1"],
                            ["vendor", "Amazon"],
                            ["type", "mobile"],
                        ],
                        [/(playbook);[-\w\),; ]+(rim)/i],
                        ["model", "vendor", ["type", "tablet"]],
                        [/\b((?:bb[a-f]|st[hv])100-\d)/i, /\(bb10; (\w+)/i],
                        ["model", ["vendor", "BlackBerry"], ["type", "mobile"]],
                        [
                            /(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i,
                        ],
                        ["model", ["vendor", "ASUS"], ["type", "tablet"]],
                        [/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i],
                        ["model", ["vendor", "ASUS"], ["type", "mobile"]],
                        [/(nexus 9)/i],
                        ["model", ["vendor", "HTC"], ["type", "tablet"]],
                        [
                            /(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i,
                            /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i,
                            /(alcatel|geeksphone|nexian|panasonic|sony)[-_ ]?([-\w]*)/i,
                        ],
                        ["vendor", ["model", /_/g, " "], ["type", "mobile"]],
                        [/droid.+; ([ab][1-7]-?[0178a]\d\d?)/i],
                        ["model", ["vendor", "Acer"], ["type", "tablet"]],
                        [/droid.+; (m[1-5] note) bui/i, /\bmz-([-\w]{2,})/i],
                        ["model", ["vendor", "Meizu"], ["type", "mobile"]],
                        [/\b(sh-?[altvz]?\d\d[a-ekm]?)/i],
                        ["model", ["vendor", "Sharp"], ["type", "mobile"]],
                        [
                            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i,
                            /(hp) ([\w ]+\w)/i,
                            /(asus)-?(\w+)/i,
                            /(microsoft); (lumia[\w ]+)/i,
                            /(lenovo)[-_ ]?([-\w]+)/i,
                            /(jolla)/i,
                            /(oppo) ?([\w ]+) bui/i,
                        ],
                        ["vendor", "model", ["type", "mobile"]],
                        [
                            /(archos) (gamepad2?)/i,
                            /(hp).+(touchpad(?!.+tablet)|tablet)/i,
                            /(kindle)\/([\w\.]+)/i,
                            /(nook)[\w ]+build\/(\w+)/i,
                            /(dell) (strea[kpr\d ]*[\dko])/i,
                            /(le[- ]+pan)[- ]+(\w{1,9}) bui/i,
                            /(trinity)[- ]*(t\d{3}) bui/i,
                            /(gigaset)[- ]+(q\w{1,9}) bui/i,
                            /(vodafone) ([\w ]+)(?:\)| bui)/i,
                        ],
                        ["vendor", "model", ["type", "tablet"]],
                        [/(surface duo)/i],
                        ["model", ["vendor", "Microsoft"], ["type", "tablet"]],
                        [/droid [\d\.]+; (fp\du?)(?: b|\))/i],
                        ["model", ["vendor", "Fairphone"], ["type", "mobile"]],
                        [/(u304aa)/i],
                        ["model", ["vendor", "AT&T"], ["type", "mobile"]],
                        [/\bsie-(\w*)/i],
                        ["model", ["vendor", "Siemens"], ["type", "mobile"]],
                        [/\b(rct\w+) b/i],
                        ["model", ["vendor", "RCA"], ["type", "tablet"]],
                        [/\b(venue[\d ]{2,7}) b/i],
                        ["model", ["vendor", "Dell"], ["type", "tablet"]],
                        [/\b(q(?:mv|ta)\w+) b/i],
                        ["model", ["vendor", "Verizon"], ["type", "tablet"]],
                        [/\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i],
                        [
                            "model",
                            ["vendor", "Barnes & Noble"],
                            ["type", "tablet"],
                        ],
                        [/\b(tm\d{3}\w+) b/i],
                        ["model", ["vendor", "NuVision"], ["type", "tablet"]],
                        [/\b(k88) b/i],
                        ["model", ["vendor", "ZTE"], ["type", "tablet"]],
                        [/\b(nx\d{3}j) b/i],
                        ["model", ["vendor", "ZTE"], ["type", "mobile"]],
                        [/\b(gen\d{3}) b.+49h/i],
                        ["model", ["vendor", "Swiss"], ["type", "mobile"]],
                        [/\b(zur\d{3}) b/i],
                        ["model", ["vendor", "Swiss"], ["type", "tablet"]],
                        [/\b((zeki)?tb.*\b) b/i],
                        ["model", ["vendor", "Zeki"], ["type", "tablet"]],
                        [
                            /\b([yr]\d{2}) b/i,
                            /\b(dragon[- ]+touch |dt)(\w{5}) b/i,
                        ],
                        [
                            ["vendor", "Dragon Touch"],
                            "model",
                            ["type", "tablet"],
                        ],
                        [/\b(ns-?\w{0,9}) b/i],
                        ["model", ["vendor", "Insignia"], ["type", "tablet"]],
                        [/\b((nxa|next)-?\w{0,9}) b/i],
                        ["model", ["vendor", "NextBook"], ["type", "tablet"]],
                        [/\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i],
                        [["vendor", "Voice"], "model", ["type", "mobile"]],
                        [/\b(lvtel\-)?(v1[12]) b/i],
                        [["vendor", "LvTel"], "model", ["type", "mobile"]],
                        [/\b(ph-1) /i],
                        ["model", ["vendor", "Essential"], ["type", "mobile"]],
                        [/\b(v(100md|700na|7011|917g).*\b) b/i],
                        ["model", ["vendor", "Envizen"], ["type", "tablet"]],
                        [/\b(trio[-\w\. ]+) b/i],
                        ["model", ["vendor", "MachSpeed"], ["type", "tablet"]],
                        [/\btu_(1491) b/i],
                        ["model", ["vendor", "Rotor"], ["type", "tablet"]],
                        [/(shield[\w ]+) b/i],
                        ["model", ["vendor", "Nvidia"], ["type", "tablet"]],
                        [/(sprint) (\w+)/i],
                        ["vendor", "model", ["type", "mobile"]],
                        [/(kin\.[onetw]{3})/i],
                        [
                            ["model", /\./g, " "],
                            ["vendor", "Microsoft"],
                            ["type", "mobile"],
                        ],
                        [
                            /droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i,
                        ],
                        ["model", ["vendor", "Zebra"], ["type", "tablet"]],
                        [/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i],
                        ["model", ["vendor", "Zebra"], ["type", "mobile"]],
                        [/(ouya)/i, /(nintendo) ([wids3utch]+)/i],
                        ["vendor", "model", ["type", "console"]],
                        [/droid.+; (shield) bui/i],
                        ["model", ["vendor", "Nvidia"], ["type", "console"]],
                        [/(playstation [345portablevi]+)/i],
                        ["model", ["vendor", "Sony"], ["type", "console"]],
                        [/\b(xbox(?: one)?(?!; xbox))[\); ]/i],
                        ["model", ["vendor", "Microsoft"], ["type", "console"]],
                        [/smart-tv.+(samsung)/i],
                        ["vendor", ["type", "smarttv"]],
                        [/hbbtv.+maple;(\d+)/i],
                        [
                            ["model", /^/, "SmartTV"],
                            ["vendor", "Samsung"],
                            ["type", "smarttv"],
                        ],
                        [
                            /(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i,
                        ],
                        [
                            ["vendor", "LG"],
                            ["type", "smarttv"],
                        ],
                        [/(apple) ?tv/i],
                        ["vendor", ["model", "Apple TV"], ["type", "smarttv"]],
                        [/crkey/i],
                        [
                            ["model", "Chromecast"],
                            ["vendor", "Google"],
                            ["type", "smarttv"],
                        ],
                        [/droid.+aft(\w)( bui|\))/i],
                        ["model", ["vendor", "Amazon"], ["type", "smarttv"]],
                        [/\(dtv[\);].+(aquos)/i],
                        ["model", ["vendor", "Sharp"], ["type", "smarttv"]],
                        [
                            /\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i,
                            /hbbtv\/\d+\.\d+\.\d+ +\([\w ]*; *(\w[^;]*);([^;]*)/i,
                        ],
                        [
                            ["vendor", f],
                            ["model", f],
                            ["type", "smarttv"],
                        ],
                        [/\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i],
                        [["type", "smarttv"]],
                        [/((pebble))app/i],
                        ["vendor", "model", ["type", "wearable"]],
                        [/droid.+; (glass) \d/i],
                        ["model", ["vendor", "Google"], ["type", "wearable"]],
                        [/droid.+; (wt63?0{2,3})\)/i],
                        ["model", ["vendor", "Zebra"], ["type", "wearable"]],
                        [/(quest( 2)?)/i],
                        ["model", ["vendor", "Facebook"], ["type", "wearable"]],
                        [/(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i],
                        ["vendor", ["type", "embedded"]],
                        [
                            /droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i,
                        ],
                        ["model", ["type", "mobile"]],
                        [
                            /droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i,
                        ],
                        ["model", ["type", "tablet"]],
                        [/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i],
                        [["type", "tablet"]],
                        [
                            /(phone|mobile(?:[;\/]| safari)|pda(?=.+windows ce))/i,
                        ],
                        [["type", "mobile"]],
                        [/(android[-\w\. ]{0,9});.+buil/i],
                        ["model", ["vendor", "Generic"]],
                    ],
                    k = [[/(applewebkit)\/([\w\.]+)/i], ["name", "version"]],
                    m = [[/(mozilla)\/([\w\.]+)/i], ["name", "version"]],
                    h = [[/(safari)\/([\w\.]+)/i], ["name", "version"]],
                    l = [
                        [/microsoft (windows) (vista|xp)/i],
                        ["name", "version"],
                        [
                            /(windows) nt 6\.2; (arm)/i,
                            /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i,
                            /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i,
                        ],
                        ["name", "version"],
                        [/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i],
                        [
                            ["name", "Windows"],
                            [
                                "version",
                                g,
                                {
                                    ME: "4.90",
                                    "NT 3.11": "NT3.51",
                                    "NT 4.0": "NT4.0",
                                    2e3: "NT 5.0",
                                    XP: ["NT 5.1", "NT 5.2"],
                                    Vista: "NT 6.0",
                                    7: "NT 6.1",
                                    8: "NT 6.2",
                                    8.1: "NT 6.3",
                                    10: ["NT 6.4", "NT 10.0"],
                                    RT: "ARM",
                                },
                            ],
                        ],
                        [
                            /ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i,
                            /cfnetwork\/.+darwin/i,
                        ],
                        [
                            ["version", /_/g, "."],
                            ["name", "iOS"],
                        ],
                        [
                            /(mac os x) ?([\w\. ]*)/i,
                            /(macintosh|mac_powerpc\b)(?!.+haiku)/i,
                        ],
                        [
                            ["name", "Mac OS"],
                            ["version", /_/g, "."],
                        ],
                        [/droid ([\w\.]+)\b.+(android[- ]x86)/i],
                        ["version", "name"],
                        [
                            /(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i,
                            /(blackberry)\w*\/([\w\.]*)/i,
                            /(tizen|kaios)[\/ ]([\w\.]+)/i,
                            /\((series40);/i,
                        ],
                        ["name", "version"],
                        [/\(bb(10);/i],
                        ["version", ["name", "BlackBerry"]],
                        [
                            /(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i,
                        ],
                        ["version", ["name", "Symbian"]],
                        [
                            /mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i,
                        ],
                        ["version", ["name", "Firefox OS"]],
                        [
                            /web0s;.+rt(tv)/i,
                            /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i,
                        ],
                        ["version", ["name", "webOS"]],
                        [/crkey\/([\d\.]+)/i],
                        ["version", ["name", "Chromecast"]],
                        [/(cros) [\w]+ ([\w\.]+\w)/i],
                        [["name", "Chromium OS"], "version"],
                        [
                            /(nintendo|playstation) ([wids345portablevuch]+)/i,
                            /(xbox); +xbox ([^\);]+)/i,
                            /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i,
                            /(mint)[\/\(\) ]?(\w*)/i,
                            /(mageia|vectorlinux)[; ]/i,
                            /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i,
                            /(hurd|linux) ?([\w\.]*)/i,
                            /(gnu) ?([\w\.]*)/i,
                            /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i,
                            /(haiku) (\w+)/i,
                        ],
                        ["name", "version"],
                        [/(sunos) ?([\w\.\d]*)/i],
                        [["name", "Solaris"], "version"],
                        [
                            /((?:open)?solaris)[-\/ ]?([\w\.]*)/i,
                            /(aix) ((\d)(?=\.|\)| )[\w\.])*/i,
                            /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux)/i,
                            /(unix) ?([\w\.]*)/i,
                        ],
                        ["name", "version"],
                    ];
                b.Mb = ["name", "version", "major"];
                b.Nb =
                    "model vendor type console mobile smarttv tablet wearable embedded".split(
                        " "
                    );
                b.Ob = ["name", "version"];
                b.Lb = ["name", "version"];
                b.Ub = ["name", "version"];
                b.Pb = ["name", "version"];
                return b;
            })()
        )
    );
    (function (b) {
        "undefined" !== typeof H ? b(H) : b();
    })(
        (function (b, g, e, f, c, a, d, k, m, h, l) {
            var n = "",
                v = "";
            a.X[0] = function (a) {
                return b.W(
                    a,
                    escape("@UTC@"),
                    (c.hb() || new Date()).getTime()
                );
            };
            a.h[106] = function () {
                return "1";
            };
            a.h[108] = function () {
                return n;
            };
            a.h[109] = function () {
                return v;
            };
            a.h[110] = function () {
                return g(new Date().getTime());
            };
            a.h[113] = function () {
                return 0 + d.ba();
            };
            a.h[114] = function () {
                return e.jb();
            };
            a.h[115] = function () {
                var a = e.ca();
                return "boolean" === typeof a ? 0 + a : "";
            };
            a.h[116] = function () {
                return e.da();
            };
            a.h[118] = function () {
                return l.tb() || "";
            };
            f.M.ya([
                function () {
                    return h.$a();
                },
            ]);
            f.aa.push(c.u, e.u, h.Ta, d.Qa, d.Sa);
            f.ga.push(function () {
                n = v = "";
                var a = f.i,
                    c = a[3];
                if (c) {
                    a = a[4];
                    a: {
                        for (
                            var b = c + "=",
                                d = document.cookie.split(/; */g),
                                e = 0;
                            e < d.length;
                            e++
                        ) {
                            var h = d[e];
                            if (0 === h.indexOf(b)) {
                                v = h.substring(b.length, h.length);
                                break a;
                            }
                        }
                        v = "";
                    }
                    v
                        ? (n = "0")
                        : ((b = new Date().getTime()),
                          (v = g(b)),
                          (document.cookie =
                              c +
                              "=" +
                              v +
                              "; expires=" +
                              new Date(b + 63072e6).toUTCString() +
                              (a ? "; domain=." + a : "") +
                              "; path=/"),
                          (n = "1"));
                }
            });
            return function (a) {
                k(a);
            };
        })(
            t,
            I,
            J,
            u,
            K,
            G,
            L,
            B,
            z,
            (function (b, g) {
                function e(a, c, b) {
                    function e(a) {
                        l.reject(a);
                    }
                    function f(a) {
                        l.T(a);
                    }
                    var l = new g();
                    try {
                        try {
                            a[c].apply(a, b).then(f, e);
                        } catch (n) {
                            a[c].apply(a, b.concat([f, e]));
                        }
                    } catch (n) {
                        e(n);
                    }
                    return l;
                }
                var f =
                        window.mozRTCPeerConnection ||
                        window.webkitRTCPeerConnection ||
                        window.RTCPeerConnection,
                    c = [];
                return {
                    Ta: function () {
                        var a = null,
                            d = null;
                        return {
                            start: function (b) {
                                try {
                                    (c = []),
                                        (a = new f({ iceServers: [] })),
                                        (a.onicecandidate = function (a) {
                                            if (!b.g()) {
                                                var d;
                                                a: {
                                                    try {
                                                        var e = a.candidate;
                                                        if (e) {
                                                            var f = e.candidate;
                                                            if (f) {
                                                                c.push(f);
                                                                d = !0;
                                                                break a;
                                                            }
                                                        }
                                                    } catch (g) {}
                                                    d = !1;
                                                }
                                                d || b.b();
                                            }
                                        }),
                                        (d = a.createDataChannel("")),
                                        e(a, "createOffer", [])
                                            .then(function (c) {
                                                if (!b.g())
                                                    return e(
                                                        a,
                                                        "setLocalDescription",
                                                        [c]
                                                    );
                                            })
                                            .then(null, function () {
                                                b.g() || b.b();
                                            });
                                } catch (g) {
                                    b.b();
                                }
                            },
                            finish: function () {
                                a &&
                                    ((a.onicecandidate = null),
                                    d && (d.close(), (d = null)),
                                    a.close(),
                                    (a = null));
                            },
                            B: b.l,
                        };
                    },
                    $a: function () {
                        for (var a = "", b = "", e = 0; e < c.length; e++) {
                            var f = c[e].replace(/^[^:]*:/, "").split(" ");
                            8 <= f.length &&
                                ((a += b + f[4] + " " + f[7]), (b = ","));
                        }
                        return a;
                    },
                };
            })(u, E),
            (function () {
                var b = [
                        "webgl",
                        "experimental-webgl",
                        "moz-webgl",
                        "webkit-3d",
                    ],
                    g = /android|\badr\b|silk|kindle/i;
                return {
                    tb: function () {
                        if (
                            window.WebGLRenderingContext &&
                            !g.test(navigator.userAgent)
                        ) {
                            for (
                                var e = document.createElement("canvas"),
                                    f = null,
                                    c = 0;
                                c < b.length && !f;
                                c++
                            )
                                f = e.getContext(b[c]);
                            if (
                                null !== f &&
                                f.getExtension("WEBGL_debug_renderer_info")
                            )
                                return f.getParameter(37446);
                        }
                        return null;
                    },
                    Kb: function () {
                        if (!window.WebGLRenderingContext) throw Error();
                        var e = {
                            o: null,
                            Pa: null,
                            Sb: function (b) {
                                return this.o.getParameter(b);
                            },
                            Qb: function (b) {
                                return this.o.getContextAttributes()[b];
                            },
                            Tb: function (b, c) {
                                return this.o.getShaderPrecisionFormat(b, c);
                            },
                            Rb: function () {
                                return this.o.getSupportedExtensions();
                            },
                            zb: function () {
                                if (!this.o) {
                                    for (
                                        var e =
                                                document.createElement(
                                                    "canvas"
                                                ),
                                            c = 0;
                                        c < b.length;
                                        c++
                                    ) {
                                        var a = b[c];
                                        if ((this.o = e.getContext(a))) {
                                            this.Pa = a;
                                            return;
                                        }
                                    }
                                    throw Error();
                                }
                            },
                        };
                        e.zb();
                        return e;
                    },
                };
            })()
        )
    );
})();
