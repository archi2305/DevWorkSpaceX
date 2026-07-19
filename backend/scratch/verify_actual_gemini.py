import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key: {api_key[:6]}...{api_key[-4:] if api_key else ''}")

client = genai.Client(api_key=api_key)
try:
    print("Listing available models...")
    for model in client.models.list():
        print(model.name)
except Exception as e:
    print(f"Failed to list models: {e}")
