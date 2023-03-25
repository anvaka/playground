import os
import openai
import sys
from halo import Halo

openai.api_key = os.environ["OPENAI_KEY"]
MODEL = "gpt-4"
spinner = Halo(text='Thinking', spinner='dots')

def suggest_command(prompt):
    response = openai.ChatCompletion.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful assistant. The user provides a command prompt question, and you provide a suggested command. Please make sure the command works in zsh for Mac OS. Feel free to ignore other linux versions. Your response must be a single command."},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
    )

    return response.choices[0]['message']['content']

def explain_command(command):
    spinner.start()
    response = openai.ChatCompletion.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful assistant. The user provides a shell command and you provide an explanation for this command. Please make sure the command works in zsh for Mac OS. Feel free to ignore other linux versions"},
            {"role": "user", "content": command},
        ],
        temperature=0,
    )

    spinner.stop()
    print(response.choices[0]['message']['content'])

def ask_for_user_input(command_suggestion):
    print(f"\n{command_suggestion}\n")
    while True:
        user_input = input("1 to run the command, 2 to explain the command: ")
        if user_input == '1':
            os.system(command_suggestion)
            break
        elif user_input == '2':
            explain_command(command_suggestion)
            break
        else:
            break

if __name__ == "__main__":
    prompt = sys.argv[1]

    spinner.start();
    suggestion = suggest_command(prompt)
    spinner.stop();
    ask_for_user_input(suggestion)
