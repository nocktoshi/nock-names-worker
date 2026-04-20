import { Registration, Env } from '../types';

export class RegistryService {
	constructor(private kv: KVNamespace) {}

	private normalizeEpochMs(ts: number): number {
		// If someone accidentally passes seconds since epoch, convert to ms.
		return ts < 1_000_000_000_000 ? ts * 1000 : ts;
	}

	async getRegisteredName(name: string): Promise<Registration | null> {
		return await this.kv.get(`name:${name}`, { type: 'json' });
	}

	async getRegisteredAddress(address: string): Promise<Registration | null> {
		return await this.kv.get(`address:${address}`, { type: 'json' });
	}

	async getPendingName(name: string): Promise<Registration | null> {
		return await this.kv.get(`pending:${name}`, { type: 'json' });
	}

	async createPendingRegistration(name: string, address: string): Promise<void> {
		const key = `pending:${name}`;
		await this.kv.put(
			key,
			JSON.stringify({
				address,
				name,
				status: 'pending',
				timestamp: Date.now(),
			} as Registration),
			{ expirationTtl: 604800 } // 1 week
		);
	}

	async registerName(name: string, address: string, txHash: string, timestamp?: number): Promise<void> {
		const ts = typeof timestamp === 'number' ? this.normalizeEpochMs(timestamp) : Date.now();
		await this.kv.put(
			`name:${name}`,
			JSON.stringify({
				address,
				name,
				status: 'registered',
				timestamp: ts,
				date: new Date(ts).toISOString(),
				txHash,
			} as Registration)
		);
	}

	async recordPayment(txHash: string, registration: Registration): Promise<void> {
		await this.kv.put(`payment:${txHash}`, JSON.stringify(registration));
	}

	async deletePendingRegistration(name: string): Promise<void> {
		const key = `pending:${name}`;
		await this.kv.delete(key);
	}

	async listPendingRegistrations(): Promise<Registration[]> {
		const keys = await this.kv.list({ prefix: 'pending:', limit: 100 });
		if (keys.keys.length === 0) return [];

		const values = await this.kv.get(
			keys.keys.map((key) => key.name),
			{ type: 'json' }
		);
		return Array.from(values.values()) as Registration[];
	}

	async listRegisteredNames(): Promise<Registration[]> {
		const keys = await this.kv.list({ prefix: 'name:', limit: 100 });
		if (keys.keys.length === 0) return [];

		const values = await this.kv.get(
			keys.keys.map((key) => key.name),
			{ type: 'json' }
		);
		return Array.from(values.values()) as Registration[];
	}

	async hasPaymentBeenUsed(txHash: string): Promise<boolean> {
		const existing = await this.kv.get(`payment:${txHash}`);
		return existing !== null;
	}

	async getRegistration(name: string): Promise<Registration | null> {
		return await this.kv.get(`name:${name}`, { type: 'json' });
	}
}
