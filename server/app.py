import tiktoken
import openai
from flask import Flask, request, jsonify
import uuid
import os
openai.api_type = "azure"
openai.api_version = "2023-03-15-preview"
openai.api_base = os.getenv("OPENAI_API_BASE")  # Your Azure OpenAI resource's endpoint value .
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

system_message = {"role": "system", "content": "You are a helpful assistant."}
max_response_tokens = 4000
token_limit= 4096
conversation=[]
conversation.append(system_message)
history = {}

def num_tokens_from_messages(messages, model="gpt-3.5-turbo-0301"):
    encoding = tiktoken.encoding_for_model(model)
    num_tokens = 0
    for message in messages:
        num_tokens += 4  # every message follows <im_start>{role/name}\n{content}<im_end>\n
        for key, value in message.items():
            num_tokens += len(encoding.encode(value))
            if key == "name":  # if there's a name, the role is omitted
                num_tokens += -1  # role is always required and always 1 token
    num_tokens += 2  # every reply is primed with <im_start>assistant
    return num_tokens

@app.route('/api/chat', methods=['POST'])
def chat():
    req = request.get_json()
    sessionId = request.cookies.get('session_id') or str(uuid.uuid4())
    conversation = history.get(sessionId) or []
    if (len(conversation) == 0):
        conversation.append(system_message)
    conversation.append({"role": "user", "content": req.get('message')})
    conv_history_tokens = num_tokens_from_messages(conversation)

    while (conv_history_tokens >= token_limit):
        print('too long', conv_history_tokens)
        del conversation[1] 
        conv_history_tokens = num_tokens_from_messages(conversation)
        
    res = openai.ChatCompletion.create(
        engine="gpt35", # The deployment name you chose when you deployed the ChatGPT or GPT-4 model.
        messages = conversation,
        temperature=.7,
        max_tokens=max_response_tokens,
    )
    content = res['choices'][0]['message']['content']
    history[sessionId] = conversation
    response = jsonify({
        'content': content
    })
    response.set_cookie('session_id', sessionId)
    return response

if __name__ == '__main__':
    app.run(debug=os.getenv('DEBUG'))