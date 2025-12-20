/**
 * Create Contract Form Component
 * Form for registering a new contract with auto-generated timeline
 */

import { useState } from 'react';
import {
  FileText,
  Calendar,
  DollarSign,
  User,
  Check,
  ChevronLeft,
  Loader2,
  Home,
  PaintBucket,
  Landmark,
} from 'lucide-react';
import { useCreateContract } from '../../services/contract';
import { formatKRW } from '../../lib/utils/dsr';
import type { CreateContractInput, ContractProperty } from '../../types/contract';

interface CreateContractFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateContractForm({ onSuccess, onCancel }: CreateContractFormProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Property info
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState<ContractProperty['propertyType']>('apartment');
  const [area, setArea] = useState(84);
  const [floor, setFloor] = useState(10);

  // Contract type
  const [contractType, setContractType] = useState<'sale' | 'jeonse' | 'monthly'>('jeonse');

  // Dates
  const [contractDate, setContractDate] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');

  // Financials (in millions)
  const [totalPrice, setTotalPrice] = useState(500);
  const [deposit, setDeposit] = useState(50);
  const [balance, setBalance] = useState(450);
  const [monthlyRent, setMonthlyRent] = useState(100);

  // Counterparty
  const [counterpartyName, setCounterpartyName] = useState('');
  const [counterpartyPhone, setCounterpartyPhone] = useState('');

  // Options
  const [requiresLoan, setRequiresLoan] = useState(false);
  const [hasInterior, setHasInterior] = useState(false);

  const { mutate: createContract, isPending: loading } = useCreateContract();

  const handleSubmit = () => {
    const input: CreateContractInput = {
      property: {
        address,
        propertyType,
        areaSquareMeters: area,
        floor,
      },
      contractType,
      dates: {
        contractDate,
        moveInDate,
        ...(contractType !== 'sale' && contractEndDate ? { contractEndDate } : {}),
      },
      financials: {
        totalPrice: totalPrice * 1000000,
        deposit: deposit * 1000000,
        balance: balance * 1000000,
        ...(contractType === 'monthly' ? { monthlyRent: monthlyRent * 10000 } : {}),
      },
      counterparty: {
        name: counterpartyName,
        phone: counterpartyPhone,
      },
      requiresLoan,
      hasInterior,
    };

    createContract(input, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  // Calculate days until move-in
  const daysUntilMoveIn = moveInDate
    ? Math.ceil((new Date(moveInDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

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
                      onClick={() => setPropertyType(type.id as ContractProperty['propertyType'])}
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
                <label className="text-sm font-medium text-slate-600 mb-2 block">Full Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., 123 Gangnam-daero, Gangnam-gu, Seoul"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!address}
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-900 transition disabled:opacity-50"
          >
            Next: Contract Type & Dates
          </button>
        </div>
      )}

      {/* Step 2: Contract Type & Dates */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-brand-600" />
              Contract Type & Dates
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Contract Type</label>
                <div className="flex gap-2">
                  {[
                    { id: 'sale', label: 'Purchase' },
                    { id: 'jeonse', label: 'Jeonse' },
                    { id: 'monthly', label: 'Monthly' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setContractType(type.id as 'sale' | 'jeonse' | 'monthly')}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${
                        contractType === type.id
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
                <label className="text-sm font-medium text-slate-600 mb-2 block">Contract Date</label>
                <input
                  type="date"
                  value={contractDate}
                  onChange={(e) => setContractDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Move-in Date</label>
                <input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500"
                />
                {daysUntilMoveIn !== null && (
                  <p className={`text-sm mt-1 ${daysUntilMoveIn < 30 ? 'text-orange-600' : 'text-slate-500'}`}>
                    {daysUntilMoveIn > 0 ? `${daysUntilMoveIn} days until move-in` : 'Move-in date passed'}
                  </p>
                )}
              </div>

              {contractType !== 'sale' && (
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-2 block">Contract End Date</label>
                  <input
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}
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
              disabled={!contractDate || !moveInDate}
              className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Financials */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-brand-600" />
              Financial Details
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-600">
                    {contractType === 'sale' ? 'Total Price' : 'Deposit Amount'}
                  </label>
                  <span className="text-sm font-bold text-brand-600">{formatKRW(totalPrice * 1000000)}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="3000"
                  step="10"
                  value={totalPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTotalPrice(val);
                    setBalance(val - deposit);
                  }}
                  className="w-full accent-brand-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    {contractType === 'sale' ? 'Down Payment' : 'Contract Deposit'} (M)
                  </label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDeposit(val);
                      setBalance(totalPrice - val);
                    }}
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Balance (M)</label>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-gray-50"
                    readOnly
                  />
                </div>
              </div>

              {contractType === 'monthly' && (
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

              {/* Options */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <p className="text-sm font-bold text-slate-700">Additional Options</p>

                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={requiresLoan}
                    onChange={(e) => setRequiresLoan(e.target.checked)}
                    className="w-5 h-5 rounded text-brand-600"
                  />
                  <div className="flex items-center gap-2">
                    <Landmark size={18} className="text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-700">Requires Loan</p>
                      <p className="text-xs text-slate-500">Add loan-related tasks to timeline</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={hasInterior}
                    onChange={(e) => setHasInterior(e.target.checked)}
                    className="w-5 h-5 rounded text-brand-600"
                  />
                  <div className="flex items-center gap-2">
                    <PaintBucket size={18} className="text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-700">Interior Work Planned</p>
                      <p className="text-xs text-slate-500">Add renovation tasks to timeline</p>
                    </div>
                  </div>
                </label>
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

      {/* Step 4: Counterparty & Confirm */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-brand-600" />
              Counterparty Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">
                  {contractType === 'sale' ? 'Seller Name' : 'Landlord Name'}
                </label>
                <input
                  type="text"
                  value={counterpartyName}
                  onChange={(e) => setCounterpartyName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Phone (Optional)</label>
                <input
                  type="tel"
                  value={counterpartyPhone}
                  onChange={(e) => setCounterpartyPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="font-bold text-slate-700 mb-3">Contract Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Property</span>
                <span className="font-medium text-slate-800">{propertyType} - {area}sqm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contract Type</span>
                <span className="font-medium text-slate-800 capitalize">{contractType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount</span>
                <span className="font-medium text-slate-800">{formatKRW(totalPrice * 1000000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Move-in Date</span>
                <span className="font-medium text-slate-800">{moveInDate}</span>
              </div>
              {daysUntilMoveIn !== null && daysUntilMoveIn > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Days Until Move-in</span>
                  <span className="font-bold text-brand-600">D-{daysUntilMoveIn}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
            <p className="text-sm text-brand-700">
              A customized move-in timeline will be automatically generated based on your contract details
              {requiresLoan && ', including loan application tasks'}
              {hasInterior && ', including interior work tasks'}.
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
              disabled={loading || !counterpartyName}
              className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {loading ? 'Creating...' : 'Create Contract'}
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
