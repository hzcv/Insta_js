const express = require('express');
const multer = require('multer');
const { IgApiClient } = require('instagram-private-api');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Serve static files (frontend)
app.use(express.static('public'));

// Backend route to handle message sending
app.post('/send', upload.single('messageFile'), async (req, res) => {
    try {
        const { username, password, type, target, haterName, delay } = req.body;
        const messages = fs.readFileSync(req.file.path, 'utf8').split('\n').filter(l => l.trim());
        fs.unlinkSync(req.file.path); // Clean up uploaded file

        const client = new IgApiClient();
        client.state.generateDevice(username);
        await client.account.login(username, password);

        const sendMessage = async (thread, message) => {
            await thread.broadcastText(`${haterName} : ${message}`);
            await new Promise(resolve => setTimeout(resolve, parseInt(delay)));
        };

        if (type === 'inbox') {
            const userId = await client.user.getIdByUsername(target);
            const thread = client.entity.directThread([userId.toString()]);
            while (true) {
                for (const message of messages) {
                    await sendMessage(thread, message);
                }
            }
        } else {
            const thread = client.entity.directThread(target);
            while (true) {
                for (const message of messages) {
                    await sendMessage(thread, message);
                }
            }
        }

        res.send('Messages are being sent!');
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

// Start the server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
