const express = require('express');
const app = express();

// Add CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.all('/', (req, res) => {
    res.send('nope');
})

app.get('/*', async (req, res) => {
    try {
        //const { url } = req.query;
        //const userip = req.socket.remoteAddress;
        const userip=req.headers["x-forwarded-for"]
        // Error Handling
        //if (!url) {
        //    return res.status(400).json({ error: 'Missing URL parameter' });
        //}

        try {
            new URL("https://nichtderuwe.nichtderuwe.workers.dev"+req.originalUrl);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid URL' });
        }

        //try {
        //    await fetch(new URL(url).hostname, { method: 'HEAD' });
        //} catch (error) {
        //    return res.status(400).json({ error: "Failed to fetch" });
        //}
        
        // Make a request and send response back to client
        console.log(userip)
        var headers = {
            "X-Forwarded-For": userip,
            "X-Real-IP": userip,
          }
        const response = await fetch("https://nichtderuwe.nichtderuwe.workers.dev"+req.originalUrl, { method: 'GET', headers: headers, cache: 'no-store'});
        //const data = await response.json();
        //res.json(data);
        console.log("have res")
        console.log(response.status)
        console.log(response.headers)
        res.send(response.body(), response.headers{})
    } catch (error) {
        console.log("got err:"+error)
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


//const PORT = process.env.PORT || 3000;
//app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
app.listen(process.env.PORT || 3000)