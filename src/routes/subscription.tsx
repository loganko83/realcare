import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Heart, MapPin, Calendar, DollarSign, Bell, ChevronRight, Search } from 'lucide-react';

export const Route = createFileRoute('/subscription')({
  component: SubscriptionPage,
});

interface SubscriptionItem {
  id: number;
  name: string;
  location: string;
  price: string;
  type: string;
  status: 'upcoming' | 'open' | 'closed';
  date: string;
  dDay?: number;
}

const MOCK_DATA: SubscriptionItem[] = [
  {
    id: 1,
    name: 'Maple Xi',
    location: 'Seoul Seocho-gu Jamwon-dong',
    price: '1.5B ~ 3B KRW',
    type: 'Apartment',
    status: 'open',
    date: '2024-05-20',
    dDay: 0
  },
  {
    id: 2,
    name: 'DH Firstier I-Park',
    location: 'Seoul Gangnam-gu Gaepo-dong',
    price: '1.2B KRW ~',
    type: 'Apartment',
    status: 'upcoming',
    date: '2024-06-01',
    dDay: 12
  },
  {
    id: 3,
    name: 'Hillstate e-Pyeonhansesang Munjeong',
    location: 'Seoul Songpa-gu Munjeong-dong',
    price: '800M ~ 1.1B KRW',
    type: 'Apartment',
    status: 'closed',
    date: '2024-05-10'
  },
  {
    id: 4,
    name: 'Cheongnyangni Lotte Castle Hiluce',
    location: 'Seoul Dongdaemun-gu Cheongnyangni-dong',
    price: '700M KRW ~',
    type: 'Apartment',
    status: 'open',
    date: '2024-05-22',
    dDay: 2
  },
  {
    id: 5,
    name: 'Brighton Yeouido',
    location: 'Seoul Yeongdeungpo-gu Yeouido-dong',
    price: '3.5B KRW ~',
    type: 'Officetel',
    status: 'upcoming',
    date: '2024-06-15',
    dDay: 26
  }
];

function SubscriptionPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [items] = useState<SubscriptionItem[]>(MOCK_DATA);

  useEffect(() => {
    const saved = localStorage.getItem('realcare_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    let newFavorites;
    if (favorites.includes(id)) {
      newFavorites = favorites.filter(favId => favId !== id);
    } else {
      newFavorites = [...favorites, id];
    }
    setFavorites(newFavorites);
    localStorage.setItem('realcare_favorites', JSON.stringify(newFavorites));
  };

  const getStatusBadge = (status: string, dDay?: number) => {
    if (status === 'open') {
      return <span className="bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">Open Now</span>;
    } else if (status === 'upcoming') {
      return <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Upcoming {dDay !== undefined && `D-${dDay}`}</span>;
    } else {
      return <span className="bg-gray-200 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold">Closed</span>;
    }
  };

  const filteredItems = activeTab === 'all'
    ? items
    : items.filter(item => favorites.includes(item.id));

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-800">Subscription Info</h1>
        <button className="p-2 rounded-full hover:bg-slate-100 relative">
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6 shrink-0">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${
            activeTab === 'all' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          All Listings
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition flex items-center justify-center gap-1 ${
            activeTab === 'favorites' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Favorites <Heart size={12} className={activeTab === 'favorites' ? 'fill-brand-600' : ''} />
        </button>
      </div>

      {/* List */}
      <div className="space-y-4 overflow-y-auto no-scrollbar">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative group active:scale-[0.99] transition-transform duration-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] font-bold text-slate-500 border border-gray-200 px-1.5 rounded">{item.type}</span>
                  {getStatusBadge(item.status, item.dDay)}
                </div>
                <button
                  onClick={(e) => toggleFavorite(e, item.id)}
                  className="p-1.5 rounded-full hover:bg-gray-50 transition"
                >
                  <Heart
                    size={20}
                    className={favorites.includes(item.id) ? "fill-red-500 text-red-500" : "text-gray-300"}
                  />
                </button>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{item.name}</h3>

              <div className="space-y-1.5 mt-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{item.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <DollarSign size={14} className="text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{item.price}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <span>{item.date} {item.status === 'open' ? 'Deadline' : 'Opening'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                <button className="text-xs font-bold text-brand-600 flex items-center gap-0.5 hover:underline">
                  View Details <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
              {activeTab === 'favorites' ? <Heart size={32} /> : <Search size={32} />}
            </div>
            <p className="font-medium text-slate-600 mb-1">
              {activeTab === 'favorites' ? 'No favorites yet.' : 'No matching listings.'}
            </p>
            {activeTab === 'favorites' && (
              <p className="text-xs">Add your favorite listings!</p>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-20 right-4 bg-slate-800 text-white p-3.5 rounded-full shadow-xl hover:bg-slate-900 transition z-40">
        <Search size={20} />
      </button>
    </div>
  );
}
