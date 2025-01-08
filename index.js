const express = require('express')
const path = require('path')
const { open } = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { request } = require('http')

const dbPath = path.join(__dirname, 'goodreads.db')
const app = express()

app.use(express.json())

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(-1)
  }
}
initializeDBAndServer()

const authenticateToken = (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  jwtToken = authHeader.split(' ')[1]
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid Access Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid Access Token')
      } else {
        request.username = payload.username
        console.log(payload)
        next()
      }
    })
  }
}

//Get Books API
app.get('/books/', authenticateToken, async (request, response) => {
  const getBooksQuery = `
            SELECT
              *
            FROM
             book
            ORDER BY
             book_id`
  const booksArray = await db.all(getBooksQuery)
  response.send(booksArray)
})

//Get Book API
app.get('/books/:bookId/', authenticateToken, async (request, response) => {
  const { bookId } = request.params
  const getBookQuery = `
      SELECT 
       *
      FROM
       book 
      WHERE
       book_id = ${bookId}
    `
  const book = await db.get(getBookQuery)
  response.send(book)
})

//User Register API
app.post('/users/', async (request, response) => {
  const { username, name, password, gender, location } = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES  
        (
          '${username}',    
          '${name}',   
          '${hashedPassword}',  
          '${gender}',
          '${location}' 
        );`
    await db.run(createUserQuery)
    response.send(`User created successfully`)
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// Delete User 
app.delete('/users/', authenticateToken, async (request, response) => {
  const { username } = request.body
  const deleteUserQuery = `delete from user where username='${username}'`
  const deletedUser = await db.run(deleteUserQuery)
  if (deletedUser) {
    response.send(`User: ${username} deleted`)
  } else {
    response.send(`User not exists: ${username}`)
  }
})

//User Login API
app.post('/login/', async (request, response) => {
  const { username, password } = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      } // here we can also write just const payload = {username}
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({ jwtToken }) // here we wrote {jwtToken} instead of {jwtToken: jwtToken} as both are equal
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})

//Get Profile
app.get('/profile/', authenticateToken, async (request, response) => {
  const { username } = request
  const selectUserQuery = `select * from user where username='${username}';`
  const userDetails = await db.get(selectUserQuery)
  if (userDetails !== undefined) {
    response.send(userDetails)
  }
})
