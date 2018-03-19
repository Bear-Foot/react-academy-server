const Express = require('express')
const bb = require('express-busboy')
const cors = require('cors')
const io = require('socket.io')(9000);

const app = new Express()
bb.extend(app, { upload: true })

app.use(cors())


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
    updateFileStatus(id + uploadID)
    console.log(filesUploading[id + uploadID])
  })
});

const filesUploading = {}

const updateFileStatus = (fileID) => {
  console.log(filesUploading);
  console.log(fileID);
  const newProgress = filesUploading[fileID].progress + Math.floor(Math.random() * 50)
  const realProgress = newProgress >= 100 ? 100 : newProgress
  const upload = filesUploading[fileID]
  const conn = connections[upload.ownerID]
  const error = Math.random() < 0.2

  upload.progress = realProgress
  if (error) {
    upload.status = 'error'
    conn.emit('error', { uploadID: upload.id })
  }

  if (realProgress === 100) {
    upload.status = 'done'
    conn.emit('end', { uploadID: upload.id })
  }
  if (upload.status === 'ongoing') {
    const delay = Math.floor(Math.random() * 1000) + 500
    conn.emit('progress', { uploadID: upload.id, progress: upload.progress })
    setTimeout(() => updateFileStatus(fileID), delay)
  }
}




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
// app.listen(8000, () => console.log('Server up'))
