export interface XmbSettings {
	sound: boolean;
	volume: number;
	boot: boolean;
	themeColor: string;
}

export const SETTINGS_KEY = 'monaMayhemXmbSettings';
export const defaultSettings: Readonly<XmbSettings> = {
	sound: true, volume: 0.5, boot: true, themeColor: '#337ac0',
};
export const themePresets = [
	{ label: 'Blue', color: '#337ac0' },
	{ label: 'Red', color: '#c33e48' },
	{ label: 'Purple', color: '#8954bd' },
	{ label: 'Green', color: '#30865f' },
	{ label: 'Amber', color: '#ba812d' },
	{ label: 'Graphite', color: '#646464' },
] as const;

export function parseSettings(raw: string | null): XmbSettings {
	let value: unknown;
	try {
		value = raw === null ? null : JSON.parse(raw);
	} catch {
		value = null;
	}
	const record = typeof value === 'object' && value !== null && !Array.isArray(value)
		? value as Record<string, unknown> : {};
	return {
		sound: typeof record.sound === 'boolean' ? record.sound : defaultSettings.sound,
		volume: typeof record.volume === 'number' && Number.isFinite(record.volume)
			? Math.min(1, Math.max(0, record.volume)) : defaultSettings.volume,
		boot: typeof record.boot === 'boolean' ? record.boot : defaultSettings.boot,
		themeColor: typeof record.themeColor === 'string' && record.themeColor.length === 7
			&& /^#[0-9a-f]{6}$/i.test(record.themeColor)
			? record.themeColor.toLowerCase() : defaultSettings.themeColor,
	};
}

export function loadSettings(): XmbSettings {
	try {
		return parseSettings(localStorage.getItem(SETTINGS_KEY));
	} catch {
		return { ...defaultSettings };
	}
}

export function saveSettings(settings: XmbSettings): boolean {
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
		return true;
	} catch {
		return false;
	}
}
