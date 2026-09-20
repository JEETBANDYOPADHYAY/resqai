import { NavigationManeuver, RouteStep } from '../types';

export type VoiceLanguage = 'en' | 'bn' | 'hi';

export interface VoiceEngineStatus {
  language: VoiceLanguage;
  hasNativeVoice: boolean;
  voiceName: string;
  langTag: string;
  isFallbackPhonetic: boolean;
}

// Retain utterance in module scope to prevent Chromium Garbage Collection bug mid-speech
let activeUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let voiceListenersAttached = false;

/**
 * Initializes and caches browser speech synthesis voices reliably across all browsers.
 */
export function initVoiceEngine(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const refreshVoices = () => {
    try {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        cachedVoices = v;
      }
    } catch {
      // ignore
    }
  };

  refreshVoices();

  if (!voiceListenersAttached && window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = refreshVoices;
    voiceListenersAttached = true;
  }
}

// Auto-run on load
initVoiceEngine();

/**
 * Gets all available voices with fallback retry.
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
  return cachedVoices;
}

/**
 * Finds the highest quality TTS voice for English, Bengali, or Hindi.
 */
export function findBestVoiceForLanguage(lang: VoiceLanguage): {
  voice: SpeechSynthesisVoice | null;
  isNative: boolean;
  voiceName: string;
  langTag: string;
} {
  const voices = getAvailableVoices();

  if (lang === 'bn') {
    // 1. Check exact match for Bengali (India or Bangladesh)
    const nativeBn = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      const vName = (v.name || '').toLowerCase();
      return (
        vLang === 'bn-in' ||
        vLang === 'bn-bd' ||
        vLang.startsWith('bn') ||
        vName.includes('bengali') ||
        vName.includes('bangla') ||
        vName.includes('বাংলা')
      );
    });

    if (nativeBn) {
      return {
        voice: nativeBn,
        isNative: true,
        voiceName: nativeBn.name,
        langTag: nativeBn.lang || 'bn-IN',
      };
    }

    // 2. If OS has no native Bengali TTS voice installed (common in generic Linux/Windows),
    // pair with Indian-English or standard voice for clear Romanized phonetic delivery.
    const indianEn = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      return vLang === 'en-in';
    });

    const fallbackEn =
      indianEn ||
      voices.find((v) => (v.lang || '').toLowerCase().startsWith('en')) ||
      voices[0] ||
      null;

    return {
      voice: fallbackEn,
      isNative: false,
      voiceName: fallbackEn ? `${fallbackEn.name} (Phonetic Fallback)` : 'Standard Fallback',
      langTag: fallbackEn?.lang || 'en-IN',
    };
  }

  if (lang === 'hi') {
    // 1. Check exact match for Hindi
    const nativeHi = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      const vName = (v.name || '').toLowerCase();
      return (
        vLang === 'hi-in' ||
        vLang.startsWith('hi') ||
        vName.includes('hindi') ||
        vName.includes('हिन्दी') ||
        vName.includes('हिंदी') ||
        vName.includes('kalpana') ||
        vName.includes('hemant') ||
        vName.includes('lekha') ||
        vName.includes('neerja')
      );
    });

    if (nativeHi) {
      return {
        voice: nativeHi,
        isNative: true,
        voiceName: nativeHi.name,
        langTag: nativeHi.lang || 'hi-IN',
      };
    }

    // Fallback to Indian English voice with clear Romanized Hindi
    const indianEn = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      return vLang === 'en-in';
    });

    const fallbackEn =
      indianEn ||
      voices.find((v) => (v.lang || '').toLowerCase().startsWith('en')) ||
      voices[0] ||
      null;

    return {
      voice: fallbackEn,
      isNative: false,
      voiceName: fallbackEn ? `${fallbackEn.name} (Phonetic Fallback)` : 'Standard Fallback',
      langTag: fallbackEn?.lang || 'en-IN',
    };
  }

  // English (lang === 'en')
  // Prefer Indian English voice, then general English
  const indianEn = voices.find((v) => {
    const vLang = (v.lang || '').toLowerCase().replace('_', '-');
    return vLang === 'en-in';
  });

  const generalEn =
    indianEn ||
    voices.find((v) => (v.lang || '').toLowerCase().startsWith('en')) ||
    voices[0] ||
    null;

  return {
    voice: generalEn,
    isNative: true,
    voiceName: generalEn?.name || 'Default English',
    langTag: generalEn?.lang || 'en-US',
  };
}

/**
 * Returns voice pack diagnostic status for all 3 languages.
 */
export function getVoiceEngineDiagnostics(): Record<VoiceLanguage, VoiceEngineStatus> {
  const languages: VoiceLanguage[] = ['en', 'bn', 'hi'];
  const result: Partial<Record<VoiceLanguage, VoiceEngineStatus>> = {};

  for (const lang of languages) {
    const info = findBestVoiceForLanguage(lang);
    result[lang] = {
      language: lang,
      hasNativeVoice: info.isNative,
      voiceName: info.voiceName,
      langTag: info.langTag,
      isFallbackPhonetic: !info.isNative,
    };
  }

  return result as Record<VoiceLanguage, VoiceEngineStatus>;
}

/**
 * Builds localized turn-by-turn spoken guidance for a given step in English, Bengali, or Hindi.
 */
export function buildSpokenInstruction(
  step: RouteStep,
  lang: VoiceLanguage,
  isNativeVoice: boolean
): string {
  const road = step.streetName || 'Road Ahead';
  const maneuver = step.maneuver || 'CONTINUE_STRAIGHT';

  if (lang === 'bn') {
    if (isNativeVoice) {
      switch (maneuver) {
        case 'TURN_LEFT':
          return `${road}-এ বামে মোড় নিন। নিরাপদ বন্যা-মুক্ত করিডোর চালু আছে।`;
        case 'SLIGHT_LEFT':
          return `${road}-এ সামান্য বামে যান।`;
        case 'TURN_RIGHT':
          return `${road}-এ ডানে মোড় নিন। নিরাপদ করিডোরে অগ্রসর হন।`;
        case 'SLIGHT_RIGHT':
          return `${road}-এ সামান্য ডানে যান।`;
        case 'U_TURN':
          return `${road}-এ ইউ-টার্ন নিন।`;
        case 'DEPART':
          return `${road} দিয়ে যাত্রা শুরু করুন। নিরাপদ উদ্ধার পথ সক্রিয়।`;
        case 'ARRIVE': {
          const destName = step.streetName || 'উদ্ধার আশ্রয়কেন্দ্র';
          return `আপনি নিরাপদে ${destName}-এ পৌঁছে গেছেন। নিরাপদ স্থান নিশ্চিত।`;
        }
        case 'CONTINUE_STRAIGHT':
        default:
          return `${road}-এ সোজা এগিয়ে চলুন।`;
      }
    } else {
      // Romanized phonetic Bengali for English TTS engines (sounds clear and natural)
      switch (maneuver) {
        case 'TURN_LEFT':
          return `Baame morh nin ${road}-e. Nirapod flood-free corridor chalu achhe.`;
        case 'SLIGHT_LEFT':
          return `Samanyo baame jaan ${road}-e.`;
        case 'TURN_RIGHT':
          return `Daane morh nin ${road}-e. Nirapod corridor egiye cholun.`;
        case 'SLIGHT_RIGHT':
          return `Samanyo daane jaan ${road}-e.`;
        case 'U_TURN':
          return `U-turn nin ${road}-e.`;
        case 'DEPART':
          return `${road} diye jatra shuru korun. Safe evacuation route active.`;
        case 'ARRIVE': {
          const destName = step.streetName || 'evacuation sanctuary';
          return `Aapni nirapode ${destName}-e pouchhe gechhen. Safe sanctuary confirmed.`;
        }
        case 'CONTINUE_STRAIGHT':
        default:
          return `Shoja egiye cholun ${road}-e.`;
      }
    }
  }

  if (lang === 'hi') {
    if (isNativeVoice) {
      switch (maneuver) {
        case 'TURN_LEFT':
          return `${road} पर बाएं मुड़ें। सुरक्षित बाढ़-मुक्त गलियारा सक्रिय है।`;
        case 'SLIGHT_LEFT':
          return `${road} पर थोड़ा बाएं मुड़ें।`;
        case 'TURN_RIGHT':
          return `${road} पर दाएं मुड़ें। सुरक्षित मार्ग पर आगे बढ़ें।`;
        case 'SLIGHT_RIGHT':
          return `${road} पर थोड़ा दाएं मुड़ें।`;
        case 'U_TURN':
          return `${road} पर यू-टर्न लें।`;
        case 'DEPART':
          return `${road} से प्रस्थान करें। सुरक्षित निकासी मार्ग सक्रिय।`;
        case 'ARRIVE': {
          const destName = step.streetName || 'निकासी आश्रय स्थल';
          return `आप सुरक्षित रूप से ${destName} पर पहुंच गए हैं। सुरक्षित आश्रय सुनिश्चित।`;
        }
        case 'CONTINUE_STRAIGHT':
        default:
          return `${road} पर सीधे आगे बढ़ें।`;
      }
    } else {
      // Romanized phonetic Hindi for English TTS engines
      switch (maneuver) {
        case 'TURN_LEFT':
          return `Baayein mudein ${road} par. Surakshit safe corridor sakriya hai.`;
        case 'SLIGHT_LEFT':
          return `Thoda baayein mudein ${road} par.`;
        case 'TURN_RIGHT':
          return `Daayein mudein ${road} par. Surakshit marg par aage badhein.`;
        case 'SLIGHT_RIGHT':
          return `Thoda daayein mudein ${road} par.`;
        case 'U_TURN':
          return `U-turn lein ${road} par.`;
        case 'DEPART':
          return `${road} se prasthan karein. Safe evacuation corridor active.`;
        case 'ARRIVE': {
          const destName = step.streetName || 'evacuation sanctuary';
          return `Aap surakshit roop se ${destName} par pahunch gaye hain. Safe sanctuary confirmed.`;
        }
        case 'CONTINUE_STRAIGHT':
        default:
          return `Seedhe aage badhein ${road} par.`;
      }
    }
  }

  // English
  switch (maneuver) {
    case 'TURN_LEFT':
      return `Turn left onto ${road}. Safe elevated corridor active.`;
    case 'SLIGHT_LEFT':
      return `Slight left onto ${road}.`;
    case 'TURN_RIGHT':
      return `Turn right onto ${road}. Safe elevated corridor active.`;
    case 'SLIGHT_RIGHT':
      return `Slight right onto ${road}.`;
    case 'U_TURN':
      return `Make a U-turn onto ${road}.`;
    case 'DEPART':
      return `Head out via ${road}. Safe evacuation path active.`;
    case 'ARRIVE': {
      const destName = step.streetName || 'your evacuation destination sanctuary';
      return `You have arrived safely at ${destName}. Verified flood-safe sanctuary.`;
    }
    case 'CONTINUE_STRAIGHT':
    default:
      return `Continue straight on ${road}. Safe corridor active.`;
  }
}

/**
 * Builds localized arrival phrase.
 */
export function buildArrivalPhrase(
  lang: VoiceLanguage,
  isNativeVoice: boolean,
  destinationName?: string
): string {
  if (lang === 'bn') {
    const dest = destinationName || 'উদ্ধার আশ্রয়কেন্দ্র';
    return isNativeVoice
      ? `আপনি নিরাপদে ${dest}-এ পৌঁছে গেছেন।`
      : `Aapni nirapode ${dest}-e pouchhe gechhen.`;
  }
  if (lang === 'hi') {
    const dest = destinationName || 'निकासी आश्रय स्थल';
    return isNativeVoice
      ? `आप सुरक्षित रूप से ${dest} पर पहुंच गए हैं।`
      : `Aap surakshit roop se ${dest} par pahunch gaye hain.`;
  }
  const dest = destinationName || 'your evacuation destination sanctuary';
  return `You have arrived safely at ${dest}. Verified flood-safe sanctuary.`;
}

/**
 * Builds localized rerouting hazard alert phrase.
 */
export function buildReroutePhrase(lang: VoiceLanguage, isNativeVoice: boolean): string {
  if (lang === 'bn') {
    return isNativeVoice
      ? 'সামনে বিপদ বা জলাবদ্ধতা রয়েছে। নিরাপদ বিকল্প পথ পুনরায় গণনা করা হচ্ছে।'
      : 'Shaamne bipod royechhe. Nirapod bikolpo poth punoray gonona kora hochhe.';
  }
  if (lang === 'hi') {
    return isNativeVoice
      ? 'आगे जलभराव या खतरा है। सुरक्षित नए मार्ग की गणना की जा रही है।'
      : 'Aage jalbharo ya khatra hai. Surakshit naye marg ki ganana ki ja rahi hai.';
  }
  return 'Road hazard reported ahead. Recalculating faster safe route avoiding flood water.';
}

/**
 * Voice sample test phrases for diagnostic verification.
 */
export const VOICE_SAMPLE_PHRASES: Record<VoiceLanguage, { native: string; phonetic: string; label: string }> = {
  en: {
    native: 'ResQ AI Voice Navigation active. Turn left onto safe elevated corridor.',
    phonetic: 'ResQ AI Voice Navigation active. Turn left onto safe elevated corridor.',
    label: 'English Voice Pack (EN)',
  },
  bn: {
    native: 'রেসকিউ এআই ভয়েস নির্দেশিকা সক্রিয়। বামে মোড় নিন, নিরাপদ করিডোর সচল আছে।',
    phonetic: 'ResQ AI voice nirdeshika shokriyo. Baame morh nin, nirapod corridor shochol achhe.',
    label: 'বাংলা ভয়েস প্যাক (Bengali)',
  },
  hi: {
    native: 'रेस्क्यू एआई आवाज मार्गदर्शन सक्रिय। बाएं मुड़ें, सुरक्षित गलियारा चालू है।',
    phonetic: 'ResQ AI aawaaz margdarshan sakriya. Baayein mudein, surakshit galiyara chalu hai.',
    label: 'हिन्दी वॉइस पैक (Hindi)',
  },
};

/**
 * Master speech synthesis execution with fail-safes and audio chime pre-wake.
 */
export function speakEmergencyVoice(
  text: string,
  lang: VoiceLanguage = 'en',
  options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
  }
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve(false);
        return;
      }

      // Resume if browser suspended speech synthesis
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Cancel any ongoing utterance to prevent queue deadlock
      window.speechSynthesis.cancel();

      const voiceInfo = findBestVoiceForLanguage(lang);
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = options?.rate ?? (lang === 'bn' || lang === 'hi' ? 0.98 : 1.02);
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;

      if (voiceInfo.voice) {
        utterance.voice = voiceInfo.voice;
        utterance.lang = voiceInfo.langTag;
      } else {
        utterance.lang = lang === 'bn' ? 'bn-IN' : lang === 'hi' ? 'hi-IN' : 'en-US';
      }

      // Keep active reference to prevent GC bug in Chromium
      activeUtterance = utterance;

      utterance.onend = () => {
        activeUtterance = null;
        options?.onEnd?.();
        resolve(true);
      };

      utterance.onerror = () => {
        activeUtterance = null;
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      activeUtterance = null;
      resolve(false);
    }
  });
}
