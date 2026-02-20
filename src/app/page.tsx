import { getAllJobs } from "./actions";
import HuntButton from "@/components/HuntButton";
import JobsList from "@/components/JobsList";
import ResetButton from "@/components/ResetButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await getAllJobs();

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header mit gemütlichem Grün-Design */}
        <div className="mb-12 pb-8 border-b border-accent-light/30">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-3 tracking-tight">
                Career Sniper
              </h1>
              <p className="text-primary/70 text-lg">
                AI-powered job hunting • Multi-source search • Zero cost
              </p>
            </div>
            <ResetButton />
          </div>
        </div>

        {/* Hunt Control Card */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-border shadow-xl hover:shadow-2xl transition-shadow">
            <h2 className="text-xl font-semibold text-primary mb-6">
              Search Jobs
            </h2>
            <HuntButton />
          </div>
        </div>

        {/* Stats Grid mit Grün-Akzenten */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-border hover:border-accent transition-all hover:shadow-lg">
              <div className="text-4xl font-bold text-primary mb-1">
                {jobs.length}
              </div>
              <div className="text-sm text-primary/60 uppercase tracking-wide">Total</div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-border hover:border-accent transition-all hover:shadow-lg">
              <div className="text-4xl font-bold text-primary mb-1">
                {jobs.filter((j) => j.status === "new").length}
              </div>
              <div className="text-sm text-primary/60 uppercase tracking-wide">New</div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-border hover:border-accent transition-all hover:shadow-lg">
              <div className="text-4xl font-bold text-primary mb-1">
                {jobs.filter((j) => j.status === "shortlisted").length}
              </div>
              <div className="text-sm text-primary/60 uppercase tracking-wide">Shortlisted</div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-border hover:border-accent transition-all hover:shadow-lg">
              <div className="text-4xl font-bold text-primary mb-1">
                {jobs.filter((j) => j.status === "applied").length}
              </div>
              <div className="text-sm text-primary/60 uppercase tracking-wide">Applied</div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="max-w-6xl mx-auto">
          <JobsList jobs={jobs} />
        </div>
      </div>
    </main>
  );
}
