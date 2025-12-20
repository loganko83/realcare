/**
 * Owner Signals Page
 * Browse and create anonymous property listings
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, List, Send, X } from 'lucide-react';
import { SignalList } from '../components/ownerSignal/SignalList';
import { CreateSignalForm } from '../components/ownerSignal/CreateSignalForm';
import { useMySignals } from '../services/ownerSignal';
import type { OwnerSignal } from '../types/ownerSignal';
import { formatKRW } from '../lib/utils/dsr';

export const Route = createFileRoute('/signals')({
  component: SignalsPage,
});

function SignalsPage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'my' | 'create'>('browse');
  const [selectedSignal, setSelectedSignal] = useState<OwnerSignal | null>(null);

  const { data: mySignals, isLoading: mySignalsLoading } = useMySignals();

  const handleSelectSignal = (signal: OwnerSignal) => {
    setSelectedSignal(signal);
  };

  const handleCreateSuccess = () => {
    setActiveTab('my');
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-800">Owner Signals</h1>
        {activeTab !== 'create' && (
          <button
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-1 px-3 py-2 bg-brand-600 text-white text-sm font-bold rounded-lg hover:bg-brand-700 transition"
          >
            <Plus size={16} /> New Signal
          </button>
        )}
      </div>

      {/* Tabs */}
      {activeTab !== 'create' && (
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${
              activeTab === 'browse' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List size={16} /> Browse
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${
              activeTab === 'my' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Send size={16} /> My Signals
            {mySignals && mySignals.length > 0 && (
              <span className="px-1.5 py-0.5 bg-brand-100 text-brand-600 text-xs font-bold rounded-full">
                {mySignals.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Create Form */}
      {activeTab === 'create' && (
        <div className="animate-fade-in">
          <button
            onClick={() => setActiveTab('browse')}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-800 mb-4"
          >
            <X size={18} /> Cancel
          </button>
          <CreateSignalForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setActiveTab('browse')}
          />
        </div>
      )}

      {/* Browse Signals */}
      {activeTab === 'browse' && (
        <SignalList onSelectSignal={handleSelectSignal} />
      )}

      {/* My Signals */}
      {activeTab === 'my' && (
        <div className="space-y-4 animate-fade-in">
          {mySignalsLoading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-slate-500 mt-2">Loading your signals...</p>
            </div>
          )}

          {!mySignalsLoading && mySignals?.length === 0 && (
            <div className="bg-gray-50 p-8 rounded-xl text-center">
              <Send size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-slate-600 font-medium">No signals yet</p>
              <p className="text-sm text-slate-400 mt-1 mb-4">
                Create your first anonymous property listing
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition"
              >
                Create Signal
              </button>
            </div>
          )}

          {mySignals?.map((signal) => (
            <div
              key={signal.id}
              className="bg-white p-4 rounded-xl border border-gray-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    signal.status === 'active' ? 'bg-green-100 text-green-700' :
                    signal.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                    signal.status === 'matched' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {signal.status.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(signal.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h3 className="font-bold text-slate-800 mb-1">
                {signal.property.propertyType.charAt(0).toUpperCase() + signal.property.propertyType.slice(1)} in {signal.property.district}
              </h3>
              <p className="text-sm text-slate-500 mb-3">
                {signal.property.areaSquareMeters}sqm - {signal.signalType}
              </p>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-lg font-bold text-slate-800">
                    {formatKRW(signal.pricing.minPrice)}
                    {signal.pricing.minPrice !== signal.pricing.maxPrice && (
                      <span className="text-slate-400 text-sm"> ~ {formatKRW(signal.pricing.maxPrice)}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>Views: {signal.stats.viewCount}</span>
                  <span>Requests: {signal.stats.contactRequestCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signal Detail Modal */}
      {selectedSignal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-lg text-slate-800">Signal Details</h2>
              <button
                onClick={() => setSelectedSignal(null)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-2 mb-4">
                <span className="px-2 py-1 bg-slate-800 text-white text-xs font-bold rounded">
                  {selectedSignal.property.propertyType.toUpperCase()}
                </span>
                <span className="px-2 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded">
                  {selectedSignal.signalType.toUpperCase()}
                </span>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Location</p>
                <p className="font-medium text-slate-800">
                  {selectedSignal.property.district} - {selectedSignal.property.addressMasked}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Area</p>
                  <p className="font-medium text-slate-800">{selectedSignal.property.areaSquareMeters} sqm</p>
                </div>
                {selectedSignal.property.floor && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Floor</p>
                    <p className="font-medium text-slate-800">{selectedSignal.property.floor}F</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Price Range</p>
                <p className="text-xl font-bold text-brand-600">
                  {formatKRW(selectedSignal.pricing.minPrice)} ~ {formatKRW(selectedSignal.pricing.maxPrice)}
                </p>
                {selectedSignal.pricing.isNegotiable && (
                  <p className="text-sm text-green-600">Price negotiable</p>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Urgency</p>
                <span className={`px-2 py-1 text-xs font-bold rounded ${
                  selectedSignal.preferences.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                  selectedSignal.preferences.urgency === 'flexible' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {selectedSignal.preferences.urgency.charAt(0).toUpperCase() + selectedSignal.preferences.urgency.slice(1)}
                </span>
              </div>

              <button className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition">
                Send Contact Request
              </button>

              <p className="text-xs text-slate-400 text-center">
                Contact requests require Reality Check score 40+
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
