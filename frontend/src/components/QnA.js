import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from './Button';
import {
    faAngleDown,
    faAngleUp,
    faPlusSquare,
} from "@fortawesome/free-solid-svg-icons";

const Item = ({ post }) => {
    const [addComment, setaddComment] = useState(false);
    const [comment, setcomment] = useState("");
    const [reviewToggle, setReviewToggle] = useState(false);
    
    const handleChange = (e) => setcomment(e.target.value);
    
    const postComment = () => {
        if (!comment.trim()) {
            alert("Please enter a comment");
            return;
        }
        
        console.log("Comment posted:", comment);
        alert("Comment functionality is disabled in demo mode");
        setcomment("");
        setaddComment(false);
    };
    
    const like = () => {
        alert("Like functionality is disabled in demo mode");
    };
    
    return (
        <>
        <div>
            <div>
                <h5>{post.question}</h5>
                <p>{post.description}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span 
                    style={{ cursor: "pointer", color: "#007bff" }}
                    onClick={like}
                >
                    👍 Like
                </span>
                <span 
                    onClick={() => setaddComment(!addComment)}
                    style={{ cursor: "pointer", color: "#28a745" }}
                >
                    <FontAwesomeIcon
                        className='mr-1'
                        icon={faPlusSquare}
                    />
                    Comment
                </span>
            </div>
            
            {reviewToggle && (
                <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                    <p>Comments feature coming soon!</p>
                </div>
            )}
            
            {addComment && (
                <div className='d-flex flex-row new-comment' style={{ marginTop: "1rem" }}>
                    <div className='flex-grow-1 ml-1 d-flex flex-row justify-content-between'>
                        <input
                            type='text'
                            name='comment'
                            id='comment'
                            placeholder='Add a comment...'
                            onChange={handleChange}
                            className='flex-grow-1 mr-1'
                            value={comment}
                            style={{ padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        <Button onClick={postComment}>Post</Button>
                    </div>
                </div>
            )}
        </div>
        </>
    );
};

export default Item;