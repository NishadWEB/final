from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import os

# Minimal, self-contained diagnosis microservice (same logic as model.py intended)
try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    try:
        nltk.data.find('corpora/stopwords')
    except Exception:
        try:
            nltk.download('stopwords')
        except Exception:
            pass
    try:
        nltk.data.find('corpora/wordnet')
    except Exception:
        try:
            nltk.download('wordnet')
        except Exception:
            pass
    lemmatizer = WordNetLemmatizer()
    stop_words = set(stopwords.words('english'))
except Exception:
    lemmatizer = None
    stop_words = set()

app = Flask(__name__)
CORS(app)


class MedicalDiagnosisModel:
    def __init__(self):
        self.disease_info = {}
        self.symptom_aliases = {}
        self.load_knowledge_base()

    def load_knowledge_base(self):
        self.disease_info = {
            'common_cold': {'name': 'Common Cold', 'symptoms': ['cough', 'sneezing', 'runny nose', 'sore throat', 'congestion'], 'treatment': 'Rest, hydration, over-the-counter cold medication', 'severity': 'low', 'needs_doctor': False},
            'flu': {'name': 'Influenza (Flu)', 'symptoms': ['fever', 'cough', 'sore throat', 'body aches', 'headache', 'fatigue'], 'treatment': 'Rest, fluids, antiviral medication if early', 'severity': 'medium', 'needs_doctor': True},
            'migraine': {'name': 'Migraine', 'symptoms': ['headache', 'nausea', 'sensitivity to light', 'sensitivity to sound'], 'treatment': 'Rest in dark room, pain relievers', 'severity': 'medium', 'needs_doctor': True},
            'gastroenteritis': {'name': 'Gastroenteritis', 'symptoms': ['nausea', 'vomiting', 'diarrhea', 'stomach cramps', 'fever'], 'treatment': 'Hydration, bland diet, rest', 'severity': 'medium', 'needs_doctor': False},
            'allergies': {'name': 'Allergic Rhinitis', 'symptoms': ['sneezing', 'runny nose', 'itchy eyes', 'congestion'], 'treatment': 'Antihistamines, nasal sprays', 'severity': 'low', 'needs_doctor': False},
            'uti': {'name': 'Urinary Tract Infection', 'symptoms': ['painful urination', 'frequent urination', 'lower abdominal pain'], 'treatment': 'Antibiotics (prescription required)', 'severity': 'high', 'needs_doctor': True},
        }
        aliases = {
            'fever': ['fever', 'temperature', 'high temperature', 'febrile'],
            'cough': ['cough', 'coughing'],
            'sore throat': ['sore throat', 'throat pain', 'throat soreness'],
            'runny nose': ['runny nose', 'runny-nose', 'runny'],
            'sneezing': ['sneeze', 'sneezing'],
            'congestion': ['congestion', 'stuffy', 'blocked nose', 'nasal congestion'],
            'headache': ['headache', 'head pain', 'migraine'],
            'nausea': ['nausea', 'nauseous', 'queasy'],
            'vomiting': ['vomit', 'vomiting', 'throwing up'],
            'diarrhea': ['diarrhea', 'loose stool', 'runny stools'],
            'painful urination': ['painful urination', 'burning urine', 'dysuria'],
        }
        for canon, vals in aliases.items():
            for v in vals:
                self.symptom_aliases[v] = canon
        for d in self.disease_info.values():
            for s in d['symptoms']:
                if s not in self.symptom_aliases:
                    self.symptom_aliases[s] = s

    def normalize_text(self, text):
        if not text:
            return ''
        t = text.lower()
        t = re.sub(r'[^a-z0-9\s]', ' ', t)
        t = re.sub(r'\s+', ' ', t).strip()
        return t

    def extract_symptoms(self, text):
        t = self.normalize_text(text)
        tokens = t.split()
        found = set()
        sorted_aliases = sorted(self.symptom_aliases.keys(), key=lambda x: -len(x))
        for alias in sorted_aliases:
            if alias in t:
                found.add(self.symptom_aliases[alias])
        for tok in tokens:
            if tok in self.symptom_aliases:
                found.add(self.symptom_aliases[tok])
        return list(found)

    def diagnose(self, text):
        identified = self.extract_symptoms(text or '')
        if not identified:
            return {'diagnosis': 'Unable to identify specific symptoms. Please provide more detail.', 'recommendation': 'Consult a healthcare professional.', 'severity': 'unknown', 'needs_doctor': True, 'confidence': 0.0, 'identified_symptoms': []}
        scores = {}
        for key, info in self.disease_info.items():
            canon_symptoms = set(info['symptoms'])
            matched = len(canon_symptoms.intersection(set(identified)))
            if matched > 0:
                scores[key] = matched / len(canon_symptoms)
        if not scores:
            return {'diagnosis': 'Symptoms not recognized in our database.', 'recommendation': 'Consult a healthcare professional.', 'severity': 'unknown', 'needs_doctor': True, 'confidence': 0.0, 'identified_symptoms': identified}
        top = max(scores.items(), key=lambda x: x[1])
        disease_key, conf = top
        info = self.disease_info[disease_key]
        return {'diagnosis': f'Possible {info["name"]}', 'recommendation': info['treatment'], 'severity': info['severity'], 'needs_doctor': info['needs_doctor'], 'confidence': round(conf, 2), 'identified_symptoms': identified}


model = MedicalDiagnosisModel()


@app.route('/diagnose', methods=['POST'])
def diagnose():
    try:
        data = request.get_json() or {}
        symptoms = data.get('symptoms', '')
        if not symptoms or not str(symptoms).strip():
            return jsonify({'error': 'No symptoms provided'}), 400
        result = model.diagnose(symptoms)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Diagnosis error: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})


@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'service': 'ml_service',
        'status': 'ok',
        'endpoints': ['/health', '/diagnose']
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
