import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12 px-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-4 py-3 rounded-lg text-sm">
          <strong>Draft Note:</strong> These terms are a startup-safe draft pending review by legal counsel.
        </div>
      </div>

      <div className="space-y-6 text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">1. Acceptance of Terms</h2>
          <p>By accessing and using the Gujarati Global platform, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">2. User Accounts</h2>
          <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">3. Acceptable Use</h2>
          <p>You agree not to engage in any activity that interferes with or disrupts the services. Harassment, hate speech, spam, and illegal activities are strictly prohibited and may result in immediate account termination.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">4. User Content</h2>
          <p>You retain ownership of content you post on Gujarati Global. By posting content, you grant us a non-exclusive license to use, store, and display that content on our platform.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">5. Modifications</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
        </section>
      </div>
    </div>
  );
}
