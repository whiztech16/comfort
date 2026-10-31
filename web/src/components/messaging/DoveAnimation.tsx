import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

type Point = { x: number; y: number };

type DoveAnimationProps = {
  /** Where the dove takes off, in viewport pixels. Defaults to lower left. */
  from?: Point;
  /** Where the dove flies to, in viewport pixels. Defaults to upper right. */
  to?: Point;
  onDone: () => void;
};

const DURATION_MS = 1800;

export default function DoveAnimation({ from, to, onDone }: DoveAnimationProps) {
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  // Fixed once, so a parent re-render can't make the dove jump mid-flight
  const [route] = useState(() => {
    const start = from ?? {
      x: window.innerWidth * 0.3,
      y: window.innerHeight * 0.65,
    };
    const end = to ?? {
      x: window.innerWidth * 0.78,
      y: window.innerHeight * 0.2,
    };
    return { start, dx: end.x - start.x, dy: end.y - start.y };
  });

  useEffect(() => {
    const skip = () => doneRef.current();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };

    const timer = window.setTimeout(skip, DURATION_MS + 100);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      <p role="status" className="sr-only">
        Your message has been sent.
      </p>

      <div
        aria-hidden
        className="dove-fly absolute -ml-16 -mt-11 w-32"
        style={
          {
            left: route.start.x,
            top: route.start.y,
            "--dx": `${route.dx}px`,
            "--dy": `${route.dy}px`,
          } as CSSProperties
        }
      >
        <svg
          viewBox="0 -26 204 142"
          className="w-full overflow-visible"
          style={{ filter: "drop-shadow(0 8px 12px rgba(38,55,70,0.22))" }}
        >
          <defs>
            <linearGradient id="dove-body-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#e3eef8" />
            </linearGradient>
            <path
              id="dove-wing-shape"
              d="M112 66 C100 40, 74 18, 40 14 C52 30, 58 46, 70 60 C80 66, 96 68, 112 66 Z"
            />
          </defs>

          <g className="dove-body">
            {/* Far wing */}
            <g transform="translate(-4 -3)">
              <g className="dove-wing-back">
                <use
                  href="#dove-wing-shape"
                  fill="#cfe1f1"
                  stroke="#8fb0cf"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </g>
            </g>

            {/* Tail */}
            <path
              d="M44 82 L6 70 C12 80 14 90 8 100 C22 98 36 94 48 90 Z"
              fill="url(#dove-body-fill)"
              stroke="#8fb0cf"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Body and head */}
            <path
              d="M34 84 C52 68, 82 62, 112 64 C126 65, 136 60, 140 52 C142 40, 156 36, 162 44 C166 50, 162 58, 154 62 C150 74, 142 84, 130 90 C112 102, 84 104, 60 98 C48 95, 40 90, 34 84 Z"
              fill="url(#dove-body-fill)"
              stroke="#8fb0cf"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Envelope */}
            <g transform="rotate(-6 185 61)">
              <rect
                x="172"
                y="50"
                width="28"
                height="19"
                rx="2.5"
                fill="#ffffff"
                stroke="#477fa8"
                strokeWidth="1.5"
              />
              <path
                d="M172.8 51.5 L186 61.5 L199.2 51.5"
                fill="none"
                stroke="#477fa8"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="186" cy="61.5" r="2.4" fill="#477fa8" />
            </g>

            {/* Beak and eye */}
            <path
              d="M161 45 L176 50 L161 53 Z"
              fill="#a9c3dc"
              stroke="#8fb0cf"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <circle cx="153" cy="47" r="1.8" fill="#263746" />

            {/* Near wing */}
            <g className="dove-wing">
              <use
                href="#dove-wing-shape"
                fill="#ffffff"
                stroke="#8fb0cf"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M98 58 C86 44, 70 32, 52 24 M90 63 C80 52, 66 42, 54 36"
                fill="none"
                stroke="#b7cfe6"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}