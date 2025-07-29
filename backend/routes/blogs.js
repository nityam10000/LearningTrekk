const express = require('express');
const { body, validationResult } = require('express-validator');
const Blog = require('../models/Blog');
const { protect, instructor } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all published blogs
// @route   GET /api/blogs
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
                { excerpt: { $regex: req.query.search, $options: 'i' } },
                { content: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Add category filter
        if (req.query.category) {
            filter.category = req.query.category;
        }

        // Add author filter
        if (req.query.author) {
            filter.author = req.query.author;
        }

        const blogs = await Blog.find(filter)
            .populate('author', 'name avatar bio')
            .sort({ publishedDate: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Blog.countDocuments(filter);

        res.json({
            blogs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get instructor's blogs
// @route   GET /api/blogs/instructor/my-blogs
// @access  Private (Instructor only)
router.get('/instructor/my-blogs', [protect, instructor], async (req, res) => {
    try {
        const blogs = await Blog.find({ author: req.user._id })
            .populate('author', 'name avatar bio')
            .sort({ createdAt: -1 });

        res.json(blogs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get single blog by ID or slug
// @route   GET /api/blogs/:identifier
// @access  Public
router.get('/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        
        // Try to find by ID first, then by slug
        let blog = await Blog.findById(identifier).populate('author', 'name avatar bio');
        
        if (!blog) {
            blog = await Blog.findOne({ slug: identifier }).populate('author', 'name avatar bio');
        }

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Increment view count
        blog.views += 1;
        await blog.save();

        res.json(blog);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private (Instructor only)
router.post('/', [protect, instructor], [
    body('title', 'Title is required').not().isEmpty(),
    body('excerpt', 'Excerpt is required').not().isEmpty(),
    body('content', 'Content is required').not().isEmpty(),
    body('category', 'Category is required').not().isEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            excerpt,
            content,
            category,
            tags,
            image,
            metaDescription,
            isPublished
        } = req.body;

        const blogData = {
            title,
            excerpt,
            content,
            category,
            author: req.user._id,
            tags: tags || [],
            image: image || '/images/default-blog.png',
            metaDescription,
            isPublished: isPublished || false
        };

        const blog = new Blog(blogData);
        const createdBlog = await blog.save();

        // Populate author info before sending response
        await createdBlog.populate('author', 'name avatar bio');

        res.status(201).json(createdBlog);
    } catch (error) {
        console.error(error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: validationErrors 
            });
        }
        
        res.status(500).json({ 
            message: 'Server error during blog creation',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private (Author only)
router.put('/:id', [protect, instructor], async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if user owns the blog or is admin
        if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this blog' });
        }

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('author', 'name avatar bio');

        res.json(updatedBlog);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private (Author only)
router.delete('/:id', [protect, instructor], async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if user owns the blog or is admin
        if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this blog' });
        }

        await Blog.findByIdAndDelete(req.params.id);

        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Like/Unlike blog
// @route   POST /api/blogs/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Simple like increment (in a real app, you'd track user likes)
        blog.likes += 1;
        await blog.save();

        res.json({ likes: blog.likes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Add comment to blog
// @route   POST /api/blogs/:id/comments
// @access  Private
router.post('/:id/comments', protect, [
    body('comment', 'Comment is required').not().isEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        const newComment = {
            user: req.user._id,
            comment: req.body.comment
        };

        blog.comments.push(newComment);
        await blog.save();

        // Populate the new comment
        await blog.populate('comments.user', 'name avatar');

        res.status(201).json(blog.comments[blog.comments.length - 1]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;