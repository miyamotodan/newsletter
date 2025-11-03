# Newsletter Editor

Editor completo per creare, gestire e archiviare newsletter HTML con supporto per copia-incolla su Outlook.

## Caratteristiche

- ✅ **Header Personalizzabile**: Logo aziendale nell'header
- ✅ **Footer Personalizzabile**: testo del footer
- ✅ **Hero Section**: Titolo newsletter e sottotitolo/introduzione
- ✅ **Editor Visuale**: Interfaccia intuitiva per creare newsletter
- ✅ **Gestione Stati**: Draft e Pubblicato con toggle bidirezionale (Pubblica/Spubblica)
- ✅ **Post Doppia Colonna**: Immagine a sinistra, titolo+testo a destra
- ✅ **Coppia Post Singoli**: Due post affiancati con immagine sopra e titolo+testo sotto
- ✅ **Duplica Newsletter**: Copia completa di newsletter con tutti i post
- ✅ **Immagini Base64**: Tutte le immagini codificate per Outlook
- ✅ **Esporta HTML**: Copia-incolla diretto su Outlook una volta che hai aperto il file HTML esportto sul browser
- ✅ **Archiviazione**: Database SQLite per tutte le newsletter
- ✅ **Eliminazione Cascata**: Eliminando una newsletter vengono rimossi anche tutti i post collegati (su sqlite devono essere attivate le FK)

## Installazione

```bash
# Installa le dipendenze
npm install

# Avvia il server
npm start

# Oppure in modalità development con auto-reload
npm run dev
```

## Utilizzo

1. **Avvia l'applicazione**:
   ```bash
   npm start
   ```

2. **Apri il browser**:
   Vai su `http://localhost:3000`

3. **Crea una newsletter**:
   - Clicca su "+ Nuova Newsletter"
   - Inserisci un titolo

4. **Personalizza l'intestazione**:
   - Carica il logo aziendale nell'Header
   - Inserisci il titolo della newsletter
   - Aggiungi il sottotitolo/introduzione
   - (Opzionale) Carica un'immagine hero

5. **Aggiungi post**:
   - **Post Doppia Colonna**: Immagine a sinistra, titolo+testo a destra 
   - **Coppia Post Singoli**: Due post affiancati, ciascuno con immagine sopra e titolo+testo sotto 

6. **Gestisci la newsletter**:
   - **Salva**: Salva le modifiche mantenendo lo stato corrente
   - **Pubblica/Spubblica**: Toggle bidirezionale per cambiare lo stato (il pulsante cambia dinamicamente)
   - **Preview**: Vedi l'anteprima della newsletter
   - **Esporta HTML**: Copia l'HTML negli appunti per Outlook
   - **Duplica**: Crea una copia completa della newsletter con tutti i suoi post
   - **Elimina**: Rimuove la newsletter e tutti i post collegati

7. **Incolla su Outlook**:
   - Clicca su "Esporta HTML"
   - L'HTML viene copiato negli appunti
   - In Outlook, crea una nuova email
   - Passa alla visualizzazione HTML (Developer > HTML)
   - Incolla il contenuto
   - Torna alla visualizzazione normale

## Struttura

```
NEWSLETTER/
├── server.js           # Backend Express
├── package.json        # Dipendenze
├── database.sqlite     # Database SQLite
├── public/
│   ├── index.html     # Interfaccia principale
│   ├── styles.css     # Stili
│   └── app.js         # Logica frontend
├── template.html       # Template originale
└── README.md          # Questa guida
```

## API Endpoints

- `GET /api/newsletters` - Lista newsletter
- `GET /api/newsletters/:id` - Dettaglio newsletter con posts
- `POST /api/newsletters` - Crea nuova newsletter
- `PUT /api/newsletters/:id` - Aggiorna newsletter
- `POST /api/newsletters/:id/duplicate` - Duplica newsletter con tutti i post
- `DELETE /api/newsletters/:id` - Elimina newsletter (e tutti i post collegati in cascata)
- `POST /api/newsletters/:id/posts` - Aggiungi post a newsletter
- `PUT /api/posts/:id` - Aggiorna post
- `DELETE /api/posts/:id` - Elimina post

## Struttura Newsletter

La newsletter segue lo stesso schema del template fornito:

1. **Header**: Logo aziendale 
2. **Hero Section**:
   - Immagine hero (opzionale)
   - Titolo newsletter 
   - Sottotitolo/introduzione
3. **Post Doppia Colonna**: Immagine a sinistra (50%), titolo+testo a destra (50%)
4. **Coppia Post Singoli**: Due post affiancati, ciascuno con immagine sopra e titolo+testo sotto
5. **Footer**: Testo automatico

## Database Schema

### newsletters
- id (PRIMARY KEY)
- title (TEXT)
- status (TEXT: 'draft' | 'published')
- created_at (DATETIME) - Data creazione
- updated_at (DATETIME) - Data ultimo aggiornamento
- published_at (DATETIME) - Data pubblicazione (NULL se draft)
- header_logo (TEXT base64)
- hero_title (TEXT)
- hero_subtitle (TEXT)
- hero_image (TEXT base64)

### posts
- id (PRIMARY KEY)
- newsletter_id (FOREIGN KEY con ON DELETE CASCADE)
- position (INTEGER) - Ordine di visualizzazione
- layout (TEXT: 'double' | 'single-pair')
- title (TEXT) - Post 1 titolo
- content (TEXT) - Post 1 contenuto
- image (TEXT base64) - Post 1 immagine
- title2 (TEXT) - Post 2 titolo (solo per single-pair)
- content2 (TEXT) - Post 2 contenuto (solo per single-pair)
- image2 (TEXT base64) - Post 2 immagine (solo per single-pair)

## Note Tecniche

- Le immagini vengono automaticamente convertite in base64
- Il formato HTML generato è compatibile con Outlook
- Lo stato "draft" e "published" sono intercambiabili con un toggle
- Quando pubblichi: `status='published'` e `published_at` viene impostato
- Quando spubblichi: `status='draft'` e `published_at` torna a NULL
- Il database SQLite è locale e portatile
- Foreign keys abilitate per garantire l'eliminazione a cascata dei post
- La duplicazione crea una copia completa con titolo "(Copia)" e stato draft
- Footer personalizzato: "Ricevi questa email perché ...."

## Troubleshooting

**Problema**: Le immagini non si vedono in Outlook
- **Soluzione**: Assicurati che le immagini siano caricate correttamente e convertite in base64

**Problema**: Il server non si avvia
- **Soluzione**: Controlla che la porta 3000 sia libera o modifica la porta in `server.js`

**Problema**: Errore "Cannot find module"
- **Soluzione**: Esegui `npm install` per installare le dipendenze

## Licenza

ISC
