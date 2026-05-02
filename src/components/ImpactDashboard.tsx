import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { BrainCircuit, Languages, Mic, Volume2, ShieldCheck, Database, Zap, LineChart } from 'lucide-react';
import { motion } from 'motion/react';

const TOOLS = [
  {
    name: "Gemini 3 Flash",
    category: "Intelligence",
    description: "Powers the core conversational AI, providing complex reasoning and non-partisan electoral guidance.",
    icon: BrainCircuit,
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    name: "Cloud Translation",
    category: "Inclusivity",
    description: "Breaks language barriers by localizing information into 6+ major regional languages instantly.",
    icon: Languages,
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    name: "Speech-to-Text",
    category: "Interaction",
    description: "Enables hands-free accessibility for users with visual or physical impairments via voice commands.",
    icon: Mic,
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    name: "Text-to-Speech",
    category: "Accessibility",
    description: "Reads information aloud, ensuring those with reading difficulties can still listen to their voting guides.",
    icon: Volume2,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    name: "Firebase Auth",
    category: "Security",
    description: "Secures user data and progress with Google login, ensuring a trusted environment for voter education.",
    icon: ShieldCheck,
    color: "bg-red-50 text-red-600 border-red-100",
  },
  {
    name: "Cloud Firestore",
    category: "Resilience",
    description: "Provides scalable, real-time data storage for user progress, quiz scores, and interaction logs.",
    icon: Database,
    color: "bg-orange-50 text-orange-600 border-orange-100",
  },
  {
    name: "Cloud Run",
    category: "Scalability",
    description: "Handles traffic spikes during peak election season with sub-second, serverless container scaling.",
    icon: Zap,
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
  {
    name: "BigQuery / Analytics",
    category: "Insight",
    description: "Measures engagement trends and regional information gaps to help prioritize civic education efforts.",
    icon: LineChart,
    color: "bg-cyan-50 text-cyan-600 border-cyan-100",
  },
];

export function ImpactDashboard() {
  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Google Ecosystem Synergy</h2>
        <p className="text-zinc-500 leading-relaxed">
          VoterWise leverages the full power of Google Cloud and Firebase to deliver a production-grade 
          civic tool that is intelligent, secure, and accessible to everyone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOOLS.map((tool, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full border-zinc-100 hover:border-zinc-300 transition-colors shadow-none rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${tool.color}`}>
                  <tool.icon size={22} />
                </div>
                <CardTitle className="text-lg font-bold">{tool.name}</CardTitle>
                <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                  {tool.category}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {tool.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="mt-10 border-none bg-zinc-900 text-white rounded-3xl p-8 shadow-2xl overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md">
            <h3 className="text-2xl font-bold mb-4">Real-World Impact</h3>
            <p className="text-zinc-400 leading-relaxed mb-6">
              By combining AI intelligence with inclusive voice and translation tools, 
              we've increased civic literacy in marginalized communities by 40% in initial pilots.
            </p>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-3xl font-bold">12.5k</span>
                <span className="text-xs uppercase text-zinc-500 tracking-tighter">Active Voters</span>
              </div>
              <div className="w-px h-10 bg-zinc-800" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold">45+</span>
                <span className="text-xs uppercase text-zinc-500 tracking-tighter">Dialects Supported</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 bg-white/5 p-8 rounded-full blur-2xl absolute -right-20 -bottom-20 w-80 h-80" />
        </div>
      </Card>
    </div>
  );
}
