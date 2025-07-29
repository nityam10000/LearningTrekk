const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Enroll in a course
// @route   POST /api/enrollments
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { courseId } = req.body;

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if user is already enrolled
        const existingEnrollment = await Enrollment.findOne({
            student: req.user._id,
            course: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        // Create enrollment
        const enrollment = new Enrollment({
            student: req.user._id,
            course: courseId
        });

        await enrollment.save();

        // Add student to course's enrolled students
        await Course.findByIdAndUpdate(courseId, {
            $push: { enrolledStudents: req.user._id }
        });

        // Add course to user's enrolled courses
        await User.findByIdAndUpdate(req.user._id, {
            $push: { enrolledCourses: courseId }
        });

        res.status(201).json(enrollment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get user enrollments
// @route   GET /api/enrollments
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student: req.user._id })
            .populate('course', 'title thumbnail instructor category price level rating')
            .populate('course.instructor', 'name')
            .populate('course.category', 'name')
            .sort({ enrolledAt: -1 });

        res.json(enrollments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id)
            .populate('course')
            .populate('student', 'name email');

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        // Check if user owns this enrollment
        if (enrollment.student._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(enrollment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update lesson progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private
router.put('/:id/progress', protect, async (req, res) => {
    try {
        const { lessonId } = req.body;

        const enrollment = await Enrollment.findById(req.params.id);

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        // Check if user owns this enrollment
        if (enrollment.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Check if lesson is already completed
        const lessonAlreadyCompleted = enrollment.completedLessons.find(
            lesson => lesson.lessonId.toString() === lessonId
        );

        if (!lessonAlreadyCompleted) {
            enrollment.completedLessons.push({
                lessonId,
                completedAt: new Date()
            });

            // Get course to calculate progress
            const course = await Course.findById(enrollment.course);
            const totalLessons = course.lessons.length;
            const completedLessons = enrollment.completedLessons.length;
            
            enrollment.progress = Math.round((completedLessons / totalLessons) * 100);
            
            // Check if course is completed
            if (enrollment.progress === 100) {
                enrollment.isCompleted = true;
                enrollment.completedAt = new Date();
            }

            enrollment.lastAccessedAt = new Date();
            await enrollment.save();
        }

        res.json(enrollment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;