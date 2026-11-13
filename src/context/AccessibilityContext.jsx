import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Create Accessibility Context
const AccessibilityContext = createContext(null);

// Default settings
const DEFAULTS = {
  fontSize: 'normal',
  highContrast: false,
  dyslexiaFont: false,
  reduceMotion: false,
  readAloudMode: true,
  simpleView: false,
  colorBlindMode: 'none',
  cursorSize: 'normal',
  lineSpacing: 'normal',
  focusHighlight: false,
  voiceCommands: false,
  language: 'en',
};

// Helper to normalize strings for robust comparison
const normalizeText = (str) => {
  return (str || '')
    .toLowerCase()
    .replace(/\bi see you\b/g, 'icu')
    .replace(/\btheatre\b/g, 'theater')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'for', 'on', 'at', 'in', 'it', 'is', 'this', 'that', 'with', 'by', 'as', 'from']);

export function AccessibilityProvider({ children }) {
  // Settings persisted in localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('clinergy_a11y');
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  // Global voice engine state
  const [voiceState, setVoiceState] = useState({
    isListening: false,
    volume: 0,
    lastWords: '',
    status: 'off', // off, connecting, on, error
  });

  const recognitionRef = useRef(null);
  const statusRef = useRef('off');
  const heartbeatRef = useRef(null);
  const lastResultTimeRef = useRef(Date.now());
  const isSpeakingRef = useRef(false);
  const lastSpeakEndTimeRef = useRef(0);
  const speechTimeoutRef = useRef(null);

  const navigate = useNavigate();

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('clinergy_a11y', JSON.stringify(next));
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setSettings(DEFAULTS);
    localStorage.setItem('clinergy_a11y', JSON.stringify(DEFAULTS));
  }, []);

  // ---------------------- Read Aloud Utility (Defined before Voice Engine so stop & speak are available) ----------------------
  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    lastSpeakEndTimeRef.current = Date.now();
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
  }, []);

  const speak = useCallback(text => {
    if (!settings.readAloudMode) return;
    if (!text) return;

    if (!window.speechSynthesis) {
      toast.error('Speech not supported in this browser');
      return;
    }

    // Standard cleanup
    stop();

    // Lock recognition synchronously to prevent race conditions before onstart fires
    isSpeakingRef.current = true;
    lastSpeakEndTimeRef.current = 0;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose natural voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      utterance.voice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) || voices[0];
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      console.log('Speech started:', text);
    };

    const handleEnd = () => {
      isSpeakingRef.current = false;
      lastSpeakEndTimeRef.current = Date.now();
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
    };

    utterance.onend = handleEnd;
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      if (e.error === 'not-allowed') {
        toast.error('Speech blocked. Please interact with the page first.', { id: 's-blocked' });
      }
      handleEnd();
    };

    window.speechSynthesis.speak(utterance);

    // Bug fix for Chrome: Speech stops after 15s sometimes
    const resumeSpeech = () => {
      if (window.speechSynthesis.speaking && isSpeakingRef.current) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
        speechTimeoutRef.current = setTimeout(resumeSpeech, 10000);
      }
    };
    speechTimeoutRef.current = setTimeout(resumeSpeech, 10000);
  }, [settings.readAloudMode, stop]);

  // ---------------------- Voice Engine (Defined after stop, stopVoice, updateSetting) ----------------------
  const stopVoice = useCallback(() => {
    statusRef.current = 'off';
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
    }
    recognitionRef.current = null;
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    setVoiceState({ isListening: false, volume: 0, lastWords: '', status: 'off' });
    updateSetting('voiceCommands', false);
  }, [updateSetting]);

  const startVoice = useCallback(async (quiet = false) => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) return;

    // Avoid duplicate starts
    if (recognitionRef.current && statusRef.current !== 'off') return;
    if (recognitionRef.current) stopVoice();

    if (!quiet) toast.success('Initializing Voice...', { id: 'v-init' });
    statusRef.current = 'connecting';
    setVoiceState(prev => ({ ...prev, status: 'connecting' }));
    updateSetting('voiceCommands', true);

    // Audio volume visualizer (optional, non‑blocking)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          if (!recognitionRef.current) return;
          analyser.getByteFrequencyData(data);
          const sum = data.reduce((a, b) => a + b, 0);
          setVoiceState(prev => ({ ...prev, volume: Math.round(sum / data.length) }));
          requestAnimationFrame(loop);
        };
        loop();
      }
    } catch (e) {
      console.warn('Volume analyzer failed, continuing without visual feedback.', e);
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      statusRef.current = 'on';
      setVoiceState(prev => ({ ...prev, status: 'on', isListening: true }));
      lastResultTimeRef.current = Date.now();
      toast.success('Voice Online', { id: 'v-online' });
    };

    recognition.onresult = event => {
      // Prevent feedback loop if speech synthesis is active or within 3s cooldown
      if (isSpeakingRef.current || window.speechSynthesis.speaking || (Date.now() - lastSpeakEndTimeRef.current < 3000)) {
        return;
      }

      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }

      // Update the live transcript display (interim is fine for this)
      const display = (final || interim).toLowerCase().trim();
      if (display) setVoiceState(prev => ({ ...prev, lastWords: display }));
      lastResultTimeRef.current = Date.now();

      // IMPORTANT: Only act on FINAL results to avoid interim words
      // triggering navigation/search mid-sentence.
      const spoken = final.toLowerCase().trim();
      if (!spoken) return;

      // ------- Stop Command (check first) -------
      if (/\bstop\b/.test(spoken)) {
        stop();
        if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) {}
        return;
      }

      // ------- Scroll Commands -------
      // Must contain an explicit scroll/page/move keyword OR be a bare direction word.
      const isScrollIntent =
        /\bscroll\b/.test(spoken) ||
        /\bpage\b/.test(spoken)   ||
        /\bmove\b/.test(spoken)   ||
        /^(down|up|top|bottom)$/.test(spoken);
      const isDown = /\b(down|bottom|next)\b/.test(spoken);
      const isUp   = /\b(up|top|previous|back)\b/.test(spoken);

      if (isScrollIntent && (isDown || isUp)) {
        const modal = document.querySelector('[role="dialog"]');
        const container = modal || document.getElementById('main-scroll-area') || window;
        const amount = window.innerHeight * 0.7;
        container.scrollBy({ top: isDown ? amount : -amount, behavior: 'smooth' });
        return;
      }

      // ------- Fuzzy Click Matcher -------
      const cleanSpoken = normalizeText(spoken);
      let target = cleanSpoken
        .replace(/^(?:click|open|select|go to|show|tap|press|navigate to)\s+(?:on\s+|at\s+|the\s+)?/i, '')
        .trim();

      if (target.length > 1 && !STOP_WORDS.has(target)) {
        const candidates = Array.from(document.querySelectorAll(
          'button, a, [role="button"], [role="tab"], .speakable'
        ));
        let best = null;
        let bestScore = 0;
        
        for (const el of candidates) {
          const txt = normalizeText(el.getAttribute('aria-label') || el.title || el.textContent);
          if (!txt) continue;
          
          let score = 0;
          const hasWholeWord = new RegExp('\\b' + target + '\\b').test(txt);
          
          if (txt === target) {
            score = 100;
          } else if (txt.startsWith(target + ' ') || txt.endsWith(' ' + target)) {
            score = 95;
          } else if (hasWholeWord) {
            score = 90;
          } else if (txt.includes(target) && target.length > 3) {
            score = 80;
          } else {
            // Token-based matching fallback (ignoring stop words)
            const txtTokens = txt.split(' ').filter(x => x && !STOP_WORDS.has(x));
            const targetTokens = target.split(' ').filter(x => x && !STOP_WORDS.has(x));
            let matchCount = 0;
            for (const tToken of targetTokens) {
              if (txtTokens.includes(tToken) || txtTokens.some(x => x.startsWith(tToken) || tToken.startsWith(x))) {
                matchCount++;
              }
            }
            if (targetTokens.length > 0) {
              score = (matchCount / targetTokens.length) * 75;
            }
          }
          
          if (score > bestScore) {
            bestScore = score;
            best = el;
          }
        }
        
        if (best && bestScore >= 70) {
          console.log('Voice match found:', best, 'Score:', bestScore);
          (best.closest('button, a, [role="button"], [role="tab"]') || best).click();
          return;
        }
      }

      // ------- Navigation -------
      if (window.__clinergy_navigate) {
        const is = key => new RegExp(`\\b${key}\\b`, 'i').test(spoken);
        if      (is('home')        || is('dash')     || is('overview'))   window.__clinergy_navigate('/');
        else if (is('live')        || is('monitor')  || is('realtime'))   window.__clinergy_navigate('/live');
        else if (is('zone')        || is('zones'))                        window.__clinergy_navigate('/zones');
        else if (is('report')      || is('reports')  || is('analytic'))   window.__clinergy_navigate('/reports');
        else if (is('ai')          || is('insight')  || is('brain'))      window.__clinergy_navigate('/ai-insights');
        else if (is('maintenance') || is('maint')    || is('service'))    window.__clinergy_navigate('/maintenance');
        else if (is('admin')       || is('user')     || is('manage'))     window.__clinergy_navigate('/admin/users');
        else if (is('setting')     || is('settings') || is('config'))     window.__clinergy_navigate('/settings');
        else if (is('alert')       || is('alerts')   || is('warn'))       window.__clinergy_navigate('/alerts');
        // Only fall through to search if the spoken phrase clearly asks for a search
        else if (/^(?:search|find|show me|look up)\b/.test(spoken)) {
          const query = spoken.replace(/^(?:search for|search|find|show me|look up)\s+/i, '').trim();
          if (query.length > 2) window.__clinergy_navigate(`/search?q=${encodeURIComponent(query)}`);
        }
      }
    };

    recognition.onerror = ev => {
      console.error('Speech recognition error:', ev.error);
      if (ev.error === 'not-allowed') {
        statusRef.current = 'error';
        toast.error('Mic Access Denied. Click the lock icon in the address bar.', { id: 'v-error' });
        stopVoice();
      } else if (ev.error === 'network') {
        toast.error('Voice Network Error', { id: 'v-error' });
      }
    };

    recognition.onend = () => {
      if (statusRef.current === 'on') {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error('Speech recognition start failed:', e);
      setVoiceState(prev => ({ ...prev, status: 'error' }));
      toast.error('Voice engine failed to start. Ensure mic permissions.', { id: 'v-error' });
    }

    // Heartbeat to restart after silence
    heartbeatRef.current = setInterval(() => {
      if (Date.now() - lastResultTimeRef.current > 10000 && recognitionRef.current) {
        try { recognition.stop(); } catch (e) {}
      }
    }, 10000);
  }, [stopVoice, stop, updateSetting]);

  // Auto-start voice engine on mount if setting is enabled
  useEffect(() => {
    if (settings.voiceCommands) {
      startVoice(true);
    }
  }, [startVoice, settings.voiceCommands]);

  // Cleanup speech timeout on unmount
  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
  }, []);

  // Apply visual settings (CSS variables, cursor, etc.)
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const sizeMap = { small: '13px', normal: '16px', large: '19px', xlarge: '22px' };
    root.style.setProperty('--base-font-size', sizeMap[settings.fontSize]);
    root.style.fontSize = sizeMap[settings.fontSize];
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('reduce-motion', settings.reduceMotion);
    root.classList.toggle('simple-view', settings.simpleView);
    root.setAttribute('data-colorblind', settings.colorBlindMode);
    const lineMap = { normal: '1.5', relaxed: '1.8', loose: '2.2' };
    root.style.setProperty('--line-height', lineMap[settings.lineSpacing]);
    root.classList.toggle('focus-highlight', settings.focusHighlight);

    // Cursor size handling
    body.classList.remove('large-cursor', 'xlarge-cursor');
    if (settings.cursorSize === 'large') body.classList.add('large-cursor');
    if (settings.cursorSize === 'xlarge') body.classList.add('xlarge-cursor');
  }, [settings]);

  // ---- Read-Aloud on Click ----
  useEffect(() => {
    if (!settings.readAloudMode) return;
    const handler = e => {
      // 1. Try to find the closest interactive/speakable container
      let readableEl = e.target.closest('button, a, [role="button"], [role="tab"], .speakable');
      
      // 2. If not found, look for plain content text in bubbles
      if (!readableEl) {
        let curr = e.target;
        while (curr && curr !== document.body && curr !== document.documentElement) {
          const tag = curr.tagName.toLowerCase();
          const isContentText = tag === 'p' || tag === 'span' || tag.match(/^h[1-6]$/) || tag === 'li' || tag === 'td' || tag === 'th';
          if (isContentText) {
            readableEl = curr;
            break;
          }
          curr = curr.parentElement;
        }
      }
      
      if (!readableEl) return;
      
      const parts = [];
      const label = readableEl.getAttribute('aria-label') || readableEl.title || '';
      const alt = readableEl.getAttribute('alt');
      const placeholder = readableEl.getAttribute('placeholder');
      
      if (label) {
        parts.push(label);
      } else if (alt) {
        parts.push(alt);
      } else if (placeholder) {
        parts.push(placeholder);
      } else {
        let txt = '';
        if (readableEl.tagName.toLowerCase() === 'input' || readableEl.tagName.toLowerCase() === 'select') {
          txt = readableEl.value || '';
        } else {
          txt = readableEl.textContent && readableEl.textContent.trim();
        }
        if (txt) parts.push(txt);
      }
      
      if (parts.length) {
        speak(parts.join('. '));
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [settings.readAloudMode, speak]);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        resetAll,
        voiceState,
        startVoice,
        stopVoice,
        speak,
        stop,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

// Hook for consuming context
export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
};
