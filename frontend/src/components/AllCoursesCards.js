import '../css/AllCoursesCards.css';
import CardItem from './CardItem';
import SearchBar from './SearchBar';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { coursesAPI, categoriesAPI } from '../services/api';

// Constants
const ITEMS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 300;

// Sort options configuration
const SORT_OPTIONS = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'alphabetical', label: 'A to Z' }
];

// Utility functions
const sortCourses = (courses, sortBy) => {
  return [...courses].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (a.price || 0) - (b.price || 0);
      case 'price-high':
        return (b.price || 0) - (a.price || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'newest':
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case 'alphabetical':
        return (a.title || '').localeCompare(b.title || '');
      case 'popularity':
      default:
        return (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0);
    }
  });
};

const filterCourses = (courses, searchQuery, activeFilters) => {
  let filtered = [...courses];

  // Search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(course =>
      course.title?.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query) ||
      course.category?.name?.toLowerCase().includes(query) ||
      course.instructor?.name?.toLowerCase().includes(query) ||
      course.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Category filter
  if (activeFilters.category) {
    filtered = filtered.filter(course => 
      course.category?._id === activeFilters.category ||
      course.category?.name === activeFilters.category
    );
  }

  // Level filter
  if (activeFilters.level) {
    filtered = filtered.filter(course => course.level === activeFilters.level);
  }

  // Price filter
  if (activeFilters.priceRange) {
    const [min, max] = activeFilters.priceRange.split('-').map(Number);
    filtered = filtered.filter(course => {
      const price = course.price || 0;
      return max ? (price >= min && price <= max) : (price >= min);
    });
  }

  // Rating filter
  if (activeFilters.rating) {
    const minRating = Number(activeFilters.rating);
    filtered = filtered.filter(course => (course.rating || 0) >= minRating);
  }

  return filtered;
};

const createFilterOptions = (categories, courseData) => [
  {
    key: 'category',
    title: 'Category',
    options: categories.map(cat => ({
      value: cat._id || cat.name,
      label: cat.name,
      count: cat.courseCount || courseData.filter(c => 
        c.category?._id === cat._id || c.category?.name === cat.name
      ).length
    }))
  },
  {
    key: 'level',
    title: 'Difficulty Level',
    options: [
      { value: 'Beginner', label: 'Beginner', count: courseData.filter(c => c.level === 'Beginner').length },
      { value: 'Intermediate', label: 'Intermediate', count: courseData.filter(c => c.level === 'Intermediate').length },
      { value: 'Advanced', label: 'Advanced', count: courseData.filter(c => c.level === 'Advanced').length }
    ]
  },
  {
    key: 'priceRange',
    title: 'Price Range',
    options: [
      { value: '0-0', label: 'Free', count: courseData.filter(c => !c.price || c.price === 0).length },
      { value: '1-50', label: '$1 - $50', count: courseData.filter(c => c.price > 0 && c.price <= 50).length },
      { value: '51-100', label: '$51 - $100', count: courseData.filter(c => c.price > 50 && c.price <= 100).length },
      { value: '101-', label: '$100+', count: courseData.filter(c => c.price > 100).length }
    ]
  },
  {
    key: 'rating',
    title: 'Rating',
    options: [
      { value: '4', label: '4+ Stars', count: courseData.filter(c => c.rating >= 4).length },
      { value: '3', label: '3+ Stars', count: courseData.filter(c => c.rating >= 3).length },
      { value: '2', label: '2+ Stars', count: courseData.filter(c => c.rating >= 2).length }
    ]
  }
];

// Components
const LoadingState = () => (
  <div className="cards">
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <h2>Loading courses...</h2>
      <p>Please wait while we fetch the latest courses for you.</p>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="cards">
    <div className="error-container">
      <div className="error-icon">
        <i className="fas fa-exclamation-triangle"></i>
      </div>
      <h2>Error loading courses</h2>
      <p>{error}</p>
      <button onClick={onRetry} className="retry-btn">
        <i className="fas fa-redo"></i>
        Try Again
      </button>
    </div>
  </div>
);

const NoResults = ({ searchQuery, onClearFilters }) => (
  <div className="no-results">
    <div className="no-results-icon">
      <i className="fas fa-search"></i>
    </div>
    <h3>No courses found</h3>
    <p>
      {searchQuery 
        ? `No courses match your search for "${searchQuery}". Try adjusting your search terms or filters.`
        : 'No courses match your current filters. Try adjusting your filters.'
      }
    </p>
    <button onClick={onClearFilters} className="clear-filters-btn">
      Clear All Filters
    </button>
  </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="pagination">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn"
      >
        <i className="fas fa-chevron-left"></i>
        Previous
      </button>
      
      <div className="pagination-numbers">
        {getVisiblePages().map(pageNum => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
          >
            {pageNum}
          </button>
        ))}
      </div>
      
      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-btn"
      >
        Next
        <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );
};

function AllCoursesCards() {
  // State management
  const [state, setState] = useState({
    courseData: [],
    categories: [],
    loading: true,
    error: null,
    searchQuery: '',
    activeFilters: {},
    sortBy: 'popularity',
    currentPage: 1
  });

  // Derived state
  const filteredCourses = useMemo(() => {
    const filtered = filterCourses(state.courseData, state.searchQuery, state.activeFilters);
    return sortCourses(filtered, state.sortBy);
  }, [state.courseData, state.searchQuery, state.activeFilters, state.sortBy]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  
  const paginatedCourses = useMemo(() => {
    const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCourses, state.currentPage]);

  const filterOptions = useMemo(() => 
    createFilterOptions(state.categories, state.courseData), 
    [state.categories, state.courseData]
  );

  // API calls
  const loadCourseData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await coursesAPI.getAllCourses();
      const courses = response.courses || response;
      setState(prev => ({ ...prev, courseData: courses, loading: false }));
    } catch (error) {
      console.error('Error loading courses:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to load courses',
        courseData: [],
        loading: false 
      }));
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await categoriesAPI.getAllCategories();
      setState(prev => ({ ...prev, categories: categoriesData }));
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback categories
      setState(prev => ({ 
        ...prev, 
        categories: [
          { _id: '1', name: 'Programming', courseCount: 15 },
          { _id: '2', name: 'Frontend', courseCount: 8 },
          { _id: '3', name: 'Backend', courseCount: 6 },
          { _id: '4', name: 'Data Science', courseCount: 10 },
          { _id: '5', name: 'Mobile', courseCount: 4 }
        ]
      }));
    }
  }, []);

  // Event handlers
  const handleSearch = useCallback((query) => {
    setState(prev => ({ ...prev, searchQuery: query, currentPage: 1 }));
  }, []);

  const handleFilterChange = useCallback((filters) => {
    setState(prev => ({ ...prev, activeFilters: filters, currentPage: 1 }));
  }, []);

  const handleSortChange = useCallback((newSortBy) => {
    setState(prev => ({ ...prev, sortBy: newSortBy, currentPage: 1 }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setState(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleClearFilters = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      searchQuery: '', 
      activeFilters: {}, 
      sortBy: 'popularity',
      currentPage: 1 
    }));
  }, []);

  const handleRetry = useCallback(() => {
    loadCourseData();
  }, [loadCourseData]);

  // Effects
  useEffect(() => {
    loadCourseData();
    loadCategories();
    
    // Check for global search query from navbar
    const globalQuery = sessionStorage.getItem('globalSearchQuery');
    if (globalQuery) {
      setState(prev => ({ ...prev, searchQuery: globalQuery }));
      sessionStorage.removeItem('globalSearchQuery');
    }
  }, [loadCourseData, loadCategories]);

  // Reset page when filters change
  useEffect(() => {
    if (state.currentPage > totalPages && totalPages > 0) {
      setState(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [totalPages, state.currentPage]);

  // Render loading and error states
  if (state.loading) return <LoadingState />;
  if (state.error) return <ErrorState error={state.error} onRetry={handleRetry} />;

  return (
    <div className="all-courses-cards">
      {/* Header */}
      <div className="cards-header">
        <h1>All Courses</h1>
        <p>Discover our comprehensive collection of courses designed to help you learn and grow</p>
      </div>
      
      {/* Search and Filter */}
      <div className="search-section">
        <SearchBar
          placeholder="Search courses by title, description, instructor, or category..."
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          showFilters={true}
          filterOptions={filterOptions}
          searchType="courses"
          initialQuery={state.searchQuery}
        />
      </div>

      {/* Results Header */}
      <div className="results-header">
        <div className="results-info">
          <p>
            Showing {paginatedCourses.length} of {filteredCourses.length} courses
            {state.searchQuery && (
              <span> for "<strong>{state.searchQuery}</strong>"</span>
            )}
          </p>
        </div>
        
        <div className="sort-section">
          <label htmlFor="sort-select">Sort by:</label>
          <select 
            id="sort-select"
            value={state.sortBy} 
            onChange={(e) => handleSortChange(e.target.value)}
            className="sort-select"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Grid or No Results */}
      {filteredCourses.length > 0 ? (
        <>
          <div className="course-grid">
            {paginatedCourses.map((course) => (
              <div key={course._id} className="course-card-wrapper">
                <CardItem
                  src={course.thumbnail || course.image || '/images/1.png'}
                  text={course.title}
                  label={course.category?.name || course.category_name || 'Course'}
                  path={`/course/${course._id}`}
                  rating={course.rating || 0}
                  reviewCount={course.numReviews || course.reviewCount || 0}
                  estimatedHours={course.duration || course.estimatedHours || '0 hours'}
                  level={course.level || 'Beginner'}
                  price={course.price}
                  originalPrice={course.originalPrice}
                  instructor={course.instructor?.name || 'Unknown Instructor'}
                  enrolledCount={course.enrolledStudents?.length || 0}
                />
              </div>
            ))}
          </div>

          <Pagination 
            currentPage={state.currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <NoResults 
          searchQuery={state.searchQuery}
          onClearFilters={handleClearFilters}
        />
      )}
    </div>
  );
}

export default AllCoursesCards;