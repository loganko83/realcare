/**
 * Share Utilities
 * URL-based state encoding/decoding for sharing calculator results
 */

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export interface ShareableState {
  region: string;
  targetPrice: number; // in millions
  annualIncome: number; // in millions
  cashAvailable: number; // in millions
  existingDebt: number; // in millions
  isFirstHome: boolean;
  houseCount: number;
}

/**
 * Encode state to URL-safe string
 */
export function encodeStateToUrl(state: ShareableState): string {
  try {
    const json = JSON.stringify(state);
    return compressToEncodedURIComponent(json);
  } catch {
    // Fallback to base64 if lz-string fails
    return btoa(JSON.stringify(state));
  }
}

/**
 * Decode state from URL string
 */
export function decodeStateFromUrl(encoded: string): ShareableState | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (json) {
      return JSON.parse(json) as ShareableState;
    }
    // Fallback to base64
    return JSON.parse(atob(encoded)) as ShareableState;
  } catch {
    return null;
  }
}

/**
 * Generate shareable URL
 */
export function generateShareUrl(state: ShareableState): string {
  const encoded = encodeStateToUrl(state);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?share=${encoded}`;
}

/**
 * Parse share parameter from current URL
 */
export function parseShareFromUrl(): ShareableState | null {
  const params = new URLSearchParams(window.location.search);
  const share = params.get('share');
  if (share) {
    return decodeStateFromUrl(share);
  }
  return null;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Share via Web Share API (mobile)
 */
export async function shareViaWebShare(
  title: string,
  text: string,
  url: string
): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Share via KakaoTalk
 */
export function shareViaKakao(
  title: string,
  description: string,
  url: string,
  imageUrl?: string
): void {
  // Check if Kakao SDK is loaded
  const kakao = (window as unknown as { Kakao?: KakaoSDK }).Kakao;
  if (!kakao) {
    console.warn('Kakao SDK not loaded');
    return;
  }

  if (!kakao.isInitialized()) {
    // Initialize with your app key (should be in env)
    const appKey = import.meta.env.VITE_KAKAO_JS_KEY;
    if (appKey) {
      kakao.init(appKey);
    } else {
      console.warn('Kakao JS key not configured');
      return;
    }
  }

  kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title,
      description,
      imageUrl: imageUrl || 'https://trendy.storydot.kr/real/og-image.png',
      link: {
        mobileWebUrl: url,
        webUrl: url,
      },
    },
    buttons: [
      {
        title: 'Check Your Score',
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
    ],
  });
}

// Kakao SDK type definitions
interface KakaoSDK {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendDefault: (options: KakaoShareOptions) => void;
  };
}

interface KakaoShareOptions {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons?: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
}

/**
 * Generate OG meta description for sharing
 */
export function generateShareDescription(state: ShareableState, score?: number): string {
  const price = (state.targetPrice / 10000).toFixed(1);
  const scoreText = score !== undefined ? `Reality Score: ${score}` : '';
  return `Property: ${price}억원 | Income: ${(state.annualIncome / 10000).toFixed(1)}억원 | ${scoreText}`;
}
