import { RegistryService } from '../services/registry';
import { corsHeaders, getFee, isValidAddress } from '../utils/constants';

export async function handleSearch(request: Request, registryService: RegistryService): Promise<Response> {
	const url = new URL(request.url);
	const address = url.searchParams.get('address');
	const name = url.searchParams.get('name')?.replace('.nock', '');

	if (!address && !name) {
		return new Response(JSON.stringify({ error: 'Missing search parameter' }), {
			status: 400,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	if (address) {
		if (!isValidAddress(address)) {
			return new Response(JSON.stringify({ error: 'Invalid blockchain address' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const [verified, pending] = await Promise.all([
			registryService.listRegisteredNames(),
			registryService.listPendingRegistrations(),
		]);

		const pendingByAddress = pending.filter((registration) => registration.address === address);
		const verifiedByAddress = verified.filter((registration) => registration.address === address);

		return new Response(
			JSON.stringify({
				address,
				pending: pendingByAddress,
				verified: verifiedByAddress,
			}),
			{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}

	if (!name) {
		return new Response(JSON.stringify({ error: 'Missing search parameter' }), {
			status: 400,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	const [registration, pendingRegistration] = await Promise.all([
		registryService.getRegisteredName(`${name}.nock`),
		registryService.getPendingName(`${name}.nock`),
	]);

	const status = registration ? 'registered' : pendingRegistration ? 'pending' : 'available';

	const result = {
		name: `${name}.nock`,
		price: getFee(name),
		status,
		owner: registration?.address || pendingRegistration?.address || null,
		registeredAt: registration?.timestamp || pendingRegistration?.timestamp || null,
	};

	return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
