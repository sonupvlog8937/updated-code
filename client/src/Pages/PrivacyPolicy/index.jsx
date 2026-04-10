import React from "react";

const PrivacyPolicy = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.date}>Effective Date: 17/03/26</p>

        <section>
          <h2>1. Information We Collect</h2>
          <ul>
            <li>Personal Information (Name: Sonu Prjapati, Email: sonupvlog8937@gmail.com, Phone Number: 8969737537)</li>
            <li>Login Details (OTP authentication)</li>
            <li>Device Information (Device type, OS version)</li>
            <li>Usage Data (App activity, pages visited)</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>Provide and improve services</li>
            <li>Process orders and transactions</li>
            <li>Send OTP for login</li>
            <li>Customer support</li>
          </ul>
        </section>

        <section>
          <h2>3. Sharing of Information</h2>
          <p>
            We do NOT sell your personal data. We may share data with payment
            gateways, delivery partners, or legal authorities if required.
          </p>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>We use industry-standard security measures to protect your data.</p>
        </section>

        <section>
          <h2>5. Cookies & Tracking</h2>
          <p>We may use cookies to improve user experience.</p>
        </section>

        <section>
          <h2>6. Third-Party Services</h2>
          <ul>
            <li>Google Analytics</li>
            <li>Payment providers</li>
          </ul>
        </section>

        <section>
          <h2>7. User Rights</h2>
          <ul>
            <li>Request data deletion</li>
            <li>Update personal info</li>
          </ul>
        </section>

        <section>
          <h2>8. Children’s Privacy</h2>
          <p>Not intended for children under 13.</p>
        </section>

        <section>
          <h2>9. Changes to Policy</h2>
          <p>We may update this policy anytime.</p>
        </section>

        <section>
          <h2>10. Contact Us</h2>
          <p>Email: sonupvlog8937@gmail.com</p>
        </section>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  card: {
    maxWidth: "800px",
    width: "100%",
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    lineHeight: "1.6",
  },
  title: {
    textAlign: "center",
    marginBottom: "10px",
  },
  date: {
    textAlign: "center",
    color: "gray",
    marginBottom: "20px",
  },
};

export default PrivacyPolicy;