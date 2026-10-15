import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

interface CompareSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeAlt: string;
  afterAlt: string;
  className?: string;
}

/**
 * Before/after comparison with a draggable divider. The divider is a slider
 * control: draggable with the pointer and adjustable with the arrow keys.
 */
export function CompareSlider({
  beforeUrl,
  afterUrl,
  beforeAlt,
  afterAlt,
  className,
}: CompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);

  const updateFromClientX = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, ratio)));
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromClientX(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.buttons !== 1) return;
    updateFromClientX(event.clientX);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 2;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPosition((value) => Math.max(0, value - step));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setPosition((value) => Math.min(100, value + step));
    } else if (event.key === "Home") {
      event.preventDefault();
      setPosition(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setPosition(100);
    }
  };

  return (
    <div
      ref={containerRef}
      data-ocid="studio.compare_slider"
      className={cn(
        "canvas-checkerboard relative select-none overflow-hidden rounded-xl border border-border",
        className,
      )}
    >
      <img
        src={afterUrl}
        alt={afterAlt}
        draggable={false}
        className="block max-h-[70vh] w-full object-contain"
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeUrl}
          alt={beforeAlt}
          draggable={false}
          className="block h-full w-full object-contain"
        />
      </div>

      <div
        className="absolute inset-y-0 w-0.5 bg-primary"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        <div
          role="slider"
          tabIndex={0}
          aria-label="เลื่อนเปรียบเทียบภาพก่อนและหลัง"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-orientation="horizontal"
          data-ocid="studio.compare_handle"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onKeyDown={handleKeyDown}
          className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border-2 border-primary bg-card shadow-elevated outline-none transition-smooth focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-0.5 text-primary">
            <span className="block h-4 w-0.5 rounded-full bg-primary" />
            <span className="block h-4 w-0.5 rounded-full bg-primary" />
          </span>
        </div>
      </div>

      <span className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-border bg-card/90 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
        ต้นฉบับ
      </span>
      <span className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-primary/40 bg-card/90 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur">
        ผลลัพธ์
      </span>
    </div>
  );
}
