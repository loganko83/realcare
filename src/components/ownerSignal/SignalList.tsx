/**
 * Signal List Component
 * Displays public owner signals with filters
 */

import { useState } from 'react';
import {
  MapPin,
  Home,
  ChevronRight,
  Eye,
  MessageSquare,
  X,
} from 'lucide-react';
import { usePublicSignals } from '../../services/ownerSignal';
import type { SignalFilters, OwnerSignal } from '../../types/ownerSignal';
import { formatKRW } from '../../lib/utils/dsr';
import {
  Badge,
  Card,
  SearchFilterBar,
  SelectButton,
} from '../common';

interface SignalListProps {
  onSelectSignal?: (signal: OwnerSignal) => void;
}

const SIGNAL_TYPE_OPTIONS = [
  { id: 'sale', label: 'For Sale' },
  { id: 'jeonse', label: 'Jeonse' },
  { id: 'monthly', label: 'Monthly Rent' },
];

const PROPERTY_TYPE_OPTIONS = [
  { id: 'apartment', label: 'Apartment' },
  { id: 'villa', label: 'Villa' },
  { id: 'officetel', label: 'Officetel' },
  { id: 'house', label: 'House' },
];

const URGENCY_OPTIONS = [
  { id: 'urgent', label: 'Urgent' },
  { id: 'flexible', label: 'Flexible' },
  { id: 'exploring', label: 'Exploring' },
];

export function SignalList({ onSelectSignal }: SignalListProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SignalFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { data: signals, isLoading, error } = usePublicSignals(filters);

  const filteredSignals = signals?.filter(signal =>
    !searchQuery ||
    signal.property.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    signal.property.propertyType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeFilterCount = Object.keys(filters).filter(k => filters[k as keyof SignalFilters]).length;

  const getUrgencyVariant = (urgency: string): 'urgent' | 'flexible' | 'exploring' => {
    switch (urgency) {
      case 'urgent': return 'urgent';
      case 'flexible': return 'flexible';
      default: return 'exploring';
    }
  };

  const getSignalTypeLabel = (type: string) => {
    const option = SIGNAL_TYPE_OPTIONS.find(o => o.id === type);
    return option?.label || type;
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'apartment': return 'APT';
      case 'villa': return 'VLA';
      case 'officetel': return 'OFT';
      case 'house': return 'HSE';
      default: return 'OTH';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <SearchFilterBar
        value={searchQuery}
        onChange={setSearchQuery}
        onFilterToggle={() => setShowFilters(!showFilters)}
        isFilterOpen={showFilters}
        filterCount={activeFilterCount}
        placeholder="Search by district or type..."
      />

      {/* Filters Panel */}
      {showFilters && (
        <Card variant="outlined" padding="md" className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Filters</h3>
            <button
              onClick={() => setFilters({})}
              className="text-sm text-brand-600 hover:underline"
            >
              Clear all
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block">Transaction Type</label>
            <SelectButton
              options={SIGNAL_TYPE_OPTIONS}
              value={filters.signalType || ''}
              onChange={(id) => setFilters(f => ({
                ...f,
                signalType: f.signalType === id ? undefined : id as 'sale' | 'jeonse' | 'monthly'
              }))}
              variant="toggle"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block">Property Type</label>
            <div className="flex gap-2 flex-wrap">
              {PROPERTY_TYPE_OPTIONS.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFilters(f => ({
                    ...f,
                    propertyType: f.propertyType === type.id ? undefined : type.id as 'apartment' | 'villa' | 'officetel' | 'house'
                  }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filters.propertyType === type.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block">Urgency</label>
            <SelectButton
              options={URGENCY_OPTIONS}
              value={filters.urgency || ''}
              onChange={(id) => setFilters(f => ({
                ...f,
                urgency: f.urgency === id ? undefined : id as 'urgent' | 'flexible' | 'exploring'
              }))}
              variant="toggle"
            />
          </div>
        </Card>
      )}

      {/* Results Count */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-500">
          {filteredSignals?.length || 0} signals found
        </span>
        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters({})}
            className="text-brand-600 hover:underline flex items-center gap-1"
          >
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {/* Signal Cards */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-slate-500 mt-2">Loading signals...</p>
        </div>
      )}

      {error && (
        <Card variant="flat" className="bg-red-50 text-center">
          <p className="text-red-600">Failed to load signals</p>
        </Card>
      )}

      {filteredSignals?.length === 0 && !isLoading && (
        <Card variant="flat" padding="lg" className="text-center">
          <Home size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-slate-600 font-medium">No signals found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
        </Card>
      )}

      <div className="space-y-3">
        {filteredSignals?.map((signal) => (
          <button
            key={signal.id}
            onClick={() => onSelectSignal?.(signal)}
            className="w-full bg-white p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-md transition text-left group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-slate-800 text-white">
                  {getPropertyTypeIcon(signal.property.propertyType)}
                </Badge>
                <Badge variant="info" className="bg-brand-100 text-brand-700">
                  {getSignalTypeLabel(signal.signalType)}
                </Badge>
              </div>
              <Badge variant={getUrgencyVariant(signal.preferences.urgency)}>
                {signal.preferences.urgency.charAt(0).toUpperCase() + signal.preferences.urgency.slice(1)}
              </Badge>
            </div>

            <div className="mb-3">
              <div className="flex items-center gap-1 text-sm text-slate-500 mb-1">
                <MapPin size={14} />
                {signal.property.district} - {signal.property.addressMasked}
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>{signal.property.areaSquareMeters}sqm</span>
                {signal.property.floor && <span>{signal.property.floor}F</span>}
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-lg font-bold text-slate-800">
                  {formatKRW(signal.pricing.minPrice)}
                  {signal.pricing.minPrice !== signal.pricing.maxPrice && (
                    <span className="text-slate-400"> ~ {formatKRW(signal.pricing.maxPrice)}</span>
                  )}
                </p>
                {signal.pricing.monthlyRent && (
                  <p className="text-sm text-slate-500">
                    + {formatKRW(signal.pricing.monthlyRent)}/month
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye size={12} /> {signal.stats.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} /> {signal.stats.contactRequestCount}
                </span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-600 transition" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
