const Express = require('express')
const bb = require('express-busboy')
const bodyParser = require('body-parser')
const cors = require('cors')
const io = require('socket.io')(9000);
const jwt = require('express-jwt')
const app = new Express()
const jwtMaker = require('jsonwebtoken')

app.use(cors())

app.use(bodyParser.urlencoded({
  extended: true,
}))

app.use(bodyParser.json())


app.post('/login', (req, res) => {
  if (!req.body.password) {
    return res.status(400).send('Missing password')
  }
  if (!req.body.username) {
    return res.status(400).send('Missing username')
  }
  const user =  users.find(user => {
    return user.password === req.body.password && user.username === req.body.username
  })
  if (!user) {
    return res.status(401).send('No user matched those credentials')
  }

  const token = jwtMaker.sign({ username: user.username }, 'plouf', { expiresIn: 20 })
  res.status(200).send({ token })
})

app.get('/user', jwt({
    secret: 'plouf',
  }),
  (req, res) => {
    return res.send({ username: req.user.username })
  }
)

const connections = {}

io.on('connection', socket => {
  const id = socket.id
  connections[id] = socket
  socket.emit('id', id)
  console.log('Someone connected with id', id);

  socket.on('uploadStart', ({ id, uploadID }) => {
    filesUploading[id + uploadID] = {
      uploadID, progress: 0, status: 'ongoing', ownerID: id,
    }
    console.log('receving', filesUploading[id + uploadID])
    updateFileStatus(id + uploadID)
  })

  // socket.on('uploadStop', ({ id, uploadID }) => {
  //   if (filesUploading[id + uploadID].status === 'ongoing') {
  //     filesUploading[id + uploadID] = {
  //       ...filesUploading[id + uploadID], status: 'canceled',
  //     }
  //     console.log('receving', filesUploading[id + uploadID])
  //   }
  // })
});

const filesUploading = {}

const updateFileStatus = (fileID) => {
  try {
    const newProgress = filesUploading[fileID].progress + Math.floor(Math.random() * 20)
    const realProgress = newProgress >= 100 ? 100 : newProgress
    const upload = filesUploading[fileID]
    const conn = connections[upload.ownerID]
    const error = Math.random() < 0.05
  
    upload.progress = realProgress
    if (upload.status === 'canceled') {
      console.log('Upload cancel by client');
    }
    else if (realProgress === 100) {
      console.log('Emitting End');
      upload.status = 'done'
      conn.emit('end', { uploadID: upload.uploadID })
    }
    else if (error) {
      upload.status = 'error'
      console.log('Emitting Error');
      conn.emit('errors', { uploadID: upload.uploadID })
    }
    else if (upload.status === 'ongoing') {
      const delay = Math.floor(Math.random() * 300) + 200
      console.log('emitting progress')
      conn.emit('progress', { uploadID: upload.uploadID, progress: upload.progress })
      setTimeout(() => updateFileStatus(fileID), delay)
    }
  } catch (e) {
    console.log('error', e)
  }
}


const users = [
  { username: 'Brahim', password: '1' },
  { username: 'Franklin', password: '2' },
  { username: 'Marc', password: '3' },
  { username: 'Anthony', password: '4' },
  { username: 'Wilfried', password: '5' },
]



// app.post('/upload', (req, res) => {
//   const delay = Math.floor(500 + Math.random() * 1000)
//   const error = Math.random() < 0.3
//   if (!req.files.file) {
//     return res.status(400).send({ message: 'No files were uploaded. You must send a form data with a "file" field.' })
//   }
//   setTimeout(() => {
//     if (error) {
//       return res.status(500).send({ message: 'A wild error appears' })
//     }
//     return res.status(200).send()
//   }, delay)
// })
app.listen(8000, () => console.log('Server up'))
