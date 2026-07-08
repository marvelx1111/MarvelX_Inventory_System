import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { BodyType } from '../data/cars';
import { bodyTypes } from '../data/cars';
import { Magnetic } from './Magnetic';

export type SortOption = 'price-asc' | 'price-desc' | 'year-desc' | 'year-asc';

interface FilterBarProps {
  activeBody: BodyType | 'all';
  activeSort: SortOption;
  onBodyChange: (body: BodyType | 'all') => void;
  onSortChange: (sort: SortOption) => void;
  onBeforeFilter: () => void;
}

export function FilterBar({
  activeBody,
  activeSort,
  onBodyChange,
  onSortChange,
  onBeforeFilter,
}: FilterBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    gsap.fromTo(
      bar,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: bar,
          start: 'top 95%',
        },
      },
    );
  }, []);

  const handleBody = (body: BodyType | 'all') => {
    onBeforeFilter();
    onBodyChange(body);
  };

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onBeforeFilter();
    onSortChange(e.target.value as SortOption);
  };

  return (
    <div className="filter" ref={barRef} role="toolbar" aria-label="Filter and sort vehicles">
      <div className="filter__bodies">
        <Magnetic
          as="button"
          className={`filter__btn ${activeBody === 'all' ? 'is-active' : ''}`}
          onClick={() => handleBody('all')}
          strength={0.2}
        >
          All
        </Magnetic>
        {bodyTypes.map((type) => (
          <Magnetic
            key={type}
            as="button"
            className={`filter__btn ${activeBody === type ? 'is-active' : ''}`}
            onClick={() => handleBody(type)}
            strength={0.2}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Magnetic>
        ))}
      </div>
      <div className="filter__sort">
        <label htmlFor="sort-select" className="filter__sort-label">
          Sort by
        </label>
        <select
          id="sort-select"
          className="filter__select"
          value={activeSort}
          onChange={handleSort}
          aria-label="Sort vehicles"
        >
          <option value="price-desc">Price: High to Low</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="year-desc">Year: Newest</option>
          <option value="year-asc">Year: Oldest</option>
        </select>
      </div>
    </div>
  );
}
