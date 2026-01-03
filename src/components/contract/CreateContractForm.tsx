/**
 * Create Contract Form Component
 * Form for registering a new contract with auto-generated timeline
 */

import { useState } from 'react';
import {
  Calendar,
  DollarSign,
  User,
  Check,
  ChevronLeft,
  Home,
  PaintBucket,
  Landmark,
} from 'lucide-react';
import { useCreateContract } from '../../services/contract';
import { formatKRW } from '../../lib/utils/dsr';
import type { CreateContractInput, ContractProperty } from '../../types/contract';
import {
  Button,
  Card,
  FormInput,
  SelectButton,
  SectionHeader,
  ProgressBar,
  useMultiStepForm,
} from '../common';

interface CreateContractFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment' },
  { id: 'villa', label: 'Villa' },
  { id: 'officetel', label: 'Officetel' },
  { id: 'house', label: 'House' },
] as const;

const CONTRACT_TYPES = [
  { id: 'sale', label: 'Purchase' },
  { id: 'jeonse', label: 'Jeonse' },
  { id: 'monthly', label: 'Monthly' },
] as const;

export function CreateContractForm({ onSuccess, onCancel }: CreateContractFormProps) {
  const { step, totalSteps, prevStep, goToStep } = useMultiStepForm({
    totalSteps: 4,
  });

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
                  onChange={(id) => setPropertyType(id as ContractProperty['propertyType'])}
                  variant="pill"
                  columns={2}
                />
              </div>

              <FormInput
                label="Full Address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 123 Gangnam-daero, Gangnam-gu, Seoul"
              />

              <div className="grid grid-cols-2 gap-3">
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
            Next: Contract Type & Dates
          </Button>
        </div>
      )}

      {/* Step 2: Contract Type & Dates */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <SectionHeader icon={Calendar} title="Contract Type & Dates" />

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Contract Type</label>
                <SelectButton
                  options={CONTRACT_TYPES.map(t => ({ id: t.id, label: t.label }))}
                  value={contractType}
                  onChange={(id) => setContractType(id as 'sale' | 'jeonse' | 'monthly')}
                  variant="toggle"
                />
              </div>

              <FormInput
                label="Contract Date"
                type="date"
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
              />

              <div>
                <FormInput
                  label="Move-in Date"
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                />
                {daysUntilMoveIn !== null && (
                  <p className={`text-sm mt-1 ${daysUntilMoveIn < 30 ? 'text-orange-600' : 'text-slate-500'}`}>
                    {daysUntilMoveIn > 0 ? `${daysUntilMoveIn} days until move-in` : 'Move-in date passed'}
                  </p>
                )}
              </div>

              {contractType !== 'sale' && (
                <FormInput
                  label="Contract End Date"
                  type="date"
                  value={contractEndDate}
                  onChange={(e) => setContractEndDate(e.target.value)}
                />
              )}
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
              disabled={!contractDate || !moveInDate}
              onClick={() => goToStep(3)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Financials */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <SectionHeader icon={DollarSign} title="Financial Details" />

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
                <FormInput
                  label={contractType === 'sale' ? 'Down Payment (M)' : 'Contract Deposit (M)'}
                  type="number"
                  value={deposit}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDeposit(val);
                    setBalance(totalPrice - val);
                  }}
                  inputSize="sm"
                />
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Balance (M)</label>
                  <input
                    type="number"
                    value={balance}
                    readOnly
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-gray-50"
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

      {/* Step 4: Counterparty & Confirm */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <SectionHeader icon={User} title="Counterparty Information" />

            <div className="space-y-4">
              <FormInput
                label={contractType === 'sale' ? 'Seller Name' : 'Landlord Name'}
                type="text"
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                placeholder="Enter name"
              />

              <FormInput
                label="Phone (Optional)"
                type="tel"
                value={counterpartyPhone}
                onChange={(e) => setCounterpartyPhone(e.target.value)}
                placeholder="010-1234-5678"
              />
            </div>
          </Card>

          {/* Summary */}
          <Card variant="flat" padding="md">
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
          </Card>

          <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
            <p className="text-sm text-brand-700">
              A customized move-in timeline will be automatically generated based on your contract details
              {requiresLoan && ', including loan application tasks'}
              {hasInterior && ', including interior work tasks'}.
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
              disabled={!counterpartyName}
              onClick={handleSubmit}
              icon={!loading ? <Check size={18} /> : undefined}
            >
              {loading ? 'Creating...' : 'Create Contract'}
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
