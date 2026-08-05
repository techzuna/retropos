/**
 * A little plan view of a table: the top, with one seat pill per cover.
 *
 * Staff recognise their own room faster from a shape than from the words "6
 * persons" — a round six-top and a long six-top are different tables to carry
 * plates to. Shape and capacity both come from the floor plan, so the drawing
 * stays honest without anyone maintaining a second picture.
 */
export function TableDiagram({
  shape,
  capacity,
  className = "",
}: {
  shape: string;
  capacity: number;
  className?: string;
}) {
  const seats = Math.max(1, Math.min(capacity, 12)); // beyond a dozen the drawing stops helping
  const pills: Array<{ x: number; y: number; w: number; h: number; r: number }> = [];
  const SEAT_LONG = 13;
  const SEAT_SHORT = 5;
  const R = 2.5;

  if (shape === "round") {
    // Evenly around the rim, each pill turned to face the centre.
    for (let i = 0; i < seats; i++) {
      const angle = (2 * Math.PI * i) / seats - Math.PI / 2;
      pills.push({
        x: 40 + Math.cos(angle) * 27 - SEAT_SHORT / 2,
        y: 40 + Math.sin(angle) * 27 - SEAT_LONG / 2,
        w: SEAT_SHORT,
        h: SEAT_LONG,
        r: (angle * 180) / Math.PI + 90,
      });
    }
  } else if (shape === "square") {
    // Round all four sides: top, right, bottom, left, repeating.
    const sides: Array<[number, number, number]> = [
      [40, 12, 0],
      [68, 40, 90],
      [40, 68, 0],
      [12, 40, 90],
    ];
    for (let i = 0; i < seats; i++) {
      const [cx, cy, rot] = sides[i % 4];
      // Second lap sits alongside the first rather than on top of it.
      const lap = Math.floor(i / 4);
      const shift = lap === 0 ? 0 : lap % 2 === 1 ? -9 : 9;
      const along = rot === 0 ? { x: shift, y: 0 } : { x: 0, y: shift };
      pills.push({
        x: cx + along.x - (rot === 0 ? SEAT_LONG : SEAT_SHORT) / 2,
        y: cy + along.y - (rot === 0 ? SEAT_SHORT : SEAT_LONG) / 2,
        w: rot === 0 ? SEAT_LONG : SEAT_SHORT,
        h: rot === 0 ? SEAT_SHORT : SEAT_LONG,
        r: 0,
      });
    }
  } else {
    // Rectangular: down the two long sides, as a real banquette table seats.
    const left = Math.ceil(seats / 2);
    const right = seats - left;
    const place = (n: number, x: number) => {
      for (let i = 0; i < n; i++) {
        const step = 56 / (n + 1);
        pills.push({
          x,
          y: 12 + step * (i + 1) - SEAT_LONG / 2,
          w: SEAT_SHORT,
          h: SEAT_LONG,
          r: 0,
        });
      }
    };
    place(left, 14);
    place(right, 61);
  }

  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      role="img"
      aria-label={`${shape} table, ${capacity} seats`}
      fill="none"
    >
      {shape === "round" ? (
        <circle cx="40" cy="40" r="19" stroke="currentColor" strokeWidth="2" />
      ) : (
        <rect
          x={shape === "square" ? 22 : 22}
          y={shape === "square" ? 22 : 16}
          width={shape === "square" ? 36 : 36}
          height={shape === "square" ? 36 : 48}
          rx="3"
          stroke="currentColor"
          strokeWidth="2"
        />
      )}
      {pills.map((p, i) => (
        <rect
          key={i}
          x={p.x}
          y={p.y}
          width={p.w}
          height={p.h}
          rx={R}
          stroke="currentColor"
          strokeWidth="2"
          transform={p.r ? `rotate(${p.r} ${p.x + p.w / 2} ${p.y + p.h / 2})` : undefined}
        />
      ))}
    </svg>
  );
}
