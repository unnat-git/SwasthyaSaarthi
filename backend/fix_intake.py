#!/usr/bin/env python3
"""Rewrite the parseVoiceToForm function in intake page.tsx with correct content."""

target = r'c:\Users\rajun\Desktop\swastai\src\app\dashboard\asha\intake\page.tsx'

with open(target, 'r', encoding='utf-8') as f:
    content = f.read()

# The new parseVoiceToForm function - fully written in ASCII-safe way for Hindi
new_func = r"""function parseVoiceToForm(transcript: string, lang = 'en'): Partial<FormData> {
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
"""

# Find and replace the existing parseVoiceToForm function
# Pattern: from "function parseVoiceToForm(" to the closing "}\n" before "function validateForm("
import re

pattern = r'function parseVoiceToForm\(.*?\n\}(?=\s*\nfunction validateForm)'
match = re.search(pattern, content, re.DOTALL)

if match:
    print(f"Found old function at {match.start()}-{match.end()}")
    content = content[:match.start()] + new_func + content[match.end():]
    print("Replaced successfully!")
else:
    print("Pattern not found! Trying fallback...")
    # Try to find the broken function and replace from start of parseVoiceToForm to validateForm
    start_marker = "function parseVoiceToForm("
    end_marker = "function validateForm("
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    if start_idx >= 0 and end_idx > start_idx:
        content = content[:start_idx] + new_func + "\n" + content[end_idx:]
        print(f"Fallback replacement done: {start_idx} to {end_idx}")
    else:
        print(f"ERROR: could not find markers. start={start_idx}, end={end_idx}")
        exit(1)

with open(target, 'w', encoding='utf-8') as f:
    f.write(content)

# Verify
with open(target, 'rb') as f:
    verify = f.read()
try:
    verify.decode('utf-8')
    print("SUCCESS: File is now valid UTF-8!")
except Exception as e:
    print(f"STILL BROKEN: {e}")
