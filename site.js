/* BRYNA INTERACTIVE — comportamento del sito.
   Lingua, menu, comparse, animazione del marchio, brina generativa (DLA su reticolo a 60°). */
(function () {
  'use strict';

  var doc = document.documentElement;
  var riduci = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- lingua */
  var TESTI = {
    it: {
      lingua: 'EN/IT: passa all’inglese', menuApri: 'Apri il menu', menuChiudi: 'Chiudi il menu',
      copiato: 'Indirizzo copiato', nonCopiato: 'Copia non riuscita: usa il link qui sopra',
      lab: 'Brina interattiva: muovi il puntatore o tocca lo schermo per farla crescere'
    },
    en: {
      lingua: 'EN/IT: switch to Italian', menuApri: 'Open menu', menuChiudi: 'Close menu',
      copiato: 'Address copied', nonCopiato: 'Copy failed: use the link above',
      lab: 'Interactive frost: move the pointer or touch the screen to make it grow'
    }
  };
  var lingua = doc.getAttribute('data-lang') === 'it' ? 'it' : 'en';
  var btnLingua = $('#lingua');
  var btnMenu = $('.menu-btn');

  function applicaLingua(l) {
    lingua = l;
    doc.lang = l;
    doc.setAttribute('data-lang', l);
    if (!btnLingua) return;
    var t = TESTI[l];
    var suff = l === 'it' ? 'It' : 'En';
    if (doc.dataset['titolo' + suff]) document.title = doc.dataset['titolo' + suff];
    var meta = $('meta[name="description"]');
    if (meta && doc.dataset['desc' + suff]) meta.setAttribute('content', doc.dataset['desc' + suff]);
    btnLingua.setAttribute('aria-label', t.lingua);
    $$('[data-l]', btnLingua).forEach(function (s) {
      s.style.color = s.getAttribute('data-l') === l ? 'var(--brina)' : '';
    });
    if (btnMenu) btnMenu.setAttribute('aria-label', doc.classList.contains('menu-open') ? t.menuChiudi : t.menuApri);
    var lab = $('#brina-lab');
    if (lab) lab.setAttribute('aria-label', t.lab);
    $$('[data-parole]').forEach(preparaParole);
    aggiornaParole();
  }
  if (btnLingua) {
    btnLingua.addEventListener('click', function () {
      var nuova = lingua === 'it' ? 'en' : 'it';
      try { localStorage.setItem('bryna-lingua', nuova); } catch (e) {}
      applicaLingua(nuova);
    });
  }

  /* ---------------------------------------------------------------- testata e menu */
  var testata = $('#testata');
  function chiudiMenu() {
    doc.classList.remove('menu-open');
    if (btnMenu) { btnMenu.setAttribute('aria-expanded', 'false'); btnMenu.setAttribute('aria-label', TESTI[lingua].menuApri); }
  }
  if (btnMenu) {
    btnMenu.addEventListener('click', function () {
      var aperto = doc.classList.toggle('menu-open');
      btnMenu.setAttribute('aria-expanded', aperto ? 'true' : 'false');
      btnMenu.setAttribute('aria-label', aperto ? TESTI[lingua].menuChiudi : TESTI[lingua].menuApri);
    });
    $$('#menu a').forEach(function (a) { a.addEventListener('click', chiudiMenu); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && doc.classList.contains('menu-open')) { chiudiMenu(); btnMenu.focus(); }
    });
  }

  /* ---------------------------------------------------------------- comparse */
  if ('IntersectionObserver' in window) {
    /* Gli elementi [data-taglio] partono con un clip-path di area nulla, che per il browser
       non interseca mai: si osserva il loro contenitore e si accende l'elemento. */
    var bersagli = new Map();
    var oss = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (!v.isIntersecting) return;
        (bersagli.get(v.target) || [v.target]).forEach(function (el) { el.classList.add('dentro'); });
        oss.unobserve(v.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    $$('[data-rivela], [data-osserva]').forEach(function (el) { oss.observe(el); });
    $$('[data-taglio]').forEach(function (el) {
      var p = el.parentElement, l = bersagli.get(p);
      if (l) { l.push(el); return; }
      bersagli.set(p, p.matches('[data-rivela], [data-osserva]') ? [p, el] : [el]); oss.observe(p);
    });
  } else {
    $$('[data-rivela], [data-taglio], [data-osserva]').forEach(function (el) { el.classList.add('dentro'); });
  }

  /* ---------------------------------------------------------------- manifesto parola per parola */
  function preparaParole(contenitore) {
    $$('.t-' + lingua, contenitore).forEach(function (blocco) {
      if (blocco.getAttribute('data-pronto')) return;
      blocco.setAttribute('data-pronto', '1');
      var cammina = function (nodo) {
        Array.prototype.slice.call(nodo.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (pezzo) {
              if (!pezzo) return;
              if (/^\s+$/.test(pezzo)) { frag.appendChild(document.createTextNode(pezzo)); return; }
              var s = document.createElement('span');
              s.className = 'parola';
              s.textContent = pezzo;
              frag.appendChild(s);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) {
            cammina(n);
          }
        });
      };
      cammina(blocco);
    });
  }
  function aggiornaParole() {
    $$('[data-parole]').forEach(function (c) {
      var parole = $$('.t-' + lingua + ' .parola', c);
      if (!parole.length) return;
      if (riduci) { parole.forEach(function (p) { p.classList.add('accesa'); }); return; }
      var r = c.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.86 - r.top) / (r.height + vh * 0.3);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * parole.length);
      parole.forEach(function (w, i) { w.classList.toggle('accesa', i < n); });
    });
  }
  $$('[data-parole]').forEach(preparaParole);

  /* ---------------------------------------------------------------- scorrimento: testata, parole, parallasse */
  var heroCanvas = $('#brina-hero');
  var inAttesa = false;
  function suScorrimento() {
    inAttesa = false;
    var y = window.scrollY || window.pageYOffset;
    if (testata) testata.classList.toggle('scrolled', y > 24);
    aggiornaParole();
    if (filo) {
      var f = fronteFilo();
      if (f > filo.F + 2) { filo.F = f; filo.ciclo(); }
      toccaNodi();
    }
    if (heroCanvas && !riduci && y < window.innerHeight * 1.2) {
      heroCanvas.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)';
    }
  }
  window.addEventListener('scroll', function () {
    if (!inAttesa) { inAttesa = true; window.requestAnimationFrame(suScorrimento); }
  }, { passive: true });

  /* ---------------------------------------------------------------- percorso del metodo a 60° */
  var percorso = $('.percorso');
  function disegnaPercorso() {
    if (!percorso) return;
    var svg = $('.zigzag', percorso), linea = $('polyline', percorso);
    if (!svg || getComputedStyle(svg).display === 'none') return;
    var base = percorso.getBoundingClientRect();
    var punti = $$('.nodo', percorso).map(function (n) {
      var r = n.getBoundingClientRect();
      return [r.left - base.left + r.width / 2, r.top - base.top + r.height / 2];
    });
    if (punti.length < 2) return;
    var tan60 = Math.tan(Math.PI / 3);
    var out = [punti[0]];
    for (var i = 1; i < punti.length; i++) {
      var a = punti[i - 1], b = punti[i];
      var dx = Math.abs(b[1] - a[1]) / tan60;
      out.push([Math.max(a[0], b[0] - dx), a[1]]);
      out.push(b);
    }
    svg.setAttribute('viewBox', '0 0 ' + base.width.toFixed(1) + ' ' + base.height.toFixed(1));
    linea.setAttribute('points', out.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '));
  }

  /* ---------------------------------------------------------------- copia indirizzo */
  var copia = $('#copia'), esito = $('#esito');
  if (copia && esito) {
    copia.addEventListener('click', function () {
      var indirizzo = 'brynainteractive.support@gmail.com';
      var ok = function () { esito.textContent = TESTI[lingua].copiato; };
      var ko = function () { esito.textContent = TESTI[lingua].nonCopiato; };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(indirizzo).then(ok, ko);
      else ko();
    });
  }

  /* ---------------------------------------------------------------- brina generativa
     Aggregazione limitata dalla diffusione su reticolo triangolare: il "vapore" cammina
     a caso e si deposita accanto ai cristalli già fermi. Ogni ramo forma angoli di 60°. */
  var VICINI = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
  var GIU = [[0, -1], [1, -1]];
  var SQ3 = Math.sqrt(3) / 2;
  var istanze = [];

  function Brina(canvas, opz) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.o = opz;
    this.visibile = false;
    this.fermo = false;
    this.puntatore = null;
    this.avvia();
    var self = this;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (v) {
        self.visibile = v[0].isIntersecting;
        if (self.visibile) self.ciclo();
      }, { rootMargin: '120px' }).observe(canvas);
    } else { this.visibile = true; this.ciclo(); }
  }

  Brina.prototype.avvia = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.c.clientWidth, h = this.c.clientHeight;
    this.w = w; this.h = h;
    this.c.width = Math.max(1, Math.round(w * dpr));
    this.c.height = Math.max(1, Math.round(h * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.lineCap = 'round';
    var g = this.o.geometria(w, h);
    this.mappa = g.mappa;
    this.sp = g.passo;
    this.L = g.lunghezza;
    this.maxR = g.altezza;
    this.max = Math.round(g.cristalli);
    this.colonne = Math.ceil(this.L / this.sp) + 2;
    this.griglia = new Set();
    this.genitore = new Map();
    this.n = 0;
    this.cima = 0;
    this.F = this.o.fronte ? (riduci ? this.L : Math.max(this.F || 0, this.o.fronte())) : this.L;
    for (var q = -2; q < this.colonne + 2; q++) this.griglia.add(this.chiave(q, 0));
    this.nuovoCamminatore();
    this.fermo = false;
    this.aggiorna();
    if (riduci) { this.completa(); }
  };
  Brina.prototype.chiave = function (q, r) { return (q + 8192) * 16384 + r; };
  Brina.prototype.occupato = function (q, r) { return this.griglia.has(this.chiave(q, r)); };
  Brina.prototype.nuovoCamminatore = function () {
    var p = this.puntatore, r, x;
    if (p && Math.random() < 0.7) {
      r = Math.max(1, Math.min(this.maxR, Math.round(p.r + (Math.random() * 6 - 3))));
      x = p.x + (Math.random() * 60 - 30);
    } else if (this.o.fronte) {
      r = Math.min(this.maxR, this.cima + 3);
      x = Math.random() < 0.75 ? this.F - Math.random() * 280 : Math.random() * this.F;
      if (x < 0) x = Math.random() * Math.max(1, this.F);
    } else {
      r = Math.min(this.maxR, this.cima + 4);
      x = Math.random() * this.L;
    }
    this.wq = Math.round(x / this.sp - r / 2);
    this.wr = r;
    this.passi = 0;
  };
  Brina.prototype.disegna = function (a, b) {
    var pa = this.mappa(this.sp * (a[0] + a[1] / 2), this.sp * a[1] * SQ3);
    var pb = this.mappa(this.sp * (b[0] + b[1] / 2), this.sp * b[1] * SQ3);
    var t = b[1] / this.maxR;
    var ctx = this.ctx, col = this.o.colore, alfa = this.o.alfa;
    if (typeof col === 'function') { var cc = col(pb[0], pb[1]); col = cc[0]; alfa = cc[1]; }
    ctx.globalAlpha = Math.max(0.18, alfa * (1 - 0.6 * t));
    ctx.lineWidth = b[1] < 5 ? 1.35 : (t < 0.4 ? 1.05 : 0.8);
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(pa[0], pa[1]);
    ctx.lineTo(pb[0], pb[1]);
    ctx.stroke();
  };
  Brina.prototype.passo = function () {
    var q = this.wq, r = this.wr;
    for (var i = 0; i < 6; i++) {
      var nq = q + VICINI[i][0], nr = r + VICINI[i][1];
      if (this.occupato(nq, nr)) {
        if (Math.random() < this.o.adesione) {
          this.griglia.add(this.chiave(q, r));
          this.disegna([nq, nr], [q, r]);
          this.n++;
          if (r > this.cima) this.cima = r;
          this.nuovoCamminatore();
          return true;
        }
        break;
      }
    }
    var d = Math.random() < this.o.deriva ? GIU[(Math.random() * 2) | 0] : VICINI[(Math.random() * 6) | 0];
    var tq = q + d[0], tr = r + d[1];
    this.passi++;
    if (!this.occupato(tq, tr)) { this.wq = tq; this.wr = tr; }
    var x = this.sp * (this.wq + this.wr / 2);
    var tetto = Math.min(this.maxR, Math.max(this.cima, this.puntatore ? this.puntatore.r : 0) + 14);
    if (this.wr < 0 || this.wr > tetto || x < -this.sp * 4 || x > this.F + this.sp * 4 || this.passi > 3000) {
      this.nuovoCamminatore();
    }
    return false;
  };
  Brina.prototype.aggiorna = function () {};
  Brina.prototype.riempi = function (ms) {
    var t0 = performance.now();
    while (this.n < this.quota() && performance.now() - t0 < ms) { for (var k = 0; k < 300; k++) if (this.passo()) break; }
  };
  Brina.prototype.quota = function () {
    return this.o.fronte ? Math.round(this.max * Math.min(1, this.F / this.L)) : this.max;
  };
  Brina.prototype.completa = function () {
    var limite = 4000000;
    while (this.n < this.quota() && limite-- > 0) this.passo();
    this.fermo = true;
    this.aggiorna();
  };
  Brina.prototype.ciclo = function () {
    if (this.inCorso || riduci) return;
    var self = this;
    this.inCorso = true;
    var fotogramma = function () {
      if (!self.visibile || document.hidden || (self.n >= self.quota() && !self.puntatore)) { self.inCorso = false; self.aggiorna(); return; }
      var t0 = performance.now(), nuovi = 0;
      while (performance.now() - t0 < 5 && nuovi < self.o.ritmo) {
        for (var k = 0; k < 400; k++) { if (self.passo()) { nuovi++; break; } }
      }
      if (self.n >= self.max && self.puntatore && self.n < self.o.tetto) self.max += 1;
      self.aggiorna();
      window.requestAnimationFrame(fotogramma);
    };
    window.requestAnimationFrame(fotogramma);
  };
  Brina.prototype.verso = function (cx, cy) {
    var g = this.o.inversa;
    if (!g) return;
    var p = g(cx, cy, this.w, this.h);
    var r = p[1] / (this.sp * SQ3);
    if (r < 1 || r > this.maxR) { this.puntatore = null; return; }
    this.puntatore = { x: p[0], r: r };
    this.ciclo();
  };
  Brina.prototype.seme = function (cx, cy) {
    var g = this.o.inversa;
    if (!g) return;
    var p = g(cx, cy, this.w, this.h);
    var r = Math.round(p[1] / (this.sp * SQ3));
    if (r < 1 || r > this.maxR) return;
    var q = Math.round(p[0] / this.sp - r / 2);
    if (this.occupato(q, r)) return;
    this.griglia.add(this.chiave(q, r));
    var c = this.mappa(this.sp * (q + r / 2), this.sp * r * SQ3);
    this.ctx.globalAlpha = 0.9;
    this.ctx.fillStyle = this.o.colore;
    this.ctx.beginPath();
    this.ctx.arc(c[0], c[1], 1.6, 0, Math.PI * 2);
    this.ctx.fill();
    if (r > this.cima) this.cima = r;
  };

  function crea(sel, opz) {
    $$(sel).forEach(function (c) { istanze.push(new Brina(c, opz)); });
  }
  var piccolo = function () { return window.innerWidth < 700; };

  // hero: brina su un margine curvo invisibile
  crea('#brina-hero', {
    colore: '#CDDCE2', alfa: 0.9, adesione: 0.62, deriva: 0.2, ritmo: 26,
    geometria: function (w, h) {
      var largo = w > h * 0.95;
      // schermi larghi: arco diagonale da destra; schermi verticali: arco basso che sale verso destra
      var R = largo ? h * 1.2 : w * 1.9;
      var cx = largo ? w * 0.99 : w * 0.85, cy = largo ? h * 1.55 : h + R - 90;
      var a0 = (largo ? 176 : 122) * Math.PI / 180, a1 = (largo ? 84 : 78) * Math.PI / 180;
      return {
        passo: piccolo() ? 4.6 : 6,
        lunghezza: R * (a0 - a1),
        altezza: piccolo() ? 34 : 46,
        cristalli: piccolo() ? 1500 : 3400,
        mappa: function (x, y) { var a = a0 - x / R, rho = R + y; return [cx + rho * Math.cos(a), cy - rho * Math.sin(a)]; }
      };
    }
  });
  // margini: dai bordi sinistro e destro verso il centro
  var margine = function (destra) {
    return {
      colore: '#0A121B', alfa: 0.55, adesione: 0.66, deriva: 0.22, ritmo: 26,
      geometria: function (w, h) {
        var passo = piccolo() ? 4.4 : 5.4, righe = Math.max(4, Math.floor(w / (passo * SQ3)) - 1);
        return { passo: passo, lunghezza: h, altezza: righe, cristalli: h / passo * righe * 0.24,
          mappa: function (x, y) { return [destra ? w - y : y, x]; } };
      }
    };
  };
  crea('.brina-margine.sx', margine(false));
  crea('.brina-margine.dx', margine(true));
  // sezioni chiare: la brina scende dal bordo superiore
  crea('.brina-bordo', {
    colore: '#0A121B', alfa: 0.55, adesione: 0.7, deriva: 0.22, ritmo: 30,
    geometria: function (w, h) {
      return { passo: 4.2, lunghezza: w, altezza: Math.floor(h / (4.2 * SQ3)) - 2, cristalli: w * (piccolo() ? 0.9 : 1.3),
        mappa: function (x, y) { return [x, y]; } };
    }
  });
  // laboratorio: cresce dal bordo inferiore e insegue il puntatore
  crea('#brina-lab', {
    colore: '#CDDCE2', alfa: 0.95, adesione: 0.66, deriva: 0.2, ritmo: 40, tetto: 7000,
    geometria: function (w, h) {
      return { passo: piccolo() ? 5 : 6, lunghezza: w, altezza: Math.floor(h * 0.78 / ((piccolo() ? 5 : 6) * SQ3)), cristalli: piccolo() ? 900 : 1800,
        mappa: function (x, y) { return [x, h - y]; } };
    },
    inversa: function (x, y, w, h) { return [x, h - y]; }
  });
  // 404
  crea('#brina-404', {
    colore: '#CDDCE2', alfa: 0.85, adesione: 0.62, deriva: 0.2, ritmo: 30,
    geometria: function (w, h) {
      return { passo: 6, lunghezza: w, altezza: Math.floor(h * 0.45 / (6 * SQ3)), cristalli: piccolo() ? 900 : 2200,
        mappa: function (x, y) { return [x, h - y]; } };
    }
  });


  var lab = $('#brina-lab');
  if (lab && !riduci) {
    var istLab = istanze.filter(function (b) { return b.c === lab; })[0];
    var muovi = function (e) {
      var r = lab.getBoundingClientRect();
      istLab.verso(e.clientX - r.left, e.clientY - r.top);
    };
    lab.addEventListener('pointermove', muovi);
    lab.addEventListener('pointerdown', function (e) {
      var r = lab.getBoundingClientRect();
      istLab.seme(e.clientX - r.left, e.clientY - r.top);
      muovi(e);
    });
    lab.addEventListener('pointerleave', function () { istLab.puntatore = null; });
    var ric = $('#ricomincia');
    if (ric) ric.addEventListener('click', function () { istLab.puntatore = null; istLab.avvia(); istLab.ciclo(); });
  } else if ($('#ricomincia')) {
    $('#ricomincia').addEventListener('click', function () {
      istanze.forEach(function (b) { if (b.c === lab) b.avvia(); });
    });
  }

  var larghezza = window.innerWidth, altezza = window.innerHeight, timer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      disegnaPercorso();
      var cambiata = Math.abs(window.innerWidth - larghezza) > 40 || Math.abs(window.innerHeight - altezza) > window.innerHeight * 0.25;
      if (!cambiata) return;
      larghezza = window.innerWidth; altezza = window.innerHeight;
      if (filo) misuraFilo();
      istanze.forEach(function (b) { b.avvia(); b.ciclo(); });
      if (filo) filo.riempi(40);
    }, 220);
  });


  /* ---------------------------------------------------------------- filo di brina: segue tutto il flusso */
  var filoCanvas = $('#brina-filo'), filo = null, filoDati = null;
  function misuraFilo() {
    if (!filoCanvas) return false;
    var sy = window.scrollY || window.pageYOffset, sx = window.scrollX || window.pageXOffset;
    var kick = $$('main .kicker').filter(function (k) { return !k.closest('.hero'); });
    var piede = $('.piede'), hero = $('.hero'), main = $('main');
    if (!kick.length || !piede) return false;
    var stretto = window.innerWidth < 700;
    var E = kick[0].getBoundingClientRect().left + sx;
    var bx = E - (stretto ? 8 : 30);
    var cima = hero ? hero.getBoundingClientRect().bottom + sy - 2 : main.getBoundingClientRect().top + sy + 72;
    var fondo = piede.getBoundingClientRect().top + sy + 30;
    var sin = Math.max(0, Math.floor(bx - (stretto ? 14 : 70)));
    var des = Math.ceil(E + 4);
    filoCanvas.style.left = sin + 'px';
    filoCanvas.style.top = cima + 'px';
    filoCanvas.style.width = (des - sin) + 'px';
    filoCanvas.style.height = Math.max(10, fondo - cima) + 'px';
    var X = bx - sin, pts = [[X, 0]], nodi = [];
    kick.forEach(function (k) {
      var r = k.getBoundingClientRect(), vy = r.top + sy + r.height / 2 - cima;
      if (!stretto) {
        // una deviazione a 60° verso il segno del titoletto, poi di nuovo nel margine
        var vx = r.left + sx - 6 - sin, dy = (vx - X) * Math.tan(Math.PI / 3);
        if (vy - dy > pts[pts.length - 1][1] + 4) pts.push([X, vy - dy], [vx, vy], [X, vy + dy]);
      }
      nodi.push({ el: k, y: vy });
    });
    pts.push([X, fondo - cima]);
    var S = [0];
    for (var i = 1; i < pts.length; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var fasce = $$('main > section, .piede').map(function (el) {
      var r = el.getBoundingClientRect();
      return [r.top + sy - cima, r.bottom + sy - cima, el.classList.contains('chiara')];
    });
    filoDati = { pts: pts, S: S, L: S[S.length - 1], fasce: fasce, nodi: nodi, cima: cima, stretto: stretto };
    return true;
  }
  function puntoFilo(s, off) {
    var d = filoDati, P = d.pts, S = d.S, i = 1;
    if (s >= d.L) i = P.length - 1; else if (s > 0) { while (i < P.length - 1 && S[i] < s) i++; }
    var a = P[i - 1], b = P[i], l = (S[i] - S[i - 1]) || 1;
    var ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l, t = s - S[i - 1];
    return [a[0] + ux * t - uy * off, a[1] + uy * t + ux * off];
  }
  function fronteY() { return (window.scrollY || window.pageYOffset) + window.innerHeight * 0.86 - filoDati.cima; }
  function fronteFilo() {
    if (!filoDati) return 0;
    var y = fronteY(), P = filoDati.pts, S = filoDati.S;
    if (y <= P[0][1]) return 0;
    for (var i = 1; i < P.length; i++) {
      if (P[i][1] >= y) { var a = P[i - 1], f = (y - a[1]) / ((P[i][1] - a[1]) || 1); return S[i - 1] + f * (S[i] - S[i - 1]); }
    }
    return filoDati.L;
  }
  function coloreFilo(x, y) {
    var f = filoDati.fasce;
    for (var i = 0; i < f.length; i++) if (y >= f[i][0] && y < f[i][1]) return f[i][2] ? ['#0A121B', 0.5] : ['#CDDCE2', 0.85];
    return ['#CDDCE2', 0.85];
  }
  function toccaNodi() {
    if (!filoDati) return;
    var y = riduci ? Infinity : fronteY();
    filoDati.nodi.forEach(function (n) { if (!n.fatto && n.y <= y) { n.fatto = true; n.el.classList.add('toccato'); } });
  }
  function creaFilo() {
    if (filo || !filoCanvas || !misuraFilo()) return;
    filo = new Brina(filoCanvas, {
      colore: coloreFilo, alfa: 0.85, adesione: 0.64, deriva: 0.24, ritmo: 30, fronte: fronteFilo,
      geometria: function () {
        var st = filoDati.stretto, passo = st ? 4.2 : 5, righe = st ? 3 : 8;
        return { passo: passo, lunghezza: filoDati.L, altezza: righe, cristalli: filoDati.L / passo * righe * 0.3,
          mappa: function (x, y) { return puntoFilo(x, y); } };
      }
    });
    istanze.push(filo);
    filo.riempi(40);
    toccaNodi();
  }

  /* ---------------------------------------------------------------- avvio */
  applicaLingua(lingua);
  suScorrimento();
  var parti = function () {
    disegnaPercorso();
    creaFilo();
    doc.classList.add(riduci ? 'fermo' : 'avviato');
  };
  if (document.fonts && document.fonts.ready) {
    var fatto = false;
    var una = function () { if (!fatto) { fatto = true; parti(); } };
    document.fonts.ready.then(una);
    setTimeout(una, 900);
  } else { parti(); }
})();
