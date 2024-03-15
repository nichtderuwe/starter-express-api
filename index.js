const express = require('express');
const fs = require('fs');

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
        //console.log(userip)
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
        
        //const data = await response.json();
        //res.json(data);
        //console.log("have res")
        //console.log(response.status)
        //console.log(response.headers)
        //const hdrkeys=await response.headers.keys()
        //console.log(hdrkeys)
        //for (const hdridx in hdrkeys) {
        //    res.header(hdrkeys[hdridx], response.headers[hdrkeys[hdridx]]);
        //}
        //console.log("setcl")
        //res.set('content-length',response.headers.get('content-length'))
        //console.log("setct")
        //res.set('content-type',response.headers.get('content-type'))

        //res.send(await response.body,200)
        //res.end(await response.text(),'binary');
        //res.end(await response.body ,'binary');
        //const data = await response.body.transformToByteArray()
        //const buffer = Buffer.from(data); 
        //res.send(buffer)
        //res.send(response.body.pipeThrough(),'binary')
        //res.end(await response.arrayBuffer ,'binary');

        //res.send(await response.text())
        //res.writeHead(200, {
        //    'Content-Type': response.headers.get('content-type'),
        //    'Content-Length': response.headers.get('content-length')
        //  });
        //
        //return
        //res.end( await  response.arrayBuffer(),'binary')
        //response.body.pipeTo(res)
        // Make a request and send response back to client
        function atou(b64) {
            return decodeURIComponent(escape(atob(b64)));
          }
        function utoa(data) {
            return btoa(unescape(encodeURIComponent(data)));
          }
        const cacheFile="/tmp/"+utoa(req.originalUrl).replace("=","_").replace("/","_").replace("+","_")+".json"
        console.log("searching cache:"+cacheFile)
        const fileExists = async (file) => {
            try {
                await fs.access(file, constants.F_OK);
                return true;
            }catch(e) {
                return false;
            }
        };
        let needfetch=false
        if (await fileExists(cacheFile)) {
            console.log("cache found")
            // read and return
               try {
                   let myjsn=await JSON.parse(fs.readFile(cacheFile));  
                   if("ct" in myjsn && "content" in myjsn) {
                     res.contentType(response.headers.get('content-type'));
                     res.status(200)
                    res.on('finish', () => {
                       console.log("background fetch")
                                var headers = {
                              "X-Forwarded-For": userip,
                              "X-Real-IP": userip,
                               }
                             const response = fetch("https://nichtderuwe.nichtderuwe.workers.dev"+req.originalUrl, { method: 'GET', headers: headers, cache: 'no-store'});
                       console.log("background fetch res: "+response.status)
                    })
                     res.end(await atou(myjsn.content), 'binary')
                     
                   } else { needfetch=true }
               } catch (e) { 
               console.log("cached_err:"+e)
               needfetch=true
               }
        } else {
        needfetch=true
        }
        if(needfetch) {
                // not cached
                 var headers = {
                 "X-Forwarded-For": userip,
                 "X-Real-IP": userip,
                  }
                const response = await fetch("https://nichtderuwe.nichtderuwe.workers.dev"+req.originalUrl, { method: 'GET', headers: headers, cache: 'no-store'});
                if(response.headers.get('set-cookie')!=null) { 
                    res.set('set-cookie',response.headers.get('set-cookie').replace("nichtderuwe.nichtderuwe.workers.dev",req.headers.host)) 
                 }
                if(response.status==200) {
                     
                   // res.on('finish', () => {
                   //    console.log("saving cache in background")
                   //    
                   // })
                }
                let saveres={ct: response.headers.get('content-type') ,content: utoa(await response.clone().text())}
                await fs.writeFile(cacheFile, await JSON.stringify(saveres), (err) => err && console.log("cache_save_ERR: "+err) );
                if (await fileExists(cacheFile)) { console.log("cache saved") }
                res.status(response.status)
                res.contentType(response.headers.get('content-type'));
                const buffer = Buffer.from(await response.arrayBuffer());
                res.end(buffer, 'binary')
                }
    } catch (error) {
        console.log("got err: "+error)
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


//const PORT = process.env.PORT || 3000;
//app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
app.listen(process.env.PORT || 3000)