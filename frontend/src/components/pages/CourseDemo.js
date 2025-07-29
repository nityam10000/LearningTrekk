import React from 'react';
import '../../css/Cards.css';

function CourseDemo() {
    return (
        <div className="cards">
            <div className="container">
                <h1>Course Demo</h1>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--border-radius-lg)',
                    margin: '2rem 0'
                }}>
                    <h2>Frontend Demo Mode</h2>
                    <p style={{ fontSize: 'var(--text-lg)', marginBottom: '2rem' }}>
                        This is a frontend-only demonstration of the e-learning platform.
                        Course content, video playback, and interactive features are simulated for demo purposes.
                    </p>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem',
                        marginTop: '3rem'
                    }}>
                        <div style={{ 
                            padding: '2rem',
                            background: 'var(--white)',
                            borderRadius: 'var(--border-radius)',
                            boxShadow: 'var(--shadow-md)'
                        }}>
                            <h3>📚 Course Materials</h3>
                            <p>Interactive lessons, quizzes, and downloadable resources</p>
                        </div>
                        <div style={{ 
                            padding: '2rem',
                            background: 'var(--white)',
                            borderRadius: 'var(--border-radius)',
                            boxShadow: 'var(--shadow-md)'
                        }}>
                            <h3>🎥 Video Lectures</h3>
                            <p>High-quality video content with progress tracking</p>
                        </div>
                        <div style={{ 
                            padding: '2rem',
                            background: 'var(--white)',
                            borderRadius: 'var(--border-radius)',
                            boxShadow: 'var(--shadow-md)'
                        }}>
                            <h3>💬 Discussion Forums</h3>
                            <p>Community-driven Q&A and peer learning</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CourseDemo;