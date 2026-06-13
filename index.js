const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

// 1. Background web server for Railway stability
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('AI Bot is fully online!'));
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
    console.log(`Success! ${client.user.tag} is active and processing text chat.`);
});

// Helper function using an un-gated, ultra-fast model
async function getFastAIResponse(userMessage) {
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct',
            { 
                inputs: `<|im_start|>system\nYou are a casual, friendly, and funny Discord community member. Speak like a normal teenager hanging out in chat, keep answers short, and use clean modern text slang. Do not use markdown headers.<|im_end|>\n<|im_start|>user\n${userMessage}<|im_end|>\n<|im_start|>assistant\n`
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HF_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        let replyText = response.data?.[0]?.generated_text || "";
        
        // Split out formatting wrappers if they leak into text output
        if (replyText.includes('<|im_start|>assistant')) {
            replyText = replyText.split('<|im_start|>assistant')[1];
        }
        
        return replyText.replace(/<\|im_end\|>/g, '').trim() || "Yo! What's up?";
    } catch (error) {
        console.error("AI Server Route Error:", error.message);
        return "My bad, my brain just had a minor lag spike. Try again!";
    }
}

// 3. Listen for tags/mentions in chat channels
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
