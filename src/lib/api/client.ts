/**
 * API Client for RealCare Backend
 */

const API_BASE_URL = import.meta.env.PROD
  ? '/real/api/v1'
  : 'http://localhost:8092/api/v1';

interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    // Load tokens from localStorage
    this.accessToken = localStorage.getItem('realcare_access_token');
    this.refreshToken = localStorage.getItem('realcare_refresh_token');
  }

  setTokens(tokens: TokenPair) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    localStorage.setItem('realcare_access_token', tokens.access_token);
    localStorage.setItem('realcare_refresh_token', tokens.refresh_token);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('realcare_access_token');
    localStorage.removeItem('realcare_refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    // If refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Create a new refresh promise
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh?refresh_token=${this.refreshToken}`, {
          method: 'POST',
        });

        if (response.ok) {
          const tokens: TokenPair = await response.json();
          this.setTokens(tokens);
          return true;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }

      this.clearTokens();
      return false;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      // Clear the promise after completion
      this.refreshPromise = null;
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    const headers = new Headers(fetchOptions.headers);

    if (!headers.has('Content-Type') && fetchOptions.body) {
      headers.set('Content-Type', 'application/json');
    }

    if (!skipAuth && this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    let response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && !skipAuth && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers.set('Authorization', `Bearer ${this.accessToken}`);
        response = await fetch(url, {
          ...fetchOptions,
          headers,
        });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.detail || errorData.message || 'API Error',
        errorData
      );
    }

    return response.json();
  }

  // Convenience methods
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    apiClient.post<{ id: string; email: string; name: string }>('/auth/register', data, { skipAuth: true }),

  login: (email: string, password: string) =>
    apiClient.post<TokenPair>('/auth/login/json', { email, password }, { skipAuth: true }),

  logout: () => {
    apiClient.clearTokens();
    return Promise.resolve();
  },

  getMe: () =>
    apiClient.get<{ id: string; email: string; name: string; role: string }>('/auth/me'),

  refresh: (refreshToken: string) =>
    apiClient.post<TokenPair>('/auth/refresh', null, { skipAuth: true }),
};

// Reality Check API
export const realityApi = {
  calculate: (data: {
    target_price: number;
    region: string;
    annual_income: number;
    cash_available: number;
    existing_debt?: number;
    is_first_home?: boolean;
    house_count?: number;
  }) => apiClient.post<{
    score: number;
    grade: string;
    breakdown: {
      ltv_score: number;
      dsr_score: number;
      cash_gap_score: number;
      stability_score: number;
    };
    analysis: {
      target_price: number;
      max_loan_by_ltv: number;
      max_loan_by_dsr: number;
      max_loan_amount: number;
      required_cash: number;
      gap_amount: number;
      monthly_repayment: number;
      dsr_percentage: number;
      applicable_ltv: number;
    };
    risks: Array<{
      type: string;
      title: string;
      message: string;
      suggestion?: string;
    }>;
    region: {
      name: string;
      is_speculative_zone: boolean;
      is_adjusted_zone: boolean;
      max_ltv: number;
    };
  }>('/reality/calculate', data),

  getReports: (limit?: number, offset?: number) =>
    apiClient.get(`/reality/reports?limit=${limit || 10}&offset=${offset || 0}`),
};

// Health Check
export const healthApi = {
  check: () => apiClient.get<{ status: string; service: string }>('/health'),
};

export default apiClient;
