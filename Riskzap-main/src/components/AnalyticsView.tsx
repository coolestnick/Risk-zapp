import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Activity, Shield, DollarSign } from 'lucide-react';

const AnalyticsView: React.FC = () => {
  // Mock data for demonstration
  const policyData = [
    { name: 'Device', policies: 342, premium: 1420.5 },
    { name: 'Event', policies: 156, premium: 892.3 },
    { name: 'Travel', policies: 289, premium: 2140.8 },
    { name: 'Equipment', policies: 97, premium: 445.2 }
  ];

  const timelineData = [
    { time: '00:00', claims: 12, policies: 34 },
    { time: '04:00', claims: 8, policies: 45 },
    { time: '08:00', claims: 23, policies: 67 },
    { time: '12:00', claims: 34, policies: 89 },
    { time: '16:00', claims: 28, policies: 76 },
    { time: '20:00', claims: 19, policies: 52 }
  ];

  const riskData = [
    { name: 'Low Risk', value: 45, color: '#4ade80' },
    { name: 'Medium Risk', value: 35, color: '#f59e0b' },
    { name: 'High Risk', value: 20, color: '#ef4444' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gradient-fire mb-4">
          Analytics
        </h1>
        <p className="text-lg text-muted-foreground">
          Real-time insights and performance metrics
        </p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Policies', value: '1,247', icon: Shield, color: 'text-primary' },
          { label: 'Active Claims', value: '89', icon: Activity, color: 'text-warning' },
          { label: 'Premium Volume', value: '8.4K SHM', icon: DollarSign, color: 'text-success' },
          { label: 'Success Rate', value: '94.2%', icon: TrendingUp, color: 'text-success' }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-bold mt-1">{metric.value}</p>
              </div>
              <metric.icon className={`h-8 w-8 ${metric.color} particle-glow`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Policy Types Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-sm"
        >
          <h3 className="text-xl font-bold mb-6 text-gradient-success">Policy Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={policyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="policies" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Risk Assessment Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-sm"
        >
          <h3 className="text-xl font-bold mb-6 text-gradient-success">Risk Assessment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Timeline Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-sm"
      >
        <h3 className="text-xl font-bold mb-6 text-gradient-fire">24-Hour Activity Timeline</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="policies" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="claims" 
              stroke="hsl(var(--warning))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2, r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Real-time Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="p-6 rounded-2xl border border-success/20 bg-card/50 backdrop-blur-sm">
          <h4 className="font-bold text-success mb-4">Network Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Avg Response Time</span>
              <span className="font-mono text-success">2.3s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Success Rate</span>
              <span className="font-mono text-success">99.7%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Gas Usage</span>
              <span className="font-mono text-success">1.2 gwei</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-warning/20 bg-card/50 backdrop-blur-sm">
          <h4 className="font-bold text-warning mb-4">Underwriting AI</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Accuracy Rate</span>
              <span className="font-mono text-warning">96.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Processing Speed</span>
              <span className="font-mono text-warning">0.8s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Risk Models</span>
              <span className="font-mono text-warning">12 Active</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-sm">
          <h4 className="font-bold text-primary mb-4">Smart Contracts</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Total Deployed</span>
              <span className="font-mono text-primary">247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Active Policies</span>
              <span className="font-mono text-primary">1,247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Claims Processed</span>
              <span className="font-mono text-primary">892</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsView;