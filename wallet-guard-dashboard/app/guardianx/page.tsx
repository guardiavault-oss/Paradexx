'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { 
  Shield, 
  Brain, 
  Zap, 
  Eye, 
  Lock, 
  Code, 
  Users, 
  CheckCircle2,
  ArrowRight,
  Play,
  Sparkles,
  Cpu,
  Network,
  FileCode,
  Layers
} from 'lucide-react'
import AnimatedShield from './components/AnimatedShield'
import ParticleField from './components/ParticleField'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function GuardianXLanding() {
  const heroRef = useRef<HTMLDivElement>(null)
  const shieldRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Mouse tracking for parallax effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Animated shield background
    if (shieldRef.current) {
      const shield = shieldRef.current
      gsap.to(shield, {
        scale: 1.1,
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: 'none'
      })

      // Pulsing effect
      gsap.to(shield, {
        opacity: 0.6,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <HeroSection 
        shieldRef={shieldRef}
        mousePosition={mousePosition}
      />

      {/* Section 2: ML Engine */}
      <MLEngineSection />

      {/* Section 3: Transaction Rewriting */}
      <RewritingSection />

      {/* Section 4: Mempool Defense */}
      <MempoolDefenseSection />

      {/* Section 5: Guardian Contracts */}
      <GuardianContractsSection />

      {/* Section 6: Protection Pipeline */}
      <PipelineSection />

      {/* Section 7: Why This Changes Everything */}
      <IndustryChangeSection />

      {/* Section 8: Plugin Ecosystem */}
      <PluginEcosystemSection />

      {/* Section 9: For Users Who Refuse */}
      <UsersSection />

      {/* Section 10: Social Proof */}
      <SocialProofSection />

      {/* Section 11: CTA */}
      <CTASection />
    </div>
  )
}

// Hero Section Component
interface HeroSectionProps {
  shieldRef: React.RefObject<HTMLDivElement>
  mousePosition: { x: number; y: number }
}

const HeroSection = ({ shieldRef, mousePosition }: HeroSectionProps) => {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <motion.section 
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(circle at center, rgba(0, 212, 255, 0.1) 0%, transparent 70%)'
      }}
    >
      {/* Particle Field */}
      <ParticleField count={30} color="#00D4FF" />

      {/* Animated Shield Background */}
      <div
        ref={shieldRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="relative w-[600px] h-[600px]">
          <AnimatedShield mousePosition={mousePosition} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-200 to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Your Wallet Has Evolved.
          </motion.h1>

          <motion.h2
            className="text-3xl md:text-5xl font-bold mb-8 text-cyan-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Meet the First AI Wallet That Fights Back.
          </motion.h2>

          <motion.p
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            GuardianX rewrites dangerous transactions, blocks attacks on-chain, learns your habits, and routes everything through a private mempool.
            <br />
            <span className="text-cyan-400 font-semibold">
              Not a plugin. Not a browser extension.
            </span>
            <br />
            <span className="text-white font-bold">
              A fully autonomous defense system.
            </span>
          </motion.p>

          {/* Feature Pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {[
              { icon: Shield, text: 'Stops exploits before they execute' },
              { icon: Brain, text: 'Learns your behavior privately' },
              { icon: Zap, text: 'Neutralizes malicious contracts' },
              { icon: Eye, text: 'Invisible to MEV attackers' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md border border-cyan-500/30 rounded-full"
                whileHover={{ scale: 1.05, borderColor: '#00D4FF' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <feature.icon className="w-5 h-5 text-cyan-400" />
                <span className="text-sm md:text-base">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            className="text-lg text-gray-400 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            Crypto finally has a firewall. And it lives on your device.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <motion.button
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-lg flex items-center gap-2 group"
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 212, 255, 0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              Get Early Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              className="px-8 py-4 bg-black/50 backdrop-blur-md border-2 border-cyan-500/50 rounded-xl font-bold text-lg flex items-center gap-2 group"
              whileHover={{ scale: 1.05, borderColor: '#00D4FF' }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-cyan-400 rounded-full flex justify-center">
          <motion.div
            className="w-1 h-3 bg-cyan-400 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </motion.section>
  )
}

// ML Engine Section
const MLEngineSection = () => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (isInView && ref.current) {
      gsap.fromTo(
        ref.current.querySelectorAll('.ml-feature'),
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out'
        }
      )
    }
  }, [isInView])

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-4 py-20 relative"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(10,10,20,1) 100%)'
      }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-semibold">SECTION 2</span>
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent">
            The First Wallet With a Real Brain
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            On-Device ML Risk Engine
          </h3>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Your wallet now thinks. And it learns you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            className="ml-feature p-8 bg-black/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl"
            whileHover={{ borderColor: '#00D4FF', scale: 1.02 }}
          >
            <Cpu className="w-12 h-12 text-cyan-400 mb-4" />
            <h4 className="text-2xl font-bold mb-4">100% On-Device</h4>
            <p className="text-gray-300 leading-relaxed">
              GuardianX runs a real-time ML model directly on your device — not a server — meaning your habits, spending patterns, risk tolerance, and transaction behavior are private forever.
            </p>
          </motion.div>

          <motion.div
            className="ml-feature p-8 bg-black/40 backdrop-blur-md border border-purple-500/20 rounded-2xl"
            whileHover={{ borderColor: '#8B5CF6', scale: 1.02 }}
          >
            <Brain className="w-12 h-12 text-purple-400 mb-4" />
            <h4 className="text-2xl font-bold mb-4">Habit Learning</h4>
            <p className="text-gray-300 leading-relaxed">
              The AI learns your transaction patterns, typical amounts, trusted recipients, and risk tolerance. Every decision makes it smarter.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            'Abnormal approvals',
            'Swap patterns',
            'Risky contracts',
            'Unusual routing',
            'Value spikes',
            'New exploit signatures'
          ].map((item, i) => (
            <motion.div
              key={i}
              className="ml-feature p-6 bg-black/30 border border-cyan-500/10 rounded-xl"
              whileHover={{ borderColor: '#00D4FF', backgroundColor: 'rgba(0, 212, 255, 0.1)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                <span className="text-gray-300">{item}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-2xl font-bold text-cyan-400 mb-8">
            → No other wallet on Earth ships on-device behavioral ML.
          </p>
          <motion.button
            className="px-8 py-4 bg-cyan-500/20 border-2 border-cyan-500 rounded-xl font-bold text-lg"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(0, 212, 255, 0.3)' }}
          >
            See the ML Engine
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

// Rewriting Section
const RewritingSection = () => {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 3
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Zap className="w-5 h-5 text-orange-400" />
            <span className="text-orange-400 font-semibold">SECTION 3</span>
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Rewrites Dangerous Transactions Automatically
          </h2>
          <p className="text-2xl text-gray-300 mb-4">
            Not warnings. Not popups.
          </p>
          <p className="text-3xl font-bold text-white">
            Actual transaction surgery.
          </p>
        </motion.div>

        {/* Comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            className="p-8 bg-red-500/10 border-2 border-red-500/30 rounded-2xl"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-4 text-red-400">Every wallet today:</h3>
            <p className="text-xl text-gray-300 italic">
              "This might be dangerous."
            </p>
          </motion.div>

          <motion.div
            className="p-8 bg-cyan-500/10 border-2 border-cyan-500/50 rounded-2xl"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-4 text-cyan-400">GuardianX:</h3>
            <p className="text-xl text-white font-bold">
              "It WAS dangerous. I fixed it."
            </p>
          </motion.div>
        </div>

        {/* Rewriting Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            'Reduces approvals automatically',
            'Adds slippage protection',
            'Sanitizes malicious calldata',
            'Removes proxy calls',
            'Blocks suspicious routers',
            'Limits token amounts',
            'Rejects hidden exploit paths'
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="p-6 bg-black/40 border border-cyan-500/20 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, borderColor: '#00D4FF' }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                <span className="text-gray-300">{feature}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-xl text-gray-400 mb-6">
            This isn't safe mode.
          </p>
          <p className="text-3xl font-bold text-white">
            This is a transaction firewall with a scalpel.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Mempool Defense Section
const MempoolDefenseSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Eye className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 font-semibold">SECTION 4</span>
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Mempool Defense Mode
          </h2>
          <p className="text-2xl text-gray-300">
            Your transactions never touch the public mempool again.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { name: 'Flashbots', protection: '95%' },
            { name: 'Eden Network', protection: '80%' },
            { name: 'Private Relayers', protection: '85%' },
            { name: 'Stealth RPC', protection: '90%' }
          ].map((relayer, i) => (
            <motion.div
              key={i}
              className="p-6 bg-black/40 border border-purple-500/20 rounded-xl text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, borderColor: '#8B5CF6' }}
            >
              <Network className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold mb-2">{relayer.name}</h4>
              <p className="text-cyan-400 font-semibold">{relayer.protection} Protection</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-xl text-gray-300">
            No front-running. No sandwiching. No MEV bots. No visibility.
          </p>
          <p className="text-2xl font-bold text-white">
            This is your private lane on-chain.
          </p>
          <p className="text-lg text-gray-400">
            And nobody else gets to see your traffic.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Guardian Contracts Section
const GuardianContractsSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-semibold">SECTION 5</span>
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent">
            Guardian Contracts
          </h2>
          <h3 className="text-3xl font-bold text-white mb-4">
            Programmable On-Chain Self-Defense
          </h3>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            className="p-8 bg-red-500/10 border-2 border-red-500/30 rounded-2xl"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h4 className="text-2xl font-bold mb-4 text-red-400">Other wallets rely on server-side protection.</h4>
            <p className="text-gray-300 text-lg">
              Meaning if your wallet UI breaks, you're screwed.
            </p>
          </motion.div>

          <motion.div
            className="p-8 bg-cyan-500/10 border-2 border-cyan-500/50 rounded-2xl"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h4 className="text-2xl font-bold mb-4 text-cyan-400">GuardianX deploys on-chain guard contracts</h4>
            <p className="text-gray-300 text-lg">
              that enforce rules even if your phone is off, wallet is compromised, device is wiped, or GuardianX servers go down.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            'Max approval amounts',
            'Max daily spend',
            'Block unknown routers',
            'Block proxies',
            'Require multi-confirmation above thresholds',
            'Reject interactions with non-whitelisted contracts'
          ].map((rule, i) => (
            <motion.div
              key={i}
              className="p-6 bg-black/40 border border-cyan-500/20 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, borderColor: '#00D4FF' }}
            >
              <Lock className="w-8 h-8 text-cyan-400 mb-3" />
              <p className="text-gray-300 font-semibold">{rule}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-3xl font-bold text-white mb-4">
            It is literally impossible to send a harmful transaction.
          </p>
          <p className="text-xl text-cyan-400">
            The chain itself says no.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Pipeline Section
const PipelineSection = () => {
  const pipelineSteps = [
    { icon: Brain, label: 'ML Predict', color: 'cyan' },
    { icon: Code, label: 'Rewrite Transaction', color: 'orange' },
    { icon: Shield, label: 'Guardian Contract Validate', color: 'purple' },
    { icon: Network, label: 'Private Mempool Stealth Route', color: 'cyan' }
  ]

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
            Autonomous Protection Pipeline
          </h2>
          <p className="text-xl text-gray-300">
            One unified system. One goal: never get exploited again.
          </p>
        </motion.div>

        {/* Pipeline Visualization */}
        <div className="relative">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
            {pipelineSteps.map((step, i) => {
              const colorClasses = {
                cyan: 'bg-cyan-500/20 border-cyan-500 text-cyan-400',
                orange: 'bg-orange-500/20 border-orange-500 text-orange-400',
                purple: 'bg-purple-500/20 border-purple-500 text-purple-400'
              }
              const colorClass = colorClasses[step.color as keyof typeof colorClasses] || colorClasses.cyan
              
              return (
                <motion.div
                  key={i}
                  className="flex flex-col items-center relative"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                >
                  <motion.div
                    className={`w-24 h-24 rounded-full ${colorClass.split(' ')[0]} border-2 ${colorClass.split(' ')[1]} flex items-center justify-center mb-4`}
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <step.icon className={`w-12 h-12 ${colorClass.split(' ')[2]}`} />
                  </motion.div>
                  <p className="text-lg font-semibold text-white">{step.label}</p>
                  {i < pipelineSteps.length - 1 && (
                    <motion.div
                      className="hidden md:block absolute left-full top-12"
                      initial={{ scaleX: 0, x: -20 }}
                      whileInView={{ scaleX: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.2 + 0.3 }}
                    >
                      <ArrowRight className="w-8 h-8 text-cyan-400" />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-xl text-gray-300">
            Every action. Every signature.
          </p>
          <p className="text-2xl font-bold text-white">
            Filtered through four layers of automated defense.
          </p>
          <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            You are now un-ruggable, un-sandwichable, un-exploitable.
          </p>
          <p className="text-xl text-gray-400">
            This is Web3 done right.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Industry Change Section
const IndustryChangeSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Why This Changes the Entire Wallet Industry
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {[
            { icon: Brain, text: 'thinks (ML)' },
            { icon: Shield, text: 'protects (rewriter)' },
            { icon: Eye, text: 'hides (mempool stealth)' },
            { icon: Lock, text: 'enforces (on-chain guard contracts)' },
            { icon: Sparkles, text: 'adapts (habit learning)' }
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="p-6 bg-black/40 border border-cyan-500/20 rounded-xl flex items-center gap-4"
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, borderColor: '#00D4FF' }}
            >
              <feature.icon className="w-10 h-10 text-cyan-400 flex-shrink-0" />
              <p className="text-xl text-white">
                GuardianX is the first wallet that <span className="font-bold text-cyan-400">{feature.text}</span>
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-xl text-gray-300">
            This is not a feature upgrade.
          </p>
          <p className="text-3xl font-bold text-white">
            This is a new class of wallet architecture.
          </p>
          <p className="text-lg text-gray-400 italic">
            Think: If MetaMask had antivirus + AI + firewall + stealth network all built in.
          </p>
          <p className="text-xl font-bold text-red-400">
            Nobody else is even working on this stack.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Plugin Ecosystem Section
const PluginEcosystemSection = () => {
  const plugins = [
    'NFT scam filters',
    'Honeypot detectors',
    'Phishing heuristics',
    'DAO voting protectors',
    'NFT trait-based transfer verifiers',
    'Custom spend rules',
    'Tokenomic anomaly detectors',
    'Hack-response modules',
    'Private RPC switchers',
    'Exploit scoring plugins'
  ]

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent">
            A Plugin Ecosystem for Customized Security
          </h2>
          <p className="text-xl text-gray-300">
            Developers can build plugins that extend your wallet's brain
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {plugins.map((plugin, i) => (
            <motion.div
              key={i}
              className="p-6 bg-black/40 border border-purple-500/20 rounded-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05, borderColor: '#8B5CF6' }}
            >
              <FileCode className="w-8 h-8 text-purple-400 mb-3" />
              <p className="text-gray-300 font-semibold">{plugin}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-2xl font-bold text-white mb-4">
            GuardianX becomes the iPhone of wallet security
          </p>
          <p className="text-xl text-gray-400">
            — the platform everyone builds on.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Users Section
const UsersSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
            For Users Who Refuse To Be Victims
          </h2>
          <p className="text-xl text-gray-300">
            GuardianX wasn't built for beginners.
          </p>
          <p className="text-2xl font-bold text-white mt-4">
            It was built for people who move size, live on-chain, and want real protection.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {[
            'Every transaction is scanned',
            'Every approval is corrected',
            'Every malicious contract is blocked',
            'Every route is protected',
            'Every habit makes the AI smarter'
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="p-6 bg-black/40 border border-cyan-500/20 rounded-xl flex items-center gap-4"
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, borderColor: '#00D4FF' }}
            >
              <CheckCircle2 className="w-8 h-8 text-cyan-400 flex-shrink-0" />
              <p className="text-xl text-white">{feature}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-4xl font-bold text-white">
            You will feel like you upgraded your brain.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Social Proof Section
const SocialProofSection = () => {
  const stats = [
    { label: 'Early Users', value: '512', icon: Users },
    { label: 'Protected', value: '$4.2M', icon: Shield },
    { label: 'Rewritten', value: '1,300+', icon: Code },
    { label: 'Blocked', value: '300+', icon: Lock },
    { label: 'Front-Run', value: '0', icon: Eye },
    { label: 'Exploited', value: '0', icon: CheckCircle2 }
  ]

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Private Beta: Already Running
          </h2>
          <p className="text-2xl text-gray-300">
            Real numbers from real users
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="p-8 bg-black/40 border border-cyan-500/20 rounded-2xl text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, borderColor: '#00D4FF' }}
            >
              <stat.icon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <div className="text-5xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA Section
const CTASection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
            The Future of Wallet Security Starts Right Now
          </h2>

          <div className="space-y-4 text-xl text-gray-300">
            <p>The next breach won't touch you.</p>
            <p>The next exploit won't touch you.</p>
            <p className="text-2xl font-bold text-white">
              The next scam contract won't touch you.
            </p>
          </div>

          <p className="text-3xl font-bold text-cyan-400">
            Because GuardianX won't allow it.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <motion.button
              className="px-12 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-xl flex items-center gap-2 group"
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0, 212, 255, 0.6)' }}
              whileTap={{ scale: 0.95 }}
            >
              Request Private Beta Access
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              className="px-12 py-6 bg-black/50 backdrop-blur-md border-2 border-cyan-500/50 rounded-xl font-bold text-xl flex items-center gap-2 group"
              whileHover={{ scale: 1.05, borderColor: '#00D4FF' }}
              whileTap={{ scale: 0.95 }}
            >
              <Layers className="w-6 h-6" />
              Developer Plugins
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

