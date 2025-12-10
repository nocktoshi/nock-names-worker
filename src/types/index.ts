export interface Env {
	REGISTRY_KV: KVNamespace;
}

export interface RegisterRequest {
	address: string;
	name: string;
}

export interface VerifyRequest {
	address: string;
	name: string;
	txHash: string;
	adminCode?: string;
}

export interface Registration {
	address: string;
	name: string;
	status: 'pending' | 'registered';
	timestamp: number;
	date?: string;
	txHash?: string;
}
export interface Transaction {
	version: number;
	id: string;
	totalSize: number;
	outputs: Array<{
		firstName: string;
		lastName: string;
		seeds: Array<{
			isCoinbase: boolean;
			lockRoot: string;
			noteData: {
				lock: {
					data: Array<{
						pkh: {
							h: string[];
							m: number;
						};
					}>;
					version: number;
				};
				memo?: string;
			};
			gift: number;
			parentHash: string;
		}>;
	}>;
	spends: Array<{
		firstName: string;
		lastName: string;
		version: string;
		witness: {
			lockMerkleProof: {
				spendCondition: Array<{
					pkh: {
						m: number;
						h: string[];
					};
				}>;
				axis: number;
				merkleProofRoot: string;
				merkleProofPath: string[];
			};
			pkhSignature: Array<{
				pubkey: string;
				chal: string[];
				sig: string[];
			}>;
			hax: Record<string, unknown>;
			tim: number;
		};
		seeds: Array<{
			isCoinbase: boolean;
			lockRoot: string;
			noteData: {
				lock: {
					data: Array<{
						pkh: {
							h: string[];
							m: number;
						};
					}>;
					version: number;
				};
				memo?: string;
			};
			gift: number;
			parentHash: string;
		}>;
		fee: number;
	}>;
	blockId: string;
}
