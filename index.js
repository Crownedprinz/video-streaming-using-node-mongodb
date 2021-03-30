const express = require('express');
const app = express();
const video = require('./video');

app.use('/video', video);
const PORT = process.env.PORT|| 8000;
app.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}`);
})