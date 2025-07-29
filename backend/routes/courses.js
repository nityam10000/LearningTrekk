const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const Category = require('../models/Category');
const { protect, instructor } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { isPublished: true };
        
        // Add search functionality
        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Add category filter
        if (req.query.category) {
            filter.category = req.query.category;
        }

        // Add level filter
        if (req.query.level) {
            filter.level = req.query.level;
        }

        // Add price filter
        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
            if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
        }

        const courses = await Course.find(filter)
            .populate('instructor', 'name avatar')
            .populate('category', 'name')
            .select('-lessons')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Course.countDocuments(filter);

        res.json({
            courses,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get instructor's courses
// @route   GET /api/courses/instructor/my-courses
// @access  Private (Instructor only)
router.get('/instructor/my-courses', [protect, instructor], async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.user._id })
            .populate('category', 'name')
            .populate('enrolledStudents', 'name')
            .sort({ createdAt: -1 });

        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name avatar bio')
            .populate('category', 'name')
            .populate('reviews.user', 'name avatar');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Instructor only)
router.post('/', [protect, instructor], [
    body('title', 'Title is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
    body('category', 'Category is required').not().isEmpty(),
    body('price', 'Price is required').isNumeric(),
    body('level', 'Level is required').isIn(['Beginner', 'Intermediate', 'Advanced'])
], async (req, res) => {
    try {
        console.log('=== Course Creation Request ===');
        console.log('User:', req.user?._id, req.user?.email, req.user?.role);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            description,
            shortDescription,
            category,
            price,
            originalPrice,
            thumbnail,
            level,
            duration,
            videoUrl,
            tags,
            requirements,
            whatYouWillLearn
        } = req.body;

        // Check if category exists (if it's supposed to be a real ObjectId)
        // For now, let's handle string categories by creating a basic course without category validation
        console.log('Creating course with category:', category);

        const courseData = {
            title,
            description,
            shortDescription,
            instructor: req.user._id,
            category, // Restore the category field
            price,
            originalPrice,
            thumbnail,
            level,
            duration: duration || 0,
            videoUrl,
            tags,
            requirements,
            whatYouWillLearn
        };

        console.log('Course data to save:', courseData);

        const course = new Course(courseData);
        const createdCourse = await course.save();

        console.log('Course created successfully:', createdCourse._id);

        // Add course to instructor's created courses
        await User.findByIdAndUpdate(req.user._id, {
            $push: { createdCourses: createdCourse._id }
        });

        res.status(201).json(createdCourse);
    } catch (error) {
        console.error('=== Course Creation Error ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Send more specific error message
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: validationErrors 
            });
        }
        
        res.status(500).json({ 
            message: 'Server error during course creation',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor only)
router.put('/:id', [protect, instructor], async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if user owns the course or is admin
        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this course' });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json(updatedCourse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Add course review
// @route   POST /api/courses/:id/reviews
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
    try {
        const { rating, comment } = req.body;

        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if user already reviewed
        const alreadyReviewed = course.reviews.find(
            review => review.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({ message: 'Course already reviewed' });
        }

        const review = {
            user: req.user._id,
            rating: Number(rating),
            comment
        };

        course.reviews.push(review);
        course.calculateAverageRating();

        await course.save();

        res.status(201).json({ message: 'Review added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;