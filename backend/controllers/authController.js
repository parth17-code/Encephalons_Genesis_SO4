const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateUniqueId } = require('../utils/helpers');
const mongoose = require('mongoose');
const Society = require('../models/Society');  // Add this import

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`🔐 Login attempt for: ${email}`);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).populate('societyId', 'name ward');
    console.log(user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Contact administrator.'
      });
    }

    console.log(`✅ Login successful for: ${email} (${user.role})`);

    res.json({
      success: true,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        societyId: user.societyId,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (for demo/testing)
 * @access  Public (in production, this should be protected)
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, societyId } = req.body;

    console.log(`🔐 Registration attempt for: ${email} (${role})`);

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Role-based societyId validation
    if (role === 'RESIDENT' || role === 'SECRETARY') {
      // Validate societyId is provided
      if (!societyId) {
        return res.status(400).json({
          success: false,
          message: `Society selection is required for ${role} role`
        });
      }

      // Validate societyId format (valid MongoDB ObjectId)
      if (!mongoose.Types.ObjectId.isValid(societyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid society ID format'
        });
      }

      // Verify society exists and is active
      const society = await Society.findOne({ 
        _id: societyId, 
        isActive: true 
      });

      if (!society) {
        return res.status(400).json({
          success: false,
          message: 'Selected society not found or inactive'
        });
      }

      console.log(`✅ Society verified: ${society.name}`);
    }

    // Create user
    const user = await User.create({
      userId: generateUniqueId('USR-'),
      name,
      email,
      password,
      role,
      societyId: (role === 'RESIDENT' || role === 'SECRETARY') ? societyId : null
    });

    // Populate societyId for response
    await user.populate('societyId', 'name ward propertyTaxNumber');

    console.log(`✅ User registered: ${email} (${role})`);

    res.status(201).json({
      success: true,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        societyId: user.societyId,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('societyId', 'name ward propertyTaxNumber');

    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  login,
  register,
  getMe
};