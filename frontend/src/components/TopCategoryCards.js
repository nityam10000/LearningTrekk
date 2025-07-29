import React from 'react';
import '../css/TopCategoryCards.css';
import TopCategoryCardItem from './TopCategoryCardItem';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';



function TopCategoryCards(props) {

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


  return (
    <div className="cards">
      <h1>Top Categories</h1>
      <br></br>
      <Carousel
        swipeable={false}
        draggable={false}
        showDots={false}
        responsive={responsive}
        ssr={true} // means to render carousel on server-side.
        infinite={true}
        autoPlay={props.deviceType !== "mobile" ? true : false}
        autoPlaySpeed={100000}
        keyBoardControl={true}
        customTransition="all .5"
        transitionDuration={500}
        containerClass="carousel-container"
        removeArrowOnDeviceType={["tablet", "mobile"]}
        deviceType={props.deviceType}
        dotListClass="custom-dot-list-style"
        itemClass="carousel-item-padding-40-px"

      // showDots customDot={<CustomDot />}
      >

        <div><TopCategoryCardItem
          src='images/cat1.png'
          text='Frontend'
          label='Adventure'
          path='/services'
          inCarousel={true}
        /></div>
        <div><TopCategoryCardItem
          src='images/cat2.png'
          text='Programming'
          label='Luxury'
          path='/services'
          inCarousel={true}
        /></div>
        <div><TopCategoryCardItem
          src='images/cat3.png'
          text='Cloud Computing'
          label='Mystery'
          path='/services'
          inCarousel={true}
        /></div>
        <div><TopCategoryCardItem
          src='images/cat4.png'
          text='Backend'
          label='Adventure'
          path='/products'
          inCarousel={true}
        /></div>
        <div>
          <TopCategoryCardItem
            src='images/cat5.png'
            text='AI/ML'
            label=''
            path='/sign-up'
            inCarousel={true}
          />
        </div>

      </Carousel>
      <br></br>
    </div>
  );
}

export default TopCategoryCards;