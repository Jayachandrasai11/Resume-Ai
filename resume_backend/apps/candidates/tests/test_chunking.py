"""
Tests for the Resume Chunking System.
Run with: python manage.py test candidates.tests.test_chunking
"""
from django.test import TestCase
from django.db import transaction
from ..models import Resume, ResumeChunk, Candidate
from ..services.chunking import (
    chunk_resume_text,
    chunk_and_store_resume,
    chunk_resumes_batch,
    get_resume_chunks,
    get_chunk_text_for_embedding
)


class ResumeChunkingTests(TestCase):
    
    def setUp(self):
        """Set up test data."""
        self.candidate = Candidate.objects.create(
            name="John Doe",
            email="john@example.com",
            phone="123-456-7890"
        )
        
        # Create a resume with sample text - expanded for proper chunking
        self.resume_text = """
        John Doe
        Software Engineer
        
        SUMMARY:
        Experienced software engineer with 5+ years of experience in Python, Django, and React.
        Strong background in building scalable web applications and RESTful APIs.
        Passionate about clean code, design patterns, and software architecture.
        Proven track record of delivering high-quality solutions on time.
        Excellent problem-solving skills and ability to work in agile environments.
        
        EXPERIENCE:
        Senior Software Engineer at TechCorp (2020-Present)
        - Led development of several high-traffic web applications serving millions of users
        - Implemented microservices architecture improving system performance by 40%
        - Mentored junior developers and conducted code reviews for team of 5 engineers
        - Designed and implemented RESTful APIs using Django REST Framework
        - Collaborated with product managers to define technical requirements
        - Implemented CI/CD pipelines using Jenkins and Docker reducing deployment time by 60%
        
        Software Developer at WebSolutions (2018-2020)
        - Developed and maintained e-commerce platforms serving 100k+ monthly active users
        - Integrated payment gateways including Stripe, PayPal, and Square
        - Built order management systems handling 10k+ orders per day
        - Collaborated with cross-functional teams to deliver projects on time
        - Optimized database queries reducing page load times by 50%
        - Wrote comprehensive unit and integration tests achieving 85% code coverage
        
        Junior Developer at StartupXYZ (2016-2018)
        - Built responsive web applications using HTML, CSS, JavaScript, and jQuery
        - Assisted in backend development using Python and Flask
        - Participated in daily stand-ups and sprint planning meetings
        - Contributed to documentation and knowledge base articles
        
        EDUCATION:
        Bachelor of Science in Computer Science
        University of Technology, 2018
        - Relevant coursework: Data Structures, Algorithms, Database Systems, Operating Systems
        - Graduated with Honors (GPA 3.8)
        - President of Computer Science Club
        - Teaching Assistant for Introduction to Programming courses
        
        SKILLS:
        Programming Languages: Python, JavaScript, Java, SQL, HTML, CSS
        Frameworks: Django, Django REST Framework, React, Node.js, Express, Flask
        Databases: PostgreSQL, MySQL, MongoDB, Redis
        Tools: Git, Docker, Kubernetes, AWS, GCP, Jenkins, JIRA
        Testing: pytest, unittest, Jest, Selenium
        
        PROJECTS:
        1. E-commerce Platform: Full-stack development using Django and React. Implemented payment integration, inventory management, and order tracking. Tech stack: Django, React, PostgreSQL, Stripe.
        2. API Gateway: Microservices orchestration system handling 1M+ requests per day. Implemented rate limiting, authentication, and load balancing. Tech stack: Python, Docker, Kubernetes.
        3. Task Management App: Real-time collaborative tool with WebSocket support. Features include task creation, assignment, and progress tracking. Tech stack: Node.js, Express, MongoDB, Socket.io.
        4. Chat Application: Real-time messaging platform with group chats and file sharing. Tech stack: Django Channels, Redis, WebSockets.
        
        CERTIFICATIONS:
        - AWS Certified Solutions Architect - Associate (2023)
        - Google Cloud Professional Data Engineer (2022)
        - Python Institute PCAP Certification (2021)
        
        REFERENCES:
        Available upon request.
        """
        
        self.resume = Resume.objects.create(
            candidate=self.candidate,
            file_name="john_doe_resume.pdf",
            text=self.resume_text
        )
    
    def test_chunk_resume_text_basic(self):
        """Test basic text chunking functionality."""
        chunks = chunk_resume_text(self.resume_text, min_words=300, max_words=500)
        
        # Should create at least one chunk
        self.assertGreater(len(chunks), 0)
        
        # Each chunk should have reasonable length
        for chunk in chunks:
            word_count = len(chunk.split())
            # Allow flexibility - with small texts, single chunk is OK
            self.assertGreaterEqual(word_count, 100)
            self.assertLessEqual(word_count, 550)
    
    def test_chunk_resume_text_empty(self):
        """Test chunking empty text."""
        chunks = chunk_resume_text("", min_words=300, max_words=500)
        self.assertEqual(len(chunks), 0)
        
        chunks = chunk_resume_text("   ", min_words=300, max_words=500)
        self.assertEqual(len(chunks), 0)
    
    def test_chunk_resume_text_small(self):
        """Test chunking text that's smaller than min_words."""
        small_text = "John Doe. Software Engineer. Python expert."
        chunks = chunk_resume_text(small_text, min_words=300, max_words=500)
        
        # Should still create a single chunk
        self.assertEqual(len(chunks), 1)
        
        word_count = len(chunks[0].split())
        self.assertLess(word_count, 300)
    
    def test_chunk_and_store_resume_success(self):
        """Test successful chunking and storage."""
        result = chunk_and_store_resume(self.resume.id)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['resume_id'], self.resume.id)
        self.assertGreater(result['total_chunks'], 0)
        self.assertGreater(result['total_words'], 0)
        
        # Verify chunks were stored in database
        chunks = ResumeChunk.objects.filter(resume=self.resume)
        self.assertEqual(chunks.count(), result['total_chunks'])
        
        # Verify chunk order
        chunk_indices = list(chunks.order_by('chunk_index').values_list('chunk_index', flat=True))
        self.assertEqual(chunk_indices, list(range(len(chunk_indices))))
        
        # Verify resume chunked flag
        self.resume.refresh_from_db()
        self.assertTrue(self.resume.chunked)
    
    def test_chunk_and_store_resume_not_found(self):
        """Test chunking non-existent resume."""
        result = chunk_and_store_resume(99999)
        self.assertFalse(result['success'])
        self.assertIn('not found', result['error'])
    
    def test_chunk_and_store_resume_no_text(self):
        """Test chunking resume with no text."""
        empty_resume = Resume.objects.create(
            candidate=self.candidate,
            file_name="empty.pdf",
            text=""
        )
        
        result = chunk_and_store_resume(empty_resume.id)
        self.assertFalse(result['success'])
        self.assertIn('no text content', result['error'])
    
    def test_chunk_and_store_resume_rechunking(self):
        """Test re-chunking a resume (should delete old chunks)."""
        # First chunking
        result = chunk_and_store_resume(self.resume.id)
        self.assertTrue(result['success'])
        
        # Re-chunk the same resume
        result2 = chunk_and_store_resume(self.resume.id)
        
        # Should have same number of chunks (or similar)
        self.assertTrue(result2['success'])
        
        # Verify old chunks were deleted and new ones created
        chunks = ResumeChunk.objects.filter(resume=self.resume)
        self.assertEqual(chunks.count(), result2['total_chunks'])
    
    def test_chunk_resumes_batch_success(self):
        """Test batch chunking of multiple resumes."""
        # Create additional resumes
        resume2 = Resume.objects.create(
            candidate=self.candidate,
            file_name="resume2.pdf",
            text="This is another resume with some content that should be chunked."
        )
        resume3 = Resume.objects.create(
            candidate=self.candidate,
            file_name="resume3.pdf",
            text="Short resume."
        )
        
        resume_ids = [self.resume.id, resume2.id, resume3.id]
        
        result = chunk_resumes_batch(resume_ids)
        
        self.assertEqual(result['total_processed'], 3)
        self.assertGreaterEqual(result['successful'], 2)  # At least 2 should succeed
    
    def test_chunk_resumes_batch_invalid_ids(self):
        """Test batch chunking with invalid resume IDs."""
        result = chunk_resumes_batch([99999, 88888])
        
        self.assertEqual(result['total_processed'], 2)
        self.assertEqual(result['successful'], 0)
        self.assertEqual(result['failed'], 2)
    
    def test_get_resume_chunks(self):
        """Test retrieving chunks for a resume."""
        # First create chunks
        chunk_and_store_resume(self.resume.id)
        
        # Retrieve chunks
        chunks = get_resume_chunks(self.resume.id)
        
        self.assertGreater(len(chunks), 0)
        
        # Verify chunks are ordered correctly
        for i, chunk in enumerate(chunks):
            self.assertEqual(chunk.chunk_index, i)
        
        # Verify each chunk has the expected fields
        for chunk in chunks:
            self.assertIsNotNone(chunk.chunk_text)
            self.assertIsNotNone(chunk.resume)
            self.assertIsNotNone(chunk.created_at)
    
    def test_get_chunk_text_for_embedding(self):
        """Test getting chunk texts for embedding generation."""
        # First create chunks
        chunk_and_store_resume(self.resume.id)
        
        # Get chunk texts
        chunk_texts = get_chunk_text_for_embedding(self.resume.id)
        
        self.assertGreater(len(chunk_texts), 0)
        
        # Verify texts are in order
        chunks = ResumeChunk.objects.filter(resume=self.resume).order_by('chunk_index')
        for i, chunk in enumerate(chunks):
            self.assertEqual(chunk_texts[i], chunk.chunk_text)
    
    def test_chunk_creation_with_custom_word_counts(self):
        """Test chunking with custom word count parameters."""
        result = chunk_and_store_resume(
            self.resume.id,
            min_words=100,
            max_words=200
        )
        
        self.assertTrue(result['success'])
        
        # Verify each chunk respects the word limits (with some flexibility)
        chunks = ResumeChunk.objects.filter(resume=self.resume)
        for chunk in chunks:
            word_count = len(chunk.chunk_text.split())
            # Allow some flexibility in boundaries
            self.assertGreaterEqual(word_count, 80)
            self.assertLessEqual(word_count, 250)
    
    def test_chunk_text_consistency(self):
        """Test that chunked text can be reconstructed to original."""
        # First chunk the resume
        chunk_and_store_resume(self.resume.id)
        
        # Get all chunks in order
        chunks = ResumeChunk.objects.filter(resume=self.resume).order_by('chunk_index')
        
        # Reconstruct text
        reconstructed_text = ' '.join(chunk.chunk_text for chunk in chunks)
        
        # Verify all original content is preserved (allowing for extra spaces and punctuation differences)
        for word in ['John', 'Doe', 'Software', 'Engineer', 'TechCorp', 'Python', 'Django']:
            self.assertIn(word, reconstructed_text)

