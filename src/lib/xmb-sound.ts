export type SoundKind = 'move' | 'category' | 'confirm' | 'back' | 'error' | 'reveal';

interface Tone {
	notes: number[];
	step: number;
	type: OscillatorType;
	gain: number;
}

// Soft synthesized cues inspired by console menus; no recorded assets are used.
const tones: Record<SoundKind, Tone> = {
	move: { notes: [1318], step: 0.045, type: 'sine', gain: 0.12 },
	category: { notes: [880, 1175], step: 0.04, type: 'sine', gain: 0.12 },
	confirm: { notes: [988, 1480], step: 0.06, type: 'sine', gain: 0.14 },
	back: { notes: [988, 740], step: 0.05, type: 'sine', gain: 0.12 },
	error: { notes: [247, 220], step: 0.09, type: 'triangle', gain: 0.16 },
	reveal: { notes: [523, 659, 784, 1047], step: 0.11, type: 'sine', gain: 0.13 },
};

export function createSoundPlayer() {
	let context: AudioContext | undefined;
	let enabled = true;
	let volume = 0.5;

	return {
		setEnabled(value: boolean) { enabled = value; },
		setVolume(value: number) { volume = Math.min(1, Math.max(0, value)); },
		unlock() {
			if (!enabled || typeof AudioContext === 'undefined') return;
			context ??= new AudioContext();
			if (context.state === 'suspended') void context.resume();
		},
		play(kind: SoundKind) {
			if (!enabled || volume === 0 || !context || context.state !== 'running') return;
			const tone = tones[kind];
			const start = context.currentTime + 0.005;
			tone.notes.forEach((frequency, index) => {
				const oscillator = context!.createOscillator();
				const gain = context!.createGain();
				const at = start + index * tone.step;
				const length = tone.step * 2.2;
				oscillator.type = tone.type;
				oscillator.frequency.setValueAtTime(frequency, at);
				gain.gain.setValueAtTime(0.0001, at);
				gain.gain.exponentialRampToValueAtTime(tone.gain * volume, at + 0.008);
				gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
				oscillator.connect(gain).connect(context!.destination);
				oscillator.start(at);
				oscillator.stop(at + length + 0.02);
			});
		},
	};
}
