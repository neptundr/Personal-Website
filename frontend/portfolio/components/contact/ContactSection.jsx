import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Twitter, FileText, ExternalLink } from 'lucide-react';
import GameOfLife from './GameOfLife';

const contactLinks = [
  { key: 'github_url', icon: Github, label: 'GitHub', color: 'hover:text-white hover:border-white/30' },
  { key: 'linkedin_url', icon: Linkedin, label: 'LinkedIn', color: 'hover:text-blue-400 hover:border-blue-400/30' },
  { key: 'twitter_url', icon: Twitter, label: 'Twitter', color: 'hover:text-sky-400 hover:border-sky-400/30' },
  { key: 'resume_url', icon: FileText, label: 'Resume', color: 'hover:text-green-400 hover:border-green-400/30' },
];

const ContactSection = ({ settings }) => {
  const availableLinks = contactLinks.filter(link => settings && settings[link.key]);

  return (
    <section className="relative py-32 px-6 md:px-12 lg:px-24 bg-black border-t border-zinc-900 overflow-hidden">
      {/* Game of Life Background */}
      <GameOfLife />

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <motion.span
          className="text-red-500/80 text-xs tracking-[0.4em] uppercase font-medium"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Get in Touch
        </motion.span>
        <motion.h2
          className="mt-4 text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight relative z-10"
          style={{ textShadow: '0 2px 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 0, 0, 0.6)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Let's{' '}
          <span className="italic text-gray-300" style={{ fontFamily: 'Georgia, serif' }}>
            Connect
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10 mt-6 text-gray-300 font-light max-w-xl mx-auto"
          style={{ textShadow: '0 2px 15px rgba(0, 0, 0, 0.7)' }}
        >
          Interested in collaboration or just want to say hello? I'd love to hear from you.
        </motion.p>
      </motion.div>

      {/* Email Display */}
      {settings?.email && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative z-10 text-center mb-12"
        >
          <a
            href={`mailto:${settings.email}`}
            className="inline-flex items-center gap-3 text-2xl md:text-3xl font-light text-white hover:text-red-400 transition-colors group"
            style={{ textShadow: '0 2px 15px rgba(0, 0, 0, 0.8)' }}
          >
            <Mail className="w-6 h-6 md:w-8 md:h-8 drop-shadow-lg" />
            <span className="relative">
              {settings.email}
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-red-500 group-hover:w-full transition-all duration-500" />
            </span>
          </a>
        </motion.div>
      )}

      {/* Contact links */}
      <div className="relative z-10 flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
        {availableLinks.map((link, index) => {
          const Icon = link.icon;
          const href = settings[link.key];

          return (
            <motion.a
              key={link.key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group flex items-center gap-3 px-6 py-4 rounded-xl 
                bg-zinc-900/50 border border-zinc-800/50 text-gray-400 
                transition-all duration-300 hover:border-zinc-700/50 hover:bg-zinc-900/80 ${link.color}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-light tracking-wide">{link.label}</span>
              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
            </motion.a>
          );
        })}
      </div>

      {/* Resume Download */}
      {settings?.resume_url && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative z-10 flex justify-center mt-16"
        >
          <a
            href={settings.resume_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-full bg-red-500 hover:bg-red-600 text-white font-light tracking-wide transition-all duration-300 shadow-lg hover:shadow-red-500/20 flex items-center gap-2"
            style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Resume
          </a>
        </motion.div>
      )}

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="relative z-10 mt-24 pt-8 border-t border-zinc-900 text-center"
      >
        <p className="text-gray-600 text-sm font-light" style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)' }}>
          © {new Date().getFullYear()} {settings?.hero_name || 'Denis'}. Crafted with passion.
        </p>
      </motion.div>

      {/* Decorative */}
      <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-red-500/3 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
    </section>
  );
};

export default ContactSection;