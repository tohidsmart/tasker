import express from 'express';
import dotenv from 'dotenv'

dotenv.config()
const app = express();

app.get('/', (_, res) => {
    const APP_NAME = process.env.APP_NAME || 'airtasker'
    res.statusCode = 200
    res.set('Content-Type', 'text/plain')
    res.send(`${APP_NAME} \n`);

});

app.get('/healthcheck', (_, res) => {
    res.statusCode = 200
    res.set('Content-Type', 'text/plain')
    res.send(`OK\n`);
})

const port = process.env.PORT || 3000


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})