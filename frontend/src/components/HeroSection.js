import React from 'react'
import {Button} from './Button'
import '../css/HeroSection.css' 

function HeroSection() {
    return (
        <div className='hero-container'>
            <div className="hero-overlay"></div>
            <img className="hero-background-img" src="/images/banner1.png" alt="E-learning platform background" />
            
            <div className="hero-content">
                <h1 className="hero-title">The Only Place for Programming Hustlers!</h1>
                <p className="hero-subtitle">Master programming skills with our comprehensive courses and join thousands of successful developers.</p>
{/*                 
                <div className="hero-btns">
                    <Button 
                        className='btns' 
                        buttonStyle='btn--calltoaction' 
                        buttonSize='btn--large'
                    >
                        GET STARTED
                    </Button>
                    <Button 
                        className='btns' 
                        buttonStyle='btn--secondary' 
                        buttonSize='btn--large'
                    >
                        WATCH DEMO
                    </Button>
                </div> */}

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
