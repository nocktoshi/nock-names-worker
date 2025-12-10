import { Env } from './types';
import { RegistryService } from './services/registry';
import { BlockchainService } from './services/blockchain';
import { corsHeaders } from './utils/constants';
import { handleRegister } from './handlers/register';
import { handleVerify } from './handlers/verify';
import { handleGetPending, handleGetVerified } from './handlers/list';
import { handleResolve } from './handlers/resolve';
import { handleSearch } from './handlers/search';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      const method = request.method;

	// Handle CORS preflight
	if (method === 'OPTIONS') {
	  return new Response(null, { headers: corsHeaders });
	}

	// Initialize services
	const registryService = new RegistryService(env.REGISTRY_KV);
	const blockchainService = new BlockchainService();

	type Handler = () => Promise<Response>;
	type PostRoutes = {
	  '/register': Handler;
	  '/verify': Handler;
	};
	type GetRoutes = {
	  '/pending': Handler;
	  '/verified': Handler;
	  '/resolve': Handler;
	  '/search': Handler;
	};

	const routes: Record<'POST', PostRoutes> & Record<'GET', GetRoutes> = {
	  POST: {
		'/register': () => handleRegister(request, registryService),
		'/verify': () => handleVerify(request, registryService, blockchainService)
	  },
	  GET: {
		'/pending': () => handleGetPending(request, registryService),
		'/verified': () => handleGetVerified(request, registryService),
		'/resolve': () => handleResolve(request, registryService),
		'/search': () => handleSearch(request, registryService)
	  }
	};

	const handler = (() => {
	  if (method === 'POST' && url.pathname in routes.POST) {
		return (routes.POST as PostRoutes)[url.pathname as keyof PostRoutes];
	  }
	  if (method === 'GET' && url.pathname in routes.GET) {
		return (routes.GET as GetRoutes)[url.pathname as keyof GetRoutes];
	  }
	  return undefined;
	})();
	if (handler) {
	  return handler();
	}

      return new Response('Not Found', { 
        status: 404, 
        headers: corsHeaders 
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response('Internal Server Error: ' + errorMessage, { 
        status: 500,
        headers: corsHeaders
      });
	}
  },
};
