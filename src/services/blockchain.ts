import axios from 'axios';
import { Transaction } from '../types';
import { PAYMENT_ADDRESS, PAYMENT_FIRST_NAME } from '../utils/constants';

type GetTransactionsByAddressResult = {
	transactions: Transaction[];
	totalTransactions?: number;
	totalReceived?: number;
	totalSent?: number;
	currentBalance?: number;
	ownedFirstNames?: string[];
};

export type PaymentTransaction = Transaction & {
	/**
	 * Unique sender addresses inferred from spend witness signatures.
	 * (May be empty if the RPC response doesn't include witness signatures.)
	 */
	from: string[];
};

export class BlockchainService {
	constructor(private nockblocksApiKey?: string) {}

	private rpcHeaders(): Record<string, string> {
		const headers: Record<string, string> = { accept: 'application/json' };
		if (this.nockblocksApiKey) {
			headers.Authorization = `Bearer ${this.nockblocksApiKey}`;
		}
		return headers;
	}

	private getTransactionSenders(transaction: Transaction): string[] {
		const senders = new Set<string>();

		for (const spend of transaction.spends ?? []) {
			for (const sig of spend?.witness?.pkhSignature ?? []) {
				if (typeof sig?.pubkey === 'string' && sig.pubkey.length > 0) {
					senders.add(sig.pubkey);
				}
			}
		}

		return [...senders];
	}

	async fetchTransaction(txHash: string): Promise<Transaction | null> {
		try {
			const response = await axios.post(
				'https://nockblocks.com/rpc/v1',
				{
					jsonrpc: '2.0',
					method: 'getTransactionById',
					params: [{ id: txHash }],
					id: `${Date.now()}`,
				},
				{
					headers: this.rpcHeaders(),
				}
			);

			if (response.data?.result) {
				return response.data.result;
			}
			return null;
		} catch (error) {
			console.error('Error fetching transaction:', error);
			return null;
		}
	}

	verifyTransactionSender(transaction: Transaction, address: string): boolean {
		// Check spends for witness signatures matching the address
		return transaction.spends?.some((spend: any) => 
			spend.witness?.pkhSignature?.some((sig: any) => 
				sig.pubkey === address
			) ?? false
		) ?? false;
	}

	getPaymentAmount(transaction: Transaction): number {
		const paymentOutputs = (transaction.outputs ?? []).filter((output: any) => output?.firstName === PAYMENT_FIRST_NAME);

		let totalGift = 0;
		for (const output of paymentOutputs) {
			for (const seed of output?.seeds ?? []) {
				if (typeof seed?.gift === 'number') totalGift += seed.gift;
			}
		}

		return totalGift / 65536;
	}

	/**
	 * Fetch transactions involving a given address via nockblocks RPC.
	 */
	async getTransactionsByAddress(
		address: string,
		limit = 50,
		offset = 0,
		from?: string
	): Promise<GetTransactionsByAddressResult> {
		try {
			const response = await axios.post(
				'https://nockblocks.com/rpc/v1',
				{
					jsonrpc: '2.0',
					method: 'getTransactionsByAddress',
					params: [{ address, limit, offset }],
					id: `${Date.now()}`,
				},
				{
					headers: this.rpcHeaders(),
				}
			);

			if (response.data?.result?.transactions) {
				const result = response.data.result as GetTransactionsByAddressResult;

				// Optional: filter transactions by sender address using witness signatures from the
				// getTransactionsByAddress response payload.
				if (!from) return result;

				const filtered = (result.transactions ?? []).filter((tx) => this.verifyTransactionSender(tx, from));
				return { ...result, transactions: filtered };
			}

			return { transactions: [] };
		} catch (error) {
			console.error('Error fetching transactions by address:', error);
			return { transactions: [] };
		}
	}

	/**
	 * Returns transactions that paid TO the configured payment address.
	 */
	async getTransactions(limit = 50, offset = 0): Promise<PaymentTransaction[]> {
		const result = await this.getTransactionsByAddress(PAYMENT_ADDRESS, limit, offset);

		// Filter to transactions that contain an output for the payment address (i.e. incoming payments).
		const txs = (result.transactions ?? []).filter((transaction: Transaction) =>
			(transaction.outputs ?? []).some((output: any) => output?.firstName === PAYMENT_FIRST_NAME)
		);

		return txs.map((transaction) => ({
			...transaction,
			from: this.getTransactionSenders(transaction),
		}));
	}
}
