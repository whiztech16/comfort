import { liquidMap } from "../lib/liquidMap";

/** Invisible SVG filter that bends whatever is behind the bottom nav (Chrome and Edge). */
export default function LiquidGlassFilter() {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      className="pointer-events-none absolute"
    >
      <defs>
        <filter
          id="comfort-liquid-nav"
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={liquidMap}
            x="0"
            y="0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            result="map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="26"
            xChannelSelector="R"
            yChannelSelector="G"
            result="bent"
          />
          <feGaussianBlur in="bent" stdDeviation="1.2" />
        </filter>
      </defs>
    </svg>
  );
}