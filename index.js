const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

// 1. Web server for Render
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Free AI Chat Bot is online!'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// 2. Discord Bot Setup
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

client.once('ready', () => {
    console.log(`${client.user.tag} is online and ready to chat!`);
});

// Helper function to talk to DuckDuckGo's Free AI (Llama 3 / Mixtral)
async function getFreeAIResponse(userMessage) {
    try {
        // Step A: Fetch the required token from DDG
        const tokenRes = await axios.get('https://duckduckgo.com/duckchat/v1/status', {
            headers: { 'x-vqd-accept': '1' }
        });
        const vqdToken = tokenRes.headers['x-vqd-token'];

        // Step B: Send the chat history/prompt
        const chatRes = await axios.post('https://duckduckgo.com/duckchat/v1/chat', {
            model: "meta-llama/Meta-Llama-3-70B-Instruct-Turbo", // Fast, free open model
            messages: [
                { role: "system", content: "You are a casual, friendly, and funny Discord member. Keep answers short, talk like a normal person hanging out in chat, and use modern text slang." },
                { role: "user", content: userMessage }
            ]
        }, {
            headers: {
                'x-vqd-token': vqdToken,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            }
        });

        // Step C: Clean up the stream responses into clean text strings
        const textLines = chatRes.data.split('\n');
        let fullReply = '';
        for (let line of textLines) {
            if (line.startsWith('data: ')) {
                const dataStr = line.replace('data: ', '').trim();
                if (dataStr === '[DONE]') break;
                try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.message) fullReply += parsed.message;
                } catch (e) {}
            }
        }
        return fullReply.trim() || "Yo, what's up?";
    } catch (error) {
        console.error("AI Error:", error);
        return "My bad, my brain just glitched. Try tagging me again!";
    }
}

// 3. Reply when tagged
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user) && !message.mentions.everyone) {
        const cleanPrompt = message.content.replace(`<@${client.user.id}>`, '').trim();
        
        if (!cleanPrompt) {
            return message.reply("Yo! What's up? Mention me and ask me something!");
        }

        try {
            await message.channel.sendTyping();
            const aiResponse = await getFreeAIResponse(cleanPrompt);
            
            // Limit characters so Discord doesn't crash if it's too long
            await message.reply(aiResponse.substring(0, 1999));
        } catch (error) {
            await message.reply("My bad, couldn't process that right now.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
