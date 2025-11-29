# ml_service/model.py
print("[ml_service] module import", "__name__=", __name__)
from dotenv import load_dotenv
load_dotenv()
print("ENV FILE LOADED")
import os
import re
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")


if not openai.api_key:
    print("[ml_service] WARNING: OPENAI_API_KEY not set")
else:
    print("[ml_service] OPENAI_API_KEY loaded")


# Lazy import OpenAI (so service still runs without it)
try:
    import openai
    OPENAI_AVAILABLE = True
except Exception:
    OPENAI_AVAILABLE = False

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# -------------------------
# Expanded local fallback rule-based diagnoser
# -------------------------
class MedicalDiagnosisModelLocal:
    def __init__(self):
        self.disease_info = {}
        self.symptom_aliases = {}
        self._build_kb()

    def _build_kb(self):
        # Expanded (illustrative) knowledge base. Add more entries over time.
        self.disease_info = {
            'common_cold': {
                'name': 'Common Cold',
                'symptoms': ['cough', 'sneezing', 'runny nose', 'sore throat', 'congestion'],
                'treatment': 'Rest, fluids, OTC antihistamines/decongestants',
                'severity': 'low', 'needs_doctor': False
            },
            'influenza': {
                'name': 'Influenza (Flu)',
                'symptoms': ['fever', 'cough', 'body aches', 'chills', 'fatigue', 'headache'],
                'treatment': 'Rest, fluids, antipyretics; see doctor if severe',
                'severity': 'medium', 'needs_doctor': True
            },
            'migraine': {
                'name': 'Migraine',
                'symptoms': ['headache', 'nausea', 'sensitivity to light', 'visual disturbances'],
                'treatment': 'Rest in dark room, triptans if prescribed',
                'severity': 'medium', 'needs_doctor': True
            },
            'gastroenteritis': {
                'name': 'Gastroenteritis',
                'symptoms': ['nausea', 'vomiting', 'diarrhea', 'stomach pain', 'cramps'],
                'treatment': 'Hydration, bland diet; seek care if severe',
                'severity': 'medium', 'needs_doctor': False
            },
            'uti': {
                'name': 'Urinary Tract Infection',
                'symptoms': ['burning urination', 'frequent urination', 'lower abdominal pain', 'cloudy urine'],
                'treatment': 'Medical evaluation; likely antibiotics',
                'severity': 'high', 'needs_doctor': True
            },
            'covid_like': {
                'name': 'Viral Respiratory Infection (e.g., COVID-19)',
                'symptoms': ['fever', 'cough', 'loss of taste', 'loss of smell', 'fatigue', 'sore throat', 'shortness of breath'],
                'treatment': 'Isolate, test if recommended, supportive care',
                'severity': 'medium', 'needs_doctor': True
            },
            'allergic_rhinitis': {
                'name': 'Allergic Rhinitis (Allergy)',
                'symptoms': ['sneezing', 'runny nose', 'itchy eyes', 'congestion'],
                'treatment': 'Antihistamines, avoid allergens',
                'severity': 'low', 'needs_doctor': False
            },
            'appendicitis': {
                'name': 'Appendicitis',
                'symptoms': ['acute abdominal pain', 'right lower quadrant pain', 'fever', 'nausea', 'loss of appetite'],
                # NOTE: keep treatment generic; avoid alarming text for single-symptom triggers
                'treatment': 'See a clinician if abdominal pain is severe or persistent',
                'severity': 'high', 'needs_doctor': True
            },
            'hypertension_urgent': {
                'name': 'Possible Hypertensive Episode',
                'symptoms': ['very high blood pressure', 'severe headache', 'blurred vision', 'nosebleed'],
                'treatment': 'Seek urgent medical attention',
                'severity': 'high', 'needs_doctor': True
            },
            'dermatitis': {
                'name': 'Dermatitis / Skin Rash',
                'symptoms': ['rash', 'itching', 'redness', 'swelling'],
                'treatment': 'Topical emollients/antihistamines or see dermatologist',
                'severity': 'low', 'needs_doctor': False
            }
        }

        aliases = {
            'fever': ['fever', 'temperature', 'high temperature', 'febrile'],
            'cough': ['cough', 'coughing'],
            'headache': ['headache', 'head pain', 'migraine'],
            'nausea': ['nausea', 'queasy', 'sick to stomach'],
            'vomit': ['vomit', 'vomiting', 'throwing up'],
            'diarrhea': ['diarrhea', 'loose stool', 'runny stool'],
            'sore_throat': ['sore throat', 'throat pain'],
            'shortness_of_breath': ['shortness of breath', 'breathless', 'dyspnea'],
            'loss_of_taste': ['loss of taste', 'no taste', 'ageusia'],
            'loss_of_smell': ['loss of smell', 'no smell', 'anosmia'],
            'burning_urination': ['painful urination', 'burning urination', 'dysuria'],
            'abdominal_pain': ['stomach pain', 'abdominal pain', 'belly pain']
        }

        for canon, vals in aliases.items():
            for v in vals:
                self.symptom_aliases[v] = canon

        for d in self.disease_info.values():
            for s in d['symptoms']:
                if s not in self.symptom_aliases:
                    self.symptom_aliases[s] = s

    def _norm(self, s: str) -> str:
        return re.sub(r'[^a-z0-9\s]', ' ', (s or '').lower()).strip()

    def extract(self, payload):
        if isinstance(payload, (list, tuple)):
            items = [str(x) for x in payload if x]
        else:
            text = str(payload or '')
            items = re.split(r'[;,\n\.]+', text)
        found = set()
        cleaned = self._norm(" ".join(items))
        for alias in sorted(self.symptom_aliases.keys(), key=lambda x: -len(x)):
            if alias in cleaned:
                found.add(self.symptom_aliases[alias])
        return sorted(list(found))

    def diagnose(self, payload):
        syms = self.extract(payload)
        if not syms:
            return {
                'diagnosis': 'No clear symptoms',
                'confidence': 0.0,
                'identified_symptoms': [],
                'recommendation': 'Please provide more detail.'
            }

        scores = {}
        for key, info in self.disease_info.items():
            kw = [s for s in info['symptoms']]

            # Require more matches for high-severity diseases
            matched = len(set(kw).intersection(set(syms)))

            # High-severity diseases need at least 2 matches
            if info.get('severity') == 'high' and matched < 2:
                continue

            # medium/low need at least 1 match
            if matched >= 1:
                scores[key] = matched / len(kw)

        if not scores:
            return {
                'diagnosis': 'Not found in DB',
                'confidence': 0.0,
                'identified_symptoms': syms,
                'recommendation': 'Consider consulting a doctor.'
            }

        # pick highest score (tie-break deterministic by key)
        key, score = max(scores.items(), key=lambda x: (x[1], x[0]))
        info = self.disease_info[key]

        confidence = round(min(0.99, score * 0.85 + min(0.15, 0.05 * len(syms))), 2)

        return {
            'diagnosis': f'Possible {info["name"]}',
            'recommendation': info['treatment'],
            'confidence': confidence,
            'identified_symptoms': syms,
            'needs_doctor': info['needs_doctor']
        }

local_model = MedicalDiagnosisModelLocal()

# -------------------------
# AI wrapper (OpenAI Chat Completion)
# -------------------------
def init_openai():
    # debug prints to help you see env in the terminal (remove in production)
    print("[debug] OPENAI_AVAILABLE =", OPENAI_AVAILABLE)
    print("[debug] OPENAI_API_KEY present:", bool(os.environ.get("OPENAI_API_KEY")))

    if not OPENAI_AVAILABLE:
        return False, "openai package not installed"
    key = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENAI_KEY")
    if not key:
        return False, "OPENAI_API_KEY not set"
    openai.api_key = key
    return True, "ok"

def build_prompt(symptoms_text: str) -> str:
    p = f"""
You are a clinical-grade assistant that MUST return valid JSON only. Analyze the following patient free-text symptoms and output a JSON object with keys:
- diagnosis: short diagnosis string (e.g. "Possible Influenza")
- identified_symptoms: array of short tokens (e.g. ["fever","cough"])
- confidence: decimal 0.0-1.0
- recommendation: short next-steps for patient
- needs_doctor: boolean

Patient symptoms:
\"\"\"{symptoms_text}\"\"\""

Return JSON only with no explanation or extra text.
"""
    return p

def analyze_with_openai(symptoms_text: str, model_name: str = None) -> dict:
    ok, msg = init_openai()
    if not ok:
        raise RuntimeError(msg)
    model_name = model_name or os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    prompt = build_prompt(symptoms_text)
    resp = openai.ChatCompletion.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": prompt}],
    max_tokens=10000,
    temperature=0.4
)
    content = resp.choices[0].message.get("content", "").strip()

    try:
        parsed = json.loads(content)
    except Exception:
        import re
        m = re.search(r'(\{[\s\S]*\})', content)
        if m:
            parsed = json.loads(m.group(1))
        else:
            raise RuntimeError("AI output not parseable as JSON: " + (content[:1000]))

    parsed['confidence'] = float(parsed.get('confidence', 0.0))
    parsed['identified_symptoms'] = parsed.get('identified_symptoms', []) or []
    parsed['recommendation'] = parsed.get('recommendation', '')
    parsed['needs_doctor'] = bool(parsed.get('needs_doctor', False))
    return parsed

# -------------------------
# Routes
# -------------------------
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

@app.route('/analyze', methods=['POST'])
def analyze_route():
    payload = request.get_json() or {}
    symptoms = payload.get('symptoms') or payload.get('text') or ""
    symptoms = str(symptoms).strip()
    if not symptoms:
        return jsonify({'error': 'No symptoms provided'}), 400

    try:
        ai_enabled, reason = init_openai()
        if ai_enabled:
            try:
                ai_result = analyze_with_openai(symptoms)
                return jsonify({
                    "source": "ai",
                    "diagnosis": ai_result.get('diagnosis', 'Unknown'),
                    "identified_symptoms": ai_result.get('identified_symptoms', []),
                    "confidence": ai_result.get('confidence', 0.0),
                    "recommendation": ai_result.get('recommendation', ''),
                    "needs_doctor": bool(ai_result.get('needs_doctor', False))
                })
            except Exception as e:
                print("[ml_service] AI analyze error:", e)
        else:
            print("[ml_service] AI skipped:", reason)
    except Exception as e:
        print("[ml_service] AI init error:", e)

    local = local_model.diagnose(symptoms)
    return jsonify({
        "source": "local",
        "diagnosis": local.get('diagnosis'),
        "identified_symptoms": local.get('identified_symptoms', []),
        "confidence": local.get('confidence', 0.0),
        "recommendation": local.get('recommendation', ''),
        "needs_doctor": local.get('needs_doctor', False)
    })

@app.route('/chat', methods=['POST'])
def chat_route():
    payload = request.get_json() or {}
    user_message = payload.get("message", "").strip()
    if not user_message:
        return jsonify({"reply": "Please enter a message."})

    try:
        messages = [
            {"role": "system", "content": "You are a friendly medical assistant. Always respond helpfully and safely."},
            {"role": "user", "content": user_message}
        ]

        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.6,
            max_tokens=300
        )

        reply = resp.choices[0].message['content'].strip()
        return jsonify({"reply": reply})

    except Exception as e:
        print("[chat] AI error:", e)
        return jsonify({"reply": "I'm here to help! Could you describe your symptoms or question?"})

# backwards-compat / older endpoints
@app.route('/diagnose', methods=['POST'])
def diagnose_route():
    return analyze_route()

# -------------------------
# socket handlers
# -------------------------
@socketio.on('connect')
def _on_connect():
    emit('connected', {'ok': True})

@socketio.on('join')
def _on_join(data):
    room = data.get('room')
    if room:
        join_room(room)
        emit('joined', {'room': room}, to=room)

@socketio.on('diagnose')
def _socket_diagnose(data):
    room = data.get('room')
    symptoms = data.get('symptoms')
    try:
        ai_enabled, _ = init_openai()
        if ai_enabled:
            parsed = analyze_with_openai(symptoms)
            result = {
                "diagnosis": parsed.get('diagnosis'),
                "identified_symptoms": parsed.get('identified_symptoms', []),
                "confidence": parsed.get('confidence', 0.0),
                "recommendation": parsed.get('recommendation',''),
                "needs_doctor": bool(parsed.get('needs_doctor', False))
            }
        else:
            local = local_model.diagnose(symptoms)
            result = {
                "diagnosis": local.get('diagnosis'),
                "identified_symptoms": local.get('identified_symptoms', []),
                "confidence": local.get('confidence', 0.0),
                "recommendation": local.get('recommendation',''),
                "needs_doctor": local.get('needs_doctor', False)
            }
    except Exception as e:
        print("[ml_service] socket analyze error:", e)
        local = local_model.diagnose(symptoms)
        result = {
            "diagnosis": local.get('diagnosis'),
            "identified_symptoms": local.get('identified_symptoms', []),
            "confidence": local.get('confidence', 0.0),
            "recommendation": local.get('recommendation',''),
            "needs_doctor": local.get('needs_doctor', False)
        }

    if room:
        emit('diagnosis_result', result, to=room)
    else:
        emit('diagnosis_result', result)

# -------------------------
# run
# -------------------------
if __name__ == '__main__':
    port = int(os.environ.get('ML_PORT', 5000))
    print(f"[ml_service] Starting on 0.0.0.0:{port}")
    try:
        socketio.run(app, host='0.0.0.0', port=port)
    except Exception as e:
        print(f"[ml_service] start error: {e}")
