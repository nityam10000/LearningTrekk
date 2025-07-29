import React, { useEffect } from 'react'
import { useNavigate } from "react-router-dom"
import { useAuth } from '../contexts/AuthContext';

const Logout = () => {
    const navigate = useNavigate();
    const { logout, isAuthenticated } = useAuth();
    
    useEffect(() => {
        // Perform logout when component mounts
        logout();
        
        // Redirect to home page after logout
        navigate("/");
    }, [logout, navigate]);

    // This component doesn't render anything visible since it just handles logout
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            flexDirection: 'column'
        }}>
            <h2>Logging out...</h2>
            <p>You have been successfully logged out.</p>
        </div>
    );
}

export default Logout
