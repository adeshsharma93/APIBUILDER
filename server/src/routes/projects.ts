import { Router } from 'express';
import { getMysqlPool } from '../config/mysqlDatabase';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/projects - List all projects (optionally filtered by user)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const pool = await getMysqlPool();
    
    let query = `
      SELECT p.*, u.username as owner_name 
      FROM projects p 
      JOIN users u ON p.owner_id = u.id 
      ORDER BY p.created_at DESC
    `;
    const params: any[] = [];

    if (userId) {
      query = `
        SELECT p.*, u.username as owner_name 
        FROM projects p 
        JOIN users u ON p.owner_id = u.id 
        LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
        WHERE p.owner_id = ? OR pm.user_id = ?
        ORDER BY p.created_at DESC
      `;
      params.push(userId, userId, userId);
    }

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Get single project with members
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getMysqlPool();

    const [projectRows] = await pool.query(
      'SELECT p.*, u.username as owner_name FROM projects p JOIN users u ON p.owner_id = u.id WHERE p.id = ?',
      [id]
    );

    if ((projectRows as any[]).length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const [memberRows] = await pool.query(
      `SELECT pm.*, u.username, u.email, u.role as user_role 
       FROM project_members pm 
       JOIN users u ON pm.user_id = u.id 
       WHERE pm.project_id = ?`,
      [id]
    );

    res.json({ 
      success: true, 
      data: { 
        ...(projectRows as any[])[0], 
        members: memberRows 
      } 
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
});

// POST /api/projects - Create a new project
router.post('/', async (req, res) => {
  try {
    const { name, description, ownerId } = req.body;

    if (!name || !ownerId) {
      return res.status(400).json({ success: false, error: 'Project name and owner ID are required' });
    }

    const pool = await getMysqlPool();
    
    // Verify owner exists
    const [ownerCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [ownerId]);
    if ((ownerCheck as any[]).length === 0) {
      return res.status(400).json({ success: false, error: 'Owner user not found' });
    }

    const id = uuidv4();

    await pool.query(
      'INSERT INTO projects (id, name, description, owner_id) VALUES (?, ?, ?, ?)',
      [id, name, description || null, ownerId]
    );

    // Add owner as admin member automatically
    const memberId = uuidv4();
    await pool.query(
      'INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)',
      [memberId, id, ownerId, 'admin']
    );

    res.status(201).json({ 
      success: true, 
      message: 'Project created successfully',
      data: { id, name, description, ownerId }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const pool = await getMysqlPool();
    const [result] = await pool.query(
      'UPDATE projects SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
});

// POST /api/projects/:id/members - Add member to project
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role = 'developer' } = req.body;

    if (!userId || !['admin', 'developer', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, error: 'User ID and valid role are required' });
    }

    const pool = await getMysqlPool();

    // Check if member already exists
    const [existing] = await pool.query(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [id, userId]
    );

    if ((existing as any[]).length > 0) {
      return res.status(400).json({ success: false, error: 'User is already a member of this project' });
    }

    const memberId = uuidv4();
    await pool.query(
      'INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)',
      [memberId, id, userId, role]
    );

    res.status(201).json({ success: true, message: 'Member added successfully' });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ success: false, error: 'Failed to add member' });
  }
});

// PUT /api/projects/:projectId/members/:userId - Update member role
router.put('/:projectId/members/:userId', async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'developer', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const pool = await getMysqlPool();
    const [result] = await pool.query(
      'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?',
      [role, projectId, userId]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    res.json({ success: true, message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ success: false, error: 'Failed to update member role' });
  }
});

// DELETE /api/projects/:projectId/members/:userId - Remove member from project
router.delete('/:projectId/members/:userId', async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const pool = await getMysqlPool();

    const [result] = await pool.query(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ success: false, error: 'Failed to remove member' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getMysqlPool();
    
    const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
});

export default router;
