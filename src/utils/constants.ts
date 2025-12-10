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
	// 100 NOCK PROMO
	return 100;
	const nameWithoutSuffix = name.replace('.nock', '');
	return nameWithoutSuffix.length >= 10 ? 100 : nameWithoutSuffix.length >= 5 ? 500 : 5000;
};

export const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};
