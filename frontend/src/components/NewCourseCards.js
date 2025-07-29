import React, { useState, useEffect } from 'react';
import '../css/NewCourseCards.css';
import CardItem from './CardItem';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { coursesAPI } from '../services/api';

function NewCourseCards(props) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch newest courses from API
  useEffect(() => {
    const fetchNewCourses = async () => {
      try {
        setLoading(true);
        const response = await coursesAPI.getAllCourses();
        console.log('New Courses API Response:', response); // Debug log
        
        // Handle different response formats
        let coursesData = [];
        if (Array.isArray(response)) {
          coursesData = response;
        } else if (response && Array.isArray(response.courses)) {
          coursesData = response.courses;
        } else if (response && Array.isArray(response.data)) {
          coursesData = response.data;
        } else {
          console.warn('Unexpected API response format for new courses:', response);
          coursesData = [];
        }
        
        // Filter only published courses and sort by creation date (newest first)
        const publishedCourses = coursesData
          .filter(course => course.isPublished)
          .sort((a, b) => new Date(b.createdAt || b.dateCreated || 0) - new Date(a.createdAt || a.dateCreated || 0));
        
        setCourses(publishedCourses);
        setError(null);
      } catch (err) {
        console.error('Error fetching new courses:', err);
        setError('Failed to load new courses');
      } finally {
        setLoading(false);
      }
    };

    fetchNewCourses();
  }, []);

  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 5,
      slidesToSlide: 1 // optional, default to 1.
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 3,
      slidesToSlide: 1 // optional, default to 1.
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1.5,
      slidesToSlide: 1 // optional, default to 1.
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="new-course-cards">
        <h1>New Courses</h1>
        <div className="loading-container">
          <p className="loading-text">Loading new courses...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="new-course-cards">
        <h1>New Courses</h1>
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  // Show message if no courses available
  if (courses.length === 0) {
    return (
      <div className="new-course-cards">
        <h1>New Courses</h1>
        <div className="empty-state">
          <p>No new courses available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="new-course-cards">
      <h1>New Courses</h1>
      <Carousel
        swipeable={false}
        draggable={false}
        showDots={false}
        responsive={responsive}
        ssr={true}
        infinite={true}
        autoPlay={props.deviceType !== "mobile" ? true : false}
        autoPlaySpeed={100000}
        keyBoardControl={true}
        customTransition="all .5"
        transitionDuration={500}
        containerClass="carousel-container course-carousel"
        removeArrowOnDeviceType={["tablet", "mobile"]}
        deviceType={props.deviceType}
        dotListClass="custom-dot-list-style"
        itemClass="carousel-item-padding-40-px"
      >
        {courses.map((course) => (
          <div key={course._id} className="course-card-wrapper">
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

export default NewCourseCards;