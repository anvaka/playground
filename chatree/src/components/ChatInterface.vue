<template>
  <div>
    <h2>Chat with LLM</h2>
    <div v-for="(message, index) in messages" :key="index">
      <p><strong>{{ message.role }}:</strong> {{ message.content }}</p>
    </div>
    <form @submit.prevent="sendMessage">
      <input v-model="userInput" placeholder="Type your message..." />
      <button type="submit">Send</button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue';
const VUE_APP_OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
console.log(VUE_APP_OPENAI_API_KEY);

export default {
  setup() {
    const messages = ref([]);
    const userInput = ref('');

    const sendMessage = async () => {
      messages.value.push({ role: 'user', content: userInput.value });

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VUE_APP_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: messages.value,
            stream: true, // Enable streaming
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        // Create a reader to read the response stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let assistantReply = '';
        messages.value.push({ role: 'assistant', content: '' });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.slice('data:'.length).trim();
              if (data === '[DONE]') {
                break;
              }
              const content = JSON.parse(data).choices[0].delta.content;
              if (content) {
                assistantReply += content;
                // Optionally, you can update the UI here with the current assistantReply
                messages.value[messages.value.length - 1].content = assistantReply;
              }
            }
          }
        }

        // messages.value.push({ role: 'assistant', content: assistantReply });
      } catch (error) {
        console.error('Error:', error);
      }

      userInput.value = '';
    };

    return {
      messages,
      userInput,
      sendMessage,
    };
  },
};
</script>