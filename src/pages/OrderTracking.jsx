import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ChefHat, Bike, Home, MapPin, Phone, MessageSquare } from 'lucide-react';
import api from '../api/axios';
import './OrderTracking.css';

const OrderTracking = () => {
  const { orderId } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [eta, setEta] = useState(25);
  const [order, setOrder] = useState(null);

  const steps = [
    { id: 1, label: 'Order Placed', icon: <Check size={20} />, time: '12:30 PM' },
    { id: 2, label: 'Preparing', icon: <ChefHat size={20} />, time: '12:35 PM' },
    { id: 3, label: 'Out for Delivery', icon: <Bike size={20} />, time: '12:50 PM' },
    { id: 4, label: 'Delivered', icon: <Home size={20} />, time: '1:05 PM' }
  ];

  useEffect(() => {
    // Fetch actual order details
    const fetchOrderDetails = async () => {
      try {
        if (orderId && orderId !== ':orderId') {
          const res = await api.get(`/orders/${orderId}`);
          const fetchedOrder = res.data;
          setOrder(fetchedOrder);

          // Map status to step ID
          // 1: PLACED/PAID, 2: PREPARING, 3: READY/PICKED_UP, 4: DELIVERED
          const status = fetchedOrder.orderStatus;
          if (status === 'DELIVERED') setCurrentStep(4);
          else if (status === 'READY' || status === 'PICKED_UP') setCurrentStep(3);
          else if (status === 'PREPARING') setCurrentStep(2);
          else setCurrentStep(1);
        }
      } catch (err) {
        console.error("Failed to fetch order details", err);
      }
    };

    fetchOrderDetails();
    const interval = setInterval(fetchOrderDetails, 10000); // Polling every 10 seconds

    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div className="tracking-page">
      <div className="container tracking-container">
        <div className="tracking-header text-center">
          <h1>Track Your Order</h1>
          <p className="order-id">Order ID: #{orderId || 'ORD123456'}</p>
        </div>

        <div className="tracking-content glass-card">
          {/* Map/Status Header */}
          <div className="status-header">
            <div className="eta-circle">
              {currentStep < 4 ? (
                <>
                  <span className="eta-time">{eta}</span>
                  <span className="eta-mins">mins</span>
                </>
              ) : (
                <Check size={40} className="text-primary" />
              )}
            </div>
            <div className="status-text">
              <h2>{steps[currentStep - 1].label}</h2>
              <p>Arriving at 1:05 PM</p>
            </div>
          </div>

          <div className="progress-container">
            <div className="progress-bar-bg">
              <motion.div 
                className="progress-bar-fill"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            <div className="steps-wrapper">
              {steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`step-item ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
                >
                  <div className="step-icon-wrapper">
                    {step.icon}
                  </div>
                  <div className="step-info">
                    <h4>{step.label}</h4>
                    <p>{currentStep >= step.id ? step.time : '--:--'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentStep >= 3 && (
            <motion.div 
              className="delivery-agent-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="agent-profile">
                <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80" alt="Agent" className="agent-img" />
                <div className="agent-details">
                  <h4>Michael D.</h4>
                  <p>Your Delivery Partner</p>
                  <div className="agent-rating">
                    <span className="star">★</span> 4.9 (1k+ deliveries)
                  </div>
                </div>
              </div>
              <div className="agent-actions">
                <button className="action-btn icon-only">
                  <MessageSquare size={20} />
                </button>
                <button className="action-btn icon-only">
                  <Phone size={20} />
                </button>
              </div>
            </motion.div>
          )}

          <div className="delivery-address-card mt-4">
            <MapPin size={24} className="text-muted" />
            <div className="address-info">
              <h4>Delivery Address</h4>
              <p>{order ? order.deliveryAddress : 'Loading address...'}</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
