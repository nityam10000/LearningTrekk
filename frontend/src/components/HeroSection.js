import React from 'react'
import {Button} from './Button'
import '../css/HeroSection.css' 

function HeroSection() {
    return (
        <div className='hero-container'>
            <div className="hero-overlay"></div>
            <img className="hero-background-img" src="/images/banner1.png" alt="E-learning platform background" />
            
            <div className="hero-content">
                <h1 className="hero-title">The Only Place for Hustlers!</h1>
                <p className="hero-subtitle">Master any skills with our comprehensive courses and join thousands of successful professionals.</p>

                <div className="hero-stats">
                    <div className="stat-item">
                        <span className="stat-number">50K+</span>
                        <span className="stat-label">Students</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">100+</span>
                        <span className="stat-label">Courses</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">95%</span>
                        <span className="stat-label">Success Rate</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HeroSection
