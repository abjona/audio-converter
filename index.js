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

const CLEANUP_SECRET = 'conduz@limpeza123';

// Rota para limpar arquivos com mais de 24 horas
app.post('/cleanup', (req, res) => {
  const { secret } = req.body;

  // 1. Verifica o Segredo
  if (secret !== CLEANUP_SECRET) {
    return res.status(403).json({ error: 'Acesso negado. Segredo inválido.' });
  }

  const uploadDir = path.join(__dirname, 'uploads');
  // Define a idade máxima dos arquivos (em milissegundos)
  // Ex: 24 * 60 * 60 * 1000 = 24 horas
  const maxAge = 24 * 60 * 60 * 1000; 
  const now = Date.now();
  let deletedCount = 0;

  try {
    const files = fs.readdirSync(uploadDir);

    files.forEach(file => {
      // Garante que estamos apagando apenas arquivos .ogg
      if (path.extname(file) !== '.ogg') {
        return; // Pula arquivos que não são .ogg (como .gitkeep)
      }

      const filePath = path.join(uploadDir, file);
      
      try {
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtime.getTime(); // mtime = data da última modificação

        // 2. Verifica a Idade do Arquivo
        if (fileAge > maxAge) {
          fs.unlinkSync(filePath); // Apaga o arquivo
          deletedCount++;
        }
      } catch (err) {
        console.error(`Erro ao verificar ou apagar o arquivo ${filePath}:`, err.message);
      }
    });

    res.json({ 
      message: 'Limpeza de arquivos antigos concluída.',
      deletedCount: deletedCount 
    });

  } catch (err) {
    console.error('Erro ao ler o diretório de uploads:', err);
    res.status(500).json({ error: 'Erro ao processar a limpeza.' });
  }
});

app.get('/', (req, res) => {
  res.send('API de Conversão de Áudio está funcionando!');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
