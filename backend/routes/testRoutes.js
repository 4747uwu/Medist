import express from 'express';
import Test from '../modals/Test.js';
import { protect } from '../utils/auth.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

const router = express.Router();

router.use(protect);

// Search tests
router.get('/search', async (req, res) => {
  try {
    const {
      search = '',
      category = '',
      isActive = true,
      page = 1,
      limit = 50
    } = req.query;

    const query = { isActive };

    // Add search filter only if search term exists
    if (search && search.trim()) {
      query.$or = [
        { testName: { $regex: search, $options: 'i' } },
        { testCode: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tests, total] = await Promise.all([
      Test.find(query)
        .sort({ testName: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Test.countDocuments(query)
    ]);

    sendSuccess(res, {
      data: tests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error searching tests:', error);
    sendError(res, 'Error searching tests', 500, error.message);
  }
});

// Get all unique categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Test.distinct('category', { isActive: true });
    sendSuccess(res, { data: categories.sort() });
  } catch (error) {
    console.error('Error fetching categories:', error);
    sendError(res, 'Error fetching categories', 500, error.message);
  }
});

export default router;