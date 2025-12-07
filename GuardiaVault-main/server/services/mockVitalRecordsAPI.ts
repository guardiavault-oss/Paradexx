/**
 * Mock Government Vital Records API
 * 
 * This service mocks government vital records APIs for testing until
 * partnerships with actual providers are established.
 * 
 * In production, this would be replaced with:
 * - VitalChek API integration
 * - State-specific vital records APIs
 * - Third-party aggregator APIs
 */

import { logInfo, logError, logWarn } from "./logger";

export interface VitalRecordsRequest {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  state?: string;
  certificateNumber?: string;
}

export interface VitalRecordsResponse {
  found: boolean;
  certificateNumber?: string;
  deathDate?: string;
  deathLocation?: string;
  causeOfDeath?: string; // May be redacted
  registrationDate?: string;
  state?: string;
  confidence?: number;
  error?: string;
}

/**
 * Mock death certificate database
 * In production, this would query real APIs
 */
const mockDeathDatabase: Record<string, VitalRecordsResponse> = {
  // Example: "John Doe" with DOB "1980-01-01" and death "2024-01-15"
  "john-doe-1980-01-01": {
    found: true,
    certificateNumber: "DC-2024-001234",
    deathDate: "2024-01-15",
    deathLocation: "Los Angeles, CA",
    causeOfDeath: "Natural causes", // Redacted in production
    registrationDate: "2024-01-20",
    state: "CA",
    confidence: 1.0,
  },
  // Add more test cases as needed
};

export class MockVitalRecordsAPI {
  private apiKey: string;
  private apiUrl: string;
  private useMock: boolean;

  constructor() {
    this.apiKey = process.env.VITAL_RECORDS_API_KEY || "";
    this.apiUrl = process.env.VITAL_RECORDS_API_URL || "https://api.vitalrecords.mock";
    
    // Use mock if no API key is configured or if explicitly enabled
    this.useMock = !this.apiKey || process.env.USE_MOCK_VITAL_RECORDS === "true";
    
    if (this.useMock) {
      logWarn("Using mock vital records API - set VITAL_RECORDS_API_KEY to use real API");
    }
  }

  /**
   * Query death certificate by name and DOB
   */
  async queryDeathCertificate(
    request: VitalRecordsRequest
  ): Promise<VitalRecordsResponse> {
    logInfo("Querying death certificate", {
      name: `${request.firstName} ${request.lastName}`,
      useMock: this.useMock,
    });

    if (this.useMock) {
      return this.queryMockDatabase(request);
    }

    // In production, make actual API call
    return await this.queryRealAPI(request);
  }

  /**
   * Query mock database (for testing)
   */
  private queryMockDatabase(
    request: VitalRecordsRequest
  ): VitalRecordsResponse {
    // Create lookup key from name and DOB
    const nameKey = `${request.firstName.toLowerCase()}-${request.lastName.toLowerCase()}`;
    const dobKey = request.dateOfBirth?.replace(/-/g, "-") || "";
    const lookupKey = `${nameKey}-${dobKey}`;

    // Check mock database
    const record = mockDeathDatabase[lookupKey];

    if (record) {
      logInfo("Death certificate found in mock database", { lookupKey });
      return record;
    }

    // If not found, check if we should simulate a delay for pending certificates
    // This simulates the real-world scenario where certificates may take time to process
    if (request.dateOfDeath && this.isRecentDeath(request.dateOfDeath)) {
      logWarn("Recent death detected but certificate not yet processed", {
        lookupKey,
        dateOfDeath: request.dateOfDeath,
      });
      return {
        found: false,
        error: "Certificate processing in progress. Please check again in 2-10 business days.",
      };
    }

    logInfo("Death certificate not found in mock database", { lookupKey });
    return {
      found: false,
      error: "No death certificate found matching the provided information.",
    };
  }

  /**
   * Query real government API
   */
  private async queryRealAPI(
    request: VitalRecordsRequest
  ): Promise<VitalRecordsResponse> {
    try {
      // This would call the actual VitalChek or state API
      // For now, this is a placeholder that would be implemented when partnerships are established
      
      const axios = (await import("axios")).default;
      
      const response = await axios.post(
        `${this.apiUrl}/death-records/search`,
        {
          firstName: request.firstName,
          lastName: request.lastName,
          dateOfBirth: request.dateOfBirth,
          dateOfDeath: request.dateOfDeath,
          state: request.state,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      if (response.data?.records && response.data.records.length > 0) {
        const record = response.data.records[0];
        return {
          found: true,
          certificateNumber: record.certificateNumber,
          deathDate: record.deathDate,
          deathLocation: record.deathLocation,
          causeOfDeath: record.causeOfDeath,
          registrationDate: record.registrationDate,
          state: record.state,
          confidence: 1.0,
        };
      }

      return {
        found: false,
        error: "No death certificate found",
      };
    } catch (error: any) {
      logError(error, { type: "vital_records_api_query" });
      
      // If API fails, fall back to mock for development
      if (process.env.NODE_ENV === "development") {
        logWarn("API query failed, falling back to mock", { error: error.message });
        return this.queryMockDatabase(request);
      }

      return {
        found: false,
        error: error.message || "API query failed",
      };
    }
  }

  /**
   * Check if death date is recent (within last 30 days)
   */
  private isRecentDeath(deathDate: string): boolean {
    const death = new Date(deathDate);
    const now = new Date();
    const daysDiff = (now.getTime() - death.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff < 30;
  }

  /**
   * Add mock record for testing
   */
  addMockRecord(key: string, record: VitalRecordsResponse): void {
    mockDeathDatabase[key] = record;
    logInfo("Mock record added", { key });
  }

  /**
   * Clear all mock records
   */
  clearMockRecords(): void {
    Object.keys(mockDeathDatabase).forEach(key => delete mockDeathDatabase[key]);
    logInfo("Mock records cleared");
  }
}

// Export singleton instance
export const mockVitalRecordsAPI = new MockVitalRecordsAPI();
export default mockVitalRecordsAPI;






