'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Zap, 
  Shield, 
  TrendingDown, 
  Clock, 
  ArrowRight,
  ChevronDown,
  Bot,
  Coins,
  Lock
} from 'lucide-react';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <Zap size={28} />
          <span>ChainAgent</span>
        </div>
        <Link href="/dashboard" className={styles.launchBtn}>
          Launch App
          <ArrowRight size={16} />
        </Link>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <motion.div 
          className={styles.heroContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Built for MetaMask AI Hackathon
          </div>
          
          <h1 className={styles.headline}>
            Automate Your
            <br />
            <span className={styles.gradientText}>DCA Strategy</span>
          </h1>
          
          <p className={styles.subheadline}>
            Grant one permission. Let AI agents buy ETH for you 
            automatically when prices dip. No more watching charts.
          </p>
          
          <div className={styles.heroActions}>
            <Link href="/dashboard" className={styles.primaryBtn}>
              Get Started
              <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className={styles.secondaryBtn}>
              Learn More
              <ChevronDown size={18} />
            </a>
          </div>
        </motion.div>

        <motion.div 
          className={styles.heroVisual}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className={styles.visualCard}>
            <div className={styles.visualHeader}>
              <div className={styles.visualDot} />
              <div className={styles.visualDot} />
              <div className={styles.visualDot} />
            </div>
            <div className={styles.visualContent}>
              <div className={styles.agentFlow}>
                <div className={styles.agentItem}>
                  <Shield size={24} />
                  <span>You</span>
                </div>
                <div className={styles.agentArrow}>→</div>
                <div className={styles.agentItem}>
                  <Bot size={24} />
                  <span>Agent</span>
                </div>
                <div className={styles.agentArrow}>→</div>
                <div className={styles.agentItem}>
                  <Coins size={24} />
                  <span>ETH</span>
                </div>
              </div>
              <div className={styles.visualStats}>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Daily Limit</span>
                  <span className={styles.statValue}>100 USDC</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Buy on Dip</span>
                  <span className={styles.statValue}>5%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={styles.section}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtitle}>
            Three simple steps to automated DCA
          </p>
        </motion.div>

        <div className={styles.stepsGrid}>
          <motion.div 
            className={styles.stepCard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className={styles.stepNumber}>01</div>
            <Lock size={32} className={styles.stepIcon} />
            <h3>Grant Permission</h3>
            <p>Set your daily USDC limit and dip threshold. One-time approval via MetaMask.</p>
          </motion.div>

          <motion.div 
            className={styles.stepCard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.stepNumber}>02</div>
            <TrendingDown size={32} className={styles.stepIcon} />
            <h3>Agent Monitors</h3>
            <p>Our CoordinatorAgent watches ETH prices 24/7 and detects dips automatically.</p>
          </motion.div>

          <motion.div 
            className={styles.stepCard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className={styles.stepNumber}>03</div>
            <Coins size={32} className={styles.stepIcon} />
            <h3>Auto Buy ETH</h3>
            <p>ExecutionAgent swaps USDC for ETH when conditions are met. ETH lands in your wallet.</p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className={styles.sectionTitle}>Why ChainAgent?</h2>
        </motion.div>

        <div className={styles.featuresGrid}>
          <motion.div 
            className={styles.featureCard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Shield size={28} />
            <h4>Non-Custodial</h4>
            <p>Your funds stay in your wallet. Agents can only act within your approved limits.</p>
          </motion.div>

          <motion.div 
            className={styles.featureCard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Clock size={28} />
            <h4>Time-Bound</h4>
            <p>Permissions expire automatically. Set 7, 30, or 90 day limits.</p>
          </motion.div>

          <motion.div 
            className={styles.featureCard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Zap size={28} />
            <h4>Instant Execution</h4>
            <p>Buy ETH the moment prices drop. Never miss a dip again.</p>
          </motion.div>

          <motion.div 
            className={styles.featureCard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Bot size={28} />
            <h4>Smart Agents</h4>
            <p>Multi-agent architecture with sub-delegation for maximum flexibility.</p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <motion.div
          className={styles.ctaContent}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2>Ready to automate your DCA?</h2>
          <p>Connect your wallet and set up in under 2 minutes.</p>
          <Link href="/dashboard" className={styles.primaryBtn}>
            Launch App
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <Zap size={20} />
            <span>ChainAgent</span>
          </div>
          <p>Built for MetaMask AI Hackathon 2025</p>
        </div>
      </footer>
    </div>
  );
}
