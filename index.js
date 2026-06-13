const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

// 1. Web server for Render to keep the bot alive
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Fast AI Bot is running smoothly!'));
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
    console.log(`Success! ${client.user.tag} is online and super fast.`);
});

// Helper function to hit the ultra-fast direct AI text engine
async function getFastAIResponse(userMessage) {
    try {
        const response = await axios.post('https://text.pollinations.ai/', {
            messages: [
                { role: "system", content: "You are a casual, friendly, and funny Discord community member. Speak like a normal teenager hanging out in chat, keep answers relatively short, and use clean modern text slang." },
                { role: "user", content: userMessage }
            ],
            model: "openai" // Switches to a high-speed text model
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000 // Force cuts off if it ever takes over 5 seconds
        });

        // Pull the text cleanly from the response body data
        const replyText = response.data?.choices?.[0]?.message?.content;
        return replyText ? replyText.trim() : "Yo! What's up?";
    } catch (error) {
        console.error("AI Fetch Error:", error.message);
        return "I'm lagging slightly right now, try hitting me up again in a second!";
    }
}

// 3. Listen for tags/mentions in chat
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Trigger only if the bot is tagged directly
    if (message.mentions.has(client.user) && !message.mentions.everyone) {
        const cleanPrompt = message.content.replace(`<@${client.user.id}>`, '').trim();
        
        if (!cleanPrompt) {
            return message.reply("Yo! What's up? Mention me and ask something!");
        }

        try {
            // Instantly start typing indicator to show responsiveness
            await message.channel.sendTyping();
            
            // Get the fast response text
            const aiResponse = await getFastAIResponse(cleanPrompt);
            
            // Make sure the text stays cleanly under Discord's layout limits
            await message.reply(aiResponse.substring(0, 1999));
        } catch (error) {
            console.error("Interaction Error:", error);
            await message.reply("My bad, couldn't grab that answer right now.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
