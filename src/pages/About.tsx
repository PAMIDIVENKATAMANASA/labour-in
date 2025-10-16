import Navbar from "@/components/Navbar";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">About Skilled Labor</h1>
        <p className="text-muted-foreground max-w-2xl">
          This platform connects local employers with skilled laborers. Browse jobs, post
          opportunities, and manage applications seamlessly.
        </p>
      </div>
    </div>
  );
};

export default About;


