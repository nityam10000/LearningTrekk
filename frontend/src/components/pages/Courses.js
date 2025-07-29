import React from 'react';
import '../../App.css'

import AllCoursesCards from '../AllCoursesCards'

function Courses(props) {
    return (
        <>
            <div className="courses-hero-section">
                <h1 className="courses-title">Explore Our Courses</h1>
                <p className="courses-subtitle">
                    Discover a wide range of courses designed to help you learn new skills 
                    and advance your career. From beginner to advanced levels, we have 
                    something for everyone.
                </p>
            </div>
            <AllCoursesCards />
        </>
    );
}

export default Courses;