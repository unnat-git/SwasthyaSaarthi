'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, CheckCircle2, Wand2 } from 'lucide-react';

interface VoiceVitalsInputProps {
  onVitalsParsed: (parsedData: {
    name?: string;
    gender?: string;
    villageName?: string;
    age?: number;
    glucose?: number;
    systolicBp?: number;
    diastolicBp?: number;
    bmi?: number;
    cholesterol?: number;
    smoker?: number;
    saltIntakeHigh?: number;
    familyHistory?: number;
  }) => void;
  lang?: 'en' | 'hi';
}

const translations = {
  en: {
    voiceTitle: "Voice-First Vitals Assistant",
    voiceSubtitle: 'Speak or type details: "Patient Priya, age 52, BP 135/85, glucose 160"',
    voicePlaceholder: 'No speech recorded yet. Tap "Voice Input" above or type clinical notes directly here to test parsing.',
    voiceInput: "Voice Input",
    stopParse: "Stop & Parse",
    parseVitals: "Parse Vitals",
    parsing: "Parsing...",
    speechNotSupported: "Note: Web Speech API is not supported in this browser. Voice Input will simulate sample patient data. You can still type details manually in the transcript box and click Parse Vitals.",
    transcriptLabel: "Spoken/Typed Transcript:",
  },
  hi: {
    voiceTitle: "आवाज-आधारित विटल्स सहायक",
    voiceSubtitle: 'विवरण बोलें या टाइप करें: "रोगी प्रिया, उम्र 52, बीपी 135/85, ग्लूकोज 160"',
    voicePlaceholder: 'अभी तक कोई आवाज रिकॉर्ड नहीं हुई है। ऊपर "आवाज इनपुट" पर टैप करें या नैदानिक नोट्स सीधे यहां टाइप करके परीक्षण करें।',
    voiceInput: "आवाज इनपुट",
    stopParse: "रोकें और निकालें",
    parseVitals: "विटल्स निकालें",
    parsing: "विश्लेषण हो रहा है...",
    speechNotSupported: "नोट: इस ब्राउज़र में वेब स्पीच एपीआई समर्थित नहीं है। आवाज इनपुट नमूना रोगी डेटा का अनुकरण करेगा। आप अभी भी प्रतिलेख बॉक्स में मैन्युअल रूप से विवरण टाइप कर सकते हैं और विटल्स निकालें पर क्लिक कर सकते हैं।",
    transcriptLabel: "बोली गई/लिखी गई प्रतिलिपि:",
  }
};

export default function VoiceVitalsInput({ onVitalsParsed, lang = 'en' }: VoiceVitalsInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscriptState] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [supported, setSupported] = useState(true);
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  const t = translations[lang];

  const setTranscript = (val: string) => {
    setTranscriptState(val);
    transcriptRef.current = val;
  };

  useEffect(() => {
    setSelectedLang(lang === 'hi' ? 'hi-IN' : 'en-IN');
  }, [lang]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSupported(false);
      }
    }
  }, []);

  const parseSpeechToVitals = async (text: string) => {
    if (!text.trim()) {
      setFeedback('Please speak or type some text first.');
      return;
    }
    setIsParsing(true);
    setFeedback('AI Vitals Assistant parsing text...');
    
    // 1. Local regex parsing for instant local fallback
    const lower = text.toLowerCase();
    const localParsed: any = {};

    // Local Name Extraction
    const nameMatch = text.match(/(?:(?:patient|full)?\s*name(?:\s+is)?)\s+([a-zA-Z\s]+?)(?=\s*(?:\b(?:is|aged?|\d+|years?|from|male|female|gender|sex|bp|blood|pressure|systolic|diastolic|weight|height|bmi|cholesterol|glucose|sugar|smoker|smoke|active|activity|family|history|village|gaav|gram|with|having)\b|[,.:;]|$))/i)
      || text.match(/(?:patient(?:\s+is)?)\s+([a-zA-Z\s]+?)(?=\s*(?:\b(?:is|aged?|\d+|years?|from|male|female|gender|sex|bp|blood|pressure|systolic|diastolic|weight|height|bmi|cholesterol|glucose|sugar|smoker|smoke|active|activity|family|history|village|gaav|gram|with|having)\b|[,.:;]|$))/i)
      || text.match(/^\s*([a-zA-Z\s]+?)(?=\s*(?:\b(?:is|aged?|\d+|years?|from|male|female|gender|sex|bp|blood|pressure|systolic|diastolic|weight|height|bmi|cholesterol|glucose|sugar|smoker|smoke|active|activity|family|history|village|gaav|gram|with|having)\b|[,.:;]|$))/i);
    if (nameMatch) {
      const candidate = nameMatch[1].trim();
      if (candidate.length > 2 && !['my', 'the', 'a', 'patient', 'this', 'age', 'gender', 'male', 'female', 'from', 'name', 'full'].includes(candidate.toLowerCase())) {
        localParsed.name = candidate.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }

    // Local Village Name Extraction
    const villageMatch = text.match(/(?:village(?:\s+name)?(?:\s+is)?|resident\s+of|gaav|gram)\s+([a-zA-Z0-9\s]+?)(?=\s*(?:\b(?:is|aged?|\d+|years?|gender|male|female|bp|blood|weight|height|with|having|glucose|sugar|cholesterol|smoker|active)\b|[,.:;]|$))/i);
    if (villageMatch) {
      const candidate = villageMatch[1].trim();
      if (candidate.length > 2 && !['the', 'a', 'in', 'is', 'area', 'name'].includes(candidate.toLowerCase())) {
        localParsed.villageName = candidate.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }

    const ageMatch = lower.match(/(?:age|years old)\s*(\d{1,3})/i) || lower.match(/(\d{1,3})\s*(?:years old|age)/i);
    if (ageMatch) localParsed.age = parseInt(ageMatch[1], 10);

    const glucoseMatch = lower.match(/(?:glucose|sugar)\s*(\d{2,3})/i);
    if (glucoseMatch) localParsed.glucose = parseInt(glucoseMatch[1], 10);

    const bpMatch = lower.match(/(?:blood pressure|bp)\s*(\d{2,3})\s*(?:over|\/)?\s*(\d{2,3})?/i);
    if (bpMatch) {
      localParsed.systolicBp = parseInt(bpMatch[1], 10);
      if (bpMatch[2]) localParsed.diastolicBp = parseInt(bpMatch[2], 10);
    }

    const systolicMatch = lower.match(/systolic\s*(\d{2,3})/i);
    if (systolicMatch) localParsed.systolicBp = parseInt(systolicMatch[1], 10);

    const diastolicMatch = lower.match(/diastolic\s*(\d{2,3})/i);
    if (diastolicMatch) localParsed.diastolicBp = parseInt(diastolicMatch[1], 10);

    const bmiMatch = lower.match(/bmi\s*(\d{1,2}(?:\.\d)?)/i);
    if (bmiMatch) localParsed.bmi = parseFloat(bmiMatch[1]);

    const cholMatch = lower.match(/cholesterol\s*(\d{2,3})/i);
    if (cholMatch) localParsed.cholesterol = parseInt(cholMatch[1], 10);

    if (lower.includes('smoker') || lower.includes('smoke yes')) localParsed.smoker = 1;
    if (lower.includes('high salt') || lower.includes('salt high')) localParsed.saltIntakeHigh = 1;

    // Apply local parsed vitals immediately
    onVitalsParsed(localParsed);

    // 2. Fetch from backend AI NLP endpoint
    try {
      const res = await fetch('/api/nlp/extract-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });
      
      if (res.ok) {
        const backendData = await res.json();
        
        // Normalize backend snake_case to frontend camelCase
        const mappedData: any = {};
        if (backendData.name) mappedData.name = backendData.name;
        if (backendData.age) mappedData.age = backendData.age;
        if (backendData.gender) mappedData.gender = backendData.gender;
        if (backendData.glucose) mappedData.glucose = backendData.glucose;
        if (backendData.bmi) mappedData.bmi = backendData.bmi;
        if (backendData.cholesterol) mappedData.cholesterol = backendData.cholesterol;
        if (backendData.smoker !== undefined && backendData.smoker !== null) mappedData.smoker = backendData.smoker;
        if (backendData.village_name) mappedData.villageName = backendData.village_name;
        if (backendData.systolic_bp) mappedData.systolicBp = backendData.systolic_bp;
        if (backendData.diastolic_bp) mappedData.diastolicBp = backendData.diastolic_bp;
        if (backendData.family_history_present !== undefined && backendData.family_history_present !== null) {
          mappedData.familyHistory = backendData.family_history_present;
        }

        // Apply final combined and normalized dataset
        const finalData = { ...localParsed, ...mappedData };
        onVitalsParsed(finalData);

        const extracted = Object.keys(mappedData).map(k => k.toUpperCase()).join(', ');
        if (extracted) {
          setFeedback(`Successfully parsed AI fields: ${extracted}`);
        } else {
          setFeedback('Text parsed successfully. Forms updated.');
        }
      } else {
        setFeedback('AI Parser unavailable. Local fallback applied.');
      }
    } catch (e) {
      console.warn('NLP backend unreachable, using local fallback:', e);
      setFeedback('Offline local parsing applied.');
    } finally {
      setIsParsing(false);
    }
  };

  const startListening = () => {
    setFeedback(null);
    setTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Simulation mode for environments without Speech API
      setIsListening(true);
      const timer = setTimeout(() => {
        const samplePhrases = selectedLang === 'hi-IN' ? [
          "नाम सुनीता देवी उम्र चौवन साल गाँव रामपुर सेक्टर चार ग्लूकोज़ एक सौ पैंसठ बीपी एक सौ पैंतालीस और बानवे",
          "नाम प्रिया शर्मा उम्र बयालीस साल गाँव रामपुर ग्लूकोज़ एक सौ दस बीपी एक सौ अट्ठाइस और बयासी",
          "उम्र पैंसठ साल ग्लूकोज़ एक सौ नब्बे सिस्टोलिक एक सौ पचपन डायस्टोलिक पचानवे गाँव छपरा"
        ] : [
          "Patient name Sunita Devi from Rampur Sector 4, age 54, glucose 165, blood pressure 145 over 92, BMI 28.5, high salt intake",
          "Age 42, name Priya Sharma, glucose 110, BP 128 over 82, cholesterol 210, smoker yes, village Rampur",
          "Age 65, glucose 190, systolic 155 diastolic 95, BMI 31, family history yes, village Chapra"
        ];
        const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
        setTranscript(randomPhrase);
        parseSpeechToVitals(randomPhrase);
        setIsListening(false);
      }, 2500);
      (window as any).voiceSimTimer = timer;
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLang;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const currentText = finalTranscript || interimTranscript;
      if (currentText) {
        setTranscript(currentText);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'language-not-supported') {
        setFeedback(`Voice recognition in Hindi is not supported by your browser/device. Switched language back to English (India).`);
        setSelectedLang('en-IN');
      } else {
        const fallbackPhrase = selectedLang === 'hi-IN' 
          ? "नाम सुनीता देवी उम्र चौवन साल गाँव रामपुर ग्लूकोज़ एक सौ पैंसठ बीपी एक सौ पैंतालीस और बानवे"
          : "Patient Sunita Devi, age 48, village Rampur Sector 4, BP 145 over 92, glucose 142, BMI 27.5, high salt diet";
        setTranscript(fallbackPhrase);
        setFeedback(event.error === 'not-allowed'
          ? 'Microphone permission blocked or unavailable. Loaded simulated speech sample below.'
          : `Speech recognition error (${event.error}). Loaded simulated sample below.`);
        parseSpeechToVitals(fallbackPhrase);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Automatically parse when speech ends
      if (transcriptRef.current) {
        parseSpeechToVitals(transcriptRef.current);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    } else if ((window as any).voiceSimTimer) {
      clearTimeout((window as any).voiceSimTimer);
      (window as any).voiceSimTimer = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="bg-stitch-indigo/5 border border-stitch-indigo/20 rounded-stitch p-4 my-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stitch-indigo text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-stitch-gold-light" />
          </div>
          <div>
            <h4 className="font-bold text-stitch-indigo text-base flex items-center gap-2">
              {t.voiceTitle}
            </h4>
            <p className="text-xs text-stitch-muted">
              {t.voiceSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isListening}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl focus:ring-2 focus:ring-stitch-teal outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="en-IN">English (India) 🇮🇳</option>
            <option value="hi-IN">Hindi (हिन्दी) 🇮🇳</option>
            <option value="en-US">English (US) 🇺🇸</option>
          </select>

          <button
            type="button"
            onClick={toggleListening}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-stitch-teal hover:bg-stitch-teal-dark text-white'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" />
                <span>{t.stopParse}</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>{t.voiceInput}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-600">{t.transcriptLabel}</label>
        <div className="relative">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={t.voicePlaceholder}
            className="w-full min-h-[80px] p-3 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-stitch-teal focus:border-transparent outline-none resize-y"
          />
          <button
            type="button"
            onClick={() => parseSpeechToVitals(transcript)}
            disabled={isParsing || !transcript.trim()}
            className="absolute bottom-3 right-3 px-3 py-1.5 bg-stitch-indigo hover:bg-stitch-indigo/90 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{isParsing ? t.parsing : t.parseVitals}</span>
          </button>
        </div>
      </div>

      {!supported && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-start gap-1.5">
          <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
          <span>{t.speechNotSupported}</span>
        </div>
      )}

      {feedback && (
        <div className={`text-xs font-semibold p-2.5 rounded-lg flex items-center gap-1.5 ${
          feedback.includes('error') || feedback.includes('blocked')
            ? 'text-amber-800 bg-amber-50 border border-amber-200'
            : 'text-emerald-800 bg-emerald-50 border border-emerald-200'
        }`}>
          {feedback.includes('error') || feedback.includes('blocked') ? (
            <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          )}
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
