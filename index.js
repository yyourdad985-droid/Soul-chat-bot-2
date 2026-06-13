const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

// 1. Background web server for Railway stability
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Ultra-fast AI Bot is online!'));
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
    console.log(`${client.user.tag} is online and running at maximum speed.`);
});

// Helper function to hit OpenRouter's universal free routing engine
async function getFastAIResponse(userMessage) {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "openrouter/free", // Routing directly to OpenRouter's free fallback pool
            messages: [
                { role: "system", content: "You are a casual, friendly, and funny Discord community member. Speak like a normal teenager hanging out in chat, keep answers short, and use clean modern text slang." },
                { role: "user", content: userMessage }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // Give it up to 10 seconds to handle heavy queue routing smoothly
        });

        const replyText = response.data?.choices?.[0]?.message?.content;
        return replyText ? replyText.trim() : "Yo! What's up?";
    } catch (error) {
        console.error("OpenRouter API Error:", error.message);
        return "I had a quick lag spike, try tagging me one more time!";
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
