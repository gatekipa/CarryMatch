import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is CarryMatch?",
      answer: "CarryMatch is a peer-to-peer platform that connects travelers with unused luggage space to people who need items delivered. It's a cost-effective, fast, and secure alternative to traditional shipping."
    },
    {
      question: "How does CarryMatch work?",
      answer: "Travelers post their trip details and available luggage space. Senders browse these trips or post shipment requests. When there's a match, users connect through our platform, negotiate terms, and coordinate the delivery. A flat $5 platform fee connects both parties."
    },
    {
      question: "Is CarryMatch safe?",
      answer: "Yes! We prioritize safety through KYC verification, user ratings and reviews, delivery PIN protection, trust scoring, and dispute resolution. Our platform is operated by Lawtekno LLC (Est. 2021, Maryland, USA) and all payments are secured via Stripe®."
    },
    {
      question: "How much does it cost?",
      answer: "CarryMatch charges a flat $5 match fee to connect sender and traveler. There are no hidden charges or escrow fees. The delivery price is negotiated directly between users."
    },
    {
      question: "What can I send through CarryMatch?",
      answer: "You can send most personal items including electronics, documents, clothing, cosmetics, and small packages. Prohibited items include hazardous materials, weapons, illegal substances, and perishables. Always check airline and customs regulations."
    },
    {
      question: "How do I get verified?",
      answer: "Click 'Get Verified' on your profile and upload a government-issued ID (passport, driver's license, or national ID). Our admin team reviews submissions within 24-48 hours. Verified users get a badge and higher trust scores."
    },
    {
      question: "What is the delivery PIN?",
      answer: "The delivery PIN is an optional 4-digit code that senders can enable for extra security. The traveler must enter this PIN to confirm delivery. After 3 failed attempts, the system flags the incident and may restrict the traveler's account."
    },
    {
      question: "What if something goes wrong?",
      answer: "If there's an issue (damaged item, no-show, wrong item, etc.), you can file a dispute through 'My Matches'. Our admin team reviews evidence from both parties and makes a fair decision. Trust scores are updated based on dispute outcomes."
    },
    {
      question: "How does the referral program work?",
      answer: "Share your unique referral link with friends. When they sign up using your link and complete their first transaction, you both earn rewards. Track your referrals and earnings on your profile page."
    },
    {
      question: "Can I cancel a match?",
      answer: "Yes, you can cancel a match before it's confirmed. If it's already confirmed, cancellations may affect your trust score. Contact the other party first to discuss any issues."
    },
    {
      question: "What are trust scores?",
      answer: "Trust scores (0-100) reflect user reliability based on completed transactions, reviews, verification status, and dispute history. Higher scores mean more trustworthy users. Scores update automatically based on your activity."
    },
    {
      question: "How do I contact support?",
      answer: "Email us at info@carrymatch.com or visit our office at 5000 Thayer Center STE C, Oakland, MD 21550, USA. For urgent issues, use the dispute resolution system in your account."
    }
  ];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-[#9EFF00] to-[#7ACC00] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-[#1A1A1A]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9EFF00] to-[#7ACC00]">Questions</span>
            </h1>
            <p className="text-xl text-gray-400">
              Everything you need to know about CarryMatch
            </p>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <span className="text-lg font-semibold text-white pr-8">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="w-5 h-5 text-[#9EFF00] flex-shrink-0" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-6 text-gray-300 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12"
          >
            <Card className="p-8 bg-gradient-to-br from-[#9EFF00]/10 to-[#7ACC00]/10 border-[#9EFF00]/30 backdrop-blur-sm text-center">
              <h3 className="text-2xl font-bold text-white mb-2">
                Still have questions?
              </h3>
              <p className="text-gray-400 mb-6">
                We're here to help! Get in touch with our support team.
              </p>
              <a 
                href="mailto:info@carrymatch.com"
                className="inline-block px-8 py-3 bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#9EFF00]/25 transition-all duration-300"
              >
                Contact Support
              </a>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}