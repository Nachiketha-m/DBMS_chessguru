// Backend index.js

import express from 'express';
import mysql from 'mysql';
import cors from 'cors';

const app = express();
app.use(cors({
  origin: 'http://localhost:3000', // Update this with your React app URL
  credentials: true,
}));
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123',
  database: 'chessdb',
});

app.listen(8800, () => {
  console.log('Connected to Backend!');
});

app.get('/', (req, res) => {
  res.json('Hello, this is backend');
});

app.get('/prevgames', (req, res) => {
  const q = 'SELECT * from bestgamesplayed';
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.get('/bestgamesplayed', (req, res) => {
  const { player1 } = req.query;

  const query = 'SELECT player1,link FROM bestgamesplayed WHERE player1 = ?';
  db.query(query, [player1], (error, results) => {
    if (error) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/tacticstypes', (req, res) => {
  const query = 'SELECT * FROM tacticstypes';
  db.query(query, (error, results) => {
    if (error) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/tacticstype/:tactics', (req, res) => {
  const { tactic } = req.params;

  const query = 'SELECT * FROM tacticstypes where type_name=?';
  db.query(query, [tactic], (error, results) => {
    if (error) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/learnchess', (req, res) => {
  const q = 'SELECT * FROM learnchess'; // Update with your table name
  db.query(q, (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Failed to retrieve data' });
    } else {
      res.json(data);
    }
  });
});

app.post('/addgame', (req, res) => {
  const {
    match_id,
    player1,
    player2,
    avg_fide_rating,
    tournament,
    year,
    link,
    Opening_name,
  } = req.body;

  const q = 'INSERT INTO bestgamesplayed (`match_id`, `player1`, `player2`, `avg_fide_rating`, `tournament`, `year`, `link`, `Opening_name`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [
    match_id,
    player1,
    player2,
    avg_fide_rating,
    tournament,
    year,
    link,
    Opening_name,
  ];

  db.query(q, values, (err, data) => {
    if (err) return res.json(err);
    return res.json('Game added successfully!');
  });
});

// Add this route to handle admin login
app.post('/adminlogin', (req, res) => {
  const { adminid, password } = req.body;

  // Replace 'your_database_table' with the actual table name
  const query = 'SELECT * FROM adminlogin WHERE id = ? AND password = ?';
  db.query(query, [adminid, password], (error, results) => {
    if (error) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (results.length > 0) {
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    }
  });
});

app.get('/tactics/:tacticsName', (req, res) => {
  const tacticsName = req.params.tacticsName;

  const query = `
    SELECT t.link, t.puzzle_image
    FROM tactics t
    JOIN puzzles p ON t.problem_id = p.puzzle_id
    WHERE t.tactics_name = ?;
  `;

  db.query(query, [tacticsName], (error, result) => {
    if (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(result);
    }
  });
});

app.get('/puzzles/open', (req, res) => {
  const query = `
    SELECT op.link, op.image_open
    FROM openingpuzzles op
    JOIN puzzles p ON op.type_id = p.puzzle_id;
  `;

  db.query(query, (error, result) => {
    if (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(result);
    }
  });
});

app.get('/puzzles/middle', (req, res) => {
  const query = `
    SELECT mg.link, mg.image_middle
    FROM middlegamepuzzles mg
    JOIN puzzles p ON mg.type_id = p.puzzle_id;
  `;

  db.query(query, (error, result) => {
    if (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(result);
    }
  });
});

app.get('/puzzles/ending', (req, res) => {
  const query = `
    SELECT eg.link, eg.image_end
    FROM endgamepuzzles eg
    JOIN puzzles p ON eg.type_id = p.puzzle_id;
  `;

  db.query(query, (error, result) => {
    if (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(result);
    }
  });
});

app.get('/matches-count/:playerName', (req, res) => {
  const { playerName } = req.params;

  const query = `
    SELECT player1, COUNT(*) AS total_matches_played
    FROM bestgamesplayed
    WHERE player1 = ?
    GROUP BY player1;
  `;

  db.query(query, [playerName], (error, result) => {
    if (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (result.length > 0) {
        res.json(result[0]); // Assuming there will be only one result
      } else {
        res.json({ total_matches_played: 0 });
      }
    }
  });
});

app.get('/tactics/:tacticName/:position', async (req, res) => {
  const { tacticName, position } = req.params;

  const query = `
    SELECT link, puzzle_image
    FROM tactics
    WHERE tactics_id IN (
      SELECT tactics_id
      FROM tactics
      WHERE tactics_name = ? AND position = ?
    );
  `;

  db.query(query, [tacticName, position], (error, result) => {
    if (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(result);
    }
  });
});

app.delete('/deleteByMatchId/:matchId', (req, res) => {
  const { matchId } = req.params;

  const query = 'DELETE FROM bestgamesplayed WHERE match_id = ?';
  db.query(query, [matchId], (error, result) => {
    if (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    } else {
      if (result.affectedRows > 0) {
        res.json({ success: true, message: 'Record deleted successfully!' });
      } else {
        res.json({ success: false, message: 'Record not found' });
      }
    }
  });
});


app.get('/mostpopularopening', (req, res) => {
  const minRating = 2500; // Replace with your constant value

  const query = `
    CALL MostPopularOpeningAboveRating(${minRating});
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error('Error executing stored procedure:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results[0]); // Assuming the procedure returns a result set
    }
  });
});


app.post('/updateMatch', (req, res) => {
  const {
    match_id,
    player1,
    player2,
    avg_fide_rating,
    tournament,
    year,
    link,
    Opening_name,
  } = req.body;

  const q = `
    UPDATE bestgamesplayed
    SET
      player1 = ?,
      player2 = ?,
      avg_fide_rating = ?,
      tournament = ?,
      year = ?,
      link = ?,
      Opening_name = ?
    WHERE match_id = ?;
  `;

  const values = [
    player1,
    player2,
    avg_fide_rating,
    tournament,
    year,
    link,
    Opening_name,
    match_id,
  ];

  db.query(q, values, (err, data) => {
    if (err) return res.json(err);
    return res.json('Match updated successfully!');
  });
});