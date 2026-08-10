# Como adicionar os hinos

Cada hino é uma pasta com o **número do hino**, contendo uma ou mais imagens
(as páginas da letra/cifra, na ordem em que devem aparecer).

```
assets/hymns/
  1/
    1.jpg
    2.jpg        <- hino com 2 páginas
  2/
    1.jpg        <- hino com 1 página só
  15/
    1.png
```

Regras:

- O nome da pasta deve ser só o número do hino (`1`, `2`, `15`, `640`...).
- Dentro da pasta, nomeie as páginas com números em ordem: `1.jpg`, `2.jpg`, `3.jpg`...
- Formatos aceitos: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Para dar um título ao hino (em vez de só "Hino nº 15"), edite `data/titles.json`
  na raiz do projeto e adicione `"15": "Nome do Hino"`.

Depois de adicionar/alterar imagens, rode `npm start` (ou `npm run gerar-hinos`)
para que o app regenere a lista de hinos automaticamente.
