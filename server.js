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
    console.log('receving', filesUploading[id + uploadID])
    updateFileStatus(id + uploadID)
  })
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
    if (error) {
      upload.status = 'error'
      console.log('Emitting Error');
      
      conn.emit('errors', { uploadID: upload.uploadID })
    }
  
    if (realProgress === 100) {
      console.log('Emitting End');
      
      upload.status = 'done'
      conn.emit('end', { uploadID: upload.uploadID })
    }
    if (upload.status === 'ongoing') {
      const delay = Math.floor(Math.random() * 300) + 200
      console.log('emitting progress')
      
      conn.emit('progress', { uploadID: upload.uploadID, progress: upload.progress })
      setTimeout(() => updateFileStatus(fileID), delay)
    }
  } catch (e) {
    console.log('error', e)
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
