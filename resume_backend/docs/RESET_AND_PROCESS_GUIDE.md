# Reset and Process All Resumes - Execution Guide

## Overview

The script `reset_and_process_all.py` has been created to perform the following tasks:
1. Clear all data from the database (pipeline, candidates, resumes, etc.)
2. Delete all resume files from the media/resumes folder
3. Process all resumes from the `resumes/` folder through the complete pipeline
4. Create pipeline entries for all candidates against available jobs

## How to Run the Script

### Option 1: Using Virtual Environment (Recommended)

Open a terminal/command prompt and navigate to the project directory:

```bash
cd d:\PFS\project\Project1\resume_backend
```

Activate the virtual environment:

```bash
..\..\.venv\Scripts\activate
```

Run the script:

```bash
python reset_and_process_all.py
```

### Option 2: Direct Python Path

If you don't want to activate the virtual environment:

```bash
cd d:\PFS\project\Project1\resume_backend
..\..\.venv\Scripts\python.exe reset_and_process_all.py
```

## What the Script Does

### Phase 1: Clear All Data
- Deletes all pipeline entries (if table exists)
- Deletes all resume chunks
- Deletes all resumes
- Deletes all candidates
- Optionally deletes skills (commented out by default)

### Phase 2: Clear Media Files
- Deletes all files from `media/resumes/` folder

### Phase 3: Process All Resumes
For each resume in the `resumes/` folder:
1. Extracts text from the file (PDF, DOCX, DOC, or TXT)
2. Parses the resume to extract candidate data
3. Creates or updates the candidate record
4. Creates a resume record and saves the file to media
5. Chunks the resume text
6. Generates embeddings for the chunks
7. Extracts skills from the resume
8. Generates a candidate summary

### Phase 4: Create Pipeline Entries
- Creates sample jobs if none exist:
  - Software Engineer
  - SAP ABAP Developer
  - SAP FICO Consultant
- Creates pipeline entries for all candidates against all jobs
- Sets initial stage to "applied"

## Expected Output

The script will output progress information for each phase:

```
============================================================
RESET AND PROCESS ALL RESUMES
============================================================

============================================================
CLEARING ALL DATA FROM DATABASE
============================================================
Deleting X pipeline entries...
Deleting Y resume chunks...
Deleting Z resumes...
Deleting N candidates...
All data cleared successfully!

============================================================
DELETING MEDIA RESUME FILES
============================================================
[+] Deleted M files from media/resumes/

============================================================
SCANNING RESUME FILES
============================================================
[+] Found K resume files
  1. Resume1.pdf
  2. Resume2.pdf
  ...

============================================================
PROCESSING: Resume1.pdf
============================================================
  [1/8] Extracting text from resume...
  [+] Extracted N characters
  [2/8] Parsing resume to extract candidate data...
  [+] Extracted: John Doe
  [+] Email: john@example.com
  [+] Phone: 1234567890
  [3/8] Creating/updating candidate record...
  [+] Creating new candidate...
  [4/8] Creating resume record...
  [+] Resume created with ID: 1
  [5/8] Chunking resume text...
  [+] Created X chunks
  [6/8] Generating embeddings...
  [+] Embeddings generated
  [7/8] Extracting skills...
  [+] Extracted Y skills
  [8/8] Generating candidate summary...
  [+] Summary generated
  [+] SUCCESS: Resume1.pdf processed completely!

============================================================
PROCESSING ALL RESUMES
============================================================
...

============================================================
CREATING PIPELINE ENTRIES
============================================================
Found N candidates
Found 3 jobs
Creating pipeline entries for N candidates against 3 jobs...
  [+] Created pipeline: John Doe -> Software Engineer
  [+] Created pipeline: John Doe -> SAP ABAP Developer
  ...

============================================================
FINAL SUMMARY
============================================================
Candidates: N
Resumes: N
Resume Chunks: X
Pipeline Entries: Y
Jobs: 3
Skills: Z

[+] ALL TASKS COMPLETED SUCCESSFULLY!
============================================================
```

## Troubleshooting

### Issue: "No module named 'django'"

**Solution:** Make sure you're using the virtual environment's Python:
```bash
..\..\.venv\Scripts\python.exe reset_and_process_all.py
```

### Issue: "relation 'pipeline_candidatepipeline' does not exist"

**Solution:** The script handles this gracefully and will continue processing. The pipeline table will be created when you run migrations.

### Issue: Script takes too long

**Solution:** The script processes each resume sequentially, and each resume requires:
- Text extraction
- LLM parsing (if using Gemini/Perplexity)
- Embedding generation
- Skill extraction
- Summary generation

This can take time depending on:
- Number of resumes
- Resume file sizes
- API response times
- Network speed

**Tips:**
- Run the script when you have time (it may take 10-30 minutes depending on the number of resumes)
- Monitor progress in the terminal
- If it fails on a particular resume, note which one and investigate

### Issue: "Resumes folder not found"

**Solution:** Make sure the `resumes/` folder exists in the project root:
```
d:\PFS\project\resumes\
```

## After Running the Script

Once the script completes successfully:

1. **Verify Data:**
   ```bash
   cd Project1/resume_backend
   python manage.py shell
   ```
   Then run:
   ```python
   from candidates.models import Candidate, Resume
   from pipeline.models import CandidatePipeline
   from jd_app.models import JobDescription
   
   print(f"Candidates: {Candidate.objects.count()}")
   print(f"Resumes: {Resume.objects.count()}")
   print(f"Pipelines: {CandidatePipeline.objects.count()}")
   print(f"Jobs: {JobDescription.objects.count()}")
   ```

2. **Test the API:**
   - Start the Django server: `python manage.py runserver`
   - Test endpoints:
     - `http://localhost:8000/api/pipeline/`
     - `http://localhost:8000/api/pipeline/by_stage/`
     - `http://localhost:8000/api/candidates/`

3. **Check Admin Panel:**
   - Go to `http://localhost:8000/admin/`
   - Log in and verify:
     - Candidates are created
     - Resumes are uploaded
     - Pipeline entries exist
     - Jobs are created

## Customization

### Modify Sample Jobs

Edit the `create_pipeline_entries()` function in `reset_and_process_all.py` to customize the sample jobs:

```python
sample_jobs = [
    {
        'title': 'Your Job Title',
        'description': 'Job description here',
        'skills': 'skill1, skill2, skill3'
    },
    # Add more jobs as needed
]
```

### Skip Data Clearing

If you want to keep existing data, comment out these lines in the `main()` function:

```python
# Step 1: Clear all data
# clear_all_data()

# Step 2: Clear media resume files
# clear_media_resumes()
```

### Process Specific Resumes Only

Modify the `get_resume_files()` function to filter specific files:

```python
# Example: Only process PDF files
if file_path.is_file() and file_path.suffix.lower() == '.pdf':
    resume_files.append(file_path)
```

## Important Notes

1. **API Keys Required:** The script requires `GEMINI_API_KEY` and `PPLX_API_KEY` for:
   - Resume parsing
   - Skill extraction
   - Summary generation

2. **Database:** Make sure PostgreSQL is running and configured in `.env`

3. **Resumes Folder:** Ensure the `resumes/` folder contains the resume files you want to process

4. **Backup:** If you have important data, back it up before running this script as it deletes all existing data

## Support

If you encounter any issues:
1. Check the error messages in the terminal
2. Verify your `.env` configuration
3. Ensure all dependencies are installed
4. Check PostgreSQL is running
5. Verify API keys are valid

## Next Steps

After running the script:
1. Verify all data is correctly imported
2. Test the pipeline API endpoints
3. Update candidate stages as needed
4. Match candidates to jobs using the ranking system
5. Use the analytics dashboard to view statistics