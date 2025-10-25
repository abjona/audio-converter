const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint para converter áudio
app.post('/convert', upload.single('audio'), async (req, res) => {
  try {
    const inputFile = req.file.path;
    const outputFile = path.join('uploads', `${Date.now()}.ogg`);

    // Converte para .ogg com Opus
    await new Promise((resolve, reject) => {
      ffmpeg(inputFile)
        .outputOptions([
          '-c:a libopus',
          '-b:a 64k',
          '-ar 48000'
        ])
        .save(outputFile)
        .on('end', resolve)
        .on('error', reject);
    });

    // Remove arquivos temporários
    fs.unlinkSync(inputFile);
    // fs.unlinkSync(outputFile);

    res.json({ fileName: outputFile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao converter áudio' });
  }
});

app.get('/', (req, res) => {
  res.send('API de Conversão de Áudio está funcionando!');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
