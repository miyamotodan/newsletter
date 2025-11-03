const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Errore connessione database:', err);
  } else {
    console.log('Connesso al database SQLite');
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('Errore abilitazione foreign keys:', err);
      } else {
        console.log('Foreign keys abilitate');
      }
    });
    initDatabase();
  }
});

// Inizializza il database
function initDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS newsletters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    header_logo TEXT,
    hero_title TEXT,
    hero_subtitle TEXT,
    hero_image TEXT,
	footer_text TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    newsletter_id INTEGER,
    position INTEGER,
    layout TEXT DEFAULT 'double',
    title TEXT,
    content TEXT,
    image TEXT,
    title2 TEXT,
    content2 TEXT,
    image2 TEXT,
    FOREIGN KEY (newsletter_id) REFERENCES newsletters(id) ON DELETE CASCADE
  )`);

  // Migrazione per aggiungere la colonna footer_text se non esiste
  db.all("PRAGMA table_info(newsletters)", (err, columns) => {
    if (err) {
      console.error('Errore verifica struttura tabella:', err);
      return;
    }

    const hasFooterText = columns.some(col => col.name === 'footer_text');
    if (!hasFooterText) {
      db.run('ALTER TABLE newsletters ADD COLUMN footer_text TEXT', (err) => {
        if (err) {
          console.error('Errore aggiunta colonna footer_text:', err);
        } else {
          console.log('Colonna footer_text aggiunta alla tabella newsletters');
        }
      });
    }
  });
}

// API Routes

// GET - Lista tutte le newsletter
app.get('/api/newsletters', (req, res) => {
  console.log('📋 GET /api/newsletters - Richiesta lista newsletter');
  const sql = 'SELECT * FROM newsletters ORDER BY updated_at DESC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('❌ Errore recupero newsletter:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`✅ Trovate ${rows.length} newsletter`);
    console.log('Newsletter:', rows.map(r => ({ id: r.id, title: r.title, status: r.status })));
    res.json(rows);
  });
});

// GET - Dettaglio newsletter con posts
app.get('/api/newsletters/:id', (req, res) => {
  const { id } = req.params;
  console.log(`📖 GET /api/newsletters/${id} - Richiesta dettaglio newsletter`);

  db.get('SELECT * FROM newsletters WHERE id = ?', [id], (err, newsletter) => {
    if (err) {
      console.error('❌ Errore recupero newsletter:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    if (!newsletter) {
      console.log('⚠️ Newsletter non trovata con ID:', id);
      res.status(404).json({ error: 'Newsletter non trovata' });
      return;
    }

    console.log('✅ Newsletter trovata:', { id: newsletter.id, title: newsletter.title });

    db.all('SELECT * FROM posts WHERE newsletter_id = ? ORDER BY position', [id], (err, posts) => {
      if (err) {
        console.error('❌ Errore recupero posts:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log(`✅ Trovati ${posts.length} post per la newsletter ${id}`);
      newsletter.posts = posts;
      res.json(newsletter);
    });
  });
});

// POST - Crea nuova newsletter
app.post('/api/newsletters', (req, res) => {
  console.log('📝 POST /api/newsletters - Richiesta ricevuta');
  console.log('Body ricevuto:', req.body);

  const { title } = req.body;
  console.log('Titolo estratto:', title);

  const sql = 'INSERT INTO newsletters (title, footer_text) VALUES (?, ?)';
  console.log('SQL da eseguire:', sql);
  const defaultFooter = '';
  console.log('Parametri:', [title, defaultFooter]);

  db.run(sql, [title, defaultFooter], function(err) {
    if (err) {
      console.error('❌ Errore inserimento newsletter:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('✅ Newsletter creata con successo! ID:', this.lastID);
    const response = { id: this.lastID, title, status: 'draft' };
    console.log('Risposta inviata al client:', response);
    res.json(response);
  });
});

// PUT - Aggiorna newsletter
app.put('/api/newsletters/:id', (req, res) => {
  const { id } = req.params;
  console.log(`✏️ PUT /api/newsletters/${id} - Richiesta aggiornamento`);
  console.log('Body ricevuto:', req.body);

  const { title, status, header_logo, hero_title, hero_subtitle, hero_image, footer_text } = req.body;

  let sql = 'UPDATE newsletters SET title = ?, header_logo = ?, hero_title = ?, hero_subtitle = ?, hero_image = ?, footer_text = ?, updated_at = CURRENT_TIMESTAMP';
  let params = [title, header_logo, hero_title, hero_subtitle, hero_image, footer_text];

  console.log('Valori estratti:', { title, status, header_logo: header_logo ? 'presente' : 'null', hero_title, hero_subtitle, hero_image: hero_image ? 'presente' : 'null' });

  if (status) {
    sql += ', status = ?';
    params.push(status);

    if (status === 'published') {
      sql += ', published_at = CURRENT_TIMESTAMP';
    } else if (status === 'draft') {
      sql += ', published_at = NULL';
    }
  }

  sql += ' WHERE id = ?';
  params.push(id);

  console.log('SQL:', sql);
  console.log('Numero parametri:', params.length);

  db.run(sql, params, function(err) {
    if (err) {
      console.error('❌ Errore aggiornamento newsletter:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`✅ Newsletter ${id} aggiornata! Righe modificate:`, this.changes);
    res.json({ message: 'Newsletter aggiornata', changes: this.changes });
  });
});

// POST - Duplica newsletter
app.post('/api/newsletters/:id/duplicate', (req, res) => {
  const { id } = req.params;
  console.log(`📋 POST /api/newsletters/${id}/duplicate - Richiesta duplicazione`);

  // Get original newsletter
  db.get('SELECT * FROM newsletters WHERE id = ?', [id], (err, newsletter) => {
    if (err) {
      console.error('❌ Errore recupero newsletter da duplicare:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    if (!newsletter) {
      console.log('⚠️ Newsletter non trovata con ID:', id);
      res.status(404).json({ error: 'Newsletter non trovata' });
      return;
    }

    // Create duplicate newsletter with "(Copia)" suffix
    const newTitle = `${newsletter.title} (Copia)`;
    const insertSql = 'INSERT INTO newsletters (title, status, header_logo, hero_title, hero_subtitle, hero_image, footer_text) VALUES (?, ?, ?, ?, ?, ?, ?)';

    db.run(insertSql, [newTitle, 'draft', newsletter.header_logo, newsletter.hero_title, newsletter.hero_subtitle, newsletter.hero_image, newsletter.footer_text], function(err) {
      if (err) {
        console.error('❌ Errore creazione newsletter duplicata:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }

      const newNewsletterId = this.lastID;
      console.log(`✅ Newsletter duplicata creata con ID: ${newNewsletterId}`);

      // Get all posts from original newsletter
      db.all('SELECT * FROM posts WHERE newsletter_id = ? ORDER BY position', [id], (err, posts) => {
        if (err) {
          console.error('❌ Errore recupero posts da duplicare:', err.message);
          res.status(500).json({ error: err.message });
          return;
        }

        console.log(`📝 Duplicazione di ${posts.length} post...`);

        // Duplicate all posts
        if (posts.length === 0) {
          console.log('✅ Duplicazione completata (nessun post da copiare)');
          res.json({ id: newNewsletterId, title: newTitle, status: 'draft' });
          return;
        }

        let completed = 0;
        let hasError = false;

        posts.forEach(post => {
          const postSql = 'INSERT INTO posts (newsletter_id, position, layout, title, content, image, title2, content2, image2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

          db.run(postSql, [newNewsletterId, post.position, post.layout, post.title, post.content, post.image, post.title2, post.content2, post.image2], function(err) {
            if (err && !hasError) {
              hasError = true;
              console.error('❌ Errore duplicazione post:', err.message);
              res.status(500).json({ error: err.message });
              return;
            }

            completed++;
            if (completed === posts.length && !hasError) {
              console.log(`✅ Duplicazione completata! ${posts.length} post copiati`);
              res.json({ id: newNewsletterId, title: newTitle, status: 'draft' });
            }
          });
        });
      });
    });
  });
});

// DELETE - Elimina newsletter
app.delete('/api/newsletters/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM newsletters WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Newsletter eliminata', changes: this.changes });
  });
});

// POST - Aggiungi post a newsletter
app.post('/api/newsletters/:id/posts', (req, res) => {
  const { id } = req.params;
  const { layout, title, content, image, title2, content2, image2, position } = req.body;

  const sql = 'INSERT INTO posts (newsletter_id, layout, title, content, image, title2, content2, image2, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

  db.run(sql, [id, layout, title, content, image, title2, content2, image2, position], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      newsletter_id: id,
      layout,
      title,
      content,
      image,
      title2,
      content2,
      image2,
      position
    });
  });
});

// PUT - Aggiorna post
app.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const { layout, title, content, image, title2, content2, image2, position } = req.body;

  const sql = 'UPDATE posts SET layout = ?, title = ?, content = ?, image = ?, title2 = ?, content2 = ?, image2 = ?, position = ? WHERE id = ?';

  db.run(sql, [layout, title, content, image, title2, content2, image2, position, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Post aggiornato', changes: this.changes });
  });
});

// DELETE - Elimina post
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM posts WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Post eliminato', changes: this.changes });
  });
});

// POST - Converti immagine in base64
app.post('/api/image-to-base64', (req, res) => {
  const { imageData } = req.body;
  // Il frontend invia già l'immagine come base64, quindi la restituiamo
  res.json({ base64: imageData });
});

// POST - Export HTML
app.post('/api/export', (req, res) => {
  const { html } = req.body;

  fs.writeFile('export.html', html, (err) => {
    if (err) {
      console.error('Errore salvataggio file HTML:', err);
      res.status(500).json({ error: 'Errore salvataggio file HTML' });
      return;
    }
    console.log('File export.html salvato con successo');
    res.json({ message: 'File HTML esportato con successo' });
  });
});

app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
  console.log(`Apri http://localhost:${PORT} per usare l'editor`);
});

// Gestione chiusura graceful
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database chiuso');
    process.exit(0);
  });
});
