import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using the Skilled Labor Platform, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
                <p className="text-muted-foreground">
                  Permission is granted to temporarily use the Skilled Labor Platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on the platform</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
                <p className="text-muted-foreground">
                  You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Job Postings and Applications</h2>
                <p className="text-muted-foreground">
                  Employers are responsible for the accuracy of job postings. Laborers are responsible for the accuracy of their applications. The platform acts as a connection service and is not responsible for the quality of work or payment disputes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Payment Terms</h2>
                <p className="text-muted-foreground">
                  Payment terms are agreed upon between employers and laborers. The platform may charge service fees as disclosed at the time of transaction.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Disclaimers</h2>
                <p className="text-muted-foreground">
                  The materials on the Skilled Labor Platform are provided on an 'as is' basis. The platform makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Limitations</h2>
                <p className="text-muted-foreground">
                  In no event shall the Skilled Labor Platform or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Revisions</h2>
                <p className="text-muted-foreground">
                  The Skilled Labor Platform may revise these terms of service at any time without notice. By using this platform you are agreeing to be bound by the then current version of these terms of service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms of Service, please contact us at support@skilledlabor.com.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;

