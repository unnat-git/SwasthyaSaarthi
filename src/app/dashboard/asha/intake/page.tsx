'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, logout } from '../../../../lib/auth';
import { createPatient, nlpExtractVitals } from '../../../../lib/api';
import { saveOfflineIntake } from '../../../../lib/offlineQueue';

interface FormData {
  name: string;
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  systolic_bp: string;
  diastolic_bp: string;
  heart_rate: string;
  cholesterol: string;
  glucose: string;
  smoker: string;
  alcohol_use: string;
  physical_activity: string;
  family_history_present: string;
  family_history_details: string;
  known_condition_present: string;
  known_condition_details: string;
  village_name: string;
}

const EMPTY_FORM: FormData = {
  name: '', age: '', gender: '', height_cm: '', weight_kg: '',
  systolic_bp: '', diastolic_bp: '', heart_rate: '',
  cholesterol: '', glucose: '', smoker: '0', alcohol_use: '0',
  physical_activity: 'moderate', family_history_present: '0',
  family_history_details: '', known_condition_present: '0',
  known_condition_details: '', village_name: ''
};

function parseVoiceToForm(transcript: string, lang = 'en'): Partial<FormData> {
  const t = transcript;
  const tl = t.toLowerCase();
  const result: Partial<FormData> = {};

  // Name extraction with colon/equals separator support
  const engStopLook = 'is|aged?|\\d+|years?|from|male|female|gender|sex|bp|blood|pressure|systolic|diastolic|weight|height|bmi|cholesterol|glucose|sugar|smoker|smoke|active|activity|family|history|village|gaav|gram|with|having';
  const stopLook = engStopLook;

  const nameMatch =
    t.match(/(?:(?:\u092e\u0947\u0930\u0947|\u0939\u092e\u093e\u0930\u0947)\s+)?(?:\u0930\u094b\u0917\u0940|\u092e\u0930\u0940\u091c)\s+(?:\u0915\u093e|\u0915\u0940|\u0915\u0947)\s+\u0928\u093e\u092e\s*[:\s=|-]+\s*([\p{L}\p{M}][\p{L}\p{M}\s]{0,38}?)(?=\s+(?:is|years?|from|male|female|age|bp|weight|height|glucose|sugar|\u0909\u092e\u094d\u0930|\u0935\u091c\u0928|\u0917\u093e\u0901\u0935)(?:\s+|$|[.,:;])|[,.:;]|$)/iu) ||
    t.match(/(?<![\p{L}\p{M}])\u0928\u093e\u092e\s*[:\s=|-]+\s*([\p{L}\p{M}][\p{L}\p{M}\s]{0,38}?)(?=\s+(?:is|years?|from|male|female|age|bp|\u0909\u092e\u094d\u0930|\u0935\u091c\u0928|\u0917\u093e\u0901\u0935)(?:\s+|$|[.,:;])|[,.:;]|$)/iu) ||
    t.match(/(?:(?:patient|full)?\s*name|my\s+patient\s+is|patient(?:\s+name)?\s+is|name\s+is|patient\s+is)\s*[:\s=|-]+\s*([\p{L}\p{M}][\p{L}\p{M}\s]{0,38}?)(?=\s+(?:is|years?|from|male|female|age|bp|weight|height|glucose|sugar)(?:\s+|$|[.,:;])|[,.:;]|$)/iu) ||
    t.match(/^([\p{L}\p{M}][\p{L}\p{M}\s]{0,38}?)(?=\s+(?:is|years?|from|male|female|age|bp|\u0909\u092e\u094d\u0930|\u0935\u091c\u0928)(?:\s+|$|[.,:;])|[,.:;])/iu);

  if (nameMatch) {
    const raw = (nameMatch[1] || '').trim();
    if (raw.split(/\s+/).length <= 5 && raw.length >= 2)
      result.name = raw.replace(/\b\w/g, c => c.toUpperCase());
  }

  // Age with colon/equals/Hindi separators
  const ageMatch =
    tl.match(/(?:aged?|age|\u0909\u092e\u094d\u0930)\s*[:\s=|-]+\s*(\d{1,3})/) ||
    tl.match(/(\d{1,3})\s*(?:years?\s*old|years?|yrs?|\u0938\u093e\u0932|\u0935\u0930\u094d\u0937)/) ||
    tl.match(/(?:aged?|age\s*is|age\s*=|\u0909\u092e\u094d\u0930)\s*(\d{1,3})/);
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    if (age >= 1 && age <= 120) result.age = String(age);
  }

  // Gender with colon/equals/Hindi separators
  const genderMatch = tl.match(/(?:gender|sex|\u0932\u093f\u0902\u0917)\s*[:\s=|-]+\s*(male|female|other|\u092a\u0941\u0930\u0941\u0937|\u092e\u0939\u093f\u0932\u093e|\u0938\u094d\u0924\u094d\u0930\u0940|\u0905\u0928\u094d\u092f)/i);
  if (genderMatch) {
    const g = genderMatch[1].toLowerCase();
    if (['male', '\u092a\u0941\u0930\u0941\u0937'].includes(g)) result.gender = 'Male';
    else if (['female', '\u092e\u0939\u093f\u0932\u093e', '\u0938\u094d\u0924\u094d\u0930\u0940'].includes(g)) result.gender = 'Female';
  } else {
    if (/\bfemale\b|\bwomen?\b|\blady\b|\u092e\u0939\u093f\u0932\u093e|\u0938\u094d\u0924\u094d\u0930\u0940/i.test(tl)) result.gender = 'Female';
    else if (/\bmale\b|\bman\b|\bgent\b|\u092a\u0941\u0930\u0941\u0937/i.test(tl)) result.gender = 'Male';
  }

  // Height with colon/equals
  const heightMatch =
    tl.match(/(?:height|\u0932\u0902\u092c\u093e\u0908|\u0909\u0902\u091a\u093e\u0908)\s*[:\s=|-]+\s*(\d{2,3})\s*(?:cm|centimeters?|centimetres?|\u0938\u0947\u0902\u091f\u0940\u092e\u0940\u091f\u0930)?/i) ||
    tl.match(/(?:height|\u0932\u0902\u092c\u093e\u0908|\u0909\u0902\u091a\u093e\u0908)\s*(?:is|=|\u0939\u0948)?\s*(\d{2,3})\s*(?:cm|centimeters?|\u0938\u0947\u0902\u091f\u0940\u092e\u0940\u091f\u0930)?/i);
  if (heightMatch) {
    const h = parseInt(heightMatch[1]);
    if (h >= 50 && h <= 250) result.height_cm = String(h);
  }

  // Weight with colon/equals
  const weightMatch =
    tl.match(/(?:weight|\u0935\u091c\u0928|\u092d\u093e\u0930)\s*[:\s=|-]+\s*(\d{2,3})\s*(?:kg|kilograms?|kilos?|\u0915\u093f\u0932\u094b\u0917\u094d\u0930\u093e\u092e|\u0915\u093f\u0932\u094b)?/i) ||
    tl.match(/(?:weight|\u0935\u091c\u0928|\u092d\u093e\u0930)\s*(?:is|=|\u0939\u0948)?\s*(\d{2,3})\s*(?:kg|kilograms?|kilos?|\u0915\u093f\u0932\u094b)?/i);
  if (weightMatch) {
    const w = parseInt(weightMatch[1]);
    if (w >= 5 && w <= 300) result.weight_kg = String(w);
  }

  // Blood Pressure with colon/equals/Hindi separators
  const bpMatch =
    tl.match(/(?:blood\s*pressure|bp|b\.p\.?|\u0930\u0915\u094d\u0924\u091a\u093e\u092a|\u092c\u0940\u092a\u0940)\s*[:\s=|-]+\s*(\d{2,3})\s*(?:over|\/|by|upon|\u0914\u0930|\u092c\u091f\u0947|\u092c\u091f\u093e|\u092c\u093e\u092f)\s*(\d{2,3})/i) ||
    tl.match(/(?:blood\s*pressure|bp|b\.p\.?|\u0930\u0915\u094d\u0924\u091a\u093e\u092a|\u092c\u0940\u092a\u0940)\s*(?:is|=)?\s*(\d{2,3})\s*(?:over|\/|by|upon|\u0914\u0930|\u092c\u091f\u0947|\u092c\u091f\u093e|\u092c\u093e\u092f)\s*(\d{2,3})/i) ||
    tl.match(/(\d{2,3})\s*(?:over|\/|by|\u0914\u0930|\u092c\u091f\u0947|\u092c\u091f\u093e|\u092c\u093e\u092f)\s*(\d{2,3})\s*(?:mm\s*hg|mmhg|\u092c\u0940\u092a\u0940|\u0930\u0915\u094d\u0924\u091a\u093e\u092a)?/i);
  if (bpMatch) {
    const sbp = parseInt(bpMatch[1]), dbp = parseInt(bpMatch[2]);
    if (sbp >= 60 && sbp <= 240) result.systolic_bp = String(sbp);
    if (dbp >= 40 && dbp <= 160) result.diastolic_bp = String(dbp);
  }

  // Heart rate
  const hrMatch =
    tl.match(/(?:heart\s*rate|pulse|hr|\u0927\u095c\u0915\u0928|\u092a\u0932\u094d\u0938|\u0939\u093e\u0930\u094d\u091f\s*\u0930\u0947\u091f)\s*[:\s=|-]+\s*(\d{2,3})/i) ||
    tl.match(/(?:heart\s*rate|pulse|hr|\u0927\u095c\u0915\u0928|\u092a\u0932\u094d\u0938)\s*(?:is|=)?\s*(\d{2,3})/i);
  if (hrMatch) {
    const hr = parseInt(hrMatch[1]);
    if (hr >= 30 && hr <= 250) result.heart_rate = String(hr);
  }

  // Glucose
  const glucMatch =
    tl.match(/(?:glucose|blood\s*sugar|fasting\s*sugar|sugar\s*level|sugar|\u0917\u094d\u0932\u0942\u0915\u094b\u091c|\u0936\u0941\u0917\u0930|\u092b\u093e\u0938\u094d\u091f\u093f\u0902\u0917\s*\u0936\u0941\u0917\u0930)\s*[:\s=|-]+\s*(\d{2,3})/i) ||
    tl.match(/(?:glucose|blood\s*sugar|fasting\s*sugar|sugar|\u0917\u094d\u0932\u0942\u0915\u094b\u091c|\u0936\u0941\u0917\u0930)\s*(?:is|=|\u0939\u0948)?\s*(\d{2,3})/i) ||
    tl.match(/(\d{2,3})\s*(?:mg\/dl)?\s*(?:glucose|sugar|\u0917\u094d\u0932\u0942\u0915\u094b\u091c|\u0936\u0941\u0917\u0930)/i);
  if (glucMatch) {
    const g = parseInt(glucMatch[1]);
    if (g >= 40 && g <= 600) result.glucose = String(g);
  }

  // Cholesterol
  const cholMatch =
    tl.match(/(?:cholesterol|fat|lipid|\u0915\u094b\u0932\u0947\u0938\u094d\u091f\u094d\u0930\u0949\u0932|\u0915\u094b\u0932\u0947\u0938\u094d\u091f\u094d\u0930\u094b\u0932)\s*[:\s=|-]+\s*(\d{2,3})/i) ||
    tl.match(/(?:cholesterol|fat|lipid|\u0915\u094b\u0932\u0947\u0938\u094d\u091f\u094d\u0930\u0949\u0932)\s*(?:is|=)?\s*(\d{2,3})/i);
  if (cholMatch) {
    const c = parseInt(cholMatch[1]);
    if (c >= 50 && c <= 600) result.cholesterol = String(c);
  }

  // Smoking - explicit Yes/No colon format first
  const smokerMatch = tl.match(/(?:smoker|smoking|smoke|tobacco|beedi|cigarette|\u0927\u0942\u092e\u094d\u0930\u092a\u093e\u0928|\u0924\u0902\u092c\u093e\u0916\u0942|\u092c\u0940\u095c\u0940|\u0938\u093f\u0917\u0930\u0947\u091f)\s*[:\s=|-]+\s*(yes|active|daily|1|no|none|0|\u0928\u0939\u0940\u0902|\u0928\u093e|\u0939\u093e\u0901)/i);
  if (smokerMatch) {
    const val = smokerMatch[1].toLowerCase();
    if (['no', 'none', '0', '\u0928\u0939\u0940\u0902', '\u0928\u093e'].includes(val)) result.smoker = '0';
    else result.smoker = '1';
  } else {
    if (/does\s+not\s+smoke|non[\s-]?smoker|no\s+smok|non\s*tobacco|\u0927\u0942\u092e\u094d\u0930\u092a\u093e\u0928\s*\u0928\u0939\u0940\u0902|\u0924\u0902\u092c\u093e\u0916\u0942\s*\u0928\u0939\u0940\u0902|\u092c\u0940\u095c\u0940\s*\u0928\u0939\u0940\u0902|\u0917\u0941\u091f\u0916\u093e\s*\u0928\u0939\u0940\u0902/i.test(tl)) result.smoker = '0';
    else if (/\bsmoke[sr]?\b|\btobacco\b|\bbeedi\b|\bcigarette\b|\bgutkha\b|\u0927\u0942\u092e\u094d\u0930\u092a\u093e\u0928|\u0924\u0902\u092c\u093e\u0916\u0942|\u092c\u0940\u095c\u0940|\u0938\u093f\u0917\u0930\u0947\u091f|\u0917\u0941\u091f\u0916\u093e|\u0916\u0948\u0928\u0940/i.test(tl)) result.smoker = '1';
  }

  // Alcohol - explicit Yes/No colon format first
  const alcoholMatch = tl.match(/(?:alcohol|drinks?|drinking|sharab|daroo|\u0926\u093e\u0930\u0942|\u0936\u0930\u093e\u092c|alcohol\s+use)\s*[:\s=|-]+\s*(yes|active|weekly|1|no|none|0|\u0928\u0939\u0940\u0902|\u0928\u093e|\u0939\u093e\u0901)/i);
  if (alcoholMatch) {
    const val = alcoholMatch[1].toLowerCase();
    if (['no', 'none', '0', '\u0928\u0939\u0940\u0902', '\u0928\u093e'].includes(val)) result.alcohol_use = '0';
    else result.alcohol_use = '1';
  } else {
    if (/no\s+alcohol|does\s+not\s+drink|non[\s-]?drinker|no\s+drinking|\u0936\u0930\u093e\u092c\s*\u0928\u0939\u0940\u0902|\u0926\u093e\u0930\u0942\s*\u0928\u0939\u0940\u0902|\u0928\u0936\u093e\s*\u0928\u0939\u0940\u0902/i.test(tl)) result.alcohol_use = '0';
    else if (/drinks?\s+alcohol|\bdrinks?\b|consumes?\s+alcohol|alcohol\s+yes|\u0936\u0930\u093e\u092c|\u0926\u093e\u0930\u0942|\u092e\u0926\u093f\u0930\u093e/i.test(tl)) result.alcohol_use = '1';
  }

  // Physical activity
  if (/low\s+(?:physical\s+)?activity|sedentary|inactive|no\s+exercise|\u0935\u094d\u092f\u093e\u092f\u093e\u092e\s*\u0928\u0939\u0940\u0902|\u0938\u0915\u094d\u0930\u093f\u092f\s*\u0928\u0939\u0940\u0902/i.test(tl)) result.physical_activity = 'low';
  else if (/high\s+(?:physical\s+)?activity|very\s+active|regular\s+exercise|\u0928\u093f\u092f\u092e\u093f\u0924\s*\u0935\u094d\u092f\u093e\u092f\u093e\u092e|\u0915\u095c\u093e\s*\u092a\u0930\u093f\u0936\u094d\u0930\u092e|\u091c\u093c\u094d\u092f\u093e\u0926\u093e\s*\u0938\u0915\u094d\u0930\u093f\u092f/i.test(tl)) result.physical_activity = 'high';
  else if (/moderate\s+(?:physical\s+)?activity|moderately\s+active|\u0939\u0932\u094d\u0915\u093e\s*\u0935\u094d\u092f\u093e\u092f\u093e\u092e|\u092e\u0927\u094d\u092f\u092e\s*\u0935\u094d\u092f\u093e\u092f\u093e\u092e|\u0938\u0915\u094d\u0930\u093f\u092f/i.test(tl)) result.physical_activity = 'moderate';

  // Family history - explicit No/Yes format
  const famHistMatch = tl.match(/(?:family\s+history|family|history|\u092a\u0930\u093f\u0935\u093e\u0930|\u092a\u093e\u0930\u093f\u0935\u093e\u0930\u093f\u0915)\s*[:\s=|-]+\s*(yes|present|1|no|none|0|\u0928\u0939\u0940\u0902|\u0928\u093e|\u0939\u093e\u0901|\u0939\u0948)/i);
  if (famHistMatch) {
    const val = famHistMatch[1].toLowerCase();
    if (['no', 'none', '0', '\u0928\u0939\u0940\u0902', '\u0928\u093e'].includes(val)) {
      result.family_history_present = '0';
    } else {
      result.family_history_present = '1';
      result.family_history_details = lang === 'hi' ? '\u092a\u0930\u093f\u0935\u093e\u0930 \u092e\u0947\u0902 \u092c\u0940\u092e\u093e\u0930\u0940 \u0915\u093e \u0907\u0924\u093f\u0939\u093e\u0938 \u0939\u0948' : 'Family history present';
    }
  } else if (/father|mother|parent|family\s+history|grandfather|grandmother|\u092a\u093f\u0924\u093e|\u092e\u093e\u0924\u093e|\u0926\u093e\u0926\u093e|\u0926\u093e\u0926\u0940|\u092a\u0930\u093f\u0935\u093e\u0930/i.test(tl)) {
    result.family_history_present = '1';
    const fhm = t.match(/(?:father|mother|parents?|family|\u092a\u093f\u0924\u093e|\u092e\u093e\u0924\u093e|\u092a\u0930\u093f\u0935\u093e\u0930)\s+(?:had|has|with|of|history\s+of|\u0915\u094b|\u092e\u0947\u0902|\u0925\u093e|\u0925\u0940)\s+([\p{L}\p{M}\s]+?)(?:,|\.|and|$)/iu);
    if (fhm) {
      result.family_history_details = fhm[1].trim();
    } else {
      result.family_history_details = lang === 'hi' ? '\u092a\u0930\u093f\u0935\u093e\u0930 \u092e\u0947\u0902 \u092c\u0940\u092e\u093e\u0930\u0940 \u0915\u093e \u0907\u0924\u093f\u0939\u093e\u0938 \u0939\u0948' : 'Family history present';
    }
  }

  // Known conditions - explicit No format
  const condHistMatch = tl.match(/(?:known\s+condition|condition|disease|\u092c\u0940\u092e\u093e\u0930\u0940)\s*[:\s=|-]+\s*(no|none|0|\u0928\u0939\u0940\u0902|\u0928\u093e)/i);
  if (condHistMatch) {
    result.known_condition_present = '0';
  } else {
    const condMatch = t.match(/(?:diagnosed\s+with|has|suffering\s+from|\u0909\u0928\u094d\u0939\u0947\u0902|\u0909\u0938\u0947|\u092e\u0930\u0940\u091c\s+\u0915\u094b|\u0907\u0928\u094d\u0939\u0947\u0902|\u092c\u0940\u092e\u093e\u0930\u0940|condition)\s*[:\s=|-]*\s*([\p{L}\p{M}\s,]+?)(?=\s+(?:since|and|$|[.\u0964])|[.\u0964]$|$)/iu);
    if (condMatch) {
      const condText = condMatch[1].trim();
      if (condText.length >= 3 && condText.length <= 100 && !/^\d+$/.test(condText) && !['no', 'none', '0', '\u0928\u0939\u0940\u0902', '\u0928\u093e', 'yes', 'present'].includes(condText.toLowerCase())) {
        result.known_condition_present = '1';
        result.known_condition_details = condText;
      }
    }
    if (!result.known_condition_present) {
      const hiCondKeywords = /\u0921\u093e\u092f\u092c\u0940\u091f\u0940\u091c|\u092e\u0927\u0941\u092e\u0947\u0939|\u0909\u091a\u094d\u091a\s*\u0930\u0915\u094d\u0924\u091a\u093e\u092a|\u0939\u093e\u0907\u092a\u0930\u091f\u0947\u0902\u0936\u0928|\u0925\u093e\u092f\u0930\u093e\u0907\u0921|\u0905\u0938\u094d\u0925\u092e\u093e|\u0939\u0943\u0926\u092f\s*\u0930\u094b\u0917|\u0915\u093f\u0921\u0928\u0940\s*\u0930\u094b\u0917|\u0932\u0915\u0935\u093e/;
      if (hiCondKeywords.test(t)) {
        result.known_condition_present = '1';
        const keyword = t.match(hiCondKeywords)?.[0] ?? '';
        result.known_condition_details = result.known_condition_details ? result.known_condition_details : keyword;
      }
    }
  }

  // Village with colon/equals
  const villageMatch = t.match(/(?:village|gram|from|belongs?\s+to|resident\s+of|\u0917\u093e\u0902\u0935|\u0917\u093e\u0901\u0935|\u0917\u094d\u0930\u093e\u092e|\u0930\u0939\u0928\u0947\s+\u0935\u093e\u0932\u093e)\s*[:\s=|-]*\s*([\p{L}\s]{1,30})(?:,|\.|\s+block|\s+district|$)/iu);
  if (villageMatch) {
    const v = villageMatch[1].trim();
    if (v.split(/\s+/).length <= 5) result.village_name = v.replace(/\b\w/g, c => c.toUpperCase());
  }

  return result;
}


function validateForm(form: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  const age = Number(form.age);
  if (!form.age || isNaN(age) || age < 1 || age > 120) errors.age = 'Enter a valid age (1–120)';
  if (!form.gender) errors.gender = 'Gender is required';
  if (form.height_cm && (Number(form.height_cm) < 50 || Number(form.height_cm) > 250)) errors.height_cm = 'Height must be between 50–250 cm';
  if (form.weight_kg && (Number(form.weight_kg) < 5 || Number(form.weight_kg) > 300)) errors.weight_kg = 'Weight must be between 5–300 kg';
  const sbp = Number(form.systolic_bp);
  if (!form.systolic_bp || isNaN(sbp) || sbp < 60 || sbp > 240) errors.systolic_bp = 'Systolic BP must be 60–240 mmHg';
  const dbp = Number(form.diastolic_bp);
  if (!form.diastolic_bp || isNaN(dbp) || dbp < 40 || dbp > 160) errors.diastolic_bp = 'Diastolic BP must be 40–160 mmHg';
  if (form.heart_rate && (Number(form.heart_rate) < 30 || Number(form.heart_rate) > 250)) errors.heart_rate = 'Heart rate must be 30–250 bpm';
  if (form.cholesterol && (Number(form.cholesterol) < 50 || Number(form.cholesterol) > 600)) errors.cholesterol = 'Cholesterol must be 50–600 mg/dL';
  const gluc = Number(form.glucose);
  if (!form.glucose || isNaN(gluc) || gluc < 40 || gluc > 600) errors.glucose = 'Glucose must be 40–600 mg/dL';
  if (form.family_history_present === '1' && !form.family_history_details.trim()) errors.family_history_details = 'Please describe the family history';
  if (form.known_condition_present === '1' && !form.known_condition_details.trim()) errors.known_condition_details = 'Please describe the condition';
  return errors;
}

type Section = 'basic' | 'vitals' | 'lab' | 'lifestyle' | 'history';

const SECTION_IDS: { id: Section; icon: string; key: string }[] = [
  { id: 'basic',     icon: 'person',          key: 'section_basic' },
  { id: 'vitals',    icon: 'monitor_heart',    key: 'section_vitals' },
  { id: 'lab',       icon: 'science',          key: 'section_lab' },
  { id: 'lifestyle', icon: 'directions_run',   key: 'section_lifestyle' },
  { id: 'history',   icon: 'history_edu',      key: 'section_history' },
];

import { useLanguage } from '../../../../context/LanguageContext';

export default function PatientIntakePage() {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const [auth, setAuth] = useState<ReturnType<typeof getAuth>>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<Section>('basic');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Voice
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voicePopulated, setVoicePopulated] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef<any>(null);

  // OCR States
  const [ocrText, setOcrText] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState('');
  const [ocrError, setOcrError] = useState('');

  // Camera WebRTC states and refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);
    setOcrError('');
    setOcrPreviewUrl('');
    setOcrText('');
    
    // Give browser a split second to render the <video> element before getting user media
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Rear camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setCameraError(
          err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? '⚠️ Camera access denied. Please grant permission in your browser address bar to scan prescriptions.'
            : 'Could not access device camera. Please upload the image manually.'
        );
        setIsCameraActive(false);
      }
    }, 100);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    // Create a temporary canvas
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw the video frame onto the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Stop the camera feed
      stopCamera();
      
      // Pass the canvas directly to our OCR engine
      scanPrescription(canvas);
    }
  };

  const scanPrescription = async (fileOrCanvas: File | HTMLCanvasElement) => {
    setIsOcrLoading(true);
    setOcrProgress(0);
    setOcrStatus(t('ocr_status_initializing') || 'Initializing OCR Engine...');
    setOcrError('');
    setOcrText('');

    if (fileOrCanvas instanceof File) {
      // Create a local object URL for preview
      const previewUrl = URL.createObjectURL(fileOrCanvas);
      setOcrPreviewUrl(previewUrl);
    } else {
      // Canvas: extract image URL as data URL for preview
      const previewUrl = fileOrCanvas.toDataURL('image/png');
      setOcrPreviewUrl(previewUrl);
    }

    try {
      const { createWorker } = await import('tesseract.js');
      
      const worker = await createWorker('eng+hin', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setOcrStatus(t('ocr_status_recognizing') || 'Extracting text from prescription...');
            setOcrProgress(Math.round(m.progress * 100));
          } else {
            setOcrStatus(m.status === 'loading tesseract core' ? 'Loading Core Engine...' : 
                         m.status === 'loading language data' ? 'Loading Language Data (English/Hindi)...' :
                         m.status === 'initializing api' ? 'Initializing API...' : m.status);
          }
        }
      });

      const { data: { text } } = await worker.recognize(fileOrCanvas);
      await worker.terminate();

      if (text && text.trim()) {
        setOcrText(text);
        setOcrStatus('Done');
        applyTranscript(text);
      } else {
        setOcrError('No text could be extracted from the image. Please upload a clearer image of the prescription.');
      }
    } catch (err: any) {
      console.error('OCR Error:', err);
      setOcrError('Failed to perform OCR scan: ' + (err.message || err));
    } finally {
      setIsOcrLoading(false);
    }
  };

  const clearOcr = () => {
    setOcrText('');
    setOcrPreviewUrl('');
    setOcrProgress(0);
    setOcrStatus('');
    setOcrError('');
    setForm(EMPTY_FORM);
    setErrors({});
  };


  useEffect(() => {
    const a = getAuth();
    if (!a) { router.replace('/auth/login'); return; }
    if (a.role !== 'asha') { router.replace('/dashboard/asha'); return; }
    setAuth(a);
  }, [router]);

  useEffect(() => {
    return () => {
      // Cleanup camera tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const f = (id: keyof FormData) => ({
    value: form[id],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [id]: e.target.value }));
      setErrors(prev => ({ ...prev, [id]: '' }));
    },
    className: `field-input${errors[id] ? ' error' : ''}`,
  });

  const recognitionActiveRef = useRef(false);

  const applyTranscript = async (text: string) => {
    setTranscript(text);
    const localExtracted = parseVoiceToForm(text, lang);
    setForm(prev => ({ ...prev, ...localExtracted }));
    setVoicePopulated(true);

    try {
      const nlpData = await nlpExtractVitals(text);
      const merged: Partial<FormData> = { ...localExtracted };
      if (nlpData.name) merged.name = String(nlpData.name);
      if (nlpData.age != null) merged.age = String(nlpData.age);
      if (nlpData.gender) merged.gender = String(nlpData.gender);
      if (nlpData.height_cm) merged.height_cm = String(nlpData.height_cm);
      if (nlpData.weight_kg) merged.weight_kg = String(nlpData.weight_kg);
      if (nlpData.systolic_bp) merged.systolic_bp = String(nlpData.systolic_bp);
      if (nlpData.diastolic_bp) merged.diastolic_bp = String(nlpData.diastolic_bp);
      if (nlpData.heart_rate) merged.heart_rate = String(nlpData.heart_rate);
      if (nlpData.glucose) merged.glucose = String(nlpData.glucose);
      if (nlpData.cholesterol) merged.cholesterol = String(nlpData.cholesterol);
      if (nlpData.smoker != null) merged.smoker = String(nlpData.smoker);
      if (nlpData.alcohol_use != null) merged.alcohol_use = String(nlpData.alcohol_use);
      if (nlpData.physical_activity) merged.physical_activity = String(nlpData.physical_activity);
      if (nlpData.family_history_present != null) {
        merged.family_history_present = String(nlpData.family_history_present);
        if (nlpData.family_history_details) merged.family_history_details = String(nlpData.family_history_details);
      }
      if (nlpData.known_condition_present != null) {
        merged.known_condition_present = String(nlpData.known_condition_present);
        if (nlpData.known_condition_details) merged.known_condition_details = String(nlpData.known_condition_details);
      }
      if (nlpData.village_name) merged.village_name = String(nlpData.village_name);
      setForm(prev => ({ ...prev, ...merged }));
    } catch (_e) { /* backend NLP failed — local result already applied */ }
  };

  // Accumulated transcript across multiple mic presses
  const accumulatedRef = useRef('');

  const startVoice = () => {
    setVoiceError('');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Speech recognition not supported. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : (lang === 'bn' ? 'bn-IN' : 'en-IN');
    recognition.continuous = false;     // Single-utterance: most reliable mode
    recognition.interimResults = true;  // Show words appearing as user speaks
    recognition.maxAlternatives = 3;    // Try more alternatives for better accuracy

    let interimText = '';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError('');
    };

    recognition.onresult = (event: any) => {
      let finalChunk = '';
      interimText = '';

      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalChunk += event.results[i][0].transcript + ' ';
        } else {
          interimText += event.results[i][0].transcript;
        }
      }

      // Show what's being said live
      const live = (accumulatedRef.current + ' ' + finalChunk + interimText).trim();
      setTranscript(live);

      if (finalChunk) {
        accumulatedRef.current = (accumulatedRef.current + ' ' + finalChunk).trim();
      }
    };

    recognition.onerror = (event: any) => {
      const errCode = event.error;
      setIsListening(false);
      recognitionActiveRef.current = false;

      if (errCode === 'no-speech') {
        setVoiceError('No speech detected — speak louder and closer to the mic, then try again.');
      } else if (errCode === 'not-allowed' || errCode === 'permission-denied') {
        setVoiceError('⚠️ Microphone blocked. Click the 🔒 icon in your browser address bar and allow microphone access.');
      } else if (errCode === 'network') {
        setVoiceError('Network error — Chrome needs internet for speech recognition. Check your connection.');
      } else if (errCode === 'aborted') {
        // User stopped — this is fine
      } else {
        setVoiceError(`Recognition error (${errCode}). Try again.`);
      }

      if (accumulatedRef.current.trim()) {
        applyTranscript(accumulatedRef.current.trim());
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionActiveRef.current = false;
      if (accumulatedRef.current.trim()) {
        applyTranscript(accumulatedRef.current.trim());
      }
    };

    recognitionRef.current = recognition;
    recognitionActiveRef.current = true;
    recognition.start();
  };



  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const clearVoice = () => {
    setTranscript('');
    setVoicePopulated(false);
    setForm(EMPTY_FORM);
    setErrors({});
    accumulatedRef.current = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Jump to first section with error
      const fieldToSection: Record<string, Section> = {
        name: 'basic', age: 'basic', sex: 'basic', village_name: 'basic',
        height_cm: 'vitals', weight_kg: 'vitals', systolic_bp: 'vitals', diastolic_bp: 'vitals', heart_rate: 'vitals',
        cholesterol: 'lab', glucose: 'lab',
        smoker: 'lifestyle', alcohol_use: 'lifestyle', physical_activity: 'lifestyle',
        family_history_present: 'history', family_history_details: 'history', known_condition_present: 'history', known_condition_details: 'history',
      };
      const firstError = Object.keys(validationErrors)[0];
      if (fieldToSection[firstError]) setActiveSection(fieldToSection[firstError]);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const payload = {
      name: form.name.trim(),
      age: Number(form.age),
      gender: form.gender,
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      systolic_bp: Number(form.systolic_bp),
      diastolic_bp: Number(form.diastolic_bp),
      heart_rate: form.heart_rate ? Number(form.heart_rate) : undefined,
      cholesterol: form.cholesterol ? Number(form.cholesterol) : undefined,
      glucose: Number(form.glucose),
      smoker: Number(form.smoker),
      alcohol_use: Number(form.alcohol_use),
      physical_activity: form.physical_activity,
      family_history_present: Number(form.family_history_present),
      family_history_details: form.family_history_details || undefined,
      known_condition_present: Number(form.known_condition_present),
      known_condition_details: form.known_condition_details || undefined,
      village_name: form.village_name || undefined,
    };

    // If offline or network unavailable, save locally to offline queue
    if (!navigator.onLine) {
      const record = saveOfflineIntake(payload);
      router.push(`/dashboard/asha?offline_saved=true&name=${encodeURIComponent(record.formData.name)}`);
      return;
    }

    try {
      const patient = await createPatient(payload);
      router.push(`/patients/${patient.id}?new=true`);
    } catch (err: any) {
      // If network fails during request, save offline automatically
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || !navigator.onLine) {
        const record = saveOfflineIntake(payload);
        router.push(`/dashboard/asha?offline_saved=true&name=${encodeURIComponent(record.formData.name)}`);
        return;
      }
      setSubmitError(err.message || 'Failed to submit. Please check your data.');
      setSubmitting(false);
    }
  };

  const label = (text: string, required = true) => (
    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
      {text} {required && <span style={{ color: '#dc2626' }}>*</span>}
    </label>
  );

  const fieldErr = (id: string) => errors[id] ? (
    <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
      {errors[id]}
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: '#00685f', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 18 }}>health_and_safety</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#00685f' }}>Swastya Saarthi</span>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link className="sidebar-link" href="/dashboard/asha" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            {t('back_to_dashboard')}
          </Link>

          {/* Language selector */}
          <div style={{ padding: '0 14px', marginTop: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingLeft: 4 }}>
              Language / भाषा
            </label>
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                background: '#fff',
                border: '1.5px solid #e2e8f0',
                borderRadius: 8,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="en">English 🇺🇸</option>
              <option value="hi">हिन्दी (Hindi) 🇮🇳</option>
              <option value="bn">বাংলা (Bengali) 🇮🇳</option>
            </select>
          </div>

          <div style={{ marginTop: 24, padding: '0 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              {t('form_sections_label')}
            </div>
            {SECTION_IDS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 14px', borderRadius: 8,
                background: activeSection === s.id ? '#f0fdf4' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                color: activeSection === s.id ? '#00685f' : '#475569',
                fontWeight: activeSection === s.id ? 700 : 500, fontSize: 14,
                fontFamily: 'Inter, sans-serif', marginBottom: 2,
                position: 'relative'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{s.icon}</span>
                {t(s.key)}
                {Object.keys(errors).some(k => {
                  const m: Record<string, string[]> = {
                    basic: ['name','age','sex','village_name'],
                    vitals: ['height_cm','weight_kg','systolic_bp','diastolic_bp','heart_rate'],
                    lab: ['cholesterol','glucose'],
                    lifestyle: ['smoker','alcohol_use','physical_activity'],
                    history: ['family_history_present','family_history_details','known_condition_present','known_condition_details'],
                  };
                  return m[s.id]?.includes(k);
                }) && (
                  <span style={{
                    marginLeft: 'auto', width: 8, height: 8, background: '#dc2626',
                    borderRadius: '50%', display: 'inline-block'
                  }} />
                )}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <main className="main-with-sidebar" style={{ flex: 1, padding: '32px 36px', maxWidth: 900 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
            {t('intake_title')}
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
            {t('intake_sub')}
          </p>
        </div>

        {/* Voice Input Banner */}
        <div style={{
          background: isListening ? '#fef2f2' : voicePopulated ? '#f0fdf4' : '#eef2ff',
          border: `1.5px solid ${isListening ? '#fecaca' : voicePopulated ? '#bbf7d0' : '#c7d2fe'}`,
          borderRadius: 12, padding: '16px 20px', marginBottom: 28
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={isListening ? stopVoice : startVoice}
                className={isListening ? 'recording-pulse' : ''}
                style={{
                  width: 48, height: 48, borderRadius: '50%', border: 'none',
                  background: isListening ? '#dc2626' : '#4648d4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0
                }}
              >
                <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 22 }}>
                  {isListening ? 'stop' : 'mic'}
                </span>
              </button>
              <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: isListening ? '#dc2626' : voicePopulated ? '#15803d' : '#4648d4' }}>
                  {isListening
                    ? t('voice_status_listening')
                    : voicePopulated
                    ? t('voice_status_filled')
                    : t('voice_status_idle')}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {isListening
                    ? t('voice_hint_listening')
                    : voicePopulated
                    ? t('voice_hint_filled')
                    : t('voice_hint_idle')}
                </div>
              </div>
            </div>
            {voicePopulated && (
              <button onClick={clearVoice} className="btn-danger" style={{ height: 36, padding: '0 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>restart_alt</span>
                {t('btn_clear_form')}
              </button>
            )}
          </div>

          {transcript && (
            <div style={{
              background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '10px 14px',
              marginTop: 12, fontSize: 13, color: '#374151', fontStyle: 'italic'
            }}>
              <span style={{ fontWeight: 700, fontStyle: 'normal', color: '#4648d4' }}>{t('voice_transcribed')} </span>
              {transcript}
            </div>
          )}

          {/* Quick Voice Prompt Test Buttons */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4648d4', marginBottom: 8 }}>
              {t('voice_test_prompt')}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'EN: Ramesh Kumar', text: 'My patient is Ramesh Kumar 52 years old male from Rampur. BP is 145 over 92, glucose 130, weight 74 kg, height 168 cm. Smokes daily, drinks alcohol, low physical activity. Father had diabetes.' },
                { label: 'EN: Sunita Devi', text: 'Patient name is Sunita Devi 42 year old female. Blood pressure 130/85, fasting sugar 110, heart rate 78, cholesterol 210. Non smoker, no alcohol, moderate activity. Mother has hypertension.' },
                { label: 'HI: रमेश कुमार', text: 'रोगी का नाम रमेश कुमार उम्र 52 साल पुरुष गाँव रामपुर लम्बाई 168 सेंटीमीटर वजन 74 किलो बीपी 145 और 92 ग्लूकोज 130 धूम्रपान करता है शराब नहीं पीता व्यायाम नहीं करता' },
                { label: 'HI: सुनीता देवी', text: 'मरीज का नाम सुनीता देवी उम्र 42 साल महिला गाँव सीतापुर वजन 60 किलो बीपी 130 और 85 पल्स 78 ग्लूकोज 110 धूम्रपान नहीं शराब नहीं मध्यम व्यायाम माँ को उच्च रक्तचाप था' },
                { label: 'HI: राजेश वर्मा', text: 'मेरे मरीज का नाम राजेश वर्मा उम्र 60 साल पुरुष गांव सुल्तानपुर धूम्रपान नहीं करते शराब भी नहीं पीते और उन्हें डायबिटीज है बीपी 138 और 88 ग्लूकोज 145' },
              ].map(sample => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => applyTranscript(sample.text)}
                  style={{
                    background: sample.label.startsWith('HI') ? '#fef3c7' : '#fff',
                    border: `1px solid ${sample.label.startsWith('HI') ? '#fcd34d' : '#c7d2fe'}`,
                    borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                    color: sample.label.startsWith('HI') ? '#92400e' : '#4648d4',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                  }}
                >
                  ⚡ {sample.label}
                </button>
              ))}
            </div>
          </div>
          {voiceError && (
            <div style={{ marginTop: 10, color: '#dc2626', fontSize: 13 }}>{voiceError}</div>
          )}
        </div>

        {/* Prescription OCR Scanner */}
        <div style={{
          background: '#fff',
          border: '1.5px solid #e2e8f0',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 28,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, background: '#e0f2fe', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>document_scanner</span>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {t('ocr_scanner_title')}
              </h2>
              <p style={{ color: '#64748b', margin: 0, fontSize: 13 }}>
                {t('ocr_scanner_sub')}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: (ocrPreviewUrl || isCameraActive) ? '1.2fr 1.8fr' : '1fr', gap: 20 }}>
            {/* Left: Upload and Camera Actions / Preview / Live Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isCameraActive ? (
                // Live WebRTC Video Stream
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '2px solid #0284c7', background: '#000', display: 'flex', flexDirection: 'column', height: 260 }}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    style={{ width: '100%', height: '210px', objectFit: 'cover' }} 
                  />
                  {/* Guidelines overlay */}
                  <div style={{
                    position: 'absolute', top: '10%', left: '10%', right: '10%', height: '55%',
                    border: '2px dashed rgba(16, 185, 129, 0.8)', borderRadius: 8,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)', pointerEvents: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ color: '#10b981', fontSize: 10, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                      ALIGN PRESCRIPTION TEXT
                    </span>
                  </div>
                  {/* Capture toolbar */}
                  <div style={{ display: 'flex', width: '100%', background: '#0f172a', padding: '6px 12px', gap: 10, justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="btn-danger"
                      style={{ height: 28, fontSize: 12, padding: '0 12px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={captureFrame}
                      style={{
                        height: 32, padding: '0 16px', background: '#10b981', color: '#fff',
                        border: 'none', borderRadius: 100, fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>photo_camera</span>
                      Capture Frame
                    </button>
                  </div>
                </div>
              ) : !ocrPreviewUrl ? (
                // Dropzone
                <div 
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#0284c7'; }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    const file = e.dataTransfer.files?.[0];
                    if (file) scanPrescription(file);
                  }}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: 12,
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12
                  }}
                  onClick={() => document.getElementById('ocr-file-upload')?.click()}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#94a3b8' }}>cloud_upload</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                    {t('ocr_dropzone_text')}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    Supports PNG, JPG, JPEG
                  </div>
                </div>
              ) : (
                // Image Preview
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #cbd5e1', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <img src={ocrPreviewUrl} alt="Prescription Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  <button 
                    type="button" 
                    onClick={clearOcr}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)', border: 'none',
                      color: '#fff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer', outline: 'none'
                    }}
                    title={t('ocr_btn_clear')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                {/* File input (Device/Storage) */}
                <input 
                  type="file" 
                  id="ocr-file-upload" 
                  accept="image/*" 
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) scanPrescription(file); }} 
                  style={{ display: 'none' }} 
                />
                <button
                  type="button"
                  onClick={() => {
                    if (isCameraActive) stopCamera();
                    document.getElementById('ocr-file-upload')?.click();
                  }}
                  className="btn-secondary"
                  disabled={isOcrLoading}
                  style={{ flex: 1, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
                  Device Upload
                </button>

                {/* Live Camera Scanner */}
                <button
                  type="button"
                  onClick={isCameraActive ? stopCamera : startCamera}
                  className="btn-primary"
                  disabled={isOcrLoading}
                  style={{ flex: 1, height: 40, background: '#0284c7', border: '1.5px solid #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>photo_camera</span>
                  {isCameraActive ? 'Stop Camera' : t('ocr_camera_shortcut')}
                </button>
              </div>
            </div>

            {/* Right: Progress, Errors & Extracted Text */}
            {(ocrPreviewUrl || isCameraActive) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Camera access errors */}
                {cameraError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
                    <div>{cameraError}</div>
                  </div>
                )}

                {/* OCR Loading / Progress */}
                {isOcrLoading ? (
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="spinner" style={{ width: 14, height: 14, border: '2px solid #0284c7', borderTopColor: 'transparent' }} />
                        {ocrStatus}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0284c7' }}>{ocrProgress}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${ocrProgress}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #10b981)', borderRadius: 4, transition: 'width 0.2s ease-out' }} />
                    </div>
                  </div>
                ) : ocrText ? (
                  // Extracted Text Textarea
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#0284c7' }}>edit_note</span>
                      {t('ocr_extracted_text')}
                    </label>
                    <textarea
                      value={ocrText}
                      onChange={(e) => setOcrText(e.target.value)}
                      style={{
                        width: '100%', height: 120, padding: '10px 14px', borderRadius: 8,
                        border: '1.5px solid #cbd5e1', fontSize: 13, color: '#334155',
                        outline: 'none', fontFamily: 'Courier New, monospace', resize: 'vertical'
                      }}
                      placeholder="Extracted transcription will appear here. Edit if needed."
                    />
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => applyTranscript(ocrText)}
                        className="btn-primary"
                        style={{ height: 36, padding: '0 16px', background: '#10b981', border: '1.5px solid #10b981', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
                        {t('ocr_btn_autofill')}
                      </button>
                    </div>
                  </div>
                ) : ocrError ? (
                  // Error Box
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
                    <div>{ocrError}</div>
                  </div>
                ) : isCameraActive ? (
                  // Instructions while camera is active
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '16px 20px', color: '#0369a1', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>info</span>
                      How to Scan Live
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <li>Hold the prescription document up to the camera lens.</li>
                      <li>Align the text inside the green dashed capture frame.</li>
                      <li>Wait for the camera to auto-focus, then click <strong>Capture Frame</strong>.</li>
                      <li>The scanner will read the image text and auto-fill the form fields.</li>
                    </ol>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Section nav pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {SECTION_IDS.map(s => (
              <button type="button" key={s.id} onClick={() => setActiveSection(s.id)} style={{
                height: 36, padding: '0 16px', borderRadius: 100,
                background: activeSection === s.id ? '#00685f' : '#fff',
                color: activeSection === s.id ? '#fff' : '#475569',
                border: activeSection === s.id ? '1.5px solid #00685f' : '1.5px solid #e2e8f0',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{s.icon}</span>
                {t(s.key)}
              </button>
            ))}
          </div>

          <div className="card">
            {/* BASIC INFO */}
            {activeSection === 'basic' && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>{t('section_basic_heading')}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    {label(t('full_name_label'))}
                    <input {...f('name')} type="text" placeholder={lang === 'hi' ? 'मरीज़ का पूरा नाम' : "Patient's full name"} />
                    {fieldErr('name')}
                  </div>
                  <div>
                    {label(t('age_label'))}
                    <input {...f('age')} type="number" min="1" max="120" placeholder={lang === 'hi' ? 'जैसे 45' : 'e.g. 45'} />
                    {fieldErr('age')}
                  </div>
                  <div>
                    {label(t('gender_label'))}
                    <select {...f('gender')}>
                      <option value="">{t('select_gender')}</option>
                      <option value="Male">{t('opt_male')}</option>
                      <option value="Female">{t('opt_female')}</option>
                      <option value="Other">{t('opt_other')}</option>
                    </select>
                    {fieldErr('gender')}
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    {label(t('village_label'), false)}
                    <input {...f('village_name')} type="text" placeholder={lang === 'hi' ? 'जैसे रामपुर' : 'e.g. Rampur'} />
                  </div>
                </div>
              </div>
            )}

            {/* VITALS */}
            {activeSection === 'vitals' && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>{t('section_vitals_heading')}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div>
                    {label(t('height_label'), false)}
                    <input {...f('height_cm')} type="number" min="50" max="250" placeholder={lang === 'hi' ? 'जैसे 165' : 'e.g. 165'} />
                    {fieldErr('height_cm')}
                  </div>
                  <div>
                    {label(t('weight_label'), false)}
                    <input {...f('weight_kg')} type="number" min="5" max="300" placeholder={lang === 'hi' ? 'जैसे 68' : 'e.g. 68'} />
                    {fieldErr('weight_kg')}
                  </div>
                  <div>
                    {label(t('bp_systolic_label'))}
                    <input {...f('systolic_bp')} type="number" min="60" max="240" placeholder={lang === 'hi' ? 'जैसे 120' : 'e.g. 120'} />
                    {fieldErr('systolic_bp')}
                  </div>
                  <div>
                    {label(t('bp_diastolic_label'))}
                    <input {...f('diastolic_bp')} type="number" min="40" max="160" placeholder={lang === 'hi' ? 'जैसे 80' : 'e.g. 80'} />
                    {fieldErr('diastolic_bp')}
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    {label(t('heart_rate_label'), false)}
                    <input {...f('heart_rate')} type="number" min="30" max="250" placeholder={lang === 'hi' ? 'जैसे 72' : 'e.g. 72'} />
                    {fieldErr('heart_rate')}
                  </div>
                </div>
                {form.height_cm && form.weight_kg && (
                  <div style={{ marginTop: 16, background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', fontSize: 14 }}>
                    <strong>{t('calc_bmi_label')}</strong>{' '}
                    <span style={{ color: '#00685f', fontWeight: 700 }}>
                      {(Number(form.weight_kg) / ((Number(form.height_cm) / 100) ** 2)).toFixed(1)} kg/m²
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* LAB */}
            {activeSection === 'lab' && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>{t('section_lab_heading')}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div>
                    {label(t('glucose_label'))}
                    <input {...f('glucose')} type="number" min="40" max="600" placeholder={lang === 'hi' ? 'जैसे 95' : 'e.g. 95'} />
                    {fieldErr('glucose')}
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      {lang === 'hi' ? 'सामान्य: 70–99 | प्री-डायबेटिक: 100–125' : 'Normal: 70–99 mg/dL | Pre-diabetic: 100–125'}
                    </div>
                  </div>
                  <div>
                    {label(t('cholesterol_label'), false)}
                    <input {...f('cholesterol')} type="number" min="50" max="600" placeholder={lang === 'hi' ? 'जैसे 180' : 'e.g. 180'} />
                    {fieldErr('cholesterol')}
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      {lang === 'hi' ? 'वांछनीय: <200 mg/dL | उच्च: ≥240' : 'Desirable: <200 mg/dL | High: ≥240'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LIFESTYLE */}
            {activeSection === 'lifestyle' && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>{t('section_lifestyle_heading')}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div>
                    {label(t('smoking_label'))}
                    <select {...f('smoker')}>
                      <option value="0">{t('opt_no_smoke')}</option>
                      <option value="1">{t('opt_yes_smoke')}</option>
                    </select>
                  </div>
                  <div>
                    {label(t('alcohol_label'))}
                    <select {...f('alcohol_use')}>
                      <option value="0">{t('opt_no_alcohol')}</option>
                      <option value="1">{t('opt_yes_alcohol')}</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    {label(t('activity_label'))}
                    <select {...f('physical_activity')}>
                      <option value="low">{t('opt_activity_low')}</option>
                      <option value="moderate">{t('opt_activity_moderate')}</option>
                      <option value="high">{t('opt_activity_high')}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORY */}
            {activeSection === 'history' && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>{t('section_history_heading')}</h2>
                <div style={{ marginBottom: 24 }}>
                  {label(t('family_hist_label'))}
                  <select {...f('family_history_present')}>
                    <option value="0">{t('opt_no_family_hist')}</option>
                    <option value="1">{t('opt_yes_family_hist')}</option>
                  </select>
                  {form.family_history_present === '1' && (
                    <div style={{ marginTop: 12 }}>
                      {label(t('describe_family_label'))}
                      <textarea
                        className={`field-input${errors.family_history_details ? ' error' : ''}`}
                        value={form.family_history_details}
                        onChange={e => setForm(prev => ({ ...prev, family_history_details: e.target.value }))}
                        placeholder={lang === 'hi' ? 'जैसे पिताजी को मधुमेह था, माँ को उच्च रक्तचाप' : 'e.g. Father had Type 2 Diabetes, Mother had hypertension'}
                      />
                      {fieldErr('family_history_details')}
                    </div>
                  )}
                </div>
                <div>
                  {label(t('known_cond_label'))}
                  <select {...f('known_condition_present')}>
                    <option value="0">{t('opt_no_known_cond')}</option>
                    <option value="1">{t('opt_yes_known_cond')}</option>
                  </select>
                  {form.known_condition_present === '1' && (
                    <div style={{ marginTop: 12 }}>
                      {label(t('describe_cond_label'))}
                      <textarea
                        className={`field-input${errors.known_condition_details ? ' error' : ''}`}
                        value={form.known_condition_details}
                        onChange={e => setForm(prev => ({ ...prev, known_condition_details: e.target.value }))}
                        placeholder={lang === 'hi' ? 'जैसे 2019 में मधुमेह का निदान, मेटफॉर्मिन पर हैं' : 'e.g. Type 2 Diabetes diagnosed in 2019, on Metformin'}
                      />
                      {fieldErr('known_condition_details')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <button type="button" onClick={() => {
              const idx = SECTION_IDS.findIndex(s => s.id === activeSection);
              if (idx > 0) setActiveSection(SECTION_IDS[idx - 1].id);
            }} className="btn-secondary" style={{ visibility: SECTION_IDS.findIndex(s => s.id === activeSection) === 0 ? 'hidden' : 'visible' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              {t('btn_previous')}
            </button>

            {activeSection !== 'history' ? (
              <button type="button" onClick={() => {
                const idx = SECTION_IDS.findIndex(s => s.id === activeSection);
                setActiveSection(SECTION_IDS[idx + 1].id);
              }} className="btn-primary">
                {t('btn_next')}
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                {submitError && (
                  <div style={{ color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                    {submitError}
                  </div>
                )}
                <button type="submit" className="btn-primary" disabled={submitting} style={{ minWidth: 200 }}>
                  {submitting
                    ? <><span className="spinner" /> {t('btn_running')}</>
                    : <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>analytics</span> {t('btn_submit')}</>
                  }
                </button>
              </div>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
