const express = require('express');
const app = express();

app.get('/', async (request, response) => {
    response.send("Success");
})

app.listen(3000, () => console.log("Server Running at http://localhost:3000/"));