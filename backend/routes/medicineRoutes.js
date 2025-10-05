import express from 'express';
import Medicine from '../modals/Medicine.js';
import { protect } from '../utils/auth.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

const router = express.Router();

router.use(protect);

// Search medicines
router.get('/search', async (req, res) => {
  try {
    const {
      search = '',
      companyName = '',
      category = '',
      isActive = true,
      page = 1,
      limit = 50
    } = req.query;

    const query = { isActive };

    // Add search filter for name and company
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { medicineCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Add company filter
    if (companyName) {
      query.companyName = { $regex: companyName, $options: 'i' };
    }

    // Add category filter (if available)
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [medicines, total] = await Promise.all([
      Medicine.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Medicine.countDocuments(query)
    ]);

    sendSuccess(res, {
      data: medicines,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error searching medicines:', error);
    sendError(res, 'Error searching medicines', 500, error.message);
  }
});

// Get all unique companies
router.get('/companies', async (req, res) => {
  try {
    const companies = await Medicine.distinct('companyName', { isActive: true });
    sendSuccess(res, { data: companies.sort() });
  } catch (error) {
    console.error('Error fetching companies:', error);
    sendError(res, 'Error fetching companies', 500, error.message);
  }
});

export default router;