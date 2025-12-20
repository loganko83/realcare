/**
 * Create Signal Form Component
 * Form for property owners to create anonymous listings
 */

import { useState } from 'react';
import {
  Home,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Check,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { useCreateSignal } from '../../services/ownerSignal';
import { SEOUL_DISTRICTS, GYEONGGI_CITIES } from '../../lib/constants/regulations';
import { formatKRW } from '../../lib/utils/dsr';
import type { CreateSignalInput } from '../../types/ownerSignal';

interface CreateSignalFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateSignalForm({ onSuccess, onCancel }: CreateSignalFormProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Form state
  const [propertyType, setPropertyType] = useState<'apartment' | 'villa' | 'officetel' | 'house'>('apartment');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('gangnam');
  const [area, setArea] = useState(84);
  const [floor, setFloor] = useState(10);
  const [buildingYear, setBuildingYear] = useState(2015);

  const [signalType, setSignalType] = useState<'sale' | 'jeonse' | 'monthly'>('sale');
  const [minPrice, setMinPrice] = useState(800); // in millions
  const [maxPrice, setMaxPrice] = useState(850);
  const [monthlyRent, setMonthlyRent] = useState(100);
  const [isNegotiable, setIsNegotiable] = useState(true);

  const [urgency, setUrgency] = useState<'urgent' | 'flexible' | 'exploring'>('flexible');
  const [preferredBuyerTypes, setPreferredBuyerTypes] = useState<('individual' | 'corporate' | 'agent')[]>(['individual']);
  const [visibility, setVisibility] = useState<'public' | 'verified_only' | 'agents_only'>('public');

  const allRegions = [...SEOUL_DISTRICTS, ...GYEONGGI_CITIES];
  const selectedRegion = allRegions.find(r => r.id === district);

  const { mutate: createSignal, isPending: loading } = useCreateSignal();

  const handleSubmit = () => {
    const input: CreateSignalInput = {
      property: {
        address,
        district,
        propertyType,
        areaSquareMeters: area,
        floor,
        buildingYear,
      },
      signalType,
      pricing: {
        minPrice: minPrice * 1000000,
        maxPrice: maxPrice * 1000000,
        isNegotiable,
        ...(signalType === 'monthly' ? { monthlyRent: monthlyRent * 10000 } : {}),
      },
      preferences: {
        urgency,
        preferredBuyerType: preferredBuyerTypes,
      },
      visibility,
    };

    createSignal(input, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  const toggleBuyerType = (type: 'individual' | 'corporate' | 'agent') => {
    setPreferredBuyerTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition ${
              i < step ? 'bg-brand-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Property Info */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <Home size={20} className="text-brand-600" />
              Property Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Property Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'apartment', label: 'Apartment' },
                    { id: 'villa', label: 'Villa' },
                    { id: 'officetel', label: 'Officetel' },
                    { id: 'house', label: 'House' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPropertyType(type.id as typeof propertyType)}
                      className={`py-3 rounded-xl text-sm font-bold transition ${
                        propertyType === type.id
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
                <label className="text-sm font-medium text-slate-600 mb-2 block">Location</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500"
                >
                  <optgroup label="Seoul">
                    {SEOUL_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Gyeonggi">
                    {GYEONGGI_CITIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Full Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., 123 Gangnam-daero, Gangnam-gu"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Address will be partially masked for privacy
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Area (sqm)</label>
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Floor</label>
                  <input
                    type="number"
                    value={floor}
                    onChange={(e) => setFloor(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Built Year</label>
                  <input
                    type="number"
                    value={buildingYear}
                    onChange={(e) => setBuildingYear(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!address}
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-900 transition disabled:opacity-50"
          >
            Next: Pricing
          </button>
        </div>
      )}

      {/* Step 2: Pricing */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-brand-600" />
              Transaction & Pricing
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Transaction Type</label>
                <div className="flex gap-2">
                  {[
                    { id: 'sale', label: 'Sale' },
                    { id: 'jeonse', label: 'Jeonse' },
                    { id: 'monthly', label: 'Monthly' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSignalType(type.id as typeof signalType)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${
                        signalType === type.id
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
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-600">Minimum Price</label>
                  <span className="text-sm font-bold text-brand-600">{formatKRW(minPrice * 1000000)}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="3000"
                  step="10"
                  value={minPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMinPrice(val);
                    if (val > maxPrice) setMaxPrice(val);
                  }}
                  className="w-full accent-brand-600"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-600">Maximum Price</label>
                  <span className="text-sm font-bold text-brand-600">{formatKRW(maxPrice * 1000000)}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="3000"
                  step="10"
                  value={maxPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxPrice(val);
                    if (val < minPrice) setMinPrice(val);
                  }}
                  className="w-full accent-brand-600"
                />
              </div>

              {signalType === 'monthly' && (
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-600">Monthly Rent</label>
                    <span className="text-sm font-bold text-brand-600">{monthlyRent}0,000 KRW</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="500"
                    step="5"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="negotiable"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="w-5 h-5 rounded text-brand-600"
                />
                <label htmlFor="negotiable" className="text-sm font-medium text-slate-700">
                  Price is negotiable
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <ChevronLeft size={18} /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preferences */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-brand-600" />
              Urgency & Preferences
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">How soon do you want to close?</label>
                <div className="space-y-2">
                  {[
                    { id: 'urgent', label: 'Urgent', desc: 'Within 1 month' },
                    { id: 'flexible', label: 'Flexible', desc: 'Within 3 months' },
                    { id: 'exploring', label: 'Exploring', desc: 'No rush, testing market' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setUrgency(option.id as typeof urgency)}
                      className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between ${
                        urgency === option.id
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-800">{option.label}</p>
                        <p className="text-sm text-slate-500">{option.desc}</p>
                      </div>
                      {urgency === option.id && (
                        <Check size={20} className="text-brand-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Preferred Buyer Types</label>
                <div className="flex gap-2">
                  {[
                    { id: 'individual', label: 'Individual' },
                    { id: 'corporate', label: 'Corporate' },
                    { id: 'agent', label: 'Agent' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => toggleBuyerType(type.id as 'individual' | 'corporate' | 'agent')}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                        preferredBuyerTypes.includes(type.id as 'individual' | 'corporate' | 'agent')
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <ChevronLeft size={18} /> Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Visibility & Confirm */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-brand-600" />
              Visibility Settings
            </h2>

            <div className="space-y-2">
              {[
                { id: 'public', label: 'Public', desc: 'Visible to all verified users' },
                { id: 'verified_only', label: 'Verified Only', desc: 'Only users with high Reality Score' },
                { id: 'agents_only', label: 'Agents Only', desc: 'Only licensed real estate agents' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setVisibility(option.id as typeof visibility)}
                  className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between ${
                    visibility === option.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <p className="font-bold text-slate-800">{option.label}</p>
                    <p className="text-sm text-slate-500">{option.desc}</p>
                  </div>
                  {visibility === option.id && (
                    <Check size={20} className="text-brand-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="font-bold text-slate-700 mb-3">Signal Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Property</span>
                <span className="font-medium text-slate-800">{propertyType} in {selectedRegion?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-medium text-slate-800">{signalType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price Range</span>
                <span className="font-medium text-slate-800">
                  {formatKRW(minPrice * 1000000)} ~ {formatKRW(maxPrice * 1000000)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Urgency</span>
                <span className="font-medium text-slate-800 capitalize">{urgency}</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
            <p className="text-sm text-brand-700">
              Your phone number will remain private. Interested buyers will send contact requests which you can accept or decline.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <ChevronLeft size={18} /> Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {loading ? 'Creating...' : 'Create Signal'}
            </button>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
