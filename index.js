const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

// 1. Background web server for Railway stability
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('HuggingFace AI Bot is online!'));
app.listen(PORT, () => console.log(`Web server listening on port ${PORT}`));

// 2. Discord Bot Setup
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

client.once('ready', () => {
    console.log(`${client.user.tag} is online and running on Hugging Face servers!`);
});

// Helper function to hit Hugging Face's stable free API
async function getFastAIResponse(userMessage) {
    try {
        // Constructing a robust text prompt structure
        const systemPrompt = "You are a casual, friendly, and funny Discord community member. Speak like a normal teenager hanging out in chat, keep answers short, and use clean modern text slang.";
        const fullPrompt = `<s>[INST] ${systemPrompt}\nUser: ${userMessage} [/INST]`;

        // Targeting a highly optimized, permanently free open-source text model
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/MistralAI/Mistral-7B-Instruct-v0.3',
            { 
                inputs: fullPrompt,
                parameters: { max_new_tokens: 150, temperature: 0.7 }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HF_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        // Hugging Face returns the full prompt + the generated answer text
        let replyText = response.data?.[0]?.generated_text || "";
        
        // Clean off the system instruction wrapper if it repeats in the output
        if (replyText.includes('[/INST]')) {
            replyText = replyText.split('[/INST]')[1];
        }

        return replyText ? replyText.trim() : "Yo! What's up?";
    } catch (error) {
        console.error("Hugging Face API Error:", error.message);
        return "My bad, my brain just had a minor lag spike. Try again!";
    }
}

// 3. Listen for tags/mentions in chat
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user) && !message.mentions.everyone) {
        const cleanPrompt = message.content.replace(`<@${client.user.id}>`, '').trim();
        
        if (!cleanPrompt) {
            return message.reply("Yo! What's up? Mention me and ask something!");
        }

        try {
            await message.channel.sendTyping();
            const aiResponse = await getFastAIResponse(cleanPrompt);
            await message.reply(aiResponse.substring(0, 1999));
        } catch (error) {
            console.error("Interaction Error:", error);
            await message.reply("My bad, my code glitched out.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
