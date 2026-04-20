import { RegistryService } from '../services/registry';
import { BlockchainService } from '../services/blockchain';
import { corsHeaders, getFee, PAYMENT_ADDRESS } from '../utils/constants';
import { VerifyRequest } from '../types';

export async function handleVerify(
	request: Request,
	registryService: RegistryService,
	blockchainService: BlockchainService
): Promise<Response> {
	const { address, name } = (await request.json()) as VerifyRequest;

	try {
		// Check pending registration
		const pending = await registryService.getPendingName(name);
		if (!pending) {
			return new Response(JSON.stringify({ error: 'No pending registration found' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Ensure the pending registration belongs to the provided address.
		if (pending.address !== address) {
			return new Response(JSON.stringify({ error: 'Pending registration does not match provided address.' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Check if already verified
		const existing = await registryService.getRegisteredName(name);
		if (existing) {
			return new Response(JSON.stringify({ error: 'Name already registered' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Find a valid payment transaction *to* the payment address.
		// We query by PAYMENT_ADDRESS (not the user's address) because the destination can be hidden.
		const requiredFee = getFee(name);
		const txs = await blockchainService.getTransactionsByAddress(PAYMENT_ADDRESS, 50, 0, address);

		let txHash: string | null = null;
		let transaction = null as any;

		for (const tx of txs.transactions ?? []) {
			if (!tx?.id) continue;

			// Prevent replay attacks: skip txs that were already used.
			if (await registryService.hasPaymentBeenUsed(tx.id)) continue;

			// Ensure the tx pays at least the required fee to the payment address (and is actually an incoming payment).
			const paymentAmount = blockchainService.getPaymentAmount(tx);
			if (paymentAmount < requiredFee) continue;

			txHash = tx.id;
			transaction = tx;
			break;
		}

		if (!txHash || !transaction) {
			return new Response(JSON.stringify({ error: 'No valid payment transaction found for this address.' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Claim the tx hash immediately to minimize the race window with concurrent requests.
		if (await registryService.hasPaymentBeenUsed(txHash)) {
			return new Response(JSON.stringify({ error: 'Transaction already used for registration.' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const asOf = Date.now();
		const registration = {
			address,
			name,
			status: 'registered' as const,
			timestamp: asOf,
			date: new Date(asOf).toISOString(),
			txHash,
		};

		await registryService.recordPayment(txHash, registration);
		await registryService.registerName(name, address, txHash, asOf);
		await registryService.deletePendingRegistration(name);

		return new Response(JSON.stringify({ message: 'Registration successful!', registration }), {
			status: 200,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return new Response(JSON.stringify({ error: 'Error verifying transaction: ' + errorMessage }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}
}
