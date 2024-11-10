import React from "react";

import Container from "@/components/ui/container";

const PrivacyPolicy: React.FC = () => {
  return (
    <Container>
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="mb-4 text-sm text-gray-600">
        Last updated {new Date().toLocaleDateString()}
      </p>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">
          1. Information We Collect
        </h2>
        <p>
          We collect information you provide directly to us when using our
          services.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">
          2. How We Use Your Information
        </h2>
        <p>
          We use the information we collect to provide, maintain, and improve
          our services.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">
          3. Information Sharing and Disclosure
        </h2>
        <p>
          We do not share your personal information with third parties except as
          described in this policy.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Data Security</h2>
        <p>
          We take reasonable measures to help protect your personal information
          from loss, theft, misuse, and unauthorized access.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">
          5. Changes to This Policy
        </h2>
        <p>
          We may update this privacy policy from time to time. We will notify
          you of any changes by posting the new policy on this page.
        </p>
      </section>

      <p className="mt-8 text-sm text-gray-600">
        © 2024 K-Scale Labs. All Rights Reserved.
      </p>
    </Container>
  );
};

export default PrivacyPolicy;
