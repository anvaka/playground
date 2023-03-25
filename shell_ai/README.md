## ChatGPT as shell assistant

Usage:

```
?? list top 10 largest files in the current folder
```

Installation:

```
pip install -r requirements.txt
```

In your `.zshrc`:

```
export OPENAI_KEY=sk-... your open ai key

function ??() {
     python <path_to_folder_with_script>/gpt_suggest.py "$*"
}
```

