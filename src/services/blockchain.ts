import axios from 'axios';
import { Transaction } from '../types';
import { PAYMENT_ADDRESS } from '../utils/constants';

export class BlockchainService {
	async fetchTransaction(txHash: string): Promise<Transaction | null> {
		try {
			const response = await axios.post(
				'https://nockblocks.com/rpc',
				{
					jsonrpc: '2.0',
					method: 'getTransactionById',
					params: [{ id: txHash }],
					id: `${Date.now()}`,
				},
				{
					headers: { accept: 'application/json' },
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
		const paymentOutput = transaction.outputs?.find((output: any) => 
			output.seeds?.some((seed: any) => 
				seed.noteData?.lock?.data?.some((lockData: any) => 
					lockData?.pkh?.h?.includes(PAYMENT_ADDRESS)
				) ?? false
			) ?? false
		);

		if (paymentOutput?.seeds?.[0]) {
			return paymentOutput.seeds[0].gift / 65536;
		}
		return 0;
	}
}
