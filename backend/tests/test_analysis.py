import unittest

from backend.analysis import analyze_resume


RESUME_TEXT = """
Jane Doe
LinkedIn: linkedin.com/in/janedoe | GitHub: github.com/janedoe

Summary
Software engineer with 3 years of experience building web applications.

Skills
Python, JavaScript, React, FastAPI, SQL, PostgreSQL, Docker, Git

Experience
Built REST APIs and reduced response time by 30% for a customer dashboard.

Projects
Created a resume analysis application with Python and React.

Education
Bachelor of Science in Computer Science
"""

JOB_DESCRIPTION = """
We are hiring a software engineer to develop scalable web applications and REST APIs.
The role requires Python, FastAPI, SQL, PostgreSQL, Docker, Git, and strong
communication skills. Experience with Kubernetes is a plus.
"""


class AnalyzeResumeTests(unittest.TestCase):
    def test_returns_expected_result_shape(self):
        result = analyze_resume(RESUME_TEXT, JOB_DESCRIPTION, "jane-doe.pdf")

        self.assertEqual(result["filename"], "jane-doe.pdf")
        self.assertTrue(result["hasJD"])
        self.assertIn("Python", result["presentSkills"])
        self.assertIn("Python", result["jdFoundSkills"])
        self.assertIn("Kubernetes", result["jdMissingSkills"])
        self.assertEqual(len(result["sections"]), 7)

        for score_name in ("ats", "keyword", "jobfit", "content"):
            self.assertGreaterEqual(result[score_name], 0)
            self.assertLessEqual(result[score_name], 98)

    def test_short_or_unreadable_text_returns_guidance(self):
        result = analyze_resume("Too short", "", "empty.pdf")

        self.assertEqual(result["filename"], "empty.pdf")
        self.assertFalse(result["hasJD"])
        self.assertEqual(result["presentSkills"], [])
        self.assertIn("Could not read", result["suggestions"][0]["text"])
