import '../styles/CustomerReviews.css';

function CustomerReviews() {
  const reviews = [
    { name: 'John D.', text: 'Great banking experience, very secure!' },
    { name: 'Sarah M.', text: 'Love the easy transfers and support.' },
  ];

  return (
    <section className="reviews">
      <h2>Customer Reviews</h2>
      <div className="reviews-list">
        {reviews.map((review, index) => (
          <div key={index} className="review-card">
            <p>"{review.text}"</p>
            <p>- {review.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CustomerReviews;