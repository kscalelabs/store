import Container from "@/components/ui/container";

const Eula = () => {
  return (
    <Container>
      <h1 className="text-3xl font-bold mb-2">
        Software End User License Agreement (EULA)
      </h1>
      <p className="mb-4 text-sm text-gray-2">
        Effective Date: November 1, 2024
      </p>
      <p className="mb-4">
        This End User License Agreement (&ldquo;Agreement&rdquo;) governs the
        use of the open-source software and firmware (collectively,
        &ldquo;Software&rdquo;) provided by dpsh Syndicate DBA K-Scale Labs
        (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
        &ldquo;our&rdquo;) for use with the preassembled experimental robot kits
        (&ldquo;Products&rdquo;). By downloading, accessing, modifying, or using
        the Software, you (&ldquo;User,&rdquo; &ldquo;you,&rdquo; or
        &ldquo;your&rdquo;) agree to be bound by the terms of this Agreement, in
        conjunction with the MIT License.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          1. Open-Source License Terms
        </h2>
        <p className="mb-4">
          <strong>1.1 MIT License:</strong> The Software is licensed under the
          terms of the MIT License. The full text of the MIT License is
          available here.
        </p>
        <p className="mb-4">
          <strong>1.2 Permitted Uses:</strong> You are free to use, copy,
          modify, merge, publish, distribute, sublicense, and/or sell copies of
          the Software, subject to the conditions of the MIT License.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          2. Modification and Redistribution
        </h2>
        <p className="mb-4">
          <strong>2.1 User Modifications:</strong> You are allowed to modify the
          Software as permitted under the MIT License.
        </p>
        <p className="mb-4">
          <strong>2.2 Effect on Support:</strong> Any modifications you make to
          the Software may void any limited support we may offer. We are not
          responsible for any issues arising from modified Software.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          3. Disclaimer of Warranty
        </h2>
        <p className="mb-4 uppercase">
          THE SOFTWARE IS PROVIDED &ldquo;AS IS&rdquo;, WITHOUT WARRANTY OF ANY
          KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
          OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
          BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN
          ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN
          CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
          SOFTWARE.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">4. Indemnification</h2>
        <p className="mb-4">
          You agree to indemnify, defend, and hold harmless the Company and its
          affiliates, officers, directors, employees, and agents from and
          against any claims, damages, losses, liabilities, and expenses
          (including reasonable attorneys&apos; fees) arising out of or related
          to your use or modification of the Software, including but not limited
          to injuries, property damage, or any violation of this Agreement or
          applicable laws.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          5. Intellectual Property Rights
        </h2>
        <p className="mb-4">
          <strong>5.1 Ownership:</strong> The Software, along with all
          associated intellectual property rights, is licensed to you under the
          terms of the MIT License. We retain the copyright and any rights not
          explicitly granted by the MIT License.
        </p>
        <p className="mb-4">
          <strong>5.2 Trademarks:</strong> All trademarks, service marks, logos,
          and trade names associated with the Software are the property of the
          Company or its licensors and are not licensed for use except as
          expressly authorized by us.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          6. Limitation of Liability
        </h2>
        <p className="mb-4">
          To the fullest extent permitted by applicable law, we shall not be
          liable for any direct, indirect, incidental, special, or consequential
          damages arising from or related to the use or modification of the
          Software, even if we have been advised of the possibility of such
          damages.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">7. Termination</h2>
        <p className="mb-4">
          <strong>7.1 Termination by User:</strong> You may terminate this
          Agreement by ceasing all use of the Software and destroying any copies
          in your possession or control.
        </p>
        <p className="mb-4">
          <strong>7.2 Termination by Company:</strong> We may terminate this
          Agreement immediately if you violate any terms of this Agreement or
          the MIT License. Upon termination, you must cease all use of the
          Software and destroy all copies.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">8. Governing Law</h2>
        <p className="mb-4">
          This Agreement shall be governed by and construed in accordance with
          the laws of the State of New York, without regard to its conflict of
          law principles.
        </p>
      </section>

      <p className="mt-8 text-sm text-gray-600">
        © 2024 K-Scale Labs. All Rights Reserved.
      </p>
    </Container>
  );
};

export default Eula;
