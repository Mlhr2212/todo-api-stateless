const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Set up SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'todos.db'), (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create the table if it doesn’t exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      priority TEXT DEFAULT 'low',
      isComplete BOOLEAN DEFAULT 0,
      isFun BOOLEAN DEFAULT 0
    )
  `);
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// GET all todos
app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos', (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// GET todo by ID
app.get('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (row) res.json(row);
    else res.status(404).json({ message: 'Todo item not found' });
  });
});

// POST new todo
app.post('/todos', (req, res) => {
  const { name, priority = 'low', isFun = 0 } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  db.run(
    'INSERT INTO todos (name, priority, isComplete, isFun) VALUES (?, ?, ?, ?)',
    [name, priority, 0, isFun],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({
        id: this.lastID,
        name,
        priority,
        isComplete: 0,
        isFun
      });
    }
  );
});

// DELETE todo by ID
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.run('DELETE FROM todos WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Todo item not found' });
    res.json({ message: `Todo item ${id} deleted.` });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Todo API server running at http://localhost:${port}`);
});
