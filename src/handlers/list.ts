import { RegistryService } from '../services/registry';
import { corsHeaders, isValidAddress } from '../utils/constants';

export async function handleGetPending(request: Request, registryService: RegistryService): Promise<Response> {
	const registrations = await registryService.listPendingRegistrations();

	return new Response(JSON.stringify(registrations.sort((a, b) => b.timestamp - a.timestamp)), {
		status: 200,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

export async function handleGetVerified(request: Request, registryService: RegistryService): Promise<Response> {
	const url = new URL(request.url);
	const address = url.searchParams.get('address');
	const nameParam = url.searchParams.get('name');

	const registrations = await registryService.listRegisteredNames();

	let filtered = registrations;

	if (address) {
		if (!isValidAddress(address)) {
			return new Response(JSON.stringify({ error: 'Invalid blockchain address' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}
		filtered = filtered.filter((r) => r.address === address);
	}

	if (nameParam) {
		const name = nameParam.endsWith('.nock') ? nameParam : `${nameParam}.nock`;
		filtered = filtered.filter((r) => r.name === name);
	}

	return new Response(JSON.stringify(filtered.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))), {
		status: 200,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}
