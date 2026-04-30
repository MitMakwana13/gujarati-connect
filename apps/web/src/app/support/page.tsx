import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support',
};

export default function SupportPage() {
  return (
    <div className="container max-w-3xl py-12 px-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Support & Contact</h1>
        <p className="text-lg text-gray-400">We're here to help you get the most out of the Gujarati Global community.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-12">
        <div className="card p-6 bg-surface border border-border rounded-xl">
          <h3 className="text-xl font-semibold mb-2">General Support</h3>
          <p className="text-gray-400 mb-4 text-sm">For account issues, general questions, and data deletion requests.</p>
          <a href="mailto:support@gujaratiglobal.com" className="text-brand-saffron font-medium hover:underline">support@gujaratiglobal.com</a>
        </div>

        <div className="card p-6 bg-surface border border-border rounded-xl">
          <h3 className="text-xl font-semibold mb-2">Bug Reports</h3>
          <p className="text-gray-400 mb-4 text-sm">Found an issue? Please include device info and steps to reproduce.</p>
          <a href="mailto:bugs@gujaratiglobal.com" className="text-brand-indigo font-medium hover:underline">bugs@gujaratiglobal.com</a>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-3">Response Expectation</h2>
          <p className="text-gray-300">As a community platform currently in beta, our support team operates during standard business hours (EST). We aim to respond to all inquiries within 24-48 hours. Critical platform issues are monitored 24/7.</p>
        </section>

        <section className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-red-500 mb-3">Emergency & Abuse Reporting</h2>
          <p className="text-gray-300 mb-4">If you encounter abusive behavior, harassment, or a severe safety concern, please use the in-app reporting tools on the specific post or profile. For immediate escalation, email our safety team directly.</p>
          <p className="font-medium text-white">Safety Team: <a href="mailto:safety@gujaratiglobal.com" className="text-red-400 hover:underline">safety@gujaratiglobal.com</a></p>
        </section>
      </div>
    </div>
  );
}
