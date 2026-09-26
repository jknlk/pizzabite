(function () {
  var zone = document.querySelector(".pizza-flight-zone");
  var pizza = document.querySelector(".flying-pizza");
  var startAnchor = document.querySelector(".pizza-anchor-hero");
  var endAnchor = document.querySelector(".pizza-anchor-section2");

  // ---- Lenis smooth scroll (shared across all animations on the page) ----
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false });
  }

  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);

    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  }

  if (!hasGsap && lenis) {
    (function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    })();
  }

  function scrollTo(target, opts) {
    opts = opts || {};
    if (lenis) {
      lenis.scrollTo(target, { duration: opts.duration || 1.1 });
    } else {
      var y = typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  // ---- 1. Hero pizza flies down into the section-2 blob on scroll ----
  function rectRelativeTo(el, container) {
    var elRect = el.getBoundingClientRect();
    var containerRect = container.getBoundingClientRect();
    var scrollY = window.scrollY || window.pageYOffset;
    return {
      left: elRect.left - containerRect.left,
      top: elRect.top - containerRect.top + scrollY,
      width: elRect.width,
      height: elRect.height
    };
  }

  var scrollTween = null;

  function setupHeroFlight() {
    if (!(pizza && zone && startAnchor && endAnchor && hasGsap)) return;

    var start = rectRelativeTo(startAnchor, zone);
    var end = rectRelativeTo(endAnchor, zone);

    gsap.set(pizza, {
      left: start.left,
      top: start.top,
      width: start.width,
      height: start.height,
      rotation: 0
    });

    if (scrollTween) {
      scrollTween.scrollTrigger && scrollTween.scrollTrigger.kill();
      scrollTween.kill();
    }

    gsap.set(pizza, { autoAlpha: 1 });

    scrollTween = gsap.to(pizza, {
      left: end.left,
      top: end.top,
      width: end.width,
      height: end.height,
      rotation: 540,
      ease: "none",
      scrollTrigger: {
        trigger: zone,
        start: "top top",
        endTrigger: ".section2",
        end: "center center",
        scrub: 0.6
      }
    });
  }

  if (pizza && zone && startAnchor && endAnchor) {
    if (hasGsap) {
      window.addEventListener("load", function () {
        setupHeroFlight();
        ScrollTrigger.refresh();
      });
      var resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          setupHeroFlight();
          ScrollTrigger.refresh();
        }, 200);
      });
    } else {
      window.addEventListener("load", function () {
        var start = rectRelativeTo(startAnchor, zone);
        pizza.style.left = start.left + "px";
        pizza.style.top = start.top + "px";
        pizza.style.width = start.width + "px";
        pizza.style.height = start.height + "px";
        pizza.style.opacity = "1";
        pizza.style.visibility = "visible";
      });
    }
  }

  // ---- 2. Tap/hover a product pizza to spin it in place ----
  document.querySelectorAll(".product-img").forEach(function (el) {
    el.addEventListener("click", function () {
      el.classList.toggle("is-spinning");
    });
  });

  // ---- 3. Tap a product pizza to send it flying into the chef's hand ----
  var chefSection = document.querySelector(".chef-section");
  var handAnchor = document.querySelector(".chef-hand-anchor");
  var handPizza = document.querySelector(".hand-pizza");

  document.querySelectorAll(".product-card .product-img img").forEach(function (img) {
    img.addEventListener("click", function () {
      sendPizzaToChef(img);
    });
  });

  function sendPizzaToChef(sourceImg) {
    if (!chefSection || !handAnchor || !handPizza) return;

    var startRect = sourceImg.getBoundingClientRect();
    var duration = 1100;

    // Where will the hand be once we've scrolled the chef section into view?
    var navEl = document.querySelector(".nav");
    var navOffset = navEl ? navEl.getBoundingClientRect().height : 0;
    var targetScrollY = chefSection.getBoundingClientRect().top + window.scrollY - navOffset - 12;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    targetScrollY = Math.max(0, Math.min(targetScrollY, maxScroll));

    var handDocRect = handAnchor.getBoundingClientRect();
    var handDocTop = handDocRect.top + window.scrollY;
    var finalHandTop = handDocTop - targetScrollY;
    var finalHandLeft = handDocRect.left; // horizontal scroll never changes

    var clone = document.createElement("img");
    clone.src = sourceImg.src;
    clone.className = "chef-flying-pizza";
    clone.style.left = startRect.left + "px";
    clone.style.top = startRect.top + "px";
    clone.style.width = startRect.width + "px";
    clone.style.height = startRect.height + "px";
    document.body.appendChild(clone);

    scrollTo(targetScrollY, { duration: duration / 1000 });

    var durationS = duration / 1000;
    if (hasGsap) {
      gsap.to(clone, {
        left: finalHandLeft,
        top: finalHandTop,
        width: handDocRect.width,
        height: handDocRect.height,
        rotation: 500,
        duration: durationS,
        ease: "power2.inOut",
        onComplete: landPizza
      });
    } else {
      clone.style.transition = "all " + durationS + "s ease-in-out";
      requestAnimationFrame(function () {
        clone.style.left = finalHandLeft + "px";
        clone.style.top = finalHandTop + "px";
        clone.style.width = handDocRect.width + "px";
        clone.style.height = handDocRect.height + "px";
      });
      setTimeout(landPizza, duration);
    }

    function landPizza() {
      clone.remove();
      handPizza.src = sourceImg.src;
      handPizza.classList.remove("is-landed");
      // force reflow so the pop animation restarts every time
      void handPizza.offsetWidth;
      handPizza.classList.add("is-landed");
    }
  }
})();
