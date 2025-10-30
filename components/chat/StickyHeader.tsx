'use client';

import { useEffect, useState, useRef } from 'react';

interface StickyHeaderProps {
  question: string;
}

export function StickyHeader({ question }: StickyHeaderProps) {
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: [1] }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="h-px -mt-px" />
      {isSticky && (
        <div className="sticky top-0 z-40 bg-white/98 backdrop-blur-sm border-b border-gray-100 py-3.5 px-4 md:px-6">
          <div className="max-w-[48rem] mx-auto">
            <p className="text-[13px] text-gray-700 truncate font-normal">{question}</p>
          </div>
        </div>
      )}
    </>
  );
}
