import '../styles/HeroBanner.css';

function HeroBanner() {
  return (
    <section className="hero">
      <h1>Welcome to Kirt Bank</h1>
      <p>Strength. Security. Stability.</p>
      <div className="hero-buttons">
        <button>Sign Up</button>
        <button>Log In</button>
      </div>
    </section>
  );
}

export default HeroBanner;