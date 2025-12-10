import { RegistryService } from '../services/registry';
import { corsHeaders, getFee } from '../utils/constants';

export async function handleSearch(request: Request, registryService: RegistryService): Promise<Response> {
	const url = new URL(request.url);
	const name = url.searchParams.get('name')?.replace('.nock', '');

	if (!name) {
		return new Response(JSON.stringify({ error: 'Missing search parameter' }), {
			status: 400,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	const registration = await registryService.getRegisteredName(`${name}.nock`);
	const pendingRegistration = await registryService.getPendingName(`${name}.nock`);

	const result = {
		name: `${name}.nock`,
		price: getFee(name),
		isAvailable: !registration && !pendingRegistration,
		owner: registration?.address || pendingRegistration?.address || null,
		registeredAt: registration?.timestamp || pendingRegistration?.timestamp || null,
	};

	return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
