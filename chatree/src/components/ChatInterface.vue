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
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        const assistantReply = data.choices[0].message.content;
        messages.value.push({ role: 'assistant', content: assistantReply });
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