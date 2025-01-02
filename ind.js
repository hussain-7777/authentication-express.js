const express = require('express');
const app = express();
app.use(express.json());
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const dbPath = path.join(__dirname, 'goodreads.db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { request } = require('http');
const { error } = require('console');

let db = null;
const initializeDBAndServer =  async () => {
    try {
        db = open({
            filename: dbPath,
            driver: sqlite3.Database,
        })
        app.listen(3000, () => 
            console.log("Server Running at http://localhost:3000/"))
    } catch (error) {
        console.log(`DB Error: ${error.message}`);
        process.exit(-1);
    }
}

initializeDBAndServer();

// app.get('/', async (req, res) => {
//     res.send('Assalamu Alaikum..')
// })

// const authenticateToken = async (req, res, next) => {
//     let jwtToken;
//     const authHeader = request.headers["authorization"];
//     jwtToken = authHeader.split(' ')[1];
//     if (jwtToken === undefined) {
//         res.send("Invalid Token");
//     } else {
//         jwt.verify(jwtToken, 'MY_SECRET_CODE', async (error, payload) => {
//             if (error) {
//                 res.send("Invalid Token");
//             } else {
//                 req.username = payload.username;
//                 next();
//             }
//         })
//     }
// }

app.get('/books/', async (request, response) => {
    const getBooksQuery = `select * from book ;`;
    const booksdb = await db.all(getBooksQuery);
    response.send(booksdb);
})