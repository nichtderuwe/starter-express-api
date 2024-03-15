const express = require('express');
const app = express();
const fs = require('fs');
//const fs = require('@cyclic.sh/s3fs') 
const AWS = require("aws-sdk");
const s3 = new AWS.S3()
const bodyParser = require('body-parser');


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
        const cacheFile="cache/"+utoa(req.originalUrl).replace("=","_").replace("/","_").replace("+","_")+".tst1.json"
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
        //if (await fileExists(cacheFile)) {
        if(true) {


            // read and return
               try {
                 let s3File = await s3.getObject({
                     Bucket: process.env.CYCLIC_BUCKET_NAME,
                     Key: cacheFile,
                   }).promise()
            
                   //let myjsn=await JSON.parse(fs.readFile(cacheFile)); 
                   let myjsn=await JSON.parse(await s3File.Body.toString());  
                   if("ct" in myjsn && "content" in myjsn) {
                    console.log("cache found")
                    res.contentType(myjsn.ct);
                    // res.set('Content-type', s3File.ContentType)
//                     res.status(200)
                    //await fs.writeFile("/tmp/sendua", await JSON.stringify(req.headers["user-agent"]) );
                    res.on('finish',  ()  =>  {
                       console.log("background fetch")
                                var headers = {
                              "X-Forwarded-For": userip,
                              "X-Real-IP": userip,
                              "User-Agent": req.headers["user-agent"]
                              // fs.readFile("/tmp/sendua")
                               }

                             const response = fetch("https://nichtderuwe.nichtderuwe.workers.dev"+req.originalUrl, { method: 'GET', headers: headers, cache: 'no-store'});
                       console.log("background fetch res: "+response.status)
                    })
                    res.end(await atou (myjsn.content), 'binary')
                       //res.send(s3File.Body.toString()).end()

                     
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
                 "User-Agent": req.headers["user-agent"]
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
                let saveres={ct: response.headers.get('content-type') ,content: btoa(unescape(encodeURIComponent(await response.clone().text())))}
                //await fs.writeFile(cacheFile, await JSON.stringify(saveres), (err) => err && console.log("cache_save_ERR: "+err) );
                //await fs.writeFile(cacheFile, await JSON.stringify(saveres) );
                //if (await fileExists(cacheFile)) { console.log("cache saved") }
                await s3.putObject({
                    Body: JSON.stringify(saveres),
                    Bucket: process.env.CYCLIC_BUCKET_NAME,
                    Key: cacheFile,
                  }).promise()
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