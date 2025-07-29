import React, { useState, useEffect } from 'react';
import '../css/NewBlogCards.css';
import CardItem from './CardItem';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { blogsAPI } from '../services/api';

function NewBlogCards(props) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch latest blogs from API
  useEffect(() => {
    const fetchLatestBlogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching latest blogs for home page...');
        const response = await blogsAPI.getAllBlogs();
        console.log('Latest Blogs API Response:', response);
        
        // Handle different response formats
        let blogsData = [];
        if (Array.isArray(response)) {
          blogsData = response;
        } else if (response && Array.isArray(response.blogs)) {
          blogsData = response.blogs;
        } else if (response && Array.isArray(response.data)) {
          blogsData = response.data;
        } else {
          console.warn('Unexpected API response format for blogs:', response);
          blogsData = [];
        }
        
        console.log('Processed blogs data:', blogsData);
        
        // Filter only published blogs and sort by creation date (newest first)
        const publishedBlogs = blogsData
          .filter(blog => blog.isPublished !== false)
          .sort((a, b) => new Date(b.createdAt || b.publishedDate || 0) - new Date(a.createdAt || a.publishedDate || 0))
          .slice(0, 6); // Get only latest 6 blogs
        
        console.log('Published blogs for display:', publishedBlogs);
        
        if (publishedBlogs.length > 0) {
          setBlogs(publishedBlogs);
          setError(null);
        } else {
          // If no published blogs, use static fallback
          console.log('No published blogs found, using static fallback');
          setBlogs(getStaticBlogs());
          setError('No published blogs available - showing featured content');
        }
      } catch (err) {
        console.error('Error fetching latest blogs:', err);
        setError('Failed to load latest blogs');
        // Always fallback to static data to ensure something shows
        setBlogs(getStaticBlogs());
      } finally {
        setLoading(false);
      }
    };

    fetchLatestBlogs();
  }, []);

  // Static fallback data - enhanced with better content
  const getStaticBlogs = () => [
    {
      _id: 'static-1',
      title: '10 Essential Programming Tips for Beginners',
      category: { name: 'Programming Tips' },
      image: '/images/1.png',
      excerpt: 'Master the fundamentals with these essential programming tips that every beginner should know to kickstart their coding journey.',
      author: { name: 'Tech Mentor' },
      publishedDate: new Date('2025-07-25'),
      createdAt: new Date('2025-07-25'),
      readTime: 5,
      isPublished: true
    },
    {
      _id: 'static-2',
      title: 'The Future of Web Development in 2025',
      category: { name: 'Web Development' },
      image: '/images/2.png',
      excerpt: 'Explore the latest trends and technologies shaping web development in 2025 and beyond.',
      author: { name: 'Future Dev' },
      publishedDate: new Date('2025-07-24'),
      createdAt: new Date('2025-07-24'),
      readTime: 8,
      isPublished: true
    },
    {
      _id: 'static-3',
      title: 'React vs Vue: Which Framework to Choose?',
      category: { name: 'Frontend' },
      image: '/images/3.png',
      excerpt: 'A comprehensive comparison of React and Vue to help you make the right choice for your next project.',
      author: { name: 'Frontend Expert' },
      publishedDate: new Date('2025-07-23'),
      createdAt: new Date('2025-07-23'),
      readTime: 6,
      isPublished: true
    },
    {
      _id: 'static-4',
      title: 'Building Scalable Node.js Applications',
      category: { name: 'Backend' },
      image: '/images/4.png',
      excerpt: 'Learn best practices for building scalable and maintainable Node.js applications that can handle real-world traffic.',
      author: { name: 'Backend Guru' },
      publishedDate: new Date('2025-07-22'),
      createdAt: new Date('2025-07-22'),
      readTime: 10,
      isPublished: true
    },
    {
      _id: 'static-5',
      title: 'Machine Learning for Developers: Getting Started',
      category: { name: 'AI/ML' },
      image: '/images/5.png',
      excerpt: 'Your complete guide to getting started with machine learning as a developer, including practical examples.',
      author: { name: 'AI Specialist' },
      publishedDate: new Date('2025-07-21'),
      createdAt: new Date('2025-07-21'),
      readTime: 12,
      isPublished: true
    },
    {
      _id: 'static-6',
      title: 'Cloud Computing Best Practices for 2025',
      category: { name: 'Cloud Computing' },
      image: '/images/6.png',
      excerpt: 'Essential cloud computing practices every developer should follow in 2025 to build robust applications.',
      author: { name: 'Cloud Architect' },
      publishedDate: new Date('2025-07-20'),
      createdAt: new Date('2025-07-20'),
      readTime: 7,
      isPublished: true
    }
  ];

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 1600 },
      items: 4,
      slidesToSlide: 1
    },
    desktop: {
      breakpoint: { max: 1600, min: 1024 },
      items: 3,
      slidesToSlide: 1
    },
    tablet: {
      breakpoint: { max: 1024, min: 768 },
      items: 2,
      slidesToSlide: 1
    },
    mobile: {
      breakpoint: { max: 768, min: 0 },
      items: 1,
      slidesToSlide: 1
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="new-blog-cards">
        <div className="blog-section-header">
          <div className="header-content">
            <h1>Latest Blog Posts</h1>
            <p>Stay updated with our latest insights and tutorials</p>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading latest blog posts...</p>
        </div>
      </div>
    );
  }

  // Always show content, even if there's an error - never show empty state
  return (
    <div className="new-blog-cards">
      <div className="blog-section-header">
        <div className="header-content">
          <h1>Latest Blog Posts</h1>
          <p>Stay updated with our latest insights, tutorials, and industry trends</p>
        </div>
      </div>
      
      {error && (
        <div className="api-error-notice">
          <i className="fas fa-exclamation-triangle"></i>
          <span>Using featured content - {error}</span>
        </div>
      )}

      <Carousel
        responsive={responsive}
        infinite={blogs.length > 3}
        autoPlay={props.deviceType !== "mobile" && blogs.length > 3}
        autoPlaySpeed={5000}
        keyBoardControl={true}
        customTransition="all .5s"
        transitionDuration={500}
        containerClass="carousel-container blog-carousel"
        removeArrowOnDeviceType={["mobile"]}
        dotListClass="custom-dot-list-style"
        itemClass="carousel-item-padding-40-px"
        swipeable={true}
        draggable={true}
        showDots={false}
        renderButtonGroupOutside={true}
        arrows={blogs.length > 3}
      >
        {blogs.map((blog) => (
          <div key={blog._id} className="blog-card-wrapper">
            <CardItem
              src={blog.image && blog.image.trim() ? blog.image : '/images/1.png'}
              text={blog.title}
              label={blog.category?.name || 'Blog'}
              path={`/blog/${blog._id}`}
              inCarousel={true}
              // Additional blog-specific props
              excerpt={blog.excerpt}
              author={blog.author?.name}
              publishedDate={blog.publishedDate || blog.createdAt}
              readTime={blog.readTime}
              isBlogCard={true}
            />
          </div>
        ))}
      </Carousel>
    </div>
  );
}

export default NewBlogCards;