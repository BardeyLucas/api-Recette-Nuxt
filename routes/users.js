const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const database = require('../config/database').getDB();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 * @body    { username, email, password, first_name?, last_name? }
 */
router.post('/register', userController.register);

/**
 * @route   POST /api/users/login
 * @desc    Login user and create session
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', userController.login);

/**
 * @route   GET /api/users
 * @desc    Get all users (for testing only)
 * @access  Public (should be admin-only in production)
 */
router.get('/', userController.getAllUsers);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * @route   POST /api/users/logout
 * @desc    Logout user and destroy session
 * @access  Private
 */
router.post('/logout', authenticate, userController.logout);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 * @body    { username?, email?, first_name?, last_name? }
 */
router.put('/profile', authenticate, userController.updateProfile);

/**
 * @route   DELETE /api/users/profile
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/profile', authenticate, userController.deleteAccount);

/**
 * @route   PUT /api/users/password
 * @desc    Update user password
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.put('/password', authenticate, userController.updatePassword);

// ============================================
// FAVORITES ROUTES
// ============================================

/**
 * @route   GET /api/users/favorites
 * @desc    Get user's favorite recipes
 * @access  Private
 */
router.get('/favorites', authenticate, userController.getFavorites);

/**
 * @route   POST /api/users/favorites/:recipeId
 * @desc    Add recipe to favorites
 * @access  Private
 */
router.post('/favorites/:recipeId', authenticate, userController.addFavorite);

/**
 * @route   DELETE /api/users/favorites/:recipeId
 * @desc    Remove recipe from favorites
 * @access  Private
 */
router.delete('/favorites/:recipeId', authenticate, userController.removeFavorite);

// ============================================
// RATINGS ROUTES
// ============================================

/**
 * @route   GET /api/users/ratings
 * @desc    Get user's ratings
 * @access  Private
 */
router.get('/ratings', authenticate, userController.getRatings);

const sql = {
    // GET queries
    getAll: `
        SELECT
            r.user_id, 
            r.username, 
            r.email, 
            r.first_name,
            r.last_name,
            r.is_admin,
            r.created_at,
            r.updated_at
        FROM Users r
    `,

    getById: `
        SELECT
            r.*
        FROM Users r
        WHERE r.user_id = ?
    `,

    // POST queries
    create: `
        INSERT INTO Users (username, email, password, first_name, last_name)
        VALUES (?, ?, ?, ?, ?)
    `,

    // PUT queries
    updateUsername: `
        UPDATE Users 
        SET username = ? 
        WHERE user_id = ?
    `,
    
    updateEmail: `
        UPDATE Users 
        SET email = ? 
        WHERE user_id = ?
    `,
    
    updateFirstName: `
        UPDATE Users 
        SET first_name = ? 
        WHERE user_id = ?
    `,

    updateLastName: `
        UPDATE Users 
        SET last_name = ? 
        WHERE user_id = ?
    `,

    updatePassword: `
        UPDATE Users 
        SET password = ? 
        WHERE user_id = ?
    `,



    // DELETE queries
    deleteUser: 'DELETE FROM Users WHERE user_id = ?',
};

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * Get all recipes
 * GET /api/recipes
 */
router.get('/', (req, res) => {

    database.all(sql.getAll, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    });
});

/**
 * Get recipes created by logged-in user
 * GET /api/recipes/my-recipes
 * Requires authentication
 */
router.get('/my-profile', authenticate, (req, res) => {
    const user_Id = req.user.user_id;

    database.all(sql.getByUserId, [user_Id], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows,
            message: rows.length === 0 ? 'You have not created any recipes yet' : undefined
        });
    });
});

/**
 * Get recipe by ID with ingredients and instructions
 * GET /api/recipes/:id
 */
router.get('/:id', (req, res) => {
    const user_Id = req.params.id;

    database.get(sql.getById, [user_Id], (err, user) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.status(200).json({
            success: true,
            data: user
        });
    });
});

/**
 * Get recipes by cuisine ID
 * GET /api/recipes/cuisine/:cuisineId
 */
router.get('/user/:user_Id', (req, res) => {
    const userId = req.params.user_Id;

    database.all(sql.getByUserId, [user_Id], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    });
});

module.exports = router;