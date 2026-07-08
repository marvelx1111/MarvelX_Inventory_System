import { useRef } from 'react';
import type { Car } from '../data/cars';
import { CarCard } from './CarCard';

interface InventoryGridProps {
  cars: Car[];
  onSelect: (car: Car, element: HTMLElement) => void;
  onCursorEnter: () => void;
  onCursorLeave: () => void;
}

export function InventoryGrid({
  cars,
  onSelect,
  onCursorEnter,
  onCursorLeave,
}: InventoryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <section className="inventory" id="inventory">
      <div className="inventory__header">
        <span className="section-label reveal-line">The Collection</span>
        <h2 className="inventory__title reveal-line">
          Curated machines for the discerning
        </h2>
        <p className="inventory__desc reveal-line">
          Each vehicle in our collection represents the pinnacle of its category —
          hand-selected, meticulously maintained, and ready to define your next chapter.
        </p>
      </div>
      <div className="inventory__grid" ref={gridRef}>
        {cars.map((car, i) => (
          <CarCard
            key={car.id}
            car={car}
            index={i}
            onSelect={onSelect}
            onCursorEnter={onCursorEnter}
            onCursorLeave={onCursorLeave}
          />
        ))}
      </div>
      {cars.length === 0 && (
        <p className="inventory__empty" role="status">
          No vehicles match your filters. Adjust your criteria to explore our full collection.
        </p>
      )}
    </section>
  );
}
