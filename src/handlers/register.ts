import { RegistryService } from '../services/registry';
import { BlockchainService } from '../services/blockchain';
import { corsHeaders, isValidAddress, isValidName, getFee } from '../utils/constants';
import { RegisterRequest, VerifyRequest } from '../types';

export async function handleRegister(request: Request, registryService: RegistryService): Promise<Response> {
	const { address, name } = (await request.json()) as RegisterRequest;

	// Validation
	if (!isValidAddress(address)) {
		return new Response(JSON.stringify({ error: 'Invalid blockchain address' }), {
			status: 400,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	if (!isValidName(name)) {
		return new Response(JSON.stringify({ error: 'Name must be alphanumeric lowercase and end with .nock' }), {
			status: 400,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	// Check existing registrations
	const existing = await registryService.getRegisteredName(name);
	if (existing) {
		return new Response(JSON.stringify({ error: 'Name already registered' }), {
			status: 400,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	const pendingRegistration = await registryService.getPendingName(name);
	if (pendingRegistration) {
		return new Response(
			JSON.stringify({
				error:
					'Name is pre-registered pending payment. This name will be held for one week while payment is pending. Are you the owner? Please send payment to 8s29XUK8Do7QWt2MHfPdd1gDSta6db4c3bQrxP1YdJNfXpL3WPzTT5 to complete the registration.',
			}),
			{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}

	// Create pending registration
	await registryService.createPendingRegistration(name, address);

	return new Response(JSON.stringify({ key: `pending:${name}:${address}` }), {
		status: 200,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}
