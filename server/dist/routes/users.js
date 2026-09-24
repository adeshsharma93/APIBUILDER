"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysqlDatabase_1 = require("../config/mysqlDatabase");
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
// GET /api/users - List all users
router.get('/', async (req, res) => {
    try {
        const pool = await (0, mysqlDatabase_1.getMysqlPool)();
        const [rows] = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    }
    catch (error) {
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
        const pool = await (0, mysqlDatabase_1.getMysqlPool)();
        // Check if user exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'User with this email or username already exists' });
        }
        const id = (0, uuid_1.v4)();
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        await pool.query('INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', [id, username, email, passwordHash, role]);
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { id, username, email, role }
        });
    }
    catch (error) {
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
        const pool = await (0, mysqlDatabase_1.getMysqlPool)();
        const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, message: 'User role updated successfully' });
    }
    catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ success: false, error: 'Failed to update user role' });
    }
});
// DELETE /api/users/:id - Delete a user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await (0, mysqlDatabase_1.getMysqlPool)();
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map