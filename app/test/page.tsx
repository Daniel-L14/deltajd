import RecommendationWizard from "@/app/components/recommendation/RecommendationWizard";
import Navbar from "@/app/components/layout/Navbar";

export default function TestPage() {
  return (
    <div className="delta-frame min-h-screen">
      <Navbar />
      <main className="delta-container max-w-6xl py-10 sm:py-14">
        <RecommendationWizard />
      </main>
    </div>
  );
}
