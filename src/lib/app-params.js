const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getLegacyStorageKey = (paramName) => `base44_${toSnakeCase(paramName)}`;

const readUrlParams = () => {
	if (isNode) {
		return null;
	}
	return new URLSearchParams(window.location.search);
};

const readUrlParam = (urlParams, paramName) => {
	if (!urlParams) {
		return null;
	}
	return urlParams.get(paramName);
};

const readStoredValue = (storageKey) => {
	if (isNode) {
		return null;
	}
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
};

const persistLegacyValue = (storageKey, value) => {
	if (isNode) {
		return;
	}
	storage.setItem(storageKey, value);
};

// Legacy Base44 compatibility: keep removing auth-style params from the URL
// while current callers still rely on this file to bootstrap runtime state.
const sanitizeLegacyUrlParam = (urlParams, paramName) => {
	if (isNode || !urlParams) {
		return;
	}
	urlParams.delete(paramName);
	const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
		}${window.location.hash}`;
	window.history.replaceState({}, document.title, newUrl);
};

const readEnvConfig = () => ({
	// Legacy Base44 env names are intentionally retained for compatibility.
	appId: import.meta.env.VITE_BASE44_APP_ID,
	serverUrl: import.meta.env.VITE_BASE44_BACKEND_URL || "https://app.base44.com",
});

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}

	const storageKey = getLegacyStorageKey(paramName);
	const urlParams = readUrlParams();
	const searchParam = readUrlParam(urlParams, paramName);

	if (removeFromUrl) {
		sanitizeLegacyUrlParam(urlParams, paramName);
	}

	if (searchParam) {
		persistLegacyValue(storageKey, searchParam);
		return searchParam;
	}

	if (defaultValue) {
		persistLegacyValue(storageKey, defaultValue);
		return defaultValue;
	}

	return readStoredValue(storageKey);
}

const composeAppParams = () => {
	const envConfig = readEnvConfig();

	// Future migration seam: auth token ownership should move out of this file.
	// For now, preserve the current URL/env/localStorage bootstrap behavior.
	return {
		appId: getAppParamValue("app_id", { defaultValue: envConfig.appId }),
		serverUrl: getAppParamValue("server_url", { defaultValue: envConfig.serverUrl }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
		functionsVersion: getAppParamValue("functions_version"),
	}
}


export const appParams = {
	...composeAppParams()
}
