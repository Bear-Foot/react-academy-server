const Express = require('express')
const bb = require('express-busboy')
const cors = require('cors')

const app = new Express()
bb.extend(app, { upload: true })
app.use(cors())
app.post('/upload', (req, res) => {
  const delay = Math.floor(500 + Math.random() * 1000)
  const error = Math.random() < 0.3
  if (!req.files.file) {
    return res.status(400).send({ message: 'No files were uploaded. You must send a form data with a "file" field.' })
  }
  setTimeout(() => {
    if (error) {
      return res.status(500).send({ message: 'A wild error appears' })
    }
    return res.status(200).send()
  }, delay)
})
app.listen(8000, () => console.log('Server up'))
