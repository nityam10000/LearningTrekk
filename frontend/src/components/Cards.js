import React, { useState, useEffect } from 'react';
import '../css/TopCourseCards.css';
import CardItem from './CardItem';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { coursesAPI } from '../services/api';

function Cards(props) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await coursesAPI.getAllCourses();
        console.log('API Response:', response); // Debug log
        
        // Handle different response formats
        let coursesData = [];
        if (Array.isArray(response)) {
          coursesData = response;
        } else if (response && Array.isArray(response.courses)) {
          coursesData = response.courses;
        } else if (response && Array.isArray(response.data)) {
          coursesData = response.data;
        } else {
          console.warn('Unexpected API response format:', response);
          coursesData = [];
        }
        
        // Filter only published courses
        const publishedCourses = coursesData.filter(course => course.isPublished);
        setCourses(publishedCourses);
        setError(null);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 1600 },
      items: 6,
      slidesToSlide: 2
    },
    desktop: {
      breakpoint: { max: 1600, min: 1200 },
      items: 5,
      slidesToSlide: 2
    },
    laptop: {
      breakpoint: { max: 1200, min: 1024 },
      items: 4,
      slidesToSlide: 1
    },
    tablet: {
      breakpoint: { max: 1024, min: 768 },
      items: 3,
      slidesToSlide: 1
    },
    smallTablet: {
      breakpoint: { max: 768, min: 464 },
      items: 2,
      slidesToSlide: 1
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
      slidesToSlide: 1
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="top-course-cards">
        <h1>Top Courses</h1>
        <div className="loading-container">
          <p className="loading-text">Loading courses...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="top-course-cards">
        <h1>Top Courses</h1>
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  // Show message if no courses available
  if (courses.length === 0) {
    return (
      <div className="top-course-cards">
        <h1>Top Courses</h1>
        <div className="empty-state">
          <p>No courses available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="top-course-cards">
      <h1>Top Courses</h1>
      <Carousel
        swipeable={true}
        draggable={true}
        showDots={false}
        responsive={responsive}
        ssr={true} // means to render carousel on server-side.
        infinite={true}
        autoPlay={props.deviceType !== "mobile" ? true : false}
        autoPlaySpeed={5000}
        keyBoardControl={true}
        customTransition="all .5"
        transitionDuration={500}
        containerClass="carousel-container top-course-carousel"
        removeArrowOnDeviceType={["tablet", "smallTablet", "mobile"]}
        deviceType={props.deviceType}
        dotListClass="custom-dot-list-style"
        itemClass="carousel-item-padding-40-px"
        minimumTouchDrag={80}
        pauseOnHover={true}
        centerMode={false}
        partialVisible={false}
      >
        {courses.map((course) => (
          <div key={course._id} className="top-course-card-wrapper">
            <CardItem
              src={course.thumbnail || 'images/default-course.png'}
              text={course.title}
              label={course.category?.name || 'General'}
              path={`/course/${course._id}`}
              inCarousel={true}
            />
          </div>
        ))}
      </Carousel>
    </div>
  );
}

export default Cards;