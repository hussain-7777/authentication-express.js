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
const { create } = require('domain');

let db = null;
const initializeDBAndServer = async () => {
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

const authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    jwtToken = authHeader.split(' ')[1];
    if (jwtToken === undefined) {
        response.send("Invalid Token");
    } else {
        jwt.verify(jwtToken, 'MY_SECRET_CODE', async (error, payload) => {
            if (error) {
                response.send("Invalid Token");
            } else {
                request.username = payload.username;
                next();
            }
        })
    }
}

app.post('/users/', authenticateToken, async (request, response) => {
    const { username, name, password, gender, location } = request.body;
    const getUserQuery = `select * from user where username='${username}';`;
    const user = await db.get(getUserQuery);
    if (user === undefined) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const createUserQuery = `insert into user (username, name, 
        password, gender, location) values ('${username}', '${name}',
        '${hashedPassword}', '${gender}', '${location}');`;
        const newUser = await db.run(createUserQuery);
        response.send(`New User Created with Id: ${newUser.LastId}`)
    } else {
        response.send("User already exists")
    }
})

app.post('/login/', async (request, response) => {
    const { username, password } = request.body;
    const selectUserQuery = `select * from user where username='${username}';`
    const userDetails = await db.get(selectUserQuery);
    if (userDetails === undefined) {
        response.send("Invalid User");
    } else {
        const isPasswordMatched = await bcrypt.compare(password, userDetails.password);
        if (isPasswordMatched) {
            const payload = { username }
            const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN');
            response.send({ jwtToken })
        } else {
            response.send("Invalid Password");
        }
    }
})

app.get('/books/', authenticateToken, async (request, response) => {
    const getBooksQuery = `select * from book;`;
    const booksdb = await db.all(getBooksQuery);
    response.send(booksdb);
})