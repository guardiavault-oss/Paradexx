import { motion } from "framer-motion";
import { 
  Bell,
  Globe,
  Key,
  Database,
  Smartphone,
  Cloud,
  RefreshCw,
  Award
} from "lucide-react";

const additionalFeatures = [
  {
    icon: Smartphone,
    title: "Mobile Access",
    description: "Full functionality on any device",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Email, SMS, and in-app alerts",
  },
  {
    icon: Database,
    title: "On-Chain Backup",
    description: "Decentralized data redundancy",
  },
  {
    icon: Globe,
    title: "Global Accessibility",
    description: "Available in 150+ countries",
  },
  {
    icon: Key,
    title: "Non-Custodial",
    description: "You control your keys always",
  },
  {
    icon: RefreshCw,
    title: "Auto-Updates",
    description: "Always get latest security patches",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description: "Access from multiple devices",
  },
  {
    icon: Award,
    title: "Compliance Ready",
    description: "Meet regulatory requirements",
  },
];

export default function MarqueeSection() {
  return (
    <section className="relative py-12 overflow-hidden">

      <div className="relative z-10">
        {/* Marquee Row 1 - Scrolls Right */}
        <motion.div 
          className="flex mb-6"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            x: {
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          <div className="flex gap-6 pr-6">
            {[...additionalFeatures.slice(0, 4), ...additionalFeatures.slice(0, 4)].map((feature, index) => (
              <motion.div
                key={`${feature.title}-${index}`}
                whileHover={{ scale: 1.05 }}
                className="flex-shrink-0 w-64 p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl group hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-colors">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-semibold">{feature.title}</h4>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex gap-6 pr-6">
            {[...additionalFeatures.slice(0, 4), ...additionalFeatures.slice(0, 4)].map((feature, index) => (
              <motion.div
                key={`${feature.title}-${index}-duplicate`}
                whileHover={{ scale: 1.05 }}
                className="flex-shrink-0 w-64 p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl group hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-colors">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-semibold">{feature.title}</h4>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Marquee Row 2 - Scrolls Left */}
        <motion.div 
          className="flex"
          animate={{ x: ["-50%", "0%"] }}
          transition={{
            x: {
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          <div className="flex gap-6 pr-6">
            {[...additionalFeatures.slice(4, 8), ...additionalFeatures.slice(4, 8)].map((feature, index) => (
              <motion.div
                key={`${feature.title}-${index}-row2`}
                whileHover={{ scale: 1.05 }}
                className="flex-shrink-0 w-64 p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl group hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 group-hover:from-cyan-500/30 group-hover:to-emerald-500/30 transition-colors">
                    <feature.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-semibold">{feature.title}</h4>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex gap-6 pr-6">
            {[...additionalFeatures.slice(4, 8), ...additionalFeatures.slice(4, 8)].map((feature, index) => (
              <motion.div
                key={`${feature.title}-${index}-row2-duplicate`}
                whileHover={{ scale: 1.05 }}
                className="flex-shrink-0 w-64 p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl group hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 group-hover:from-cyan-500/30 group-hover:to-emerald-500/30 transition-colors">
                    <feature.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-semibold">{feature.title}</h4>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
