/**
 * Type declarations for @simplewebauthn/browser
 */

declare module "@simplewebauthn/typescript-types" {
  export interface PublicKeyCredentialCreationOptionsJSON {
    challenge: string;
    rp: {
      name: string;
      id?: string;
    };
    user: {
      id: string;
      name: string;
      displayName: string;
    };
    pubKeyCredParams: Array<{
      type: "public-key";
      alg: number;
    }>;
    timeout?: number;
    attestation?: AttestationConveyancePreference;
    excludeCredentials?: Array<{
      id: string;
      type: "public-key";
      transports?: AuthenticatorTransport[];
    }>;
    authenticatorSelection?: {
      authenticatorAttachment?: AuthenticatorAttachment;
      userVerification?: UserVerificationRequirement;
      requireResidentKey?: boolean;
    };
    extensions?: Record<string, any>;
  }

  export interface PublicKeyCredentialRequestOptionsJSON {
    challenge: string;
    timeout?: number;
    rpId?: string;
    allowCredentials?: Array<{
      id: string;
      type: "public-key";
      transports?: AuthenticatorTransport[];
    }>;
    userVerification?: UserVerificationRequirement;
    extensions?: Record<string, any>;
  }
}

declare module "@web3modal/wagmi/react" {
  import type { WagmiConfigType } from "@wagmi/core";
  
  export function createWeb3Modal(config: {
    wagmiConfig: any;
    projectId: string;
    chains: any[];
    themeMode?: string;
    themeVariables?: Record<string, string>;
  }): any;
  
  export function defaultWagmiConfig(config: {
    chains: any[];
    projectId: string;
    metadata: any;
  }): any;
}

