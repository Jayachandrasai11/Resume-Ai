import requests

url = "https://resume-ai-obq3.onrender.com/api/auth/register/"
headers = {
    "Origin": "https://resume-ai-sable.vercel.app",
    "Content-Type": "application/json"
}
data = {
    "email": "pythontest@example.com",
    "password": "StrongPassword123!"
}

try:
    print(f"POSTing to {url}...")
    response = requests.post(url, json=data, headers=headers, timeout=20)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
