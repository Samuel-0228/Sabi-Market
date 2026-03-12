import { supabase } from './supabase/client';

const VAPID_PUBLIC_KEY = 'BJ6_v_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o'; // Placeholder

export const notificationService = {
  async registerServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered with scope:', registration.scope);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
    return null;
  },

  async requestPermission() {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async subscribeUser() {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if subscription already exists
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) return existingSubscription;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Save subscription to database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        subscription: JSON.stringify(subscription)
      });
    }

    return subscription;
  },

  urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
};
