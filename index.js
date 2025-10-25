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

    // Lê arquivo convertido e gera Base64
    const base64Audio = fs.readFileSync(outputFile, { encoding: 'base64' });

    // Remove arquivos temporários
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);

    res.json({ base64: `data:audio/ogg;base64,${base64Audio}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao converter áudio' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
