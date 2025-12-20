/**
 * Signal List Component
 * Displays public owner signals with filters
 */

import { useState } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Home,
  TrendingUp,
  Clock,
  ChevronRight,
  Eye,
  MessageSquare,
  X,
} from 'lucide-react';
import { usePublicSignals } from '../../services/ownerSignal';
import type { SignalFilters, OwnerSignal } from '../../types/ownerSignal';
import { formatKRW } from '../../lib/utils/dsr';

interface SignalListProps {
  onSelectSignal?: (signal: OwnerSignal) => void;
}

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

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">Urgent</span>;
      case 'flexible':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Flexible</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">Exploring</span>;
    }
  };

  const getSignalTypeLabel = (type: string) => {
    switch (type) {
      case 'sale': return 'For Sale';
      case 'jeonse': return 'Jeonse';
      case 'monthly': return 'Monthly Rent';
      default: return type;
    }
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
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by district or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-xl border transition ${
            showFilters ? 'bg-brand-50 border-brand-500 text-brand-600' : 'border-gray-200 text-slate-600 hover:bg-gray-50'
          }`}
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 animate-fade-in">
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
            <div className="flex gap-2">
              {['sale', 'jeonse', 'monthly'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilters(f => ({
                    ...f,
                    signalType: f.signalType === type ? undefined : type as 'sale' | 'jeonse' | 'monthly'
                  }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    filters.signalType === type
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  {getSignalTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block">Property Type</label>
            <div className="flex gap-2 flex-wrap">
              {['apartment', 'villa', 'officetel', 'house'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilters(f => ({
                    ...f,
                    propertyType: f.propertyType === type ? undefined : type as 'apartment' | 'villa' | 'officetel' | 'house'
                  }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filters.propertyType === type
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block">Urgency</label>
            <div className="flex gap-2">
              {['urgent', 'flexible', 'exploring'].map((urgency) => (
                <button
                  key={urgency}
                  onClick={() => setFilters(f => ({
                    ...f,
                    urgency: f.urgency === urgency ? undefined : urgency as 'urgent' | 'flexible' | 'exploring'
                  }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    filters.urgency === urgency
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-500">
          {filteredSignals?.length || 0} signals found
        </span>
        {Object.keys(filters).filter(k => filters[k as keyof SignalFilters]).length > 0 && (
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
        <div className="bg-red-50 p-4 rounded-xl text-center">
          <p className="text-red-600">Failed to load signals</p>
        </div>
      )}

      {filteredSignals?.length === 0 && !isLoading && (
        <div className="bg-gray-50 p-8 rounded-xl text-center">
          <Home size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-slate-600 font-medium">No signals found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
        </div>
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
                <span className="px-2 py-1 bg-slate-800 text-white text-xs font-bold rounded">
                  {getPropertyTypeIcon(signal.property.propertyType)}
                </span>
                <span className="px-2 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded">
                  {getSignalTypeLabel(signal.signalType)}
                </span>
              </div>
              {getUrgencyBadge(signal.preferences.urgency)}
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
