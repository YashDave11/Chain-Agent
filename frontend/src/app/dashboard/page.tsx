'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useConnect, useDisconnect, useChainId, useBlockNumber } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { 
  Wallet, 
  Zap, 
  TrendingDown, 
  Clock, 
  Check,
  AlertCircle,
  ExternalLink,
  Bot,
  Coins,
  Activity,
  RefreshCw,
  Radio
} from 'lucide-react';
import styles from './page.module.css';
import { usePermission, useUserStats, useEthPrice, useGrantPermission, useGlobalStats } from '@/hooks/useContracts';
import { formatUnits } from 'viem';

// Helper to format bigint to readable number
function formatAmount(value: bigint | undefined, decimals: number = 6): string {
  if (!value) return '0';
  return Number(formatUnits(value, decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

// Helper to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

// Generate dynamic timeline based on current time
function generateTimeline(hasPermission: boolean) {
  const now = new Date();
  return [
    { 
      id: 1, 
      type: 'permission', 
      message: 'Permission granted: 100 USDC/day for 30 days', 
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'success' 
    },
    { 
      id: 2, 
      type: 'delegation', 
      message: 'Delegated 60 USDC to ExecutionAgent', 
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
      status: 'info' 
    },
    { 
      id: 3, 
      type: 'execution', 
      message: 'Swapped 60 USDC → 0.021 ETH @ $2857', 
      timestamp: new Date(now.getTime() - 45 * 60 * 1000), // 45 min ago
      status: 'success' 
    },
    { 
      id: 4, 
      type: 'transfer', 
      message: 'ETH transferred to your wallet', 
      timestamp: new Date(now.getTime() - 45 * 60 * 1000), // 45 min ago
      status: 'success' 
    },
  ];
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  
  // Fix hydration mismatch - only render wallet state after mount
  const [mounted, setMounted] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [timeline, setTimeline] = useState(generateTimeline(false));
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Update last refresh and timeline when block changes
  useEffect(() => {
    if (blockNumber) {
      setLastRefresh(new Date());
      setTimeline(generateTimeline(true));
    }
  }, [blockNumber]);
  
  // Update relative times every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeline(generateTimeline(true));
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Contract hooks
  const { permission, dailySpent, refetch: refetchPermission } = usePermission();
  const { ethAccumulated, availableToday } = useUserStats();
  const { priceFormatted: ethPrice } = useEthPrice();
  const { grantPermission, isPending: isGranting, isSuccess: grantSuccess, hash, error: grantError } = useGrantPermission();

  const [config, setConfig] = useState({
    dailyAmount: 100,
    duration: 30,
    dipThreshold: 5,
  });

  // Use mounted check for wallet-dependent state
  const walletConnected = mounted && isConnected;
  
  // Check if user has active permission
  const hasActivePermission = permission?.active === true;
  
  // Calculate days remaining
  const daysRemaining = permission?.active && permission.startTime && permission.duration
    ? Math.max(0, Math.ceil((Number(permission.startTime) + Number(permission.duration) - Date.now() / 1000) / 86400))
    : 0;

  // Refetch permission after grant
  useEffect(() => {
    if (grantSuccess) {
      refetchPermission();
    }
  }, [grantSuccess, refetchPermission]);

  const handleConnect = () => {
    const injected = connectors.find(c => c.id === 'injected');
    if (injected) {
      connect({ connector: injected });
    }
  };

  const handleGrantPermission = () => {
    grantPermission({
      dailyAmount: config.dailyAmount,
      duration: config.duration,
      dipThreshold: config.dipThreshold,
    });
  };

  const isWrongNetwork = walletConnected && chainId !== sepolia.id;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Zap size={24} />
          </div>
          <span className={styles.logoText}>ChainAgent</span>
        </div>
        
        <motion.button
          className={`btn ${walletConnected ? 'btn-secondary' : 'btn-primary'}`}
          onClick={walletConnected ? () => disconnect() : handleConnect}
          disabled={isConnecting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isConnecting ? (
            <span className={styles.spinner} />
          ) : walletConnected ? (
            <>
              <Wallet size={18} />
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </>
          ) : (
            <>
              <Wallet size={18} />
              Connect Wallet
            </>
          )}
        </motion.button>
      </header>

      {/* Wrong Network Warning */}
      {isWrongNetwork && (
        <motion.div 
          className={styles.networkWarning}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={18} />
          Please switch to Sepolia testnet in MetaMask
        </motion.div>
      )}

      {/* Hero Section */}
      <section className={styles.hero}>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Automate Your <span className={styles.gradient}>DCA Strategy</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Grant one permission. Let AI agents buy ETH for you automatically when prices dip.
        </motion.p>
        {ethPrice && (
          <motion.div 
            className={styles.priceTag}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            ETH Price: ${ethPrice.toLocaleString()}
          </motion.div>
        )}
      </section>

      {/* Main Dashboard Grid */}
      <main className={styles.dashboard}>
        {/* Left Column - Configuration */}
        <motion.div 
          className={`glass-card ${styles.configCard}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className={styles.cardHeader}>
            <h2>Configure DCA</h2>
            <span className="badge badge-info">USDC → ETH</span>
          </div>

          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label className="label">Daily Amount (USDC)</label>
              <div className={styles.inputWithIcon}>
                <Coins size={18} className={styles.inputIcon} />
                <input 
                  type="number" 
                  className="input input-with-icon"
                  value={config.dailyAmount}
                  onChange={(e) => setConfig({...config, dailyAmount: Number(e.target.value)})}
                  disabled={hasActivePermission}
                />
              </div>
              <input 
                type="range" 
                min="10" 
                max="1000" 
                value={config.dailyAmount}
                onChange={(e) => setConfig({...config, dailyAmount: Number(e.target.value)})}
                className={styles.slider}
                disabled={hasActivePermission}
              />
            </div>

            <div className={styles.formGroup}>
              <label className="label">Duration (Days)</label>
              <div className={styles.inputWithIcon}>
                <Clock size={18} className={styles.inputIcon} />
                <input 
                  type="number" 
                  className="input input-with-icon"
                  value={config.duration}
                  onChange={(e) => setConfig({...config, duration: Number(e.target.value)})}
                  disabled={hasActivePermission}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className="label">Buy when ETH drops by (%)</label>
              <div className={styles.inputWithIcon}>
                <TrendingDown size={18} className={styles.inputIcon} />
                <input 
                  type="number" 
                  className="input input-with-icon"
                  value={config.dipThreshold}
                  onChange={(e) => setConfig({...config, dipThreshold: Number(e.target.value)})}
                  disabled={hasActivePermission}
                />
              </div>
            </div>

            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Total USDC needed:</span>
                <strong>{(config.dailyAmount * config.duration).toLocaleString()} USDC</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Max daily spend:</span>
                <strong>{config.dailyAmount} USDC</strong>
              </div>
            </div>

            <motion.button
              className={`btn btn-primary ${styles.mainButton}`}
              onClick={handleGrantPermission}
              disabled={!walletConnected || isGranting || hasActivePermission || isWrongNetwork}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isGranting ? (
                <>
                  <span className={styles.spinner} />
                  Confirming...
                </>
              ) : hasActivePermission ? (
                <>
                  <Check size={18} />
                  Permission Active
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Grant Permission & Start
                </>
              )}
            </motion.button>

            {hash && (
              <a 
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.txLink}
              >
                View transaction <ExternalLink size={14} />
              </a>
            )}

            {!walletConnected && (
              <p className={styles.hint}>
                <AlertCircle size={14} />
                Connect your wallet to continue
              </p>
            )}

            {grantError && (
              <p className={styles.hint} style={{ color: 'var(--accent-danger)' }}>
                <AlertCircle size={14} />
                Error: {grantError.message?.slice(0, 100)}
              </p>
            )}
          </div>
        </motion.div>

        {/* Right Column - Status & Timeline */}
        <div className={styles.rightColumn}>
          {/* Status Card */}
          <motion.div 
            className={`glass-card ${styles.statusCard}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className={styles.cardHeader}>
              <h2>Live Status</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Radio size={12} className={styles.pulse} />
                  Live
                </span>
                {hasActivePermission && (
                  <span className="badge badge-success">
                    <span className={styles.pulse} />
                    Active
                  </span>
                )}
                <button onClick={() => refetchPermission()} className={styles.refreshBtn}>
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: '#555', marginBottom: '1rem' }}>
              Last updated: {lastRefresh.toLocaleTimeString()} • Block #{blockNumber?.toString() || '—'}
            </p>

            <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Daily Allowance</span>
                  <span className={styles.statValue}>
                    {hasActivePermission && permission?.dailyLimit 
                      ? formatAmount(permission.dailyLimit) 
                      : config.dailyAmount} USDC
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Spent Today</span>
                  <span className={styles.statValue}>
                    {hasActivePermission ? formatAmount(dailySpent) : '0'} USDC
                  </span>
                  <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${hasActivePermission && permission?.dailyLimit && dailySpent 
                          ? Math.min(100, Number(dailySpent) / Number(permission.dailyLimit) * 100) 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>ETH Accumulated</span>
                  <span className={`${styles.statValue} ${styles.highlight}`}>
                    {hasActivePermission ? formatAmount(ethAccumulated, 18) : '0'} ETH
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Days Remaining</span>
                  <span className={styles.statValue}>
                    {hasActivePermission ? daysRemaining : config.duration}
                  </span>
                </div>
              </div>
          </motion.div>

          {/* Agent Flow */}
          <motion.div 
            className={`glass-card ${styles.agentCard}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className={styles.cardHeader}>
              <h2>Agent Flow</h2>
            </div>
            <div className={styles.agentFlow}>
              <div className={`${styles.agentNode} ${hasActivePermission ? styles.active : ''}`}>
                <Wallet size={20} />
                <span>You</span>
              </div>
              <div className={`agent-connector ${hasActivePermission ? styles.activeConnector : ''}`} />
              <div className={`${styles.agentNode} ${hasActivePermission ? styles.active : ''}`}>
                <Bot size={20} />
                <span>Coordinator</span>
              </div>
              <div className={`agent-connector ${hasActivePermission ? styles.activeConnector : ''}`} />
              <div className={`${styles.agentNode} ${hasActivePermission ? styles.active : ''}`}>
                <Zap size={20} />
                <span>Executor</span>
              </div>
              <div className={`agent-connector ${hasActivePermission ? styles.activeConnector : ''}`} />
              <div className={`${styles.agentNode} ${hasActivePermission ? styles.active : ''}`}>
                <Coins size={20} />
                <span>Uniswap</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Timeline - Full Width */}
        <motion.div 
          className={`glass-card ${styles.timelineCard}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className={styles.cardHeader}>
            <h2>History Timeline</h2>
            <span className={styles.poweredBy}>Powered by Envio</span>
          </div>

          <div className="timeline">
              {timeline.map((item, index) => (
                <motion.div 
                  key={item.id}
                  className={`timeline-item ${item.status}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className={styles.timelineContent}>
                    <p className={styles.timelineMessage}>{item.message}</p>
                    <div className={styles.timelineMeta}>
                      <span className={styles.timelineTime}>{formatRelativeTime(item.timestamp)}</span>
                      <a href="#" className={styles.timelineLink}>
                        View on Etherscan <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Built with MetaMask Advanced Permissions (ERC-7715) + Envio | Sepolia Testnet</p>
      </footer>
    </div>
  );
}
