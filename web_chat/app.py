import os
import openai
import json
from flask import Flask, request, jsonify, send_file
import logging
from logging.handlers import RotatingFileHandler

openai.api_key = os.environ["OPENAI_KEY"]
MODEL = "gpt-3.5-turbo"
MAIN_PROMPT =  "You are a helpful assistant. The user is a XX years old girl Xxxx. She is smart and curious. Please provide child appropriate answers only."

# Set up logging
log = logging.getLogger('myapp')
log.setLevel(logging.DEBUG)

# Set up a console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
console_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(console_formatter)
log.addHandler(console_handler)

# Set up a file handler
file_handler = RotatingFileHandler('log/application.log', maxBytes=1024*1024, backupCount=10)
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(file_formatter)
log.addHandler(file_handler)

app = Flask(__name__, static_folder='./static/')

@app.route('/')
def index():
    log.debug('Serving index.html')
    return send_file('static/index.html')

@app.route('/suggest_command', methods=['POST'])
def suggest_command():
    history = request.json
    print(history)

    messages = [
        {"role": "system", "content": MAIN_PROMPT},
    ]

    for h in history:
        print(h)
        messages.append({"role": "user", "content": h["prompt"]})
        if "response" in h:
            messages.append({"role": "assistant", "content": h["response"]}) 

    log.debug(f'Answering question: {history}')
    response = openai.ChatCompletion.create(
        model=MODEL,
        messages=messages,
        temperature=0.7,
    )
    content = response.choices[0]['message']['content']
    log.debug(f'Answer: {content}')
    return jsonify({'response': content})

if __name__ == '__main__':
    app.run()
