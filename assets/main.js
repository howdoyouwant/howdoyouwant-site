(function(){
  "use strict";

  var translations = window.HDYW_I18N || {};
  var cycleWords = window.HDYW_CYCLE || null;
  var html = document.documentElement;
  var STORAGE_LANG = "hdyw_lang";
  var STORAGE_THEME = "hdyw_theme";

  var contactMessages = window.HDYW_CONTACT || {};
  var defaultContext = (document.body && document.body.getAttribute("data-default-context")) || "general";
  var lastOpenContext = defaultContext;
  var contactBackdropEl = null;

  function safeGet(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
  function safeSet(key, val){ try{ localStorage.setItem(key, val); }catch(e){} }

  function detectLang(){
    var navLang = ((navigator.language || navigator.userLanguage || "")).toLowerCase();
    if(navLang.indexOf("ca") === 0) return "ca";
    if(navLang.indexOf("ar") === 0) return "ar";
    var tz = "";
    try{ tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; }catch(e){}
    if(tz === "Europe/Madrid" || tz === "Atlantic/Canary" || tz === "Africa/Ceuta" || navLang.indexOf("es") === 0) return "es";
    if(tz === "Europe/Stockholm" || navLang.indexOf("sv") === 0) return "sv";
    return "en";
  }

  var cycleIndex = 0;

  function applyLang(lang){
    if(!translations[lang]) lang = "en";
    var dict = translations[lang];

    document.querySelectorAll("[data-i18n]").forEach(function(el){
      var key = el.getAttribute("data-i18n");
      if(dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function(el){
      var key = el.getAttribute("data-i18n-placeholder");
      if(dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function(el){
      var key = el.getAttribute("data-i18n-aria-label");
      if(dict[key] !== undefined) el.setAttribute("aria-label", dict[key]);
    });

    html.lang = lang;
    html.dir = (lang === "ar") ? "rtl" : "ltr";
    html.setAttribute("data-lang", lang);

    var langCodeEl = document.getElementById("langCode");
    if(langCodeEl) langCodeEl.textContent = lang.toUpperCase();

    document.querySelectorAll(".lang-option").forEach(function(btn){
      btn.setAttribute("aria-current", btn.getAttribute("data-lang") === lang ? "true" : "false");
    });

    var langTrigger = document.getElementById("langTrigger");
    if(langTrigger) langTrigger.setAttribute("aria-label", dict.aria_lang || "Change language");
    var themeToggleBtn = document.getElementById("themeToggle");
    if(themeToggleBtn) themeToggleBtn.setAttribute("aria-label", dict.aria_theme || "Switch theme");

    safeSet(STORAGE_LANG, lang);

    if(typeof refreshContactLinks === "function") refreshContactLinks();

    if(cycleWords){
      cycleIndex = 0;
      var wordEl = document.getElementById("cycleWord");
      var words = cycleWords[lang] || cycleWords.en;
      if(wordEl && words) wordEl.textContent = words[0];
    }
  }

  var cycleTimer = null;
  function startCycling(){
    var wordEl = document.getElementById("cycleWord");
    if(!wordEl || !cycleWords) return;
    cycleTimer = setInterval(function(){
      var lang = html.getAttribute("data-lang");
      var words = cycleWords[lang] || cycleWords.en;
      wordEl.classList.add("fading");
      setTimeout(function(){
        cycleIndex = (cycleIndex + 1) % words.length;
        wordEl.textContent = words[cycleIndex];
        wordEl.classList.remove("fading");
      }, 250);
    }, 1800);
  }

  function applyTheme(theme){
    html.setAttribute("data-theme", theme);
    safeSet(STORAGE_THEME, theme);
    var icon = document.getElementById("themeIcon");
    if(!icon) return;
    if(theme === "light"){
      icon.innerHTML = '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>';
    } else {
      icon.innerHTML = '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>';
    }
  }

  // init language
  var savedLang = safeGet(STORAGE_LANG);
  applyLang(savedLang || detectLang());

  // init theme (dark by default)
  var savedTheme = safeGet(STORAGE_THEME);
  applyTheme(savedTheme === "dark" ? "dark" : "light");

  // language menu interactions
  var langTrigger = document.getElementById("langTrigger");
  var langMenu = document.getElementById("langMenu");
  if(langTrigger && langMenu){
    langTrigger.addEventListener("click", function(e){
      e.stopPropagation();
      var open = langMenu.classList.toggle("open");
      langTrigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".lang-option").forEach(function(btn){
      btn.addEventListener("click", function(){
        applyLang(btn.getAttribute("data-lang"));
        langMenu.classList.remove("open");
        langTrigger.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("click", function(){
      langMenu.classList.remove("open");
      langTrigger.setAttribute("aria-expanded", "false");
    });
  }

  // theme toggle
  var themeToggle = document.getElementById("themeToggle");
  if(themeToggle){
    themeToggle.addEventListener("click", function(){
      var current = html.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  // mailto widget
  var mailtoForm = document.getElementById("mailtoForm");
  if(mailtoForm){
    mailtoForm.addEventListener("submit", function(e){
      e.preventDefault();
      var input = document.getElementById("mailtoInput");
      var val = input ? input.value.trim() : "";
      var subject = encodeURIComponent("How do you want it?");
      var body = encodeURIComponent(val);
      window.location.href = "mailto:hello@howdoyouwant.com?subject=" + subject + "&body=" + body;
    });
  }

  // FAQ accordion
  document.querySelectorAll(".faq-item").forEach(function(item){
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if(!q || !a) return;
    q.addEventListener("click", function(){
      var isOpen = item.getAttribute("data-open") === "true";
      document.querySelectorAll(".faq-item").forEach(function(other){
        other.setAttribute("data-open", "false");
        var oa = other.querySelector(".faq-a");
        if(oa) oa.style.maxHeight = null;
      });
      if(!isOpen){
        item.setAttribute("data-open", "true");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });

  // Motion: respect prefers-reduced-motion
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!reduceMotion){
    html.classList.add("js-anim");
    if(cycleWords) startCycling();

    requestAnimationFrame(function(){
      setTimeout(function(){
        document.querySelectorAll(".hv-piece").forEach(function(el, i){
          setTimeout(function(){ el.classList.add("settled"); }, i * 140);
        });
      }, 120);
    });

    if(window.IntersectionObserver){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      document.querySelectorAll(".reveal").forEach(function(el){ io.observe(el); });
    }
  } else {
    document.querySelectorAll(".hv-piece").forEach(function(el){ el.classList.add("settled"); });
  }

  // ---------- Contact chooser (WhatsApp / Call / Email with contextual prefill) ----------
  function messageFor(context, lang){
    var set = contactMessages[context] || contactMessages[defaultContext] || {};
    return set[lang] || set.en || "";
  }

  function waLink(context, lang){
    return "https://wa.me/34687701709?text=" + encodeURIComponent(messageFor(context, lang));
  }
  function mailLink(context, lang, dict){
    var subject = (dict && dict.contact_email_subject) || "How do you want it?";
    return "mailto:hello@howdoyouwant.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(messageFor(context, lang));
  }

  function refreshContactLinks(){
    var lang = html.getAttribute("data-lang");
    var dict = translations[lang] || translations.en;
    document.querySelectorAll("[data-contact-prefill]").forEach(function(el){
      var context = el.getAttribute("data-contact-context") || defaultContext;
      if(el.getAttribute("href") && el.getAttribute("href").indexOf("mailto:") === 0){
        el.setAttribute("href", mailLink(context, lang, dict));
      } else {
        el.setAttribute("href", waLink(context, lang));
      }
    });
    var modalOpen = contactBackdropEl && contactBackdropEl.classList.contains("open");
    if(modalOpen) setModalLinks(lastOpenContext, lang, dict);
  }

  function setModalLinks(context, lang, dict){
    lastOpenContext = context;
    var waEl = document.getElementById("contactWhatsapp");
    var mailEl = document.getElementById("contactEmail");
    if(waEl) waEl.href = waLink(context, lang);
    if(mailEl) mailEl.href = mailLink(context, lang, dict);
  }

  contactBackdropEl = document.getElementById("contactBackdrop");
  if(contactBackdropEl){
    var contactCloseEl = document.getElementById("contactClose");
    document.querySelectorAll("[data-contact-trigger]").forEach(function(trigger){
      trigger.addEventListener("click", function(){
        var lang = html.getAttribute("data-lang");
        var dict = translations[lang] || translations.en;
        var context = trigger.getAttribute("data-contact-context") || defaultContext;
        setModalLinks(context, lang, dict);
        contactBackdropEl.classList.add("open");
      });
    });
    if(contactCloseEl){
      contactCloseEl.addEventListener("click", function(){ contactBackdropEl.classList.remove("open"); });
    }
    contactBackdropEl.addEventListener("click", function(e){
      if(e.target === contactBackdropEl) contactBackdropEl.classList.remove("open");
    });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape") contactBackdropEl.classList.remove("open");
    });
  }

  refreshContactLinks();

  // ---------- Sliding proof carousel ----------
  var proofTrack = document.getElementById('proofTrack');
  if(proofTrack && proofTrack.children.length){
    var slides = proofTrack.children;
    var slideCount = slides.length;
    var dotsContainer = document.getElementById('proofDots');
    var currentSlide = 0;
    var carouselEl = document.getElementById('proofCarousel');

    for(var s = 0; s < slideCount; s++){
      (function(idx){
        var dot = document.createElement('button');
        dot.className = 'proof-dot' + (idx === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Slide ' + (idx + 1));
        dot.addEventListener('click', function(){ goToProofSlide(idx); });
        dotsContainer.appendChild(dot);
      })(s);
    }

    function goToProofSlide(idx){
      currentSlide = idx;
      var dir = html.getAttribute('dir') === 'rtl' ? 1 : -1;
      proofTrack.style.transform = 'translateX(' + (dir * idx * 100) + '%)';
      Array.prototype.forEach.call(dotsContainer.children, function(d, i){
        d.classList.toggle('active', i === idx);
      });
    }

    var proofTimer = setInterval(function(){
      goToProofSlide((currentSlide + 1) % slideCount);
    }, 5000);

    if(carouselEl){
      carouselEl.addEventListener('mouseenter', function(){ clearInterval(proofTimer); });
      carouselEl.addEventListener('mouseleave', function(){
        proofTimer = setInterval(function(){ goToProofSlide((currentSlide + 1) % slideCount); }, 5000);
      });
    }
  }

  var waFloat = document.getElementById("waFloat");
  var heroEl = document.querySelector(".hero, .page-hero");
  if(waFloat && heroEl && window.IntersectionObserver){
    var waIo = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        waFloat.classList.toggle("show", !entry.isIntersecting);
      });
    }, { threshold: 0 });
    waIo.observe(heroEl);
  } else if(waFloat){
    waFloat.classList.add("show");
  }

})();
