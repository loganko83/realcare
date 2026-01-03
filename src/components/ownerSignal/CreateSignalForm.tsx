/**
 * Create Signal Form Component
 * Form for property owners to create anonymous listings
 */

import { useState } from 'react';
import {
  Home,
  DollarSign,
  Clock,
  Users,
  Check,
  ChevronLeft,
  Map as MapIcon,
} from 'lucide-react';
import { useCreateSignal } from '../../services/ownerSignal';
import { SEOUL_DISTRICTS, GYEONGGI_CITIES } from '../../lib/constants/regulations';
import { formatKRW } from '../../lib/utils/dsr';
import type { CreateSignalInput } from '../../types/ownerSignal';
import { MapSelectorInline } from './MapSelector';
import {
  Button,
  Card,
  FormInput,
  FormSelect,
  SelectButton,
  SectionHeader,
  ProgressBar,
  useMultiStepForm,
} from '../common';

interface CreateSignalFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment' },
  { id: 'villa', label: 'Villa' },
  { id: 'officetel', label: 'Officetel' },
  { id: 'house', label: 'House' },
] as const;

const SIGNAL_TYPES = [
  { id: 'sale', label: 'Sale' },
  { id: 'jeonse', label: 'Jeonse' },
  { id: 'monthly', label: 'Monthly' },
] as const;

const URGENCY_OPTIONS = [
  { id: 'urgent', label: 'Urgent', description: 'Within 1 month' },
  { id: 'flexible', label: 'Flexible', description: 'Within 3 months' },
  { id: 'exploring', label: 'Exploring', description: 'No rush, testing market' },
] as const;

const BUYER_TYPES = [
  { id: 'individual', label: 'Individual' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'agent', label: 'Agent' },
] as const;

const VISIBILITY_OPTIONS = [
  { id: 'public', label: 'Public', description: 'Visible to all verified users' },
  { id: 'verified_only', label: 'Verified Only', description: 'Only users with high Reality Score' },
  { id: 'agents_only', label: 'Agents Only', description: 'Only licensed real estate agents' },
] as const;

export function CreateSignalForm({ onSuccess, onCancel }: CreateSignalFormProps) {
  const { step, totalSteps, isFirstStep, prevStep, goToStep } = useMultiStepForm({
    totalSteps: 4,
  });

  // Form state
  const [propertyType, setPropertyType] = useState<'apartment' | 'villa' | 'officetel' | 'house'>('apartment');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('gangnam');
  const [area, setArea] = useState(84);
  const [floor, setFloor] = useState(10);
  const [buildingYear, setBuildingYear] = useState(2015);
  const [useMapSelection, setUseMapSelection] = useState(false);
  const [mapLocation, setMapLocation] = useState<{ address: string; district: string; lat: number; lng: number } | null>(null);

  const [signalType, setSignalType] = useState<'sale' | 'jeonse' | 'monthly'>('sale');
  const [minPrice, setMinPrice] = useState(800);
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

  const regionGroups = [
    { label: 'Seoul', options: SEOUL_DISTRICTS.map(d => ({ value: d.id, label: d.name })) },
    { label: 'Gyeonggi', options: GYEONGGI_CITIES.map(c => ({ value: c.id, label: c.name })) },
  ];

  return (
    <div className="space-y-6">
      <ProgressBar current={step} total={totalSteps} />

      {/* Step 1: Property Info */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <SectionHeader icon={Home} title="Property Information" />

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Property Type</label>
                <SelectButton
                  options={PROPERTY_TYPES.map(t => ({ id: t.id, label: t.label }))}
                  value={propertyType}
                  onChange={(id) => setPropertyType(id as typeof propertyType)}
                  variant="pill"
                  columns={2}
                />
              </div>

              <FormSelect
                label="Location"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                groups={regionGroups}
              />

              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Full Address</label>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setUseMapSelection(false)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition ${
                      !useMapSelection
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-slate-500 hover:bg-gray-50'
                    }`}
                  >
                    Type Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseMapSelection(true)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition flex items-center justify-center gap-1 ${
                      useMapSelection
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-slate-500 hover:bg-gray-50'
                    }`}
                  >
                    <MapIcon size={14} />
                    Select on Map
                  </button>
                </div>

                {!useMapSelection ? (
                  <FormInput
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., 123 Gangnam-daero, Gangnam-gu"
                    helperText="Address will be partially masked for privacy"
                  />
                ) : (
                  <>
                    <MapSelectorInline
                      value={mapLocation ? { address: mapLocation.address, lat: mapLocation.lat, lng: mapLocation.lng } : null}
                      onChange={(loc) => {
                        setMapLocation(loc);
                        setAddress(loc.address);
                        const matchedDistrict = allRegions.find(r =>
                          loc.district.includes(r.name) || r.name.includes(loc.district)
                        );
                        if (matchedDistrict) {
                          setDistrict(matchedDistrict.id);
                        }
                      }}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Address will be partially masked for privacy
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormInput
                  label="Area (sqm)"
                  type="number"
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  inputSize="sm"
                />
                <FormInput
                  label="Floor"
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                  inputSize="sm"
                />
                <FormInput
                  label="Built Year"
                  type="number"
                  value={buildingYear}
                  onChange={(e) => setBuildingYear(Number(e.target.value))}
                  inputSize="sm"
                />
              </div>
            </div>
          </Card>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled={!address}
            onClick={() => goToStep(2)}
          >
            Next: Pricing
          </Button>
        </div>
      )}

      {/* Step 2: Pricing */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <SectionHeader icon={DollarSign} title="Transaction & Pricing" />

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Transaction Type</label>
                <SelectButton
                  options={SIGNAL_TYPES.map(t => ({ id: t.id, label: t.label }))}
                  value={signalType}
                  onChange={(id) => setSignalType(id as typeof signalType)}
                  variant="toggle"
                />
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
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={prevStep}
              icon={<ChevronLeft size={18} />}
            >
              Back
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => goToStep(3)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preferences */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <SectionHeader icon={Clock} title="Urgency & Preferences" />

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">How soon do you want to close?</label>
                <SelectButton
                  options={URGENCY_OPTIONS.map(o => ({ id: o.id, label: o.label, description: o.description }))}
                  value={urgency}
                  onChange={(id) => setUrgency(id as typeof urgency)}
                  variant="card"
                  showCheck
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Preferred Buyer Types</label>
                <SelectButton
                  options={BUYER_TYPES.map(t => ({ id: t.id, label: t.label }))}
                  value={preferredBuyerTypes}
                  onChange={(id) => toggleBuyerType(id as 'individual' | 'corporate' | 'agent')}
                  variant="toggle"
                  multiple
                />
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={prevStep}
              icon={<ChevronLeft size={18} />}
            >
              Back
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => goToStep(4)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Visibility & Confirm */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <SectionHeader icon={Users} title="Visibility Settings" />

            <SelectButton
              options={VISIBILITY_OPTIONS.map(o => ({ id: o.id, label: o.label, description: o.description }))}
              value={visibility}
              onChange={(id) => setVisibility(id as typeof visibility)}
              variant="card"
              showCheck
            />
          </Card>

          {/* Summary */}
          <Card variant="flat" padding="md">
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
          </Card>

          <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
            <p className="text-sm text-brand-700">
              Your phone number will remain private. Interested buyers will send contact requests which you can accept or decline.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={prevStep}
              icon={<ChevronLeft size={18} />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={loading}
              onClick={handleSubmit}
              icon={!loading ? <Check size={18} /> : undefined}
            >
              {loading ? 'Creating...' : 'Create Signal'}
            </Button>
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
