/**
 * Share Button Component
 * Provides multiple sharing options for Reality Check results
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Share2, Copy, Check, MessageCircle, Link2 } from 'lucide-react';
import {
  generateShareUrl,
  copyToClipboard,
  shareViaWebShare,
  shareViaKakao,
  generateShareDescription,
  type ShareableState,
} from '../../lib/utils/shareUtils';

interface ShareButtonProps {
  state: ShareableState;
  score?: number;
  className?: string;
}

export function ShareButton({ state, score, className = '' }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shareUrl = generateShareUrl(state);
  const shareTitle = 'My Reality Check Score';
  const shareDescription = generateShareDescription(state, score);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleShare = async () => {
    // Try native share first (mobile)
    const shared = await shareViaWebShare(shareTitle, shareDescription, shareUrl);
    if (!shared) {
      setShowMenu(true);
    }
  };

  const handleCopyLink = useCallback(async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleKakaoShare = () => {
    shareViaKakao(shareTitle, shareDescription, shareUrl);
    setShowMenu(false);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 text-brand-600 font-medium hover:bg-brand-100 transition"
      >
        <Share2 size={18} />
        Share
      </button>

      {/* Share Menu */}
      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
          >
            {copied ? (
              <Check size={18} className="text-green-500" />
            ) : (
              <Link2 size={18} className="text-slate-400" />
            )}
            <span className="text-sm font-medium text-slate-700">
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </button>

          <button
            onClick={handleKakaoShare}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
          >
            <MessageCircle size={18} className="text-yellow-500" />
            <span className="text-sm font-medium text-slate-700">KakaoTalk</span>
          </button>

          <div className="px-4 py-2 border-t border-gray-100 mt-2">
            <p className="text-xs text-slate-400 truncate">{shareUrl}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact share button for inline use
 */
export function ShareButtonCompact({ state, score }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareUrl = generateShareUrl(state);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 transition"
    >
      {copied ? (
        <>
          <Check size={14} />
          Copied!
        </>
      ) : (
        <>
          <Copy size={14} />
          Copy Link
        </>
      )}
    </button>
  );
}
