import { RegistryService } from '../services/registry';
import { corsHeaders, isValidName } from '../utils/constants';

export async function handleResolve(request: Request, registryService: RegistryService): Promise<Response> {
	const url = new URL(request.url);
	const address = url.searchParams.get('address');
	const name = url.searchParams.get('name');

	if (address) {
		const registration = await registryService.getRegisteredAddress(address);
		if (!registration) {
			return new Response(JSON.stringify({ error: 'Address not registered' }), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}
		return new Response(JSON.stringify({ name: registration.name }), {
			status: 200,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	if (name) {
		if (!isValidName(name)) {
			return new Response(JSON.stringify({ error: 'Invalid name format' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const registration = await registryService.getRegisteredName(name);
		if (!registration) {
			return new Response(JSON.stringify({ error: 'Name not registered' }), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ address: registration.address }), {
			status: 200,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify({ error: 'Missing address or name parameter' }), {
		status: 400,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}
