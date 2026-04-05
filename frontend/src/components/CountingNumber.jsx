// CountingNumber.jsx
import { useEffect, useState, useMemo } from 'react';
import { Users, Package, Store, BadgeCheck } from 'lucide-react'; // or your icon library

const CountingNumber = ({ value, label, suffix, icon: Icon, color }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 10000; // 10 seconds
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="text-center">
      <div className="flex justify-center mb-2">
        <Icon size={32} color={color} />
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {count}{suffix}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

// Main component that uses CountingNumber
const StatsSection = () => {
  const stats = useMemo(() => [
    { value: 50000, label: "Happy Customers", suffix: "+", icon: Users, color: "#f7644f" },
    { value: 10000, label: "Products", suffix: "+", icon: Package, color: "#1e3a8a" },
    { value: 500, label: "Sellers", suffix: "+", icon: Store, color: "#f7644f" },
    { value: 98, label: "Satisfaction", suffix: "%", icon: BadgeCheck, color: "#1e3a8a" }
  ], []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8">
      {stats.map((stat, index) => (
        <CountingNumber key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsSection;