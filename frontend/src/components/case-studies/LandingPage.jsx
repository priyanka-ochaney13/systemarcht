import React from 'react';
import Link from 'next/link';
import { Zap, Layout, Gauge, Lightbulb, ArrowRight, MessageSquare } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Global animations */}
      <style>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 153, 0, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 153, 0, 0.6);
          }
        }
        
        .animate-hero-icon {
          animation: slideInDown 0.8s ease-out;
        }
        
        .animate-hero-title {
          animation: slideInDown 0.8s ease-out 0.2s backwards;
        }
        
        .animate-hero-subtitle {
          animation: slideInDown 0.8s ease-out 0.4s backwards;
        }
        
        .animate-hero-buttons {
          animation: slideInUp 0.8s ease-out 0.6s backwards;
        }
        
        .animate-feature-card {
          animation: fadeInScale 0.6s ease-out;
        }
        
        .animate-feature-card:nth-child(1) {
          animation-delay: 0s;
        }
        
        .animate-feature-card:nth-child(2) {
          animation-delay: 0.1s;
        }
        
        .animate-feature-card:nth-child(3) {
          animation-delay: 0.2s;
        }
        
        .animate-pattern-item {
          animation: slideInUp 0.6s ease-out;
        }
        
        .animate-pattern-item:nth-child(1) {
          animation-delay: 0s;
        }
        
        .animate-pattern-item:nth-child(2) {
          animation-delay: 0.1s;
        }
        
        .animate-pattern-item:nth-child(3) {
          animation-delay: 0.2s;
        }
        
        .btn-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6" style={{ color: '#FF9900' }} />
            <span className="text-xl font-bold text-gray-900">SystemArcht</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-gray-700 hover:text-yellow-600 transition">
              Features
            </a>
            <a href="#patterns" className="text-gray-700 hover:text-yellow-600 transition">
              Patterns
            </a>
            <Link href="/chatbot">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 hover:bg-zinc-800 text-amber-400 text-sm font-medium border border-zinc-700 transition">
                <MessageSquare className="w-3.5 h-3.5" />
                ArchBot
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <Zap className="w-16 h-16 mx-auto mb-6 animate-hero-icon float-animation" style={{ color: '#FF9900' }} />
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight animate-hero-title">
            Design, Simulate, Learn
            <br />
            <span style={{ color: '#FF9900' }}>AWS Architectures</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-hero-subtitle">
            SystemArcht is an interactive platform where you can visually design cloud architectures,
            simulate their behavior with real-world constraints, and understand system design patterns.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center animate-hero-buttons">
            <Link href="/playground">
              <button className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition text-lg flex items-center gap-2 justify-center md:justify-start btn-glow hover:shadow-2xl transform hover:scale-105">
                <Layout className="w-5 h-5" />
                Start Building
              </button>
            </Link>
            <Link href="/case-studies">
              <button className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition text-lg flex items-center gap-2 justify-center md:justify-start hover:shadow-2xl transform hover:scale-105">
                <span>Explore Case Studies</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/chatbot">
              <button className="px-8 py-4 bg-transparent hover:bg-zinc-800 text-amber-400 font-semibold rounded-lg transition text-lg flex items-center gap-2 justify-center md:justify-start border border-amber-500/40 hover:border-amber-400 hover:shadow-2xl transform hover:scale-105">
                <MessageSquare className="w-5 h-5" />
                Ask ArchBot
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">Why SystemArcht?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Layout,
                title: 'Drag & Drop Design',
                description: 'Visually design cloud architectures by dragging AWS services onto a canvas',
              },
              {
                icon: Gauge,
                title: 'Real-World Simulation',
                description: 'Simulate actual AWS service behavior including cold starts, throttling, and latency',
              },
              {
                icon: Lightbulb,
                title: 'Learn Patterns',
                description: 'Study 5 core system design patterns used by companies like Netflix, Uber, and Instagram',
              },
              {
                icon: MessageSquare,
                title: 'ArchBot — Cost AI',
                description: 'Chat with your AI assistant to get instant cost breakdowns and optimization tips for your architecture',
                link: '/chatbot',
                highlight: true,
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className={`bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition animate-feature-card transform hover:-translate-y-1 duration-300 ${
                  feature.highlight ? 'border-2 border-amber-400/40 relative overflow-hidden' : ''
                }`}
              >
                {feature.highlight && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    New
                  </span>
                )}
                <feature.icon
                  className="w-12 h-12 mb-4"
                  style={{ color: feature.highlight ? '#F59E0B' : '#FF9900' }}
                />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                {feature.link && (
                  <Link href={feature.link}>
                    <span className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition">
                      Try ArchBot <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Patterns Overview */}
      <section id="patterns" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">Learn 5 Core Patterns</h2>
          <div className="space-y-4">
            {[
              {
                title: 'Event-Driven Microservices',
                example: 'Netflix-like video streaming',
                cost: '$13,020/month',
              },
              {
                title: 'Real-Time Analytics',
                example: 'Uber/Airbnb dashboards',
                cost: '$86/month',
              },
              {
                title: 'Photo Sharing Platform',
                example: 'Instagram/Pinterest scale',
                cost: '$253,000/month',
              },
            ].map((pattern, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:border-yellow-400 transition animate-pattern-item transform hover:-translate-y-1 hover:shadow-md duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{pattern.title}</h3>
                  <span className="text-sm font-semibold text-yellow-600">Est: {pattern.cost}</span>
                </div>
                <p className="text-gray-600">{pattern.example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center animate-hero-subtitle">
          <h2 className="text-3xl font-bold mb-6">Ready to Learn?</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Start building your first AWS architecture and understand real-world constraints.
          </p>
          <Link href="/playground">
            <button className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition text-lg flex items-center gap-2 justify-center mx-auto btn-glow hover:shadow-2xl transform hover:scale-105">
              <Layout className="w-5 h-5" />
              Launch Playground
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-600 text-sm">
          <p>
            SystemArcht © 2025 • An interactive learning platform for AWS cloud architecture
          </p>
        </div>
      </footer>
    </div>
  );
};
