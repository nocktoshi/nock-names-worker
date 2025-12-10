export const PAYMENT_ADDRESS =
	'8s29XUK8Do7QWt2MHfPdd1gDSta6db4c3bQrxP1YdJNfXpL3WPzTT5';

export const isValidAddress = (address: string): boolean => {
	const trimmedQuery = address.trim();
	return (trimmedQuery.length > 43 && trimmedQuery.length < 57) || trimmedQuery.length === 132
		&& /^[a-zA-Z0-9]+$/.test(trimmedQuery);
};

export const isValidName = (name: string): boolean => {
	return /^[a-z0-9]+\.nock$/.test(name);
};

export const getFee = (name: string): number => {
	const len = (name?.replace(".nock", "") || "").length;
	if (len >= 10) return 100;
	if (len >= 5) return 500;
	return len ? 5000 : 0;
};

export const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};
