import re

# Read the file
with open('candidates/services/chunking.py', 'r') as f:
    content = f.read()

# Define the new function
new_func = '''def split_into_sentences(text: str) -> List[str]:
    """
    Split text into sentences using regex pattern.
    Handles various sentence endings (. ! ?) and maintains punctuation.
    Also handles newlines as paragraph separators for resumes with bullet points.
    """
    # First, normalize multiple newlines to single newline
    text = re.sub(r'\\n+', '\\n', text)
    
    # Split by newlines first (for bullet points and list items)
    lines = text.split('\\n')
    
    sentences = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Skip pure bullet points like "-" or "*"
        if line in ('-', '*', '•'):
            continue
        
        # Remove bullet markers at the start
        line = re.sub(r'^[\\-\\*\\•]\\s*', '', line)
        
        # If line has sentence-ending punctuation, split it
        if re.search(r'[.!?]\\s+', line):
            # Split on sentence endings
            parts = re.split(r'(?<=[.!?])\\s+', line)
            sentences.extend([s.strip() for s in parts if s.strip()])
        else:
            # Treat the whole line as a sentence
            sentences.append(line)
    
    return sentences'''

# Define old function pattern
old_pattern = r'def split_into_sentences\(text: str\) -> List\[str\]:.*?return \[s\.strip\(\) for s in sentences if s\.strip\(\)\]'

# Replace
new_content = re.sub(old_pattern, new_func, content, flags=re.DOTALL)

# Write back
with open('candidates/services/chunking.py', 'w') as f:
    f.write(new_content)

print('File updated successfully')

