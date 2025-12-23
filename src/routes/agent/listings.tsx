/**
 * Agent Listings Management Page
 * View and manage property listings
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Building2,
  MapPin,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Listing {
  id: string;
  title: string;
  property_type: string;
  address: string;
  price: number;
  deposit?: number;
  monthly_rent?: number;
  area_sqm: number;
  status: 'active' | 'pending' | 'sold' | 'inactive';
  views: number;
  signals: number;
  created_at: string;
  images?: string[];
}

interface ListingsResponse {
  items: Listing[];
  total: number;
  page: number;
  size: number;
}

export const Route = createFileRoute('/agent/listings')({
  component: AgentListingsPage,
});

function AgentListingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedListing, setSelectedListing] = useState<string | null>(null);

  const { data: listings, isLoading } = useQuery<ListingsResponse>({
    queryKey: ['agent', 'listings', statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      return apiClient.get(`/agents/listings?${params.toString()}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (listingId: string) => {
      return apiClient.delete(`/agents/listings/${listingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'listings'] });
      setSelectedListing(null);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" /> Active
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'sold':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" /> Sold
          </span>
        );
      case 'inactive':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
            <XCircle className="w-3 h-3" /> Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(1)}B`;
    }
    return `${price.toLocaleString()}M`;
  };

  return (
    <ProtectedRoute requiredRole="agent">
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate({ to: '/agent' })}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Listings</h1>
            <button
              onClick={() => navigate({ to: '/agent/listings/new' })}
              className="ml-auto p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'active', 'pending', 'sold', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Listings */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : listings?.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Building2 className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h2>
              <p className="text-gray-500 mb-6 text-center">
                Create your first property listing
              </p>
              <button
                onClick={() => navigate({ to: '/agent/listings/new' })}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Listing
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {listings?.items.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm"
                >
                  <div className="flex">
                    {/* Image */}
                    <div className="w-24 h-24 bg-gray-200 flex-shrink-0">
                      {listing.images?.[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                          {listing.title}
                        </h3>
                        <button
                          onClick={() => setSelectedListing(
                            selectedListing === listing.id ? null : listing.id
                          )}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{listing.address}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="font-bold text-blue-600">
                          {listing.monthly_rent
                            ? `${formatPrice(listing.deposit || 0)} / ${listing.monthly_rent}M`
                            : formatPrice(listing.price)
                          }
                        </p>
                        {getStatusBadge(listing.status)}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {listing.views}
                        </span>
                        <span>{listing.area_sqm}sqm</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Menu */}
                  {selectedListing === listing.id && (
                    <div className="border-t border-gray-100 px-3 py-2 flex gap-2">
                      <button
                        onClick={() => navigate({ to: `/agent/listings/${listing.id}` })}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
                      <button
                        onClick={() => navigate({ to: `/agent/listings/${listing.id}/edit` })}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this listing?')) {
                            deleteMutation.mutate(listing.id);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {listings && listings.items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total: {listings.total} listings</span>
              <span className="text-gray-500">
                Active: {listings.items.filter(l => l.status === 'active').length}
              </span>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
