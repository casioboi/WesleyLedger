import React, { useEffect, useState } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { app } from '../firebase';
import { useAuth } from '../context/useAuth';
import type { UserSubscription } from '../sync/subTypes';
import { LockoutScreen } from '../components/LockoutScreen';

export function RequireSubscription({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!app || !session?.user?.id) {
      if (session?.user?.id) {
        setSubscription({
          userId: session.user.id,
          status: 'halted',
          planType: '1_month',
          startsAt: new Date().toISOString(),
          expiresAt: new Date(0).toISOString(),
          haltReason: 'WesleyLedger could not verify your subscription. Please reconnect and try again.',
          updatedAt: new Date().toISOString(),
        });
      }
      setLoading(false);
      return;
    }

    const db = getFirestore(app);
    const subRef = doc(db, 'subscriptions', session.user.id);

    const unsubscribe = onSnapshot(subRef, (docSnap) => {
      if (docSnap.exists()) {
        setSubscription(docSnap.data() as UserSubscription);
      } else {
        setSubscription({
          userId: session.user.id,
          status: 'halted',
          planType: '1_month',
          startsAt: new Date().toISOString(),
          expiresAt: new Date(0).toISOString(),
          haltReason: 'Your account is awaiting subscription activation. Please contact the developer after payment.',
          updatedAt: new Date().toISOString(),
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching subscription:", error);
      setSubscription({
        userId: session.user.id,
        status: 'halted',
        planType: '1_month',
        startsAt: new Date().toISOString(),
        expiresAt: new Date(0).toISOString(),
        haltReason: 'WesleyLedger could not verify your subscription. Check your connection and try again.',
        updatedAt: new Date().toISOString(),
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [session?.user?.id]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000', color: '#fff' }}>Loading access status...</div>;
  }

  // If there's an explicit subscription record and it's halted or expired
  if (subscription) {
    const isExpired = new Date(subscription.expiresAt).getTime() < Date.now();
    if (subscription.status === 'halted' || subscription.status === 'expired' || isExpired) {
      return <LockoutScreen subscription={subscription} />;
    }
  }

  return <>{children}</>;
}
