import requests

# Base URL for the API
BASE_URL = "http://localhost:8000/api"

# Sample user credentials and exercise data
USER_CREDENTIALS = {
    "identifier": "natsuhadder",  # Replace with a valid identifier
    "password": "Oussama0909!"  # Replace with a valid password
}


# Create a session to persist cookies across requests
session = requests.Session()

# Function to get CSRF token by making an initial GET request
def get_csrf_token():
    response = session.get(f"{BASE_URL}/auth/user/")
    csrf_token = response.cookies.get('csrftoken')
    print("CSRF Token:", csrf_token)
    return csrf_token

# Function to log in using the session with the CSRF token
def login(csrf_token):
    login_url = f"{BASE_URL}/auth/login/"
    headers = {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf_token
    }
    response = session.post(login_url, json=USER_CREDENTIALS, headers=headers)
    
    if response.status_code == 200:
        print("Login successful!")
        return True
    else:
        print("Login failed:", response.json())
        return False

# Function to create an exercise
def create_exercise():
    create_url = f"{BASE_URL}/exercises/"
    exercise_data = {
        "title": "Sample Exercise",
        "content": "This is a sample exercise content in markdown.",
        "type": "exercise",  # or "course"
        "class_level": ["1", "2"],
        "subject": "1",
        "chapters": ["1", "2"],
        "difficulty": "medium",
        "author": "natsuhadder"
    }
    
    
    csrf_token = session.cookies.get('csrftoken')
    headers = {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf_token
    }

    response = session.post(create_url, json=exercise_data, headers=headers)
    
    if response.status_code == 201:
        print("Exercise created successfully:", response.json())
    else:
        print("Failed to create exercise:", response.json())

# Main script execution
if __name__ == "__main__":
    csrf_token = get_csrf_token()
    if csrf_token and login(csrf_token):
        create_exercise()