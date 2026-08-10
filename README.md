# Harpa com Cifra

App mobile (Expo / React Native) para visualizar hinos com letra e cifra em
formato de imagem, com busca, favoritos e zoom.

## Stack

- Expo + React Native (TypeScript)
- React Navigation (native-stack)
- AsyncStorage (favoritos)
- react-native-gesture-handler + react-native-reanimated (pinch-to-zoom)

## Como rodar

```bash
npm install
npm start
```

Isso abre o Expo Dev Tools. Escaneie o QR code com o app **Expo Go**
(Android/iOS) para testar no celular, ou pressione `a`/`i`/`w` no terminal
para abrir no emulador Android, simulador iOS ou navegador.

## Como adicionar os hinos

O app **não baixa cifras da internet automaticamente** — não existe uma API
pública para isso (veja nota abaixo). Você mesmo adiciona as imagens:

1. Coloque as imagens em `assets/hymns/<número>/<página>.jpg`, por exemplo:

   ```
   assets/hymns/1/1.jpg
   assets/hymns/1/2.jpg   <- hino 1 com 2 páginas
   assets/hymns/2/1.jpg   <- hino 2 com 1 página
   ```

2. (Opcional) defina o título de cada hino em `data/titles.json`:

   ```json
   { "1": "Chuvas de Graça", "2": "Bendize, Ó Minh'Alma" }
   ```

   Sem título definido, o app mostra "Hino nº N".

3. Rode `npm start` (ou `npm run gerar-hinos`) — a lista de hinos do app é
   regenerada automaticamente a partir das pastas em `assets/hymns/`.

Mais detalhes em [`assets/hymns/README.md`](assets/hymns/README.md).

### Por que não tem download automático de cifras?

Não existe uma API oficial e gratuita com imagens de cifra da Harpa Cristã.
Sites como CifraClub têm as cifras, mas apenas como páginas HTML (não
imagens prontas) e sem API pública — fazer scraping delas violaria os
termos de uso e possivelmente direitos autorais do arranjo de cifra. Por
isso o app foi desenhado para você importar suas próprias imagens (fotos,
scans de um cifrário que você tenha, ou capturas de tela).

## Estrutura

```
assets/hymns/<número>/     imagens de cada hino (você adiciona)
data/titles.json           título de cada hino (você edita)
scripts/generate-manifest.js  gera src/data/hymnManifest.ts a partir dos itens acima
src/screens/HomeScreen.tsx    lista + busca + favoritos
src/screens/HymnScreen.tsx    visualizador de imagem com zoom e paginação
src/context/FavoritesContext.tsx
src/storage/favorites.ts      persistência dos favoritos (AsyncStorage)
```
