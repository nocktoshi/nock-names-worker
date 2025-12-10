import { RegistryService } from '../services/registry';
import { corsHeaders } from '../utils/constants';

export async function handleGetPending(request: Request, registryService: RegistryService): Promise<Response> {
	const registrations = await registryService.listPendingRegistrations();

	return new Response(JSON.stringify(registrations.sort((a, b) => b.timestamp - a.timestamp)), {
		status: 200,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

export async function handleGetVerified(request: Request, registryService: RegistryService): Promise<Response> {
	const registrations = await registryService.listRegisteredNames();

	return new Response(JSON.stringify(registrations.sort((a, b) => b.timestamp - a.timestamp)), {
		status: 200,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}
