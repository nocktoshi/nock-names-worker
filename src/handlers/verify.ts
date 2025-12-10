import { RegistryService } from '../services/registry';
import { BlockchainService } from '../services/blockchain';
import { corsHeaders, getFee } from '../utils/constants';
import { VerifyRequest } from '../types';

export async function handleVerify(
	request: Request,
	registryService: RegistryService,
	blockchainService: BlockchainService
): Promise<Response> {
	const { address, name, txHash } = (await request.json()) as VerifyRequest;

	try {
		// Check pending registration
		const pending = await registryService.getPendingName(name);
		if (!pending) {
			return new Response(JSON.stringify({ error: 'No pending registration found' }), {
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

		// Verify transaction
		const transaction = await blockchainService.fetchTransaction(txHash);
		if (!transaction) {
			return new Response(JSON.stringify({ error: 'Invalid transaction' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Verify transaction sender
		if (!blockchainService.verifyTransactionSender(transaction, address)) {
			return new Response(JSON.stringify({ error: 'Transaction does not match provided address.' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Verify payment amount
		const paymentAmount = blockchainService.getPaymentAmount(transaction);
		const requiredFee = getFee(name);
		if (paymentAmount < requiredFee) {
			return new Response(JSON.stringify({ error: 'Incorrect payment amount.' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Check if payment was already used
		if (await registryService.hasPaymentBeenUsed(txHash)) {
			return new Response(JSON.stringify({ error: 'Transaction already used for registration.' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Record payment and registration
		await registryService.recordPayment(txHash, {
			address,
			name,
			status: 'registered',
			timestamp: Date.now(),
			date: new Date().toISOString(),
			txHash,
		});

		await registryService.registerName(name, address, txHash);
		await registryService.deletePendingRegistration(name);

		return new Response(JSON.stringify({ message: 'Registration successful!' }), {
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
