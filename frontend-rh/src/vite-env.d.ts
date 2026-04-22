/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	readonly VITE_APP_KIND?: 'projects' | 'rh';
	readonly VITE_RH_APP_URL?: string;
	readonly VITE_PROJECTS_APP_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
