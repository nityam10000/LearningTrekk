import React from 'react';
import '../../App.css'
import Cards from '../Cards';
import HeroSection from '../HeroSection'
import NewCourseCards from '../NewCourseCards';
import NewBlogCards from '../NewBlogCards'

function Home(props) {
    return (
        <div className="home-container">
            <HeroSection />
            <Cards/>
            <NewCourseCards />
            <NewBlogCards />
        </div>
    );
}

export default Home;