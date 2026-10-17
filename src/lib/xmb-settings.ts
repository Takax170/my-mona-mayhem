export interface XmbSettings {
	sound: boolean;
	volume: number;
	boot: boolean;
}

export const SETTINGS_KEY = 'monaMayhemXmbSettings';
export const defaultSettings: Readonly<XmbSettings> = { sound: true, volume: 0.5, boot: true };

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
	};
}

export function loadSettings(): XmbSettings {
	try {
		return parseSettings(localStorage.getItem(SETTINGS_KEY));
	} catch {
		return { ...defaultSettings };
	}
}

export function saveSettings(settings: XmbSettings): void {
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
	} catch {
		// Storage can be unavailable in private modes; settings stay in memory.
	}
}
