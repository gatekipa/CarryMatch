import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Plane,
  Package,
  DollarSign,
  Shield,
  CheckCircle2,
  Users,
  ArrowRight,
  Star,
  Zap,
  Globe,
  Lock,
  BadgeCheck,
  Award,
  Building2
} from "lucide-react";
import { motion } from "framer-motion";
import AnimatedDigit from "@/components/AnimatedDigit";
import TrustHeader from "@/components/TrustHeader";
import VerificationPrompt from "@/components/VerificationPrompt";
import { base44 } from "@/api/base44Client";

export default function Home() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const testimonials = [
    {
      text: "I flew Lagos → London with extra space and earned $200—easiest side-hustle ever!",
      author: "Sarah M.",
      role: "Traveler",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah-traveler&scale=80"
    },
    {
      text: "My baby formula arrived from the UK in 24 hours—just the $5 CarryMatch match fee. Total lifesaver!",
      author: "Amara K.",
      role: "Requester",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=amara-requester&scale=80"
    },
    {
      text: "A traveler brought my favorite Victoria's Secret body mist from Paris to Douala in just a week—no crazy shipping fees.",
      author: "Marie L.",
      role: "Requester",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marie-requester&scale=80"
    }
  ];

  const features = [
    {
      icon: DollarSign,
      title: "Flat $5 Match Fee",
      description: "No escrow, no hidden charges. Just a simple $5 fee to connect sender and traveler.",
      color: "from-[#9EFF00] to-[#7ACC00]"
    },
    {
      icon: Zap,
      title: "Direct Negotiation",
      description: "Chat in-app and negotiate pricing & payment method directly with your match.",
      color: "from-[#9EFF00] to-[#7ACC00]"
    },
    {
      icon: Shield,
      title: "Delivery PIN Protection",
      description: "Optional PIN verification ensures secure delivery and prevents fraud.",
      color: "from-[#9EFF00] to-[#7ACC00]"
    },
    {
      icon: Globe,
      title: "Worldwide Network",
      description: "Connect with travelers heading anywhere. Use their unused luggage space.",
      color: "from-[#9EFF00] to-[#7ACC00]"
    }
  ];

  const steps = [
    {
      icon: Plane,
      title: "Post Trip",
      description: "Let people know you are travelling",
      color: "bg-[#9EFF00] text-[#1A1A1A]"
    },
    {
      icon: Users,
      title: "Match & Pay Fee",
      description: "Find a match and pay a small fee to connect",
      color: "bg-[#7ACC00] text-[#1A1A1A]"
    },
    {
      icon: Package,
      title: "Meet, Hand-off, Done",
      description: "Meet partner, hand-off luggage, and get paid",
      color: "bg-[#9EFF00] text-[#1A1A1A]"
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "linear-gradient(135deg, rgba(158,255,0,0.05) 0%, rgba(26,26,46,0.9) 50%, rgba(122,204,0,0.05) 100%)",
            opacity: 0.4
          }}
        />

        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#9EFF00]/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#7ACC00]/15 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full py-20">
          {/* Centered Content on Top of Background */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-4">
              Fly. Carry. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9EFF00] to-[#7ACC00]">Earn.</span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              Send items faster, cheaper through trusted, KYC-verified travelers.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-stretch sm:items-center mb-12 sm:mb-16 px-4 w-full">
              <Link to={createPageUrl("PostRequest")} className="flex-1 sm:flex-none">
                <div className="group">
                  <Button size="lg" className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg shadow-2xl shadow-[#9EFF00]/40 hover:shadow-[#9EFF00]/60 transition-all duration-300 font-bold w-full group-hover:scale-105 active:scale-95">
                    <Package className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Send an Item
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Button>
                  <p className="text-sm text-gray-400 mt-3 text-center font-medium">Post your delivery request</p>
                </div>
              </Link>
              <Link to={createPageUrl("PostTrip")} className="flex-1 sm:flex-none">
                <div className="group">
                  <Button size="lg" variant="outline" className="border-2 border-[#9EFF00]/20 text-white hover:bg-[#9EFF00]/5 hover:border-[#9EFF00]/40 px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg backdrop-blur-sm font-medium w-full transition-all duration-300">
                    <Plane className="mr-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                    List Your Trip
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <p className="text-sm text-gray-500 mt-3 text-center">Share your flight and earn</p>
                </div>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-20 px-4 max-w-5xl mx-auto"
          >
            {[
              { label: "Active Travelers", value: "2,500+" },
              { label: "Items Delivered", value: "10,000+" },
              { label: "Countries", value: "50+" },
              { label: "Avg. Savings", value: "60%" }
            ].map((stat, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-4 sm:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#9EFF00]/30 hover:bg-white/[0.08] transition-all duration-300"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Verification Prompt Section - NEW */}
      {user && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <VerificationPrompt user={user} />
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.02] backdrop-blur-sm relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">How it works</h2>
            <p className="text-lg sm:text-xl text-gray-400">Simple, fast, and reliable</p>
          </motion.div>

          <div className="relative">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#9EFF00]/30 to-transparent" />

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 relative z-10">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Step number badge */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9EFF00] to-[#7ACC00] flex items-center justify-center ring-4 ring-[#1a1a2e]">
                      <span className="text-[#1A1A1A] font-bold text-lg">{index + 1}</span>
                    </div>
                  </div>

                  {/* Arrow to next step */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-20 left-[60%] w-8 h-8 items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-[#9EFF00]/50" />
                    </div>
                  )}

                  <Card className="p-8 bg-white/5 border-white/10 hover:bg-white/[0.07] transition-all duration-300 backdrop-blur-sm h-full group cursor-pointer hover:border-[#9EFF00]/30 pt-12">
                    <div className={`w-20 h-20 rounded-3xl ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                      <step.icon className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 text-center">{step.title}</h3>
                    <p className="text-gray-400 leading-relaxed text-center">{step.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 flex items-start justify-center opacity-20 -mt-32">
          <AnimatedDigit
            digit="1"
            className="w-full h-full bg-transparent p-0"
            speedSec={10}
            direction="up"
            seed={42}
            sheen={true}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              One platform.<br />One trusted way.
            </h2>
            <p className="text-lg sm:text-xl text-gray-400">Everything you need in one place</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/[0.07] transition-all duration-300 backdrop-blur-sm h-full group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <TrustHeader />

           <div className="flex justify-center mb-8">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#9EFF00]/10 border border-[#9EFF00]/20">
               <div className="flex gap-0.5">
                 {[...Array(5)].map((_, i) => (
                   <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                 ))}
               </div>
               <span className="text-sm font-semibold text-white">5.0 average</span>
               <span className="text-sm text-gray-400">from 1,200+ verified reviews</span>
             </div>
           </div>

           <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm h-full hover:bg-white/[0.07] transition-all duration-300">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                   <div className="flex items-center gap-3">
                     <img 
                       src={testimonial.avatar} 
                       alt={testimonial.author}
                       className="w-12 h-12 rounded-full object-cover border-2 border-[#9EFF00]/20"
                     />
                     <div>
                       <div className="text-white font-semibold">{testimonial.author}</div>
                       <div className="text-gray-400 text-sm flex items-center gap-1">
                         {testimonial.role === "Traveler" ? (
                           <><Plane className="w-3 h-3 text-blue-400" /> {testimonial.role}</>
                         ) : (
                           <><Package className="w-3 h-3 text-purple-400" /> {testimonial.role}</>
                         )}
                       </div>
                     </div>
                   </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-[#9EFF00]/10 to-[#7ACC00]/10 border-[#9EFF00]/20 backdrop-blur-sm">
              {/* Background Image */}
              <div
                className="absolute inset-0 opacity-20 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: "linear-gradient(135deg, rgba(158,255,0,0.1) 0%, transparent 50%, rgba(122,204,0,0.1) 100%)"
                }}
              />

              {/* Gradient Overlay for better blending */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#9EFF00]/20 via-transparent to-[#7ACC00]/20" />

              {/* Content */}
              <div className="relative z-10 p-6 sm:p-12 py-20 sm:py-32 text-center flex flex-col items-center justify-center min-h-[400px] sm:min-h-[500px]">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
                  Send smart. Travel farther.
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8">
                  One delivery at a time.
                </p>
                <Link to={createPageUrl("PostRequest")}>
                  <Button size="lg" className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg shadow-lg shadow-[#9EFF00]/30 hover:shadow-[#9EFF00]/50 transition-all duration-300 group font-bold">
                    Get Started Now
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white/[0.02] via-white/[0.05] to-white/[0.02] backdrop-blur-sm relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-96 h-96 bg-[#9EFF00] rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-full bg-[#9EFF00]/10 border border-[#9EFF00]/20">
              <BadgeCheck className="w-5 h-5 text-[#9EFF00]" />
              <span className="text-sm font-semibold text-[#9EFF00]">Verified & Secure</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">Enterprise Trust & Safety</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">Bank-grade security with KYC verification for every user</p>
          </motion.div>

          {/* Main Trust Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* KYC Verification Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="p-8 bg-white/5 border-white/10 hover:border-[#9EFF00]/30 transition-all duration-300 h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-[#9EFF00]/10">
                    <BadgeCheck className="w-8 h-8 text-[#9EFF00]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">KYC Verified Users</h3>
                    <p className="text-gray-400 mb-4">Every traveler and shipper completes identity verification before their first transaction</p>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1 rounded-lg bg-[#9EFF00]/10 text-[#9EFF00] text-sm font-medium">ID Verification</div>
                      <div className="px-3 py-1 rounded-lg bg-[#9EFF00]/10 text-[#9EFF00] text-sm font-medium">Address Check</div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Security Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="p-8 bg-white/5 border-white/10 hover:border-[#9EFF00]/30 transition-all duration-300 h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-[#9EFF00]/10">
                    <Lock className="w-8 h-8 text-[#9EFF00]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Bank-Grade Security</h3>
                    <p className="text-gray-400 mb-4">SSL encrypted connections, PCI-DSS compliance, and Stripe-secured payments</p>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1 rounded-lg bg-[#9EFF00]/10 text-[#9EFF00] text-sm font-medium">256-bit SSL</div>
                      <div className="px-3 py-1 rounded-lg bg-[#9EFF00]/10 text-[#9EFF00] text-sm font-medium">PCI-DSS</div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Trust Indicators */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {[
              { icon: BadgeCheck, label: "Verified Profiles", detail: "100% KYC checked" },
              { icon: Award, label: "Trusted Ratings", detail: "Community-verified" },
              { icon: Building2, label: "Licensed Business", detail: "Lawtekno LLC, Maryland" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#9EFF00]/20 transition-all text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-2.5 rounded-lg bg-[#9EFF00]/10">
                      <item.icon className="w-6 h-6 text-[#9EFF00]" />
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.detail}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Compliance Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-6 rounded-xl bg-white/5 border border-white/10 text-center"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-[#9EFF00]" />
                Operated by Lawtekno LLC
              </span>
              <span className="hidden sm:inline">•</span>
              <span>Est. 2021, Maryland USA</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <BadgeCheck className="w-4 h-4 text-[#9EFF00]" />
                All transactions verified
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}