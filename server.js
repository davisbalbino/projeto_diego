const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir frontend
app.use(express.static("public"));
app.use(express.json());

// Configuração do multer para upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/temp"); // pasta temporária
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Upload de imagem + frase
app.post("/upload", upload.single("foto"), (req, res) => {
  const frase = req.body.frase || "";
  const file = req.file;

  if (!file) {
    return res.status(400).send("Nenhuma imagem enviada.");
  }

  // Criar pasta única para cada upload
  const pasta = path.join("uploads", Date.now().toString());
  fs.mkdirSync(pasta, { recursive: true });

  // Mover imagem para pasta
  const destinoImg = path.join(pasta, "imagem" + path.extname(file.originalname));
  fs.renameSync(file.path, destinoImg);

  // Criar arquivo de frase
  fs.writeFileSync(path.join(pasta, "frase.txt"), frase);

  res.send("Imagem e frase salvas com sucesso!");
});

// Upload só de frase
app.post("/frase", (req, res) => {
  const frase = req.body.frase;
  if (!frase) return res.status(400).send("Frase não enviada.");

  const pasta = path.join("uploads", Date.now().toString());
  fs.mkdirSync(pasta, { recursive: true });

  fs.writeFileSync(path.join(pasta, "frase.txt"), frase);

  res.send("Frase salva com sucesso!");
});

// Endpoint para listar imagens + frases
app.get("/dados", (req, res) => {
  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) return res.json([]);

  const pastas = fs.readdirSync(uploadsDir);

  const dados = pastas.map(pasta => {
    const dir = path.join(uploadsDir, pasta);
    const arquivos = fs.readdirSync(dir);
    const imagem = arquivos.find(f => f.startsWith("imagem"));
    const frase = arquivos.find(f => f.endsWith(".txt"));

    return {
      imagem: imagem ? `/uploads/${pasta}/${imagem}` : null,
      frase: frase ? fs.readFileSync(path.join(dir, frase), "utf8") : null
    };
  });

  res.json(dados);
});

// Servir uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});