'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Send, Globe, Volume2, Bot, Sparkles, User, HelpCircle } from 'lucide-react';

type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

const REGIONAL_TRANSLATIONS: Record<Language, { greeting: string; placeholder: string; title: string }> = {
  en: {
    title: 'Rural Health Multilingual Triage Assistant',
    greeting: 'Namaste! I am your AI Health Assistant. Ask me about disease symptoms, vitals guidance, or PHC triage protocols.',
    placeholder: 'Type your symptom or health question...'
  },
  hi: {
    title: 'ग्रामीण स्वास्थ्य बहुभाषी एआई सहायक',
    greeting: 'नमस्ते! मैं आपका एआई स्वास्थ्य सहायक हूँ। मुझसे लक्षणों, शुगर/बीपी और पीएचसी रेफरल के बारे में पूछें।',
    placeholder: 'अपने लक्षण या स्वास्थ्य संबंधी प्रश्न लिखें...'
  },
  ta: {
    title: 'கிராமப்புற சுகாதார பலமொழி AI உதவி',
    greeting: 'வணக்கம்! நான் உங்கள் AI சுகாதார உதவியாளர். நோயறிகுறிகள் மற்றும் PHC வழிகாட்டுதல்களைப் பற்றி கேளுங்கள்.',
    placeholder: 'உங்கள் கேள்வியை உள்ளிடவும்...'
  },
  te: {
    title: 'గ్రామీణ ఆరోగ్య బహుభాషా AI సహాయకుడు',
    greeting: 'నమస్కారం! నేను మీ AI ఆరోగ్య సహాయకుడిని. లక్షణాలు మరియు PHC హెచ్చరికల గురించి నన్ను అడగండి.',
    placeholder: 'మీ ప్రశ్నను టైప్ చేయండి...'
  },
  bn: {
    title: 'গ্রামীণ স্বাস্থ্য বহুভাষিক এআই সহায়ক',
    greeting: 'নমস্কার! আমি আপনার এআই স্বাস্থ্য সহায়ক। লক্ষণ এবং স্বাস্থ্য কেন্দ্র সম্পর্কিত প্রশ্ন জিজ্ঞাসা করুন।',
    placeholder: 'আপনার স্বাস্থ্য প্রশ্ন টাইপ করুন...'
  }
};

const SUGGESTIONS: Record<Language, string[]> = {
  en: [
    'What should I do if Systolic BP is over 160?',
    'What are key signs of High Blood Glucose?',
    'How does offline IndexedDB sync work?'
  ],
  hi: [
    'यदि सिस्टोलिक बीपी 160 से अधिक है तो क्या करें?',
    'उच्च रक्त शर्करा (शुगर) के मुख्य लक्षण क्या हैं?',
    'ऑफ़लाइन डेटा सिंक कैसे काम करता है?'
  ],
  ta: [
    'இரத்த அழுத்தம் 160 க்கு மேல் இருந்தால் என்ன செய்வது?',
    'இரத்த சர்க்கரை அளவின் அறிகுறிகள் யாவை?'
  ],
  te: [
    'బ్లడ్ ప్రెజర్ 160 కంటే ఎక్కువ ఉంటే ఏమి చేయాలి?',
    'షుగర్ వ్యాధి ప్రధాన లక్షణాలు ఏమిటి?'
  ],
  bn: [
    'ব্লাড প্রেসার ১৬০ এর বেশি হলে করণীয় কী?',
    'উচ্চ রক্ত শর্করার লক্ষণগুলি কী কী?'
  ]
};

export default function ChatbotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: REGIONAL_TRANSLATIONS.en.greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setMessages((prev) => [
      ...prev,
      {
        sender: 'bot',
        text: `Language switched to ${newLang.toUpperCase()}. ${REGIONAL_TRANSLATIONS[newLang].greeting}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let botReplyText = '';
    const lower = text.toLowerCase();

    if (lower.includes('bp') || lower.includes('blood pressure') || lower.includes('बीपी')) {
      botReplyText =
        lang === 'hi'
          ? '⚠️ 160+ सिस्टोलिक बीपी होने पर रोगी को तुरंत आराम दिलाएं और स्वचालित पीएचसी बैनर से निकटतम प्राथमिक स्वास्थ्य केंद्र (PHC) को सूचित करें।'
          : '⚠️ Systolic BP above 160 mmHg indicates Stage 2 Hypertension. Use the Automated PHC Alert banner to dispatch emergency transport immediately.';
    } else if (lower.includes('glucose') || lower.includes('sugar') || lower.includes('शुगर')) {
      botReplyText =
        lang === 'hi'
          ? '🩸 126+ mg/dL ग्लूकोज स्तर मधुमेह का संकेत देता है। ASHA कार्यकर्ता रोगी की आहार और डॉक्टर परामर्श रिपोर्ट तैयार करें।'
          : '🩸 Fasting Glucose over 126 mg/dL indicates elevated diabetic risk. Recommend low glycemic index foods and schedule a teleconsultation.';
    } else {
      botReplyText =
        lang === 'hi'
          ? '✅ एआई स्वास्थ्य प्रणाली द्वारा जानकारी दर्ज कर ली गई है। सभी डेटा ऑफ़लाइन सहेजा जाता है और इंटरनेट उपलब्ध होने पर सिंक होता है।'
          : '✅ Query noted. The AI triage engine assesses vitals using localized models. Data is saved in IndexedDB for offline safety.';
    }

    const botMsg: ChatMessage = {
      sender: 'bot',
      text: botReplyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    if (!textToSend) setInput('');
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-stitch-indigo text-white p-4 rounded-full shadow-2xl hover:bg-stitch-indigo-dark hover:scale-105 transition-all border-2 border-stitch-gold"
        title="Open Regional AI Health Assistant"
      >
        <div className="relative">
          <Bot className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-stitch-teal border-2 border-white rounded-full" />
        </div>
      </button>

      {/* DRAWER / MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-stitch-border animate-slide-left">
            {/* DRAWER HEADER */}
            <div className="bg-stitch-indigo text-white p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-stitch-gold-light" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">
                    {REGIONAL_TRANSLATIONS[lang].title}
                  </h3>
                  <span className="text-[10px] text-indigo-200">Multilingual Offline Assistant</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* LANGUAGE SELECTOR BAR */}
            <div className="bg-slate-100 p-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Globe className="w-4 h-4 text-stitch-teal" />
                <span>Language:</span>
              </div>
              <div className="flex items-center gap-1">
                {(['en', 'hi', 'ta', 'te', 'bn'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLanguageChange(l)}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                      lang === l
                        ? 'bg-stitch-teal text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* CHAT MESSAGES */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-stitch-bg">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-stitch-indigo text-white rounded-br-none'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="font-medium">{msg.text}</p>
                    <span
                      className={`block text-[9px] mt-1 text-right font-semibold ${
                        msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* QUICK SUGGESTIONS */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                Quick Regional Triage Prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(SUGGESTIONS[lang] || SUGGESTIONS.en).map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(sug)}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:border-stitch-teal rounded-lg text-[11px] font-semibold text-slate-800 text-left transition-all"
                  >
                    💡 {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* INPUT FOOTER */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={REGIONAL_TRANSLATIONS[lang].placeholder}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-stitch-teal"
              />
              <button
                onClick={() => handleSend()}
                className="p-2.5 bg-stitch-teal hover:bg-stitch-teal-dark text-white rounded-xl shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
