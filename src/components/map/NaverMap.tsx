/**
 * Naver Map Component
 * Displays property locations using Naver Maps SDK
 */

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ZoomIn, ZoomOut } from 'lucide-react';

declare global {
  interface Window {
    naver: any;
  }
}

interface Marker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  price?: number;
  type?: string;
}

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Marker[];
  onMarkerClick?: (marker: Marker) => void;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  showControls?: boolean;
}

const NAVER_MAP_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || '';

export function NaverMap({
  center = { lat: 37.5665, lng: 126.978 }, // Seoul City Hall
  zoom = 14,
  markers = [],
  onMarkerClick,
  onMapClick,
  className = '',
  showControls = true,
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Naver Maps SDK
  useEffect(() => {
    if (!NAVER_MAP_CLIENT_ID) {
      setError('Naver Map client ID not configured');
      return;
    }

    // Check if already loaded
    if (window.naver && window.naver.maps) {
      setIsLoaded(true);
      return;
    }

    // Load SDK script
    const script = document.createElement('script');
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_MAP_CLIENT_ID}`;
    script.async = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError('Failed to load Naver Maps SDK');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts before loading
      if (!window.naver) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Track event listeners for cleanup
  const mapClickListenerRef = useRef<any>(null);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.naver) return;

    const mapOptions = {
      center: new window.naver.maps.LatLng(center.lat, center.lng),
      zoom: zoom,
      minZoom: 7,
      maxZoom: 21,
      zoomControl: false,
      mapTypeControl: false,
    };

    mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, mapOptions);

    // Add click listener
    if (onMapClick) {
      mapClickListenerRef.current = window.naver.maps.Event.addListener(
        mapInstanceRef.current,
        'click',
        (e: any) => {
          onMapClick(e.coord.lat(), e.coord.lng());
        }
      );
    }

    return () => {
      // Cleanup map click listener
      if (mapClickListenerRef.current) {
        window.naver.maps.Event.removeListener(mapClickListenerRef.current);
        mapClickListenerRef.current = null;
      }
      if (mapInstanceRef.current) {
        // Cleanup markers
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];
      }
    };
  }, [isLoaded, center.lat, center.lng, zoom, onMapClick]);

  // Track marker click listeners for cleanup
  const markerListenersRef = useRef<any[]>([]);

  // Update markers
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.naver) return;

    // Clear existing marker listeners
    markerListenersRef.current.forEach((listener) => {
      window.naver.maps.Event.removeListener(listener);
    });
    markerListenersRef.current = [];

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(markerData.lat, markerData.lng),
        map: mapInstanceRef.current,
        title: markerData.title,
        icon: {
          content: createMarkerIcon(markerData),
          anchor: new window.naver.maps.Point(15, 40),
        },
      });

      if (onMarkerClick) {
        const listener = window.naver.maps.Event.addListener(marker, 'click', () => {
          onMarkerClick(markerData);
        });
        markerListenersRef.current.push(listener);
      }

      markersRef.current.push(marker);
    });

    return () => {
      // Cleanup marker listeners on unmount
      markerListenersRef.current.forEach((listener) => {
        window.naver.maps.Event.removeListener(listener);
      });
      markerListenersRef.current = [];
    };
  }, [isLoaded, markers, onMarkerClick]);

  // Create custom marker icon
  const createMarkerIcon = (marker: Marker) => {
    const priceText = marker.price
      ? formatPrice(marker.price)
      : '';

    return `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
      ">
        <div style="
          background: #2563eb;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${priceText || marker.title}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #2563eb;
        "></div>
      </div>
    `;
  };

  const formatPrice = (price: number) => {
    if (price >= 100000000) {
      return `${(price / 100000000).toFixed(1)}B`;
    }
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}M`;
    }
    return price.toLocaleString();
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setZoom(currentZoom - 1);
    }
  };

  const handleMoveToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mapInstanceRef.current) {
            const newCenter = new window.naver.maps.LatLng(
              position.coords.latitude,
              position.coords.longitude
            );
            mapInstanceRef.current.setCenter(newCenter);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-xl ${className}`}>
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        className="w-full h-full rounded-xl overflow-hidden"
        style={{ minHeight: '300px' }}
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map controls */}
      {showControls && isLoaded && (
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ZoomIn className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ZoomOut className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleMoveToCurrentLocation}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Navigation className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}

export default NaverMap;
