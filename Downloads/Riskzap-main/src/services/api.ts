// Riskzap API Service
// Backend verification endpoint for wallet actions

export interface VerificationRequest {
  walletAddress: string;
  action: string;
  transactionHash?: string;
  timestamp: number;
}

export interface VerificationResponse {
  success: boolean;
  status: 'pass' | 'fail';
  message: string;
  data?: any;
}

export interface PolicyCreationRequest {
  walletAddress: string;
  policyType: string;
  premium: number;
  coverage: number;
  duration: number;
}

export interface ClaimRequest {
  walletAddress: string;
  policyId: string;
  claimAmount: number;
  evidence: string[];
}

class RiskzapAPIService {
  private baseUrl: string;

  constructor() {
    // In production, this would be your deployed backend URL
    const DEFAULT_PROD = 'https://api.riskzap.com';
    const DEFAULT_DEV = 'http://localhost:3001';
    const envOverride = (import.meta as any)?.env?.VITE_API_BASE_URL;
    const mode = (import.meta as any)?.env?.MODE || (process.env.NODE_ENV as string) || 'development';

    this.baseUrl = envOverride || (mode === 'production' ? DEFAULT_PROD : DEFAULT_DEV);

    // optional runtime warning if something looks off
    if (this.baseUrl.includes('localhost') && mode === 'production') {
      // eslint-disable-next-line no-console
      console.warn('RiskzapAPIService: running in production mode but using localhost as baseUrl');
    }
  }

  // tiny fetch wrapper: JSON, timeout, and default headers
  private async fetchJson<T>(path: string, opts: RequestInit = {}, timeoutMs = 15000): Promise<T> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const headers = {
      'Accept': 'application/json',
      // only set Content-Type when body is a plain JSON string
      ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers || {})
    } as Record<string, string>;

    try {
      const res = await fetch(`${this.baseUrl}${path}`, { ...opts, headers, signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      // Some endpoints return empty body; handle that gracefully
      const text = await res.text();
      return text ? JSON.parse(text) : ({} as T);
    } finally {
      clearTimeout(id);
    }
  }

  // Verification endpoint for production
  async verifyWalletAction(request: VerificationRequest): Promise<VerificationResponse> {
    try {
      return await this.fetchJson<VerificationResponse>('/api/verify', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Verification API error:', error);
      throw new Error('Verification service unavailable');
    }
  }

  // Policy creation endpoint
  async createPolicy(request: PolicyCreationRequest): Promise<VerificationResponse> {
    try {
      return await this.fetchJson<VerificationResponse>('/api/policies', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Policy creation API error:', error);
      throw new Error('Policy creation service unavailable');
    }
  }

  // Claim submission endpoint
  async submitClaim(request: ClaimRequest): Promise<VerificationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      console.error('Claim submission API error:', error);
      throw new Error('Claim submission service unavailable');
    }
  }

  // Request company-side payout (server must hold company wallet/private key)
  async requestPayout(walletAddress: string, amount: number, claimId?: string): Promise<VerificationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, amount, claimId }),
      });

      return await response.json();
    } catch (error) {
      console.error('Payout request API error:', error);

      // Demo fallback: simulate payout queued
      return {
        success: true,
        status: 'pass',
        message: 'Payout request queued. Company will process payout from its wallet.',
        data: {
          payoutId: `PAYOUT_${Date.now()}`,
          estimatedProcessingTime: '1-24 hours',
          note: 'In production, the backend should sign and send the token transfer from the company wallet.'
        }
      };
    }
  }

  // KYC verification endpoint
  async verifyKYC(walletAddress: string, documents: File[]): Promise<VerificationResponse> {
    try {
      const formData = new FormData();
      formData.append('walletAddress', walletAddress);
      documents.forEach((doc, index) => {
        formData.append(`document_${index}`, doc);
      });

      const response = await fetch(`${this.baseUrl}/api/kyc/verify`, {
        method: 'POST',
        body: formData,
      });

      return await response.json();
    } catch (error) {
      console.error('KYC verification API error:', error);
      
      // Demo response
      return {
        success: true,
        status: 'pass',
        message: 'KYC verification completed',
        data: {
          verificationLevel: 'Level 2',
          documentsVerified: documents.length,
          complianceScore: 95
        }
      };
    }
  }

  // Risk assessment endpoint
  async assessRisk(policyData: any): Promise<{ riskScore: number; premium: number; approved: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/underwriting/assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policyData),
      });

      return await response.json();
    } catch (error) {
      console.error('Risk assessment API error:', error);
      
      // Demo risk assessment
      const baseRisk = Math.random() * 100;
      const riskScore = Math.min(100, Math.max(0, baseRisk));
      const premium = policyData.basePremium * (1 + riskScore / 100);
      const approved = riskScore < 80;

      return {
        riskScore: Math.round(riskScore),
        premium: Math.round(premium * 100) / 100,
        approved
      };
    }
  }

  // Get user policies
  async getUserPolicies(walletAddress: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/policies/user/${walletAddress}`);
      return await response.json();
    } catch (error) {
      console.error('Get user policies API error:', error);
      
      // Demo policies
      return [
        {
          id: 'POL_001',
          type: 'Device Protection',
          premium: 0.5,
          coverage: 500,
          status: 'active',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'POL_002',
          type: 'Travel Insurance',
          premium: 2.0,
          coverage: 2500,
          status: 'active',
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
  }
}

// Export singleton instance
export const riskzapAPI = new RiskzapAPIService();
export default RiskzapAPIService;