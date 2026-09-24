import { Router } from 'express';
import { getMysqlPool } from '../config/mysqlDatabase';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Self-healing: if the live DB was created with the old schema
// (mysql/001_initial_schema.sql uses `name`, not `username`), add the
// `username` column and backfill it so the canonical queries work.
// See server/migrations/mysql/003_add_username_to_users.sql for the full migration.
async function ensureUsernameColumn(pool: any): Promise<void> {
  try {
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username'`
    );
    if ((cols as any[]).length > 0) return;

    console.log('⚠ users.username missing – applying automatic schema fix (see migrations/mysql/003_add_username_to_users.sql)');
    await pool.query("ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL AFTER id");

    // Backfill from legacy `name` column when it exists, else from the email local-part.
    let backfilled = false;
    try {
      await pool.query(
        "UPDATE users SET username = LOWER(REPLACE(`name`, ' ', '_')) WHERE username IS NULL OR username = ''"
      );
      backfilled = true;
    } catch {
      /* no `name` column – fall through to email-based backfill */
    }
    await pool.query(
      "UPDATE users SET username = LOWER(SUBSTRING_INDEX(email, '@', 1)) WHERE username IS NULL OR username = ''"
    );
    // De-duplicate collisions before enforcing uniqueness.
    await pool.query(
      `UPDATE users u
         JOIN (
           SELECT username AS uname, MIN(id) AS keep_id FROM users GROUP BY username HAVING COUNT(*) > 1
         ) dup ON u.username = dup.uname AND u.id <> dup.keep_id
        SET u.username = CONCAT(u.username, '_', LEFT(u.id, 8))`
    );
    await pool.query(
      'ALTER TABLE users MODIFY COLUMN username VARCHAR(50) NOT NULL, ADD UNIQUE KEY idx_users_username (username)'
    );
    console.log(`✅ Added users.username column${backfilled ? ' (backfilled from name/email)' : ' (backfilled from email)'}`);
  } catch (err: any) {
    // ER_BAD_FIELD_ERROR on `name`, permissions, etc. – surface but don't crash the request path here.
    console.error('ensureUsernameColumn failed:', err?.sqlMessage || err);
  }
}

// GET /api/users - List all users
router.get('/', async (req, res) => {
  try {
    const pool = await getMysqlPool();
    await ensureUsernameColumn(pool);
    const [rows] = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
  try {
    const { username, email, password, role = 'developer' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Username, email, and password are required' });
    }

    const pool = await getMysqlPool();
    await ensureUsernameColumn(pool);
    
    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if ((existing as any[]).length > 0) {
      return res.status(400).json({ success: false, error: 'User with this email or username already exists' });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [id, username, email, passwordHash, role]
    );

    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      data: { id, username, email, role }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// PUT /api/users/:id/role - Update user role
router.put('/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'developer', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const pool = await getMysqlPool();
    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
});

// DELETE /api/users/:id - Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getMysqlPool();
    
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

export default router;
