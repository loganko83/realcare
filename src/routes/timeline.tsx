/**
 * Timeline / Smart Move-in Page
 * Contract management and move-in timeline tracking
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, FileText, Calendar, X, ChevronRight, Clock } from 'lucide-react';
import { TimelineView } from '../components/contract/TimelineView';
import { CreateContractForm } from '../components/contract/CreateContractForm';
import { useMyContracts, useActiveContract, useContract } from '../services/contract';
import { formatKRW } from '../lib/utils/dsr';
import { getTimelineProgress } from '../lib/utils/timelineGenerator';
import { useTranslation } from '../lib/i18n/useTranslation';

export const Route = createFileRoute('/timeline')({
  component: TimelinePage,
});

function TimelinePage() {
  const { t } = useTranslation();
  const [view, setView] = useState<'list' | 'detail' | 'create'>('list');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  const { data: contracts, isLoading, refetch } = useMyContracts();
  const { data: activeContract } = useActiveContract();
  const { data: selectedContract, refetch: refetchSelected } = useContract(selectedContractId || '');

  const handleSelectContract = (contractId: string) => {
    setSelectedContractId(contractId);
    setView('detail');
  };

  const handleCreateSuccess = () => {
    refetch();
    setView('list');
  };

  // Calculate days until move-in for active contract
  const getDaysUntilMoveIn = (moveInDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const moveIn = new Date(moveInDate);
    return Math.ceil((moveIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('timeline_page_title')}</h1>
          {view === 'list' && (
            <p className="text-sm text-slate-500">{t('timeline_track')}</p>
          )}
        </div>
        {view === 'list' && (
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-1 px-3 py-2 bg-brand-600 text-white text-sm font-bold rounded-lg hover:bg-brand-700 transition"
          >
            <Plus size={16} /> {t('timeline_new_contract')}
          </button>
        )}
        {view === 'detail' && (
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-800"
          >
            <X size={18} /> {t('timeline_close')}
          </button>
        )}
        {view === 'create' && (
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-800"
          >
            <X size={18} /> {t('cancel')}
          </button>
        )}
      </div>

      {/* Create Contract Form */}
      {view === 'create' && (
        <div className="animate-fade-in">
          <CreateContractForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setView('list')}
          />
        </div>
      )}

      {/* Contract Detail / Timeline View */}
      {view === 'detail' && selectedContract && (
        <div className="animate-fade-in">
          {/* Contract Summary Header */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-brand-100 text-sm">
                  {selectedContract.contractType.charAt(0).toUpperCase() + selectedContract.contractType.slice(1)}
                </p>
                <h2 className="text-xl font-bold">{selectedContract.property.address}</h2>
              </div>
              <span className={`px-2 py-1 text-xs font-bold rounded ${
                selectedContract.status === 'active' ? 'bg-green-500' :
                selectedContract.status === 'moving' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}>
                {selectedContract.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-brand-200">{t('timeline_move_in_date')}</p>
                <p className="font-bold">{selectedContract.dates.moveInDate}</p>
              </div>
              <div>
                <p className="text-brand-200">D-Day</p>
                <p className="font-bold text-xl">
                  {getDaysUntilMoveIn(selectedContract.dates.moveInDate) > 0
                    ? `D-${getDaysUntilMoveIn(selectedContract.dates.moveInDate)}`
                    : getDaysUntilMoveIn(selectedContract.dates.moveInDate) === 0
                    ? 'D-Day'
                    : `D+${Math.abs(getDaysUntilMoveIn(selectedContract.dates.moveInDate))}`}
                </p>
              </div>
            </div>
          </div>

          <TimelineView
            contract={selectedContract}
            onRefresh={() => refetchSelected()}
          />
        </div>
      )}

      {/* Contract List */}
      {view === 'list' && (
        <div className="space-y-4 animate-fade-in">
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-slate-500 mt-2">{t('timeline_loading')}</p>
            </div>
          )}

          {/* Active Contract Highlight */}
          {activeContract && (
            <div
              onClick={() => handleSelectContract(activeContract.id)}
              className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-brand-100 text-xs font-bold uppercase">{t('timeline_active_contract')}</p>
                  <h3 className="text-lg font-bold mt-1">{activeContract.property.address}</h3>
                </div>
                <ChevronRight size={20} className="text-brand-200" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-brand-200" />
                  <span className="text-sm">
                    D-{getDaysUntilMoveIn(activeContract.dates.moveInDate)}
                  </span>
                </div>
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all"
                    style={{ width: `${getTimelineProgress(activeContract.timeline).percentage}%` }}
                  />
                </div>
                <span className="text-sm font-bold">
                  {getTimelineProgress(activeContract.timeline).percentage}%
                </span>
              </div>

              <p className="text-brand-100 text-sm">
                {getTimelineProgress(activeContract.timeline).completed} {t('timeline_of')} {getTimelineProgress(activeContract.timeline).total} {t('timeline_tasks_complete')}
              </p>
            </div>
          )}

          {/* Other Contracts */}
          {contracts?.filter(c => c.id !== activeContract?.id).map((contract) => {
            const progress = getTimelineProgress(contract.timeline);
            return (
              <div
                key={contract.id}
                onClick={() => handleSelectContract(contract.id)}
                className="bg-white p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      contract.status === 'completed' ? 'bg-green-100 text-green-700' :
                      contract.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {contract.status.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">
                      {contract.contractType.toUpperCase()}
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>

                <h3 className="font-bold text-slate-800 mb-1">{contract.property.address}</h3>
                <p className="text-sm text-slate-500 mb-3">
                  {contract.property.propertyType} - {contract.property.areaSquareMeters}sqm
                </p>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">
                    {t('timeline_move_in')}: {contract.dates.moveInDate}
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatKRW(contract.financials.totalPrice)}
                  </span>
                </div>

                {contract.status !== 'completed' && contract.status !== 'cancelled' && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-brand-600 h-1.5 rounded-full"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{progress.percentage}%</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {!isLoading && (!contracts || contracts.length === 0) && (
            <div className="bg-gray-50 p-8 rounded-xl text-center">
              <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-slate-600 font-medium">{t('timeline_no_contracts')}</p>
              <p className="text-sm text-slate-400 mt-1 mb-4">
                {t('timeline_create_first')}
              </p>
              <button
                onClick={() => setView('create')}
                className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition"
              >
                {t('timeline_create_contract')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
