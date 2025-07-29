const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Simple cache implementation
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get auth token
const getAuthToken = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('user-info'));
    // Handle different token formats from the auth system
    if (userInfo?.token) {
      // If token is an object with nested token
      if (typeof userInfo.token === 'object' && userInfo.token.token) {
        return userInfo.token.token;
      }
      // If token is directly the string
      if (typeof userInfo.token === 'string') {
        return userInfo.token;
      }
    }
    // Fallback: check if the entire userInfo is the token
    if (userInfo?._id && userInfo?.email) {
      // This means userInfo contains user data directly, look for token property
      return userInfo.token;
    }
    return null;
  } catch (error) {
    console.error('Error extracting auth token:', error);
    return null;
  }
};

// Helper function to check if user is online
const isOnline = () => navigator.onLine;

// Helper function to create cache key
const createCacheKey = (endpoint, options) => {
  return `${endpoint}_${JSON.stringify(options?.body || '')}_${options?.method || 'GET'}`;
};

// Helper function to get from cache
const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

// Helper function to set cache
const setCache = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Helper function to make API requests with retry and error handling
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  const maxRetries = options.retry !== false ? 3 : 0;
  const useCache = options.cache !== false && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE';
  
  // Check cache first for GET requests
  if (useCache && (!options.method || options.method === 'GET')) {
    const cacheKey = createCacheKey(endpoint, options);
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Remove custom options that shouldn't be passed to fetch
  delete config.retry;
  delete config.cache;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if offline
      if (!isOnline()) {
        throw new Error('You are offline. Please check your internet connection.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      if (!response.ok) {
        // Handle specific HTTP status codes
        switch (response.status) {
          case 401:
            // Unauthorized - clear stored auth data
            localStorage.removeItem('user-info');
            window.dispatchEvent(new CustomEvent('auth-expired'));
            throw new Error('Session expired. Please log in again.');
          case 403:
            throw new Error('You do not have permission to perform this action.');
          case 404:
            throw new Error('The requested resource was not found.');
          case 422:
            throw new Error(data.message || 'Invalid data provided.');
          case 429:
            throw new Error('Too many requests. Please try again later.');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(data.message || data || 'Something went wrong');
        }
      }

      // Cache successful GET requests
      if (useCache && (!options.method || options.method === 'GET')) {
        const cacheKey = createCacheKey(endpoint, options);
        setCache(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      lastError = error;
      
      // Don't retry for certain errors
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      
      if (error.message.includes('offline') || 
          error.message.includes('Session expired') ||
          error.message.includes('permission') ||
          error.message.includes('404')) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError || new Error('Request failed after multiple attempts');
};

// Mock data fallback for when API is unavailable
const getMockData = (endpoint) => {
  const mockData = {
    '/courses': [
      {
        _id: '1',
        title: "Introduction to Web Development",
        category: { name: "Programming" },
        thumbnail: "/images/1.png",
        description: "Learn the basics of HTML, CSS, and JavaScript",
        level: "Beginner",
        price: 49.99,
        originalPrice: 99.99,
        rating: 4.5,
        numReviews: 1250,
        instructor: { name: "Sarah Johnson", avatar: "/images/instructor1.png" },
        enrolledStudents: [1,2,3,4,5],
        duration: "8 hours",
        isPublished: true
      },
      {
        _id: '2',
        title: "React for Beginners",
        category: { name: "Frontend" },
        thumbnail: "/images/2.png",
        description: "Master React.js from the ground up",
        level: "Beginner",
        price: 79.99,
        originalPrice: 149.99,
        rating: 4.7,
        numReviews: 2340,
        instructor: { name: "Mike Chen", avatar: "/images/instructor2.png" },
        enrolledStudents: [1,2,3],
        duration: "12 hours",
        isPublished: true
      }
    ],
    '/categories': [
      { _id: '1', name: 'Programming', courseCount: 15 },
      { _id: '2', name: 'Frontend', courseCount: 8 },
      { _id: '3', name: 'Backend', courseCount: 6 },
      { _id: '4', name: 'Data Science', courseCount: 10 },
      { _id: '5', name: 'Mobile', courseCount: 4 }
    ]
  };
  
  return mockData[endpoint] || null;
};

// Enhanced API request with fallback
const apiRequestWithFallback = async (endpoint, options = {}) => {
  try {
    return await apiRequest(endpoint, options);
  } catch (error) {
    console.warn(`API request failed for ${endpoint}:`, error.message);
    
    // Log detailed error information for debugging
    console.error('Full error details:', {
      endpoint,
      options,
      error: error.message,
      status: error.status,
      headers: options.headers
    });
    
    // Use mock data as fallback for GET requests
    if ((!options.method || options.method === 'GET') && options.fallback !== false) {
      const mockData = getMockData(endpoint);
      if (mockData) {
        console.info(`Using mock data for ${endpoint}`);
        return mockData;
      }
    }
    
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      cache: false
    });
  },

  register: async (userData) => {
    // Handle both old and new function signatures
    if (typeof userData === 'string') {
      const [name, email, password, role = 'student'] = arguments;
      userData = { name, email, password, role };
    }
    
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      cache: false
    });
  },

  getProfile: async () => {
    return apiRequest('/auth/me', { cache: false });
  },
};

// Courses API functions
export const coursesAPI = {
  getAllCourses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/courses?${queryString}` : '/courses';
    return apiRequestWithFallback(endpoint);
  },

  getCourseById: async (id) => {
    try {
      return await apiRequest(`/courses/${id}`);
    } catch (error) {
      // Fallback to mock data
      const mockCourses = getMockData('/courses');
      const course = mockCourses?.find(c => c._id === id);
      if (course) {
        return course;
      }
      throw error;
    }
  },

  createCourse: async (courseData) => {
    return apiRequest('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
      cache: false
    });
  },

  updateCourse: async (id, courseData) => {
    return apiRequest(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
      cache: false
    });
  },

  getInstructorCourses: async () => {
    try {
      return await apiRequest('/courses/instructor/my-courses');
    } catch (error) {
      // Return empty array as fallback
      console.warn('Failed to load instructor courses:', error.message);
      return [];
    }
  },

  addReview: async (courseId, rating, comment) => {
    return apiRequest(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
      cache: false
    });
  },
};

// Categories API functions
export const categoriesAPI = {
  getAllCategories: async () => {
    return apiRequestWithFallback('/categories');
  },

  getCategoryById: async (id) => {
    try {
      return await apiRequest(`/categories/${id}`);
    } catch (error) {
      const mockCategories = getMockData('/categories');
      const category = mockCategories?.find(c => c._id === id);
      if (category) {
        return { category, courses: [] };
      }
      throw error;
    }
  },
};

// Enrollments API functions
export const enrollmentsAPI = {
  enrollInCourse: async (courseId) => {
    return apiRequest('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
      cache: false
    });
  },

  getUserEnrollments: async () => {
    try {
      return await apiRequest('/enrollments');
    } catch (error) {
      console.warn('Failed to load enrollments:', error.message);
      return [];
    }
  },

  updateProgress: async (enrollmentId, lessonId) => {
    return apiRequest(`/enrollments/${enrollmentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ lessonId }),
      cache: false
    });
  },
};

// Users API functions
export const usersAPI = {
  updateProfile: async (profileData) => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
      cache: false
    });
  },

  getUserById: async (id) => {
    return apiRequest(`/users/${id}`);
  },
};

// Blogs API functions
export const blogsAPI = {
  getAllBlogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/blogs?${queryString}` : '/blogs';
    
    try {
      return await apiRequest(endpoint);
    } catch (error) {
      console.warn('Blogs API failed, using fallback data:', error.message);
      
      // Return mock blog data as fallback
      const mockBlogs = [
        {
          _id: 'mock-blog-1',
          title: '10 Essential Programming Tips for Beginners',
          category: { name: 'Programming' },
          image: '/images/1.png',
          excerpt: 'Master the fundamentals with these essential programming tips that every beginner should know.',
          author: { name: 'Tech Mentor', avatar: '/images/instructor1.png' },
          publishedDate: new Date('2025-07-25').toISOString(),
          createdAt: new Date('2025-07-25').toISOString(),
          readTime: 5,
          isPublished: true,
          views: 245,
          likes: 15,
          tags: ['programming', 'beginners', 'tips']
        },
        {
          _id: 'mock-blog-2',
          title: 'The Future of Web Development in 2025',
          category: { name: 'Web Development' },
          image: '/images/2.png',
          excerpt: 'Explore the latest trends and technologies shaping web development in 2025.',
          author: { name: 'Future Dev', avatar: '/images/instructor2.png' },
          publishedDate: new Date('2025-07-24').toISOString(),
          createdAt: new Date('2025-07-24').toISOString(),
          readTime: 8,
          isPublished: true,
          views: 189,
          likes: 23,
          tags: ['web development', 'trends', '2025']
        },
        {
          _id: 'mock-blog-3',
          title: 'React vs Vue: Which Framework to Choose?',
          category: { name: 'Frontend' },
          image: '/images/3.png',
          excerpt: 'A comprehensive comparison of React and Vue to help you make the right choice.',
          author: { name: 'Frontend Expert', avatar: '/images/instructor1.png' },
          publishedDate: new Date('2025-07-23').toISOString(),
          createdAt: new Date('2025-07-23').toISOString(),
          readTime: 6,
          isPublished: true,
          views: 312,
          likes: 45,
          tags: ['react', 'vue', 'frontend', 'comparison']
        },
        {
          _id: 'mock-blog-4',
          title: 'Building Scalable Node.js Applications',
          category: { name: 'Backend' },
          image: '/images/4.png',
          excerpt: 'Learn best practices for building scalable and maintainable Node.js applications.',
          author: { name: 'Backend Guru', avatar: '/images/instructor2.png' },
          publishedDate: new Date('2025-07-22').toISOString(),
          createdAt: new Date('2025-07-22').toISOString(),
          readTime: 10,
          isPublished: true,
          views: 156,
          likes: 28,
          tags: ['nodejs', 'backend', 'scalability']
        },
        {
          _id: 'mock-blog-5',
          title: 'Machine Learning for Developers: Getting Started',
          category: { name: 'AI/ML' },
          image: '/images/5.png',
          excerpt: 'Your complete guide to getting started with machine learning as a developer.',
          author: { name: 'AI Specialist', avatar: '/images/instructor1.png' },
          publishedDate: new Date('2025-07-21').toISOString(),
          createdAt: new Date('2025-07-21').toISOString(),
          readTime: 12,
          isPublished: true,
          views: 287,
          likes: 52,
          tags: ['machine learning', 'ai', 'developers']
        },
        {
          _id: 'mock-blog-6',
          title: 'Cloud Computing Best Practices for 2025',
          category: { name: 'Cloud Computing' },
          image: '/images/6.png',
          excerpt: 'Essential cloud computing practices every developer should follow in 2025.',
          author: { name: 'Cloud Architect', avatar: '/images/instructor2.png' },
          publishedDate: new Date('2025-07-20').toISOString(),
          createdAt: new Date('2025-07-20').toISOString(),
          readTime: 7,
          isPublished: true,
          views: 203,
          likes: 34,
          tags: ['cloud computing', 'best practices', 'aws']
        }
      ];
      
      // Return in the same format as the real API
      return {
        blogs: mockBlogs,
        totalPages: 1,
        currentPage: 1,
        total: mockBlogs.length
      };
    }
  },

  getBlogById: async (id) => {
    try {
      return await apiRequest(`/blogs/${id}`);
    } catch (error) {
      // Fallback to mock data if needed
      console.warn('Failed to load blog:', error.message);
      throw error;
    }
  },

  createBlog: async (blogData) => {
    return apiRequest('/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData),
      cache: false
    });
  },

  updateBlog: async (id, blogData) => {
    return apiRequest(`/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(blogData),
      cache: false
    });
  },

  deleteBlog: async (id) => {
    return apiRequest(`/blogs/${id}`, {
      method: 'DELETE',
      cache: false
    });
  },

  getInstructorBlogs: async () => {
    try {
      return await apiRequest('/blogs/instructor/my-blogs');
    } catch (error) {
      console.warn('Failed to load instructor blogs:', error.message);
      return [];
    }
  },

  likeBlog: async (id) => {
    return apiRequest(`/blogs/${id}/like`, {
      method: 'POST',
      cache: false
    });
  },

  addComment: async (id, comment) => {
    return apiRequest(`/blogs/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
      cache: false
    });
  }
};

// Utility functions
export const clearCache = () => {
  cache.clear();
};

export const clearAuthCache = () => {
  // Clear only auth-related cache entries
  for (const [key] of cache) {
    if (key.includes('/auth/') || key.includes('/users/')) {
      cache.delete(key);
    }
  }
};

// Listen for auth expiration events
if (typeof window !== 'undefined') {
  window.addEventListener('auth-expired', () => {
    clearCache();
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  });
}

export default {
  authAPI,
  coursesAPI,
  categoriesAPI,
  enrollmentsAPI,
  usersAPI,
  blogsAPI,
  clearCache,
  clearAuthCache,
};