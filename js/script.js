(function(){
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header scroll state */
  var header = document.getElementById("header");
  function onScroll(){ header.classList.toggle("scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();

  /* Mobile menu */
  var burger = document.getElementById("burger");
  var mMenu = document.getElementById("mMenu");
  function closeMenu(){
    mMenu.classList.remove("open");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded","false");
    document.body.classList.remove("menu-open");
  }
  burger.addEventListener("click", function(){
    var open = mMenu.classList.toggle("open");
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("menu-open", open);
  });
  mMenu.addEventListener("click", function(e){
    if (e.target.tagName === "A") closeMenu();
  });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && mMenu.classList.contains("open")) closeMenu();
  });

  /* Scroll reveal */
  var items = document.querySelectorAll(".rv");
  if (reduce || !("IntersectionObserver" in window)){
    items.forEach ? items.forEach(function(el){ el.classList.add("on"); }) : null;
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting){ en.target.classList.add("on"); io.unobserve(en.target); }
      });
    }, {threshold:.15, rootMargin:"0px 0px -40px 0px"});
    items.forEach(function(el){ io.observe(el); });
  }

  /* Animated counters */
  function animateCount(el){
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduce || target === 0){ el.textContent = String(target); return; }
    var dur = 1600, t0 = null;
    function tick(t){
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window){
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting){ animateCount(en.target); cio.unobserve(en.target); }
      });
    }, {threshold:.6});
    counters.forEach(function(el){ cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* Многослойный параллакс героя: мышь + скролл.
     Каждый слой сцены объявлен в SVG через data-depth (0 — бесконечно далеко). */
  var hero = document.getElementById("hero");
  var heroArt = document.querySelector(".hero-art svg");
  var layers = heroArt ? Array.prototype.slice.call(heroArt.querySelectorAll("[data-depth]")) : [];
  if (!reduce && layers.length){
    var px = 0, py = 0, sy = 0, ticking = false;

    function applyLayers(){
      ticking = false;
      /* скролл-сдвиг ограничен, чтобы слои не оголяли края сцены */
      var scrollK = Math.max(-1, Math.min(1, sy / 520));
      for (var i = 0; i < layers.length; i++){
        var depth = parseFloat(layers[i].getAttribute("data-depth")) || 0;
        var k = depth / 26;                       /* 0..1 — ближе = больше сдвиг */
        var tx = -px * 34 * k;
        var ty = -py * 15 * k - scrollK * 10 * k;
        layers[i].style.transform = "translate3d(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px,0)";
      }
    }
    function requestApply(){
      if (!ticking){ ticking = true; requestAnimationFrame(applyLayers); }
    }

    hero.addEventListener("mousemove", function(e){
      var r = hero.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - .5;   /* -0.5..0.5 */
      py = (e.clientY - r.top) / r.height - .5;
      requestApply();
    });
    hero.addEventListener("mouseleave", function(){
      px = 0; py = 0; requestApply();
    });
    window.addEventListener("scroll", function(){
      sy = window.scrollY;
      if (sy < window.innerHeight * 1.2) requestApply();
    }, {passive:true});
  }

  /* Card glow follows cursor */
  document.querySelectorAll(".card").forEach(function(card){
    card.addEventListener("mousemove", function(e){
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
    });
  });

  /* Calculator */
  var rArea = document.getElementById("rArea");
  var rFloors = document.getElementById("rFloors");
  var vArea = document.getElementById("vArea");
  var vFloors = document.getElementById("vFloors");
  var calcSum = document.getElementById("calcSum");
  var rate = 78000, mult = 1;

  function fillRange(input){
    var min = +input.min, max = +input.max, val = +input.value;
    input.style.setProperty("--fill", ((val - min) / (max - min) * 100) + "%");
  }
  function floorWord(n){
    if (n === 1) return "1 этаж";
    return n + " этажа";
  }
  function fmt(n){
    return n.toLocaleString("ru-RU") + " ₽";
  }
  function recalc(){
    fillRange(rArea); fillRange(rFloors);
    vArea.textContent = rArea.value + " м²";
    vFloors.textContent = floorWord(+rFloors.value);
    /* этажность немного снижает удельную цену за счёт кровли/фундамента */
    var floorFactor = 1 - (+rFloors.value - 1) * 0.05;
    var total = Math.round(+rArea.value * rate * mult * floorFactor);
    calcSum.textContent = fmt(total);
  }
  document.querySelectorAll("#segTech button").forEach(function(b){
    b.addEventListener("click", function(){
      document.querySelectorAll("#segTech button").forEach(function(x){ x.classList.remove("active"); });
      b.classList.add("active");
      rate = +b.getAttribute("data-rate");
      recalc();
    });
  });
  document.querySelectorAll("#segPack button").forEach(function(b){
    b.addEventListener("click", function(){
      document.querySelectorAll("#segPack button").forEach(function(x){ x.classList.remove("active"); });
      b.classList.add("active");
      mult = +b.getAttribute("data-mult");
      recalc();
    });
  });
  rArea.addEventListener("input", recalc);
  rFloors.addEventListener("input", recalc);
  recalc();

  /* Toast */
  var toast = document.getElementById("toast");
  var toastText = document.getElementById("toastText");
  var toastTimer = null;
  function showToast(msg){
    toastText.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove("show"); }, 3600);
  }

  /* Lead form */
  var form = document.getElementById("leadForm");
  var formOk = document.getElementById("formOk");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var name = document.getElementById("fName").value.trim();
    var phone = document.getElementById("fPhone").value.trim();
    if (name.length < 2){ showToast("Введите имя, пожалуйста"); document.getElementById("fName").focus(); return; }
    if (phone.replace(/\D/g,"").length < 10){ showToast("Введите телефон полностью"); document.getElementById("fPhone").focus(); return; }
    formOk.classList.add("show");
    showToast("Заявка принята, " + name + "! Перезвоним в течение часа.");
    form.reset();
  });

  /* Smooth anchor offset for fixed header */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener("click", function(e){
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({top:y, behavior: reduce ? "auto" : "smooth"});
    });
  });
})();
