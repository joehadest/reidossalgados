// src/components/SearchBar.tsx
'use client';
import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { useMenu } from '@/contexts/MenuContext';

export default function SearchBar() {
  const { filter, setFilter } = useMenu();

  return (
    <div className="relative">
      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        type="search"
        placeholder="Buscar no cardápio..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
        aria-label="Buscar no cardápio"
      />
    </div>
  );
}
