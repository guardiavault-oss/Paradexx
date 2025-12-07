/**
 * Simplified Recovery Portal
 * Empathy-driven recovery flow for grieving beneficiaries
 */

import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Shield, CheckCircle2, Clock, FileText, Users, ArrowRight } from "lucide-react";
import "../design-system.css";

export default function SimplifiedRecovery() {
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [vaultOwnerName, setVaultOwnerName] = useState("");

  // Get vault info from URL params or load from API
  useEffect(() => {
    const name = searchParams.get("ownerName") || "";
    setVaultOwnerName(name);
  }, [searchParams]);

  const steps = [
    {
      number: 1,
      title: "Tell us what happened",
      description: "We'll guide you through providing the necessary documentation.",
      icon: FileText,
      color: "from-blue-500 to-cyan-400",
    },
    {
      number: 2,
      title: "We'll contact the guardians",
      description: "The trusted people chosen by the vault owner will verify the situation.",
      icon: Users,
      color: "from-purple-500 to-indigo-400",
    },
    {
      number: 3,
      title: "Access is restored",
      description: "Once verified, you'll receive secure access to the cryptocurrency.",
      icon: Shield,
      color: "from-emerald-500 to-green-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-gray-50">
      {/* Empathy Header */}
      <div className="bg-gradient-to-r from-slate-100 to-gray-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              We're sorry for your loss
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              We're here to help you access {vaultOwnerName ? `${vaultOwnerName}'s` : "the vault owner's"} cryptocurrency safely and securely.
            </p>
            <p className="text-lg text-gray-500">
              This process is designed to be simple and respectful. We'll guide you through each step.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Simple Process Steps */}
          <div className="space-y-6 mb-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`border-2 transition-all ${
                      isActive
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : isCompleted
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          ) : (
                            <Icon className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">
                              Step {step.number}: {step.title}
                            </CardTitle>
                            {isActive && (
                              <Badge className="bg-blue-500 text-white">Current Step</Badge>
                            )}
                            {isCompleted && (
                              <Badge className="bg-green-500 text-white">Completed</Badge>
                            )}
                          </div>
                          <CardDescription className="text-base">
                            {step.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    {isActive && (
                      <CardContent>
                        <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-200">
                          {step.number === 1 && (
                            <div className="space-y-4">
                              <p className="text-gray-700 font-medium">
                                Please provide the following documentation:
                              </p>
                              <ul className="space-y-2 text-gray-600 list-disc list-inside">
                                <li>Death certificate or official documentation</li>
                                <li>Proof of your relationship to the vault owner</li>
                                <li>Government-issued identification</li>
                              </ul>
                              <Button
                                onClick={() => setCurrentStep(2)}
                                className="w-full md:w-auto"
                              >
                                Continue to Next Step
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          )}
                          {step.number === 2 && (
                            <div className="space-y-4">
                              <p className="text-gray-700 font-medium">
                                The guardians chosen by the vault owner will be contacted automatically.
                              </p>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>This typically takes 2-5 business days</span>
                              </div>
                              <p className="text-sm text-gray-500">
                                You'll receive email updates as each guardian confirms the situation.
                              </p>
                              <Button
                                onClick={() => setCurrentStep(3)}
                                className="w-full md:w-auto"
                              >
                                Continue
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          )}
                          {step.number === 3 && (
                            <div className="space-y-4">
                              <p className="text-gray-700 font-medium">
                                Once the guardians have verified everything, you'll receive:
                              </p>
                              <ul className="space-y-2 text-gray-600 list-disc list-inside">
                                <li>Secure access instructions</li>
                                <li>Step-by-step guide to access the cryptocurrency</li>
                                <li>Support contact information</li>
                              </ul>
                              <Button
                                onClick={() => {
                                  // Navigate to recovery completion or contact form
                                  alert("This would navigate to the recovery completion page");
                                }}
                                className="w-full md:w-auto"
                              >
                                Complete Recovery Process
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Support Information */}
          <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                We're Here to Help
              </CardTitle>
              <CardDescription>
                If you have questions or need assistance during this process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-gray-700">
                  Our support team is available to help you through every step. This is a difficult
                  time, and we want to make this process as easy as possible for you.
                </p>
                <Button variant="outline" className="w-full md:w-auto">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}






