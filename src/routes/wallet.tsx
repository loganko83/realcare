/**
 * DID Wallet Page
 * Manage decentralized identity and blockchain credentials
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Wallet,
  Shield,
  FileCheck,
  Plus,
  Copy,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Key,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { apiClient } from '@/lib/api/client';

interface DIDWallet {
  did: string;
  public_key: string;
  created_at: string;
  is_verified: boolean;
}

interface Credential {
  id: string;
  type: string;
  issuer: string;
  issued_at: string;
  expires_at?: string;
  status: 'valid' | 'expired' | 'revoked';
  data: Record<string, any>;
}

interface ContractVerification {
  id: string;
  contract_hash: string;
  tx_hash: string;
  block_number: number;
  verified_at: string;
  status: 'verified' | 'pending' | 'failed';
}

interface WalletData {
  wallet?: DIDWallet;
  credentials: Credential[];
  verifications: ContractVerification[];
}

export const Route = createFileRoute('/wallet')({
  component: WalletPage,
});

function WalletPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'wallet' | 'credentials' | 'contracts'>('wallet');
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<WalletData>({
    queryKey: ['wallet'],
    queryFn: async () => {
      const [wallet, credentials, verifications] = await Promise.all([
        apiClient.fetch('/did/wallet').catch(() => null),
        apiClient.fetch('/did/credentials').catch(() => ({ items: [] })),
        apiClient.fetch('/blockchain/verifications').catch(() => ({ items: [] })),
      ]);
      return {
        wallet,
        credentials: credentials?.items || [],
        verifications: verifications?.items || [],
      };
    },
  });

  const createWalletMutation = useMutation({
    mutationFn: async () => {
      return apiClient.fetch('/did/create', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  const handleCopyDID = () => {
    if (data?.wallet?.did) {
      navigator.clipboard.writeText(data.wallet.did);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateDID = (did: string) => {
    if (did.length <= 30) return did;
    return `${did.slice(0, 20)}...${did.slice(-10)}`;
  };

  const getCredentialIcon = (type: string) => {
    switch (type) {
      case 'identity':
        return <Fingerprint className="w-5 h-5" />;
      case 'license':
        return <FileCheck className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-6 py-8">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate({ to: '/' })}
              className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">DID Wallet</h1>
              <p className="text-purple-200">Decentralized Identity</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 -mt-4">
          <div className="bg-white rounded-xl p-1 flex gap-1 shadow-sm">
            {[
              { key: 'wallet', label: 'Wallet' },
              { key: 'credentials', label: 'Credentials' },
              { key: 'contracts', label: 'Contracts' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Wallet Tab */}
              {activeTab === 'wallet' && (
                <div className="space-y-4">
                  {data?.wallet ? (
                    <>
                      {/* DID Card */}
                      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-gray-400 text-sm">Your DID</span>
                          {data.wallet.is_verified && (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                          <p className="font-mono text-sm flex-1 break-all">
                            {truncateDID(data.wallet.did)}
                          </p>
                          <button
                            onClick={handleCopyDID}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            {copied ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">
                            Created {new Date(data.wallet.created_at).toLocaleDateString('ko-KR')}
                          </span>
                          <span className="text-gray-400">Xphere Mainnet</span>
                        </div>
                      </div>

                      {/* Wallet Actions */}
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setActiveTab('credentials')}
                          className="bg-white rounded-xl p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <Shield className="w-8 h-8 text-indigo-600 mb-2" />
                          <p className="font-medium text-gray-900">Credentials</p>
                          <p className="text-sm text-gray-500">
                            {data.credentials.length} issued
                          </p>
                        </button>
                        <button
                          onClick={() => setActiveTab('contracts')}
                          className="bg-white rounded-xl p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <FileCheck className="w-8 h-8 text-green-600 mb-2" />
                          <p className="font-medium text-gray-900">Contracts</p>
                          <p className="text-sm text-gray-500">
                            {data.verifications.length} verified
                          </p>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Key className="w-10 h-10 text-indigo-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Create Your DID Wallet
                      </h2>
                      <p className="text-gray-500 mb-6">
                        Get your decentralized identity to securely manage
                        contracts and credentials on the blockchain.
                      </p>
                      <button
                        onClick={() => createWalletMutation.mutate()}
                        disabled={createWalletMutation.isPending}
                        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
                      >
                        {createWalletMutation.isPending ? 'Creating...' : 'Create DID Wallet'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Credentials Tab */}
              {activeTab === 'credentials' && (
                <div className="space-y-4">
                  {data?.credentials.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h2 className="text-lg font-bold text-gray-900 mb-2">
                        No Credentials Yet
                      </h2>
                      <p className="text-gray-500 mb-6">
                        Credentials are issued when you verify your identity
                        or complete important actions.
                      </p>
                    </div>
                  ) : (
                    data?.credentials.map((cred) => (
                      <div
                        key={cred.id}
                        className="bg-white rounded-xl p-4 flex items-center gap-4"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          cred.status === 'valid' ? 'bg-green-100 text-green-600' :
                          cred.status === 'expired' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {getCredentialIcon(cred.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 capitalize">
                            {cred.type} Credential
                          </h3>
                          <p className="text-sm text-gray-500">
                            Issued by {cred.issuer}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          cred.status === 'valid' ? 'bg-green-100 text-green-700' :
                          cred.status === 'expired' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {cred.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Contracts Tab */}
              {activeTab === 'contracts' && (
                <div className="space-y-4">
                  {data?.verifications.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h2 className="text-lg font-bold text-gray-900 mb-2">
                        No Verified Contracts
                      </h2>
                      <p className="text-gray-500 mb-6">
                        When you sign contracts, they will be verified
                        on the blockchain and appear here.
                      </p>
                      <button
                        onClick={() => navigate({ to: '/contract' })}
                        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                      >
                        Verify a Contract
                      </button>
                    </div>
                  ) : (
                    data?.verifications.map((verification) => (
                      <div
                        key={verification.id}
                        className="bg-white rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {verification.status === 'verified' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : verification.status === 'pending' ? (
                              <Clock className="w-5 h-5 text-yellow-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className="font-medium text-gray-900 capitalize">
                              {verification.status}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(verification.verified_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Contract Hash</span>
                            <span className="font-mono text-gray-700">
                              {verification.contract_hash.slice(0, 10)}...
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Block</span>
                            <span className="font-mono text-gray-700">
                              #{verification.block_number}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(`https://explorer.x-phere.com/tx/${verification.tx_hash}`, '_blank')}
                          className="mt-3 w-full py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors text-sm"
                        >
                          View on Explorer
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
