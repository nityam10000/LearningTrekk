import React from 'react';
import { Link } from 'react-router-dom';

function CardItem(props) {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={i} className="fas fa-star star-filled"></i>);
    }
    
    if (hasHalfStar) {
      stars.push(<i key="half" className="fas fa-star-half-alt star-filled"></i>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="far fa-star star-empty"></i>);
    }
    
    return stars;
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const cardContent = (
    <Link className='cards__item__link' to={props.path}>
      {props.src && (
        <figure className='cards__item__pic-wrap' data-category={props.label}>
          {props.isPopular && <div className="popular-badge">Popular</div>}
          <img
            className='cards__item__img'
            alt={props.text}
            src={props.src}
            onError={(e) => {
              e.target.parentElement.parentElement.style.display = 'none';
            }}
          />
        </figure>
      )}
      <div className='cards__item__info'>
        {/* Title */}
        <h5 className='cards__item__text'>{props.text}</h5>
        
        {/* Blog-specific content */}
        {props.isBlogCard ? (
          <>
            {/* Blog excerpt */}
            {props.excerpt && (
              <p className="blog-excerpt">{props.excerpt.substring(0, 120)}...</p>
            )}
            
            {/* Blog meta info */}
            <div className="blog-meta">
              {props.author && (
                <div className="blog-author">
                  <i className="fas fa-user"></i>
                  <span>By {props.author}</span>
                </div>
              )}
              
              {props.publishedDate && (
                <div className="blog-date">
                  <i className="fas fa-calendar"></i>
                  <span>{formatDate(props.publishedDate)}</span>
                </div>
              )}
              
              {props.readTime && (
                <div className="blog-read-time">
                  <i className="fas fa-clock"></i>
                  <span>{props.readTime} min read</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Course-specific content */}
            
            {/* Instructor Info */}
            {props.instructor && (
              <div className="course-instructor">
                <span>By {props.instructor}</span>
              </div>
            )}
            
            {/* Rating and Reviews */}
            {props.rating && (
              <div className="course-rating">
                <div className="stars">
                  {renderStars(props.rating)}
                </div>
                <span className="rating-text">
                  {props.rating} ({formatNumber(props.reviewCount)} reviews)
                </span>
              </div>
            )}
            
            {/* Course Details */}
            <div className="course-details">
              {props.estimatedHours && (
                <div className="detail-item">
                  <i className="far fa-clock"></i>
                  <span>{props.estimatedHours}h</span>
                </div>
              )}
              
              {props.difficulty && (
                <div className="detail-item">
                  <i className="fas fa-signal" style={{ color: getDifficultyColor(props.difficulty) }}></i>
                  <span style={{ color: getDifficultyColor(props.difficulty), fontWeight: '500' }}>
                    {props.difficulty.charAt(0).toUpperCase() + props.difficulty.slice(1)}
                  </span>
                </div>
              )}
              
              {props.enrollmentCount && (
                <div className="detail-item">
                  <i className="fas fa-users"></i>
                  <span>{formatNumber(props.enrollmentCount)} students</span>
                </div>
              )}
            </div>
            
            {/* Pricing */}
            {props.price && (
              <div className="course-pricing">
                <span className="current-price">₹{props.price}</span>
                {props.originalPrice && props.originalPrice > props.price && (
                  <span className="original-price">₹{props.originalPrice}</span>
                )}
              </div>
            )}
            
            {/* Tags */}
            {props.tags && props.tags.length > 0 && (
              <div className="course-tags">
                {props.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Link>
  );

  // If used in carousel, don't wrap in li
  if (props.inCarousel) {
    return (
      <div className='cards__item'>
        {cardContent}
      </div>
    );
  }

  // Default behavior for list usage
  return (
    <li className='cards__item'>
      {cardContent}
    </li>
  );
}

export default CardItem;