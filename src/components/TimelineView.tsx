import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, CheckCircle2, AlertCircle, MapPin, ClipboardList } from 'lucide-react';
import { motion } from 'motion/react';

const STEPS = [
  {
    title: "Voter Registration",
    date: "Current - Oct 2026",
    status: "active",
    description: "Ensure your personal details are up-to-date in the electoral roll.",
    icon: ClipboardList,
  },
  {
    title: "Polling Station Find",
    date: "Oct 2026",
    status: "pending",
    description: "Locate your nearest authorized polling center using the map portal.",
    icon: MapPin,
  },
  {
    title: "Election Day",
    date: "Nov 15, 2026",
    status: "upcoming",
    description: "Vote from 7:00 AM to 6:00 PM. Bring valid national ID.",
    icon: Calendar,
  },
  {
    title: "Results Declaration",
    date: "Nov 20, 2026",
    status: "upcoming",
    description: "Official counting concludes and certified results are published.",
    icon: CheckCircle2,
  },
];

export function TimelineView() {
  return (
    <div className="grid gap-6">
      <Card className="border-zinc-200 shadow-sm rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">Election Timeline</CardTitle>
          <CardDescription>Stay on track with critical dates and deadlines for the upcoming 2026 General Election.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent">
            {STEPS.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-zinc-900 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <step.icon size={18} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <time className="font-mono text-xs font-bold text-zinc-500 uppercase">{step.date}</time>
                    <Badge variant={step.status === 'active' ? "default" : "outline"} className="capitalize rounded-md">
                      {step.status}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold mb-1 text-zinc-900">{step.title}</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4 items-start">
            <AlertCircle className="text-amber-600 shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-amber-900 mb-1">Important Notice</h4>
              <p className="text-sm text-amber-800 leading-relaxed">
                Dates are subject to change by the Electoral Commission. 
                Enable notifications in the VoterWise mobile app to receive real-time updates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
