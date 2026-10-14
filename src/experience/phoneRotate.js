export const phoneShortSideMax = 500
export const landscapeLayoutWidth = 1280

export const phoneViewport = 'width=device-width, initial-scale=1.0, viewport-fit=cover'
export const landscapeViewport = `width=${landscapeLayoutWidth}, viewport-fit=cover`

export function phoneCssShortSide(shortSide, pixelRatio = 1) {
  const side = Number(shortSide) || 0
  const ratio = Number(pixelRatio) > 1 ? Number(pixelRatio) : 1
  if (side > 0 && side <= phoneShortSideMax) return side
  if (side >= 1000 && side / ratio <= phoneShortSideMax) return side / ratio
  return side
}

export function phoneRotateDecision({ coarse, shortSide, portrait, pixelRatio = 1 }) {
  const side = phoneCssShortSide(shortSide, pixelRatio)
  const phone = Boolean(coarse) && side > 0 && side <= phoneShortSideMax
  if (!phone) return { phone: false, needsRotate: false, viewport: null }
  if (portrait) return { phone: true, needsRotate: true, viewport: phoneViewport }
  return { phone: true, needsRotate: false, viewport: landscapeViewport }
}

export function phoneRotateClient() {
  return `(function () {
  try {
    var SHORT = ${phoneShortSideMax};
    var PHONE = ${JSON.stringify(phoneViewport)};
    var LANDSCAPE = ${JSON.stringify(landscapeViewport)};
    function cssShort(shortSide, pixelRatio) {
      var side = shortSide || 0;
      var ratio = pixelRatio > 1 ? pixelRatio : 1;
      if (side > 0 && side <= SHORT) return side;
      if (side >= 1000 && side / ratio <= SHORT) return side / ratio;
      return side;
    }
    function decision(coarse, shortSide, portrait, pixelRatio) {
      var side = cssShort(shortSide, pixelRatio);
      var phone = coarse && side > 0 && side <= SHORT;
      if (!phone) return { phone: false, needsRotate: false, viewport: null };
      if (portrait) return { phone: true, needsRotate: true, viewport: PHONE };
      return { phone: true, needsRotate: false, viewport: LANDSCAPE };
    }
    function read() {
      var coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
      var shortSide = Math.min(window.screen.width, window.screen.height);
      var portrait = window.matchMedia('(orientation: portrait)').matches;
      var pixelRatio = window.devicePixelRatio || 1;
      return decision(coarse, shortSide, portrait, pixelRatio);
    }
    function apply() {
      var meta = document.querySelector('meta[name="viewport"]');
      if (!meta) return;
      var next = read();
      if (!next.phone) {
        document.documentElement.classList.remove('needs-rotate');
        document.documentElement.classList.remove('is-landscape-phone');
        return;
      }
      if (meta.getAttribute('content') !== next.viewport) meta.setAttribute('content', next.viewport);
      document.documentElement.classList.toggle('needs-rotate', next.needsRotate);
      document.documentElement.classList.toggle('is-landscape-phone', !next.needsRotate);
    }
    if (!read().phone) return;
    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    var portraitQuery = window.matchMedia('(orientation: portrait)');
    if (portraitQuery.addEventListener) portraitQuery.addEventListener('change', apply);
  } catch (error) {}
})();`
}
