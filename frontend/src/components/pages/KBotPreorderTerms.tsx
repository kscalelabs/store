import Container from "@/components/ui/container";

const KBotPreorderTerms = () => {
  return (
    <Container>
      <h1 className="text-3xl font-bold mb-2">K-Bot 0.1 Preorder Terms</h1>
      <p className="mb-4 text-sm text-gray-2">
        Effective Date: November 1, 2024
      </p>
      <p className="mb-4">
        By placing a preorder for K-Bot 0.1 (&ldquo;Product&rdquo;) with dpsh
        Syndicate DBA K-Scale Labs (&ldquo;Company,&rdquo; &ldquo;we,&rdquo;
        &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you (&ldquo;Customer,&rdquo;
        &ldquo;you,&rdquo; or &ldquo;your&rdquo;) agree to the following terms
        and conditions (&ldquo;Preorder Terms&rdquo;):
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          1. Preorder Deposit and Payment Terms
        </h2>
        <p className="mb-4">
          <strong>1.1 Deposit Amount:</strong> To place a preorder, you agree to
          pay a refundable deposit of $500.00 (&ldquo;Deposit&rdquo;).
        </p>
        <p className="mb-4">
          <strong>1.2 Remaining Balance:</strong> The remaining balance of
          $14,500.00 is due upon the Product being ready to ship. This amount
          will be automatically charged to your saved payment method unless
          otherwise specified.
        </p>
        <p className="mb-4">
          <strong>1.3 Payment Authorization:</strong> By placing the preorder,
          you authorize us to charge the remaining balance when the Product is
          ready to ship, as described in Section 1.2.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          2. Refund and Cancellation Policy
        </h2>
        <p className="mb-4">
          <strong>2.1 Refundable Deposit:</strong> The $500.00 deposit is
          refundable upon request, subject to the conditions outlined below:
        </p>
        <ul className="list-disc list-inside mb-4 ml-4">
          <li>
            To request a refund, you must notify us in writing at
            support@kscale.dev
          </li>
          <li>
            Refund requests made within 14 days of placing the preorder will be
            processed without penalty.
          </li>
        </ul>
        <p className="mb-4">
          <strong>2.2 Cancellation by Company:</strong> We reserve the right to
          cancel your preorder at our discretion. In such cases, your deposit
          will be refunded in full.
        </p>
        <p className="mb-4">
          <strong>2.3 Cancellation by Customer:</strong> You may cancel your
          preorder and request a refund of your deposit by providing written
          notice at any time prior to the Product being shipped.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          3. Estimated Delivery Date
        </h2>
        <p className="mb-4">
          <strong>3.1 Estimate Only:</strong> Any delivery date provided for the
          Product is an estimate and subject to change due to production delays,
          regulatory requirements, or other unforeseen factors.
        </p>
        <p className="mb-4">
          <strong>3.2 Notification of Delays:</strong> We will make reasonable
          efforts to inform you of any changes to the estimated delivery date.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          4. Changes to Product Specifications
        </h2>
        <p className="mb-4">
          <strong>4.1 Modifications:</strong> We reserve the right to make
          changes to the Product&apos;s design, features, and specifications as
          necessary. You will be notified of any substantial changes and
          provided an option to cancel your preorder if the changes are
          unacceptable.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">5. Use and Safety</h2>
        <p className="mb-4">
          <strong>5.1 Intended Use:</strong> The Product is provided as an
          experimental kit intended for development, prototyping, or research
          purposes. It is not intended for general consumer use.
        </p>
        <p className="mb-4">
          <strong>5.2 Safety Warning:</strong> You are responsible for using
          appropriate safety gear and following all safety guidelines and
          instructions when using the Product.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          6. Limitation of Liability
        </h2>
        <p className="mb-4">
          <strong>6.1 No Liability for Delays:</strong> We are not liable for
          any delays in the delivery of the Product or any losses or damages
          resulting from such delays.
        </p>
        <p className="mb-4">
          <strong>6.2 Use of Product:</strong> You assume all risks related to
          the use, modification, and operation of the Product. We shall not be
          liable for any damages, injuries, or losses resulting from your use or
          misuse of the Product.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          7. Governing Law and Dispute Resolution
        </h2>
        <p className="mb-4">
          <strong>7.1 Governing Law:</strong> This Agreement shall be governed
          by the laws of the State of New York, without regard to its conflict
          of law principles.
        </p>
        <p className="mb-4">
          <strong>7.2 Dispute Resolution:</strong> Any disputes arising from
          this Agreement shall be resolved through binding arbitration in New
          York, NY, in accordance with the rules of the American Arbitration
          Association.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          8. Modification of Terms
        </h2>
        <p className="mb-4">
          We reserve the right to modify these Preorder Terms at any time. Any
          changes will be communicated to you, and continued placement of your
          preorder will constitute acceptance of the modified terms.
        </p>
      </section>

      <p className="mt-8 text-sm text-gray-600">
        © 2024 K-Scale Labs. All Rights Reserved.
      </p>
    </Container>
  );
};

export default KBotPreorderTerms;
