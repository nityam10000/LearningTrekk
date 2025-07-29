import Login from './components/Login'
import Logout from './components/Logout'
import Signup from './components/Signup'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import NotificationContainer from './components/NotificationContainer'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Home from './components/pages/Home';
import Courses from './components/pages/Courses';
import Blog from './components/pages/Blog';
import CourseDemo from './components/pages/CourseDemo';
import CourseDetail from './components/pages/CourseDetail';
import MyAccount from './components/pages/MyAccount'
import InstructorDashboard from './components/pages/InstructorDashboard';
import CreateCourse from './components/pages/CreateCourse';
import CreateBlog from './components/pages/CreateBlog';
import BlogDetail from './components/pages/BlogDetail';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Suspense, lazy } from 'react';
import './App.css';

// Loading component for better UX
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    flexDirection: 'column'
  }}>
    <div style={{
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #007bff',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      animation: 'spin 1s linear infinite'
    }}></div>
    <p style={{ marginTop: '20px', color: '#666' }}>Loading...</p>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Not Found Component
const NotFound = () => (
  <div style={{
    textAlign: 'center',
    padding: '80px 20px',
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <h1 style={{ fontSize: '72px', color: '#007bff', margin: '0' }}>404</h1>
    <h2 style={{ color: '#333', marginBottom: '16px' }}>Page Not Found</h2>
    <p style={{ color: '#666', marginBottom: '32px' }}>
      The page you're looking for doesn't exist or has been moved.
    </p>
    <button
      onClick={() => window.history.back()}
      style={{
        padding: '12px 24px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        marginRight: '12px'
      }}
    >
      Go Back
    </button>
    <a 
      href="/" 
      style={{
        padding: '12px 24px',
        backgroundColor: '#6c757d',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '6px'
      }}
    >
      Go Home
    </a>
  </div>
);

// Layout component to conditionally render navbar and footer
const Layout = ({ children }) => {
  const location = useLocation();
  const authPages = ['/login', '/signup'];
  const isAuthPage = authPages.includes(location.pathname);

  return (
    <>
      {!isAuthPage && <Navbar />}
      <NotificationContainer />
      {children}
      {!isAuthPage && <Footer />}
    </>
  );
};

const App = () => {
  return (
    <div className='App'>
      <ErrorBoundary>
        <NotificationProvider>
          <AuthProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path='/courses' element={<Courses />} />
                    <Route path='/course/:id' element={<CourseDetail />} />
                    <Route path='/course_content' element={<CourseDemo />} />
                    <Route path='/blog' element={<Blog />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/signup' element={<Signup />} />
                    <Route path='/logout' element={<Logout />} />
                    
                    {/* Protected Routes */}
                    <Route 
                      path='/myaccount' 
                      element={
                        <ProtectedRoute>
                          <MyAccount />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path='/instructor/dashboard' 
                      element={
                        <ProtectedRoute>
                          <InstructorDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path='/instructor/mycourses' 
                      element={
                        <ProtectedRoute>
                          <InstructorDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path='/instructor/create-course' 
                      element={
                        <ProtectedRoute requiredRole="instructor">
                          <CreateCourse />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path='/instructor/edit-course/:id' 
                      element={
                        <ProtectedRoute requiredRole="instructor">
                          <CreateCourse />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path='/instructor/create-blog' 
                      element={
                        <ProtectedRoute requiredRole="instructor">
                          <CreateBlog />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path='/instructor/edit-blog/:id' 
                      element={
                        <ProtectedRoute requiredRole="instructor">
                          <CreateBlog />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path='/blog/:id' 
                      element={<BlogDetail />} 
                    />
                    
                    {/* Catch all route for 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </Layout>
            </Router>
          </AuthProvider>
        </NotificationProvider>
      </ErrorBoundary>
      
      {/* Add spinner CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;