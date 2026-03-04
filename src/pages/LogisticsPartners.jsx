import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Bus,
  Package,
  Ship,
  Plane,
  CheckCircle,
  Globe,
  Shield,
  Smartphone,
  Zap,
  Clock,
  DollarSign,
  Users,
  BarChart,
  MapPin,
  FileText,
  Bell,
  Lock,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { CmlHeroBackground } from "@/components/CmlHeroBackground";
import { CoverageBackground } from "@/components/CoverageBackground";

export default function LogisticsPartners() {
  const [user, setUser] = React.useState(null);
  const [isPartner, setIsPartner] = React.useState(false);

  React.useEffect(() => {
    base44.auth.me()
      .then(async (u) => {
        setUser(u);
        // Check if already a partner (vendor staff OR bus operator)
        const [vs, bo] = await Promise.all([
          base44.entities.VendorStaff.filter({ email: u.email, status: "ACTIVE" }).catch(() => []),
          base44.entities.BusOperator.filter({ created_by: u.email }).catch(() => []),
        ]);
        setIsPartner(vs.length > 0 || bo.length > 0);
      })
      .catch(() => setUser(null));
  }, []);

  const vendorTypes = [
    {
      icon: Bus,
      title: "Bus Agencies",
      description: "Expand your revenue with parcel delivery on existing routes",
      benefits: ["Utilize spare capacity", "No route changes needed", "Easy staff onboarding"]
    },
    {
      icon: Package,
      title: "Parcel Forwarders",
      description: "Streamline your cross-border operations with automation",
      benefits: ["Batch processing", "Real-time tracking", "Multi-currency support"]
    },
    {
      icon: Ship,
      title: "Container Shippers",
      description: "Manage consolidation and manifests with precision",
      benefits: ["Container management", "Customs documentation", "Weight tracking"]
    },
    {
      icon: Truck,
      title: "Regional Couriers",
      description: "Scale your local delivery network efficiently",
      benefits: ["Route optimization", "OTP delivery", "Cash/mobile payments"]
    },
    {
      icon: Plane,
      title: "Freight Forwarders",
      description: "Handle international shipments with enterprise tools",
      benefits: ["Multi-modal tracking", "Insurance integration", "Global coverage"]
    },
    {
      icon: Globe,
      title: "Cross-Border Shops",
      description: "Offer shipping services to your customers seamlessly",
      benefits: ["White-label ready", "Customer notifications", "Branded tracking"]
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "Quick Intake (6-Step)",
      description: "Fast parcel registration with sender/receiver details, weight, and payment method"
    },
    {
      icon: FileText,
      title: "Batch & Manifest",
      description: "Create shipment batches with cut-off times, print manifests and labels"
    },
    {
      icon: Lock,
      title: "OTP Pickup Security",
      description: "Secure pickups with one-time passwords sent to senders"
    },
    {
      icon: DollarSign,
      title: "Offline Payments",
      description: "Accept cash, Zelle, mobile money, and track payments offline"
    },
    {
      icon: Shield,
      title: "Insurance Options",
      description: "Offer optional insurance coverage for high-value items"
    },
    {
      icon: Smartphone,
      title: "Multi-Channel Notifications",
      description: "Automated WhatsApp, SMS, and email updates at every stage"
    },
    {
      icon: MapPin,
      title: "Global Tracking",
      description: "Real-time shipment tracking across borders and handoffs"
    },
    {
      icon: BarChart,
      title: "Analytics Dashboard",
      description: "Monitor performance, revenue, and customer satisfaction"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Create Vendor Account",
      description: "Register your company and add branch locations where you operate",
      icon: Users
    },
    {
      number: "02",
      title: "Onboard Your Staff",
      description: "Add team members and start using the quick 6-step intake process",
      icon: Zap
    },
    {
      number: "03",
      title: "Track & Get Paid",
      description: "Monitor shipments, send notifications, and collect payments seamlessly",
      icon: CheckCircle
    }
  ];

  const globalRoutes = [
    "USA → Cameroon",
    "UK → Nigeria",
    "France → Senegal",
    "Germany → Ghana",
    "Canada → Kenya",
    "USA → Ethiopia",
    "Belgium → DRC",
    "Spain → Morocco"
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[600px] flex items-center">
        <CmlHeroBackground style={{ position: 'absolute', inset: 0 }} />
        
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <Badge className="bg-[#9EFF00]/20 text-[#9EFF00] mb-6 text-sm px-4 py-2">
              CarryMatch Logistics Partner Portal (CML)
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
              Scale Your Cross-Border <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9EFF00] to-[#7ACC00]">
                Parcel Operations
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Fast intake. Secure pickups. Payments processed. All in one platform built for bus agencies, forwarders, and shops.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to={createPageUrl("PartnerSignup")}>
                <Button size="lg" className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] px-10 py-6 text-lg font-bold shadow-lg shadow-[#9EFF00]/30 group">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to={createPageUrl("VendorPricing")}>
                <Button size="lg" variant="outline" className="border-2 border-[#9EFF00]/30 text-white hover:bg-[#9EFF00]/10 px-10 py-6 text-lg font-semibold">
                  View Pricing
                  <DollarSign className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              {user && isPartner ? (
                <Link to={createPageUrl("PartnerLogin")}>
                  <Button size="lg" className="bg-white/10 hover:bg-white/20 text-white px-10 py-6 text-lg font-semibold border border-white/20">
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : user ? (
                <Link to={createPageUrl("PartnerLogin")}>
                  <Button size="lg" variant="outline" className="border-white/20 text-gray-300 hover:bg-white/5 px-10 py-6 text-lg">
                    Partner Login
                  </Button>
                </Link>
              ) : null}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Built for Logistics Providers</h2>
            <p className="text-xl text-gray-400">Whatever your transport model, CML has you covered</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorTypes.map((vendor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all h-full">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <vendor.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{vendor.title}</h3>
                  <p className="text-gray-400 mb-4">{vendor.description}</p>
                  <ul className="space-y-2">
                    {vendor.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-[#9EFF00] flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-400">Everything you need to run efficient parcel operations</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="p-6 bg-white/5 border-white/10 hover:border-[#9EFF00]/30 hover:bg-white/10 transition-all h-full">
                  <div className="w-12 h-12 bg-[#9EFF00]/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-[#9EFF00]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Coverage Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <CoverageBackground style={{ position: 'absolute', inset: 0 }} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Global Coverage</h2>
            <p className="text-xl text-gray-400">Connect any origin to any destination worldwide</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center border border-white/10">
                <Globe className="w-48 h-48 text-[#9EFF00]/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-4 p-8">
                    <div className="w-3 h-3 bg-[#9EFF00] rounded-full animate-pulse" />
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-3"
            >
              {globalRoutes.map((route, idx) => (
                <Card key={idx} className="p-4 bg-white/5 border-white/10 text-center">
                  <p className="text-sm font-medium text-gray-300">{route}</p>
                </Card>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">How It Works for Vendors</h2>
            <p className="text-xl text-gray-400">Get started in minutes, scale globally</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-[#9EFF00]/50 to-transparent -z-10" />
                )}
                
                <Card className="p-8 bg-white/5 border-white/10 hover:bg-white/10 transition-all relative">
                  <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-[#9EFF00] to-[#7ACC00] rounded-2xl flex items-center justify-center shadow-lg shadow-[#9EFF00]/25">
                    <span className="text-2xl font-bold text-[#1A1A1A]">{step.number}</span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                      <step.icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparent Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-center mb-12">
              <Badge className="bg-[#9EFF00]/20 text-[#9EFF00] mb-4">Transparent Pricing</Badge>
              <h2 className="text-4xl font-bold text-white mb-4">Simple Plans, No Surprises</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Start free and scale as you grow. All plans include core platform features.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {[
                { name: "Starter", price: "Free", desc: "Get started", shipments: "50/mo", branches: 1, staff: 2, popular: false },
                { name: "Growth", price: "$29", desc: "Growing teams", shipments: "500/mo", branches: 3, staff: 5, popular: false },
                { name: "Pro", price: "$79", desc: "Scale operations", shipments: "2,000/mo", branches: 10, staff: 15, popular: true },
                { name: "Enterprise", price: "Custom", desc: "Unlimited scale", shipments: "Unlimited", branches: "Unlimited", staff: "Unlimited", popular: false }
              ].map((plan) => (
                <Card key={plan.name} className={`p-6 bg-white/5 border-white/10 relative ${plan.popular ? "ring-2 ring-[#9EFF00]" : ""}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#9EFF00] text-[#1A1A1A] font-bold text-xs">Most Popular</Badge>
                  )}
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mb-3">{plan.desc}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-[#9EFF00]">{plan.price}</span>
                    {plan.price !== "Free" && plan.price !== "Custom" && <span className="text-gray-400 text-sm">/mo</span>}
                  </div>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#9EFF00] flex-shrink-0" />{plan.shipments} shipments</div>
                    <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#9EFF00] flex-shrink-0" />{plan.branches} {typeof plan.branches === 'number' && plan.branches === 1 ? 'branch' : 'branches'}</div>
                    <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#9EFF00] flex-shrink-0" />{plan.staff} staff seats</div>
                  </div>
                  <Link to={plan.price === "Custom" ? createPageUrl("ContactUs") : createPageUrl("PartnerSignup")} className="block mt-4">
                    <Button className={`w-full ${plan.popular ? "bg-[#9EFF00] hover:bg-[#7ACC00] text-[#1A1A1A]" : "bg-white/10 text-white hover:bg-white/20"}`}>
                      {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Link to={createPageUrl("VendorPricing")}>
                <Button variant="link" className="text-[#9EFF00] hover:text-[#7ACC00]">View full plan comparison →</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#9EFF00]/10 to-[#7ACC00]/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your<br />Logistics Operations?
            </h2>
            <p className="text-xl text-gray-300 mb-10">
              Join leading logistics providers using CarryMatch CML to streamline operations and scale globally.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl("PartnerSignup")}>
                <Button className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] text-lg px-8 py-6 font-bold shadow-lg">
                  Start Free Trial
                  <CheckCircle className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="mailto:partners@carrymatch.com">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6">
                  Contact Sales
                  <Bell className="w-5 h-5 ml-2" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">500+</div>
              <p className="text-gray-400">Active Routes Worldwide</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">99.8%</div>
              <p className="text-gray-400">Delivery Success Rate</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <p className="text-gray-400">Customer Support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}