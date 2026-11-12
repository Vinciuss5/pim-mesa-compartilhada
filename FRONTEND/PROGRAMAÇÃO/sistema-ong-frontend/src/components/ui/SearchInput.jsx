// src/components/ui/SearchInput.jsx
import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Buscar...', className = '' }) {
  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="block w-full rounded-md border border-gray-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-[#007F45] focus:ring-1 focus:ring-[#007F45]"
      />
    </div>
  );
}
