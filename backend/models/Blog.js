const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    excerpt: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Programming',
            'Web Development', 
            'Frontend',
            'Backend',
            'AI/ML',
            'Cloud Computing',
            'Security',
            'DevOps',
            'Mobile Development',
            'Data Science',
            'UI/UX Design',
            'Career',
            'Technology',
            'Tutorials'
        ]
    },
    tags: [{
        type: String,
        trim: true
    }],
    image: {
        type: String,
        default: '' // Empty string instead of default image
    },
    readTime: {
        type: Number,
        default: 5 // in minutes
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedDate: {
        type: Date
    },
    likes: {
        type: Number,
        default: 0
    },
    bookmarks: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        comment: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    metaDescription: {
        type: String,
        maxlength: 160
    },
    slug: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Generate slug from title before saving
blogSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
        
        // Add timestamp to ensure uniqueness
        this.slug += '-' + Date.now();
    }
    
    // Set published date when publishing
    if (this.isModified('isPublished') && this.isPublished && !this.publishedDate) {
        this.publishedDate = new Date();
    }
    
    next();
});

// Calculate read time based on content
blogSchema.pre('save', function(next) {
    if (this.isModified('content')) {
        const wordsPerMinute = 200;
        const wordCount = this.content.split(' ').length;
        this.readTime = Math.ceil(wordCount / wordsPerMinute);
    }
    next();
});

// Create indexes for better performance
blogSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
blogSchema.index({ category: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ isPublished: 1 });
blogSchema.index({ publishedDate: -1 });
blogSchema.index({ slug: 1 });

module.exports = mongoose.model('Blog', blogSchema);