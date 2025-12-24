/**
 * Map Selector Component
 * Kakao Maps integration for property location selection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import { MapPin, Search, X, Loader2, Navigation } from 'lucide-react';

interface MapSelectorProps {
  onSelectLocation: (location: {
    address: string;
    district: string;
    lat: number;
    lng: number;
  }) => void;
  initialAddress?: string;
  onClose?: () => void;
}

interface SearchResult {
  address_name: string;
  road_address_name?: string;
  x: string;
  y: string;
}

export function MapSelector({ onSelectLocation, initialAddress, onClose }: MapSelectorProps) {
  const [loading] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_JS_KEY || '',
  });

  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 }); // Seoul default
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState(initialAddress || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Track if search should be skipped (e.g., after map click sets address)
  const skipNextSearchRef = useRef(false);
  // Track latest search query for async callbacks
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  // Perform address search
  const handleSearch = useCallback((query: string) => {
    if (!query.trim() || loading) return;

    setIsSearching(true);
    setShowResults(true);

    try {
      const geocoder = new window.kakao.maps.services.Geocoder();
      const places = new window.kakao.maps.services.Places();

      // Search by keyword
      places.keywordSearch(query, (results: SearchResult[], status: string) => {
        // Check if query is still current (prevent race condition)
        if (query !== searchQueryRef.current) return;

        if (status === window.kakao.maps.services.Status.OK && results.length > 0) {
          setSearchResults(results.slice(0, 5));
        } else {
          // Fallback to address search
          geocoder.addressSearch(query, (addressResults: SearchResult[], addressStatus: string) => {
            // Check if query is still current
            if (query !== searchQueryRef.current) return;

            if (addressStatus === window.kakao.maps.services.Status.OK) {
              setSearchResults(addressResults.slice(0, 5));
            } else {
              setSearchResults([]);
            }
          });
        }
        setIsSearching(false);
      });
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  }, [loading]);

  // Select search result
  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.y);
    const lng = parseFloat(result.x);

    // Skip next search since we're setting address from selection
    skipNextSearchRef.current = true;

    setCenter({ lat, lng });
    setMarker({ lat, lng });
    setSelectedAddress(result.road_address_name || result.address_name);
    setSearchQuery(result.road_address_name || result.address_name);
    setShowResults(false);
  };

  // Handle map click
  const handleMapClick = (_: unknown, mouseEvent: { latLng: { getLat: () => number; getLng: () => number } }) => {
    const lat = mouseEvent.latLng.getLat();
    const lng = mouseEvent.latLng.getLng();

    setMarker({ lat, lng });

    // Reverse geocode to get address
    if (!loading) {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.coord2Address(lng, lat, (results: Array<{ address?: { address_name: string }; road_address?: { address_name: string } }>, status: string) => {
        if (status === window.kakao.maps.services.Status.OK && results[0]) {
          const address = results[0].road_address?.address_name || results[0].address?.address_name || '';
          setSelectedAddress(address);
          // Skip next search since address is from map click
          skipNextSearchRef.current = true;
          setSearchQuery(address);
        }
      });
    }
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter({ lat: latitude, lng: longitude });
          setMarker({ lat: latitude, lng: longitude });

          // Reverse geocode
          if (!loading) {
            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.coord2Address(longitude, latitude, (results: Array<{ address?: { address_name: string }; road_address?: { address_name: string } }>, status: string) => {
              if (status === window.kakao.maps.services.Status.OK && results[0]) {
                const address = results[0].road_address?.address_name || results[0].address?.address_name || '';
                setSelectedAddress(address);
                // Skip next search since address is from geolocation
                skipNextSearchRef.current = true;
                setSearchQuery(address);
              }
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    if (marker && selectedAddress) {
      // Extract district from address (simplified Korean address parsing)
      const parts = selectedAddress.split(' ');
      let district = '';

      // Look for common district patterns (구, 시, 군)
      for (const part of parts) {
        if (part.endsWith('구') || part.endsWith('시') || part.endsWith('군')) {
          district = part;
          break;
        }
      }

      onSelectLocation({
        address: selectedAddress,
        district: district || parts[1] || '',
        lat: marker.lat,
        lng: marker.lng,
      });
    }
  };

  // Debounced search on input
  useEffect(() => {
    // Skip if address was set programmatically (map click, selection, geolocation)
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search address or building name..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={handleGetCurrentLocation}
            className="px-3 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
            title="Use current location"
          >
            <Navigation size={18} className="text-slate-600" />
          </button>
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
            {isSearching && (
              <div className="p-3 text-center text-gray-500">
                <Loader2 className="animate-spin inline mr-2" size={16} />
                Searching...
              </div>
            )}
            {!isSearching && searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <p className="font-medium text-slate-800 text-sm">
                  {result.road_address_name || result.address_name}
                </p>
                {result.road_address_name && result.address_name !== result.road_address_name && (
                  <p className="text-xs text-slate-400">{result.address_name}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: '300px' }}>
        <Map
          center={center}
          style={{ width: '100%', height: '100%' }}
          level={3}
          onClick={handleMapClick}
        >
          {marker && (
            <MapMarker position={marker}>
              <div className="p-2 text-xs font-medium">
                <MapPin size={14} className="inline mr-1" />
                Selected Location
              </div>
            </MapMarker>
          )}
        </Map>
      </div>

      {/* Selected Address */}
      {selectedAddress && (
        <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
          <div className="flex items-start gap-3">
            <MapPin className="text-brand-600 mt-0.5" size={18} />
            <div className="flex-1">
              <p className="font-medium text-slate-800">{selectedAddress}</p>
              <p className="text-xs text-slate-500 mt-1">
                Coordinates: {marker?.lat.toFixed(6)}, {marker?.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={!marker || !selectedAddress}
          className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <MapPin size={18} />
          Confirm Location
        </button>
      </div>
    </div>
  );
}

// Compact map selector for inline use
export function MapSelectorInline({
  value,
  onChange
}: {
  value: { address: string; lat?: number; lng?: number } | null;
  onChange: (location: { address: string; district: string; lat: number; lng: number }) => void;
}) {
  const [showMap, setShowMap] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowMap(true)}
        className="w-full p-3 rounded-xl border border-gray-200 text-left hover:border-gray-300 transition flex items-center gap-2"
      >
        <MapPin size={18} className="text-brand-600" />
        <span className={value?.address ? 'text-slate-800' : 'text-slate-400'}>
          {value?.address || 'Select location on map...'}
        </span>
      </button>

      {showMap && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Select Property Location</h3>
            <MapSelector
              initialAddress={value?.address}
              onSelectLocation={(loc) => {
                onChange(loc);
                setShowMap(false);
              }}
              onClose={() => setShowMap(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Extend Window to include kakao
declare global {
  interface Window {
    kakao: {
      maps: {
        services: {
          Geocoder: new () => {
            addressSearch: (
              query: string,
              callback: (results: SearchResult[], status: string) => void
            ) => void;
            coord2Address: (
              lng: number,
              lat: number,
              callback: (
                results: Array<{ address?: { address_name: string }; road_address?: { address_name: string } }>,
                status: string
              ) => void
            ) => void;
          };
          Places: new () => {
            keywordSearch: (
              query: string,
              callback: (results: SearchResult[], status: string) => void
            ) => void;
          };
          Status: {
            OK: string;
          };
        };
      };
    };
  }
}
