// Este script é apenas para referência e deve ser executado localmente
// Requer Node.js com as bibliotecas sharp e fs

const fs = require("fs")
const sharp = require("sharp")

const svgBuffer = fs.readFileSync("./public/icons/icon-source.svg")

// Gerar ícone 192x192
sharp(svgBuffer)
  .resize(192, 192)
  .toFile("./public/icons/icon-192x192.png", (err) => {
    if (err) {
      console.error("Erro ao gerar ícone 192x192:", err)
    } else {
      console.log("Ícone 192x192 gerado com sucesso!")
    }
  })

// Gerar ícone 512x512
sharp(svgBuffer)
  .resize(512, 512)
  .toFile("./public/icons/icon-512x512.png", (err) => {
    if (err) {
      console.error("Erro ao gerar ícone 512x512:", err)
    } else {
      console.log("Ícone 512x512 gerado com sucesso!")
    }
  })

