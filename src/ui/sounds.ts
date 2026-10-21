export type EventSound = "holdStart" | "holdComplete" | "restStart" | "restComplete";

let audioContext: AudioContext | undefined;

export function primeEventSounds(): void {
  const context = getAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  gain.gain.value = 0.0001;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.01);
}

function getAudioContext(): AudioContext | undefined {
  if (typeof window === "undefined" || !window.AudioContext) return undefined;
  audioContext ??= new window.AudioContext();
  void audioContext.resume();
  return audioContext;
}

export function playEventSound(event: EventSound): void {
  const context = getAudioContext();
  if (!context) return;

  const patterns: Record<EventSound, number[]> = {
    holdStart: [660],
    holdComplete: [784, 1046, 1318],
    restStart: [330],
    restComplete: [523, 784],
  };
  const frequencies = patterns[event];
  const start = context.currentTime;

  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const at = start + index * 0.12;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.12, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.18);
  });
}
