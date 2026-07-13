import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

SKILLS: dict[str, str] = {
    'python': 'Python', 'java': 'Java', 'javascript': 'JavaScript',
    'typescript': 'TypeScript', 'c++': 'C++', 'c#': 'C#', 'ruby': 'Ruby',
    'rust': 'Rust', 'swift': 'Swift', 'kotlin': 'Kotlin', 'scala': 'Scala',
    'php': 'PHP', 'matlab': 'MATLAB', 'bash': 'Bash', 'golang': 'Go',
    'node.js': 'Node.js', 'nodejs': 'Node.js',
    'html': 'HTML', 'css': 'CSS', 'react': 'React', 'angular': 'Angular',
    'vue.js': 'Vue.js', 'vue': 'Vue.js',
    'django': 'Django', 'flask': 'Flask', 'fastapi': 'FastAPI',
    'spring': 'Spring', 'express': 'Express',
    'sql': 'SQL', 'mysql': 'MySQL', 'postgresql': 'PostgreSQL',
    'postgres': 'PostgreSQL', 'mongodb': 'MongoDB', 'redis': 'Redis',
    'elasticsearch': 'Elasticsearch', 'sqlite': 'SQLite', 'oracle': 'Oracle',
    'firebase': 'Firebase', 'dynamodb': 'DynamoDB',
    'aws': 'AWS', 'azure': 'Azure', 'gcp': 'GCP', 'docker': 'Docker',
    'kubernetes': 'Kubernetes', 'terraform': 'Terraform', 'ansible': 'Ansible',
    'jenkins': 'Jenkins', 'linux': 'Linux', 'devops': 'DevOps',
    'tensorflow': 'TensorFlow', 'pytorch': 'PyTorch', 'pandas': 'Pandas',
    'numpy': 'NumPy', 'scikit': 'Scikit-learn', 'spark': 'Spark',
    'hadoop': 'Hadoop', 'tableau': 'Tableau', 'excel': 'Excel',
    'machine learning': 'Machine Learning', 'deep learning': 'Deep Learning',
    'nlp': 'NLP', 'git': 'Git', 'jira': 'Jira', 'figma': 'Figma',
    'graphql': 'GraphQL', 'rest api': 'REST API', 'restful': 'RESTful',
    'microservices': 'Microservices', 'agile': 'Agile', 'scrum': 'Scrum',
    'postman': 'Postman', 'selenium': 'Selenium',
}

SECTION_PATTERNS: dict[str, str] = {
    'Career Objective': r'\b(objective|summary|profile)\b',
    'Skills': r'\b(skills|technologies|competencies)\b',
    'Work Experience': r'\b(experience|employment|work history)\b',
    'Education': r'\b(education|degree|university|college|bachelor|master)\b',
    'Projects': r'\bprojects?\b',
    'Certifications': r'\bcertif\w*\b',
    'Links (LinkedIn/GitHub)': r'(linkedin\.com|github\.com|linkedin|github)',
}


def _skill_re(key: str) -> re.Pattern:
    escaped = re.escape(key)
    if ' ' in key:
        # multi-word: allow flexible whitespace between words
        pattern = escaped.replace(r'\ ', r'\s+')
    else:
        pattern = r'\b' + escaped + r'\b'
    return re.compile(pattern)


# Pre-compile all patterns once at import time
_SKILL_PATTERNS = {key: _skill_re(key) for key in SKILLS}


def _has_skill(key: str, text_lower: str) -> bool:
    return bool(_SKILL_PATTERNS[key].search(text_lower))


def detect_skills(text: str) -> tuple[list[str], list[str]]:
    tl = text.lower()
    present: set[str] = set()
    missing: set[str] = set()

    for key, display in SKILLS.items():
        if _has_skill(key, tl):
            present.add(display)
        else:
            missing.add(display)

    # Deduplicate: aliases (nodejs/node.js → Node.js) may land in both sets
    missing -= present
    return sorted(present), sorted(missing)[:8]


def detect_sections(text: str) -> list[dict]:
    return [
        {'name': name, 'present': bool(re.search(pattern, text, re.IGNORECASE))}
        for name, pattern in SECTION_PATTERNS.items()
    ]


def _ats_score(sections_found: int, skill_count: int, word_count: int, has_numbers: bool) -> int:
    score = (
        (sections_found / 7) * 40
        + min(skill_count * 3, 35)
        + (15 if word_count > 300 else 8 if word_count > 100 else 0)
        + (10 if has_numbers else 0)
    )
    return min(round(score), 98)


def _content_score(sections_found: int, word_count: int, has_numbers: bool, has_objective: bool) -> int:
    score = (
        (sections_found / 7) * 35
        + min(word_count / 15, 35)
        + (15 if has_numbers else 0)
        + (15 if has_objective else 0)
    )
    return min(round(score), 98)


def _keyword_match(resume_text: str, jd_text: str) -> tuple[int, list[str], list[str]]:
    if not jd_text or len(jd_text.strip()) < 50:
        return 45, [], []

    jd_lower = jd_text.lower()
    resume_lower = resume_text.lower()

    found: list[str] = []
    missing: list[str] = []
    seen_displays: set[str] = set()

    for key, display in SKILLS.items():
        if display in seen_displays:
            continue
        if _has_skill(key, jd_lower):
            seen_displays.add(display)
            if _has_skill(key, resume_lower):
                found.append(display)
            else:
                missing.append(display)

    # TF-IDF cosine similarity as a secondary signal
    try:
        vec = TfidfVectorizer(stop_words='english', max_features=200)
        tfidf = vec.fit_transform([resume_text, jd_text])
        cosine_sim = float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0])
    except Exception:
        cosine_sim = 0.4

    total = len(found) + len(missing)
    if total > 0:
        skill_pct = len(found) / total
        # 60% weight on explicit skill match, 40% on semantic similarity
        blended = skill_pct * 0.6 + cosine_sim * 0.4
    else:
        blended = cosine_sim

    score = max(min(round(blended * 100), 98), 20)
    return score, found, missing


def _detect_cluster(text: str, present_skills: list[str]) -> dict:
    tl = text.lower()
    data_kw = ['python', 'sql', 'tableau', 'machine learning', 'pandas', 'numpy', 'spark', 'hadoop']
    mgmt_kw = ['agile', 'scrum', 'jira', 'leadership', 'management']

    data_score = sum(1 for k in data_kw if _has_skill(k, tl) or k in tl)
    mgmt_score = sum(1 for k in mgmt_kw if k in tl)

    if data_score >= 3:
        return {
            'label': 'Data & Analytics',
            'desc': 'Your resume aligns with Data Analyst / Scientist profiles.',
            'tags': [
                {'label': 'SQL',    'ok': _has_skill('sql', tl)},
                {'label': 'Python', 'ok': _has_skill('python', tl)},
                {'label': 'ML',     'ok': bool(re.search(r'\b(machine.?learning|scikit)\b', tl))},
            ],
        }
    elif mgmt_score >= 2:
        return {
            'label': 'Management / Leadership',
            'desc': 'Your resume matches Team Lead / Project Manager profiles.',
            'tags': [
                {'label': 'Leadership', 'ok': bool(re.search(r'\b(lead|manag)\w*\b', tl))},
                {'label': 'Agile',      'ok': 'agile' in tl},
                {'label': 'Technical',  'ok': len(present_skills) > 4},
            ],
        }
    else:
        return {
            'label': 'Technical / Engineering',
            'desc': 'Your resume closely matches Software Engineering profiles.',
            'tags': [
                {'label': 'Backend',  'ok': bool(re.search(r'\b(api|backend|server)\b', tl))},
                {'label': 'Frontend', 'ok': bool(re.search(r'\b(react|html|frontend)\b', tl))},
                {'label': 'DevOps',   'ok': bool(re.search(r'\b(docker|kubernetes)\b', tl))},
            ],
        }


def _suggestions(
    sections: list[dict],
    has_numbers: bool,
    missing_skills: list[str],
    has_jd: bool,
    kw_score: int,
) -> list[dict]:
    sec = {s['name']: s['present'] for s in sections}
    out = []
    if not sec.get('Certifications'):
        out.append({'priority': 'High', 'text': 'Add a certifications section (e.g., AWS, GCP) to boost ATS score.'})
    if not has_numbers:
        out.append({'priority': 'High', 'text': 'Quantify achievements with numbers and percentages (e.g., "improved performance by 30%").'})
    if missing_skills:
        top2 = missing_skills[:2]
        out.append({'priority': 'Medium', 'text': f'Consider adding {" and ".join(top2)} — common in similar roles.'})
    if has_jd and kw_score < 70:
        out.append({'priority': 'Medium', 'text': 'Mirror more keywords from the job description in your experience section.'})
    if not sec.get('Links (LinkedIn/GitHub)'):
        out.append({'priority': 'Low', 'text': 'Include your LinkedIn or GitHub URL for completeness.'})
    return out


def analyze_resume(resume_text: str, jd_text: str, filename: str) -> dict:
    text = resume_text
    has_text = len(text.strip()) > 50

    if not has_text:
        return {
            'ats': 55, 'keyword': 40, 'jobfit': 47, 'content': 60,
            'sections': [{'name': n, 'present': False} for n in SECTION_PATTERNS],
            'presentSkills': [], 'missingSkills': [],
            'jdFoundSkills': [], 'jdMissingSkills': [],
            'detectedRole': 'Technical / Engineering',
            'cluster': 'Technical / Engineering',
            'clusterDesc': 'Could not extract text from the uploaded file.',
            'clusterTags': [],
            'suggestions': [{'priority': 'High', 'text': 'Could not read resume content. Try a different file format.'}],
            'hasJD': False, 'filename': filename,
        }

    present_skills, missing_skills = detect_skills(text)
    sections = detect_sections(text)
    sections_found = sum(1 for s in sections if s['present'])
    word_count = len(text.split())
    has_numbers = bool(re.search(r'\d+\s*%|\d+\s*\+|\$\s*\d+|\d+\s*years?', text, re.IGNORECASE))
    has_objective = any(s['name'] == 'Career Objective' and s['present'] for s in sections)

    ats = _ats_score(sections_found, len(present_skills), word_count, has_numbers)
    content = _content_score(sections_found, word_count, has_numbers, has_objective)

    has_jd = bool(jd_text and len(jd_text.strip()) > 50)
    keyword, jd_found, jd_missing = _keyword_match(text, jd_text if has_jd else '')

    jobfit = (
        min(round(ats * 0.5 + keyword * 0.5), 98) if has_jd
        else min(round(ats * 0.85), 98)
    )

    cluster = _detect_cluster(text, present_skills)
    suggestions = _suggestions(sections, has_numbers, missing_skills, has_jd, keyword)

    return {
        'ats': ats,
        'keyword': keyword,
        'jobfit': jobfit,
        'content': content,
        'sections': sections,
        'presentSkills': present_skills,
        'missingSkills': missing_skills,
        'jdFoundSkills': jd_found,
        'jdMissingSkills': jd_missing,
        'detectedRole': cluster['label'],
        'cluster': cluster['label'],
        'clusterDesc': cluster['desc'],
        'clusterTags': cluster['tags'],
        'suggestions': suggestions,
        'hasJD': has_jd,
        'filename': filename,
    }
