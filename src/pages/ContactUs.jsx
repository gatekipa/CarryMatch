import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Valid email address is required");
      return false;
    }
    if (!formData.subject.trim()) {
      setError("Subject is required");
      return false;
    }
    if (!formData.message.trim() || formData.message.length < 10) {
      setError("Message must be at least 10 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await base44.integrations.Core.SendEmail({
        from_name: formData.name.trim(),
        to: "info@carrymatch.com",
        subject: `Contact Form: ${formData.subject.trim()}`,
        body: `New contact form submission from CarryMatch website:

Name: ${formData.name.trim()}
Email: ${formData.email.trim()}
Subject: ${formData.subject.trim()}

Message:
${formData.message.trim()}

---
This message was sent via the CarryMatch contact form.
Reply directly to this email to respond to ${formData.name.trim()} at ${formData.email.trim()}.`
      });

      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      toast.success("Message sent successfully!");
    } catch (err) {
      console.error("Error sending email:", err);
      const errorMsg = err?.message || "Failed to send message. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9EFF00] to-[#7ACC00]">Us</span>
            </h1>
            <p className="text-xl text-gray-400">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Our Address</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Lawtekno LLC<br />
                      5000 Thayer Center STE C<br />
                      Oakland, MD 21550<br />
                      United States
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#9EFF00] to-[#7ACC00] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Email Us</h3>
                    <a 
                      href="mailto:info@carrymatch.com"
                      className="text-[#9EFF00] hover:text-[#7ACC00] transition-colors"
                    >
                      info@carrymatch.com
                    </a>
                    <p className="text-gray-400 text-sm mt-2">
                      We typically respond within 24 hours
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Business Hours</h3>
                    <p className="text-gray-300 text-sm">
                      Monday - Friday<br />
                      9:00 AM - 6:00 PM EST
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm">
                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Message Sent Successfully!</h3>
                    <p className="text-gray-300 mb-6">
                      Thank you for contacting us. We'll get back to you as soon as possible.
                    </p>
                    <Button
                      onClick={() => setIsSubmitted(false)}
                      className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-semibold"
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-300">{error}</p>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name" className="text-gray-300">Your Name *</Label>
                        <Input
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="John Doe"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-gray-300">Your Email *</Label>
                        <Input
                          id="email"
                          required
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john@example.com"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          maxLength={120}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="subject" className="text-gray-300">Subject *</Label>
                      <Input
                        id="subject"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="How can we help you?"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        maxLength={150}
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-gray-300">Message * <span className="text-xs text-gray-500">({formData.message.length}/2000)</span></Label>
                      <Textarea
                        id="message"
                        required
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value.slice(0, 2000) }))}
                        placeholder="Tell us more about your inquiry..."
                        rows={8}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        maxLength={2000}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()}
                      className="w-full bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-semibold py-6 text-lg group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-[#1A1A1A] border-t-transparent mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}